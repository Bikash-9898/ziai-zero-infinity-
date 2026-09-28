"""Pluggable search service that returns top N search results.

This module supports multiple providers via SEARCH_PROVIDER and respects
provider-specific API keys.
"""
from typing import List, Dict
import os
import httpx
from app.services import tavily_client


async def _google_cse_search(query: str, top_k: int = 10) -> List[Dict]:
    from googleapiclient.discovery import build

    api_key = os.getenv("GOOGLE_CSE_API_KEY")
    cx = os.getenv("GOOGLE_CSE_CX")
    if not api_key or not cx:
        return []

    service = build("customsearch", "v1", developerKey=api_key)
    try:
        response = service.cse().list(q=query, cx=cx, num=min(top_k, 10)).execute()
    except Exception:
        return []

    results = []
    for item in response.get("items", [])[:top_k]:
        link = item.get("link")
        title = item.get("title") or link
        snippet = item.get("snippet") or ""
        if link:
            results.append({"title": title, "url": link, "snippet": snippet})
    return results


async def _bing_search(query: str, top_k: int = 10) -> List[Dict]:
    api_key = os.getenv("BING_SEARCH_API_KEY")
    if not api_key:
        return []

    url = "https://api.bing.microsoft.com/v7.0/search"
    params = {"q": query, "count": top_k, "textDecorations": False, "textFormat": "Raw"}
    headers = {"Ocp-Apim-Subscription-Key": api_key}

    async with httpx.AsyncClient(timeout=20) as client:
        try:
            resp = await client.get(url, params=params, headers=headers)
            resp.raise_for_status()
            data = resp.json()
        except Exception:
            return []

    results = []
    for item in data.get("webPages", {}).get("value", [])[:top_k]:
        results.append({
            "title": item.get("name", ""),
            "url": item.get("url", ""),
            "snippet": item.get("snippet", ""),
        })
    return results


async def _brave_search(query: str, top_k: int = 10) -> List[Dict]:
    api_key = os.getenv("BRAVE_SEARCH_API_KEY")
    if not api_key:
        return []

    url = "https://api.search.brave.com/res/v1/web/search"
    params = {"q": query, "source": "web", "size": top_k}
    headers = {"Authorization": f"Bearer {api_key}", "Accept": "application/json"}

    async with httpx.AsyncClient(timeout=20) as client:
        try:
            resp = await client.get(url, params=params, headers=headers)
            resp.raise_for_status()
            data = resp.json()
        except Exception:
            return []

    results = []
    for item in data.get("data", [])[:top_k]:
        results.append({
            "title": item.get("title", ""),
            "url": item.get("url", ""),
            "snippet": item.get("snippet", ""),
        })
    return results


async def _exa_search(query: str, top_k: int = 10) -> List[Dict]:
    api_key = os.getenv("EXA_AI_API_KEY")
    if not api_key:
        return []

    url = "https://api.exa.ai/v1/search"
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    payload = {"query": query, "top_k": top_k}

    async with httpx.AsyncClient(timeout=20) as client:
        try:
            resp = await client.post(url, json=payload, headers=headers)
            resp.raise_for_status()
            data = resp.json()
        except Exception:
            return []

    results = []
    for item in data.get("results", [])[:top_k]:
        results.append({
            "title": item.get("title", ""),
            "url": item.get("url", ""),
            "snippet": item.get("snippet", ""),
        })
    return results


async def search(query: str, top_k: int = 10, provider: str | None = None) -> List[Dict]:
    provider = (provider or os.getenv("SEARCH_PROVIDER", "tavily")).lower()

    if provider == "google_cse":
        results = await _google_cse_search(query, top_k=top_k)
        if results:
            return results
    elif provider == "bing":
        results = await _bing_search(query, top_k=top_k)
        if results:
            return results
    elif provider == "brave":
        results = await _brave_search(query, top_k=top_k)
        if results:
            return results
    elif provider == "exa":
        results = await _exa_search(query, top_k=top_k)
        if results:
            return results
    elif provider == "serpapi":
        results = await tavily_client._call_serpapi(query, top_k=top_k)
        if results:
            return results
    elif provider == "serper":
        results = await tavily_client._call_serper(query, top_k=top_k)
        if results:
            return results

    # Default to tavily first, then fallback through serpapi/serper.
    results = await tavily_client.search(query, top_k=top_k)
    return results

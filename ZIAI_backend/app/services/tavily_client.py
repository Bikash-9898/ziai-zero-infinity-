"""Async search client with Tavily primary and SerpAPI fallback.

If Tavily fails to return current Google results, the client will try
SerpAPI (engine=google) when `SERPAPI_API_KEY` is set in the environment.

Returns List[dict] with keys: `title`, `url`, `snippet`.
"""
from typing import List
import os
import httpx

TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")
TAVILY_BASE_URL = os.getenv("TAVILY_BASE_URL", "https://api.tavily.com")
SERPAPI_API_KEY = os.getenv("SERPAPI_API_KEY")
SERPER_API_KEY = os.getenv("SERPER_API_KEY")


async def _call_tavily(query: str, top_k: int = 10) -> List[dict]:
    headers = {"Authorization": f"Bearer {TAVILY_API_KEY}"} if TAVILY_API_KEY else {}
    params = {"q": query, "size": top_k}
    url = f"{TAVILY_BASE_URL}/v1/search"

    async with httpx.AsyncClient(timeout=20) as client:
        try:
            resp = await client.get(url, params=params, headers=headers)
            resp.raise_for_status()
            data = resp.json()
        except Exception:
            return []

    results = data.get("results") if isinstance(data, dict) else data
    if not isinstance(results, list):
        return []

    out = []
    for r in results[:top_k]:
        title = r.get("title") or r.get("name") or "Untitled"
        link = r.get("url") or r.get("link") or r.get("href")
        snippet = r.get("snippet") or r.get("summary") or ""
        if link:
            out.append({"title": title, "url": link, "snippet": snippet})
    return out


async def _call_serpapi(query: str, top_k: int = 10) -> List[dict]:
    """Fallback to SerpAPI to get Google organic results when available."""
    if not SERPAPI_API_KEY:
        return []

    url = "https://serpapi.com/search"
    params = {
        "q": query,
        "api_key": SERPAPI_API_KEY,
        "engine": "google",
        "num": top_k,
    }

    async with httpx.AsyncClient(timeout=20) as client:
        try:
            resp = await client.get(url, params=params)
            resp.raise_for_status()
            data = resp.json()
        except Exception:
            return []

    out = []
    for r in data.get("organic_results", [])[:top_k]:
        title = r.get("title") or r.get("position") or "Untitled"
        link = r.get("link") or r.get("formatted_link")
        snippet = r.get("snippet") or r.get("snippet_highlighted_words") or ""
        if link:
            out.append({"title": title, "url": link, "snippet": snippet})
    return out


async def _call_serper(query: str, top_k: int = 10) -> List[dict]:
    """Fallback to Serper.dev (google.serper.dev) when available."""
    if not SERPER_API_KEY:
        return []

    url = "https://google.serper.dev/search"
    headers = {
        "X-API-KEY": SERPER_API_KEY,
        "Content-Type": "application/json",
    }
    payload = {"q": query}

    async with httpx.AsyncClient(timeout=20) as client:
        try:
            resp = await client.post(url, json=payload, headers=headers)
            resp.raise_for_status()
            data = resp.json()
        except Exception:
            return []

    out = []
    # Serper returns 'organic' results list in many responses
    for r in data.get("organic", [])[:top_k]:
        title = r.get("title") or r.get("position") or "Untitled"
        link = r.get("link") or r.get("url")
        snippet = r.get("snippet") or ""
        if link:
            out.append({"title": title, "url": link, "snippet": snippet})
    return out


async def search(query: str, top_k: int = 10) -> List[dict]:
    # Primary: Tavily
    tavily_results = await _call_tavily(query, top_k=top_k)
    if tavily_results:
        return tavily_results

    # Fallback: SerpAPI (Google)
    serp_results = await _call_serpapi(query, top_k=top_k)
    if serp_results:
        return serp_results

    # Final fallback: Serper.dev
    serper_results = await _call_serper(query, top_k=top_k)
    return serper_results


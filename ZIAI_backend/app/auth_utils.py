# app/auth_utils.py
"""
Google auth helper.

The frontend uses useGoogleLogin (implicit flow) which returns an access_token,
NOT an id_token.  We therefore fetch the user's profile from Google's userinfo
endpoint using that access_token — no local JWT verification needed.
"""
import httpx

GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"


def verify_google_token(access_token: str) -> dict:
    """
    Exchange a Google OAuth2 access_token for user info.
    Returns {"success": True, "data": {...}} or {"success": False, "error": "..."}.
    """
    try:
        response = httpx.get(
            GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=10,
        )
        response.raise_for_status()
        info = response.json()

        # Google userinfo v3 field names
        email    = info.get("email")
        name     = info.get("name") or info.get("given_name") or email.split("@")[0]
        verified = info.get("email_verified", False)

        if not email:
            return {"success": False, "error": "No email in Google profile"}
        if not verified:
            return {"success": False, "error": "Google email not verified"}

        return {
            "success": True,
            "data": {
                "email":    email,
                "username": name,
                "picture":  info.get("picture"),
            },
        }

    except httpx.HTTPStatusError as e:
        return {"success": False, "error": f"Google API error: {e.response.status_code}"}
    except Exception as e:
        return {"success": False, "error": str(e)}

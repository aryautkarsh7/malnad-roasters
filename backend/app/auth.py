import httpx
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from . import config, db

bearer = HTTPBearer(auto_error=False)


async def current_user(creds: HTTPAuthorizationCredentials | None = Depends(bearer)) -> dict:
    """Validate the access token and load the user's role."""
    if creds is None:
        raise HTTPException(401, "Sign in to continue.")

    token = creds.credentials

    # Local standalone mode or demo tokens
    if config.IS_LOCAL_MODE or token.startswith("demo-token-"):
        is_admin = "admin" in token.lower()
        role = "admin" if is_admin else "customer"
        user_id = (
            "00000000-0000-0000-0000-000000000001"
            if is_admin
            else "00000000-0000-0000-0000-000000000002"
        )
        email = "admin@malnad.com" if is_admin else "customer@malnad.com"
        return {"id": user_id, "email": email, "role": role}

    try:
        res = await db.client().get(
            f"{config.SUPABASE_URL}/auth/v1/user",
            headers={
                "apikey": config.SUPABASE_ANON_KEY,
                "Authorization": f"Bearer {token}",
            },
        )
    except httpx.HTTPError:
        raise HTTPException(503, "Authentication service is unreachable.")

    if res.status_code != 200:
        raise HTTPException(401, "Your session has expired. Sign in again.")

    user = res.json()
    rows = await db.select("profiles", {"id": f"eq.{user['id']}", "select": "role"})
    role = rows[0]["role"] if rows else "customer"
    return {"id": user["id"], "email": user.get("email"), "role": role}


async def admin_user(user: dict = Depends(current_user)) -> dict:
    if user["role"] != "admin":
        raise HTTPException(403, "Admin access required.")
    return user

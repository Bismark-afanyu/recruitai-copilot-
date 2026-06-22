"""Authentication and authorisation — Firebase Auth with local JWT fallback."""
import logging
from datetime import datetime, timedelta, timezone

import httpx
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.firebase import get_firebase_auth

log = logging.getLogger("recruitai.auth")
bearer_scheme = HTTPBearer(auto_error=False)

ORG_CLAIM = "org_id"
ROLE_CLAIM = "role"


def _admin_email(username: str) -> str:
    return f"{username}@recruitai.local"


def _resolve_login_email(username: str) -> str | None:
    """Look up email by username from the users collection."""
    try:
        from app.repositories.user import resolve_email
        return resolve_email(username)
    except Exception:
        return None


def _local_login(username: str, password: str) -> str:
    """Issue a locally-signed JWT (fallback when Firebase web API key is missing)."""
    from .config import get_settings
    settings = get_settings()

    if username == settings.admin_username and password == settings.admin_password:
        payload = {
            "sub": username,
            "uid": username,
            "email": _admin_email(username),
            ORG_CLAIM: "default",
            ROLE_CLAIM: "admin",
            "exp": datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes),
        }
        return jwt.encode(payload, settings.secret_key, algorithm="HS256")

    user = _resolve_login_email(username)
    if user:
        payload = {
            "sub": username,
            "uid": username,
            "email": user,
            ORG_CLAIM: "default",
            ROLE_CLAIM: "recruiter",
            "exp": datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes),
        }
        return jwt.encode(payload, settings.secret_key, algorithm="HS256")

    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")


def _get_email(username: str) -> str:
    """Get the Firebase email for a username — direct or resolved."""
    if "@" in username:
        return username
    resolved = _resolve_login_email(username)
    if resolved:
        return resolved
    return _admin_email(username)


def _firebase_login(username: str, password: str) -> dict:
    """Authenticate against Firebase Auth via the REST API."""
    from .config import get_settings
    settings = get_settings()
    api_key = settings.firebase_web_api_key or ""
    if not api_key:
        return {"provider": "local"}

    email = _get_email(username)
    resp = httpx.post(
        f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={api_key}",
        json={"email": email, "password": password, "returnSecureToken": True},
        timeout=10,
    )
    if resp.is_success:
        data = resp.json()
        return {
            "provider": "firebase",
            "access_token": data["idToken"],
            "refresh_token": data.get("refreshToken", ""),
            "uid": data["localId"],
            "email": data.get("email", email),
        }
    if resp.status_code == 400:
        err = resp.json().get("error", {}).get("message", "")
        if "INVALID_LOGIN_CREDENTIALS" in err or "USER_NOT_FOUND" in err:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
        if "USER_DISABLED" in err:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account disabled")
    log.warning("Firebase Auth REST API error: %s", resp.text)
    return {"provider": "local"}


def login(username: str, password: str) -> dict:
    """Authenticate — tries Firebase Auth first, falls back to local JWT."""
    result = _firebase_login(username, password)
    if result.get("provider") == "firebase":
        return {
            "access_token": result["access_token"],
            "token_type": "bearer",
            "firebase": True,
        }
    token = _local_login(username, password)
    return {"access_token": token, "token_type": "bearer", "firebase": False}


def register_user(username: str, email: str, password: str, org_name: str = "") -> dict:
    """Create a new user with its own organization in Firestore and Firebase Auth."""
    from app.repositories.organization import create_organization
    from app.repositories.user import create_user as repo_create_user

    fb_auth = get_firebase_auth()
    if fb_auth:
        try:
            fb_auth.get_user_by_email(email)
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
        except HTTPException:
            raise
        except Exception:
            pass

        try:
            fb_auth.get_user_by_phone_number(username)
        except Exception:
            pass

    org_id = create_organization(org_name or f"{username}'s Organization")
    role = "recruiter"

    if fb_auth:
        try:
            user = fb_auth.create_user(
                email=email,
                password=password,
                display_name=username,
            )
            fb_auth.set_custom_user_claims(user.uid, {ORG_CLAIM: org_id, ROLE_CLAIM: role})
            log.info("Created Firebase Auth user: %s (%s)", username, email)
        except Exception as exc:
            log.warning("Could not create Firebase Auth user: %s", exc)

    repo_create_user(username, email, org_id, role)
    log.info("Registered user: %s (org=%s)", username, org_id)

    return {"username": username, "email": email, "org_id": org_id, "role": role}


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> dict:
    """Verify token — Firebase Auth first, then local JWT fallback."""
    from .config import get_settings

    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    fb_auth = get_firebase_auth()
    if fb_auth:
        try:
            decoded = fb_auth.verify_id_token(credentials.credentials)
            return decoded
        except Exception:
            pass  # fall through to local JWT

    try:
        settings = get_settings()
        payload = jwt.decode(credentials.credentials, settings.secret_key, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")


def ensure_admin_user() -> None:
    """Create the admin user in Firebase Auth on startup if it doesn't exist."""
    fb_auth = get_firebase_auth()
    if not fb_auth:
        log.info("Local JWT auth active — admin user always available via ADMIN_USERNAME / ADMIN_PASSWORD.")
        return

    from .config import get_settings
    settings = get_settings()
    email = _admin_email(settings.admin_username)

    try:
        fb_auth.get_user_by_email(email)
        log.info("Admin user exists in Firebase Auth.")
        return
    except Exception:
        pass

    try:
        user = fb_auth.create_user(
            email=email,
            password=settings.admin_password,
            display_name=settings.admin_username,
        )
        fb_auth.set_custom_user_claims(user.uid, {ORG_CLAIM: "default", ROLE_CLAIM: "admin"})
        log.info("Created admin user in Firebase Auth: %s", email)
    except Exception as exc:
        log.warning("Could not create admin user in Firebase Auth: %s", exc)


def require_role(role: str):
    """Dependency factory: require a specific custom claim role."""
    def checker(user: dict = Depends(get_current_user)) -> dict:
        if user.get(ROLE_CLAIM) != role:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        return user
    return checker

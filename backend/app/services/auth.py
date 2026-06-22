"""Auth business logic."""
from fastapi import HTTPException, status

from app.core.security import login as security_login
from app.core.security import register_user as security_register
from app.repositories.user import resolve_email as repo_resolve_email


def login(username: str, password: str) -> dict:
    """Authenticate and return a token pair."""
    return security_login(username, password)


def register(username: str, email: str, password: str, org_name: str = "") -> dict:
    """Create a new user account with its own organization."""
    return security_register(username, email, password, org_name)


def resolve_username(username: str) -> dict:
    """Resolve a username to an email address."""
    email = repo_resolve_email(username)
    if not email:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Username not found")
    return {"username": username, "email": email}


def get_user_info(user: dict) -> dict:
    return {
        "uid": user.get("sub", user.get("uid", "")),
        "email": user.get("email", ""),
        "org_id": user.get("org_id", ""),
        "role": user.get("role", "recruiter"),
    }

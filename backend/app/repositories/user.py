"""User repository — stores username→email mappings in Firestore."""
from .base import _get, _set, _now, _query


def create_user(username: str, email: str, org_id: str, role: str) -> dict:
    now = _now()
    data = {"username": username, "email": email, "org_id": org_id, "role": role, "created_at": now}
    _set("users", username, data)
    return {**data, "id": username}


def get_user(username: str) -> dict | None:
    return _get("users", username)


def resolve_email(username: str) -> str | None:
    user = get_user(username)
    if user:
        return user["email"]
    return None

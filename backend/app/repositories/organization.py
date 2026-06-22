from .base import _get, _set, _next_id


def create_organization(name: str) -> str:
    org_id = _next_id("organizations")
    _set("organizations", org_id, {"name": name, "created_at": _now()})
    return org_id


def get_organization(org_id: str) -> dict | None:
    return _get("organizations", org_id)


def _now():
    from .base import _now as _base_now
    return _base_now()

"""Base repository with generic Firestore CRUD helpers."""
from datetime import datetime, timezone
from typing import Any

from google.cloud.firestore import Query
from fastapi import HTTPException

from app.core.firebase import get_firestore


def db():
    client = get_firestore()
    if client is None:
        raise HTTPException(
            status_code=503,
            detail="Database unavailable. Configure Firebase credentials in .env to use this feature.",
        )
    return client


def _now():
    return datetime.now(timezone.utc).isoformat()


def _serialize(doc: dict) -> dict:
    """Convert Firestore timestamp types to ISO strings for JSON responses."""
    out = {}
    for k, v in doc.items():
        if isinstance(v, datetime):
            out[k] = v.isoformat()
        elif isinstance(v, dict):
            out[k] = _serialize(v)
        elif isinstance(v, list):
            out[k] = [_serialize(i) if isinstance(i, dict) else i for i in v]
        else:
            out[k] = v
    return out


def _get(collection: str, doc_id: str) -> dict | None:
    ref = db().collection(collection).document(doc_id)
    snap = ref.get()
    if not snap.exists:
        return None
    data = snap.to_dict()
    data["id"] = snap.id
    return _serialize(data)


def _set(collection: str, doc_id: str, data: dict) -> None:
    db().collection(collection).document(doc_id).set(data, merge=True)


def _delete(collection: str, doc_id: str) -> None:
    db().collection(collection).document(doc_id).delete()


def _query(
    collection: str,
    filters: list[tuple] | None = None,
    order_by: tuple[str, str] | None = None,
    limit: int | None = None,
    offset: int | None = None,
) -> tuple[list[dict], int]:
    """Return (items, total_count) for a filtered Firestore query."""
    ref: Any = db().collection(collection)
    if filters:
        for field, op, value in filters:
            ref = ref.where(field, op, value)
    count_snap = ref.count().get()
    total = count_snap[0][0].value if count_snap else 0

    if order_by:
        field, direction = order_by
        ref = ref.order_by(field, direction=direction)
    if limit:
        ref = ref.limit(limit)
    if offset:
        ref = ref.offset(offset)

    docs = []
    for snap in ref.stream():
        data = snap.to_dict()
        data["id"] = snap.id
        docs.append(_serialize(data))
    return docs, total


def _next_id(collection: str) -> str:
    return db().collection(collection).document().id

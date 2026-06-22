"""Firebase Admin SDK initialisation."""
import json
import os
from pathlib import Path

import firebase_admin
from firebase_admin import auth, credentials, firestore, storage

from .config import get_settings

_db_instance = None
_auth_instance = None
_bucket_instance = None


def _get_database_id() -> str | None:
    from .config import get_settings
    db_id = get_settings().firebase_database_id
    return db_id or None


def _get_credential():
    settings = get_settings()
    path = settings.firebase_service_account_path or os.environ.get("FIREBASE_SERVICE_ACCOUNT_PATH")
    if path:
        return credentials.Certificate(Path(path))
    raw = settings.firebase_credentials or os.environ.get("FIREBASE_CREDENTIALS")
    if raw:
        return credentials.Certificate(json.loads(raw))
    raise RuntimeError(
        "No Firebase credentials found. Set FIREBASE_SERVICE_ACCOUNT_PATH "
        "or FIREBASE_CREDENTIALS."
    )


def _ensure_initialized():
    if firebase_admin._apps:
        return
    try:
        cred = _get_credential()
        firebase_admin.initialize_app(cred)
    except RuntimeError:
        firebase_admin.initialize_app()
    except ValueError as exc:
        if "already exists" in str(exc):
            return
        raise


_firebase_unavailable = False


def get_firestore() -> firestore.Client | None:
    global _db_instance, _firebase_unavailable
    if _db_instance is None and not _firebase_unavailable:
        try:
            _ensure_initialized()
            _db_instance = firestore.client(database_id=_get_database_id())
        except Exception:
            import logging
            logging.getLogger("recruitai.firebase").warning(
                "Firestore unavailable — some features require Firebase. "
                "Set FIREBASE_CREDENTIALS or FIREBASE_SERVICE_ACCOUNT_PATH."
            )
            _firebase_unavailable = True
            return None
    return _db_instance


def get_firebase_auth():
    global _auth_instance, _firebase_unavailable
    if _auth_instance is None and not _firebase_unavailable:
        try:
            _ensure_initialized()
            _auth_instance = auth
        except Exception:
            import logging
            logging.getLogger("recruitai.firebase").warning(
                "Firebase Auth unavailable — falling back to local JWT auth. "
                "Set FIREBASE_CREDENTIALS or FIREBASE_SERVICE_ACCOUNT_PATH to use Firebase."
            )
            _firebase_unavailable = True
            return None
    return _auth_instance


def get_storage_bucket():
    global _bucket_instance, _firebase_unavailable
    if _bucket_instance is None and not _firebase_unavailable:
        try:
            _ensure_initialized()
            settings = get_settings()
            _bucket_instance = storage.bucket(settings.firebase_storage_bucket)
        except Exception:
            import logging
            logging.getLogger("recruitai.firebase").warning(
                "Firebase Storage unavailable. "
                "Set FIREBASE_CREDENTIALS and FIREBASE_STORAGE_BUCKET."
            )
            _firebase_unavailable = True
            return None
    return _bucket_instance

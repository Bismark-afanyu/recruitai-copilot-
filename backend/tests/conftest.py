"""Shared fixtures for RecruitAI tests.

We patch Firebase Auth and Firestore at the module level so tests can
focus on API behaviour without a real Firebase project.
"""
import uuid

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.repositories import base as repo_base

TEST_ORG_ID = "test-org-123"
TEST_UID = "test-user-123"
FAKE_TOKEN = "fake-firebase-id-token"

# In-memory collections: {collection_name: {doc_id: data_dict}}
_mem: dict[str, dict[str, dict]] = {}


def _reset():
    _mem.clear()


# ---------------------------------------------------------------------------
# Mock the low-level Firestore CRUD helpers used by repositories
# ---------------------------------------------------------------------------
_original_get = repo_base._get
_original_set = repo_base._set
_original_delete = repo_base._delete
_original_query = repo_base._query
_original_next_id = repo_base._next_id


def _mock_get(collection: str, doc_id: str) -> dict | None:
    col = _mem.get(collection, {})
    doc = col.get(doc_id)
    if doc is None:
        return None
    return {**doc, "id": doc_id}


def _mock_set(collection: str, doc_id: str, data: dict) -> None:
    if collection not in _mem:
        _mem[collection] = {}
    existing = _mem[collection].get(doc_id, {})
    existing.update(data)
    _mem[collection][doc_id] = existing


def _mock_delete(collection: str, doc_id: str) -> None:
    col = _mem.get(collection, {})
    col.pop(doc_id, None)


def _mock_query(collection, filters, order_by=None, limit=None, offset=None):
    col = _mem.get(collection, {})
    items = []
    for doc_id, data in col.items():
        entry = {**data, "id": doc_id}
        match = True
        if filters:
            for field, op, value in filters:
                if op == "==" and entry.get(field) != value:
                    match = False
                    break
        if match:
            items.append(entry)

    if order_by:
        field, direction = order_by
        items.sort(key=lambda x: x.get(field, ""), reverse=(direction == "DESCENDING"))
    total = len(items)
    if offset:
        items = items[offset:]
    if limit:
        items = items[:limit]
    return items, total


def _mock_next_id(collection: str) -> str:
    return f"test-{collection}-{uuid.uuid4().hex[:12]}"


def _patch_repo_modules():
    """Apply mock functions to all repository modules that imported from base."""
    import app.repositories.job as job_repo
    import app.repositories.candidate as candidate_repo
    import app.repositories.analysis as analysis_repo
    for mod in (job_repo, candidate_repo, analysis_repo):
        mod._get = _mock_get
        mod._set = _mock_set
        mod._delete = _mock_delete
        mod._query = _mock_query
        mod._next_id = _mock_next_id


def _unpatch_repo_modules():
    import app.repositories.job as job_repo
    import app.repositories.candidate as candidate_repo
    import app.repositories.analysis as analysis_repo
    for mod in (job_repo, candidate_repo, analysis_repo):
        mod._get = _original_get
        mod._set = _original_set
        mod._delete = _original_delete
        mod._query = _original_query
        mod._next_id = _original_next_id


@pytest.fixture(autouse=True)
def _mock_firestore():
    _reset()
    repo_base._get = _mock_get
    repo_base._set = _mock_set
    repo_base._delete = _mock_delete
    repo_base._query = _mock_query
    repo_base._next_id = _mock_next_id
    _patch_repo_modules()
    yield
    _unpatch_repo_modules()
    repo_base._get = _original_get
    repo_base._set = _original_set
    repo_base._delete = _original_delete
    repo_base._query = _original_query
    repo_base._next_id = _original_next_id


@pytest.fixture(autouse=True)
def _mock_firebase_auth(mocker):
    """Mock Firebase Auth so get_current_user always returns a valid user."""
    mocker.patch("firebase_admin.auth.verify_id_token", return_value={
        "uid": TEST_UID,
        "email": "admin@recruitai.local",
        "org_id": TEST_ORG_ID,
        "role": "admin",
    })
    mocker.patch("firebase_admin.auth.get_user_by_email", return_value=mocker.MagicMock())
    mock_store = mocker.MagicMock()
    mock_store.collections.return_value = []
    mocker.patch("app.core.firebase.get_firestore", return_value=mock_store)
    mocker.patch("app.main.get_firestore", return_value=mock_store)
    mocker.patch("app.repositories.base.get_firestore", return_value=mock_store)
    mocker.patch("app.api.health.get_firestore", return_value=mock_store)


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


@pytest.fixture
def auth_headers(client):
    return {"Authorization": f"Bearer {FAKE_TOKEN}"}


@pytest.fixture
def sample_job():
    """Create a job in the in-memory store and return its dict."""
    from app.repositories import job as job_repo
    job_id = job_repo.create_job(
        org_id=TEST_ORG_ID,
        title="Software Engineer",
        raw_description="We need a Python developer with 5 years experience.",
        extracted={
            "job_title": "Software Engineer",
            "required_skills": ["Python", "SQL"],
            "preferred_skills": ["Docker"],
            "years_of_experience": 5,
            "education_requirements": ["Bachelor's in CS"],
            "responsibilities": ["Write code"],
            "soft_skills": ["Communication"],
            "evaluation_criteria": ["Technical skills"],
        },
    )
    return job_repo.get_job(job_id)


@pytest.fixture
def sample_candidate(sample_job):
    """Create a candidate under the sample_job."""
    from app.repositories import candidate as candidate_repo
    cid = candidate_repo.create_candidate(
        org_id=TEST_ORG_ID,
        job_id=sample_job["id"],
        name="Jane Doe",
        email="jane@test.com",
        phone="",
        source_filename="cv.txt",
        raw_cv_text="Jane has Python skills",
        parsed_cv={
            "name": "Jane Doe", "email": "jane@test.com", "phone": "",
            "location": "", "education": [], "work_experience": [],
            "skills": ["Python"], "certifications": [], "projects": [],
            "achievements": [], "languages": [], "career_timeline": [],
        },
    )
    return candidate_repo.get_candidate(cid)

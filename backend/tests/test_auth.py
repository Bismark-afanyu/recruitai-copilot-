"""Tests for authentication: Firebase token verification."""


def test_login_success(client):
    resp = client.post("/api/auth/login", json={"token": "some-id-token"})
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["uid"] == "test-user-123"


def test_login_invalid_token(client, mocker):
    import firebase_admin
    mocker.patch("firebase_admin.auth.verify_id_token", side_effect=firebase_admin.auth.InvalidIdTokenError("bad"))
    resp = client.post("/api/auth/login", json={"token": "bad-token"})
    assert resp.status_code == 401


def test_protected_endpoint_rejects_no_token(client):
    resp = client.get("/api/jobs")
    assert resp.status_code == 401
    assert resp.json()["detail"] == "Not authenticated"


def test_protected_endpoint_rejects_bad_token(client, mocker):
    import firebase_admin
    mocker.patch("firebase_admin.auth.verify_id_token", side_effect=firebase_admin.auth.InvalidIdTokenError("bad"))
    resp = client.get("/api/jobs", headers={"Authorization": "Bearer invalidtoken"})
    assert resp.status_code == 401


def test_protected_endpoint_accepts_valid_token(client, auth_headers):
    resp = client.get("/api/jobs", headers=auth_headers)
    assert resp.status_code == 200


def test_health_requires_no_auth(client):
    resp = client.get("/api/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert "database" in data

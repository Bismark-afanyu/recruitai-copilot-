"""Tests for CRUD endpoints: jobs, candidates, analysis, evaluation, reports."""
import pytest
from app.repositories import analysis as analysis_repo
from tests.conftest import TEST_ORG_ID


def test_create_job(client, auth_headers, mocker):
    mocker.patch("app.ai.service.extract_job", return_value={
        "job_title": "Software Engineer",
        "required_skills": ["Python", "SQL"],
        "preferred_skills": ["Docker"],
        "years_of_experience": 5,
        "education_requirements": ["Bachelor's in CS"],
        "responsibilities": ["Write code"],
        "soft_skills": ["Communication"],
        "evaluation_criteria": ["Technical skills"],
    })
    resp = client.post("/api/jobs", json={"description": "We need a Software Engineer with 5 years Python experience."}, headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["title"] == "Software Engineer"
    assert data["extracted"]["required_skills"] == ["Python", "SQL"]


def test_create_job_rejects_short_description(client, auth_headers):
    resp = client.post("/api/jobs", json={"description": "Too short"}, headers=auth_headers)
    assert resp.status_code == 422


def test_list_jobs_empty(client, auth_headers):
    resp = client.get("/api/jobs", headers=auth_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] == 0
    assert body["items"] == []


def test_list_jobs_pagination(client, auth_headers, mocker):
    mocker.patch("app.ai.service.extract_job", return_value={
        "job_title": "Role", "required_skills": [], "preferred_skills": [],
        "years_of_experience": 0, "education_requirements": [],
        "responsibilities": [], "soft_skills": [], "evaluation_criteria": [],
    })
    for i in range(5):
        client.post("/api/jobs", json={"description": f"Job number {i} with enough text here."}, headers=auth_headers)
    resp = client.get("/api/jobs?skip=0&limit=2", headers=auth_headers)
    body = resp.json()
    assert body["total"] == 5
    assert len(body["items"]) == 2


def test_delete_job(client, auth_headers, mocker):
    mocker.patch("app.ai.service.extract_job", return_value={
        "job_title": "Delete Me", "required_skills": [], "preferred_skills": [],
        "years_of_experience": 0, "education_requirements": [],
        "responsibilities": [], "soft_skills": [], "evaluation_criteria": [],
    })
    create = client.post("/api/jobs", json={"description": f"{'x' * 50}"}, headers=auth_headers)
    job_id = create.json()["id"]
    resp = client.delete(f"/api/jobs/{job_id}", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["deleted"] == job_id


def test_upload_cv_and_list_candidates(client, auth_headers, sample_job, mocker):
    mocker.patch("app.ai.service.extract_cv", return_value={
        "name": "Jane Doe", "email": "jane@test.com", "phone": "",
        "location": "", "education": [], "work_experience": [],
        "skills": ["Testing"], "certifications": [], "projects": [],
        "achievements": [], "languages": [], "career_timeline": [],
    })
    resp = client.post(
        f"/api/jobs/{sample_job['id']}/candidates/upload",
        headers=auth_headers,
        files={"files": ("cv.txt", b"Jane Doe has testing skills")},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert len(body["created"]) == 1
    assert body["created"][0]["name"] == "Jane Doe"

    list_resp = client.get("/api/candidates", headers=auth_headers)
    assert list_resp.status_code == 200
    items = list_resp.json()["items"]
    assert len(items) == 1


def test_analyze_candidate(client, auth_headers, sample_job, sample_candidate, mocker):
    mocker.patch("app.ai.service.score_candidate", return_value={
        "total_score": 85.0, "match_percentage": 85.0,
        "recommendation": "Strong Match",
        "scores": {"required_skills_match": 25, "relevant_experience": 20,
                    "education_certifications": 10, "achievements_projects": 10,
                    "soft_skills_communication": 10, "overall_role_fit": 5},
        "key_strengths": ["Python expert"], "missing_skills": [],
        "risk_factors": [], "summary": {"overview": "Great fit",
            "best_matching_experience": "Python dev",
            "top_strengths": ["Python"], "possible_concerns": [],
            "suggested_next_step": "Interview"},
        "human_review_reminder": "",
    })
    cid = sample_candidate["id"]
    resp = client.post(f"/api/candidates/{cid}/analyze", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["analysis"]["total_score"] == 85.0


def test_submit_evaluation(client, auth_headers, sample_candidate, mocker):
    # Set up analysis and evaluation
    from app import ai
    cid = sample_candidate["id"]
    analysis_repo.set_analysis(cid, TEST_ORG_ID, {
        "total_score": 70.0, "match_percentage": 70.0,
        "recommendation": "Good Match",
        "scores": {k: 10 for k in ["required_skills_match", "relevant_experience",
                    "education_certifications", "achievements_projects",
                    "soft_skills_communication", "overall_role_fit"]},
        "key_strengths": [], "missing_skills": [], "risk_factors": [],
        "summary": {"overview": "", "best_matching_experience": "",
            "top_strengths": [], "possible_concerns": [], "suggested_next_step": ""},
        "human_review_reminder": "",
    })
    mocker.patch("app.ai.service.summarize_interview", return_value="Good candidate.")

    ratings = {cat: 4 for cat in ai.EVALUATION_CATEGORIES}
    resp = client.post(
        f"/api/candidates/{cid}/evaluation",
        json={"ratings": ratings, "interviewer_notes": "Good energy"},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["evaluation"]["score"] == 80.0


def test_dashboard(client, auth_headers, sample_candidate):
    resp = client.get("/api/dashboard", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "candidates" in data
    assert "by_status" in data


def test_task_submit_analysis(client, auth_headers, sample_job, sample_candidate, mocker):
    mocker.patch("app.ai.service.score_candidate", return_value={
        "total_score": 90.0, "match_percentage": 90.0,
        "recommendation": "Strong Match",
        "scores": {k: 15 for k in ["required_skills_match", "relevant_experience",
                    "education_certifications", "achievements_projects",
                    "soft_skills_communication", "overall_role_fit"]},
        "key_strengths": [], "missing_skills": [], "risk_factors": [],
        "summary": {"overview": "", "best_matching_experience": "",
            "top_strengths": [], "possible_concerns": [], "suggested_next_step": ""},
        "human_review_reminder": "",
    })
    cid = sample_candidate["id"]

    submit = client.post(f"/api/tasks/analyze/{cid}", headers=auth_headers)
    assert submit.status_code == 200
    task_id = submit.json()["task_id"]
    assert task_id

    import time
    for _ in range(20):
        poll = client.get(f"/api/tasks/{task_id}", headers=auth_headers)
        assert poll.status_code == 200
        data = poll.json()
        if data["state"] == "done":
            assert data["result"]["analysis"]["total_score"] == 90.0
            return
        time.sleep(0.1)
    pytest.fail("Task did not complete in time")


def test_task_not_found(client, auth_headers):
    resp = client.get("/api/tasks/nonexistent", headers=auth_headers)
    assert resp.status_code == 404

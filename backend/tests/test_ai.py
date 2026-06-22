"""Tests for AI scoring logic independent of the Claude API.

These test the server-side enforcement of category caps, total score
computation, and recommendation mapping — all of which run after the
AI response is received.
"""
from app.ai import service as ai


def test_recommendation_thresholds():
    cases = [
        (85, "Strong Match"),
        (80, "Strong Match"),
        (79, "Good Match"),
        (65, "Good Match"),
        (64, "Average Match"),
        (50, "Average Match"),
        (49, "Weak Match"),
        (0, "Weak Match"),
    ]
    for score, expected in cases:
        assert ai._recommendation_for(score) == expected, f"Failed at {score}"


def test_score_caps_enforced(mocker):
    mocker.patch("app.ai.service._json_request", return_value={
        "scores": {
            "required_skills_match": 100,   # cap at 30
            "relevant_experience": 100,      # cap at 25
            "education_certifications": 100, # cap at 15
            "achievements_projects": 100,    # cap at 15
            "soft_skills_communication": 100,# cap at 10
            "overall_role_fit": 100,         # cap at 5
        },
        "match_percentage": 100,
        "key_strengths": [],
        "missing_skills": [],
        "risk_factors": [],
        "recommendation": "Strong Match",
        "summary": {"overview": "", "best_matching_experience": "",
            "top_strengths": [], "possible_concerns": [],
            "suggested_next_step": ""},
    })
    result = ai.score_candidate({"title": "test"}, {"name": "test"})
    scores = result["scores"]
    assert scores["required_skills_match"] == 30
    assert scores["relevant_experience"] == 25
    assert scores["education_certifications"] == 15
    assert scores["achievements_projects"] == 15
    assert scores["soft_skills_communication"] == 10
    assert scores["overall_role_fit"] == 5
    assert result["total_score"] == 100.0


def test_score_caps_zero_values(mocker):
    mocker.patch("app.ai.service._json_request", return_value={
        "scores": {
            "required_skills_match": -10,  # floor at 0
            "relevant_experience": -5,
            "education_certifications": 0,
            "achievements_projects": 0,
            "soft_skills_communication": 0,
            "overall_role_fit": 0,
        },
        "match_percentage": 0,
        "key_strengths": [],
        "missing_skills": [],
        "risk_factors": [],
        "recommendation": "Weak Match",
        "summary": {"overview": "", "best_matching_experience": "",
            "top_strengths": [], "possible_concerns": [],
            "suggested_next_step": ""},
    })
    result = ai.score_candidate({"title": "test"}, {"name": "test"})
    for key in ai.SCORE_CAPS:
        assert result["scores"][key] >= 0, f"{key} went negative"


def test_score_caps_partial_values(mocker):
    mocker.patch("app.ai.service._json_request", return_value={
        "scores": {
            "required_skills_match": 20,
            "relevant_experience": 15,
            "education_certifications": 10,
            "achievements_projects": 10,
            "soft_skills_communication": 7,
            "overall_role_fit": 4,
        },
        "match_percentage": 66,
        "key_strengths": [],
        "missing_skills": [],
        "risk_factors": [],
        "recommendation": "Good Match",
        "summary": {"overview": "", "best_matching_experience": "",
            "top_strengths": [], "possible_concerns": [],
            "suggested_next_step": ""},
    })
    result = ai.score_candidate({"title": "test"}, {"name": "test"})
    assert result["total_score"] == 66.0
    assert result["recommendation"] == "Good Match"


def test_interview_score_computation():
    ratings = {cat: 4 for cat in ai.EVALUATION_CATEGORIES}
    score = ai.compute_interview_score(ratings)
    assert score == 80.0

    ratings = {cat: 1 for cat in ai.EVALUATION_CATEGORIES}
    score = ai.compute_interview_score(ratings)
    assert score == 20.0

    ratings = {cat: 5 for cat in ai.EVALUATION_CATEGORIES}
    score = ai.compute_interview_score(ratings)
    assert score == 100.0


def test_interview_score_clamps_out_of_range():
    ratings = {cat: 10 for cat in ai.EVALUATION_CATEGORIES}  # above 5
    score = ai.compute_interview_score(ratings)
    assert score == 100.0

    ratings = {cat: 0 for cat in ai.EVALUATION_CATEGORIES}  # below 1
    score = ai.compute_interview_score(ratings)
    assert score == 20.0  # clamped to 1 minimum


def test_human_review_reminder_in_results(mocker):
    mocker.patch("app.ai.service._json_request", return_value={
        "scores": {k: 0 for k in ai.SCORE_CAPS},
        "match_percentage": 0,
        "key_strengths": [],
        "missing_skills": [],
        "risk_factors": [],
        "recommendation": "Weak Match",
        "summary": {"overview": "", "best_matching_experience": "",
            "top_strengths": [], "possible_concerns": [],
            "suggested_next_step": ""},
    })
    result = ai.score_candidate({"title": "test"}, {"name": "test"})
    assert "human_review_reminder" in result
    assert "human" in result["human_review_reminder"].lower()

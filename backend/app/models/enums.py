from enum import Enum


CANDIDATE_STATUSES = [
    "New",
    "Shortlisted",
    "Interview Scheduled",
    "Interviewed",
    "Recommended",
    "Rejected",
    "Hired",
]


class Recommendation(str, Enum):
    strong_match = "Strong Match"
    good_match = "Good Match"
    average_match = "Average Match"
    weak_match = "Weak Match"

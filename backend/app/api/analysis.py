"""Analysis, evaluation, and report endpoints."""
from fastapi import APIRouter, Depends, HTTPException, Response

from app.api.deps import get_current_user
from app.schemas.analysis import EvaluationRequest, ReportUpdateRequest
from app.services import analysis as analysis_service

router = APIRouter(prefix="/api/candidates", tags=["analysis"], dependencies=[Depends(get_current_user)])


@router.post("/{candidate_id}/analyze")
def analyze(candidate_id: str, user: dict = Depends(get_current_user)):
    return analysis_service.analyze(candidate_id, user)


@router.post("/{candidate_id}/questions")
def generate_questions(candidate_id: str, user: dict = Depends(get_current_user)):
    return analysis_service.generate_questions(candidate_id, user)


@router.post("/{candidate_id}/evaluation")
def submit_evaluation(candidate_id: str, body: EvaluationRequest, user: dict = Depends(get_current_user)):
    return analysis_service.submit_evaluation(candidate_id, body.ratings, body.interviewer_notes, user)


@router.post("/{candidate_id}/report")
def generate_report(candidate_id: str, user: dict = Depends(get_current_user)):
    return analysis_service.generate_report(candidate_id, user)


@router.patch("/{candidate_id}/report")
def update_report(candidate_id: str, body: ReportUpdateRequest, user: dict = Depends(get_current_user)):
    return analysis_service.update_report(candidate_id, body.salary_range, body.hr_notes, user)


@router.get("/{candidate_id}/report/pdf")
def export_report_pdf(candidate_id: str, user: dict = Depends(get_current_user)):
    pdf, safe_name = analysis_service.export_report_pdf(candidate_id, user)
    return Response(
        content=pdf,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="report_{safe_name}.pdf"'},
    )

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from typing import Optional, Any
import logging

from ..database import get_db
from ..models import ResumeAnalysis, User
from ..schemas import ResumeAnalysisResponse
from ..auth import get_current_user
from ..services.resume_analyzer import ResumeAnalyzer
from ..services.ai_service import AIServiceError

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/resume", tags=["resume"])


def _normalize_raw_analysis(raw_analysis: Any) -> dict[str, Any]:
    if isinstance(raw_analysis, dict):
        return raw_analysis
    return {}


def _safe_list(value: Any) -> list[Any]:
    if isinstance(value, list):
        return value
    return []


def _safe_dict(value: Any) -> dict[str, Any] | None:
    if isinstance(value, dict):
        return value
    return None


def _safe_number(value: Any, target_type: type = float, default=None):
    if isinstance(value, (int, float)):
        return target_type(value)
    if isinstance(value, str):
        try:
            return target_type(float(value))
        except ValueError:
            return default
    return default


def _safe_metric_detail(value: Any) -> dict[str, Any] | None:
    data = _safe_dict(value)
    if not data:
        return None
    return {
        "overall_score": _safe_number(data.get("overall_score"), float),
        "strengths": _safe_list(data.get("strengths")),
        "weaknesses": _safe_list(data.get("weaknesses")),
        "mistakes": _safe_list(data.get("mistakes")),
        "suggestions": _safe_list(data.get("suggestions")),
        "best_answer": data.get("best_answer", ""),
        "better_answer": data.get("better_answer"),
        "interview_tip": data.get("interview_tip", ""),
        "next_step": data.get("next_step", ""),
        "communication_score": _safe_number(data.get("communication_score"), float),
        "confidence_score": _safe_number(data.get("confidence_score"), float),
        "professionalism_score": _safe_number(data.get("professionalism_score"), float),
        "grammar_score": _safe_number(data.get("grammar_score"), float),
    }


def _safe_report_metric_detail(value: Any) -> dict[str, Any] | None:
    data = _safe_dict(value)
    if not data:
        return None
    return {
        "value": _safe_number(data.get("value"), float),
        "reason": data.get("reason", ""),
        "explanation": data.get("explanation", ""),
        "strength": data.get("strength", ""),
        "weakness": data.get("weakness", ""),
    }


def _create_resume_payload(analysis: ResumeAnalysis) -> dict[str, Any]:
    raw_analysis = _normalize_raw_analysis(analysis.raw_analysis_result)
    jd_compatibility = _safe_dict(raw_analysis.get("jd_compatibility"))
    if jd_compatibility is not None:
        jd_compatibility = {
            "job_match_score": _safe_number(jd_compatibility.get("job_match_score"), float),
            "matching_skills": _safe_list(jd_compatibility.get("matching_skills")),
            "matching_technologies": _safe_list(jd_compatibility.get("matching_technologies")),
            "matching_projects": _safe_list(jd_compatibility.get("matching_projects")),
            "missing_skills": _safe_list(jd_compatibility.get("missing_skills")),
            "missing_keywords": _safe_list(jd_compatibility.get("missing_keywords")),
            "missing_certifications": _safe_list(jd_compatibility.get("missing_certifications")),
            "suggested_improvements": _safe_list(jd_compatibility.get("suggested_improvements")),
            "final_recommendation": jd_compatibility.get("final_recommendation", ""),
            "explanation": jd_compatibility.get("explanation", ""),
            "overall_match_label": jd_compatibility.get("overall_match_label", "Medium Match"),
            "recruiter_verdict": jd_compatibility.get("recruiter_verdict", ""),
            "expected_salary_fit": jd_compatibility.get("expected_salary_fit", ""),
        }

    professional_analysis_report = _safe_dict(raw_analysis.get("professional_analysis_report"))
    if professional_analysis_report is not None:
        professional_analysis_report = {
            "overall_ats_score": _safe_report_metric_detail(professional_analysis_report.get("overall_ats_score")),
            "jd_match_percentage": _safe_report_metric_detail(professional_analysis_report.get("jd_match_percentage")),
            "recruiter_confidence": _safe_report_metric_detail(professional_analysis_report.get("recruiter_confidence")),
            "interview_readiness": _safe_report_metric_detail(professional_analysis_report.get("interview_readiness")),
            "hiring_probability": _safe_report_metric_detail(professional_analysis_report.get("hiring_probability")),
        }

    jd_match_report = _safe_dict(raw_analysis.get("jd_match_report"))
    if jd_match_report is not None:
        jd_match_report = {
            "overall_match_percentage": _safe_number(jd_match_report.get("overall_match_percentage"), float),
            "matched_skills": _safe_list(jd_match_report.get("matched_skills")),
            "matched_technologies": _safe_list(jd_match_report.get("matched_technologies")),
            "missing_skills": _safe_list(jd_match_report.get("missing_skills")),
            "missing_technologies": _safe_list(jd_match_report.get("missing_technologies")),
            "missing_keywords": _safe_list(jd_match_report.get("missing_keywords")),
            "critical_improvements": _safe_list(jd_match_report.get("critical_improvements")),
            "must_have_skills": _safe_list(jd_match_report.get("must_have_skills")),
            "nice_to_have_skills": _safe_list(jd_match_report.get("nice_to_have_skills")),
            "recruiter_verdict": jd_match_report.get("recruiter_verdict", ""),
        }

    return {
        "id": analysis.id,
        "filename": analysis.filename,
        "uploaded_at": analysis.uploaded_at,
        "version": analysis.version,
        "job_description": analysis.job_description,
        "profile_summary": raw_analysis.get("profile_summary", ""),
        "ats_score": _safe_number(raw_analysis.get("ats_score"), int, 0),
        "interview_readiness": _safe_number(raw_analysis.get("interview_readiness"), int, 0),
        "strengths": _safe_list(raw_analysis.get("strengths")),
        "weaknesses": _safe_list(raw_analysis.get("weaknesses")),
        "missing_skills": _safe_list(raw_analysis.get("missing_skills")),
        "projects_to_add": _safe_list(raw_analysis.get("projects_to_add")),
        "certifications": _safe_list(raw_analysis.get("certifications")),
        "technical_feedback": _safe_list(raw_analysis.get("technical_feedback")),
        "soft_skill_feedback": _safe_list(raw_analysis.get("soft_skill_feedback")),
        "keyword_analysis": _safe_list(raw_analysis.get("keyword_analysis")),
        "recruiter_impression": raw_analysis.get("recruiter_impression", ""),
        "improvement_plan": _safe_list(raw_analysis.get("improvement_plan")),
        "applicable_jobs": _safe_list(raw_analysis.get("applicable_jobs")),
        "resume_brief_description": raw_analysis.get("resume_brief_description", ""),
        "jd_match_status": raw_analysis.get("jd_match_status", ""),
        "recommended_career_paths": _safe_list(raw_analysis.get("recommended_career_paths")),
        "recruiter_resume_summary": raw_analysis.get("recruiter_resume_summary", ""),
        "jd_compatibility": jd_compatibility,
        "ai_recruiter_feedback": _safe_dict(raw_analysis.get("ai_recruiter_feedback")),
        "top_companies": _safe_list(raw_analysis.get("top_companies")),
        "salary_prediction": _safe_dict(raw_analysis.get("salary_prediction")),
        "interview_readiness_breakdown": _safe_dict(raw_analysis.get("interview_readiness_breakdown")),
        "career_roadmap": _safe_list(raw_analysis.get("career_roadmap")),
        "career_level_detection": _safe_dict(raw_analysis.get("career_level_detection")),
        "company_match_recommendations": _safe_dict(raw_analysis.get("company_match_recommendations")),
        "recruiter_verdict_model": _safe_dict(raw_analysis.get("recruiter_verdict_model")),
        "professional_analysis_report": professional_analysis_report,
        "jd_match_report": jd_match_report,
        "resume_insights": _safe_dict(raw_analysis.get("resume_insights")),
        "recruiter_decision": _safe_dict(raw_analysis.get("recruiter_decision")),
    }


@router.post("/analyze", response_model=ResumeAnalysisResponse)
async def upload_and_analyze_resume(
    file: UploadFile = File(...),
    job_description: Optional[str] = Form(None),
    jd_file: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify and extract job description
    job_description_text = ""
    if jd_file and jd_file.filename:
        if not jd_file.filename.lower().endswith(".pdf"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only PDF files are supported for Job Description uploads."
            )
        jd_bytes = await jd_file.read()
        if not jd_bytes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded Job Description PDF file is empty."
            )
        from ..services.resume_parser import ResumeParser
        extracted_jd = ResumeParser.extract_text(jd_bytes)
        job_description_text = ResumeParser.clean_text(extracted_jd)
    else:
        job_description_text = job_description

    if not job_description_text or not job_description_text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Job Description is required."
        )

    # Verify file is a PDF
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are supported."
        )
    
    # Read file bytes
    pdf_bytes = await file.read()
    if not pdf_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty."
        )
    
    # Calculate version number based on previous uploads
    prev_uploads_count = (
        db.query(ResumeAnalysis)
        .filter(ResumeAnalysis.user_id == current_user.id)
        .count()
    )
    new_version = prev_uploads_count + 1
    
    # Call RAG Resume Analyzer service
    try:
        analysis_data = ResumeAnalyzer.analyze(pdf_bytes, file.filename, job_description_text)
    except AIServiceError as e:
        logger.error("Resume analysis failed: %s", e.message)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Resume analysis is temporarily unavailable. Please try again later."
        )
    except ValueError as exc:
        logger.error("Resume analysis validation failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc)
        )
    except Exception:
        logger.exception("Unexpected resume analysis failure.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Resume analysis failed. Please try again later."
        )
    
    db_analysis = ResumeAnalysis(
        user_id=current_user.id,
        filename=file.filename,
        raw_analysis_result=analysis_data,
        version=new_version,
        job_description=job_description_text,
        ats_score=int(analysis_data.get("ats_score", 0)),
        interview_readiness=int(analysis_data.get("interview_readiness", 0))
    )
    
    db.add(db_analysis)
    db.commit()
    db.refresh(db_analysis)
    
    return _create_resume_payload(db_analysis)

@router.get("/history", response_model=list[ResumeAnalysisResponse])
def get_resume_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    resumes = (
        db.query(ResumeAnalysis)
        .filter(ResumeAnalysis.user_id == current_user.id)
        .order_by(ResumeAnalysis.version.desc())
        .all()
    )
    
    result = []
    for r in resumes:
        result.append(_create_resume_payload(r))
    return result

@router.get("/{analysis_id}", response_model=ResumeAnalysisResponse)
def get_resume_analysis(
    analysis_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    r = (
        db.query(ResumeAnalysis)
        .filter(ResumeAnalysis.id == analysis_id, ResumeAnalysis.user_id == current_user.id)
        .first()
    )
    if not r:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume analysis not found."
        )
    
    return _create_resume_payload(r)

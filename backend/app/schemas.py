from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Any
from datetime import datetime

# --- Auth Schemas ---
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    confirm_password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class GoogleLoginRequest(BaseModel):
    token: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: str

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# --- Interview Schemas ---
class TechnicalStartRequest(BaseModel):
    topic: str  # Python, Java, JavaScript, React, FastAPI, SQL
    count: Optional[int] = 5

class TechnicalSubmitRequest(BaseModel):
    topic: str
    question: str
    user_answer: str

class HRStartRequest(BaseModel):
    topic: str  # "Tell me about yourself", "Why should we hire you?", "Strengths?", "Weaknesses?", "Career Goals?"
    count: Optional[int] = 5

class HRSubmitRequest(BaseModel):
    topic: str
    question: str
    user_answer: str

# Unified AI Evaluation Schema
class EvaluationDetail(BaseModel):
    overall_score: float
    strengths: list[str]
    weaknesses: list[str]
    mistakes: list[str]
    suggestions: list[str]
    best_answer: str
    better_answer: Optional[str] = None
    interview_tip: str
    next_step: str
    # HR-specific fields (optional)
    communication_score: Optional[float] = None
    confidence_score: Optional[float] = None
    professionalism_score: Optional[float] = None
    grammar_score: Optional[float] = None

class BatchAnswerItem(BaseModel):
    question: str
    user_answer: str

class TechnicalBatchSubmitRequest(BaseModel):
    topic: str
    answers: list[BatchAnswerItem]

class HRBatchSubmitRequest(BaseModel):
    topic: str
    answers: list[BatchAnswerItem]

class BatchEvaluationResponse(BaseModel):
    overall_score: float
    general_feedback: str
    evaluations: list[EvaluationDetail]

class InterviewHistoryResponse(BaseModel):
    id: int
    interview_type: str
    topic: str
    question: str
    user_answer: str
    score: float
    date: datetime
    evaluation: EvaluationDetail

    class Config:
        from_attributes = True

# --- Resume Schemas ---
class CareerPathModel(BaseModel):
    role_name: str
    match_percentage: int
    expected_salary: str
    why_suitable: str
    missing_skills: list[str]
    learning_difficulty: str

class JdCompatibilityModel(BaseModel):
    job_match_score: Optional[float] = None
    matching_skills: list[str] = Field(default_factory=list)
    matching_technologies: list[str] = Field(default_factory=list)
    matching_projects: list[str] = Field(default_factory=list)
    missing_skills: list[str] = Field(default_factory=list)
    missing_keywords: list[str] = Field(default_factory=list)
    missing_certifications: list[str] = Field(default_factory=list)
    suggested_improvements: list[str] = Field(default_factory=list)
    final_recommendation: Optional[str] = Field(default="")
    explanation: Optional[str] = Field(default="")
    overall_match_label: Optional[str] = Field(default="Medium Match")
    recruiter_verdict: Optional[str] = Field(default="")
    expected_salary_fit: Optional[str] = Field(default="")

class RecruiterFeedbackModel(BaseModel):
    impressed_by: Optional[str] = Field(default="")
    biggest_weaknesses: Optional[str] = Field(default="")
    what_should_be_improved: Optional[str] = Field(default="")
    shortlist_decision: Optional[str] = Field(default="")
    shortlist_confidence: Optional[int] = None

class CompanyRecommendationModel(BaseModel):
    company_name: Optional[str] = Field(default="")
    why_profile_fits: Optional[str] = Field(default="")
    recommended_role: Optional[str] = Field(default="")
    preparation_level: Optional[str] = Field(default="")

class SalaryPredictionModel(BaseModel):
    country: Optional[str] = Field(default="")
    currency: Optional[str] = Field(default="")
    entry_level_salary: Optional[int] = None
    average_salary: Optional[int] = None
    best_case_salary: Optional[int] = None
    justification: Optional[str] = Field(default="")

class ReadinessBreakdownModel(BaseModel):
    technical_readiness: Optional[int] = None
    communication_readiness: Optional[int] = None
    problem_solving: Optional[int] = None
    resume_quality: Optional[int] = None
    project_strength: Optional[int] = None
    overall_hiring_probability: Optional[int] = None

class RoadmapPhaseModel(BaseModel):
    phase: Optional[str] = Field(default="")  # 30 Day Plan, 60 Day Plan, 90 Day Plan
    skills: list[str] = Field(default_factory=list)
    projects: list[str] = Field(default_factory=list)
    courses: list[str] = Field(default_factory=list)
    interview_preparation: list[str] = Field(default_factory=list)

class CareerLevelModel(BaseModel):
    detected_level: Optional[str] = Field(default="")
    confidence_percentage: Optional[int] = None

class CompanyMatchModel(BaseModel):
    recommended_types: list[str] = Field(default_factory=list)
    top_hiring_companies: list[str] = Field(default_factory=list)

class RecruiterVerdictModel(BaseModel):
    star_rating: Optional[int] = None
    rating_label: Optional[str] = Field(default="")
    explanation: Optional[str] = Field(default="")

# New models for V1.0 step 3 and step 4 reports
class MetricDetailModel(BaseModel):
    value: Optional[float] = None
    reason: Optional[str] = Field(default="")
    explanation: Optional[str] = Field(default="")
    strength: Optional[str] = Field(default="")
    weakness: Optional[str] = Field(default="")

class ProfessionalAnalysisReportModel(BaseModel):
    overall_ats_score: Optional[MetricDetailModel] = None
    jd_match_percentage: Optional[MetricDetailModel] = None
    recruiter_confidence: Optional[MetricDetailModel] = None
    interview_readiness: Optional[MetricDetailModel] = None
    hiring_probability: Optional[MetricDetailModel] = None

class JdMatchReportModel(BaseModel):
    overall_match_percentage: Optional[float] = None
    matched_skills: list[str] = Field(default_factory=list)
    matched_technologies: list[str] = Field(default_factory=list)
    missing_skills: list[str] = Field(default_factory=list)
    missing_technologies: list[str] = Field(default_factory=list)
    missing_keywords: list[str] = Field(default_factory=list)
    critical_improvements: list[str] = Field(default_factory=list)
    must_have_skills: list[str] = Field(default_factory=list)
    nice_to_have_skills: list[str] = Field(default_factory=list)
    recruiter_verdict: Optional[str] = Field(default="")

class ResumeInsightsModel(BaseModel):
    strongest_section: Optional[str] = Field(default="")
    weakest_section: Optional[str] = Field(default="")
    best_project: Optional[str] = Field(default="")
    missing_certifications: list[str] = Field(default_factory=list)
    missing_projects: list[str] = Field(default_factory=list)
    resume_writing_quality: Optional[str] = Field(default="")
    formatting_score: Optional[int] = None
    grammar_score: Optional[int] = None
    technical_depth: Optional[str] = Field(default="")

class RecruiterDecisionModel(BaseModel):
    decision_status: Optional[str] = Field(default="")  # Reject, Needs Improvement, Shortlist, Interview Recommended, Strong Hire
    reason: Optional[str] = Field(default="")
    next_steps: list[str] = Field(default_factory=list)

class ResumeAnalysisResponse(BaseModel):
    id: int
    filename: str
    uploaded_at: datetime
    profile_summary: str
    ats_score: int
    interview_readiness: int
    strengths: list[str]
    weaknesses: list[str]
    missing_skills: list[str]
    projects_to_add: list[str]
    certifications: list[str]
    technical_feedback: list[str]
    soft_skill_feedback: list[str]
    keyword_analysis: list[str]
    recruiter_impression: str
    improvement_plan: list[str]
    version: int
    job_description: Optional[str] = None
    applicable_jobs: Optional[list[str]] = Field(default=[])
    resume_brief_description: Optional[str] = Field(default="")
    jd_match_status: Optional[str] = Field(default="")
    
    # Career Intelligence Engine fields
    recommended_career_paths: Optional[list[CareerPathModel]] = Field(default=[])
    recruiter_resume_summary: Optional[str] = Field(default="")
    jd_compatibility: Optional[JdCompatibilityModel] = None
    ai_recruiter_feedback: Optional[RecruiterFeedbackModel] = None
    top_companies: Optional[list[CompanyRecommendationModel]] = Field(default=[])
    salary_prediction: Optional[SalaryPredictionModel] = None
    interview_readiness_breakdown: Optional[ReadinessBreakdownModel] = None
    career_roadmap: Optional[list[RoadmapPhaseModel]] = Field(default=[])
    
    # New AI Career Match Engine sub-fields
    career_level_detection: Optional[CareerLevelModel] = None
    company_match_recommendations: Optional[CompanyMatchModel] = None
    recruiter_verdict_model: Optional[RecruiterVerdictModel] = None
    professional_analysis_report: Optional[ProfessionalAnalysisReportModel] = None
    jd_match_report: Optional[JdMatchReportModel] = None
    resume_insights: Optional[ResumeInsightsModel] = None
    recruiter_decision: Optional[RecruiterDecisionModel] = None

    class Config:
        from_attributes = True

# --- Dashboard Stats Schemas ---
class RecentActivity(BaseModel):
    date: str
    score: float
    type: str

class StatsResponse(BaseModel):
    total_interviews: int
    average_score: float
    latest_interview: Optional[dict[str, Any]] = None
    recent_activity: list[RecentActivity]

# --- Resume Interview Schemas ---
class ResumeInterviewStartRequest(BaseModel):
    resume_analysis_id: Optional[int] = None
    job_description: Optional[str] = None

class ResumeInterviewQuestionPayload(BaseModel):
    question: str
    difficulty: str
    topic: str
    reference: str
    why_selected: str
    estimated_time: int

class ResumeInterviewSessionResponse(BaseModel):
    id: int
    session_id: Optional[int] = None
    current_question_index: int
    total_questions: int
    questions: list[ResumeInterviewQuestionPayload]
    is_completed: bool
    report: Optional[dict[str, Any]] = None

class ResumeInterviewAnswerRequest(BaseModel):
    answer: str
    question_index: Optional[int] = None

class ResumeInterviewAnswerResponse(BaseModel):
    success: bool
    current_question_index: int
    next_question: Optional[dict[str, Any]] = None
    is_completed: bool

class ResumeAnalysisHistoryItem(BaseModel):
    id: int
    filename: str
    version: int
    uploaded_at: datetime
    ats_score: int
    interview_readiness: int
    job_description: Optional[str] = None

    class Config:
        from_attributes = True

class ResumeInterviewHistoryItem(BaseModel):
    id: int
    date: str
    ats_score: float
    filename: str
    overall_readiness: float
    technical_score: float
    communication_score: float
    problem_solving_score: float

    class Config:
        from_attributes = True

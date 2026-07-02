import logging
from typing import Any, Optional
from .ai_service import AIService

logger = logging.getLogger(__name__)

class QuestionGenerator:
    @classmethod
    def _build_metadata_text(cls, analysis_data: Optional[dict[str, Any]]) -> str:
        if not analysis_data:
            return ""

        sections = []

        profile_summary = analysis_data.get("profile_summary") or analysis_data.get("resume_brief_description")
        if profile_summary:
            sections.append(f"Resume Summary: {profile_summary}")

        skills = analysis_data.get("skills_matched") or []
        if skills:
            sections.append(f"Resume Skills: {', '.join(skills)}")

        projects = analysis_data.get("projects") or analysis_data.get("projects_to_add") or []
        if projects:
            sections.append(f"Resume Projects: {', '.join(projects)}")

        certifications = analysis_data.get("certifications") or []
        if certifications:
            sections.append(f"Resume Certifications: {', '.join(certifications)}")

        strengths = analysis_data.get("strengths") or []
        if strengths:
            sections.append(f"Resume Strengths: {', '.join(strengths)}")

        weaknesses = analysis_data.get("weaknesses") or []
        if weaknesses:
            sections.append(f"Resume Weaknesses: {', '.join(weaknesses)}")

        matched_jd_keywords = analysis_data.get("matched_jd_keywords") or []
        if matched_jd_keywords:
            sections.append(f"JD Matched Keywords: {', '.join(matched_jd_keywords)}")

        missing_jd_keywords = analysis_data.get("missing_jd_keywords") or []
        if missing_jd_keywords:
            sections.append(f"JD Missing Keywords: {', '.join(missing_jd_keywords)}")

        priority_skills = analysis_data.get("priority_skills") or []
        if priority_skills:
            sections.append(f"Priority JD Gap Skills: {', '.join(priority_skills)}")

        ats_score = analysis_data.get("ats_score")
        readiness = analysis_data.get("interview_readiness")
        keyword_coverage = analysis_data.get("keyword_coverage")
        if ats_score is not None:
            sections.append(f"ATS Score: {ats_score}")
        if readiness is not None:
            sections.append(f"Interview Readiness: {readiness}")
        if keyword_coverage is not None:
            sections.append(f"Keyword Coverage: {keyword_coverage}%")

        return "\n".join(sections)

    @classmethod
    def generate_question_pool(
        cls,
        resume_context: str,
        job_description: Optional[str] = None,
        analysis_data: Optional[dict[str, Any]] = None,
    ) -> list[dict[str, Any]]:
        """
        Generates a highly targeted resume + JD-aware question pool for resume interview sessions.
        """
        system_instruction = (
            "You are a Senior Technical Interviewer with full visibility of the candidate's resume, extracted resume analysis report, and target job description. "
            "Generate an interview question pool that feels like you carefully reviewed the candidate's resume and the JD. "
            "Do NOT generate generic questions. Every question must reference a specific project, skill, technology, certification, or experience detail from the candidate's resume or the JD. "
            "Organize the pool so technical questions appear before behavioral questions, and only ask behavioral questions after the technical questions have been generated. "
            "Return only raw JSON; do not include markdown, backticks, or explanatory text."
        )

        metadata_text = cls._build_metadata_text(analysis_data)
        jd_text = job_description or ""

        prompt = f"""
        You are preparing a targeted resume interview for a candidate. Use all available information below.

        Parsed resume context:
        {resume_context}

        Resume analysis metadata:
        {metadata_text}

        Target job description:
        {jd_text}

        Generate exactly 10 unique interview questions with the following difficulty distribution:
        - 2 easy
        - 5 medium
        - 3 hard

        Strict Guidelines:
        1. All questions must be strictly unique and built directly from the candidate's resume context (projects, skills, experience) and/or the job description (JD) requirements.
        2. Do not generate generic questions (like "What are your strengths?" or "Tell me about yourself"). Every question must be highly contextualized to the candidate's specific background and/or the matching JD requirements.
        3. Assign a time limit based on the difficulty level:
           - "easy" difficulty questions MUST have a 60 seconds time limit
           - "medium" difficulty questions MUST have a 120 seconds time limit
           - "hard" difficulty questions MUST have a 180 seconds time limit

        Question priorities:
        1. Ask directly from resume projects and project experiences.
        2. Ask from technologies that actually appear in the resume.
        3. Ask from missing JD skills if the JD requires them and the resume does not include them.
        4. Ask behavioral questions only after technical questions.

        Each question must include all of these fields:
        - "id": integer 1 through 10
        - "category": one of ["Backend", "Frontend", "Fullstack", "DevOps", "Data", "Behavioral", "Job Description", "ATS Gap"]
        - "difficulty": one of ["easy", "medium", "hard"]
        - "source": one of ["Resume Project", "Resume Skill", "Resume Certification", "Resume Experience", "Job Description Requirement", "ATS Gap"]
        - "resume_reference": the specific skill, project, certification, experience, or JD phrase the question originates from
        - "question": the interview question text
        - "expected_topics": a list of the main topics the candidate should mention in a strong answer
        - "time_limit": estimated answer time in seconds (60, 120, or 180 depending on difficulty)

        Every question should include a personalized resume reference sentence such as:
        "I found this in your resume" or "I saw that you...".

        Do not ask unrelated technologies. Only ask about technologies, projects, certifications, or skills that are present in the resume or required by the JD.

        If the resume mentions a percentage metric such as "95% ATS", ask a follow-up question on how the ATS score was calculated.
        If the resume mentions an internship, ask what the candidate's contribution was during that internship.
        If the resume mentions certifications, ask what practical knowledge the candidate gained from the certification.

        If the JD requires a skill missing from the resume, ask a question like:
        "Suppose your company asks you to deploy your application using {{skill}}. How would you learn and implement it?"

        Return exactly this JSON structure:
        {{
          "questions": [
            {{
              "id": 1,
              "category": "Backend",
              "difficulty": "Medium",
              "source": "Resume Project",
              "resume_reference": "AI Resume Analyzer",
              "question": "Explain how your resume analyzer works.",
              "expected_topics": ["FastAPI", "FAISS", "Groq", "RAG"],
              "time_limit": 120
            }},
            ...
          ]
        }}
        """

        try:
            logger.info("Generating a resume-aware interview pool using AIService...")
            result = AIService.generate_structured_json(prompt, system_instruction)
            questions = result.get("questions", [])

            if not isinstance(questions, list) or not questions:
                raise ValueError("AI returned an invalid or empty question list.")

            validated_questions = []
            for idx, question in enumerate(questions[:10], start=1):
                if not isinstance(question, dict):
                    continue

                topic = question.get("topic") or question.get("category") or "General"
                
                # Coerce difficulty
                diff_val = str(question.get("difficulty", "medium")).lower()
                if diff_val not in ["easy", "medium", "hard"]:
                    diff_val = "medium"

                # Strictly assign timer based on difficulty level
                if diff_val == "easy":
                    estimated_time = 60
                elif diff_val == "hard":
                    estimated_time = 180
                else:
                    estimated_time = 120

                expected_answer_raw = question.get("expected_answer") or question.get("expected_topics") or "Provide a clear, structured answer that covers the main topic and resume details."
                expected_answer = (
                    ", ".join(expected_answer_raw) if isinstance(expected_answer_raw, list) else str(expected_answer_raw)
                )
                why_selected = question.get("why_selected") or f"This question was selected based on {question.get('resume_reference', 'your resume context')}."

                validated_questions.append({
                    "id": idx,
                    "category": question.get("category", topic),
                    "difficulty": diff_val,
                    "source": question.get("source", "Resume Project"),
                    "resume_reference": question.get("resume_reference", "Resume context"),
                    "topic": topic,
                    "question": question.get("question", ""),
                    "expected_topics": question.get("expected_topics", []),
                    "expected_answer": expected_answer,
                    "why_selected": why_selected,
                    "estimated_time": estimated_time,
                })

            if len(validated_questions) < 10:
                raise ValueError("AI returned fewer than 10 valid questions.")

            logger.info("Successfully generated a 10-question resume-aware interview pool.")
            return validated_questions
        except Exception as e:
            logger.error(f"Failed to generate structured question pool: {e}")
            return cls._get_fallback_pool(analysis_data, job_description)

    @staticmethod
    def _get_fallback_pool(analysis_data: Optional[dict[str, Any]] = None, job_description: Optional[str] = None) -> list[dict[str, Any]]:
        """Provides a fallback pool if the AI question generator fails."""
        source_skills = analysis_data.get("skills_matched", []) if analysis_data else []
        source_projects = analysis_data.get("projects") or analysis_data.get("projects_to_add") if analysis_data else []
        source_certs = analysis_data.get("certifications", []) if analysis_data else []
        missing_skills = analysis_data.get("missing_jd_keywords", []) if analysis_data else []
        ats_score = analysis_data.get("ats_score") if analysis_data else None
        internship_mention = "internship" in (analysis_data.get("profile_summary", "").lower() if analysis_data else "")

        pool = []
        fallback_texts = []

        if source_projects:
            for project in source_projects[:4]:
                fallback_texts.append((
                    "Resume Project",
                    f"I found that you worked on {project}. Can you explain the architecture and technology decisions behind this project?",
                    [project],
                    "Backend"
                ))

        if source_skills:
            for skill in source_skills[:4]:
                fallback_texts.append((
                    "Resume Skill",
                    f"I saw that you listed {skill} on your resume. What are the most important trade-offs you consider when using {skill}?",
                    [skill],
                    "Backend" if skill.lower() in ["python", "fastapi", "sql", "postgresql", "redis"] else "Frontend"
                ))

        if source_certs:
            for cert in source_certs[:2]:
                fallback_texts.append((
                    "Resume Certification",
                    f"I saw your certification in {cert}. What practical knowledge did you gain from it?",
                    [cert],
                    "Job Description"
                ))

        if missing_skills:
            for skill in missing_skills[:2]:
                fallback_texts.append((
                    "ATS Gap",
                    f"The JD requests {skill} and your resume does not show it. Suppose your company asks you to implement {skill}. How would you learn and apply it?",
                    [skill],
                    "Job Description"
                ))

        if ats_score is not None:
            fallback_texts.append((
                "ATS Gap",
                f"Your resume indicates an ATS score of {ats_score}. How is the ATS score calculated and what steps did you take to improve it?",
                ["ATS Score"],
                "ATS Gap"
            ))

        if internship_mention:
            fallback_texts.append((
                "Resume Experience",
                "I see an internship mentioned on your resume. What was your primary contribution during that internship?",
                ["Internship"],
                "Behavioral"
            ))

        if not fallback_texts:
            fallback_texts = [
                ("Resume Experience", "I found a strong engineering background in your resume. What was the most challenging production problem you solved?", ["Production"], "Behavioral"),
                ("Resume Project", "I saw a project in your resume involving a modern web stack. Can you explain its architecture and deployment?", ["Architecture"], "Fullstack"),
                ("Resume Skill", "I found a mention of a backend technology in your resume. How do you ensure reliability and performance when using it?", ["Reliability"], "Backend"),
            ]

        question_templates = fallback_texts[:10]
        difficulties = ["easy"] * 2 + ["medium"] * 5 + ["hard"] * 3
        sources_map = {
            "Backend": "Resume Skill",
            "Frontend": "Resume Skill",
            "Fullstack": "Resume Project",
            "DevOps": "Job Description Requirement",
            "Data": "Resume Skill",
            "Behavioral": "Resume Experience",
            "Job Description": "Job Description Requirement",
            "ATS Gap": "ATS Gap"
        }

        for idx in range(10):
            source, question_text, topics, category = question_templates[idx] if idx < len(question_templates) else ("Resume Project", "I found details in your experience that deserve a follow-up. Can you explain your decision-making?", ["Architecture"], "Backend")
            diff_val = difficulties[idx]
            if diff_val == "easy":
                estimated_time = 60
            elif diff_val == "hard":
                estimated_time = 180
            else:
                estimated_time = 120

            pool.append({
                "id": idx + 1,
                "category": category,
                "difficulty": diff_val,
                "source": sources_map.get(category, source),
                "resume_reference": source,
                "topic": category,
                "question": question_text,
                "expected_topics": topics,
                "expected_answer": f"Provide a high-quality answer that explains this topic clearly and references the matching resume details.",
                "why_selected": f"This question was chosen because it highlights {source.lower()} from your resume.",
                "estimated_time": estimated_time
            })

        return pool

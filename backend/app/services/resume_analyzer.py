import re
import logging
from typing import Any, Optional
from .resume_parser import ResumeParser
from .embedding_service import EmbeddingService
from .vector_store import VectorStore
from .ai_service import AIService
from .ats_engine import ATSEngine

logger = logging.getLogger(__name__)

class ResumeAnalyzer:
    @staticmethod
    def chunk_text(text: str, chunk_size: int = 600, overlap: int = 100) -> list[str]:
        """Segments text into chunks of specified character size and overlap."""
        chunks = []
        start = 0
        text_len = len(text)
        
        while start < text_len:
            end = min(start + chunk_size, text_len)
            chunks.append(text[start:end])
            if end == text_len:
                break
            start += (chunk_size - overlap)
            
        return chunks

    @classmethod
    def analyze(cls, pdf_bytes: bytes, filename: str, job_description: Optional[str] = None) -> dict[str, Any]:
        """
        Orchestrates the entire RAG resume analysis pipeline.
        Logs every stage of the AI pipeline for production explainability.
        """
        logger.info("STAGE 1: PDF Text Extraction & Cleaning")
        logger.info("Target file: %s", filename)
        raw_text = ResumeParser.extract_text(pdf_bytes)
        cleaned_text = ResumeParser.clean_text(raw_text)
        logger.info("Raw character count: %s", len(raw_text))
        logger.info("Cleaned character count: %s", len(cleaned_text))
        logger.debug("Sample extracted text: %s", cleaned_text[:300])
        
        if not cleaned_text:
            raise ValueError("Extracted resume text is empty or could not be parsed.")

        logger.info("STAGE 2: Semantic Chunk Creation")
        chunks = cls.chunk_text(cleaned_text, chunk_size=600, overlap=100)
        logger.info("Total chunks created: %s", len(chunks))
        if chunks:
            logger.debug("Sample chunk 1: %s", chunks[0])

        logger.info("STAGE 3: Embedding Generation")
        embeddings = EmbeddingService.get_embeddings(chunks)
        logger.info("Generated %s embedding vectors.", len(embeddings))
        if embeddings:
            logger.info("Embedding dimension size: %s", len(embeddings[0]))

        logger.info("STAGE 4: FAISS Vector Index Storage")
        # Enforce that Job Description is present
        if not job_description or not job_description.strip():
            raise ValueError("Job Description is required under V1.0 flagship specifications.")

        # Store resume chunks in resume vector store
        resume_store = VectorStore()
        resume_store.add_texts(chunks, embeddings)
        logger.info("Added resume chunks to FAISS Vector Store.")
        
        # Store JD chunks in JD vector store
        logger.info("Job description provided. Chunking and indexing JD...")
        jd_chunks = cls.chunk_text(job_description, chunk_size=600, overlap=100)
        jd_embeddings = EmbeddingService.get_embeddings(jd_chunks)
        jd_store = VectorStore()
        jd_store.add_texts(jd_chunks, jd_embeddings)
        logger.info("Added %s JD chunks to Vector Store.", len(jd_chunks))

        logger.info("STAGE 5: Top-K Vector Search & Context Retrieval")
        eval_prompts = [
            "Technical skills, programming languages, databases, cloud, libraries",
            "Professional experience, projects, achievements, work experience",
            "Education, certifications, degrees, portfolios, websites, social links"
        ]
        
        # Retrieve context from Resume Vector Store
        retrieved_resume_contexts = []
        for query in eval_prompts:
            query_emb = EmbeddingService.get_embedding(query)
            results = resume_store.similarity_search(query_emb, k=3)
            retrieved_contexts_raw = [r for r in results if r]
            retrieved_resume_contexts.extend(retrieved_contexts_raw)
            
        # Deduplicate retrieved resume chunks while maintaining order
        seen_res = set()
        unique_resume_chunks = []
        for chunk in retrieved_resume_contexts:
            if chunk not in seen_res:
                seen_res.add(chunk)
                unique_resume_chunks.append(chunk)
                
        resume_context_text = "\n---\n".join(unique_resume_chunks)
        if not resume_context_text:
            logger.warning("No relevant resume chunks retrieved; using full cleaned resume text as context.")
            resume_context_text = cleaned_text[:5000]
        context_text = resume_context_text
        logger.info("Total unique resume chunks retrieved: %s", len(unique_resume_chunks))
        for idx, chunk in enumerate(unique_resume_chunks):
            logger.debug("Retrieved resume chunk %s: %s", idx + 1, chunk)
        
        # Retrieve context from Job Description Vector Store
        retrieved_jd_contexts = []
        for query in eval_prompts:
            query_emb = EmbeddingService.get_embedding(query)
            results = jd_store.similarity_search(query_emb, k=3)
            retrieved_contexts_raw = [r for r in results if r]
            retrieved_jd_contexts.extend(retrieved_contexts_raw)
            
        # Deduplicate retrieved JD chunks while maintaining order
        seen_jd = set()
        unique_jd_chunks = []
        for chunk in retrieved_jd_contexts:
            if chunk not in seen_jd:
                seen_jd.add(chunk)
                unique_jd_chunks.append(chunk)
                
        jd_context_text = "\n---\n".join(unique_jd_chunks)
        if not jd_context_text:
            logger.warning("No relevant JD chunks retrieved; falling back to full job description for JD context.")
            jd_context_text = job_description or ""
        logger.info("Total unique JD chunks retrieved: %s", len(unique_jd_chunks))
        for idx, chunk in enumerate(unique_jd_chunks):
            logger.debug("Retrieved JD chunk %s: %s", idx + 1, chunk)
            
        logger.info("STAGE 6: Deterministic ATS & Readiness Calculation")
        scores = ATSEngine.calculate_ats_score(cleaned_text, job_description)
        logger.info("Deterministic ATS score: %s", scores["ats_score"])
        logger.info("Deterministic interview readiness score: %s", scores["interview_readiness"])
        logger.info("Keyword match coverage: %s", scores["keyword_coverage"])
        logger.info("Priority skills to add: %s", scores["priority_skills"])
        
        logger.info("STAGE 7: Prompt creation and LLM query")
        system_instruction = (
            "You are an expert technical recruiter and resume auditor. "
            "Analyze the provided RAG resume chunks and explain the deterministic ATS evaluations. "
            "Provide explainable justifications (WHY) for every recommendation (why it matters, recruiter expectations, where to learn, and estimated times). "
            "You must return a valid JSON object matching the requested schema. Return only raw, parseable JSON."
        )
        
        jd_prompt_info = f"Retrieved Job Description Context Chunks:\n{jd_context_text}"
        
        jd_compatibility_template = """{
            "job_match_score": 92,
            "matching_skills": ["React"],
            "matching_technologies": ["TypeScript"],
            "matching_projects": ["E-commerce dashboard"],
            "missing_skills": ["Docker"],
            "missing_keywords": ["Kubernetes"],
            "missing_certifications": ["AWS Developer Certification"],
            "suggested_improvements": ["List Docker deployment specifics"],
            "final_recommendation": "Excellent Match",
            "explanation": "Detailed justification on why this candidate matches or does not match",
            "overall_match_label": "High Match",
            "recruiter_verdict": "Resume is suitable for interview. Improve Docker and Redis before applying.",
            "expected_salary_fit": "Matched expectations based on skills and experience"
          }""" if job_description else "null"
        
        # Define JSON template as a formatted string to avoid deep nesting of expressions in f-strings
        json_structure = f"""{{
          "profile_summary": "detailed summary of the candidate's professional background based on context",
          "ats_score": {scores['ats_score']},
          "interview_readiness": {scores['interview_readiness']},
          "applicable_jobs": ["job title 1", "job title 2", "job title 3"],
          "resume_brief_description": "brief description (2-3 sentences) of the resume identified, including candidate background, level of experience, and primary tech stack",
          "jd_match_status": "detailed comparison explaining whether the resume matched the target Job Description (fully, partially, or not matched) and alignment gaps or success indicators. If no target Job Description was provided, state 'No target Job Description provided to match'",
          "strengths": ["specific strength 1", "specific strength 2", "specific strength 3"],
          "weaknesses": ["specific weakness 1 explaining why it is a gap", "specific weakness 2", "specific weakness 3"],
          "missing_skills": ["missing skill 1", "missing skill 2"],
          "projects_to_add": ["project recommendation 1 description", "project recommendation 2 description"],
          "certifications": ["recommended certification 1", "recommended certification 2"],
          "technical_feedback": ["feedback on programming stack, databases, architecture"],
          "soft_skill_feedback": ["feedback on communication, team dynamics, leadership"],
          "keyword_analysis": ["detailed keyword optimization feedback, e.g. Docker: missing, React: present"],
          "recruiter_impression": "candid impression of this resume from a hiring perspective",
          "improvement_plan": [
              "Day 1-10: detailed milestone task to improve X skill",
              "Day 11-20: detailed milestone task to build Y project",
              "Day 21-30: detailed milestone task to obtain Z certification"
          ],
          "recommended_career_paths": [
            {{
              "role_name": "Backend Python Developer",
              "match_percentage": 90,
              "expected_salary": "$120,000/yr",
              "why_suitable": "Strong Python, FastAPI, SQL, REST API and backend project experience.",
              "missing_skills": ["GraphQL", "Docker"],
              "learning_difficulty": "Hard"
            }}
          ],
          "recruiter_resume_summary": "A professional recruiter summary describing candidate profile, experience, education, strong technologies, and recommended career path. Maximum of 6 lines.",
          "jd_compatibility": {jd_compatibility_template},
          "ai_recruiter_feedback": {{
            "impressed_by": "Key aspect of the resume that stood out to the recruiter",
            "biggest_weaknesses": "Most notable weakness or experience gap",
            "what_should_be_improved": "Actionable improvements to structural/content choices",
            "shortlist_decision": "Yes",
            "shortlist_confidence": 89
          }},
          "top_companies": [
            {{
              "company_name": "Microsoft",
              "why_profile_fits": "Candidate's core programming strengths align with enterprise systems",
              "recommended_role": "Software Engineer",
              "preparation_level": "High"
            }}
          ],
          "salary_prediction": {{
            "country": "India",
            "currency": "INR",
            "entry_level_salary": 800000,
            "average_salary": 1200000,
            "best_case_salary": 1800000,
            "justification": "Explanation for predictions based on skills, country, and experience"
          }},
          "interview_readiness_breakdown": {{
            "technical_readiness": 85,
            "communication_readiness": 80,
            "problem_solving": 75,
            "resume_quality": 90,
            "project_strength": 80,
            "overall_hiring_probability": 85
          }},
          "career_roadmap": [
            {{
              "phase": "30 Day Plan",
              "skills": ["Docker", "Kubernetes basics"],
              "projects": ["Build containerized microservice API"],
              "courses": ["Docker & Kubernetes: The Practical Guide"],
              "interview_preparation": ["Mock interview scenario on Docker deployments"]
            }},
            {{
              "phase": "60 Day Plan",
              "skills": ["System Design fundamentals", "Redis caching"],
              "projects": ["Build low-latency messaging queue system"],
              "courses": ["System Design primer and advanced patterns"],
              "interview_preparation": ["System design mock interview practice"]
            }},
            {{
              "phase": "90 Day Plan",
              "skills": ["Advanced cloud operations", "CI/CD pipelines"],
              "projects": ["Deploy cloud-native high availability system"],
              "courses": ["AWS Certified Solutions Architect Associate"],
              "interview_preparation": ["Behavioral rounds and Cloud Architect mock case study"]
            }}
          ],
          "career_level_detection": {{
            "detected_level": "Mid Level",
            "confidence_percentage": 90
          }},
          "company_match_recommendations": {{
            "recommended_types": ["Product Companies", "Startups"],
            "top_hiring_companies": ["Microsoft", "Amazon"]
          }},
          "recruiter_verdict_model": {{
            "star_rating": 4,
            "rating_label": "Strong Resume",
            "explanation": "Detailed explanation citing specific resume evidence on why this verdict rating was given."
          }},
          "professional_analysis_report": {{
            "overall_ats_score": {{
              "value": {scores['ats_score']},
              "reason": "high-level reason why the resume parsed with this score",
              "explanation": "detailed breakdown of how formatting, structure, contact, and sections contributed to the ATS rating",
              "strength": "specific formatting/parsing strength in the resume",
              "weakness": "specific parsing hurdle or missing section/link in the resume"
            }},
            "jd_match_percentage": {{
              "value": {scores['keyword_coverage']},
              "reason": "high-level keyword overlap reason",
              "explanation": "detailed breakdown of candidate skills matching the JD requirements",
              "strength": "strongest matching skillset or experience block for this job",
              "weakness": "most critical missing skillset or keyword gap compared to the JD"
            }},
            "recruiter_confidence": {{
              "value": 85,
              "reason": "short explanation of the recruiter's confidence level in this candidate",
              "explanation": "detailed assessment of candidate's presentation quality, impact metrics, and role relevance",
              "strength": "impressive career milestones or project complexity demonstrated",
              "weakness": "weak presentation elements or employment gaps"
            }},
            "interview_readiness": {{
              "value": {scores['interview_readiness']},
              "reason": "short explanation of readiness for technical/behavioral rounds",
              "explanation": "detailed analysis of how well the candidate's resume prepares them for interview questions",
              "strength": "clear project contexts and action verbs supporting readiness",
              "weakness": "lack of quantifiable impact metrics or tool/domain explanation"
            }},
            "hiring_probability": {{
              "value": 75,
              "reason": "short explanation of overall hiring chance for this specific role",
              "explanation": "detailed analysis of market demand, hiring bar, and overall match strength",
              "strength": "high alignment with core responsibilities",
              "weakness": "high competition area or missing key qualifications"
            }}
          }},
          "jd_match_report": {{
            "overall_match_percentage": {scores['keyword_coverage']},
            "matched_skills": ["List of core matched skills from the resume, e.g. Python, FastAPI"],
            "matched_technologies": ["List of core matched technologies, e.g. Git, REST API"],
            "missing_skills": ["List of core missing skills, e.g. Redis, Docker"],
            "missing_technologies": ["List of core missing technologies, e.g. AWS, CI/CD"],
            "missing_keywords": ["List of missing keywords, e.g. Kubernetes, Microservices"],
            "critical_improvements": ["List of critical improvements needed on the resume to match the JD, e.g. Add Docker containerization details"],
            "must_have_skills": ["List of must-have skills from the JD, e.g. Python, REST API Development"],
            "nice_to_have_skills": ["List of nice-to-have skills from the JD, e.g. AWS, Redis"],
            "recruiter_verdict": "Detailed final recruiter verdict text, e.g. Resume is suitable for interview but should improve DevOps skills."
          }},
          "resume_insights": {{
            "strongest_section": "Strongest section identified in the resume (e.g. Work Experience or Projects)",
            "weakest_section": "Weakest section identified in the resume (e.g. Certifications or Summary)",
            "best_project": "The best project found in the resume and a 1-sentence reason why it is impressive",
            "missing_certifications": ["List of recommended certifications matching the candidate's field"],
            "missing_projects": ["List of suggested projects the candidate should build to address gaps"],
            "resume_writing_quality": "High/Medium/Low rating with a short reason",
            "formatting_score": 85,
            "grammar_score": 90,
            "technical_depth": "High/Medium/Low rating with a short reason"
          }},
          "recruiter_decision": {{
            "decision_status": "Shortlist",
            "reason": "Clear explanation of why this final hiring decision was made based on resume qualifications",
            "next_steps": [
              "Step 1: Next action item (e.g. Schedule technical interview round)",
              "Step 2: Next action item (e.g. Complete Docker training roadmap)"
            ]
          }}
        }}"""

        prompt = f"""
        Analyze the following candidate resume chunks retrieved using RAG.
        
        RAG Resume Context:
        {context_text}
        
        {jd_prompt_info}
        
        Deterministic Backend Metrics:
        - Precalculated ATS Score: {scores['ats_score']}
        - Precalculated Interview Readiness: {scores['interview_readiness']}
        - Keyword Match Percentage: {scores['keyword_coverage']}
        - Matched JD Keywords: {scores['matched_jd_keywords'][:15]}
        - Missing JD Keywords: {scores['missing_jd_keywords'][:15]}
        - Priority Missing Technical Skills: {scores['priority_skills']}
        
        You must return a JSON object with the following structure. Do not include any comments in your output, just the raw parseable JSON:
        {json_structure}
        
        Strict Guidelines:
        1. Enforce generating exactly the Top 10 most suitable roles in "recommended_career_paths" list.
        2. If NO target Job Description was provided in the query prompt above, you must return "jd_compatibility": null. If a target Job Description was provided, you MUST construct the "jd_compatibility" object dynamically with valid match metrics, match score, missing keywords, and overall_match_label (either "High Match", "Medium Match", or "Low Match").
        3. For "career_level_detection.detected_level", you must output one of: "Fresher", "Junior", "Associate", "Mid Level", "Senior", "Lead".
        4. For "company_match_recommendations.recommended_types", only output values from: "Startups", "Mid Scale", "MNC", "Product Companies", "Service Companies".
        5. For "recruiter_verdict_model.rating_label", output one of: "Strong Resume", "Good Resume", "Average Resume", "Needs Improvement", "Critical Improvement Needed".
        6. Ensure that every single strength, weakness, and suggestion explains the 'WHY' (why it is important, recruiter expectations, where to learn, and estimated times).
        7. The returned ATS and Interview Readiness scores in JSON MUST exactly match the deterministic precalculated scores: {scores['ats_score']} and {scores['interview_readiness']}.
        8. For "recruiter_decision.decision_status", you must output exactly one of: "Reject", "Needs Improvement", "Shortlist", "Interview Recommended", "Strong Hire".
        """
        
        logger.info("Sending prompt to AI provider...")
        analysis = AIService.generate_structured_json(prompt, system_instruction)
        logger.info("STAGE 8: LLM response parsed successfully")
        
        # Coerce all floating point scores/percentages to integer to satisfy Pydantic schemas
        def coerce_to_int(obj: Any, keys: list[str]):
            if isinstance(obj, dict):
                for k, v in list(obj.items()):
                    if k in keys and isinstance(v, (int, float)):
                        obj[k] = int(round(v))
                    elif isinstance(v, (dict, list)):
                        coerce_to_int(v, keys)
            elif isinstance(obj, list):
                for item in obj:
                    coerce_to_int(item, keys)

        coerce_to_int(analysis, ["job_match_score", "value", "overall_match_percentage", "match_percentage"])
        
        logger.info("Profile summary preview: %s", analysis.get("profile_summary", "")[:100])
        
        # Merge in the additional metadata from our deterministic scoring engine
        analysis["matched_jd_keywords"] = scores["matched_jd_keywords"]
        analysis["missing_jd_keywords"] = scores["missing_jd_keywords"]
        analysis["keyword_coverage"] = scores["keyword_coverage"]
        analysis["priority_skills"] = scores["priority_skills"]
        analysis["sections_found"] = scores["sections_found"]
        analysis["contact_details"] = scores["contact_details"]
        analysis["skills_matched"] = scores["skills_matched"]
        
        # Persist RAG chunk sources for mock interview context retrieval
        analysis["retrieved_resume_chunks"] = unique_resume_chunks
        analysis["retrieved_jd_chunks"] = unique_jd_chunks
        
        return analysis

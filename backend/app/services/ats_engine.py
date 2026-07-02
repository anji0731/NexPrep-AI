import re
from typing import Any, Set

# Common English stopwords to filter out when calculating Job Description keyword overlap
STOPWORDS = {
    "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "aren't", "as", "at", 
    "be", "because", "been", "before", "being", "below", "between", "both", "but", "by", "can", "cannot", "could", 
    "did", "do", "does", "doing", "down", "during", "each", "few", "for", "from", "further", "had", "has", "have", 
    "having", "he", "her", "here", "hers", "herself", "him", "himself", "his", "how", "i", "if", "in", "into", "is", 
    "it", "its", "itself", "me", "more", "most", "my", "myself", "no", "nor", "not", "of", "off", "on", "once", 
    "only", "or", "other", "ought", "our", "ours", "ourselves", "out", "over", "own", "same", "she", "should", 
    "so", "some", "such", "than", "that", "the", "their", "theirs", "them", "themselves", "then", "there", "these", 
    "they", "this", "those", "through", "to", "too", "under", "until", "up", "very", "was", "we", "were", "what", 
    "when", "where", "which", "while", "who", "whom", "why", "with", "would", "you", "your", "yours", "yourself", 
    "yourselves", "will", "shall", "should", "must", "using", "with", "from", "into", "through", "during", "include",
    "includes", "included", "including", "experience", "skills", "ability", "duties", "role", "position", "team",
    "work", "projects", "requirements", "candidate", "responsibilities", "job", "description"
}

# Standard technical keywords for base skill checking
TECH_KEYWORDS = [
    "python", "java", "javascript", "react", "fastapi", "sql", "aws", "docker", "kubernetes", "git", "ci/cd", 
    "rest api", "testing", "typescript", "node", "postgresql", "mongodb", "redis", "html", "css", "tailwind",
    "django", "flask", "pytorch", "tensorflow", "pandas", "numpy", "next.js", "vue", "angular", "gcp", "azure"
]

class ATSEngine:
    @staticmethod
    def extract_keywords(text: str) -> set[str]:
        """Extracts unique lowercase alphabetic words of length >= 3, excluding stopwords."""
        words = re.findall(r'\b[a-z]{3,}\b', text.lower())
        return {w for w in words if w not in STOPWORDS}

    @classmethod
    def calculate_ats_score(cls, resume_text: str, job_description: str = None) -> dict[str, Any]:
        """
        Deterministically calculates the ATS and Interview Readiness scores, returning 
        detailed metrics, keyword coverage comparisons, and prioritizations.
        """
        resume_lower = resume_text.lower()
        
        # --- 1. Required Sections (up to 15 points) ---
        sections = {
            "education": ["education", "academic", "degree", "university", "college"],
            "experience": ["experience", "experience", "work", "employment", "history"],
            "skills": ["skills", "technologies", "competencies", "tools"],
            "projects": ["projects", "personal projects", "portfolio"],
            "certifications": ["certifications", "certs", "courses", "credentials"]
        }
        sections_found = []
        sections_score = 0.0
        for sec_name, sec_keywords in sections.items():
            found = False
            for kw in sec_keywords:
                if kw in resume_lower:
                    found = True
                    break
            if found:
                sections_score += 3.0
                sections_found.append(sec_name.capitalize())
        
        # --- 2. Contact Info & Links (up to 20 points) ---
        contact_score = 0.0
        details_found = {}
        
        # GitHub check
        if "github.com" in resume_lower:
            contact_score += 5.0
            details_found["github"] = True
        else:
            details_found["github"] = False
            
        # LinkedIn check
        if "linkedin.com" in resume_lower:
            contact_score += 5.0
            details_found["linkedin"] = True
        else:
            details_found["linkedin"] = False
            
        # Email check
        if "@" in resume_lower:
            contact_score += 5.0
            details_found["email"] = True
        else:
            details_found["email"] = False
            
        # Phone check
        if re.search(r'\+?\d[\d -]{7,}\d', resume_lower):
            contact_score += 5.0
            details_found["phone"] = True
        else:
            details_found["phone"] = False
            
        # --- 3. Formatting & Structural Density (up to 15 points) ---
        formatting_score = 10.0  # Base format score
        # Check text length sanity (too short/long resumes penalize slightly)
        length = len(resume_text)
        if 800 <= length <= 6000:
            formatting_score += 5.0
        elif length > 6000 or length < 800:
            formatting_score += 2.0
            
        # --- 4. General Tech Skills Coverage (up to 20 points) ---
        skills_matched = []
        for kw in TECH_KEYWORDS:
            # Word boundary check for keywords to avoid partial matches
            if re.search(r'\b' + re.escape(kw) + r'\b', resume_lower):
                skills_matched.append(kw)
        
        general_skills_score = min(len(skills_matched) * 2.0, 20.0)
        
        # --- 5. Job Description Matching (up to 30 points) ---
        matched_jd_keywords = []
        missing_jd_keywords = []
        keyword_coverage = 0.0
        jd_match_score = 0.0
        priority_skills = []
        
        if job_description:
            jd_keywords = cls.extract_keywords(job_description)
            resume_keywords = cls.extract_keywords(resume_text)
            
            if jd_keywords:
                matched = jd_keywords.intersection(resume_keywords)
                missing = jd_keywords.difference(resume_keywords)
                
                matched_jd_keywords = sorted(list(matched))
                missing_jd_keywords = sorted(list(missing))
                
                coverage_pct = len(matched) / len(jd_keywords)
                keyword_coverage = round(coverage_pct * 100, 1)
                jd_match_score = coverage_pct * 30.0
                
                # Identify priority skills: top missing technical words
                # To keep it deterministic, select technical words that match our TECH_KEYWORDS
                priority_skills = [w for w in missing_jd_keywords if w in TECH_KEYWORDS][:5]
                if not priority_skills:
                    priority_skills = missing_jd_keywords[:5]
        else:
            # If no Job Description is provided, give a default base match score based on general skills match
            jd_match_score = general_skills_score * (30.0 / 20.0)
            keyword_coverage = round((general_skills_score / 20.0) * 100, 1)
            
        # --- Final Scoring Compile ---
        ats_score = sections_score + contact_score + formatting_score + general_skills_score + jd_match_score
        
        # Readiness score (impacted by ATS and presence of impact metric percentages)
        metrics_hits = len(re.findall(r'\d+%', resume_lower)) + len(re.findall(r'\b(managed|improved|developed|scaled|reduced|increased)\b', resume_lower))
        readiness_score = 40.0 + min(metrics_hits * 3.0, 20.0) + (ats_score * 0.4)
        
        final_ats = min(max(int(ats_score), 40), 98)
        final_readiness = min(max(int(readiness_score), 40), 98)
        
        return {
            "ats_score": final_ats,
            "interview_readiness": final_readiness,
            "sections_found": sections_found,
            "contact_details": details_found,
            "skills_matched": skills_matched,
            "matched_jd_keywords": matched_jd_keywords,
            "missing_jd_keywords": missing_jd_keywords,
            "keyword_coverage": keyword_coverage,
            "priority_skills": priority_skills
        }

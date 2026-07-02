import logging
from typing import Any
from .ai_service import AIService

logger = logging.getLogger(__name__)

class RoadmapGenerator:
    @staticmethod
    def generate_roadmap(weak_topics: list[str], strong_topics: list[str], recruiter_summary: str) -> dict[str, Any]:
        """
        Queries Groq to generate a personalized learning roadmap with 7-day, 30-day plans, 
        recommended tech/projects/certs, and full explainability ('WHY').
        """
        system_instruction = (
            "You are an AI Career Coach and Engineering Mentor. Create a detailed, actionable learning roadmap "
            "based on the candidate's performance summary. Explain the 'WHY' behind every single recommendation."
            "You must return a valid JSON object. Do NOT include markdown styling or headers."
        )

        prompt = f"""
        Generate a personalized 30-day learning roadmap for a candidate who just finished an interview.
        
        Candidate's Summary:
        {recruiter_summary}
        
        Strong Topics: {', '.join(strong_topics)}
        Weak Topics: {', '.join(weak_topics)}
        
        Create a roadmap in a JSON format. Every recommendation must explain:
        1. Why this technology or recommendation is important.
        2. Why recruiters expect candidates to know it.
        3. Where they can learn it.
        4. Estimated learning time.
        
        You must return a JSON object with this exact structure:
        {{
          "seven_day_plan": [
            {{
              "day": "Day 1-2",
              "focus": "Topic or focus area",
              "tasks": ["concrete task 1", "concrete task 2"],
              "why_critical": "explain why this immediate action is critical"
            }},
            {{
              "day": "Day 3-4",
              "focus": "Topic",
              "tasks": ["task 1"],
              "why_critical": "explanation"
            }},
            {{
              "day": "Day 5-7",
              "focus": "Topic",
              "tasks": ["task 1"],
              "why_critical": "explanation"
            }}
          ],
          "thirty_day_plan": [
            {{
              "week": "Week 2",
              "focus": "Focus area",
              "milestones": ["milestone milestone 1", "milestone 2"],
              "why_critical": "why this week's milestone is critical"
            }},
            {{
              "week": "Week 3",
              "focus": "Focus",
              "milestones": ["milestone 1"],
              "why_critical": "explanation"
            }},
            {{
              "week": "Week 4",
              "focus": "Focus",
              "milestones": ["milestone 1"],
              "why_critical": "explanation"
            }}
          ],
          "recommended_technologies": [
            {{
              "name": "Technology Name (e.g. Docker)",
              "importance": "detailed explanation of why it is important",
              "recruiter_expectation": "why recruiters look for this on resumes",
              "where_to_learn": "specific recommended platforms, documentation, or tutorials",
              "estimated_learning_time": "e.g., 6 hours / 3 days"
            }}
          ],
          "recommended_projects": [
            {{
              "title": "Project Title",
              "description": "comprehensive description of what to build to demonstrate this skill",
              "skills_gained": ["skill 1", "skill 2"],
              "difficulty_level": "e.g., Intermediate"
            }}
          ],
          "recommended_certifications": [
            {{
              "name": "Certification Name",
              "issuer": "Issuer (e.g. AWS, HashiCorp)",
              "career_value": "how this certificate impacts recruiter vetting"
            }}
          ],
          "learning_resources": [
            {{
              "title": "Resource Name",
              "url": "optional URL or platform name",
              "type": "e.g. Book, Video Course, Documentation"
            }}
          ]
        }}
        """
        
        try:
            logger.info("Generating personalized roadmap via Groq...")
            roadmap = AIService.generate_structured_json(prompt, system_instruction)
            return roadmap
        except Exception as e:
            logger.error(f"Failed to generate roadmap: {e}")
            # Fallback simple roadmap
            return {
                "seven_day_plan": [
                    {
                        "day": "Day 1-7",
                        "focus": "Review interview mistakes",
                        "tasks": ["Go through expected answers in your interview history.", "Practice coding simple data structures."],
                        "why_critical": "To lock in immediate learning points from your mistakes."
                    }
                ],
                "thirty_day_plan": [
                    {
                        "week": "Week 2-4",
                        "focus": "Deep dive into weak topics",
                        "milestones": ["Build a small API utilizing cache structures.", "Deploy code to a cloud environment."],
                        "why_critical": "To expand your hands-on experience and resume keywords."
                    }
                ],
                "recommended_technologies": [
                    {
                        "name": "FastAPI",
                        "importance": "High-performance Python framework for building REST APIs.",
                        "recruiter_expectation": "Demonstrates modern Python backend knowledge and asynchronous programming.",
                        "where_to_learn": "Official FastAPI documentation.",
                        "estimated_learning_time": "10 hours"
                    }
                ],
                "recommended_projects": [
                    {
                        "title": "Asynchronous Backend API",
                        "description": "Build an API that communicates with database pools and redis cache.",
                        "skills_gained": ["Asynchronous programming", "Database caching"],
                        "difficulty_level": "Intermediate"
                    }
                ],
                "recommended_certifications": [],
                "learning_resources": []
            }

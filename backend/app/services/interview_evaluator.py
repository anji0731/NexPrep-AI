import logging
import json
from typing import Any
from .ai_service import AIService

logger = logging.getLogger(__name__)

class InterviewEvaluator:
    @staticmethod
    def evaluate_answer_on_the_fly(question_text: str, expected_answer: str, user_answer: str) -> dict[str, Any]:
        """
        Evaluates a single answer on-the-fly to calculate a score out of 10
        and provide instant feedback, allowing for difficulty adaptation.
        """
        system_instruction = (
            "You are a strict technical interviewer. Evaluate the candidate's answer against the expected answer guidelines. "
            "You must return a valid JSON object. Do NOT include markdown code blocks or formatting. Return raw JSON."
        )

        prompt = f"""
        Evaluate the following candidate response to the interview question.
        
        Question: {question_text}
        Expected Answer Guidelines: {expected_answer}
        Candidate's Answer: {user_answer}
        
        Evaluate the answer strictly and return a JSON object with:
        - "score": a float between 1.0 and 10.0 representing the accuracy and technical depth.
        - "mistakes": a list of specific technical errors, omissions, or weak justifications in their answer.
        - "suggestions": concrete recommendations on how to improve this answer.
        - "better_answer": a revised, highly polished version of the user's answer that they could study.
        
        Ensure formatting matches:
        {{
          "score": 7.5,
          "mistakes": ["mistake 1", "omitted detail X"],
          "suggestions": ["add details about Y", "use standard terms"],
          "better_answer": "polished candidate response"
        }}
        """
        
        try:
            logger.info("Evaluating candidate answer on-the-fly...")
            result = AIService.generate_structured_json(prompt, system_instruction)
            return {
                "score": float(result.get("score", 5.0)),
                "mistakes": result.get("mistakes", ["Answer was slightly incomplete."]),
                "strong_points": result.get("strong_points", ["The answer demonstrated a clear structure."]),
                "suggestions": result.get("suggestions", ["Elaborate with concrete technical details."]),
                "better_answer": result.get("better_answer", expected_answer)
            }
        except Exception as e:
            logger.error(f"On-the-fly answer evaluation failed: {e}")
            return {
                "score": 5.0,
                "mistakes": ["Evaluation skipped due to system error."],
                "suggestions": ["Try to explain core implementation patterns."],
                "better_answer": expected_answer
            }

    @classmethod
    def compile_final_report(cls, active_questions: list[dict[str, Any]], answers: dict[str, str], evaluations: dict[str, dict[str, Any]]) -> dict[str, Any]:
        """
        Aggregates individual evaluations and queries Groq to compile a comprehensive,
        multi-score performance report, including weak/strong topics and review metrics.
        """
        # Calculate overall scores based on evaluations
        scores = [eval_data["score"] for eval_data in evaluations.values()]
        avg_score = sum(scores) / len(scores) if scores else 0.0
        
        # Scale to 0-100%
        overall_score_pct = round(avg_score * 10.0, 1)
        
        # Formulate a prompt for Groq to aggregate the performance and calculate sub-scores
        system_instruction = (
            "You are a Senior Interview Auditor and HR Director. Compile a detailed performance report "
            "for the candidate based on their full interview transcript. Return only valid JSON."
        )
        
        # Build transcript representation
        transcript_lines = []
        for idx, q in enumerate(active_questions):
            q_id_str = str(idx)
            ans = answers.get(q_id_str, "No answer provided.")
            eval_data = evaluations.get(q_id_str, {"score": 0.0, "mistakes": [], "suggestions": []})
            transcript_lines.append(f"""
            Question {idx+1} (Topic: {q['topic']}, Difficulty: {q['difficulty']}):
            - Question Text: {q['question']}
            - Expected: {q['expected_answer']}
            - Candidate Answer: {ans}
            - Score: {eval_data['score']}/10
            - Mistakes: {', '.join(eval_data['mistakes'])}
            """)
            
        full_transcript = "\n\n".join(transcript_lines)
        
        prompt = f"""
        Audit the following candidate interview transcript and evaluate their overall technical competence,
        communication clarity, problem-solving approach, confidence, and grammatical correctness.
        
        Interview Transcript:
        {full_transcript}
        
        Calculated Base Score: {overall_score_pct}%
        
        Generate a detailed performance analysis. You must evaluate five separate metrics out of 100:
        1. "overall_readiness" (should align closely with the Base Score of {overall_score_pct}%)
        2. "technical_score"
        3. "communication_score"
        4. "problem_solving_score"
        5. "confidence_score"
        6. "grammar_score"
        
        You must return a JSON object with this exact structure:
        {{
          "overall_readiness": {overall_score_pct},
          "overall_score": {overall_score_pct},
          "technical_score": <float out of 100>,
          "communication_score": <float out of 100>,
          "problem_solving_score": <float out of 100>,
          "confidence_score": <float out of 100>,
          "grammar_score": <float out of 100>,
          "strong_topics": ["topic 1", "topic 2"],
          "weak_topics": ["topic 1", "topic 2"],
          "recruiter_summary": "detailed recruiter summary of their overall interview performance, noting soft and hard skills",
          "recruiter_verdict": "Suitable for Interview",
          "recommended_technologies": ["Docker", "Redis"],
          "estimated_preparation_time": "15 Days" // e.g. "10 Days", "3 Weeks" depending on weaknesses
        }}
        """
        
        try:
            logger.info("Compiling final performance report using Groq API...")
            report_data = AIService.generate_structured_json(prompt, system_instruction)
            return report_data
        except Exception as e:
            logger.error(f"Failed to compile final report: {e}")
            # Fallback report compilation
            return {
                "overall_readiness": overall_score_pct,
                "overall_score": overall_score_pct,
                "technical_score": overall_score_pct,
                "communication_score": 75.0,
                "problem_solving_score": 75.0,
                "confidence_score": 75.0,
                "grammar_score": 80.0,
                "strong_topics": ["General Coding Principles"],
                "weak_topics": ["System Scalability and Edge Cases"],
                "recruiter_summary": "Candidate shows good foundational knowledge. Evaluation was compiled with fallback metrics.",
                "recruiter_verdict": "Suitable for Interview",
                "recommended_technologies": ["Docker", "Redis"],
                "estimated_preparation_time": "14 Days",
                "analytics": {
                    "average_score": overall_score_pct,
                    "average_answer_length": "N/A",
                    "hardest_question": "N/A",
                    "weakest_topic": "N/A",
                    "strongest_topic": "N/A"
                }
            }

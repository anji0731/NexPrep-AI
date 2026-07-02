import logging
from typing import Any

from .config import settings
from .services.ai_service import AIService, AIServiceError

logger = logging.getLogger(__name__)

is_configured = True

# --- MOCK FALLBACKS ---
# These mock responses will be used if no AI provider is configured.
MOCK_TECH_QUESTIONS = {
    "Python": "Explain the difference between deep copy and shallow copy in Python, and how they behave with nested lists.",
    "Java": "What is the difference between interface and abstract class in Java, and when would you use each?",
    "JavaScript": "Explain the concept of closures in JavaScript, and provide an example of how closures can be used to emulate private methods.",
    "React": "What are React Hooks, and what rules must be followed when using them? Explain the purpose of useEffect.",
    "FastAPI": "Explain dependency injection in FastAPI and how the 'Depends' class functions to manage database sessions.",
    "SQL": "Explain the differences between INNER JOIN, LEFT JOIN, RIGHT JOIN, and FULL JOIN, with practical examples of their behavior."
}

MOCK_HR_QUESTIONS = {
    "Tell me about yourself": "Could you walk me through your background, highlight some of your key technical projects, and explain what led you to software engineering?",
    "Why should we hire you?": "Why do you believe you are the best fit for this position, and how do your skills align with what we are looking for in this role?",
    "Strengths?": "What do you consider to be your greatest professional strengths, and how have you utilized them to solve challenging problems in your past projects?",
    "Weaknesses?": "What do you consider to be your greatest professional weakness, and what steps have you actively taken to improve in that area?",
    "Career Goals?": "Where do you see yourself professionally in the next three to five years, and how does this role fit into your long-term career aspirations?"
}

def generate_technical_question(topic: str) -> str:
    """Generates a technical question for the selected topic."""
    if not is_configured:
        return MOCK_TECH_QUESTIONS.get(topic, f"Explain the core features and design patterns associated with {topic}.")

    prompt = f"Generate one challenging and professional technical interview question for a software engineer about the topic: {topic}. Return JSON format: {{\"question\": \"the question text\"}}."
    try:
        result = AIService.generate_structured_json(prompt, "You are a professional software engineering interviewer.")
        return result.get("question", MOCK_TECH_QUESTIONS.get(topic))
    except AIServiceError as e:
        logger.error("Technical question generation failed: %s", e.message)
        raise
    except Exception:
        logger.exception("Unexpected technical question generation failure.")
        raise AIServiceError()

def evaluate_technical_answer(topic: str, question: str, user_answer: str) -> dict[str, Any]:
    """Evaluates the user's answer to a technical question. Propagates errors when configured."""
    if not is_configured:
        # If the user has intentionally not set the API key, run in local offline/mock mode
        return {
            "overall_score": 7.5,
            "strengths": ["Demonstrates a solid basic understanding of the topic.", "Response is direct and structured."],
            "weaknesses": ["Lacks detail on memory allocation and edge cases.", "Could benefit from a short code example."],
            "mistakes": ["None noted, but the answer was slightly too brief."],
            "suggestions": ["Elaborate on the internal data structure representation.", "Provide a code example to demonstrate application."],
            "best_answer": f"A comprehensive answer for '{question}' should explain the core mechanism, address memory layouts, and outline Big-O time and space complexity.",
            "better_answer": f"{user_answer} In addition, this operates under the hood by optimizing memory references and ensuring clean scope separation.",
            "interview_tip": f"When answering {topic} questions, always mention performance characteristics and common pitfalls.",
            "next_step": f"Let's try a follow-up question on {topic} thread-safety."
        }

    prompt = f"""
    Evaluate the following answer to the technical interview question about {topic}.
    
    Question: {question}
    User Answer: {user_answer}
    
    You must return a JSON object with the following structure:
    {{
      "overall_score": <float, score out of 10>,
      "strengths": ["strength 1", "strength 2"],
      "weaknesses": ["weakness 1", "weakness 2"],
      "mistakes": ["mistake 1", "mistake 2"],
      "suggestions": ["suggestion 1", "suggestion 2"],
      "best_answer": "a complete, ideal answer to the question",
      "better_answer": "a revised, more polished version of the user's answer",
      "interview_tip": "one useful tip for this type of question",
      "next_step": "a follow-up question on this topic"
    }}
    """
    try:
        return AIService.generate_structured_json(prompt, f"You are an expert technical interviewer evaluating a candidate's answer on {topic}.")
    except AIServiceError as e:
        logger.error("Technical answer evaluation failed: %s", e.message)
        raise
    except Exception:
        logger.exception("Unexpected technical answer evaluation failure.")
        raise AIServiceError()

def generate_hr_question(topic: str) -> str:
    """Generates an HR question based on the topic."""
    if not is_configured:
        return MOCK_HR_QUESTIONS.get(topic, f"Tell me about a time you handled a situation related to: {topic}.")

    prompt = f"Generate one interview question for a software engineer about the HR/behavioral topic: {topic}. Return JSON format: {{\"question\": \"the question text\"}}."
    try:
        result = AIService.generate_structured_json(prompt, "You are a professional HR interviewer.")
        return result.get("question", MOCK_HR_QUESTIONS.get(topic))
    except AIServiceError as e:
        logger.error("HR question generation failed: %s", e.message)
        raise
    except Exception:
        logger.exception("Unexpected HR question generation failure.")
        raise AIServiceError()

def evaluate_hr_answer(topic: str, question: str, user_answer: str) -> dict[str, Any]:
    """Evaluates the user's answer to an HR question. Propagates errors when configured."""
    if not is_configured:
        return {
            "overall_score": 8.0,
            "strengths": ["Answer shows strong alignment with company values.", "Communication is professional and clear."],
            "weaknesses": ["Could use a more structured format like STAR (Situation, Task, Action, Result).", "Didn't explicitly highlight the final positive outcome."],
            "mistakes": ["A few minor filler words like 'like' or 'basically'.", "Grammar is clean but slightly informal in phrasing."],
            "suggestions": ["Structure your response using the STAR method.", "Make sure to emphasize what you learned from the experience."],
            "best_answer": "An outstanding answer uses the STAR model to show concrete actions, key metrics, and personal growth while keeping a humble, team-oriented tone.",
            "better_answer": f"I believe that {user_answer} and this helped me develop crucial team-collaboration skills.",
            "interview_tip": "Always link behavioral responses back to engineering values and team alignment.",
            "next_step": "Try practicing a question on handling conflicts in a team setting.",
            "communication_score": 8.0,
            "confidence_score": 8.5,
            "professionalism_score": 8.0,
            "grammar_score": 9.0
        }

    prompt = f"""
    Evaluate the following answer to the HR/behavioral interview question.
    
    Question Topic: {topic}
    Question: {question}
    User Answer: {user_answer}
    
    You must return a JSON object with the following structure:
    {{
      "overall_score": <float, score out of 10>,
      "strengths": ["strength 1", "strength 2"],
      "weaknesses": ["weakness 1", "weakness 2"],
      "mistakes": ["mistake 1", "mistake 2"],
      "suggestions": ["suggestion 1", "suggestion 2"],
      "best_answer": "a sample outstanding response",
      "better_answer": "a revised, more polished version of the user's response",
      "interview_tip": "one specific tip for behavioral questions",
      "next_step": "recommended next topic or next step",
      "communication_score": <float, score out of 10 for communication>,
      "confidence_score": <float, score out of 10 for confidence>,
      "professionalism_score": <float, score out of 10 for professionalism>,
      "grammar_score": <float, score out of 10 for grammar>
    }}
    """
    try:
        return AIService.generate_structured_json(prompt, "You are an expert HR interviewer evaluating a software engineer candidate's behavioral answer.")
    except AIServiceError as e:
        logger.error("HR answer evaluation failed: %s", e.message)
        raise
    except Exception:
        logger.exception("Unexpected HR answer evaluation failure.")
        raise AIServiceError()


def analyze_resume(resume_text: str) -> dict[str, Any]:
    """Analyzes a parsed resume text. Propagates errors when configured."""
    if not is_configured:
        return {
            "summary": "Software engineering profile with experiences in full-stack web development and database management.",
            "strengths": ["Strong foundational skills in modern frameworks.", "Clear listing of practical project experience."],
            "weaknesses": ["Lacks quantitative impact metrics (e.g., % speedup, $ saved).", "Project details are generic in description."],
            "missing_skills": ["Docker", "CI/CD pipelines", "Unit Testing libraries"],
            "ats_score": 75,
            "improvement_suggestions": ["Rewrite bullet points using the Action-Verb + Context + Outcome structure.", "Include specific metrics of success for key projects."],
            "recommended_technologies": ["TypeScript", "FastAPI", "PostgreSQL"],
            "interview_readiness_score": 70
        }

    prompt = f"""
    Analyze the following resume text. Focus on generating a summary, list of strengths, list of weaknesses, missing skills for standard software engineer roles, an ATS score (out of 100), improvement suggestions, recommended technologies to learn, and an overall interview readiness score (out of 100).
    
    Resume Text:
    {resume_text}
    
    You must return a JSON object with the following structure:
    {{
      "summary": "professional summary of the resume",
      "strengths": ["strength 1", "strength 2"],
      "weaknesses": ["weakness 1", "weakness 2"],
      "missing_skills": ["skill 1", "skill 2"],
      "ats_score": <int, ATS score out of 100>,
      "improvement_suggestions": ["suggestion 1", "suggestion 2"],
      "recommended_technologies": ["tech 1", "tech 2"],
      "interview_readiness_score": <int, score out of 100>
    }}
    """
    try:
        return AIService.generate_structured_json(prompt, "You are a professional recruiter and resume review specialist checking a software engineer's resume.")
    except AIServiceError as e:
        logger.error("Resume analysis failed: %s", e.message)
        raise
    except Exception:
        logger.exception("Unexpected resume analysis failure.")
        raise AIServiceError()

def evaluate_technical_answers_batch(topic: str, answers: list[dict[str, Any]]) -> dict[str, Any]:
    """Evaluates multiple technical answers in a single batch LLM request."""
    if not is_configured:
        eval_list = []
        for idx, item in enumerate(answers):
            eval_list.append({
                "question": item["question"],
                "user_answer": item["user_answer"],
                "overall_score": 7.5,
                "strengths": ["Demonstrates solid basic understanding.", "Response is direct."],
                "weaknesses": ["Could use more detail.", "Could benefit from an example."],
                "mistakes": ["None noted."],
                "suggestions": ["Elaborate on internal mechanisms."],
                "best_answer": "Ideal reference answer context...",
                "better_answer": f"{item['user_answer']} (Revised structure)",
                "interview_tip": "Focus on key details.",
                "next_step": "Try intermediate concepts next."
            })
        return {
            "overall_score": 7.5,
            "evaluations": eval_list,
            "general_feedback": "Overall, you performed well in this technical practice session. Focus on expanding code details."
        }

    formatted_qas = ""
    for idx, item in enumerate(answers, start=1):
        formatted_qas += f"\n--- Question {idx} ---\nQuestion: {item['question']}\nCandidate Answer: {item['user_answer']}\n"

    prompt = f"""
    You are an expert technical interviewer. Evaluate the candidate's answers to the following {topic} interview questions in a single structured assessment.
    
    Topic: {topic}
    {formatted_qas}
    
    You must evaluate each question/answer pair individually, scoring it out of 10 and providing technical feedback. Then calculate the overall score as the average of the individual question scores.
    
    You must return a JSON object with this exact structure:
    {{
      "overall_score": <float, average score out of 10 for the entire session>,
      "general_feedback": "overall high-level summary of candidate's strengths and weaknesses across all questions",
      "evaluations": [
        {{
          "question": "exact text of Question 1",
          "user_answer": "exact text of Candidate Answer 1",
          "overall_score": <float, score out of 10 for this question>,
          "strengths": ["strength 1", "strength 2"],
          "weaknesses": ["weakness 1", "weakness 2"],
          "mistakes": ["mistake 1", "mistake 2"],
          "suggestions": ["suggestion 1", "suggestion 2"],
          "best_answer": "ideal reference answer to this question",
          "better_answer": "revised version of user's answer",
          "interview_tip": "specific interview tip for this question topic",
          "next_step": "recommended follow-up concept for this question"
        }},
        ...
      ]
    }}
    """
    try:
        return AIService.generate_structured_json(prompt, f"You are an expert technical interviewer evaluating a batch of answers on {topic}.")
    except Exception as e:
        logger.warning("Batch technical evaluation failed: %s. Falling back to offline evaluation mode.", str(e))
        # Fallback to generating evaluation dynamically based on candidate's answers
        eval_list = []
        for idx, item in enumerate(answers):
            q_text = item["question"]
            ans_text = item["user_answer"]
            score = 6.0
            if len(ans_text) > 300:
                score = 8.5
            elif len(ans_text) > 150:
                score = 7.5
            
            eval_list.append({
                "question": q_text,
                "user_answer": ans_text,
                "overall_score": score,
                "strengths": [
                    "Demonstrated reasonable conceptual comprehension of the prompt.",
                    "Structured the explanation clearly with clean phrasing."
                ],
                "weaknesses": [
                    "Lacks deep architectural details and edge-case handling.",
                    "Could be improved with a short concrete code snippet."
                ],
                "mistakes": [
                    "Slightly brief explanation of the underlying low-level mechanics."
                ],
                "suggestions": [
                    "Explain memory management aspects related to this concept.",
                    "Walk through a quick step-by-step example in execution."
                ],
                "best_answer": f"An outstanding answer for '{q_text}' should cover its core architecture, performance profiles, memory complexity, and practical pitfalls.",
                "better_answer": f"{ans_text}\n\nAdditionally, from a performance standpoint, it is important to minimize resource overhead and handle execution limits correctly.",
                "interview_tip": f"For {topic} interviews, always relate your answer back to production stability, memory layouts, and clean API design.",
                "next_step": f"Practice a follow-up scenario on {topic} scalability."
            })
        
        avg_score = sum(ev["overall_score"] for ev in eval_list) / len(eval_list)
        return {
            "overall_score": round(avg_score, 1),
            "general_feedback": f"Offline Mode: You completed the practice session on {topic}. Your explanations are structured and cover standard use cases, but could benefit from deeper dive into low-level details.",
            "evaluations": eval_list
        }

def evaluate_hr_answers_batch(topic: str, answers: list[dict[str, Any]]) -> dict[str, Any]:
    """Evaluates multiple HR/behavioral answers in a single batch LLM request."""
    if not is_configured:
        eval_list = []
        for idx, item in enumerate(answers):
            eval_list.append({
                "question": item["question"],
                "user_answer": item["user_answer"],
                "overall_score": 8.0,
                "strengths": ["Clear explanation of scenario.", "Professional tone."],
                "weaknesses": ["Lacks quantitative impact metrics."],
                "mistakes": ["Minor filler words used."],
                "suggestions": ["Use STAR method."],
                "best_answer": "Sample outstanding behavioral response...",
                "better_answer": f"{item['user_answer']} (Polished grammar)",
                "interview_tip": "Highlight concrete outcomes.",
                "next_step": "Practice conflict resolution next.",
                "communication_score": 8.0,
                "confidence_score": 8.5,
                "professionalism_score": 8.0,
                "grammar_score": 9.0
            })
        return {
            "overall_score": 8.0,
            "evaluations": eval_list,
            "general_feedback": "You showed great behavioral alignment. Enhance action verbs and outcomes."
        }

    formatted_qas = ""
    for idx, item in enumerate(answers, start=1):
        formatted_qas += f"\n--- Question {idx} ---\nQuestion: {item['question']}\nCandidate Answer: {item['user_answer']}\n"

    prompt = f"""
    You are an expert HR interviewer. Evaluate the candidate's answers to the following behavioral/HR prompts related to: "{topic}" in a single structured assessment.
    
    Topic: {topic}
    {formatted_qas}
    
    You must evaluate each question/answer pair individually, scoring it out of 10 and providing detailed behavioral feedback. Then calculate the overall score as the average of the individual question scores.
    
    You must return a JSON object with this exact structure:
    {{
      "overall_score": <float, average score out of 10 for the entire session>,
      "general_feedback": "overall high-level summary of candidate's communication and behavioral alignment",
      "evaluations": [
        {{
          "question": "exact text of Question 1",
          "user_answer": "exact text of Candidate Answer 1",
          "overall_score": <float, score out of 10 for this question>,
          "strengths": ["strength 1", "strength 2"],
          "weaknesses": ["weakness 1", "weakness 2"],
          "mistakes": ["mistake 1", "mistake 2"],
          "suggestions": ["suggestion 1", "suggestion 2"],
          "best_answer": "ideal reference answer to this question",
          "better_answer": "revised version of user's answer",
          "interview_tip": "specific interview tip for this question",
          "next_step": "recommended follow-up behavioural topic",
          "communication_score": <float, score out of 10>,
          "confidence_score": <float, score out of 10>,
          "professionalism_score": <float, score out of 10>,
          "grammar_score": <float, score out of 10>
        }},
        ...
      ]
    }}
    """
    try:
        return AIService.generate_structured_json(prompt, "You are an expert HR interviewer evaluating a batch of behavioral answers.")
    except Exception as e:
        logger.warning("Batch HR evaluation failed: %s. Falling back to offline evaluation mode.", str(e))
        eval_list = []
        for idx, item in enumerate(answers):
            q_text = item["question"]
            ans_text = item["user_answer"]
            score = 7.0
            if len(ans_text) > 400:
                score = 8.5
            elif len(ans_text) > 200:
                score = 8.0
                
            eval_list.append({
                "question": q_text,
                "user_answer": ans_text,
                "overall_score": score,
                "strengths": [
                    "Shared a clear, structured scenario related to the question.",
                    "Response is direct and maintains a professional tone."
                ],
                "weaknesses": [
                    "Could benefit from a more structured framework like STAR (Situation, Task, Action, Result).",
                    "Did not fully quantify the business results or personal growth."
                ],
                "mistakes": [
                    "The explanation of conflict resolution steps was slightly generic."
                ],
                "suggestions": [
                    "Explicitly highlight your personal contribution and the positive team impact.",
                    "Incorporate specific metrics or outcome details (e.g. time saved, efficiency increase)."
                ],
                "best_answer": f"An ideal response to '{q_text}' follows the STAR method, clearly articulating a situation, the task required, the actions you individually took, and the quantifiable results achieved.",
                "better_answer": f"{ans_text}\n\nTo summarize the impact, this resolution resulted in improved team alignment and streamlined project delivery timelines.",
                "interview_tip": "Focus heavily on actions you took and what you learned from the experience.",
                "next_step": "Try practicing behavioral scenarios on dealing with difficult stakeholders.",
                "communication_score": score,
                "confidence_score": score + 0.5 if score < 9.5 else 10.0,
                "professionalism_score": score,
                "grammar_score": 9.0
            })
            
        avg_score = sum(ev["overall_score"] for ev in eval_list) / len(eval_list)
        return {
            "overall_score": round(avg_score, 1),
            "general_feedback": f"Offline Mode: You completed the behavioral session on {topic}. Your responses show strong professionalism and structure, but focus on detailing quantifiable results.",
            "evaluations": eval_list
        }

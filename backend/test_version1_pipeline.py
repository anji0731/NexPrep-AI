import sys
import os
import json

# Add parent directory to path so we can import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.ats_engine import ATSEngine
from app.services.question_generator import QuestionGenerator
from app.services.interview_evaluator import InterviewEvaluator
from app.services.roadmap_generator import RoadmapGenerator

def run_tests():
    print("=======================================================")
    # 1. Test Deterministic ATS Engine
    print("Testing ATSEngine.calculate_ats_score...")
    resume_text = """
    Jane Doe
    jane.doe@example.com | linkedin.com/in/janedoe | github.com/janedoe
    
    Education:
    Bachelor of Science in Computer Science, University of Technology
    
    Skills:
    Python, React, AWS, Docker, Git, SQL, TailwindCSS
    
    Experience:
    Software Engineer at Tech Corp (2024 - Present)
    - Managed and improved application speed by 25%.
    - Developed APIs and scaled database services using Python.
    """
    
    jd = "We are seeking a Python developer with React experience to build scaling Docker backend structures."
    
    ats_results = ATSEngine.calculate_ats_score(resume_text, jd)
    print("ATS Score Result JSON:")
    print(json.dumps(ats_results, indent=2))
    
    assert ats_results["ats_score"] > 40, "ATS Score should be > 40"
    assert "python" in ats_results["skills_matched"], "Skills matched should find python"
    assert ats_results["keyword_coverage"] > 0, "Keyword coverage should be > 0"
    print("[OK] ATSEngine test PASSED!\n")

    # 2. Test Question Generator Pool Creation
    print("=======================================================")
    print("Testing QuestionGenerator.generate_question_pool...")
    resume_context = "Candidate has 2 years of experience building Python APIs and React frontends at Tech Corp."
    
    questions = QuestionGenerator.generate_question_pool(resume_context, jd)
    print(f"Generated {len(questions)} questions in pool.")
    if questions:
        print("Sample Question JSON:")
        print(json.dumps(questions[0], indent=2))
        
    assert len(questions) > 0, "Should generate questions"
    assert "question" in questions[0], "Question should have text"
    assert "difficulty" in questions[0], "Question should have difficulty"
    print("[OK] QuestionGenerator test PASSED!\n")

    # 3. Test Interview Evaluator On-The-Fly
    print("=======================================================")
    print("Testing InterviewEvaluator.evaluate_answer_on_the_fly...")
    question = "How do you handle connection pooling in FastAPI?"
    expected = "Use database session pools (like SQLAlchemy async_sessionmaker or asyncpg pool) and close connections on teardown."
    answer = "I use SQLAlchemy sessionmaker to create scoped sessions and close them using dependency injection Yield."
    
    evaluation = InterviewEvaluator.evaluate_answer_on_the_fly(question, expected, answer)
    print("On-the-fly Evaluation Result JSON:")
    print(json.dumps(evaluation, indent=2))
    
    assert evaluation["score"] > 0.0, "Evaluation score should be > 0"
    print("[OK] InterviewEvaluator test PASSED!\n")

    # 4. Test Roadmap Generator
    print("=======================================================")
    print("Testing RoadmapGenerator.generate_roadmap...")
    weak = ["Docker container scaling", "FastAPI connection pooling"]
    strong = ["React components design", "Tailwind CSS styling"]
    recruiter_summary = "Candidate is strong on the frontend side but lacks production deployment practices with Docker and databases."
    
    roadmap = RoadmapGenerator.generate_roadmap(weak, strong, recruiter_summary)
    print("Roadmap Result JSON:")
    print(json.dumps(roadmap, indent=2))
    
    assert "seven_day_plan" in roadmap, "Roadmap should have seven_day_plan"
    assert "recommended_technologies" in roadmap, "Roadmap should have recommended_technologies"
    print("[OK] RoadmapGenerator test PASSED!\n")
    print("=======================================================")
    print("ALL AI PIPELINE SERVICES VERIFIED SUCCESSFULLY!")
    print("=======================================================")

if __name__ == "__main__":
    run_tests()

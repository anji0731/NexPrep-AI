import os
import sys
from dotenv import load_dotenv

# Force load backend .env
load_dotenv()

# Add backend root to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.ai_service import AIService
from app.gemini import generate_technical_question

print("Testing AIService (Groq)...")
try:
    res = AIService.generate_structured_json(
        prompt="Output a simple JSON object containing a 'status' field with value 'success' and 'message' field with value 'Hello Groq'.",
        system_instruction="You must output JSON."
    )
    print("AIService Result:", res)
except Exception as e:
    print("AIService Error:")
    import traceback
    traceback.print_exc()

print("\nTesting gemini.py generate_technical_question (Groq)...")
try:
    q = generate_technical_question("Python")
    print("Question:", q)
except Exception as e:
    print("gemini.py Error:")
    import traceback
    traceback.print_exc()

import os
from dotenv import load_dotenv
from google import genai

# Load same .env
load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")

try:
    # Initialize Gemini
    client = genai.Client(api_key=api_key)
    
    # Send "Hello"
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents="Hello"
    )
    
    # Print the response
    print(response.text)
    
except Exception as e:
    # Print complete exception
    import traceback
    traceback.print_exc()

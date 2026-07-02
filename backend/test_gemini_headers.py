import os
import httpx
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

print(f"Testing API key starting with: {api_key[:10]}...")

# 1. Test standard way (x-goog-api-key header)
print("\n--- Test 1: x-goog-api-key header ---")
try:
    r = httpx.post(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
        headers={
            "Content-Type": "application/json",
            "x-goog-api-key": api_key
        },
        json={"contents": [{"parts": [{"text": "Hello"}]}]}
    )
    print(f"Status Code: {r.status_code}")
    print(f"Response: {r.text[:300]}")
except Exception as e:
    print(f"Error: {e}")

# 2. Test query parameter (?key=)
print("\n--- Test 2: Query parameter (?key=) ---")
try:
    r = httpx.post(
        f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}",
        headers={
            "Content-Type": "application/json"
        },
        json={"contents": [{"parts": [{"text": "Hello"}]}]}
    )
    print(f"Status Code: {r.status_code}")
    print(f"Response: {r.text[:300]}")
except Exception as e:
    print(f"Error: {e}")

# 3. Test Authorization Bearer header
print("\n--- Test 3: Authorization: Bearer header ---")
try:
    r = httpx.post(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}"
        },
        json={"contents": [{"parts": [{"text": "Hello"}]}]}
    )
    print(f"Status Code: {r.status_code}")
    print(f"Response: {r.text[:300]}")
except Exception as e:
    print(f"Error: {e}")


import os
import time
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY"),
    http_options=types.HttpOptions(
        api_version="v1beta",
        timeout=30000,
        retry_options=types.HttpRetryOptions(attempts=1),
    ),
)

start = time.perf_counter()

try:
    response = client.models.generate_content(
        model="gemini-3.5-flash",
        contents="Reply with exactly: VoiceCart is ready",
        config=types.GenerateContentConfig(
            thinking_config=types.ThinkingConfig(
                thinking_level=types.ThinkingLevel.MINIMAL
            ),
            max_output_tokens=50,
        ),
    )
    print("RESPONSE:", response.text)
    print("USAGE:", response.usage_metadata)
    print("MODEL:", response.model_version)
except Exception as e:
    print("ERROR:", repr(e))
finally:
    print("TIME:", round(time.perf_counter() - start, 2), "seconds")

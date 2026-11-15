
import os
import time

from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY")
MODEL = os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite")

if not API_KEY:
    raise ValueError("GEMINI_API_KEY missing in .env")

client = genai.Client(
    api_key=API_KEY,
    http_options={"api_version": "v1beta"}
)

# SESSION-BASED CONVERSATION STORAGE
conversation_sessions = {}

SYSTEM_INSTRUCTION = """
You are VoiceCart AI, a friendly Tamil-first shopping assistant.

Your purpose:
Help people, especially users unfamiliar with online shopping,
complete shopping step by step.

Rules:
1. Speak naturally in simple Tamil.
2. Understand Tamil, English and Tanglish.
3. Ask one question at a time.
4. Never overwhelm the user with technical terms.
5. Help users discover and understand products.
6. Never invent prices, stock or delivery information.
7. Explain payment options clearly.
8. Never request OTP, UPI PIN or card PIN.
9. Always obtain explicit confirmation before placing an order.
10. Be patient, friendly and respectful.
11. When a user asks for products, use the search_products tool.
12. Recommend only products returned by the product catalogue.
13. Never change catalogue prices or stock quantities.
14. Remember the current conversation context.
15. Never mix information between different sessions.
16. Keep responses concise and conversational.

Start by asking what the user wants to buy.
"""


# PRODUCT SEARCH TOOL
def search_products_tool(category: str, max_price: int = None):
    from products import search_products

    results = search_products(
        category=category,
        max_price=max_price
    )

    return {
        "count": len(results),
        "products": results
    }


# GEMINI FUNCTION DECLARATION
search_products_declaration = types.FunctionDeclaration(
    name="search_products",
    description=(
        "Search the verified VoiceCart product catalogue "
        "using category and maximum price."
    ),
    parameters={
        "type": "OBJECT",
        "properties": {
            "category": {
                "type": "STRING",
                "description": (
                    "Product category, such as cooker, "
                    "mixer, fan or rice cooker."
                )
            },
            "max_price": {
                "type": "INTEGER",
                "description": "Maximum budget in Indian rupees."
            }
        },
        "required": ["category"]
    }
)

tools = [
    types.Tool(
        function_declarations=[search_products_declaration]
    )
]


# GEMINI 3.5 FLASH-LITE CONFIGURATION
GENERATION_CONFIG = types.GenerateContentConfig(
    system_instruction=SYSTEM_INSTRUCTION,
    thinking_config=types.ThinkingConfig(
        thinking_level=types.ThinkingLevel.LOW
    ),
    tools=tools,
    max_output_tokens=512
)


# SESSION-BASED GEMINI CHAT
def chat_with_agent(message: str, session_id: str):

    total_start = time.perf_counter()

    # Get or create conversation history
    history = conversation_sessions.setdefault(session_id, [])

    # Add user message
    history.append(
        types.Content(
            role="user",
            parts=[
                types.Part.from_text(text=message)
            ]
        )
    )

    # Gemini tool-calling loop
    for attempt in range(3):

        call_start = time.perf_counter()

        try:
            response = client.models.generate_content(
                model=MODEL,
                contents=history,
                config=GENERATION_CONFIG
            )

        except Exception as error:
            print(
                f"GEMINI ERROR: {type(error).__name__}: {error!r}"
            )
            raise

        gemini_time = time.perf_counter() - call_start

        print(
            f"[VoiceCart] Gemini call {attempt + 1}: "
            f"{gemini_time:.2f}s"
        )

        if not response.candidates:
            raise ValueError(
                "Gemini returned no response candidates"
            )

        model_content = response.candidates[0].content

        # Save Gemini response in conversation history
        history.append(model_content)

        # Check whether Gemini requested a tool
        function_calls = response.function_calls

        # No tool call: return final response
        if not function_calls:

            total_time = time.perf_counter() - total_start

            print(
                f"[VoiceCart] Total response time: "
                f"{total_time:.2f}s"
            )

            return response.text

        function_response_parts = []

        # Execute requested functions
        for function_call in function_calls:

            if function_call.name == "search_products":

                args = function_call.args or {}

                product_results = search_products_tool(
                    category=args["category"],
                    max_price=args.get("max_price")
                )

                # SDK 3.3.0 compatible function response
                function_response = types.FunctionResponse(
                    name=function_call.name,
                    response=product_results,
                    id=function_call.id
                )

                tool_response = types.Part(
                    function_response=function_response
                )

                function_response_parts.append(tool_response)

        if not function_response_parts:
            raise RuntimeError(
                "Gemini requested an unsupported function"
            )

        # Send actual catalogue results back to Gemini
        history.append(
            types.Content(
                role="user",
                parts=function_response_parts
            )
        )

    raise RuntimeError(
        "Gemini exceeded the tool-call limit"
    )

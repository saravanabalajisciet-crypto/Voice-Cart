
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from agent import chat_with_agent
from products import search_products

app = FastAPI(
    title="VoiceCart AI",
    description="Tamil-first AI Shopping Agent",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# CHAT REQUEST MODEL WITH SESSION SUPPORT
class ChatRequest(BaseModel):
    message: str
    session_id: str


@app.get("/")
@app.get("/api")
def home():
    return {
        "message": "வணக்கம்! VoiceCart AI தயாராக உள்ளது."
    }


@app.get("/health")
@app.get("/api/health")
def health():
    return {
        "status": "healthy",
        "service": "VoiceCart AI Backend"
    }


# PRODUCT CATALOGUE SEARCH
@app.get("/products")
@app.get("/api/products")
def get_products(category: str, max_price: int = None):
    products = search_products(category, max_price)

    return {
        "count": len(products),
        "products": products
    }


# SESSION-BASED AI CHAT
@app.post("/chat")
@app.post("/api/chat")
def chat(request: ChatRequest):
    try:
        reply = chat_with_agent(
            message=request.message,
            session_id=request.session_id
        )

        return {
            "session_id": request.session_id,
            "reply": reply
        }

    except Exception as e:
        print("GEMINI ERROR:", repr(e))

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

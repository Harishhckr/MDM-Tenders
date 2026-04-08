"""
AI Chat API Routes - True General-Purpose Chatbot
Every message goes to Ollama. No templates. Real AI answers.
"""
import re
import json
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import Optional
from app.database import get_db
from app.ai.services.intent_parser import get_intent_parser
from app.ai.services.tender_agent import TenderAgent
from app.ai.memory.conversation_store import get_conversation_store
from app.ai.llm.ollama_client import get_ollama_client
from app.utils.logger import get_logger

router = APIRouter(prefix="/api/ai", tags=["ai-chat"])
logger = get_logger("ai.routes")

# ---------------------------------------------------------------------------
# System prompt — defines Leonex AI full personality
# ---------------------------------------------------------------------------
SYSTEM_PROMPT = (
    "You are Leonex AI, a highly intelligent and friendly AI assistant created by Leonex Systems Pvt. Ltd. (https://leonex.net/).\n"
    "\n"
    "You are a general-purpose assistant — like ChatGPT — and you can answer questions about ANY topic:\n"
    "- Sports: football, cricket, IPL, FIFA, chess, badminton, and more\n"
    "- Movies, cinema, web series, actors, music, entertainment\n"
    "- Technology, software, programming, AI, hardware\n"
    "- Science, history, geography, economics, politics\n"
    "- Business, startups, finance, management\n"
    "- Casual chat, jokes, creative writing, brainstorming\n"
    "- Indian government tenders, procurement, MDM — your core specialty\n"
    "\n"
    "Your personality and rules:\n"
    "- Be warm, confident, natural — exactly like ChatGPT\n"
    "- NEVER refuse to answer a general knowledge question\n"
    "- NEVER say you can only talk about tenders\n"
    "- Respond in the same language the user uses (English, Tamil, Tanglish, Hindi, mix)\n"
    "- You ARE Leonex AI — never call yourself just an AI language model\n"
    "- Use markdown formatting (bold, bullets, headers) when it improves clarity\n"
    "- When given live tender database context, use it accurately in your answer\n"
    "- Keep responses genuinely helpful and complete\n"
)

# Detect tender-related messages to enrich with DB context
_TENDER_RE = re.compile(
    r"tender|procurement|bid|mdm|master\s+data|gem\s+portal|eprocure|"
    r"government\s+contract|rfp|rfq|nit|data\s+governance|material\s+codification|"
    r"expiring|deadline|high.value|crore|lakh",
    re.IGNORECASE,
)


def _is_tender_query(msg: str) -> bool:
    return bool(_TENDER_RE.search(msg))


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=4000)
    session_id: Optional[str] = None


class ChatResponseModel(BaseModel):
    message: str
    session_id: str
    intent: str
    data: Optional[list] = None
    source_count: int = 0


@router.post("/chat", response_model=ChatResponseModel)
async def chat(req: ChatRequest, db: Session = Depends(get_db)):
    """
    Send every message to Ollama. Only add live tender DB context
    when the message is clearly about tenders.
    """
    store  = get_conversation_store()
    parser = get_intent_parser()
    ollama = get_ollama_client()

    session_id = req.session_id or store.create_session()
    store.add_message(session_id, "user", req.message)
    history = store.format_history_for_prompt(session_id)
    logger.info("Chat session=%s msg=%r", session_id, req.message[:80])

    db_context = ""
    intent = "general"
    data = None

    # Enrich with live data only if the message is about tenders
    if _is_tender_query(req.message):
        parsed   = parser.parse(req.message)
        intent   = parsed["intent"]
        entities = parsed["entities"]
        agent = TenderAgent(db)
        try:
            if intent == "search":
                data = agent.search_tenders(entities, limit=10)
            elif intent == "stats":
                data = agent.get_statistics()
            elif intent == "expiring":
                data = agent.get_expiring_tenders(entities.get("days", 7), limit=10)
            elif intent == "high_value":
                data = agent.get_high_value_tenders(entities.get("value_min", 10000000), limit=10)
            elif intent == "recent":
                data = agent.get_recent_tenders(entities.get("days", 3), limit=10)
            else:
                data = agent.search_tenders(entities, limit=10)
        except Exception as exc:
            logger.error("TenderAgent error: %s", exc)

        if isinstance(data, list) and data:
            db_context = "\n\n[LIVE TENDER DATABASE]\n"
            for t in data[:5]: # Limit to 5 for context
                if isinstance(t, dict):
                    db_context += "- ID: {0} | {1}\n  Source: {2} | Expires: {3} | Location: {4}\n".format(
                            t.get("tender_id","?"), t.get("title","...")[:100],
                            t.get("source","?"), t.get("end_date","?"), t.get("location","N/A"))
        elif isinstance(data, dict):
            db_context = "\n\n[LIVE TENDER DATABASE]\n" + json.dumps(data, indent=2, default=str)[:600]

    history_block = ("\n\n[CONVERSATION HISTORY]\n" + history) if history else ""
    full_prompt = SYSTEM_PROMPT + history_block + db_context + "\n\nUser: " + req.message + "\n\nLeonex AI:"

    async def event_generator():
        # 1. Send initial metadata packet
        meta = {
            "type": "meta",
            "session_id": session_id,
            "intent": intent,
            "source_count": len(data) if isinstance(data, list) else 0,
            "data": data if isinstance(data, list) and data else None, # Include data in meta for client
        }
        yield f"data: {json.dumps(meta)}\n\n"

        # 2. Stream AI generation
        full_response = ""
        if not ollama.is_available:
            err = "My AI engine (Ollama / DeepSeek) is currently offline. Please ensure it's running."
            yield f"data: {json.dumps({'type': 'chunk', 'text': err})}\n\n"
            full_response = err
        else:
            try:
                async for chunk in ollama.generate_stream(prompt=full_prompt, system_prompt=None):
                    if chunk:
                        # We will stream the raw chunk
                        full_response += chunk
                        yield f"data: {json.dumps({'type': 'chunk', 'text': chunk})}\n\n"
            except Exception as exc:
                logger.error("Ollama streaming error: %s", exc)
                err = f"An error occurred during AI generation: {str(exc)}"
                yield f"data: {json.dumps({'type': 'chunk', 'text': err})}\n\n"
                full_response += err # Append error to full_response for storage

            # Post process: Remove <think> tags from the stored history
            if "<think>" in full_response:
                clean = re.sub(r"<think>.*?</think>", "", full_response, flags=re.DOTALL).strip()
                if clean:
                    full_response = clean

        # 3. Complete and store
        store.add_message(session_id, "assistant", full_response.strip())
        yield f"data: {json.dumps({'type': 'done'})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@router.get("/health")
def ai_health():
    ollama = get_ollama_client()
    return {**ollama.status(), "status": "online" if ollama.is_available else "offline - start Ollama"}


@router.get("/suggest")
def ai_suggestions():
    return {"suggestions": [
        {"text": "Find MDM tenders for me",            "icon": "search"},
        {"text": "Show tenders expiring this week",    "icon": "alert-triangle"},
        {"text": "Give me a statistics overview",      "icon": "bar-chart-2"},
        {"text": "Tell me about Leonex Systems",       "icon": "info"},
        {"text": "What can you help me with?",         "icon": "help-circle"},
    ]}

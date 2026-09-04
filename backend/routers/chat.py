import uuid
import sys
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel

router = APIRouter(tags=["Troubleshooting Chat"])

def get_rag_engine():
    main_mod = sys.modules.get('__main__') or sys.modules.get('main')
    return main_mod.rag_engine, main_mod.feedback_db


class ChatRequest(BaseModel):
    question: str
    selected_machine: Optional[str] = None
    manual_id: Optional[str] = None
    machine_id: Optional[str] = None
    manufacturing_year: Optional[str] = None
    target_language: Optional[str] = "English"
    api_key: Optional[str] = None
    previous_context: Optional[Dict[str, Any]] = None

class ClarifyRequest(BaseModel):
    query_term: str
    selected_machine: str

class SearchRequest(BaseModel):
    query: str
    selected_machine: Optional[str] = None

class FeedbackRequest(BaseModel):
    question: str
    answer: str
    feedback_type: str
    comments: Optional[str] = None

@router.post("/chat")
def chat(req: ChatRequest, x_api_key: Optional[str] = Header(None, alias="X-API-Key")):
    rag_engine, _ = get_rag_engine()
    if not req.question or not req.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    api_key_to_use = req.api_key or x_api_key
    try:
        result = rag_engine.query(
            question=req.question.strip(),
            selected_machine=req.selected_machine,
            manual_id=req.manual_id,
            machine_id=req.machine_id,
            manufacturing_year=req.manufacturing_year,
            target_language=req.target_language or "English 🇺🇸",
            api_key=api_key_to_use,
            previous_context=req.previous_context
        )
        return result
    except Exception as e:
        import traceback
        print(f"Error processing RAG query '{req.question}': {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Backend Processing Error: {str(e)}")

@router.post("/chat/clarify")
def clarify_ambiguity(req: ClarifyRequest):
    rag_engine, _ = get_rag_engine()
    result = rag_engine.query(
        question=f"Troubleshoot error code {req.query_term}",
        selected_machine=req.selected_machine
    )
    return result

@router.post("/search")
def global_search(req: SearchRequest):
    rag_engine, _ = get_rag_engine()
    results = rag_engine.store.hybrid_search(req.query, selected_machine=req.selected_machine, top_k=6)
    formatted = []
    for r in results:
        c = r["chunk"]
        formatted.append({
            "machine_name": c["machine_name"],
            "model": c["model"],
            "file_name": c["file_name"],
            "section": c["section"],
            "page_number": c["page_number"],
            "snippet": c["text"],
            "score": round(r["score"], 2)
        })
    return {"results": formatted}

@router.post("/feedback")
def submit_feedback(req: FeedbackRequest):
    _, feedback_db = get_rag_engine()
    entry = {
        "id": f"fb_{uuid.uuid4().hex[:6]}",
        "question": req.question,
        "answer": req.answer[:100],
        "feedback_type": req.feedback_type,
        "comments": req.comments,
        "timestamp": "2026-09-04"
    }
    feedback_db.append(entry)
    return {"message": "Feedback logged successfully.", "feedback_id": entry["id"]}

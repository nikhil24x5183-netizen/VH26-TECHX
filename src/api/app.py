import json
from pathlib import Path
from typing import Optional
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from src.config import settings
from src.api.schemas import QueryRequest, ClearSessionRequest, HealthResponse
from src.pipeline.service import TroubleshootingService
from src.pipeline.confidence_gate import TroubleshootingResponse
from src.query.session_memory import session_manager

app = FastAPI(
    title="Factory Floor RAG Troubleshooting API",
    description="Precision RAG system with cross-document disambiguation and dual-layer hallucination control.",
    version="1.0.0"
)

# Enable CORS for local UI and tools
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize service singleton
service = TroubleshootingService()

@app.get("/")
def read_root():
    return {
        "service": "Factory Floor RAG Troubleshooting Assistant",
        "docs": "/docs",
        "status": "online"
    }

@app.get("/api/health", response_model=HealthResponse)
def health_check():
    registry_data = {}
    if settings.METADATA_REGISTRY_PATH.exists():
        with open(settings.METADATA_REGISTRY_PATH, "r", encoding="utf-8") as f:
            registry_data = json.load(f)

    # Determine provider name
    provider = settings.DEFAULT_LLM_PROVIDER
    if provider == "auto":
        if settings.GEMINI_API_KEY:
            provider = "gemini-2.5-flash"
        elif settings.OPENAI_API_KEY:
            provider = "gpt-4o-mini"
        else:
            provider = "local-deterministic-extractor"

    return HealthResponse(
        status="healthy",
        project_name=settings.PROJECT_NAME,
        total_chunks=registry_data.get("total_chunks", 0),
        machines=registry_data.get("machines", []),
        ambiguous_codes=registry_data.get("ambiguous_codes", {}),
        confidence_threshold=settings.CONFIDENCE_THRESHOLD,
        llm_provider=provider
    )

@app.post("/api/query", response_model=TroubleshootingResponse)
def process_query(req: QueryRequest):
    if not req.query.strip():
        raise HTTPException(status_code=400, detail="Query string cannot be empty.")
    
    response = service.answer_query(
        query=req.query,
        session_id=req.session_id
    )
    return response

@app.post("/api/session/clear")
def clear_session(req: ClearSessionRequest):
    session = session_manager.clear_session(req.session_id)
    return {"status": "cleared", "session_id": session.session_id}

@app.get("/api/session/{session_id}")
def get_session(session_id: str):
    session = session_manager.get_or_create_session(session_id)
    return session

@app.get("/api/manuals")
def list_manuals():
    manuals = []
    for pdf_file in settings.MANUALS_DIR.glob("*.pdf"):
        manuals.append({
            "name": pdf_file.stem.replace("_", " ").title(),
            "filename": pdf_file.name,
            "size_kb": round(pdf_file.stat().st_size / 1024, 1),
            "type": "Manual"
        })
    return {"manuals": manuals, "total_manuals": len(manuals)}

@app.post("/api/upload")
async def upload_manual_local(
    file: UploadFile = File(...),
    machine_name: Optional[str] = Form(None),
    session_id: Optional[str] = Form(None)
):
    from api.index import upload_manual as serverless_upload
    return await serverless_upload(file=file, machine_name=machine_name, session_id=session_id)


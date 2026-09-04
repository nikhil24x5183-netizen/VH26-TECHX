"""
MaintAI FastAPI Backend API Server.
Exposes endpoints for PDF manual ingestion, machine listing, RAG chat query, and sample initialization.
"""

import os
import uuid
from typing import Optional, List
from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from pdf_processor import PDFProcessor
from rag_engine import RAGEngine
from sample_generator import generate_all_samples

app = FastAPI(
    title="MaintAI API",
    description="AI Machine Troubleshooting Assistant Backend",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "..", "data")
MANUALS_DIR = os.path.join(DATA_DIR, "manuals")
SAMPLE_DIR = os.path.join(DATA_DIR, "sample_manuals")

os.makedirs(MANUALS_DIR, exist_ok=True)
os.makedirs(SAMPLE_DIR, exist_ok=True)

pdf_processor = PDFProcessor()
rag_engine = RAGEngine()


class ChatRequest(BaseModel):
    question: str
    selected_machine: Optional[str] = None
    api_key: Optional[str] = None


@app.on_event("startup")
def initialize_app():
    """Generates sample manuals on startup and pre-indexes them."""
    try:
        generate_all_samples(SAMPLE_DIR)
        _index_directory(SAMPLE_DIR)
        print("MaintAI Startup Complete: Real-world industrial machine manuals indexed.")
    except Exception as e:
        print(f"Error initializing sample manuals: {e}")


def _index_directory(directory_path: str):
    """Internal helper to parse and index all PDFs in a directory."""
    if not os.path.exists(directory_path):
        return

    sample_meta = {
        "Siemens_S71500_PLC_Manual.pdf": ("Siemens S7-1500 PLC", "CPU 1516-3 PN/DP"),
        "Cat_C15_Generator_Manual.pdf": ("Caterpillar C15 Generator", "C15-500kVA"),
        "KUKA_KR210_Robot_Manual.pdf": ("KUKA KR 210 Robot", "KR 210 R2700-2"),
        "Fanuc_Robodrill_CNC_Manual.pdf": ("Fanuc Robodrill CNC", "α-D21MiB5")
    }

    for fname in os.listdir(directory_path):
        if fname.endswith(".pdf"):
            fpath = os.path.join(directory_path, fname)
            m_name, model = sample_meta.get(fname, (fname.replace(".pdf", "").replace("_", " "), "Standard"))
            file_id = f"sample_{fname}"
            chunks = pdf_processor.create_chunks(fpath, m_name, model, file_id)
            rag_engine.index_chunks(chunks)


@app.get("/api/health")
def health_check():
    return {
        "status": "online",
        "indexed_machines_count": len(rag_engine.get_machines()),
        "total_chunks": len(rag_engine.store.chunks)
    }


@app.get("/api/machines")
def list_machines():
    return {"machines": rag_engine.get_machines()}


@app.post("/api/upload")
async def upload_manual(
    file: UploadFile = File(...),
    machine_name: str = Form(...),
    model: str = Form(...)
):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    file_id = f"file_{uuid.uuid4().hex[:8]}"
    save_path = os.path.join(MANUALS_DIR, f"{file_id}_{file.filename}")

    try:
        contents = await file.read()
        with open(save_path, "wb") as f:
            f.write(contents)

        chunks = pdf_processor.create_chunks(save_path, machine_name, model, file_id)
        rag_engine.index_chunks(chunks)

        return {
            "message": "Manual uploaded and indexed successfully.",
            "file_id": file_id,
            "filename": file.filename,
            "machine_name": machine_name,
            "model": model,
            "chunks_created": len(chunks)
        }
    except Exception as e:
        if os.path.exists(save_path):
            os.remove(save_path)
        raise HTTPException(status_code=500, detail=f"Failed to process manual PDF: {str(e)}")


@app.delete("/api/machines/{file_id}")
def delete_machine(file_id: str):
    rag_engine.remove_file(file_id)
    return {"message": f"Manual {file_id} deleted successfully."}


@app.post("/api/chat")
def chat(req: ChatRequest, x_api_key: Optional[str] = Header(None, alias="X-API-Key")):
    if not req.question or not req.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    api_key_to_use = req.api_key or x_api_key
    result = rag_engine.query(
        question=req.question.strip(),
        selected_machine=req.selected_machine,
        api_key=api_key_to_use
    )
    return result


@app.post("/api/reset")
def reset_database():
    rag_engine.clear()
    _index_directory(SAMPLE_DIR)
    _index_directory(MANUALS_DIR)
    return {
        "message": "Database reset and sample manuals re-indexed.",
        "machines": rag_engine.get_machines()
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)

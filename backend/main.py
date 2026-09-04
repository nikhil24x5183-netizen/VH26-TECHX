"""
MaintAI Enterprise REST API Server.
Modular FastAPI application exposing complete REST endpoints for document management,
RAG search, troubleshooting chat, feedback logging, and judge evaluation benchmarks.
"""

import os
from typing import Optional, List, Dict, Any
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from pdf_processor import PDFProcessor
from rag_engine import RAGEngine
from evaluation_engine import EvaluationEngine
from sample_generator import generate_all_samples

app = FastAPI(
    title="MaintAI Industrial Troubleshooting API",
    description="AI Industrial Troubleshooting Copilot API grounded in official manufacturer manuals.",
    version="2.0.0"
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
eval_engine = EvaluationEngine(rag_engine)
feedback_db: List[Dict[str, Any]] = []


def _index_directory(directory_path: str):
    if not os.path.exists(directory_path):
        return

    sample_meta = {
        "Siemens_S71500_PLC_Manual.pdf": ("Siemens", "Siemens S7-1500 PLC", "CPU 1516-3 PN/DP", "English 🇺🇸", "Rev. 2026.1"),
        "Cat_C15_Generator_Manual.pdf": ("Caterpillar", "Caterpillar C15 Generator", "C15-500kVA", "English 🇺🇸", "Rev. 2026.2"),
        "KUKA_KR210_Robot_Manual.pdf": ("KUKA Systems", "KUKA KR 210 Robot", "KR 210 R2700-2", "English 🇺🇸", "Rev. KSS 8.6"),
        "Fanuc_Robodrill_CNC_Manual.pdf": ("Fanuc Automation", "Fanuc Robodrill CNC", "α-D21MiB5", "English 🇺🇸", "Rev. 31i-B5"),
        "Siemens_SINAMICS_G120_Manual.pdf": ("Siemens", "SINAMICS G120", "CU240E-2 PN", "English 🇺🇸", "Rev. 2026.3"),
        "Siemens_SINAMICS_G120_Betriebsanleitung_DE.pdf": ("Siemens", "SINAMICS G120", "CU240B/E-2", "German 🇩🇪", "Rev. 2021.DE")
    }

    for fname in os.listdir(directory_path):
        if fname.endswith(".pdf"):
            fpath = os.path.join(directory_path, fname)
            if fname in sample_meta:
                mfr, m_name, model, lang, rev = sample_meta[fname]
            else:
                detected = pdf_processor.detect_metadata_from_pdf(fpath)
                mfr = detected["manufacturer"]
                m_name = detected["machine_name"]
                model = detected["model"]
                lang = detected.get("manual_language", "English 🇺🇸")
                rev = "Rev. 2026.1"

            file_id = f"doc_{fname}"
            chunks = pdf_processor.create_chunks(fpath, mfr, m_name, model, file_id, manual_language=lang, revision=rev)
            rag_engine.index_chunks(chunks)


@app.on_event("startup")
def initialize_app():
    """Indexes uploaded manuals in MANUALS_DIR on startup (starts empty if no PDFs in MANUALS_DIR)."""
    try:
        _index_directory(MANUALS_DIR)

        # Purge bad records where machine is TEST or model is C15
        rag_engine.store.chunks = [
            c for c in rag_engine.store.chunks
            if c.get("machine_name") != "TEST" and c.get("model") != "C15"
        ]

        print("MaintAI API Server Ready: Dynamic database initialization complete.")
    except Exception as e:
        print(f"Error during startup initialization: {e}")


@app.get("/")
def root():
    return {
        "status": "online",
        "system": "MaintAI Industrial Troubleshooting API Server",
        "version": "2.0.0",
        "documentation": "/docs",
        "openapi_spec": "/openapi.json",
        "health_check": "/api/health"
    }


@app.get("/api/health")
@app.get("/health")
def health_check():
    return {
        "status": "online",
        "system": "MaintAI Industrial Copilot Engine",
        "indexed_machines_count": len(rag_engine.get_machines()),
        "total_chunks": len(rag_engine.store.chunks),
        "rag_engine_id": id(rag_engine),
        "rag_store_id": id(rag_engine.store),
    }


@app.get("/api/debug")
def debug_check():
    from routers.machines import get_rag_services
    re_from_router, _, _, _ = get_rag_services()
    return {
        "main_rag_engine_id": id(rag_engine),
        "router_rag_engine_id": id(re_from_router),
        "same_object": id(rag_engine) == id(re_from_router),
        "main_chunks": len(rag_engine.store.chunks),
        "router_chunks": len(re_from_router.store.chunks),
        "main_machines": len(rag_engine.get_machines()),
        "router_machines": len(re_from_router.get_machines()),
    }


# Register Router Modules with & without /api prefix for maximum client compatibility
from routers import documents, chat, machines, evaluation

app.include_router(documents.router, prefix="/api")
app.include_router(chat.router, prefix="/api")
app.include_router(machines.router, prefix="/api")
app.include_router(evaluation.router, prefix="/api")

app.include_router(documents.router)
app.include_router(chat.router)
app.include_router(machines.router)
app.include_router(evaluation.router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)

from fastapi import APIRouter

router = APIRouter(tags=["Machines"])

def get_rag_services():
    from main import rag_engine, SAMPLE_DIR, MANUALS_DIR, _index_directory
    return rag_engine, SAMPLE_DIR, MANUALS_DIR, _index_directory

@router.get("/machines")
def list_machines():
    rag_engine, _, _, _ = get_rag_services()
    return {"machines": rag_engine.get_machines()}

@router.post("/reset")
def reset_database():
    rag_engine, SAMPLE_DIR, MANUALS_DIR, _index_directory = get_rag_services()
    rag_engine.clear()
    _index_directory(SAMPLE_DIR)
    _index_directory(MANUALS_DIR)
    return {
        "message": "Database reset and real OEM manuals re-indexed.",
        "machines": rag_engine.get_machines()
    }

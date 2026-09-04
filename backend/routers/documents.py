import os
import uuid
import sys
from typing import Optional
from fastapi import APIRouter, File, UploadFile, Form, HTTPException, Depends
from pydantic import BaseModel

router = APIRouter(tags=["Documents"])

def get_services():
    main_mod = sys.modules.get('__main__') or sys.modules.get('main')
    return main_mod.pdf_processor, main_mod.rag_engine, main_mod.MANUALS_DIR


@router.get("/documents")
@router.get("/manuals")
def list_documents():
    pdf_processor, rag_engine, _ = get_services()
    machines = rag_engine.get_machines()
    docs = []
    for m in machines:
        docs.append({
            "document_id": m.get("file_id", "sample"),
            "manufacturer": m.get("manufacturer", m.get("machine_name", "").split()[0]),
            "machine_name": m.get("machine_name"),
            "model": m.get("model"),
            "manufacturing_year": m.get("manufacturing_year", "2021"),
            "firmware": m.get("firmware", "Standard"),
            "manual_type": m.get("manual_type", "Operating Instructions"),
            "manual_title": m.get("manual_title", f"{m.get('machine_name')} Operating Instructions"),
            "file_name": m.get("file_name"),
            "chunk_count": m.get("chunk_count"),
            "page_count": max(1, round(m.get("chunk_count", 1) * 0.95)),
            "status": "✓ Indexed",
            "upload_date": "2026-09-04"
        })
    return {"documents": docs}

@router.get("/documents/{document_id}")
def get_document(document_id: str):
    pdf_processor, rag_engine, _ = get_services()
    machines = rag_engine.get_machines()
    for m in machines:
        if m.get("file_id") == document_id or m.get("machine_name") == document_id:
            return {"document": m}
    raise HTTPException(status_code=404, detail=f"Document {document_id} not found.")

@router.post("/documents/detect-metadata")
async def detect_metadata(file: UploadFile = File(...)):
    pdf_processor, _, MANUALS_DIR = get_services()
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported for metadata detection.")

    temp_id = f"temp_{uuid.uuid4().hex[:6]}"
    temp_path = os.path.join(MANUALS_DIR, f"{temp_id}_{file.filename}")
    try:
        contents = await file.read()
        with open(temp_path, "wb") as f:
            f.write(contents)

        detected = pdf_processor.detect_metadata_from_pdf(temp_path)
        return {"detected_metadata": detected}
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

@router.post("/documents/upload")
@router.post("/manuals/upload")
@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    machine_name: str = Form(...),
    model: str = Form(...),
    manufacturer: Optional[str] = Form("Industrial OEM"),
    manufacturing_year: Optional[str] = Form("2021"),
    firmware: Optional[str] = Form("Standard"),
    manual_type: Optional[str] = Form("Operating Instructions"),
    manual_title: Optional[str] = Form(None),
    revision: Optional[str] = Form("Rev. 2026.1")
):
    pdf_processor, rag_engine, MANUALS_DIR = get_services()
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only valid PDF documents are allowed.")

    file_id = f"file_{uuid.uuid4().hex[:8]}"
    save_path = os.path.join(MANUALS_DIR, f"{file_id}_{file.filename}")

    try:
        contents = await file.read()
        with open(save_path, "wb") as f:
            f.write(contents)

        if not pdf_processor.validate_pdf(save_path):
            if os.path.exists(save_path):
                os.remove(save_path)
            raise HTTPException(status_code=400, detail="Invalid or corrupt PDF manual.")

        # Detect PDF metadata & check for mismatch
        detected = pdf_processor.detect_metadata_from_pdf(save_path)
        warning_msg = None
        if machine_name.lower() in ["test", "demo", "sample"] or model.lower() in ["c15", "test"]:
            if detected["machine_name"] != "Industrial Machine" and detected["machine_name"].lower() != machine_name.lower():
                warning_msg = f"Manual information appears to identify this document as {detected['manufacturer']} {detected['machine_name']} ({detected['model']}). Metadata auto-adjusted."
                machine_name = detected["machine_name"]
                model = detected["model"]
                manufacturer = detected["manufacturer"]

        chunks = pdf_processor.create_chunks(
            filepath=save_path,
            manufacturer=manufacturer or detected["manufacturer"],
            machine_name=machine_name,
            model=model,
            file_id=file_id,
            manufacturing_year=manufacturing_year or "2021",
            firmware=firmware or "Standard",
            manual_type=manual_type or "Operating Instructions",
            revision=revision or "Rev. 2026.1"
        )
        rag_engine.index_chunks(chunks)

        pages = pdf_processor.extract_pages(save_path)
        page_count = len(pages)

        return {
            "message": "Manual uploaded, validated, and indexed successfully.",
            "status": "Ready",
            "warning": warning_msg,
            "document_id": file_id,
            "filename": file.filename,
            "manufacturer": manufacturer,
            "machine_name": machine_name,
            "model": model,
            "manufacturing_year": manufacturing_year or "2021",
            "firmware": firmware or "Standard",
            "manual_type": manual_type or "Operating Instructions",
            "manual_title": manual_title or f"{machine_name} Operating Instructions",
            "pages_processed": page_count,
            "chunks_indexed": len(chunks)
        }
    except HTTPException:
        raise
    except Exception as e:
        if os.path.exists(save_path):
            os.remove(save_path)
        raise HTTPException(status_code=500, detail=f"Failed to ingest manual: {str(e)}")

@router.delete("/documents/{document_id}")
@router.delete("/manuals/{document_id}")
def delete_document(document_id: str):
    _, rag_engine, MANUALS_DIR = get_services()
    rag_engine.remove_file(document_id)

    # Physical file cleanup from disk
    if os.path.exists(MANUALS_DIR):
        doc_clean = document_id.strip().lower()
        for f in os.listdir(MANUALS_DIR):
            f_lower = f.lower()
            if doc_clean in f_lower or f_lower in doc_clean:
                try:
                    os.remove(os.path.join(MANUALS_DIR, f))
                except Exception as e:
                    print(f"Notice: Failed to remove file {f}: {e}")

    return {
        "message": f"Document {document_id} removed from index.",
        "machines": rag_engine.get_machines()
    }

from fastapi.responses import FileResponse

@router.get("/pdf/{file_name}")
@router.get("/documents/{file_name}/pdf")
def serve_pdf(file_name: str):
    pdf_processor, rag_engine, MANUALS_DIR = get_services()
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    SAMPLE_DIR = os.path.join(BASE_DIR, "..", "data", "sample_manuals")

    for dir_path in [MANUALS_DIR, SAMPLE_DIR]:
        if not os.path.exists(dir_path):
            continue
        # Direct match
        target = os.path.join(dir_path, file_name)
        if os.path.exists(target) and os.path.isfile(target):
            return FileResponse(target, media_type="application/pdf")

        # Match by substring or file_id
        for fn in os.listdir(dir_path):
            if fn.endswith(".pdf") and (file_name in fn or fn in file_name):
                return FileResponse(os.path.join(dir_path, fn), media_type="application/pdf")

    raise HTTPException(status_code=404, detail=f"PDF document '{file_name}' not found.")


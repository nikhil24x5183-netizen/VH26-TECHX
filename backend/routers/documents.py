import os
import uuid
from typing import Optional
from fastapi import APIRouter, File, UploadFile, Form, HTTPException, Depends
from pydantic import BaseModel

router = APIRouter(tags=["Documents"])

def get_services():
    from main import pdf_processor, rag_engine, MANUALS_DIR
    return pdf_processor, rag_engine, MANUALS_DIR

@router.get("/documents")
@router.get("/manuals")
def list_documents():
    pdf_processor, rag_engine, _ = get_services()
    machines = rag_engine.get_machines()
    docs = []
    for m in machines:
        docs.append({
            "document_id": m.get("file_id", "sample"),
            "manufacturer": m.get("machine_name", "").split()[0],
            "machine_name": m.get("machine_name"),
            "model": m.get("model"),
            "file_name": m.get("file_name"),
            "chunk_count": m.get("chunk_count"),
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

@router.post("/documents/upload")
@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    machine_name: str = Form(...),
    model: str = Form(...),
    manufacturer: Optional[str] = Form("Industrial OEM"),
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

        chunks = pdf_processor.create_chunks(
            filepath=save_path,
            manufacturer=manufacturer or "Industrial OEM",
            machine_name=machine_name,
            model=model,
            file_id=file_id,
            revision=revision or "Rev. 2026.1"
        )
        rag_engine.index_chunks(chunks)

        return {
            "message": "Manual uploaded, validated, and indexed successfully.",
            "document_id": file_id,
            "filename": file.filename,
            "manufacturer": manufacturer,
            "machine_name": machine_name,
            "model": model,
            "chunks_indexed": len(chunks)
        }
    except Exception as e:
        if os.path.exists(save_path):
            os.remove(save_path)
        raise HTTPException(status_code=500, detail=f"Failed to ingest manual: {str(e)}")

@router.delete("/documents/{document_id}")
def delete_document(document_id: str):
    _, rag_engine, _ = get_services()
    rag_engine.remove_file(document_id)
    return {"message": f"Document {document_id} removed from index."}

import json
from pathlib import Path
from src.config import settings
from src.indexing.vector_store import ChromaVectorStore
from src.indexing.bm25_index import BM25Searcher

def export_for_vercel():
    print("Exporting precomputed knowledge base for Vercel serverless deployment...")
    
    # 1. Load Chroma chunks and embeddings
    vs = ChromaVectorStore()
    all_data = vs.collection.get(include=["documents", "metadatas", "embeddings"])
    
    chunks = []
    ids = all_data["ids"]
    docs = all_data["documents"]
    metas = all_data["metadatas"]
    embs = all_data["embeddings"]
    
    for cid, doc, meta, emb in zip(ids, docs, metas, embs):
        chunks.append({
            "chunk_id": cid,
            "text": doc,
            "manual_id": meta["manual_id"],
            "manual_name": meta["manual_name"],
            "machine_name": meta["machine_name"],
            "model": meta["model"],
            "section": meta["section"],
            "page": int(meta["page"]),
            "unit_type": meta["unit_type"],
            "codes_mentioned": [x for x in meta.get("codes_str", "").split(",") if x],
            "embedding": emb if isinstance(emb, list) else emb.tolist()
        })

    # 2. Load registry
    registry = {}
    if settings.METADATA_REGISTRY_PATH.exists():
        with open(settings.METADATA_REGISTRY_PATH, "r", encoding="utf-8") as f:
            registry = json.load(f)

    # 3. Combine into single portable artifact
    export_payload = {
        "version": "1.0",
        "total_chunks": len(chunks),
        "registry": registry,
        "chunks": chunks
    }

    out_path = settings.DATA_DIR / "precomputed_knowledge_base.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(export_payload, f, indent=2)

    size_kb = round(out_path.stat().st_size / 1024, 1)
    print(f"Exported {len(chunks)} chunks with embeddings to {out_path} ({size_kb} KB).")

if __name__ == "__main__":
    export_for_vercel()

import os
from pathlib import Path
from typing import List, Tuple, Optional, Dict, Any
import chromadb
from chromadb.config import Settings as ChromaSettings
from fastembed import TextEmbedding
from src.ingestion.chunker import Chunk
from src.config import settings

class ChromaVectorStore:
    """ChromaDB local vector store integrated with FastEmbed (bge-small-en-v1.5)."""

    def __init__(self, persist_dir: Optional[Path] = None, collection_name: str = "troubleshooting_chunks"):
        self.persist_dir = persist_dir or settings.CHROMA_DIR
        self.collection_name = collection_name
        self.client = chromadb.PersistentClient(path=str(self.persist_dir))
        
        print(f"Initializing FastEmbed model: {settings.EMBEDDING_MODEL}...")
        self.embedding_model = TextEmbedding(model_name=settings.EMBEDDING_MODEL)
        
        self.collection = self.client.get_or_create_collection(
            name=self.collection_name,
            metadata={"hnsw:space": "cosine"}
        )

    def embed_texts(self, texts: List[str]) -> List[List[float]]:
        # FastEmbed generates generators of numpy arrays
        embeddings = list(self.embedding_model.embed(texts))
        return [emb.tolist() for emb in embeddings]

    def add_chunks(self, chunks: List[Chunk]):
        if not chunks:
            return

        texts = [c.text for c in chunks]
        embeddings = self.embed_texts(texts)
        ids = [c.chunk_id for c in chunks]
        
        metadatas = []
        for c in chunks:
            metadatas.append({
                "manual_id": c.manual_id,
                "manual_name": c.manual_name,
                "machine_name": c.machine_name,
                "model": c.model,
                "section": c.section,
                "page": c.page,
                "unit_type": c.unit_type,
                "codes_str": ",".join(c.codes_mentioned)
            })

        # Upsert in batches of 100
        batch_size = 100
        for i in range(0, len(chunks), batch_size):
            self.collection.upsert(
                ids=ids[i:i+batch_size],
                embeddings=embeddings[i:i+batch_size],
                documents=texts[i:i+batch_size],
                metadatas=metadatas[i:i+batch_size]
            )
        print(f"Successfully indexed {len(chunks)} chunks into ChromaDB collection '{self.collection_name}'.")

    def search(self, query: str, top_k: int = 10, machine_filter: Optional[str] = None) -> List[Tuple[Dict[str, Any], float]]:
        query_embedding = self.embed_texts([query])[0]
        
        where_filter = None
        if machine_filter:
            where_filter = {"machine_name": machine_filter}

        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k,
            where=where_filter,
            include=["documents", "metadatas", "distances"]
        )

        output = []
        if results and results["ids"] and len(results["ids"][0]) > 0:
            ids = results["ids"][0]
            docs = results["documents"][0]
            metas = results["metadatas"][0]
            dists = results["distances"][0]

            for cid, doc, meta, dist in zip(ids, docs, metas, dists):
                # Cosine distance to cosine similarity: sim = 1 - dist
                sim_score = max(0.0, 1.0 - dist)
                chunk_dict = {
                    "chunk_id": cid,
                    "text": doc,
                    "manual_id": meta["manual_id"],
                    "manual_name": meta["manual_name"],
                    "machine_name": meta["machine_name"],
                    "model": meta["model"],
                    "section": meta["section"],
                    "page": int(meta["page"]),
                    "unit_type": meta["unit_type"],
                    "codes_mentioned": [x for x in meta.get("codes_str", "").split(",") if x]
                }
                output.append((chunk_dict, sim_score))

        return output

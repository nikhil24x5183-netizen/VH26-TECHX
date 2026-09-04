from typing import List, Dict, Any, Optional, Tuple
from src.indexing.bm25_index import BM25Searcher
from src.indexing.vector_store import ChromaVectorStore
from src.config import settings

class HybridRetriever:
    """Hybrid search combining dense vector embeddings and BM25 keyword matching via Reciprocal Rank Fusion (RRF)."""

    def __init__(self, vector_store: ChromaVectorStore, bm25_searcher: BM25Searcher, rrf_k: int = 60):
        self.vector_store = vector_store
        self.bm25_searcher = bm25_searcher
        self.rrf_k = rrf_k

    def search(
        self,
        query: str,
        top_k: int = 6,
        machine_filter: Optional[str] = None,
        w_bm25: float = 1.0,
        w_vec: float = 1.0
    ) -> List[Dict[str, Any]]:
        # 1. Retrieve top vector candidates
        vector_results = self.vector_store.search(
            query=query,
            top_k=settings.VECTOR_TOP_K,
            machine_filter=machine_filter
        )

        # 2. Retrieve top BM25 candidates
        bm25_results = self.bm25_searcher.search(
            query=query,
            top_k=settings.BM25_TOP_K,
            machine_filter=machine_filter
        )

        # 3. Reciprocal Rank Fusion (RRF)
        rrf_scores: Dict[str, float] = {}
        chunk_lookup: Dict[str, Dict[str, Any]] = {}
        bm25_scores: Dict[str, float] = {}
        vec_scores: Dict[str, float] = {}

        # Process BM25 rankings
        for rank, (chunk, score) in enumerate(bm25_results):
            cid = chunk.chunk_id
            rrf_scores[cid] = rrf_scores.get(cid, 0.0) + (w_bm25 / (self.rrf_k + rank + 1))
            bm25_scores[cid] = score
            if cid not in chunk_lookup:
                chunk_lookup[cid] = {
                    "chunk_id": chunk.chunk_id,
                    "text": chunk.text,
                    "raw_content": chunk.raw_content,
                    "manual_id": chunk.manual_id,
                    "manual_name": chunk.manual_name,
                    "machine_name": chunk.machine_name,
                    "model": chunk.model,
                    "section": chunk.section,
                    "page": chunk.page,
                    "unit_type": chunk.unit_type,
                    "codes_mentioned": chunk.codes_mentioned
                }

        # Process Vector rankings
        for rank, (chunk_dict, score) in enumerate(vector_results):
            cid = chunk_dict["chunk_id"]
            rrf_scores[cid] = rrf_scores.get(cid, 0.0) + (w_vec / (self.rrf_k + rank + 1))
            vec_scores[cid] = score
            if cid not in chunk_lookup:
                chunk_lookup[cid] = chunk_dict

        # Sort candidate IDs by fused RRF score
        sorted_cids = sorted(rrf_scores.keys(), key=lambda cid: rrf_scores[cid], reverse=True)

        final_candidates = []
        for cid in sorted_cids[:top_k]:
            item = chunk_lookup[cid].copy()
            item["rrf_score"] = rrf_scores[cid]
            item["bm25_score"] = bm25_scores.get(cid, 0.0)
            item["vector_similarity"] = vec_scores.get(cid, 0.0)
            final_candidates.append(item)

        return final_candidates

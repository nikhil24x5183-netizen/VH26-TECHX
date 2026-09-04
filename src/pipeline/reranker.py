import re
from typing import List, Dict, Any, Tuple, Optional
from flashrank import Ranker, RerankRequest
from src.config import settings

class CrossEncoderReranker:
    """Local Cross-Encoder Reranker with exact code precision tuning."""

    CODE_REGEX = re.compile(r"\b(E\d{3,4}|E-\d{3,4})\b", re.IGNORECASE)

    def __init__(self, model_name: str = "ms-marco-TinyBERT-L-2-v2"):
        self.model_name = model_name
        self.ranker = Ranker(model_name=self.model_name)

    def rerank(
        self,
        query: str,
        candidates: List[Dict[str, Any]],
        top_k: int = 4
    ) -> Tuple[List[Dict[str, Any]], float]:
        if not candidates:
            return [], 0.0

        # Extract queried error code if present
        query_codes = [c.upper().replace("-", "") for c in self.CODE_REGEX.findall(query)]

        # Prepare passages for flashrank
        passages = []
        for c in candidates:
            passages.append({
                "id": c["chunk_id"],
                "text": c["text"],
                "meta": c
            })

        rerank_req = RerankRequest(query=query, passages=passages)
        ranked_results = self.ranker.rerank(rerank_req)

        reranked_chunks = []
        for r in ranked_results:
            item = r["meta"].copy()
            raw_score = float(r["score"])
            
            # Exact Code Precision Boost (Per Section 3 of specification)
            # Embeddings/Cross-encoders can confuse E101 vs E102 vs E103.
            # We strictly enforce that chunks containing the queried code rank highest.
            precision_modifier = 0.0
            if query_codes:
                chunk_codes = item.get("codes_mentioned", [])
                chunk_text_upper = item.get("text", "").upper()
                
                has_queried_code = any(qc in chunk_codes or qc in chunk_text_upper for qc in query_codes)
                if has_queried_code:
                    # Prefer the detailed diagnostic procedure over general overview tables
                    if "Step-by-Step Corrective Action" in item.get("raw_content", "") or "Step-by-Step Corrective Action" in item.get("text", ""):
                        precision_modifier += 3.0  # Full detailed diagnostic section
                    elif "Structured Table" not in item.get("section", ""):
                        precision_modifier += 1.5
                    else:
                        precision_modifier += 0.5
                else:
                    precision_modifier -= 1.5  # Penalize chunks about a different error code

            item["rerank_score"] = raw_score + precision_modifier
            reranked_chunks.append(item)

        # Sort descending by adjusted precision score
        reranked_chunks.sort(key=lambda x: x["rerank_score"], reverse=True)
        top_slice = reranked_chunks[:top_k]

        # Raw model confidence for the top chunk
        top_confidence = min(1.0, max(0.0, top_slice[0]["rerank_score"])) if top_slice else 0.0
        return top_slice, top_confidence

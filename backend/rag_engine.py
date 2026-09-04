"""
RAG Engine for MaintAI.
Handles Embedding generation, Vector Retrieval, Ambiguity Detection,
Insufficient Info Refusal, and Answer Synthesis with Citations.
"""

import os
import re
import math
from typing import List, Dict, Any, Optional

try:
    import numpy as np
    HAS_NUMPY = True
except ImportError:
    HAS_NUMPY = False

try:
    from sentence_transformers import SentenceTransformer
    HAS_ST = True
except ImportError:
    HAS_ST = False

try:
    import google.genai as genai
    HAS_GEMINI = True
except ImportError:
    HAS_GEMINI = False


STOPWORDS = {
    "machine", "my", "is", "not", "working", "how", "what", "why", "do", "i",
    "fix", "this", "problem", "the", "a", "an", "to", "for", "in", "of", "and",
    "or", "on", "it", "with", "from", "at", "by", "can", "help", "please", "device"
}


class VectorStore:
    """Lightweight vector store supporting SentenceTransformers or TF-IDF keyword search."""
    def __init__(self):
        self.chunks: List[Dict[str, Any]] = []
        self.encoder = None
        if HAS_ST:
            try:
                self.encoder = SentenceTransformer('all-MiniLM-L6-v2')
            except Exception as e:
                print(f"Notice: SentenceTransformer fallback mode: {e}")
                self.encoder = None

    def add_chunks(self, new_chunks: List[Dict[str, Any]]):
        for chunk in new_chunks:
            if self.encoder:
                try:
                    chunk["vector"] = self.encoder.encode(chunk["text"]).tolist()
                except Exception:
                    chunk["vector"] = None
            self.chunks.append(chunk)

    def remove_file(self, file_id: str):
        self.chunks = [c for c in self.chunks if c.get("file_id") != file_id]

    def clear(self):
        self.chunks = []

    def get_machines(self) -> List[Dict[str, str]]:
        machines = {}
        for c in self.chunks:
            m_key = f"{c['machine_name']}|||{c['model']}"
            if m_key not in machines:
                machines[m_key] = {
                    "machine_name": c["machine_name"],
                    "model": c["model"],
                    "file_name": c["file_name"],
                    "file_id": c.get("file_id", ""),
                    "chunk_count": 0
                }
            machines[m_key]["chunk_count"] += 1
        return list(machines.values())

    def _cosine_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        dot = sum(a * b for a, b in zip(vec1, vec2))
        norm1 = math.sqrt(sum(a * a for a in vec1))
        norm2 = math.sqrt(sum(b * b for b in vec2))
        if norm1 == 0 or norm2 == 0:
            return 0.0
        return dot / (norm1 * norm2)

    def _keyword_similarity(self, query: str, text: str) -> float:
        """TF-IDF style term frequency matching filtering out generic stopwords."""
        raw_words = re.findall(r'\w+', query.lower())
        meaningful_words = [w for w in raw_words if w not in STOPWORDS and len(w) > 2]
        
        if not meaningful_words:
            return 0.0

        text_lower = text.lower()
        match_count = 0
        
        # Boost exact error code matches (e.g. E101)
        error_codes = re.findall(r'[eE]\d{3}', query)
        boost = 0.0
        for code in error_codes:
            if code.lower() in text_lower:
                boost += 0.50

        for word in meaningful_words:
            if word in text_lower:
                match_count += 1
        
        base_score = match_count / len(set(meaningful_words))
        return min(1.0, base_score + boost)

    def search(
        self,
        query: str,
        selected_machine: Optional[str] = None,
        top_k: int = 5
    ) -> List[Dict[str, Any]]:
        if not self.chunks:
            return []

        candidate_chunks = self.chunks
        if selected_machine and selected_machine != "all":
            candidate_chunks = [
                c for c in self.chunks
                if c["machine_name"].lower() == selected_machine.lower()
                or f"{c['machine_name']} ({c['model']})".lower() == selected_machine.lower()
            ]

        if not candidate_chunks:
            return []

        query_vector = None
        if self.encoder:
            try:
                query_vector = self.encoder.encode(query).tolist()
            except Exception:
                query_vector = None

        results = []
        for chunk in candidate_chunks:
            score = 0.0
            if query_vector and chunk.get("vector"):
                score = self._cosine_similarity(query_vector, chunk["vector"])
            else:
                score = self._keyword_similarity(query, chunk["text"])

            # Add keyword boost for exact error codes
            error_codes = re.findall(r'\b[eE]\d{3}\b', query)
            for code in error_codes:
                if code.lower() in chunk["text"].lower():
                    score += 0.35

            results.append({
                "chunk": chunk,
                "score": min(1.0, float(score))
            })

        results.sort(key=lambda x: x["score"], reverse=True)
        return results[:top_k]


class RAGEngine:
    def __init__(self):
        self.store = VectorStore()

    def index_chunks(self, chunks: List[Dict[str, Any]]):
        self.store.add_chunks(chunks)

    def remove_file(self, file_id: str):
        self.store.remove_file(file_id)

    def clear(self):
        self.store.clear()

    def get_machines(self) -> List[Dict[str, str]]:
        return self.store.get_machines()

    def detect_ambiguity(
        self,
        query: str,
        retrieved_results: List[Dict[str, Any]]
    ) -> Optional[Dict[str, Any]]:
        """Detects cross-manual ambiguity when a user asks a general error query."""
        error_match = re.search(r'\b[eE]\d{3}\b', query)
        high_rel_results = [r for r in retrieved_results if r["score"] > 0.25]
        
        machines_map = {}
        for r in high_rel_results:
            c = r["chunk"]
            m_name = c["machine_name"]
            if m_name not in machines_map:
                machines_map[m_name] = {
                    "machine_name": c["machine_name"],
                    "model": c["model"],
                    "file_name": c["file_name"],
                    "preview": c["text"][:160] + "..."
                }

        if len(machines_map) >= 2 and (error_match or "error" in query.lower() or "what does" in query.lower()):
            candidates = list(machines_map.values())
            term_str = error_match.group(0).upper() if error_match else "this query"
            return {
                "ambiguity_detected": True,
                "query_term": term_str,
                "message": f"The term '{term_str}' appears in manuals for {len(candidates)} different machines. Please select which machine you are troubleshooting:",
                "candidates": candidates
            }

        return None

    def query(
        self,
        question: str,
        selected_machine: Optional[str] = None,
        api_key: Optional[str] = None
    ) -> Dict[str, Any]:
        """Main query processing pipeline."""
        if not self.store.chunks:
            return {
                "answer": "No machine manuals have been uploaded yet. Please upload a PDF manual to start troubleshooting.",
                "citations": [],
                "ambiguity": None,
                "insufficient_info": True
            }

        # Check if query contains meaningful non-stopword terms
        raw_words = re.findall(r'\w+', question.lower())
        meaningful_words = [w for w in raw_words if w not in STOPWORDS and len(w) > 2]
        
        # 1. Retrieve top chunks
        retrieved = self.store.search(question, selected_machine=selected_machine, top_k=4)

        # 2. Check for Insufficient Information / Vague Query Refusal
        if not meaningful_words or not retrieved or retrieved[0]["score"] < 0.25:
            return {
                "answer": "I don't have enough information in the available manuals to answer this safely. Please specify the exact machine model, error code (e.g., E101), or detailed component symptom.",
                "citations": [],
                "ambiguity": None,
                "insufficient_info": True
            }

        # 3. Check for Cross-Manual Ambiguity
        if not selected_machine or selected_machine.lower() == "all":
            ambiguity_info = self.detect_ambiguity(question, retrieved)
            if ambiguity_info:
                return {
                    "answer": ambiguity_info["message"],
                    "citations": [],
                    "ambiguity": ambiguity_info,
                    "insufficient_info": False
                }

        # 4. Filter relevant context chunks & build citations
        citations = []
        context_blocks = []
        for idx, r in enumerate(retrieved, start=1):
            if r["score"] < 0.15:
                continue
            c = r["chunk"]
            citations.append({
                "id": idx,
                "machine_name": c["machine_name"],
                "model": c["model"],
                "file_name": c["file_name"],
                "section": c["section"],
                "page_number": c["page_number"],
                "snippet": c["text"]
            })
            context_blocks.append(
                f"[Source {idx}] Machine: {c['machine_name']} ({c['model']}) | Manual: {c['file_name']} | Section: {c['section']} | Page: {c['page_number']}\n{c['text']}"
            )

        if not citations:
            return {
                "answer": "I don't have enough information in the available manuals to answer this safely. Please specify the exact machine model, error code (e.g., E101), or detailed component symptom.",
                "citations": [],
                "ambiguity": None,
                "insufficient_info": True
            }

        context_str = "\n\n".join(context_blocks)

        # 5. Generate Answer
        effective_key = api_key or os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")

        if effective_key and HAS_GEMINI:
            try:
                client = genai.Client(api_key=effective_key)
                prompt = (
                    "You are MaintAI, an expert factory machine troubleshooting AI assistant.\n"
                    "Your primary goal is safety and accuracy. Answer the user's question using ONLY the provided manual excerpts below.\n"
                    "CRITICAL RULES:\n"
                    "1. Never invent repair steps, tools, or causes that are not in the context.\n"
                    "2. If the context does not fully answer the question, state what is missing.\n"
                    "3. Cite your sources using [Source 1], [Source 2], etc. where appropriate.\n"
                    "4. Format your answer with clear headers, bullet points, and safety warnings.\n\n"
                    f"MANUAL CONTEXT:\n{context_str}\n\n"
                    f"USER QUESTION: {question}\n\n"
                    "ANSWER:"
                )
                response = client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=prompt
                )
                answer = response.text
            except Exception as e:
                print(f"Gemini API call error: {e}. Using fallback synthesizer.")
                answer = self._synthesize_fallback_answer(question, citations)
        else:
            answer = self._synthesize_fallback_answer(question, citations)

        return {
            "answer": answer,
            "citations": citations,
            "ambiguity": None,
            "insufficient_info": False
        }

    def _synthesize_fallback_answer(self, question: str, citations: List[Dict[str, Any]]) -> str:
        """Smart RAG synthesis fallback when Gemini API key is not configured."""
        m_names = list(set([c["machine_name"] for c in citations]))
        primary_source = citations[0]

        answer_lines = [
            f"### Troubleshooting Analysis ({', '.join(m_names)})\n",
            f"Based on the official manual **{primary_source['file_name']}** (Section: *{primary_source['section']}*, Page {primary_source['page_number']}):\n"
        ]

        for idx, cit in enumerate(citations, start=1):
            answer_lines.append(f"#### Reference [{idx}]: {cit['machine_name']} - {cit['section']} (Page {cit['page_number']})")
            answer_lines.append(f"{cit['snippet']}\n")

        answer_lines.append("> Safety Notice: Always follow standard lock-out/tag-out (LOTO) protocols before performing physical machine inspections.")
        return "\n".join(answer_lines)

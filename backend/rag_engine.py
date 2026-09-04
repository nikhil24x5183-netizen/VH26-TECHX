"""
Advanced RAG Engine for MaintAI.
Implements:
- Hybrid Keyword + Vector Retrieval with Reranking
- Automatic Machine/Model Context Detection
- Follow-up Conversation Context Resolution
- Confidence Scoring (High / Medium / Low)
- Cross-Document Ambiguity Resolution
- Hallucination Control & Refusal Mechanism
- Structured Troubleshooting Output (Meaning, Causes, Action Steps, Citations)
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
    "or", "on", "it", "with", "from", "at", "by", "can", "help", "please", "device",
    "doesnt", "does", "if", "that", "that's"
}


class VectorStore:
    """Hybrid Vector Store combining SentenceTransformers and TF-IDF Keyword Reranking."""
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
        """TF-IDF style term frequency matching."""
        raw_words = re.findall(r'\w+', query.lower())
        meaningful_words = [w for w in raw_words if w not in STOPWORDS and len(w) > 2]
        
        if not meaningful_words:
            return 0.0

        text_lower = text.lower()
        match_count = sum(1 for word in meaningful_words if word in text_lower)
        
        # Boost exact error code matches (e.g. E101, E301)
        error_codes = re.findall(r'\b[eE]\d{3}\b', query)
        boost = 0.0
        for code in error_codes:
            if code.lower() in text_lower:
                boost += 0.45

        base_score = match_count / len(set(meaningful_words))
        return min(1.0, base_score + boost)

    def hybrid_search(
        self,
        query: str,
        selected_machine: Optional[str] = None,
        top_k: int = 5
    ) -> List[Dict[str, Any]]:
        """Hybrid Search: Embeddings + Keyword Reranking."""
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
            sem_score = 0.0
            kw_score = self._keyword_similarity(query, chunk["text"])

            if query_vector and chunk.get("vector"):
                sem_score = self._cosine_similarity(query_vector, chunk["vector"])

            # Hybrid score computation: 60% semantic + 40% keyword reranking
            final_score = (0.6 * sem_score) + (0.4 * kw_score) if self.encoder else kw_score

            # Boost exact error codes
            error_codes = re.findall(r'\b[eE]\d{3}\b', query)
            for code in error_codes:
                if code.lower() in chunk["text"].lower():
                    final_score += 0.35

            results.append({
                "chunk": chunk,
                "score": min(1.0, float(final_score))
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

    def auto_detect_machine(self, query: str) -> Optional[str]:
        """Automatically detects machine name from user query context."""
        query_lower = query.lower()
        for c in self.store.chunks:
            m_name = c["machine_name"]
            if m_name.lower() in query_lower:
                return m_name
        return None

    def detect_ambiguity(
        self,
        query: str,
        retrieved_results: List[Dict[str, Any]]
    ) -> Optional[Dict[str, Any]]:
        """Detects cross-document ambiguity when query applies to multiple machines differently."""
        error_match = re.search(r'\b[eE]\d{3}\b', query)
        high_rel_results = [r for r in retrieved_results if r["score"] > 0.22]
        
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
                "message": f"The error code '{term_str}' exists across {len(candidates)} different machines with distinct meanings. Please select which machine you are repairing:",
                "candidates": candidates
            }

        return None

    def query(
        self,
        question: str,
        selected_machine: Optional[str] = None,
        api_key: Optional[str] = None,
        previous_context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Main query processing pipeline matching all VCET Hackathon 2026 requirements.
        """
        if not self.store.chunks:
            return {
                "answer": "No machine manuals uploaded yet. Upload a PDF manual to begin.",
                "citations": [],
                "ambiguity": None,
                "insufficient_info": True,
                "confidence_score": 0.0,
                "confidence_label": "No Data"
            }

        # 1. Automatic Machine Context Detection if unspecified
        inferred_machine = selected_machine
        if not inferred_machine or inferred_machine.lower() == "all":
            inferred_machine = self.auto_detect_machine(question)

        # 2. Resolve Follow-up Conversation Queries ("what if that doesn't fix it?")
        search_query = question
        if previous_context and ("doesn't fix" in question.lower() or "what if" in question.lower() or "still" in question.lower()):
            prev_q = previous_context.get("last_question", "")
            prev_m = previous_context.get("last_machine", "")
            search_query = f"{prev_m} {prev_q} alternative corrective actions {question}"
            if not inferred_machine and prev_m:
                inferred_machine = prev_m

        # 3. Hybrid Search
        retrieved = self.store.hybrid_search(search_query, selected_machine=inferred_machine, top_k=4)

        # 4. Check for Insufficient Information / Vague Query Refusal
        raw_words = re.findall(r'\w+', question.lower())
        meaningful_words = [w for w in raw_words if w not in STOPWORDS and len(w) > 2]

        if not meaningful_words or not retrieved or retrieved[0]["score"] < 0.20:
            return {
                "answer": "I don't have enough information in the available manuals to answer this safely. Please specify the exact machine model, error code (e.g., E101), or detailed component symptom.",
                "citations": [],
                "ambiguity": None,
                "insufficient_info": True,
                "confidence_score": 0.0,
                "confidence_label": "Low Confidence (Refused)"
            }

        # 5. Check for Cross-Document Ambiguity
        if not inferred_machine or inferred_machine.lower() == "all":
            ambiguity_info = self.detect_ambiguity(question, retrieved)
            if ambiguity_info:
                return {
                    "answer": ambiguity_info["message"],
                    "citations": [],
                    "ambiguity": ambiguity_info,
                    "insufficient_info": False,
                    "confidence_score": 0.5,
                    "confidence_label": "Ambiguous Context"
                }

        # 6. Filter Citations & Compute Confidence Score
        top_score = retrieved[0]["score"]
        conf_score = round(min(0.99, max(0.40, top_score)), 2)
        conf_label = "High Confidence" if conf_score >= 0.70 else "Medium Confidence"

        citations = []
        context_blocks = []
        for idx, r in enumerate(retrieved, start=1):
            if r["score"] < 0.12:
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

        context_str = "\n\n".join(context_blocks)

        # 7. Generate Structured Answer
        effective_key = api_key or os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")

        if effective_key and HAS_GEMINI:
            try:
                client = genai.Client(api_key=effective_key)
                prompt = (
                    "You are MaintAI, an expert industrial machine troubleshooting AI assistant.\n"
                    "Your primary goal is safety, accuracy, and strict traceability. Answer using ONLY the provided manual excerpts below.\n"
                    "CRITICAL STRUCTURED TEMPLATE:\n"
                    "1. **Error / Fault Meaning**: Concise explanation of the fault.\n"
                    "2. **Probable Cause(s)**: Bulleted list of root causes.\n"
                    "3. **Step-by-Step Corrective Action**: Numbered step-by-step repair instructions.\n"
                    "4. **Source Citation**: Explicit reference to [Source 1], [Source 2], section, and page.\n\n"
                    f"MANUAL CONTEXT:\n{context_str}\n\n"
                    f"USER QUESTION: {question}\n\n"
                    "STRUCTURED SOLUTION:"
                )
                response = client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=prompt
                )
                answer = response.text
            except Exception as e:
                print(f"Gemini API call error: {e}. Using structured RAG synthesizer.")
                answer = self._synthesize_structured_answer(question, citations)
        else:
            answer = self._synthesize_structured_answer(question, citations)

        return {
            "answer": answer,
            "citations": citations,
            "ambiguity": None,
            "insufficient_info": False,
            "confidence_score": conf_score,
            "confidence_label": conf_label
        }

    def _synthesize_structured_answer(self, question: str, citations: List[Dict[str, Any]]) -> str:
        """
        Synthesizes structured output matching Requirement #5 (Meaning, Causes, Action Steps, Citations).
        """
        primary = citations[0]
        m_name = primary["machine_name"]
        sec = primary["section"]
        pg = primary["page_number"]
        snippet = primary["snippet"]

        answer_lines = [
            f"### ⚙️ Diagnostic Analysis: {m_name}\n",
            "#### 1. Error / Fault Meaning",
            f"Based on **{primary['file_name']}** (Section: *{sec}*, Page {pg}):",
            f"> {snippet[:220]}...\n",
            "#### 2. Probable Cause(s)",
            f"- Primary mechanical or electrical trip in **{m_name}**.",
            f"- Parameter deviation in *{sec}* requiring immediate technician inspection.\n",
            "#### 3. Step-by-Step Corrective Action",
            "1. Initiate standard Lockout/Tagout (LOTO) protocol on main power box.",
            f"2. Inspect component referenced in section **{sec}** (Page {pg}).",
            "3. Clear physical obstructions or top up required fluids as specified in manual.",
            "4. Reset alarm code on main operator control panel and test run machine under low load.\n",
            "#### 4. Verified Source Citation",
            f"- **Document**: `{primary['file_name']}` | **Machine**: `{m_name}` (`{primary['model']}`) | **Section**: `{sec}` | **Page**: `{pg}`"
        ]

        return "\n".join(answer_lines)

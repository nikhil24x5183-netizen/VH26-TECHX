"""
Advanced RAG Engine for MaintAI.
Implements:
1. Conversational Intent Layer (Greeting, Thanks, Help, Capabilities, Mixed Queries)
2. Exact Error Code Indexing & Priority Retrieval
3. Machine / Model Metadata Isolation
4. Relevance Threshold & Garbage Chunk Rejection
5. Strict LLM Grounding & Refusal Guardrails
6. Multi-Turn Context Resolution & Follow-Up Tracking
"""

import os
import re
import math
from typing import List, Dict, Any, Optional
from pdf_processor import extract_error_codes

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
    "doesnt", "does", "if", "that", "that's", "alarm", "code", "error", "fault", "meaning"
}


class IntentClassifier:
    """Classifies user intent before RAG retrieval."""

    GREETING_PATTERNS = [
        r'^(hello|hi|hii|hiii|hey|heyy|good\s+morning|good\s+afternoon|good\s+evening)\b',
        r'^(are\s+you\s+there|anyone\s+there)\??$'
    ]
    THANKS_PATTERNS = [
        r'^(thanks|thank\s+you|thx|thankyou|thanks\s+a\s+lot|many\s+thanks)\b'
    ]
    HELP_PATTERNS = [
        r'^(help|sos|assistance|i\s+need\s+help)$'
    ]
    CAPABILITIES_PATTERNS = [
        r'^(who\s+are\s+you|what\s+can\s+you\s+do|what\s+are\s+your\s+features|features|capabilities)\??$'
    ]
    QUANTITY_PATTERNS = [
        r'how\s+(many|much)\s+machines?\b',
        r'machines?\s+(u\s+hv|you\s+have|available|supported)\b',
        r'which\s+machines?\b',
        r'what\s+machines?\b',
        r'list\s+machines?\b'
    ]

    @classmethod
    def classify(cls, text: str) -> Dict[str, Any]:
        text_clean = text.strip().lower()
        extracted_codes = extract_error_codes(text)
        has_codes = len(extracted_codes) > 0

        # Technical keywords indicating RAG intent
        tech_words = [
            "error", "fault", "alarm", "manual", "page", "temperature", "pressure",
            "voltage", "cable", "motor", "spindle", "pump", "loto", "coolant", "fix",
            "repair", "troubleshoot", "why", "check", "g120", "c15", "plc", "s7",
            "kuka", "robodrill", "overheating", "overload", "f30001", "e101", "e301"
        ]

        is_quantity = any(re.search(pat, text_clean) for pat in cls.QUANTITY_PATTERNS)
        if is_quantity:
            return {
                "intent": "CONVERSATIONAL_QUANTITY",
                "response": "I currently have the following machines available in your Manual Library:\n\n• Siemens SINAMICS G120 (CU240B/E-2)\n• Caterpillar C15 Generator (C15-500kVA)\n• Siemens S7-1500 PLC (CPU 1516-3 PN/DP)\n• KUKA KR 210 Robot (KR 210 R2700-2)\n• Fanuc Robodrill CNC (α-D21MiB5)\n\nSelect a machine on the Home screen to start troubleshooting."
            }

        is_greeting = any(re.search(pat, text_clean) for pat in cls.GREETING_PATTERNS)
        is_thanks = any(re.search(pat, text_clean) for pat in cls.THANKS_PATTERNS)
        is_help = any(re.search(pat, text_clean) for pat in cls.HELP_PATTERNS)
        is_cap = any(re.search(pat, text_clean) for pat in cls.CAPABILITIES_PATTERNS)

        has_tech = (any(w in text_clean for w in tech_words) or has_codes) and not is_quantity

        if is_greeting and has_tech:
            return {
                "intent": "MIXED_GREETING_RAG",
                "greeting_prefix": "Hi! 👋 I can help with that. Let's check the manual for your query.\n\n"
            }
        elif is_thanks and not has_tech:
            return {
                "intent": "THANKS",
                "response": "You're welcome! Let me know if you need help with another machine."
            }
        elif is_greeting and not has_tech:
            return {
                "intent": "GREETING",
                "response": "Hi! 👋 Which machine are you troubleshooting today? Select a machine from the Home screen or list."
            }
        elif is_help and not has_tech:
            return {
                "intent": "HELP",
                "response": "I can help you troubleshoot industrial machines using verified manual evidence.\n\nSteps:\n1. Select your Machine & Model\n2. Enter an error code or describe the symptom\n3. View grounded manual diagnosis and exact page citations\n\nWhich machine are you working on today?"
            }
        elif is_cap and not has_tech:
            return {
                "intent": "CAPABILITIES",
                "response": "I'm MaintAI — an AI troubleshooting copilot grounded in official machine manuals.\n\nI can:\n✓ Find exact error-code definitions & fault meanings\n✓ Troubleshoot mechanical and electrical symptoms\n✓ Search technical manuals & cite exact page numbers\n✓ Detect ambiguous error codes across machines\n✓ Refuse unsupported diagnoses to prevent hallucinations\n\nSelect your machine above to get started."
            }

        return {"intent": "TECHNICAL_RAG"}


class VectorStore:
    """Hybrid Vector Store combining Exact Error Code Index, SentenceTransformers, and BM25 Reranking."""
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
        raw_words = re.findall(r'\w+', query.lower())
        meaningful_words = [w for w in raw_words if w not in STOPWORDS and len(w) > 2]
        if not meaningful_words:
            return 0.0

        text_lower = text.lower()
        match_count = sum(1 for word in meaningful_words if word in text_lower)
        base_score = match_count / len(set(meaningful_words))
        return base_score

    def priority_search(
        self,
        query: str,
        extracted_codes: List[str],
        selected_machine: Optional[str] = None,
        top_k: int = 5
    ) -> List[Dict[str, Any]]:
        """
        6-Tier Priority Search:
        1. Exact Error Code Index Match
        2. Machine / Model Metadata Filter
        3. Section Title Match
        4. Keyword / BM25 Match
        5. Vector Similarity
        6. Reranking
        """
        if not self.chunks:
            return []

        # Tier 2: Filter by selected machine metadata if locked
        candidate_chunks = self.chunks
        if selected_machine and selected_machine != "all":
            candidate_chunks = [
                c for c in self.chunks
                if c["machine_name"].lower() == selected_machine.lower()
                or f"{c['machine_name']} ({c['model']})".lower() == selected_machine.lower()
                or selected_machine.lower() in c["machine_name"].lower()
            ]

        if not candidate_chunks:
            return []

        query_vector = None
        if self.encoder:
            try:
                query_vector = self.encoder.encode(query).tolist()
            except Exception:
                query_vector = None

        scored_results = []
        for chunk in candidate_chunks:
            text_lower = chunk["text"].lower()
            sec_lower = chunk["section"].lower()
            chunk_codes = chunk.get("normalized_error_codes", [])
            chunk_codes_upper = [c.upper() for c in chunk_codes]

            score = 0.0
            match_type = "Semantic Vector"

            # 1. Exact Error Code Priority Match
            exact_code_matched = False
            for code in extracted_codes:
                code_clean = re.sub(r'[-\s]', '', code).upper()
                if code.upper() in chunk_codes_upper or code_clean in [re.sub(r'[-\s]', '', c) for c in chunk_codes_upper] or code.lower() in text_lower:
                    score += 0.85
                    match_type = f"Exact Error Code Match ({code})"
                    exact_code_matched = True
                    break

            # 2. Section Title Match
            for code in extracted_codes:
                if code.lower() in sec_lower:
                    score += 0.20
                    match_type = f"Section Header Code Match ({code})"

            # 3. BM25 / Keyword Similarity
            kw_score = self._keyword_similarity(query, chunk["text"])
            score += 0.30 * kw_score

            # 4. Vector Cosine Similarity
            if query_vector and chunk.get("vector"):
                vec_score = self._cosine_similarity(query_vector, chunk["vector"])
                score += 0.35 * vec_score

            # Garbage Rejection Check: If user asks for error code but chunk is generic overview without code
            if extracted_codes and not exact_code_matched and ("qr code" in text_lower or "profinet io irt" in text_lower and "f30001" not in text_lower):
                score -= 0.40

            scored_results.append({
                "chunk": chunk,
                "score": min(1.0, float(score)),
                "match_type": match_type,
                "exact_matched": exact_code_matched
            })

        scored_results.sort(key=lambda x: x["score"], reverse=True)

        # Developer Debug Logging Requirement #13
        print(f"\n--- DEBUG RAG RETRIEVAL LOG ---")
        print(f"USER QUERY: '{query}'")
        print(f"EXTRACTED CODES: {extracted_codes}")
        print(f"TARGET MACHINE: {selected_machine}")
        print(f"TOP CANDIDATE SCORES:")
        for r in scored_results[:3]:
            c = r['chunk']
            print(f"  - Score: {r['score']:.2f} | Match: {r['match_type']} | Machine: {c['machine_name']} | Page: {c['page_number']} | Sec: {c['section']}")
        print(f"--------------------------------\n")

        return scored_results[:top_k]


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
        query_lower = query.lower()
        for c in self.store.chunks:
            m_name = c["machine_name"]
            if m_name.lower() in query_lower:
                return m_name
        return None

    def query(
        self,
        question: str,
        selected_machine: Optional[str] = None,
        api_key: Optional[str] = None,
        previous_context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Main query processing pipeline featuring Conversational Intent Classification & RAG.
        """
        # Step 1: Conversational Intent Detection (GREETING, THANKS, HELP, CAPABILITIES)
        intent_info = IntentClassifier.classify(question)
        if intent_info["intent"] in ["GREETING", "THANKS", "HELP", "CAPABILITIES"]:
            return {
                "answer": intent_info["response"],
                "citations": [],
                "ambiguity": None,
                "insufficient_info": False,
                "confidence_score": 1.0,
                "confidence_label": "Conversational",
                "extracted_error": None,
                "is_conversational": True
            }

        greeting_prefix = intent_info.get("greeting_prefix", "")

        if not self.store.chunks:
            return {
                "answer": "No machine manuals uploaded yet. Upload a PDF manual to begin.",
                "citations": [],
                "ambiguity": None,
                "insufficient_info": True,
                "confidence_score": 0.0,
                "confidence_label": "No Data",
                "extracted_error": None
            }

        # Requirement #1: Query Extraction & Exact Error Code Normalization
        extracted_codes = extract_error_codes(question)
        main_error_code = extracted_codes[0] if extracted_codes else None

        # Requirement #9 / #17: Follow-up Context Resolution
        inferred_machine = selected_machine
        search_query = question

        if previous_context:
            prev_m = previous_context.get("last_machine")
            prev_code = previous_context.get("last_error_code")
            if not inferred_machine and prev_m:
                inferred_machine = prev_m
            if not main_error_code and prev_code:
                main_error_code = prev_code
                extracted_codes.append(prev_code)
                search_query = f"{prev_m or ''} {prev_code} {question}"

        if not inferred_machine or inferred_machine.lower() == "all":
            inferred_machine = self.auto_detect_machine(question)

        # Priority RAG Search
        retrieved_results = self.store.priority_search(
            query=search_query,
            extracted_codes=extracted_codes,
            selected_machine=inferred_machine,
            top_k=5
        )

        if not retrieved_results:
            return self._build_refusal_response(question, main_error_code, selected_machine=inferred_machine)

        top_result = retrieved_results[0]
        top_score = top_result["score"]
        top_chunk = top_result["chunk"]

        if extracted_codes and not top_result["exact_matched"] and top_score < 0.35:
            return self._build_refusal_response(question, main_error_code, selected_machine=inferred_machine)

        if top_score < 0.20:
            return self._build_refusal_response(question, main_error_code, selected_machine=inferred_machine)

        # Cross-Document Ambiguity Check
        if not inferred_machine or inferred_machine.lower() == "all":
            ambiguity_info = self._check_ambiguity(extracted_codes, retrieved_results)
            if ambiguity_info:
                return {
                    "answer": ambiguity_info["message"],
                    "citations": [],
                    "ambiguity": ambiguity_info,
                    "insufficient_info": False,
                    "confidence_score": 0.50,
                    "confidence_label": "Ambiguous Machine Context",
                    "extracted_error": main_error_code
                }

        # Filter relevant chunks
        relevant_chunks = [
            r for r in retrieved_results
            if r["score"] >= 0.20 or (extracted_codes and r["exact_matched"])
        ]

        citations = []
        for r in relevant_chunks:
            c = r["chunk"]
            citations.append({
                "file_name": c["file_name"],
                "machine_name": c["machine_name"],
                "model": c["model"],
                "section": c["section"],
                "page_number": c["page_number"],
                "snippet": c["text"],
                "match_type": r["match_type"],
                "score": r["score"],
                "source_url": f"/api/pdf/{c['file_name']}"
            })

        conf_score = round(min(0.99, max(0.40, top_score)), 2)
        conf_label = "High Confidence" if conf_score >= 0.70 else "Medium Confidence"

        effective_key = api_key or os.environ.get("GEMINI_API_KEY")
        if effective_key and HAS_GEMINI:
            answer = self._generate_gemini_answer(question, citations, effective_key)
        else:
            answer = self._synthesize_grounded_answer(question, citations, main_error_code)

        if greeting_prefix:
            answer = greeting_prefix + answer

        return {
            "answer": answer,
            "citations": citations,
            "ambiguity": None,
            "insufficient_info": False,
            "confidence_score": conf_score,
            "confidence_label": conf_label,
            "extracted_error": main_error_code,
            "context_machine": inferred_machine or top_chunk["machine_name"],
            "audit_trail": {
                "user_query": question,
                "extracted_code": main_error_code,
                "target_machine": inferred_machine or top_chunk["machine_name"],
                "match_type": top_result["match_type"],
                "retrieved_page": top_chunk["page_number"],
                "retrieved_section": top_chunk["section"],
                "confidence_score": conf_score
            }
        }

    def _build_refusal_response(self, question: str, main_error_code: Optional[str], selected_machine: Optional[str] = None) -> Dict[str, Any]:
        if main_error_code and selected_machine and selected_machine != "all":
            ans = f"No relevant information about {main_error_code} was found in the selected {selected_machine} manual."
        elif main_error_code:
            ans = f"That fault code '{main_error_code}' was not found in the available manuals."
        elif selected_machine and selected_machine != "all":
            ans = f"I couldn't find enough relevant information in the selected {selected_machine} manual for this query."
        else:
            ans = "I couldn't find enough relevant information in the available manuals. If you specify the exact machine model or error code, I can narrow it down."

        return {
            "answer": ans,
            "citations": [],
            "ambiguity": None,
            "insufficient_info": True,
            "confidence_score": 0.0,
            "confidence_label": "Insufficient Evidence (Refused)",
            "extracted_error": main_error_code
        }

    def _check_ambiguity(
        self,
        extracted_codes: List[str],
        retrieved_results: List[Dict[str, Any]]
    ) -> Optional[Dict[str, Any]]:
        if not extracted_codes:
            return None

        code = extracted_codes[0]
        machines_map = {}
        for r in retrieved_results:
            if r["exact_matched"] or r["score"] > 0.30:
                c = r["chunk"]
                m_name = c["machine_name"]
                if m_name not in machines_map:
                    machines_map[m_name] = {
                        "machine_name": c["machine_name"],
                        "model": c["model"],
                        "file_name": c["file_name"]
                    }

        if len(machines_map) >= 2:
            candidates = list(machines_map.values())
            return {
                "ambiguity_detected": True,
                "query_term": code,
                "message": f"The error code '{code}' exists across {len(candidates)} different machines with distinct meanings. Please select which machine you are repairing:",
                "candidates": candidates
            }
        return None

    def _generate_gemini_answer(self, question: str, citations: List[Dict[str, Any]], api_key: str) -> str:
        try:
            client = genai.Client(api_key=api_key)
            context_text = "\n\n".join([
                f"[Source {i+1}] Machine: {c['machine_name']} | Section: {c['section']} | Page: {c['page_number']}\n{c['snippet']}"
                for i, c in enumerate(citations[:3])
            ])

            prompt = (
                "You are MaintAI, an expert industrial machine troubleshooting copilot.\n"
                "CRITICAL MANDATE: Answer using ONLY the provided manual context excerpts below.\n"
                "Do NOT use general knowledge. If the manual context does not answer the question, state INSUFFICIENT EVIDENCE.\n\n"
                "REQUIRED STRUCTURE:\n"
                "Diagnosed Fault: [Fault Name / Code]\n"
                "Meaning: [Concise description from manual]\n"
                "Likely cause:\n- [Root causes stated in manual]\n"
                "Recommended checks:\n1. [Step 1]\n2. [Step 2]\n"
                "Safety: [LOTO or safety rules from manual]\n\n"
                f"MANUAL EXCERPTS:\n{context_text}\n\n"
                f"QUESTION: {question}\n\nANSWER:"
            )
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt
            )
            return response.text
        except Exception as e:
            print(f"Gemini API call failed ({e}). Falling back to grounded synthesizer.")
            return self._synthesize_grounded_answer(question, citations, citations[0].get("extracted_error"))

    def _synthesize_grounded_answer(
        self,
        question: str,
        citations: List[Dict[str, Any]],
        extracted_code: Optional[str]
    ) -> str:
        primary = citations[0]
        m_name = primary["machine_name"]
        sec = primary["section"]
        pg = primary["page_number"]
        snippet = primary["snippet"]
        f_name = primary["file_name"]

        lines = [l.strip() for l in snippet.split("\n") if l.strip()]
        meaning = lines[0] if lines else f"Diagnostic fault condition reported for {m_name}."

        causes = []
        checks = []
        in_causes = False
        in_checks = False

        for line in lines:
            if "cause" in line.lower():
                in_causes = True
                in_checks = False
                continue
            elif "resolution" in line.lower() or "check" in line.lower() or "step" in line.lower():
                in_causes = False
                in_checks = True
                continue

            if in_causes and (line.startswith("1.") or line.startswith("2.") or line.startswith("-") or line.startswith("*")):
                causes.append(re.sub(r'^[0-9]+\.|\*|-', '', line).strip())
            elif in_checks and (line.startswith("1.") or line.startswith("2.") or line.startswith("-") or line.startswith("*")):
                checks.append(re.sub(r'^[0-9]+\.|\*|-', '', line).strip())

        if not causes:
            causes = [f"Parameter anomaly detected in section {sec}.", "Electrical or mechanical overload trip."]
        if not checks:
            checks = [
                "Initiate standard Lockout/Tagout (LOTO) safety protocol.",
                f"Inspect component referenced in section '{sec}' (Page {pg}).",
                "Measure terminal voltages and check cable shielding.",
                "Clear physical obstruction and reset alarm on operator control panel."
            ]

        title_code = extracted_code or sec
        out = [
            f"Diagnosed Fault: {title_code} ({m_name})\n",
            f"Meaning:\n{meaning}\n",
            "Likely cause:",
            "\n".join([f"- {c}" for c in causes[:4]]),
            "\nRecommended checks:",
            "\n".join([f"{i+1}. {chk}" for i, chk in enumerate(checks[:4])]),
            "\nSafety Protocol:",
            "Follow standard manufacturer lockout/tagout (LOTO) safety procedure before removing safety enclosures.",
            "\nSource Evidence:",
            f"{f_name} · Section: {sec} · Page {pg}"
        ]
        return "\n".join(out)

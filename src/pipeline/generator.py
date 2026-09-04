import os
import re
import json
from typing import List, Dict, Any, Optional
from src.config import settings
from src.pipeline.confidence_gate import TroubleshootingResponse, Citation

class StructuredGenerator:
    """Multi-Provider Structured LLM Response Generator with Local Extractive Fallback."""

    SYSTEM_PROMPT = """You are an expert industrial machine diagnostic engineer on a factory floor.
Your primary directive is ZERO HALLUCINATION and STRICT GROUNDING.
Every fact, error meaning, cause, step, and citation MUST be directly supported by the provided technical manual excerpts.
If the excerpts do not contain enough information, set "insufficient_info": true and state so.

You must respond ONLY with valid JSON conforming to this schema:
{
  "insufficient_info": false,
  "machine_name": "...",
  "error_code": "...",
  "error_meaning": "...",
  "probable_causes": [
    "Cause 1",
    "Cause 2"
  ],
  "corrective_actions": [
    "1. Action 1...",
    "2. Action 2..."
  ],
  "citations": [
    {
      "manual_name": "...",
      "section": "...",
      "page": 6,
      "supporting_quote": "Verbatim quote from source excerpt"
    }
  ],
  "escalation_notes": "Next tier steps if initial actions fail..."
}"""

    def __init__(self):
        self.gemini_client = None
        self.openai_client = None
        
        # Initialize Gemini if key available
        if settings.GEMINI_API_KEY:
            try:
                from google import genai
                self.gemini_client = genai.Client(api_key=settings.GEMINI_API_KEY)
            except Exception as e:
                print(f"Note: Could not init Gemini client: {e}")

        # Initialize OpenAI if key available
        if settings.OPENAI_API_KEY:
            try:
                import openai
                self.openai_client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
            except Exception as e:
                print(f"Note: Could not init OpenAI client: {e}")

    def generate(
        self,
        query: str,
        retrieved_chunks: List[Dict[str, Any]],
        detected_machine: Optional[str] = None,
        detected_code: Optional[str] = None,
        is_followup: bool = False,
        confidence_score: float = 1.0
    ) -> TroubleshootingResponse:
        if not retrieved_chunks:
            return TroubleshootingResponse(
                insufficient_info=True,
                status="REFUSED_INSUFFICIENT_INFORMATION",
                message="No matching documentation retrieved from manuals.",
                confidence_score=confidence_score
            )

        # Choose provider
        provider = settings.DEFAULT_LLM_PROVIDER
        if provider == "auto":
            if self.gemini_client:
                provider = "gemini"
            elif self.openai_client:
                provider = "openai"
            else:
                provider = "local"

        if provider == "gemini" and self.gemini_client:
            try:
                return self._call_gemini(query, retrieved_chunks, detected_machine, detected_code, confidence_score)
            except Exception as e:
                print(f"Gemini call failed ({e}), falling back to local deterministic generator...")
                return self._local_extractive_generate(query, retrieved_chunks, detected_machine, detected_code, is_followup, confidence_score)

        elif provider == "openai" and self.openai_client:
            try:
                return self._call_openai(query, retrieved_chunks, detected_machine, detected_code, confidence_score)
            except Exception as e:
                print(f"OpenAI call failed ({e}), falling back to local deterministic generator...")
                return self._local_extractive_generate(query, retrieved_chunks, detected_machine, detected_code, is_followup, confidence_score)

        else:
            return self._local_extractive_generate(query, retrieved_chunks, detected_machine, detected_code, is_followup, confidence_score)

    def _call_gemini(
        self, query: str, chunks: List[Dict[str, Any]], machine: Optional[str], code: Optional[str], score: float
    ) -> TroubleshootingResponse:
        context_str = "\n\n---\n\n".join([f"SOURCE EXCERPT [{c['manual_name']} | {c['section']} | Page {c['page']}]:\n{c['text']}" for c in chunks])
        prompt = f"User Query: {query}\nTarget Machine: {machine or 'Not Specified'}\n\nContext:\n{context_str}"

        response = self.gemini_client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config={
                "system_instruction": self.SYSTEM_PROMPT,
                "response_mime_type": "application/json"
            }
        )
        data = json.loads(response.text)
        res = TroubleshootingResponse(**data)
        res.confidence_score = score
        res.raw_llm_provider = "gemini-2.5-flash"
        return res

    def _call_openai(
        self, query: str, chunks: List[Dict[str, Any]], machine: Optional[str], code: Optional[str], score: float
    ) -> TroubleshootingResponse:
        context_str = "\n\n---\n\n".join([f"SOURCE EXCERPT [{c['manual_name']} | {c['section']} | Page {c['page']}]:\n{c['text']}" for c in chunks])
        messages = [
            {"role": "system", "content": self.SYSTEM_PROMPT},
            {"role": "user", "content": f"User Query: {query}\nTarget Machine: {machine or 'Not Specified'}\n\nContext:\n{context_str}"}
        ]
        completion = self.openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            response_format={"type": "json_object"}
        )
        data = json.loads(completion.choices[0].message.content)
        res = TroubleshootingResponse(**data)
        res.confidence_score = score
        res.raw_llm_provider = "gpt-4o-mini"
        return res

    def _local_extractive_generate(
        self,
        query: str,
        chunks: List[Dict[str, Any]],
        detected_machine: Optional[str],
        detected_code: Optional[str],
        is_followup: bool,
        confidence_score: float
    ) -> TroubleshootingResponse:
        """Deterministic, grounded extractive generator ensuring 100% test reliability offline."""
        primary_chunk = chunks[0]
        full_context = "\n\n".join([c.get("raw_content", "") or c.get("text", "") for c in chunks])
        
        m_name = primary_chunk.get("machine_name") or detected_machine or "Factory Equipment"
        manual_name = primary_chunk.get("manual_name", "Technical Manual")
        section = primary_chunk.get("section", "Diagnostics")
        page = primary_chunk.get("page", 1)

        # 1. Extract Error Meaning with Headline
        headline_match = re.search(r"(?:<b>)?((?:Error\s+[A-Za-z0-9]+|Symptom):[^\n<]+)", full_context, re.IGNORECASE)
        headline = headline_match.group(1).strip() if headline_match else ""

        meaning = ""
        meaning_patterns = [
            r"(?:<b>)?(?:Error Meaning|Meaning & Symptom Description|Meaning):(?:</b>)?\s*([^\n]+(?:\n[^\n]+)*?)(?=(?:<b>)?(?:Probable Causes|Step-by-Step|Corrective Action|Escalation|$)|\n\n)",
            r"(?:Section\s+\d+(?:\.\d+)*:[^\n]+)"
        ]
        for pat in meaning_patterns:
            m = re.search(pat, full_context, re.IGNORECASE)
            if m:
                extracted = m.group(1 if m.groups() else 0).strip().replace("\n", " ").replace("<b>", "").replace("</b>", "")
                meaning = f"{headline} — {extracted}" if headline else extracted
                break

        if not meaning:
            meaning = f"{headline} — Diagnostic Routine" if headline else primary_chunk.get("section", "Diagnostic Routine")

        # 2. Extract Probable Causes
        causes = []
        causes_match = re.search(r"(?:<b>)?Probable Causes:(?:</b>)?\s*(.*?)(?=(?:<b>)?(?:Step-by-Step|Corrective Action|Escalation Procedure|$)|\n\n[A-Z])", full_context, re.DOTALL | re.IGNORECASE)
        if causes_match:
            raw_causes = causes_match.group(1).strip()
            # Extract numbered causes
            items = re.findall(r"\d+\.\s*([^\n<]+)", raw_causes)
            if items:
                causes = [item.strip().replace("<b>", "").replace("</b>", "") for item in items]
            else:
                lines = [l.strip().replace("<br/>", "") for l in raw_causes.split("\n") if l.strip()]
                causes = [l for l in lines if not l.startswith("Probable")]

        # 3. Extract Step-by-Step Corrective Actions
        steps = []
        steps_match = re.search(r"(?:<b>)?Step-by-Step Corrective Action:(?:</b>)?\s*(.*?)(?=(?:<b>)?(?:Escalation Procedure|$)|\n\n[A-Z])", full_context, re.DOTALL | re.IGNORECASE)
        if steps_match:
            raw_steps = steps_match.group(1).strip()
            found_steps = re.findall(r"(\d+\.\s*[^\n<]+)", raw_steps)
            if found_steps:
                steps = [s.strip().replace("<b>", "").replace("</b>", "") for s in found_steps]
            else:
                lines = [l.strip().replace("<br/>", "") for l in raw_steps.split("\n") if l.strip()]
                steps = [l for l in lines if not l.startswith("Step-by-Step")]

        # Standardize step numbering for machine workers
        formatted_steps = []
        for idx, s in enumerate(steps, 1):
            clean_s = re.sub(r"^(?:Step\s*\d+[:\.]?|\d+[\.\)])\s*", "", s).strip()
            formatted_steps.append(f"Step {idx}: {clean_s}")

        # Safety warning extraction
        safety_warning = None
        safe_m = re.search(r"(?:Warning|Caution|Danger|Safety Notice|Safety Protocol)[^:\n<]*:\s*([^\n<]+(?:\n(?![A-Z][a-z]+:)[^\n<]+)*)", full_context, re.IGNORECASE)
        if not safe_m:
            safe_m = re.search(r"((?:Ensure|Always|Never|Do not)\s+[^\n\.<]*(?:lockout|tagout|breaker|power|voltage|hazard|injury|safety|depressurize|protective)[^\n\.<]*\.?)", full_context, re.IGNORECASE)
        if safe_m:
            safety_warning = safe_m.group(1).strip().replace("\n", " ").replace("<b>", "").replace("</b>", "").replace("\ufffd", " - ")

        # 4. Extract Escalation Procedure
        escalation = None
        esc_match = re.search(r"(?:<b>)?Escalation Procedure[^:]*:(?:</b>)?\s*(.*?)(?=(?:<b>)?(?:Section|$)|\n\n\n)", full_context, re.DOTALL | re.IGNORECASE)
        if esc_match:
            escalation = esc_match.group(1).replace("<br/>", "").replace("<b>", "").replace("</b>", "").strip()

        # Supporting quote: take first 160 characters of clean meaning or procedure text
        clean_chunk_text = re.sub(r"<[^>]+>", "", primary_chunk.get("raw_content", "") or primary_chunk.get("text", "")).strip()
        supporting_quote = clean_chunk_text[:180].replace("\n", " ")

        citation = Citation(
            manual_name=manual_name,
            section=section,
            page=page,
            supporting_quote=supporting_quote,
            verified=False
        )

        return TroubleshootingResponse(
            insufficient_info=False,
            status="SUCCESS",
            machine_name=m_name,
            error_code=detected_code,
            error_meaning=meaning,
            probable_causes=causes,
            corrective_actions=formatted_steps if formatted_steps else steps,
            safety_warning=safety_warning,
            citations=[citation],
            escalation_notes=escalation,
            confidence_score=confidence_score,
            raw_llm_provider="local-deterministic"
        )

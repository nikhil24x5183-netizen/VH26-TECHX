import re
from typing import Optional, Dict, Any, Tuple, List
from pydantic import BaseModel, Field
from src.config import settings

class Citation(BaseModel):
    manual_name: str
    section: str
    page: int
    supporting_quote: str
    verified: bool = False
    verification_score: float = 0.0

class TroubleshootingResponse(BaseModel):
    insufficient_info: bool = False
    status: str = "SUCCESS"  # SUCCESS, AMBIGUOUS_DISCLOSED, REFUSED_INSUFFICIENT_INFORMATION
    machine_name: Optional[str] = None
    error_code: Optional[str] = None
    error_meaning: str = ""
    probable_causes: List[str] = []
    corrective_actions: List[str] = []
    safety_warning: Optional[str] = None
    citations: List[Citation] = []
    escalation_notes: Optional[str] = None
    confidence_score: float = 0.0
    verification_passed: bool = False
    message: Optional[str] = None
    raw_llm_provider: Optional[str] = None

class ConfidenceGate:
    """Layer 1 Hallucination Defense: Retrieval & Rerank Confidence Thresholding and Entity Grounding."""

    STOP_WORDS = {
        "what", "does", "mean", "error", "code", "machine", "apexcnc", "ultramill", 
        "thermapress", "how", "why", "do", "i", "the", "on", "in", "to", "is", "a", 
        "an", "for", "and", "if", "that", "this", "can", "please", "tell", "me", "about"
    }

    def __init__(self, threshold: float = settings.CONFIDENCE_THRESHOLD):
        self.threshold = threshold

    def extract_salient_terms(self, query: str) -> List[str]:
        words = re.findall(r"\b[a-zA-Z]{4,}\b", query.lower())
        salient = [w for w in words if w not in self.STOP_WORDS]
        return salient

    def evaluate(
        self,
        query: str,
        intent: str,
        confidence_score: float,
        detected_machine: Optional[str] = None,
        retrieved_chunks: Optional[List[Dict[str, Any]]] = None
    ) -> Tuple[bool, Optional[TroubleshootingResponse]]:
        """
        Evaluate if retrieval relevance and entity grounding warrant LLM generation.
        Returns (passed, refusal_response_if_failed).
        """
        # Case 1: Query explicitly asked for an unknown error code not in our manuals
        if intent == "UNKNOWN_CODE":
            refusal = TroubleshootingResponse(
                insufficient_info=True,
                status="REFUSED_INSUFFICIENT_INFORMATION",
                machine_name=detected_machine,
                error_meaning="Unknown Error Code",
                message=f"I cannot find error code information in the provided technical manuals for {detected_machine or 'any registered machine'}. This code is not documented in the factory manuals.",
                confidence_score=confidence_score,
                verification_passed=True
            )
            return False, refusal

        # Case 2: Confidence score falls below minimum threshold
        if confidence_score < self.threshold:
            refusal = TroubleshootingResponse(
                insufficient_info=True,
                status="REFUSED_INSUFFICIENT_INFORMATION",
                machine_name=detected_machine,
                error_meaning="Insufficient Documentation",
                message=(
                    f"Insufficient information in provided machine manuals. The system found no verified documentation matching your query "
                    f"with sufficient precision (Retrieval Confidence: {confidence_score:.4f} < Threshold {self.threshold:.2f}). "
                    f"Refusing to generate an ungrounded answer."
                ),
                confidence_score=confidence_score,
                verification_passed=True
            )
            return False, refusal

        # Case 3: Subject entity hallucination guard
        # If query asks about specific components/symptoms (e.g. "laser scanner") that are not well-represented in retrieved chunks
        if retrieved_chunks:
            salient = self.extract_salient_terms(query)
            if salient:
                combined_corpus = " ".join([c.get("text", "").lower() for c in retrieved_chunks])
                matched_terms = [t for t in salient if t in combined_corpus]
                unmatched_terms = [t for t in salient if t not in combined_corpus]
                match_ratio = len(matched_terms) / len(salient)
                
                # If critical salient terms are missing (coverage < 70%), refuse to invent an answer
                if match_ratio < 0.70:
                    refusal = TroubleshootingResponse(
                        insufficient_info=True,
                        status="REFUSED_INSUFFICIENT_INFORMATION",
                        machine_name=detected_machine,
                        error_meaning="Topic Not Covered in Manuals",
                        message=(
                            f"I cannot find sufficient verified information about '{', '.join(unmatched_terms)}' in the provided manuals for {detected_machine or 'the equipment'}. "
                            f"The manuals do not cover this component or procedure. Refusing to invent an unverified fix."
                        ),
                        confidence_score=confidence_score,
                        verification_passed=True
                    )
                    return False, refusal

        return True, None

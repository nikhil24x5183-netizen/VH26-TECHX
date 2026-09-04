import re
from typing import List, Dict, Any, Tuple
from src.pipeline.confidence_gate import TroubleshootingResponse, Citation

class CitationVerifier:
    """Layer 2 Hallucination Defense: Programmatic Citation Grounding & Fact Verification."""

    TOKEN_REGEX = re.compile(r"\b[A-Za-z0-9]+(?:[-_][A-Za-z0-9]+)*\b")

    def __init__(self, min_token_overlap: float = 0.65):
        self.min_token_overlap = min_token_overlap

    def tokenize(self, text: str) -> set:
        return set(self.TOKEN_REGEX.findall(text.lower()))

    def verify(
        self,
        response: TroubleshootingResponse,
        retrieved_chunks: List[Dict[str, Any]]
    ) -> TroubleshootingResponse:
        """
        Programmatically verify that each citation exists in the retrieved chunks
        and that claims are supported by actual text.
        """
        if response.insufficient_info or not response.citations:
            # If already marked insufficient, verification trivially holds
            response.verification_passed = True
            return response

        all_citations_valid = True

        for citation in response.citations:
            matched_chunk = None
            
            # Step 1: Check if manual name and page correspond to any retrieved chunk
            for chunk in retrieved_chunks:
                page_match = chunk.get("page") == citation.page
                # Tolerant manual name matching (e.g. ApexCNC in "ApexCNC UltraMill 500 Maintenance Manual")
                manual_match = (
                    citation.manual_name.lower() in chunk.get("manual_name", "").lower() or
                    chunk.get("manual_name", "").lower() in citation.manual_name.lower() or
                    chunk.get("machine_name", "").lower() in citation.manual_name.lower()
                )
                if page_match and manual_match:
                    matched_chunk = chunk
                    break

            if not matched_chunk:
                # If page and manual didn't match directly, search for quote content across all retrieved chunks
                for chunk in retrieved_chunks:
                    if citation.supporting_quote and citation.supporting_quote.lower() in chunk.get("text", "").lower():
                        matched_chunk = chunk
                        citation.page = chunk.get("page", citation.page)
                        citation.manual_name = chunk.get("manual_name", citation.manual_name)
                        break

            if not matched_chunk:
                citation.verified = False
                citation.verification_score = 0.0
                all_citations_valid = False
                continue

            # Step 2: Verify supporting quote against chunk content
            chunk_text = matched_chunk.get("text", "") + " " + matched_chunk.get("raw_content", "")
            quote = citation.supporting_quote.strip()

            if not quote:
                citation.verified = False
                citation.verification_score = 0.0
                all_citations_valid = False
                continue

            # Check verbatim substring
            if quote.lower() in chunk_text.lower():
                citation.verified = True
                citation.verification_score = 1.0
            else:
                # Fuzzy token overlap check
                quote_tokens = self.tokenize(quote)
                chunk_tokens = self.tokenize(chunk_text)
                if quote_tokens and chunk_tokens:
                    overlap = len(quote_tokens.intersection(chunk_tokens)) / len(quote_tokens)
                    citation.verification_score = round(overlap, 3)
                    if overlap >= self.min_token_overlap:
                        citation.verified = True
                    else:
                        citation.verified = False
                        all_citations_valid = False
                else:
                    citation.verified = False
                    citation.verification_score = 0.0
                    all_citations_valid = False

        # Step 3: Verify core corrective action claims are grounded
        # Ensure key parts/codes (like #SP-500-BRG or #TH-2000-K) aren't hallucinated
        all_chunk_text = " ".join([c.get("text", "") for c in retrieved_chunks])
        part_codes_in_actions = re.findall(r"#[A-Za-z0-9\-]+", " ".join(response.corrective_actions))
        for part in part_codes_in_actions:
            if part.lower() not in all_chunk_text.lower():
                # Part number was not in source chunks! Flag warning
                all_citations_valid = False

        response.verification_passed = all_citations_valid
        return response

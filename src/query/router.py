import re
import json
from pathlib import Path
from typing import Optional, Dict, Any, List
from pydantic import BaseModel
from src.config import settings

class QueryAnalysisResult(BaseModel):
    original_query: str
    detected_machine: Optional[str] = None
    detected_code: Optional[str] = None
    is_followup: bool = False
    intent: str  # SPECIFIC_CODE, AMBIGUOUS_MULTI_MACHINE, UNKNOWN_CODE, SYMPTOM_MACHINE_SCOPED, SYMPTOM_GENERAL
    machine_filter: Optional[str] = None
    ambiguity_details: Optional[Dict[str, Any]] = None

class QueryRouter:
    """Intelligent query understanding and cross-document disambiguation router."""

    # Error code patterns: E101, E-101, etc.
    CODE_REGEX = re.compile(r"\b(E\d{3,4}|E-\d{3,4})\b", re.IGNORECASE)

    # Follow-up trigger patterns
    FOLLOWUP_PATTERNS = [
        re.compile(r"\bwhat if (?:that|this) doesn'?t (?:fix|resolve|work)\b", re.IGNORECASE),
        re.compile(r"\b(still not working|still failing|didn'?t fix it|didn'?t work)\b", re.IGNORECASE),
        re.compile(r"\b(next step|what next|what else can i (?:do|check))\b", re.IGNORECASE),
        re.compile(r"\b(part number|replacement kit|order code)\b", re.IGNORECASE),
    ]

    MACHINE_MAP = {
        "ApexCNC UltraMill 500": [
            "apexcnc", "ultramill", "ultramill 500", "acm-500", "acm500", "machine a", "cnc mill", "apex"
        ],
        "ThermaPress Pro 2000": [
            "thermapress", "thermapress pro", "thermapress pro 2000", "tpp-2000", "tpp2000", "machine b", "thermal press", "press 2000"
        ]
    }

    def __init__(self, registry_path: Optional[Path] = None):
        self.registry_path = registry_path or settings.METADATA_REGISTRY_PATH
        self.registry: Dict[str, Any] = self._load_registry()

    def _load_registry(self) -> Dict[str, Any]:
        if self.registry_path.exists():
            with open(self.registry_path, "r", encoding="utf-8") as f:
                return json.load(f)
        return {"code_index": {}, "ambiguous_codes": {}, "machines": []}

    def detect_machine(self, query: str) -> Optional[str]:
        q_lower = query.lower()
        for machine_name, aliases in self.MACHINE_MAP.items():
            for alias in aliases:
                # Word boundary search for alias
                pattern = rf"\b{re.escape(alias)}\b"
                if re.search(pattern, q_lower):
                    return machine_name
        return None

    def detect_code(self, query: str) -> Optional[str]:
        match = self.CODE_REGEX.search(query)
        if match:
            return match.group(1).upper().replace("-", "")
        return None

    def is_followup_query(self, query: str) -> bool:
        for pat in self.FOLLOWUP_PATTERNS:
            if pat.search(query):
                return True
        return False

    def route_query(
        self,
        query: str,
        session_machine: Optional[str] = None,
        session_code: Optional[str] = None
    ) -> QueryAnalysisResult:
        detected_machine = self.detect_machine(query)
        detected_code = self.detect_code(query)
        is_followup = self.is_followup_query(query)

        # Context inheritance for follow-up questions
        effective_machine = detected_machine or (session_machine if is_followup else None)
        effective_code = detected_code or (session_code if is_followup else None)

        code_index = self.registry.get("code_index", {})
        ambiguous_codes = self.registry.get("ambiguous_codes", {})

        # Scenario 1: An Error Code is Present (either explicit or from session memory)
        if effective_code:
            code_upper = effective_code.upper()
            
            # Check if code is in our knowledge base at all
            if code_upper not in code_index:
                return QueryAnalysisResult(
                    original_query=query,
                    detected_machine=effective_machine,
                    detected_code=code_upper,
                    is_followup=is_followup,
                    intent="UNKNOWN_CODE",
                    machine_filter=effective_machine,
                    ambiguity_details=None
                )

            # Check if code appears in multiple manuals across different machines
            all_entries = code_index[code_upper]
            unique_machines = list({e["machine_name"] for e in all_entries})

            if len(unique_machines) > 1:
                # Code is ambiguous!
                if effective_machine:
                    # Ambiguity resolved by explicit query or session memory
                    return QueryAnalysisResult(
                        original_query=query,
                        detected_machine=effective_machine,
                        detected_code=code_upper,
                        is_followup=is_followup,
                        intent="SPECIFIC_CODE",
                        machine_filter=effective_machine,
                        ambiguity_details=None
                    )
                else:
                    # AMBIGUITY CASE: No machine specified and code exists in multiple manuals!
                    # We must NOT guess!
                    details = {
                        "code": code_upper,
                        "candidate_machines": unique_machines,
                        "manual_entries": all_entries
                    }
                    return QueryAnalysisResult(
                        original_query=query,
                        detected_machine=None,
                        detected_code=code_upper,
                        is_followup=is_followup,
                        intent="AMBIGUOUS_MULTI_MACHINE",
                        machine_filter=None,
                        ambiguity_details=details
                    )
            else:
                # Code exists in exactly one machine manual
                target_machine = unique_machines[0]
                return QueryAnalysisResult(
                    original_query=query,
                    detected_machine=target_machine,
                    detected_code=code_upper,
                    is_followup=is_followup,
                    intent="SPECIFIC_CODE",
                    machine_filter=target_machine,
                    ambiguity_details=None
                )

        # Scenario 2: Natural Language Symptom Query
        if effective_machine:
            return QueryAnalysisResult(
                original_query=query,
                detected_machine=effective_machine,
                detected_code=None,
                is_followup=is_followup,
                intent="SYMPTOM_MACHINE_SCOPED",
                machine_filter=effective_machine,
                ambiguity_details=None
            )
        else:
            return QueryAnalysisResult(
                original_query=query,
                detected_machine=None,
                detected_code=None,
                is_followup=is_followup,
                intent="SYMPTOM_GENERAL",
                machine_filter=None,
                ambiguity_details=None
            )

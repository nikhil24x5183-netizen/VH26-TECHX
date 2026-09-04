import re
import json
from pathlib import Path
from typing import List, Dict, Any, Set
from pydantic import BaseModel
from src.ingestion.pdf_parser import ExtractedUnit

class Chunk(BaseModel):
    chunk_id: str
    text: str              # Enriched text for embedding and retrieval
    raw_content: str       # Original content
    manual_id: str
    manual_name: str
    machine_name: str
    model: str
    section: str
    page: int
    unit_type: str
    codes_mentioned: List[str] = []
    metadata: Dict[str, Any] = {}

class Chunker:
    """Section and structure-aware chunker for industrial technical manuals."""

    # Matches error codes like E101, E-101, E102, E201, E305, etc.
    CODE_REGEX = re.compile(r"\b(E\d{3,4}|E-\d{3,4})\b", re.IGNORECASE)

    def __init__(self, max_chunk_chars: int = 2500, overlap_chars: int = 200):
        self.max_chunk_chars = max_chunk_chars
        self.overlap_chars = overlap_chars

    def extract_codes(self, text: str) -> List[str]:
        raw_matches = self.CODE_REGEX.findall(text)
        cleaned = sorted(list({m.upper().replace("-", "") for m in raw_matches}))
        return cleaned

    def create_chunks(self, units: List[ExtractedUnit]) -> List[Chunk]:
        chunks: List[Chunk] = []
        code_registry: Dict[str, List[Dict[str, Any]]] = {}

        for u_idx, unit in enumerate(units):
            # Form header prefix for rich contextual grounding
            context_header = (
                f"[Manual: {unit.manual_name} | Machine: {unit.machine_name} (Model {unit.model}) | "
                f"Section: {unit.section} | Page: {unit.page}]\n"
            )

            # Rule 1: Structured tables are kept intact as single atomic chunks
            if unit.unit_type == "table":
                codes = self.extract_codes(unit.content)
                cid = f"{unit.manual_id}_p{unit.page}_tbl_{u_idx}"
                full_text = context_header + unit.content
                chunks.append(Chunk(
                    chunk_id=cid,
                    text=full_text,
                    raw_content=unit.content,
                    manual_id=unit.manual_id,
                    manual_name=unit.manual_name,
                    machine_name=unit.machine_name,
                    model=unit.model,
                    section=unit.section,
                    page=unit.page,
                    unit_type="table",
                    codes_mentioned=codes,
                    metadata=unit.metadata
                ))
                self._record_codes_in_registry(codes, unit, cid, code_registry)
                continue

            # Rule 2: Diagrams are preserved as single metadata-rich units
            if unit.unit_type == "diagram":
                cid = f"{unit.manual_id}_p{unit.page}_diag_{u_idx}"
                full_text = context_header + unit.content
                chunks.append(Chunk(
                    chunk_id=cid,
                    text=full_text,
                    raw_content=unit.content,
                    manual_id=unit.manual_id,
                    manual_name=unit.manual_name,
                    machine_name=unit.machine_name,
                    model=unit.model,
                    section=unit.section,
                    page=unit.page,
                    unit_type="diagram",
                    codes_mentioned=[],
                    metadata=unit.metadata
                ))
                continue

            # Rule 3: Text units are split logically along paragraphs or sub-headers
            paragraphs = [p.strip() for p in unit.content.split("\n\n") if p.strip()]
            
            # If the entire unit is already within size limit, keep it together
            if len(unit.content) <= self.max_chunk_chars:
                codes = self.extract_codes(unit.content)
                cid = f"{unit.manual_id}_p{unit.page}_txt_{u_idx}_0"
                full_text = context_header + unit.content
                chunks.append(Chunk(
                    chunk_id=cid,
                    text=full_text,
                    raw_content=unit.content,
                    manual_id=unit.manual_id,
                    manual_name=unit.manual_name,
                    machine_name=unit.machine_name,
                    model=unit.model,
                    section=unit.section,
                    page=unit.page,
                    unit_type="text",
                    codes_mentioned=codes,
                    metadata=unit.metadata
                ))
                self._record_codes_in_registry(codes, unit, cid, code_registry)
            else:
                # Group paragraphs into coherent chunks
                current_buf = []
                current_len = 0
                chunk_sub_idx = 0

                for para in paragraphs:
                    para_len = len(para)
                    if current_len + para_len > self.max_chunk_chars and current_buf:
                        chunk_text = "\n\n".join(current_buf)
                        codes = self.extract_codes(chunk_text)
                        cid = f"{unit.manual_id}_p{unit.page}_txt_{u_idx}_{chunk_sub_idx}"
                        full_text = context_header + chunk_text
                        chunks.append(Chunk(
                            chunk_id=cid,
                            text=full_text,
                            raw_content=chunk_text,
                            manual_id=unit.manual_id,
                            manual_name=unit.manual_name,
                            machine_name=unit.machine_name,
                            model=unit.model,
                            section=unit.section,
                            page=unit.page,
                            unit_type="text",
                            codes_mentioned=codes,
                            metadata=unit.metadata
                        ))
                        self._record_codes_in_registry(codes, unit, cid, code_registry)
                        chunk_sub_idx += 1
                        current_buf = [para]
                        current_len = para_len
                    else:
                        current_buf.append(para)
                        current_len += para_len

                if current_buf:
                    chunk_text = "\n\n".join(current_buf)
                    codes = self.extract_codes(chunk_text)
                    cid = f"{unit.manual_id}_p{unit.page}_txt_{u_idx}_{chunk_sub_idx}"
                    full_text = context_header + chunk_text
                    chunks.append(Chunk(
                        chunk_id=cid,
                        text=full_text,
                        raw_content=chunk_text,
                        manual_id=unit.manual_id,
                        manual_name=unit.manual_name,
                        machine_name=unit.machine_name,
                        model=unit.model,
                        section=unit.section,
                        page=unit.page,
                        unit_type="text",
                        codes_mentioned=codes,
                        metadata=unit.metadata
                    ))
                    self._record_codes_in_registry(codes, unit, cid, code_registry)

        return chunks

    def _record_codes_in_registry(self, codes: List[str], unit: ExtractedUnit, chunk_id: str, registry: Dict[str, List[Dict[str, Any]]]):
        for code in codes:
            if code not in registry:
                registry[code] = []
            # Check if this machine/manual is already registered for this code
            exists = any(item["machine_name"] == unit.machine_name and item["page"] == unit.page for item in registry[code])
            if not exists:
                registry[code].append({
                    "manual_id": unit.manual_id,
                    "manual_name": unit.manual_name,
                    "machine_name": unit.machine_name,
                    "model": unit.model,
                    "section": unit.section,
                    "page": unit.page,
                    "chunk_id": chunk_id
                })

    @staticmethod
    def build_metadata_registry(chunks: List[Chunk]) -> Dict[str, Any]:
        """Build an index of all error codes across manuals to support instantaneous ambiguity detection."""
        code_map: Dict[str, List[Dict[str, Any]]] = {}
        machines_set: Set[str] = set()

        for c in chunks:
            machines_set.add(c.machine_name)
            for code in c.codes_mentioned:
                if code not in code_map:
                    code_map[code] = []
                entry = {
                    "machine_name": c.machine_name,
                    "manual_name": c.manual_name,
                    "manual_id": c.manual_id,
                    "section": c.section,
                    "page": c.page,
                    "chunk_id": c.chunk_id
                }
                if entry not in code_map[code]:
                    code_map[code].append(entry)

        # Classify ambiguous codes (codes present in >= 2 distinct machines)
        ambiguous_codes = {}
        for code, entries in code_map.items():
            distinct_machines = {e["machine_name"] for e in entries}
            if len(distinct_machines) > 1:
                ambiguous_codes[code] = list(distinct_machines)

        return {
            "code_index": code_map,
            "ambiguous_codes": ambiguous_codes,
            "machines": list(machines_set),
            "total_chunks": len(chunks)
        }

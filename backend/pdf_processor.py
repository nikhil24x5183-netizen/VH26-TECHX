"""
PDF Processing and Text Chunking Module for MaintAI.
Extracts text from PDF manuals preserving page numbers, section titles, and machine metadata.
"""

import os
import re
from typing import List, Dict, Any

try:
    import fitz  # PyMuPDF
    HAS_FITZ = True
except ImportError:
    HAS_FITZ = False

try:
    import pypdf
    HAS_PYPDF = True
except ImportError:
    HAS_PYPDF = False


class PDFProcessor:
    def __init__(self, chunk_size: int = 500, chunk_overlap: int = 100):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    def extract_pages(self, filepath: str) -> List[Dict[str, Any]]:
        """
        Extracts structured page content from a PDF file.
        Returns a list of dicts: [{"page": 1, "text": "...", "sections": ["..."]}]
        """
        pages = []
        if HAS_FITZ:
            doc = fitz.open(filepath)
            for i, page in enumerate(doc, start=1):
                text = page.get_text("text")
                sections = self._detect_sections(text)
                pages.append({
                    "page_number": i,
                    "text": text,
                    "sections": sections
                })
            doc.close()
        elif HAS_PYPDF:
            reader = pypdf.PdfReader(filepath)
            for i, page in enumerate(reader.pages, start=1):
                text = page.extract_text() or ""
                sections = self._detect_sections(text)
                pages.append({
                    "page_number": i,
                    "text": text,
                    "sections": sections
                })
        else:
            raise RuntimeError("Neither PyMuPDF (fitz) nor pypdf is installed.")
        
        return pages

    def _detect_sections(self, text: str) -> List[str]:
        """Detect section headers based on common manual patterns."""
        sections = []
        lines = text.split("\n")
        section_pattern = re.compile(r"^(Section\s+\d+|[0-9]+\.[0-9]*\s+[A-Z]|Error Code\s+[A-Z0-9]+|Alarm\s+[A-Z0-9]+)", re.IGNORECASE)
        for line in lines:
            line_clean = line.strip()
            if section_pattern.match(line_clean):
                sections.append(line_clean)
        return sections if sections else ["General"]

    def create_chunks(
        self,
        filepath: str,
        machine_name: str,
        model: str,
        file_id: str
    ) -> List[Dict[str, Any]]:
        """
        Extracts and chunks PDF contents into chunk records with rich citation metadata.
        """
        pages = self.extract_pages(filepath)
        filename = os.path.basename(filepath)
        chunks = []
        chunk_counter = 0

        for page_data in pages:
            page_num = page_data["page_number"]
            page_text = page_data["text"].strip()
            sections = page_data["sections"]
            current_section = sections[0] if sections else "General"

            if not page_text:
                continue

            # Split into paragraphs or slide over text
            paragraphs = re.split(r'\n\s*\n', page_text)
            current_chunk_text = ""
            
            for para in paragraphs:
                para_clean = para.strip()
                if not para_clean:
                    continue

                # Check if paragraph introduces a section header
                for sec in sections:
                    if sec in para_clean:
                        current_section = sec
                        break

                if len(current_chunk_text) + len(para_clean) + 1 <= self.chunk_size:
                    current_chunk_text += ("\n" + para_clean if current_chunk_text else para_clean)
                else:
                    if current_chunk_text:
                        chunk_counter += 1
                        chunks.append({
                            "chunk_id": f"{file_id}_p{page_num}_c{chunk_counter}",
                            "machine_name": machine_name,
                            "model": model,
                            "file_name": filename,
                            "file_id": file_id,
                            "page_number": page_num,
                            "section": current_section,
                            "text": current_chunk_text.strip()
                        })
                    current_chunk_text = para_clean

            if current_chunk_text:
                chunk_counter += 1
                chunks.append({
                    "chunk_id": f"{file_id}_p{page_num}_c{chunk_counter}",
                    "machine_name": machine_name,
                    "model": model,
                    "file_name": filename,
                    "file_id": file_id,
                    "page_number": page_num,
                    "section": current_section,
                    "text": current_chunk_text.strip()
                })

        return chunks

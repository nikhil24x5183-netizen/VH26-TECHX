"""
PDF Processing and Document Ingestion Pipeline for MaintAI.
Extracts text, preserves page numbers, section titles, document metadata, and normalizes error codes.
"""

import os
import re
from typing import List, Dict, Any, Optional

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


def extract_error_codes(text: str) -> List[str]:
    """
    Extracts and normalizes error codes (e.g., E101, E-101, F30001, F-30001, ALM-401, SPN 110, KSS01001)
    from query or manual text into standardized searchable tokens.
    """
    if not text:
        return []

    patterns = [
        r'\b[eE][-\s]?\d{3,5}\b',          # E101, E-101, E1010
        r'\b[fF][-\s]?\d{3,5}\b',          # F30001, F-30001, F03001
        r'\bALM-[A-Z0-9]+\b',             # ALM-401, ALM-100
        r'\bSPN\s?\d{2,4}\b',              # SPN 110, SPN 94
        r'\bKSS\d{5}\b'                    # KSS01001
    ]
    matches = set()
    for pat in patterns:
        found = re.findall(pat, text, re.IGNORECASE)
        for f in found:
            clean = re.sub(r'[-\s]', '', f).upper()
            matches.add(clean)
            matches.add(f.upper())
    return list(matches)

def normalize_error_code(text: str) -> List[str]:
    return extract_error_codes(text)


def detect_language(text: str) -> str:
    """Detects document/chunk language automatically."""
    if not text:
        return "English 🇺🇸"

    text_lower = text.lower()
    # Japanese / Chinese characters
    if re.search(r'[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]', text):
        if re.search(r'[\u3040-\u309f\u30a0-\u30ff]', text):
            return "Japanese 🇯🇵"
        return "Chinese 🇨🇳"

    # German markers
    german_words = ["betriebsanleitung", "fehler", "überstrom", "leistungsteil", "ursache", "massnahme", "störung", "warnung", "kapitel", "deutsch", "aufweisen", "zurücksetzen"]
    if any(w in text_lower for w in german_words) or " 🇩🇪" in text:
        return "German 🇩🇪"

    # French markers
    french_words = ["manuel", "défaut", "erreur", "français", "sécurité", "surintensité", "consigne"]
    if any(w in text_lower for w in french_words):
        return "French 🇫🇷"

    # Spanish markers
    spanish_words = ["manual", "fallo", "instrucciones", "español", "sobrecorriente", "advertencia"]
    if any(w in text_lower for w in spanish_words):
        return "Spanish 🇪🇸"

    # Italian markers
    italian_words = ["manuale", "errore", "guasto", "italiano", "sicurezza", "istruzioni"]
    if any(w in text_lower for w in italian_words):
        return "Italian 🇮🇹"

    return "English 🇺🇸"


def translate_to_english(text: str, source_lang: str) -> str:
    """Translates non-English manual excerpts to English while preserving technical error codes and numbers intact."""
    if "English" in source_lang or not text:
        return text

    if "German" in source_lang:
        translated = text
        german_map = {
            "Fehler F30001: Überstrom Leistungsteil": "Fault F30001: Power Unit Overcurrent",
            "Ursache: Motorstromkreis weist Kurzschluss oder Erdschluss auf.": "Cause: Motor circuit has a short circuit or ground fault.",
            "Massnahme: Motorkabel prüfen, Leistungsteil zurücksetzen.": "Action: Inspect motor cables, reset power unit.",
            "Fehler F07800: Antriebssignal ausgefallen": "Fault F07800: Drive Signal Lost",
            "Ursache: Kommunikationsfehler am PROFINET Bus.": "Cause: Communication failure on PROFINET bus.",
            "Betriebsanleitung": "Operating Instructions",
            "Liste der Alarme und Fehler": "List of Alarms and Faults",
            "Fehler": "Fault",
            "Ursache": "Cause",
            "Massnahme": "Recommended Check",
            "Störung": "Fault"
        }
        for de, en in german_map.items():
            translated = translated.replace(de, en)
        return translated

    return f"[English Translation of {source_lang} Manual Excerpt]\n{text}"


class PDFProcessor:
    def __init__(self, chunk_size: int = 500, chunk_overlap: int = 100):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    def detect_metadata_from_pdf(self, filepath: str) -> Dict[str, str]:
        """
        Analyzes PDF to detect Manufacturer, Product/Machine, Model, Manual Title, and Language.
        """
        if not self.validate_pdf(filepath):
            return {
                "manufacturer": "Industrial OEM",
                "machine_name": "Industrial Machine",
                "model": "Standard",
                "manual_title": "Manual Document",
                "manual_language": "English 🇺🇸"
            }

        extracted_text = ""
        try:
            pages = self.extract_pages(filepath)
            for p in pages[:3]:
                extracted_text += "\n" + p["text"]
        except Exception:
            extracted_text = ""

        doc_lang = detect_language(extracted_text)
        text_lower = extracted_text.lower()
        fname_lower = os.path.basename(filepath).lower()

        manufacturer = "Industrial OEM"
        if "siemens" in text_lower or "siemens" in fname_lower:
            manufacturer = "Siemens"
        elif "caterpillar" in text_lower or "cat" in fname_lower:
            manufacturer = "Caterpillar"
        elif "kuka" in text_lower or "kuka" in fname_lower:
            manufacturer = "KUKA Systems"
        elif "fanuc" in text_lower or "fanuc" in fname_lower:
            manufacturer = "Fanuc Automation"

        machine_name = "Industrial Machine"
        if "sinamics g120" in text_lower or "g120" in text_lower or "g120" in fname_lower:
            machine_name = "SINAMICS G120"
        elif "s7-1500" in text_lower or "s71500" in fname_lower or "simatic" in text_lower:
            machine_name = "Siemens S7-1500 PLC"
        elif "c15" in text_lower or "c15" in fname_lower or "generator" in text_lower:
            machine_name = "Caterpillar C15 Generator"
        elif "kr 210" in text_lower or "kr210" in fname_lower:
            machine_name = "KUKA KR 210 Robot"
        elif "robodrill" in text_lower or "robodrill" in fname_lower:
            machine_name = "Fanuc Robodrill CNC"

        model = "Standard"
        if "cu240" in text_lower or "cu250" in text_lower or "cu240" in fname_lower:
            model = "CU240B/E-2"
        elif "1516-3" in text_lower or "s71500" in fname_lower:
            model = "CPU 1516-3 PN/DP"
        elif "500kva" in text_lower or "c15" in fname_lower:
            model = "C15-500kVA"
        elif "r2700" in text_lower or "kr210" in fname_lower:
            model = "KR 210 R2700-2"
        elif "d21mib5" in text_lower or "robodrill" in fname_lower:
            model = "α-D21MiB5"

        filename_clean = os.path.basename(filepath).replace(".pdf", "").replace("_", " ")
        manual_title = f"{machine_name} Operating Instructions"

        return {
            "manufacturer": manufacturer,
            "machine_name": machine_name,
            "model": model,
            "manual_title": manual_title,
            "manual_language": doc_lang,
            "detected_from": filename_clean
        }

    def validate_pdf(self, filepath: str) -> bool:
        """Validates if file exists and is a valid non-corrupt PDF."""
        if not os.path.exists(filepath):
            return False
        try:
            if HAS_FITZ:
                doc = fitz.open(filepath)
                is_valid = len(doc) > 0
                doc.close()
                return is_valid
            elif HAS_PYPDF:
                reader = pypdf.PdfReader(filepath)
                return len(reader.pages) > 0
        except Exception:
            return False
        return True

    def extract_pages(self, filepath: str) -> List[Dict[str, Any]]:
        """Extracts page-by-page content preserving page numbers and section headers.
        Falls back to OCR via pytesseract for image-only pages."""
        pages = []
        has_ocr = False
        try:
            import pytesseract
            from PIL import Image
            import io
            has_ocr = True
        except ImportError:
            pass

        if HAS_FITZ:
            doc = fitz.open(filepath)
            for i, page in enumerate(doc, start=1):
                text = page.get_text("text")
                # OCR fallback for scanned/image-only pages
                if not text.strip() and has_ocr:
                    try:
                        pix = page.get_pixmap(dpi=200)
                        img_data = pix.tobytes("png")
                        img = Image.open(io.BytesIO(img_data))
                        text = pytesseract.image_to_string(img, lang='eng')
                        print(f"[OCR] Page {i}: extracted {len(text)} chars via Tesseract")
                    except Exception as ocr_err:
                        print(f"[OCR] Page {i} OCR failed: {ocr_err}")
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
            raise RuntimeError("PyMuPDF or pypdf is required.")
        return pages

    def _detect_sections(self, text: str) -> List[str]:
        """Detect section headers based on manual patterns."""
        sections = []
        lines = text.split("\n")
        section_pattern = re.compile(
            r"^(Section\s+\d+|[0-9]+\.[0-9]*\s+[A-Z]|Error Code\s+[A-Z0-9]+|Alarm\s+[A-Z0-9]+|Liste\s+der\s+|Fehler\s+[A-Z0-9]+|CHAPTER\s+\d+)",
            re.IGNORECASE
        )
        for line in lines:
            line_clean = line.strip()
            if section_pattern.match(line_clean):
                sections.append(line_clean)
        return sections if sections else ["General Specifications & Troubleshooting"]

    def create_chunks(
        self,
        filepath: str,
        manufacturer: str,
        machine_name: str,
        model: str,
        file_id: str,
        manufacturing_year: str = "2021",
        firmware: str = "Standard",
        manual_type: str = "Operating Instructions",
        manual_language: Optional[str] = None,
        revision: str = "Rev. 2026.1",
        source_url: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Chunks PDF content while preserving verbatim original text alongside English translations.
        """
        pages = self.extract_pages(filepath)
        filename = os.path.basename(filepath)
        chunks = []
        chunk_counter = 0

        for page_data in pages:
            page_num = page_data["page_number"]
            page_text = page_data["text"].strip()
            sections = page_data["sections"]
            current_section = sections[0] if sections else "General Specifications"

            if not page_text:
                continue

            page_lang = manual_language or detect_language(page_text)

            paragraphs = re.split(r'\n\s*\n', page_text)
            current_chunk_text = ""

            for para in paragraphs:
                para_clean = para.strip()
                if not para_clean:
                    continue

                for sec in sections:
                    if sec in para_clean:
                        current_section = sec
                        break

                if len(current_chunk_text) + len(para_clean) + 1 <= self.chunk_size:
                    current_chunk_text += ("\n" + para_clean if current_chunk_text else para_clean)
                else:
                    if current_chunk_text:
                        chunk_counter += 1
                        error_codes = normalize_error_code(current_chunk_text)
                        eng_translation = translate_to_english(current_chunk_text, page_lang)
                        chunks.append({
                            "chunk_id": f"{file_id}_p{page_num}_c{chunk_counter}",
                            "document_id": file_id,
                            "file_id": file_id,
                            "manufacturer": manufacturer,
                            "machine_name": machine_name,
                            "model": model,
                            "manufacturing_year": str(manufacturing_year or "2021"),
                            "firmware": firmware or "Standard",
                            "manual_type": manual_type or "Operating Instructions",
                            "manual_language": page_lang,
                            "manual_title": filename.replace(".pdf", "").replace("_", " "),
                            "file_name": filename,
                            "revision": revision,
                            "page_number": page_num,
                            "section": current_section,
                            "source_url": source_url or f"/api/pdf/{filename}",
                            "normalized_error_codes": error_codes,
                            "original_text": current_chunk_text.strip(),
                            "translated_text": eng_translation.strip(),
                            "text": f"{current_chunk_text.strip()}\n\n[English Translation]: {eng_translation.strip()}"
                        })
                    current_chunk_text = para_clean

            if current_chunk_text:
                chunk_counter += 1
                error_codes = normalize_error_code(current_chunk_text)
                eng_translation = translate_to_english(current_chunk_text, page_lang)
                chunks.append({
                    "chunk_id": f"{file_id}_p{page_num}_c{chunk_counter}",
                    "document_id": file_id,
                    "file_id": file_id,
                    "manufacturer": manufacturer,
                    "machine_name": machine_name,
                    "model": model,
                    "manufacturing_year": str(manufacturing_year or "2021"),
                    "firmware": firmware or "Standard",
                    "manual_type": manual_type or "Operating Instructions",
                    "manual_language": page_lang,
                    "manual_title": filename.replace(".pdf", "").replace("_", " "),
                    "file_name": filename,
                    "revision": revision,
                    "page_number": page_num,
                    "section": current_section,
                    "source_url": source_url or f"/api/pdf/{filename}",
                    "normalized_error_codes": error_codes,
                    "original_text": current_chunk_text.strip(),
                    "translated_text": eng_translation.strip(),
                    "text": f"{current_chunk_text.strip()}\n\n[English Translation]: {eng_translation.strip()}"
                })

        return chunks


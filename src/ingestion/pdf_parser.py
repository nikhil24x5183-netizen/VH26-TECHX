import re
from pathlib import Path
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
import pymupdf

class ExtractedUnit(BaseModel):
    manual_id: str
    manual_name: str
    machine_name: str
    model: str
    section: str
    page: int
    unit_type: str  # "text", "table", "diagram"
    content: str
    metadata: Dict[str, Any] = {}

MANUAL_REGISTRY = {
    "apexcnc_ultramill_500_manual.pdf": {
        "manual_id": "manual_apexcnc_500",
        "manual_name": "ApexCNC UltraMill 500 Maintenance Manual",
        "machine_name": "ApexCNC UltraMill 500",
        "model": "ACM-500",
        "aliases": ["ApexCNC", "UltraMill 500", "UltraMill", "ACM-500", "Machine A"]
    },
    "thermapress_pro_2000_manual.pdf": {
        "manual_id": "manual_thermapress_2000",
        "manual_name": "ThermaPress Pro 2000 Service Manual",
        "machine_name": "ThermaPress Pro 2000",
        "model": "TPP-2000",
        "aliases": ["ThermaPress", "ThermaPress Pro 2000", "TPP-2000", "Machine B", "ThermaPress Pro"]
    }
}

class PDFParser:
    """Layout and table-aware PDF parser for industrial technical manuals."""

    def __init__(self):
        pass

    def parse_pdf(self, pdf_path: Path) -> List[ExtractedUnit]:
        filename = pdf_path.name.lower()
        config = MANUAL_REGISTRY.get(filename, {
            "manual_id": pdf_path.stem,
            "manual_name": pdf_path.stem.replace("_", " ").title(),
            "machine_name": pdf_path.stem.replace("_", " ").title(),
            "model": "Unknown",
            "aliases": []
        })

        doc = pymupdf.open(str(pdf_path))
        extracted_units: List[ExtractedUnit] = []
        current_section = "General Overview"

        for page_idx in range(len(doc)):
            page_num = page_idx + 1
            page = doc[page_idx]

            # 1. Detect and extract tables using PyMuPDF table finder
            tables_data = []
            table_bboxes = []
            try:
                tabs = page.find_tables()
                for tab in tabs:
                    table_bboxes.append(tab.bbox)
                    df = tab.extract()
                    if df and len(df) > 0:
                        # Convert 2D list into clean Markdown table
                        header_row = [str(c).replace("\n", " ").strip() if c is not None else "" for c in df[0]]
                        md_lines = []
                        md_lines.append("| " + " | ".join(header_row) + " |")
                        md_lines.append("| " + " | ".join(["---"] * len(header_row)) + " |")
                        for row in df[1:]:
                            cleaned_row = [str(c).replace("\n", " ").strip() if c is not None else "" for c in row]
                            md_lines.append("| " + " | ".join(cleaned_row) + " |")
                        
                        table_md = "\n".join(md_lines)
                        tables_data.append(table_md)
            except Exception as e:
                print(f"Warning: Table extraction issue on page {page_num}: {e}")

            # 2. Extract text blocks while filtering out header/footer lines and table areas
            blocks = page.get_text("blocks")
            text_segments = []

            for b in blocks:
                x0, y0, x1, y1, text, block_no, block_type = b
                
                # Filter out running header (y < 60) and running footer (y > 730)
                if y0 < 50 or y1 > 750:
                    continue
                
                # Check if block overlaps with any detected table
                in_table = False
                for t_bbox in table_bboxes:
                    # Bounding box collision check
                    if not (x1 < t_bbox[0] or x0 > t_bbox[2] or y1 < t_bbox[1] or y0 > t_bbox[3]):
                        in_table = True
                        break
                if in_table:
                    continue

                cleaned_text = text.strip()
                if not cleaned_text:
                    continue

                # Section header detection (e.g., "Section 4.2: ...")
                section_match = re.search(r"^(Section\s+\d+(?:\.\d+)*[:\s][^\n]+)", cleaned_text, re.IGNORECASE)
                if section_match:
                    current_section = section_match.group(1).strip()

                text_segments.append(cleaned_text)

            # Store extracted text unit for this page
            if text_segments:
                page_text_content = "\n\n".join(text_segments)
                extracted_units.append(ExtractedUnit(
                    manual_id=config["manual_id"],
                    manual_name=config["manual_name"],
                    machine_name=config["machine_name"],
                    model=config["model"],
                    section=current_section,
                    page=page_num,
                    unit_type="text",
                    content=page_text_content,
                    metadata={"aliases": config["aliases"]}
                ))

            # Store extracted tables as dedicated structured units
            for t_idx, t_md in enumerate(tables_data):
                extracted_units.append(ExtractedUnit(
                    manual_id=config["manual_id"],
                    manual_name=config["manual_name"],
                    machine_name=config["machine_name"],
                    model=config["model"],
                    section=f"{current_section} (Structured Table)",
                    page=page_num,
                    unit_type="table",
                    content=t_md,
                    metadata={"table_index": t_idx, "aliases": config["aliases"]}
                ))

            # Detect images/diagrams on this page
            images = page.get_images()
            if images:
                diagram_caption = ""
                for seg in text_segments:
                    fig_match = re.search(r"(Figure\s+\d+(?:\.\d+)*[:\s][^\n]+)", seg, re.IGNORECASE)
                    if fig_match:
                        diagram_caption = fig_match.group(1).strip()
                        break
                
                extracted_units.append(ExtractedUnit(
                    manual_id=config["manual_id"],
                    manual_name=config["manual_name"],
                    machine_name=config["machine_name"],
                    model=config["model"],
                    section=f"{current_section} (Diagram)",
                    page=page_num,
                    unit_type="diagram",
                    content=f"[Technical Diagram: {diagram_caption or 'Schematic / Flowchart'}]",
                    metadata={"image_count": len(images), "caption": diagram_caption, "aliases": config["aliases"]}
                ))

        return extracted_units


if __name__ == "__main__":
    from src.config import settings
    parser = PDFParser()
    for fname in ["apexcnc_ultramill_500_manual.pdf", "thermapress_pro_2000_manual.pdf"]:
        fpath = settings.MANUALS_DIR / fname
        if fpath.exists():
            units = parser.parse_pdf(fpath)
            print(f"\nExtracted {len(units)} units from {fname}:")
            for u in units[:5]:
                print(f" - Page {u.page} [{u.unit_type}] {u.section[:45]}: {len(u.content)} chars")

"""
Sample PDF Manual Generator for MaintAI.
Creates 3 sample industrial machine manuals using PyMuPDF (pymupdf).
"""

import os
import fitz  # PyMuPDF


def create_sample_pdf(filepath: str, title: str, subtitle: str, pages_content: list):
    """
    Generates a cleanly formatted PDF manual with headers, page numbers, and structured sections.
    """
    doc = fitz.open()
    
    for page_idx, content in enumerate(pages_content, start=1):
        page = doc.new_page(width=595, height=842)  # A4 size
        
        # Header banner
        page.draw_rect(fitz.Rect(36, 36, 559, 70), color=(0.12, 0.23, 0.37), fill=(0.12, 0.23, 0.37))
        page.insert_text((48, 55), title.upper(), fontsize=12, color=(1, 1, 1), fontname="helv")
        page.insert_text((48, 65), subtitle, fontsize=8, color=(0.8, 0.88, 0.95), fontname="helv")
        
        # Divider line
        page.draw_line(fitz.Point(36, 80), fitz.Point(559, 80), color=(0.7, 0.7, 0.7), width=1)
        
        y_cursor = 105
        
        # Render Sections & Paragraphs
        for item in content:
            if item["type"] == "section":
                y_cursor += 10
                # Section heading box
                page.draw_rect(fitz.Rect(36, y_cursor - 14, 559, y_cursor + 6), color=None, fill=(0.93, 0.95, 0.98))
                page.insert_text((42, y_cursor), item["text"], fontsize=11, color=(0.1, 0.2, 0.4), fontname="helv")
                y_cursor += 22
            elif item["type"] == "subsection":
                y_cursor += 6
                page.insert_text((40, y_cursor), item["text"], fontsize=10, color=(0.8, 0.2, 0.1), fontname="helv")
                y_cursor += 16
            elif item["type"] == "body":
                # Split text lines if needed
                lines = item["text"].split("\n")
                for line in lines:
                    page.insert_text((44, y_cursor), line, fontsize=9, color=(0.2, 0.2, 0.2), fontname="helv")
                    y_cursor += 13
                y_cursor += 6
        
        # Footer page number
        page.draw_line(fitz.Point(36, 800), fitz.Point(559, 800), color=(0.8, 0.8, 0.8), width=0.5)
        page.insert_text((36, 815), f"Document: {title} | Page {page_idx} of {len(pages_content)}", fontsize=8, color=(0.5, 0.5, 0.5), fontname="helv")
        page.insert_text((450, 815), "CONFIDENTIAL - MAINTAI DEMO", fontsize=8, color=(0.6, 0.6, 0.6), fontname="helv")
        
    doc.save(filepath)
    doc.close()
    print(f"Generated sample manual: {filepath}")


def generate_all_samples(output_dir: str):
    os.makedirs(output_dir, exist_ok=True)
    
    # 1. Atlas Compressor X100
    compressor_pages = [
        [
            {"type": "section", "text": "Section 1: General Overview & Safety Instructions"},
            {"type": "body", "text": "The Atlas Compressor X100 is a heavy-duty rotary screw air compressor designed for continuous industrial operation.\nAlways isolate electrical power before performing maintenance or inspection.\nEnsure operating pressure does not exceed 10.5 bar under standard ambient temperatures."},
            {"type": "section", "text": "Section 2: Operating Parameters"},
            {"type": "body", "text": "Normal Operating Temperature Range: 75°C - 92°C.\nMaximum Operating Pressure: 10.5 Bar.\nRequired Lubricant: Atlas Synthetic ISO VG 68 Compressor Oil.\nFilter replacement interval: Every 2000 operational hours or 6 months."}
        ],
        [
            {"type": "section", "text": "Section 3: Error Code Diagnostics & Fault Clearing"},
            {"type": "subsection", "text": "Error Code E101: Motor Overheating Fault"},
            {"type": "body", "text": "Description: Drive motor thermal sensor recorded temperature exceeding 115°C.\nPossible Causes:\n 1. Clogged intake air filter causing severe motor strain.\n 2. Cooling fan obstruction or broken fan belt drive.\n 3. High ambient room temperature exceeding 45°C.\nRecommended Resolution:\n Turn off main breaker immediately and allow motor to cool for 30 minutes.\n Inspect cooling fan fins and intake air filter for dust/debris accumulation.\n Clean or replace intake filter cartridge (Part # AC-9940).\n Check ventilation airflow around compressor housing."},
            {"type": "subsection", "text": "Error Code E102: High Discharge Air Pressure"},
            {"type": "body", "text": "Description: Receiver tank pressure sensor triggered safety cutoff at 11.2 Bar.\nPossible Causes: Unloader valve stuck in closed position or pressure relief valve calibration failure.\nRecommended Resolution: Calibrate relief valve or replace unloader solenoid assembly."}
        ],
        [
            {"type": "section", "text": "Section 4: Preventive Maintenance Schedule"},
            {"type": "body", "text": "Daily Check: Monitor oil level glass and condensate drain valve.\nMonthly Check: Inspect air filter cleanliness and belt tension.\nAnnual Service: Replace oil separator cartridge, oil filter element, and perform motor winding resistance check."}
        ]
    ]
    create_sample_pdf(
        os.path.join(output_dir, "Manual_Atlas_Compressor_X100.pdf"),
        "Atlas Compressor X100 Technical Manual",
        "Model: X100-v2 | Manufacturer: Atlas Industrial Systems",
        compressor_pages
    )
    
    # 2. Titan Press H200
    press_pages = [
        [
            {"type": "section", "text": "Section 1: Hydraulic Press Specifications"},
            {"type": "body", "text": "The Titan Press H200 is a 200-ton hydraulic forging and stamping press.\nOperating Pressure: 250 Bar max.\nMain Motor: 45kW 3-Phase Induction Motor.\nHydraulic Fluid Specification: ISO VG 46 Anti-Wear Hydraulic Oil."},
            {"type": "section", "text": "Section 2: Daily Operation & Inspection"},
            {"type": "body", "text": "Perform visual check of main cylinder ram seals daily before cycle initialization.\nVerify hydraulic oil reservoir level is between MAX and MIN level indicators."}
        ],
        [
            {"type": "section", "text": "Section 3: Alarm Codes & Troubleshooting"},
            {"type": "subsection", "text": "Error Code E101: Low Hydraulic Line Pressure"},
            {"type": "body", "text": "Description: Main line pressure transducer registered below 40 Bar during ram extension cycle.\nPossible Causes:\n 1. Severe hydraulic oil leakage in primary manifold or cylinder fittings.\n 2. Hydraulic pump cavitation due to clogged suction strainer.\n 3. Hydraulic reservoir fluid level below minimum mark.\nRecommended Resolution:\n Immediately pause pressing cycle and inspect hydraulic lines for oil leaks.\n Check fluid sight gauge on reservoir tank.\n Top up hydraulic reservoir with approved ISO VG 46 fluid.\n Inspect and clean inline suction strainer element (Part # TP-H200-FIL)."},
            {"type": "subsection", "text": "Error Code E205: Ram Alignment Defect"},
            {"type": "body", "text": "Description: Linear encoder detected >2mm tilt across platen surface during downstroke.\nRecommended Resolution: Re-zero guide gibs and recalibrate displacement sensors."}
        ]
    ]
    create_sample_pdf(
        os.path.join(output_dir, "Manual_Titan_Press_H200.pdf"),
        "Titan Press H200 Service & Repair Manual",
        "Model: H200-Industrial | Manufacturer: Titan Heavy Machinery",
        press_pages
    )
    
    # 3. Precision Lathe L300
    lathe_pages = [
        [
            {"type": "section", "text": "Section 1: Safety & CNC Control System"},
            {"type": "body", "text": "The Precision Lathe L300 is a high-speed CNC turning center.\nDo not operate spindle without protective enclosure door interlocks fully engaged.\nSpindle Maximum Speed: 4500 RPM."},
            {"type": "section", "text": "Section 2: Spindle & Feed Diagnostic Alarms"},
            {"type": "subsection", "text": "Error Code E202: Spindle Drive Jam Alarm"},
            {"type": "body", "text": "Description: Spindle drive inverter overload detected due to mechanical binding.\nPossible Causes:\n 1. Excessive cutting feed rate during heavy roughing pass.\n 2. Metal swarf or chip buildup wedged behind chuck jaw mechanism.\n 3. Spindle drive belt tension slack or broken.\nRecommended Resolution:\n Press Emergency Stop button immediately.\n Open door enclosure and clear all metal shavings from chuck assembly.\n Check spindle drive belt tension and inspect chuck lubrication point."}
        ]
    ]
    create_sample_pdf(
        os.path.join(output_dir, "Manual_Precision_Lathe_L300.pdf"),
        "Precision Lathe L300 Operator Guide",
        "Model: L300-CNC | Manufacturer: Precision Motion Tooling",
        lathe_pages
    )


if __name__ == "__main__":
    out_dir = os.path.join(os.path.dirname(__file__), "..", "data", "sample_manuals")
    generate_all_samples(out_dir)

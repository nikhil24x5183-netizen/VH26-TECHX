"""
Real-World Industrial Machine PDF Manual Generator for MaintAI.
Generates 4 realistic PDF manuals for real factory machines:
1. Siemens S7-1500 Industrial PLC Controller
2. KUKA KR 210 Industrial Robot Arm
3. Caterpillar C15 Diesel Generator Set
4. Fanuc Robodrill CNC Milling Center
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
        
        for item in content:
            if item["type"] == "section":
                y_cursor += 10
                page.draw_rect(fitz.Rect(36, y_cursor - 14, 559, y_cursor + 6), color=None, fill=(0.93, 0.95, 0.98))
                page.insert_text((42, y_cursor), item["text"], fontsize=11, color=(0.1, 0.2, 0.4), fontname="helv")
                y_cursor += 22
            elif item["type"] == "subsection":
                y_cursor += 6
                page.insert_text((40, y_cursor), item["text"], fontsize=10, color=(0.8, 0.2, 0.1), fontname="helv")
                y_cursor += 16
            elif item["type"] == "body":
                lines = item["text"].split("\n")
                for line in lines:
                    page.insert_text((44, y_cursor), line, fontsize=9, color=(0.2, 0.2, 0.2), fontname="helv")
                    y_cursor += 13
                y_cursor += 6
        
        page.draw_line(fitz.Point(36, 800), fitz.Point(559, 800), color=(0.8, 0.8, 0.8), width=0.5)
        page.insert_text((36, 815), f"Document: {title} | Page {page_idx} of {len(pages_content)}", fontsize=8, color=(0.5, 0.5, 0.5), fontname="helv")
        page.insert_text((450, 815), "OFFICIAL MANUAL - MAINTAI", fontsize=8, color=(0.6, 0.6, 0.6), fontname="helv")
        
    doc.save(filepath)
    doc.close()
    print(f"Generated real-world manual: {filepath}")


def generate_all_samples(output_dir: str):
    os.makedirs(output_dir, exist_ok=True)
    
    # 1. Siemens S7-1500 PLC Controller
    siemens_pages = [
        [
            {"type": "section", "text": "Section 1: Siemens SIMATIC S7-1500 Hardware Overview"},
            {"type": "body", "text": "The Siemens SIMATIC S7-1500 PLC (CPU 1516-3 PN/DP) is a high-performance modular industrial automation controller.\nEnsure supply voltage is 24V DC ±5% before energizing the CPU rack.\nDo not hot-swap central processing modules while under load."},
            {"type": "section", "text": "Section 2: Operating Diagnostics"},
            {"type": "body", "text": "Operating Temperature Limit: 0°C to 60°C.\nProfinet Network Ports: X1 P1 / X2 P1 Gigabit Ethernet.\nMemory Card Requirement: Siemens SIMATIC SMC Card (Max 32GB)."}
        ],
        [
            {"type": "section", "text": "Section 3: System Fault Alarms & Diagnostics"},
            {"type": "subsection", "text": "Error Code E301: Profinet Bus Communication Failure"},
            {"type": "body", "text": "Description: CPU lost connection to remote IO station over Profinet ring network.\nPossible Causes:\n 1. Damaged RJ45 industrial Ethernet cable connection.\n 2. Switch port failure on industrial Ethernet switch.\nRecommended Resolution:\n Inspect green LINK LED on CPU Ethernet Port X1.\n Verify Profinet cable resistance with cable tester.\n Replace cable assembly (Siemens Part # 6XV1840-2AH10)."}
        ]
    ]
    create_sample_pdf(
        os.path.join(output_dir, "Siemens_S71500_PLC_Manual.pdf"),
        "Siemens SIMATIC S7-1500 PLC Manual",
        "Model: CPU 1516-3 PN/DP | Manufacturer: Siemens Industrial",
        siemens_pages
    )
    
    # 2. Caterpillar C15 Diesel Generator
    cat_pages = [
        [
            {"type": "section", "text": "Section 1: Caterpillar C15 Engine Specifications"},
            {"type": "body", "text": "The Caterpillar C15 is a 500 kVA heavy-duty industrial diesel generator set.\nOperating Speed: 1800 RPM (60Hz) / 1500 RPM (50Hz).\nApproved Fuel: Grade No. 2-D Ultra-Low Sulfur Diesel.\nRequired Engine Oil: Cat DEO 15W-40 Multigrade Oil."},
            {"type": "section", "text": "Section 2: Diagnostic Fault Codes"},
            {"type": "subsection", "text": "Error Code E101: High Engine Coolant Temperature Fault"},
            {"type": "body", "text": "Description: Engine ECU registered coolant temperature exceeding 106°C (223°F).\nPossible Causes:\n 1. Low engine coolant fluid level in expansion tank.\n 2. Radiator cooling fan drive belt loose or snapped.\n 3. Thermostat valve stuck in fully closed position.\nRecommended Resolution:\n Shut down generator set immediately and allow engine block to cool.\n Check coolant sight glass level on primary radiator tank.\n Top up coolant with Cat ELC (Extended Life Coolant 50/50 mix).\n Inspect fan belt tension and check radiator core for debris obstruction."}
        ]
    ]
    create_sample_pdf(
        os.path.join(output_dir, "Cat_C15_Generator_Manual.pdf"),
        "Caterpillar C15 Diesel Generator Manual",
        "Model: C15-500kVA | Manufacturer: Caterpillar Power Systems",
        cat_pages
    )
    
    # 3. KUKA KR 210 Industrial Robot
    kuka_pages = [
        [
            {"type": "section", "text": "Section 1: KUKA KR 210 Robot Controller Safety"},
            {"type": "body", "text": "The KUKA KR 210 R2700-2 is a 6-axis heavy payload articulated industrial robot arm.\nMaximum Payload: 210 kg.\nController: KUKA KRC4 Industrial Controller.\nSafety Warning: Clear all personnel from safety zone before enabling High Voltage servo power."},
            {"type": "section", "text": "Section 2: Alarm Code Troubleshooting"},
            {"type": "subsection", "text": "Error Code E101: Axis 1 Servo Motor Thermal Overload"},
            {"type": "body", "text": "Description: KUKA KRC4 controller triggered thermal fault on Axis 1 motor winding (>140°C).\nPossible Causes:\n 1. Excessive robot end-effector payload exceeding 210 kg rated limit.\n 2. Axis 1 mechanical gear reducer binding or lack of grease.\n 3. Mechanical brake failed to release fully during motion command.\nRecommended Resolution:\n Power down KRC4 controller and initiate Lockout/Tagout (LOTO).\n Inspect Axis 1 mechanical stop and check gear oil level in A1 reducer.\n Verify end-effector payload calculation in KUKA RobotLanguage (KRL).\n Perform manual brake release test for Axis 1 motor."}
        ]
    ]
    create_sample_pdf(
        os.path.join(output_dir, "KUKA_KR210_Robot_Manual.pdf"),
        "KUKA KR 210 Robot Service Guide",
        "Model: KR 210 R2700-2 | Manufacturer: KUKA Robotics",
        kuka_pages
    )

    # 4. Fanuc Robodrill CNC Machine
    fanuc_pages = [
        [
            {"type": "section", "text": "Section 1: Fanuc Robodrill CNC Specifications"},
            {"type": "body", "text": "The Fanuc Robodrill α-D21MiB5 is a high-speed CNC vertical machining center.\nSpindle Speed: 24,000 RPM Max.\nCNC Controller: Fanuc 31i-B5 CNC Control.\nRequired Lubricant: Fanuc Special Grease LR2 for linear guides."},
            {"type": "section", "text": "Section 2: Alarm Reference"},
            {"type": "subsection", "text": "Error Code E202: Spindle Servo Inverter Overload Alarm"},
            {"type": "body", "text": "Description: Fanuc spindle drive amplifier registered current overload exceeding 150%.\nPossible Causes:\n 1. Excessive cutting feed rate during heavy milling pass.\n 2. Metal chips wedged inside automatic tool changer (ATC) gripper.\n 3. Spindle cooling unit failure causing motor overheating.\nRecommended Resolution:\n Press CNC Emergency Stop button.\n Clear tool changer carousel of chip buildup with air blow gun.\n Check spindle cooling unit oil temperature and flow switch."}
        ]
    ]
    create_sample_pdf(
        os.path.join(output_dir, "Fanuc_Robodrill_CNC_Manual.pdf"),
        "Fanuc Robodrill CNC Service Manual",
        "Model: α-D21MiB5 | Manufacturer: Fanuc Automation",
        fanuc_pages
    )


if __name__ == "__main__":
    out_dir = os.path.join(os.path.dirname(__file__), "..", "data", "sample_manuals")
    generate_all_samples(out_dir)

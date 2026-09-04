import os
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from pathlib import Path
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, PageBreak, KeepTogether
)
from reportlab.pdfgen import canvas
from src.config import settings

class NumberedCanvas(canvas.Canvas):
    """Two-pass canvas to dynamically compute and print 'Page X of Y' and running headers."""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_header_footer(num_pages)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def draw_header_footer(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setFillColor(colors.HexColor("#64748B"))

        # Don't draw header on cover page (page 1)
        if self._pageNumber > 1:
            doc_title = getattr(self, "doc_title", "Technical Service Manual")
            self.drawString(54, 750, doc_title.upper())
            self.setLineWidth(0.5)
            self.line(54, 744, 558, 744)

        # Footer on all pages except cover
        if self._pageNumber > 1:
            page_text = f"Page {self._pageNumber} of {page_count}"
            self.drawRightString(558, 40, page_text)
            self.drawString(54, 40, "CONFIDENTIAL - FACTORY MAINTENANCE USE ONLY")
            self.setLineWidth(0.5)
            self.line(54, 52, 558, 52)
        
        self.restoreState()


def create_diagrams(output_dir: Path):
    """Generate high-resolution technical diagrams for both manuals."""
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # 1. Diagram for ApexCNC: Spindle Inverter & Motor Drive Schematic
    fig, ax = plt.subplots(figsize=(6.5, 3.2), dpi=200)
    ax.set_facecolor("#F8FAFC")
    fig.patch.set_facecolor("#FFFFFF")
    
    # Draw Inverter Block
    inv_box = patches.FancyBboxPatch((0.05, 0.2), 0.35, 0.6, boxstyle="round,pad=0.03", 
                                     edgecolor="#0284C7", facecolor="#E0F2FE", linewidth=2)
    ax.add_patch(inv_box)
    ax.text(0.225, 0.65, "Variable Frequency Inverter\nUnit A2 (Yaskawa V1000)", 
            ha="center", va="center", fontsize=9, fontweight="bold", color="#0369A1")
    ax.text(0.225, 0.35, "IGBT Power Module\nFault Register: Reg 902", 
            ha="center", va="center", fontsize=8, color="#0F172A")
    
    # Motor Block
    mot_box = patches.FancyBboxPatch((0.65, 0.2), 0.3, 0.6, boxstyle="round,pad=0.03", 
                                     edgecolor="#16A34A", facecolor="#DCFCE7", linewidth=2)
    ax.add_patch(mot_box)
    ax.text(0.8, 0.65, "Spindle Synchronous\nAC Servo Motor (15 kW)", 
            ha="center", va="center", fontsize=9, fontweight="bold", color="#15803D")
    ax.text(0.8, 0.35, "Stator Leads U - V - W\nNominal: 0.8 - 1.2 Ω", 
            ha="center", va="center", fontsize=8, color="#0F172A")
    
    # Connecting Lines with Terminals
    terminals = [("U", 0.6), ("V", 0.5), ("W", 0.4)]
    for name, y in terminals:
        ax.annotate("", xy=(0.65, y), xytext=(0.4, y),
                    arrowprops=dict(arrowstyle="->", color="#DC2626", lw=1.5))
        ax.text(0.525, y + 0.03, f"Phase {name}", ha="center", fontsize=7.5, fontweight="bold", color="#DC2626")
        ax.plot(0.4, y, 'o', color="#0284C7", markersize=5)
        ax.plot(0.65, y, 'o', color="#16A34A", markersize=5)
        
    ax.text(0.525, 0.25, "Multimeter Checkpoint: Balanced Phase Resistance (0.8 - 1.2 Ω)", 
            ha="center", fontsize=8, fontstyle="italic", color="#475569")
    
    ax.set_xlim(0, 1)
    ax.set_ylim(0.1, 0.9)
    ax.axis("off")
    fig.tight_layout()
    apex_diag_path = output_dir / "apexcnc_spindle_schematic.png"
    plt.savefig(apex_diag_path, bbox_inches="tight")
    plt.close(fig)

    # 2. Diagram for ThermaPress: Hydraulic Cooling Loop & Heat Exchanger Diagram
    fig, ax = plt.subplots(figsize=(6.5, 3.2), dpi=200)
    ax.set_facecolor("#F8FAFC")
    fig.patch.set_facecolor("#FFFFFF")
    
    # Reservoir
    res_box = patches.FancyBboxPatch((0.03, 0.2), 0.22, 0.6, boxstyle="round,pad=0.03",
                                     edgecolor="#D97706", facecolor="#FEF3C7", linewidth=2)
    ax.add_patch(res_box)
    ax.text(0.14, 0.65, "Oil Reservoir\n(120 L ISO VG 46)", ha="center", va="center", fontsize=8.5, fontweight="bold", color="#B45309")
    ax.text(0.14, 0.35, "Level Sight: LG-1\nMax Temp: 65°C", ha="center", va="center", fontsize=7.5, color="#0F172A")
    
    # Heat Exchanger
    he_box = patches.FancyBboxPatch((0.38, 0.2), 0.28, 0.6, boxstyle="round,pad=0.03",
                                    edgecolor="#2563EB", facecolor="#DBEAFE", linewidth=2)
    ax.add_patch(he_box)
    ax.text(0.52, 0.65, "Shell & Tube Exchanger\nUnit HE-1", ha="center", va="center", fontsize=8.5, fontweight="bold", color="#1D4ED8")
    ax.text(0.52, 0.35, "Cooling Water ΔT: 8-12°C\nPorts: CH-1 / CH-2", ha="center", va="center", fontsize=7.5, color="#0F172A")
    
    # Solenoid Valve
    sol_box = patches.FancyBboxPatch((0.78, 0.3), 0.19, 0.45, boxstyle="round,pad=0.03",
                                     edgecolor="#9333EA", facecolor="#F3E8FF", linewidth=2)
    ax.add_patch(sol_box)
    ax.text(0.875, 0.58, "Water Valve SV-2", ha="center", va="center", fontsize=8.5, fontweight="bold", color="#7E22CE")
    ax.text(0.875, 0.40, "24 VDC Proportional\nCoil: 32 Ω ±2 Ω", ha="center", va="center", fontsize=7.5, color="#0F172A")
    
    # Oil flow line
    ax.annotate("", xy=(0.38, 0.65), xytext=(0.25, 0.65), arrowprops=dict(arrowstyle="->", color="#D97706", lw=1.8))
    ax.text(0.315, 0.70, "Hot Oil", ha="center", fontsize=7.5, fontweight="bold", color="#D97706")
    
    # Return line
    ax.annotate("", xy=(0.25, 0.35), xytext=(0.38, 0.35), arrowprops=dict(arrowstyle="->", color="#16A34A", lw=1.8))
    ax.text(0.315, 0.40, "Cooled Oil", ha="center", fontsize=7.5, fontweight="bold", color="#16A34A")

    # Water flow line
    ax.annotate("", xy=(0.66, 0.5), xytext=(0.78, 0.5), arrowprops=dict(arrowstyle="->", color="#2563EB", lw=1.8))
    ax.text(0.72, 0.55, "Chilled Water", ha="center", fontsize=7.5, fontweight="bold", color="#2563EB")
    
    ax.set_xlim(0, 1)
    ax.set_ylim(0.1, 0.9)
    ax.axis("off")
    fig.tight_layout()
    therma_diag_path = output_dir / "thermapress_cooling_schematic.png"
    plt.savefig(therma_diag_path, bbox_inches="tight")
    plt.close(fig)

    return apex_diag_path, therma_diag_path


def build_manual_a(pdf_path: Path, diag_path: Path):
    """Generate the 11-page ApexCNC UltraMill 500 Maintenance Manual."""
    doc = SimpleDocTemplate(
        str(pdf_path),
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )
    
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        "CoverTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=24,
        leading=28,
        textColor=colors.HexColor("#0F172A"),
        spaceAfter=12
    )
    subtitle_style = ParagraphStyle(
        "CoverSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=13,
        leading=17,
        textColor=colors.HexColor("#334155"),
        spaceAfter=24
    )
    h1_style = ParagraphStyle(
        "ManualH1",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=15,
        leading=19,
        textColor=colors.HexColor("#0369A1"),
        spaceBefore=14,
        spaceAfter=8
    )
    h2_style = ParagraphStyle(
        "ManualH2",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=16,
        textColor=colors.HexColor("#0F172A"),
        spaceBefore=10,
        spaceAfter=6
    )
    body_style = ParagraphStyle(
        "ManualBody",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9.5,
        leading=14,
        textColor=colors.HexColor("#1E293B"),
        spaceAfter=8
    )
    callout_style = ParagraphStyle(
        "Callout",
        parent=styles["Normal"],
        fontName="Helvetica-Oblique",
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#0369A1"),
        backColor=colors.HexColor("#F0F9FF"),
        borderColor=colors.HexColor("#BAE6FD"),
        borderWidth=1,
        borderPadding=8,
        spaceBefore=8,
        spaceAfter=10
    )
    table_text = ParagraphStyle(
        "TableText",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor("#0F172A")
    )
    table_header = ParagraphStyle(
        "TableHeader",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8.5,
        leading=11,
        textColor=colors.white
    )

    story = []

    # PAGE 1: COVER
    story.append(Spacer(1, 40))
    story.append(Paragraph("APEX PRECISION ROBOTICS & MACHINE TOOL CORP.", ParagraphStyle("Meta", fontName="Helvetica-Bold", fontSize=10, textColor=colors.HexColor("#64748B"), spaceAfter=20)))
    story.append(Paragraph("ApexCNC UltraMill 500<br/>Technical Maintenance & Diagnostic Manual", title_style))
    story.append(Paragraph("5-Axis High-Speed CNC Machining Center | Model ACM-500", subtitle_style))
    story.append(Spacer(1, 100))
    
    meta_data = [
        [Paragraph("<b>Document Identification:</b>", table_text), Paragraph("MAN-ACM500-REV4.2", table_text)],
        [Paragraph("<b>Applicable Models:</b>", table_text), Paragraph("ApexCNC UltraMill 500 (ACM-500-A / ACM-500-B)", table_text)],
        [Paragraph("<b>Controller Revision:</b>", table_text), Paragraph("ApexCNC Fanuc 31i-B5 Compatible Kernel v8.4", table_text)],
        [Paragraph("<b>Publication Date:</b>", table_text), Paragraph("October 2025 (Annual Maintenance Release)", table_text)],
        [Paragraph("<b>Target Audience:</b>", table_text), Paragraph("Certified Industrial Field Engineers & Shop Floor Technicians", table_text)]
    ]
    meta_table = Table(meta_data, colWidths=[2.2*inch, 4.5*inch])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#F8FAFC")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#E2E8F0")),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(meta_table)
    story.append(PageBreak())

    # PAGE 2: SECTION 1.0 SAFETY
    story.append(Paragraph("Section 1.0: Industrial Safety & Lockout Protocols", h1_style))
    story.append(Paragraph("All maintenance, diagnostic, and calibration actions on the ApexCNC UltraMill 500 must strictly conform to OSHA 1910.147 standards for the Control of Hazardous Energy (Lockout/Tagout - LOTO). The UltraMill 500 operates at 480 VAC 3-phase power and stores kinetic energy in high-speed spindle rotors and pressurized pneumatic counterbalances.", body_style))
    story.append(Paragraph("<b>Primary Electrical Isolation (Switch Q1):</b> The main electrical isolator switch Q1 is positioned on the right exterior face of electrical cabinet A1. Prior to accessing any drive chassis, servo terminal, or regenerative resistor bank, switch Q1 must be turned to the OFF position and padlocked with an OSHA-approved hasp.", body_style))
    story.append(Paragraph("<b>DC Bus Discharge Verification:</b> Variable frequency inverter A2 contains high-capacity electrolytic filter capacitors. After switching Q1 OFF, the technician must wait a minimum of 8 minutes for the DC bus to discharge below 24 VDC. Verify the DC bus voltage across terminals +VDC and -VDC with a calibrated Cat-III 1000V digital multimeter before touching drive conductors.", body_style))
    story.append(Paragraph("<b>Hazard Warning:</b> Never bypass interlock switches on enclosure doors during automatic cycle execution. Servomotor dynamic braking resistors dissipate surface temperatures exceeding 140°C during high-deceleration cycles.", callout_style))
    story.append(PageBreak())

    # PAGE 3: SECTION 2.0 SPECIFICATIONS
    story.append(Paragraph("Section 2.0: System Overview & Architecture", h1_style))
    story.append(Paragraph("The ApexCNC UltraMill 500 is a rigid portal-style 5-axis vertical machining center engineered for aerospace alloy milling. It incorporates direct-drive rotary axes and an oil-air lubricated synchronous electric spindle rated for continuous 24,000 RPM operation.", body_style))
    story.append(Paragraph("<b>Core Subsystems:</b>", h2_style))
    story.append(Paragraph("• <b>Spindle Cartridge Unit:</b> Integrated 15 kW synchronous servo motor with ISO 40 / HSK-A63 taper, liquid chilled by closed-loop chiller unit CU-1.<br/>• <b>Feed Drive Inverters:</b> Modular digital servo inverters operating on a shared 600 VDC link powered by an active front end power supply.<br/>• <b>Lubrication Distribution:</b> Automatic micro-metered grease injectors delivering synthetic polyurea grease to linear guide trucks at 6-hour intervals.<br/>• <b>Pneumatic Counterbalance:</b> Twin nitrogen-assisted cylinders balancing the 480 kg Z-axis spindle ram.", body_style))
    story.append(Paragraph("<b>Technical Specifications:</b>", h2_style))
    specs_data = [
        [Paragraph("Parameter", table_header), Paragraph("Specification", table_header), Paragraph("Tolerance / Nominal", table_header)],
        [Paragraph("Spindle Motor Power", table_text), Paragraph("15 kW S1 Continuous / 22 kW S6 40%", table_text), Paragraph("Rated 62A RMS full load", table_text)],
        [Paragraph("Spindle Maximum Speed", table_text), Paragraph("24,000 RPM", table_text), Paragraph("Runout < 0.002 mm TIR", table_text)],
        [Paragraph("Supply Voltage", table_text), Paragraph("480 VAC, 3-Phase, 60 Hz", table_text), Paragraph("±10% steady-state", table_text)],
        [Paragraph("Inverter Output Resistance", table_text), Paragraph("0.8 - 1.2 Ω line-to-line", table_text), Paragraph("Max unbalance < 0.15 Ω", table_text)],
        [Paragraph("Chiller Setpoint", table_text), Paragraph("20.0°C circulating water-glycol", table_text), Paragraph("±0.5°C control band", table_text)]
    ]
    specs_table = Table(specs_data, colWidths=[2.2*inch, 2.5*inch, 2.0*inch])
    specs_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#0284C7")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(specs_table)
    story.append(PageBreak())

    # PAGE 4: SECTION 3.1 ALARM MATRIX (TABLE)
    story.append(Paragraph("Section 3.1: Complete Diagnostic Code Reference Table", h1_style))
    story.append(Paragraph("The UltraMill 500 numerical controller monitors all subassembly parameters. When an anomaly is detected, execution halts immediately and the corresponding alarm code is displayed on the primary operator HMI screen.", body_style))
    
    alarm_table_data = [
        [Paragraph("Code", table_header), Paragraph("Severity", table_header), Paragraph("Subsystem", table_header), Paragraph("Description", table_header), Paragraph("Primary Section", table_header)],
        [Paragraph("<b>E101</b>", table_text), Paragraph("Critical E-Stop", table_text), Paragraph("Spindle Drive", table_text), Paragraph("Spindle Drive Inverter Overcurrent Failure", table_text), Paragraph("Section 4.2 (Page 6)", table_text)],
        [Paragraph("<b>E102</b>", table_text), Paragraph("Feed Hold", table_text), Paragraph("Motion Servo", table_text), Paragraph("Axis Z Positive Hardware Limit Overtravel", table_text), Paragraph("Section 5.1 (Page 8)", table_text)],
        [Paragraph("<b>E103</b>", table_text), Paragraph("Warning", table_text), Paragraph("Motion Servo", table_text), Paragraph("X-Axis Following Error Lag Threshold Exceeded", table_text), Paragraph("Section 5.2 (Page 8)", table_text)],
        [Paragraph("<b>E201</b>", table_text), Paragraph("Cycle Inhibit", table_text), Paragraph("Coolant Loop", table_text), Paragraph("Coolant Delivery Pressure Under 2.0 Bar", table_text), Paragraph("Section 6.1 (Page 9)", table_text)],
        [Paragraph("<b>E305</b>", table_text), Paragraph("Feed Hold", table_text), Paragraph("Thermal Chiller", table_text), Paragraph("Spindle Chiller Temperature Imbalance > 5°C", table_text), Paragraph("Section 6.2 (Page 9)", table_text)],
        [Paragraph("<b>E412</b>", table_text), Paragraph("Cycle Pause", table_text), Paragraph("Tool Changer", table_text), Paragraph("Automatic Tool Changer Arm Position Timeout", table_text), Paragraph("Section 7.2 (Page 10)", table_text)],
        [Paragraph("<b>E501</b>", table_text), Paragraph("Notice", table_text), Paragraph("Pneumatics", table_text), Paragraph("Shop Air Supply Pressure Fluctuation < 5.5 Bar", table_text), Paragraph("Section 7.3 (Page 10)", table_text)]
    ]
    alarm_table = Table(alarm_table_data, colWidths=[0.8*inch, 1.2*inch, 1.3*inch, 2.3*inch, 1.1*inch])
    alarm_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#0369A1")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#94A3B8")),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.HexColor("#FFFFFF"), colors.HexColor("#F8FAFC")]),
    ]))
    story.append(alarm_table)
    story.append(Spacer(1, 14))
    story.append(Paragraph("<b>Table Interpretation Rule:</b> Severe alarms (E101, E102) immediately de-energize the servo contactor loop KM1. Corrective action must be executed prior to pressing the blue Alarm Reset button on the control console.", callout_style))
    story.append(PageBreak())

    # PAGE 5: SECTION 4.0 DIAGNOSTICS OVERVIEW
    story.append(Paragraph("Section 4.0: Subsystem Diagnostic Procedures", h1_style))
    story.append(Paragraph("This chapter outlines precise diagnostic pathways for electrical and mechanical drive subassemblies. When investigating fault alarms, technicians should follow the diagnostic branching sequence starting from primary power distribution, moving to control command signaling, and finally inspecting mechanical transmission components.", body_style))
    story.append(Paragraph("<b>Required Diagnostic Equipment:</b>", h2_style))
    story.append(Paragraph("1. Fluke 87V or equivalent True-RMS Digital Multimeter with calibrated low-resistance probes.<br/>2. Insulation Resistance Tester (Megohmmeter) rated for 1000 VDC test potential.<br/>3. Calibrated dial test indicator (0.001 mm resolution) with magnetic stand.<br/>4. Handheld non-contact optical tachometer.<br/>5. Torque wrench set covering 0.5 Nm to 120 Nm.", body_style))
    story.append(Paragraph("<b>Signal Conditioning Checks:</b> Prior to dismounting motors or drives, verify 24 VDC auxiliary power supply PS-24 output voltage. Voltage ripple must remain under 120 mV peak-to-peak under full auxiliary load.", body_style))
    story.append(PageBreak())

    # PAGE 6: SECTION 4.2 SPINDLE DRIVE ALARMS (E101 TARGET)
    story.append(Paragraph("Section 4.2: Spindle Drive Alarms & Overcurrent Diagnostics", h1_style))
    story.append(Paragraph("<b>Error E101: Spindle Drive Overcurrent Failure</b>", h2_style))
    story.append(Paragraph("<b>Error Meaning:</b> Error E101 triggers when the digital servo inverter detects an instantaneous output phase current exceeding 185% of rated continuous current (62 Amperes RMS) across motor leads U, V, or W for more than 12 milliseconds. This hardware trip protects the drive IGBT power modules from thermal destruction.", body_style))
    story.append(Paragraph("<b>Probable Causes:</b>", h2_style))
    story.append(Paragraph("1. Spindle bearing mechanical seizure or severe radial preload degradation.<br/>2. Contaminated servo motor stator windings (coolant ingress or metallic particulate bridge).<br/>3. Excessive cutting tool feed rate causing mechanical spindle stall under heavy roughing load.<br/>4. Failed or short-circuited IGBT power switching module in the variable frequency drive unit A2.", body_style))
    story.append(Paragraph("<b>Step-by-Step Corrective Action:</b>", h2_style))
    story.append(Paragraph("1. Press the Emergency Stop button and lock out the main electrical isolator switch Q1 (LOTO protocol).<br/>2. Disengage the spindle tool holder and rotate the spindle cartridge manually by hand to check for mechanical binding, roughness, or excessive drag.<br/>3. Open electrical cabinet A2 and measure line-to-line phase resistance across inverter output terminals U-V-W using a calibrated digital multimeter. The nominal reading must measure between 0.8 and 1.2 ohms across all three phases; an imbalance exceeding 0.15 ohms indicates winding damage.<br/>4. Inspect the inverter heatsink cooling fan assembly and blow away aluminum chip or dust accumulation using dry, filtered shop air (max 30 PSI).<br/>5. Clear the fault by resetting servo drive alarm register via operator panel parameter 902, then execute a spindle warm-up cycle at 500 RPM.", body_style))
    story.append(Paragraph("<b>Escalation Procedure (If Initial Corrective Action Does Not Fix It):</b>", h2_style))
    story.append(Paragraph("If manual spindle rotation exhibits stiffness or grinding noise, and phase resistance across terminals U-V-W tests normal (0.8 - 1.2 ohms), the spindle cartridge ceramic hybrid bearings have experienced catastrophic race fatigue. The technician must replace the complete spindle cartridge assembly using Spindle Bearing Replacement Kit Part #SP-500-BRG. Do not attempt field bearing disassembly.", callout_style))
    story.append(PageBreak())

    # PAGE 7: SECTION 4.3 DRIVE SCHEMATIC (DIAGRAM)
    story.append(Paragraph("Section 4.3: Drive Schematic & Inverter Checkpoints", h1_style))
    story.append(Paragraph("The schematic below illustrates the electrical wiring between Inverter Unit A2 and the 15 kW synchronous spindle motor. Test points for Phase U, V, and W are indicated.", body_style))
    story.append(Spacer(1, 10))
    if diag_path.exists():
        story.append(Image(str(diag_path), width=6.2*inch, height=3.0*inch))
    story.append(Spacer(1, 10))
    story.append(Paragraph("<b>Figure 4.2: Spindle Drive & Inverter Electrical Schematic Flowchart</b>", ParagraphStyle("Cap", fontName="Helvetica-Bold", fontSize=9, alignment=1, textColor=colors.HexColor("#475569"))))
    story.append(Spacer(1, 12))
    story.append(Paragraph("<b>Terminal Inspection Notes:</b> When re-attaching power leads to terminals U, V, and W, torque terminal screws to exactly 4.2 Nm. Loose terminal connections cause localized resistive heating, triggering false E101 current transients.", body_style))
    story.append(PageBreak())

    # PAGE 8: SECTION 5.0 AXIS MOTION & SERVO ERRORS
    story.append(Paragraph("Section 5.0: Axis Motion & Servo Errors", h1_style))
    story.append(Paragraph("<b>Section 5.1: Error E102 - Axis Z Hardware Overtravel</b>", h2_style))
    story.append(Paragraph("<b>Meaning:</b> Axis Z carriage has actuated the extreme limit mechanical microswitch S14 located at the upper column travel extremity (+450 mm coordinate).", body_style))
    story.append(Paragraph("<b>Corrective Action:</b> Depress manual OT release push-button on side console while simultaneously turning the manual pulse generator (MPG) handwheel in the negative Z direction to clear the trip dog.", body_style))
    story.append(Paragraph("<b>Section 5.2: Error E103 - Following Error Lag Threshold</b>", h2_style))
    story.append(Paragraph("<b>Meaning:</b> Discrepancy between commanded position and optical linear encoder feedback exceeds parameter 1820 tolerance (0.050 mm). Check ball screw pre-tension nut and servo coupling elasticity.", body_style))
    story.append(PageBreak())

    # PAGE 9: SECTION 6.0 COOLANT & CHILLER
    story.append(Paragraph("Section 6.0: Lubrication & Spindle Chiller Servicing", h1_style))
    story.append(Paragraph("<b>Section 6.1: Error E201 - Coolant Flow Interlock</b>", h2_style))
    story.append(Paragraph("<b>Meaning:</b> Flood coolant delivery pressure dropped below 2.0 bar for more than 3 seconds during cutting feed.", body_style))
    story.append(Paragraph("<b>Corrective Action:</b> Clean chip strainer basket in reservoir tank. Verify impeller rotation on high-pressure pump M4.", body_style))
    story.append(Paragraph("<b>Section 6.2: Error E305 - Spindle Chiller Temperature Imbalance</b>", h2_style))
    story.append(Paragraph("<b>Meaning:</b> Circulating glycol bath temperature deviates by more than 5.0°C from machine cast bed thermal reference sensor.", body_style))
    story.append(Paragraph("<b>Corrective Action:</b> Inspect chiller refrigeration condenser fins for lint blockage. Verify glycol concentration at 35% with optical refractometer.", body_style))
    story.append(PageBreak())

    # PAGE 10: SECTION 7.0 PREVENTIVE MAINTENANCE
    story.append(Paragraph("Section 7.0: Preventive Maintenance Schedules & Calibration", h1_style))
    story.append(Paragraph("To ensure dimensional machining accuracy within ±0.005 mm, execute the scheduled service tasks below:", body_style))
    maint_data = [
        [Paragraph("Interval", table_header), Paragraph("Subsystem", table_header), Paragraph("Procedure", table_header), Paragraph("Lube / Tool", table_header)],
        [Paragraph("Daily (8 Hrs)", table_text), Paragraph("Way Covers", table_text), Paragraph("Wipe telescopic stainless way covers and apply film", table_text), Paragraph("Mobil Vactra #2", table_text)],
        [Paragraph("Weekly (40 Hrs)", table_text), Paragraph("Spindle Taper", table_text), Paragraph("Clean HSK-A63 taper bore with solvent wipe tool", table_text), Paragraph("Isopropyl alcohol", table_text)],
        [Paragraph("Monthly (160 Hrs)", table_text), Paragraph("Linear Scales", table_text), Paragraph("Inspect Heidenhain optical scale air purge pressure (0.8 bar)", table_text), Paragraph("Clean dry air", table_text)],
        [Paragraph("Semi-Annual", table_text), Paragraph("Spindle Motor", table_text), Paragraph("Measure U-V-W winding phase resistance and Megger to ground", table_text), Paragraph("Fluke 1507 (1000V)", table_text)]
    ]
    maint_table = Table(maint_data, colWidths=[1.3*inch, 1.4*inch, 2.7*inch, 1.3*inch])
    maint_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#0284C7")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(maint_table)
    story.append(PageBreak())

    # PAGE 11: SECTION 8.0 SPARE PARTS CATALOG
    story.append(Paragraph("Section 8.0: Recommended Spare Parts & Ordering Catalog", h1_style))
    story.append(Paragraph("Maintain the critical spare parts listed below in factory inventory to minimize production downtime during unexpected fault shutdowns.", body_style))
    parts_data = [
        [Paragraph("Part Number", table_header), Paragraph("Component Name", table_header), Paragraph("Subsystem Ref", table_header), Paragraph("Replacement Lead Time", table_header)],
        [Paragraph("<b>#SP-500-BRG</b>", table_text), Paragraph("Spindle Ceramic Hybrid Bearing Replacement Kit", table_text), Paragraph("Section 4.2 (Page 6)", table_text), Paragraph("Stock / 24 Hours", table_text)],
        [Paragraph("<b>#INV-500-A2</b>", table_text), Paragraph("Digital Inverter Unit A2 (Yaskawa 15 kW)", table_text), Paragraph("Section 4.2 (Page 6)", table_text), Paragraph("Stock / 48 Hours", table_text)],
        [Paragraph("<b>#SW-LIMIT-Z</b>", table_text), Paragraph("Axis Z Overtravel Sealed Microswitch S14", table_text), Paragraph("Section 5.1 (Page 8)", table_text), Paragraph("Immediate Shelf Stock", table_text)],
        [Paragraph("<b>#PUMP-CL-20</b>", table_text), Paragraph("High Pressure Coolant Pump Motor (3.5 kW)", table_text), Paragraph("Section 6.1 (Page 9)", table_text), Paragraph("3-5 Business Days", table_text)],
        [Paragraph("<b>#CH-FLTR-01</b>", table_text), Paragraph("Chiller Glycol Inline Micron Filter Element", table_text), Paragraph("Section 6.2 (Page 9)", table_text), Paragraph("Immediate Shelf Stock", table_text)]
    ]
    parts_table = Table(parts_data, colWidths=[1.5*inch, 2.7*inch, 1.4*inch, 1.4*inch])
    parts_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#0369A1")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(parts_table)
    story.append(Spacer(1, 20))
    story.append(Paragraph("For technical factory support, call Apex Precision Robotics Service Line: 1-800-555-APEX or dispatch ticket to support@apexcnc-robotics.com.", body_style))

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Built ApexCNC manual at: {pdf_path}")


def build_manual_b(pdf_path: Path, diag_path: Path):
    """Generate the 11-page ThermaPress Pro 2000 Service Manual."""
    doc = SimpleDocTemplate(
        str(pdf_path),
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        "CoverTitleB",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=24,
        leading=28,
        textColor=colors.HexColor("#0F172A"),
        spaceAfter=12
    )
    subtitle_style = ParagraphStyle(
        "CoverSubtitleB",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=13,
        leading=17,
        textColor=colors.HexColor("#334155"),
        spaceAfter=24
    )
    h1_style = ParagraphStyle(
        "ManualH1B",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=15,
        leading=19,
        textColor=colors.HexColor("#B45309"),
        spaceBefore=14,
        spaceAfter=8
    )
    h2_style = ParagraphStyle(
        "ManualH2B",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=16,
        textColor=colors.HexColor("#0F172A"),
        spaceBefore=10,
        spaceAfter=6
    )
    body_style = ParagraphStyle(
        "ManualBodyB",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9.5,
        leading=14,
        textColor=colors.HexColor("#1E293B"),
        spaceAfter=8
    )
    callout_style = ParagraphStyle(
        "CalloutB",
        parent=styles["Normal"],
        fontName="Helvetica-Oblique",
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#B45309"),
        backColor=colors.HexColor("#FFFBEB"),
        borderColor=colors.HexColor("#FDE68A"),
        borderWidth=1,
        borderPadding=8,
        spaceBefore=8,
        spaceAfter=10
    )
    table_text = ParagraphStyle(
        "TableTextB",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor("#0F172A")
    )
    table_header = ParagraphStyle(
        "TableHeaderB",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8.5,
        leading=11,
        textColor=colors.white
    )

    story = []

    # PAGE 1: COVER
    story.append(Spacer(1, 40))
    story.append(Paragraph("THERMAFORM INDUSTRIAL SYSTEMS INC.", ParagraphStyle("MetaB", fontName="Helvetica-Bold", fontSize=10, textColor=colors.HexColor("#78716C"), spaceAfter=20)))
    story.append(Paragraph("ThermaPress Pro 2000<br/>Industrial Thermal Press Service Manual", title_style))
    story.append(Paragraph("2000 kN Precision Hydraulic Compression & Molding Press | Model TPP-2000", subtitle_style))
    story.append(Spacer(1, 100))
    
    meta_data = [
        [Paragraph("<b>Document Identification:</b>", table_text), Paragraph("MAN-TPP2000-SVC-V3", table_text)],
        [Paragraph("<b>Applicable Equipment:</b>", table_text), Paragraph("ThermaPress Pro 2000 (TPP-2000-H2)", table_text)],
        [Paragraph("<b>Platen Heating System:</b>", table_text), Paragraph("Multi-Zone Dual Electric Platens (up to 350°C)", table_text)],
        [Paragraph("<b>Publication Date:</b>", table_text), Paragraph("November 2025 (Annual Engineering Review)", table_text)],
        [Paragraph("<b>Service Classification:</b>", table_text), Paragraph("Factory Maintenance Personnel & Certified Hydraulic Technicians", table_text)]
    ]
    meta_table = Table(meta_data, colWidths=[2.2*inch, 4.5*inch])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#F8FAFC")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#E2E8F0")),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(meta_table)
    story.append(PageBreak())

    # PAGE 2: SECTION 1.0 SAFETY
    story.append(Paragraph("Section 1.0: Safety Protocols & Thermal Hazards", h1_style))
    story.append(Paragraph("The ThermaPress Pro 2000 combines extreme clamping forces (2,000 kN / 200 Metric Tons) with high temperature platens operating continuously at temperatures up to 350°C (662°F). Hydraulic system working pressure reaches 210 bar (3,045 PSI). Strict safety protocols are mandatory.", body_style))
    story.append(Paragraph("<b>Thermal Burn Prevention:</b> Platens retain hazardous residual heat for up to 180 minutes after electrical shutdown. Technicians must wear rated Kevlar high-temperature gloves and thermal face shields when working near open platens. Verify platen temperature is under 50°C with an infrared thermometer prior to touching heater wiring or thermocouple blocks.", body_style))
    story.append(Paragraph("<b>High-Pressure Fluid Injection Hazard:</b> Hydraulic fluid under 210 bar pressure can penetrate human skin and cause severe tissue necrosis. Never inspect hydraulic leaks with bare hands; always pass a piece of clean cardboard across suspected joints.", body_style))
    story.append(Paragraph("<b>Mechanical Ram Safety Lock:</b> Prior to entering the daylight area between platens, mechanically engage the hydraulic ram safety drop-arrest latch SL-1 and insert the certified mechanical safety bar.", callout_style))
    story.append(PageBreak())

    # PAGE 3: SECTION 2.0 SPECIFICATIONS
    story.append(Paragraph("Section 2.0: Machine Specifications & Hydraulic Circuits", h1_style))
    story.append(Paragraph("The ThermaPress Pro 2000 utilizes an electro-hydraulic proportional control architecture with regenerative ram advance and precision platen temperature uniformity.", body_style))
    story.append(Paragraph("<b>Key Technical Ratings:</b>", h2_style))
    specs_data = [
        [Paragraph("Subsystem Parameter", table_header), Paragraph("Rated Value", table_header), Paragraph("Operating Range", table_header)],
        [Paragraph("Maximum Clamping Force", table_text), Paragraph("2000 kN (200 Tons)", table_text), Paragraph("Proportional 100 - 2000 kN", table_text)],
        [Paragraph("Platen Dimensions", table_text), Paragraph("1000 mm x 1000 mm", table_text), Paragraph("Chrome-plated alloy steel", table_text)],
        [Paragraph("Maximum Temperature", table_text), Paragraph("350°C (662°F)", table_text), Paragraph("Uniformity ±1.5°C across zone", table_text)],
        [Paragraph("Hydraulic Fluid Type", table_text), Paragraph("ISO VG 46 Anti-Wear Fluid", table_text), Paragraph("Reservoir Capacity: 120 Liters", table_text)],
        [Paragraph("Max Hydraulic Oil Temp", table_text), Paragraph("65°C (149°F) Max Threshold", table_text), Paragraph("Optimal Band: 40°C - 50°C", table_text)],
        [Paragraph("Thermocouple Sensor Type", table_text), Paragraph("Type-K Dual Mineral Insulated", table_text), Paragraph("Nominal: 10 - 15 Ω at 25°C", table_text)]
    ]
    specs_table = Table(specs_data, colWidths=[2.2*inch, 2.5*inch, 2.0*inch])
    specs_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#D97706")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(specs_table)
    story.append(PageBreak())

    # PAGE 4: SECTION 2.4 ALARM MATRIX (TABLE)
    story.append(Paragraph("Section 2.4: Alarm Code Diagnostic Matrix", h1_style))
    story.append(Paragraph("The machine controller continuously checks sensor telemetry. When a safety or process threshold is breached, the relevant code is registered in the event log and displayed on the front console.", body_style))
    
    alarm_table_data = [
        [Paragraph("Code", table_header), Paragraph("Alarm Name", table_header), Paragraph("Trigger Threshold", table_header), Paragraph("Primary Section", table_header)],
        [Paragraph("<b>E101</b>", table_text), Paragraph("Platen Temperature Sensor Circuit Open / Thermal Runaway Lockout", table_text), Paragraph("Thermocouple Loop Resistance > 10 MΩ", table_text), Paragraph("Section 3.1 (Page 5)", table_text)],
        [Paragraph("<b>E104</b>", table_text), Paragraph("Hydraulic Ram Main Relief Pressure Exceeded", table_text), Paragraph("System Pressure > 225 bar for 500 ms", table_text), Paragraph("Section 4.1 (Page 7)", table_text)],
        [Paragraph("<b>E205</b>", table_text), Paragraph("Proportional Valve SV-1 Position Drift", table_text), Paragraph("LVDT Feedback Deviation > 5%", table_text), Paragraph("Section 4.2 (Page 7)", table_text)],
        [Paragraph("<b>E302</b>", table_text), Paragraph("Chamber Vacuum Seal Degradation", table_text), Paragraph("Vacuum Level Under 50 mbar", table_text), Paragraph("Section 6.0 (Page 10)", table_text)],
        [Paragraph("<b>E410</b>", table_text), Paragraph("Safety Light Curtain Beam Interrupted", table_text), Paragraph("Optical Receiver Channel Break", table_text), Paragraph("Section 1.2 (Page 2)", table_text)]
    ]
    alarm_table = Table(alarm_table_data, colWidths=[0.9*inch, 2.5*inch, 2.0*inch, 1.3*inch])
    alarm_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#B45309")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#94A3B8")),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.HexColor("#FFFFFF"), colors.HexColor("#FFFBEB")]),
    ]))
    story.append(alarm_table)
    story.append(Spacer(1, 14))
    story.append(Paragraph("<b>Notice on Thermal Alarms:</b> Alarm E101 disconnects contactor K1 to avoid uncontrolled heating. Always treat an E101 alarm with high priority.", callout_style))
    story.append(PageBreak())

    # PAGE 5: SECTION 3.1 THERMAL SYSTEM FAULTS (E101 TARGET)
    story.append(Paragraph("Section 3.1: Thermal System Faults & Platen Diagnostics", h1_style))
    story.append(Paragraph("<b>Error E101: Platen Temperature Sensor Circuit Open / Thermal Runaway Safety Lockout</b>", h2_style))
    story.append(Paragraph("<b>Error Meaning:</b> Error E101 indicates an open circuit or infinite electrical resistance condition detected on the upper or lower platen Type-K thermocouple sensing loops, triggering an immediate emergency heating element lockout to prevent unmonitored platen thermal runaway.", body_style))
    story.append(Paragraph("<b>Probable Causes:</b>", h2_style))
    story.append(Paragraph("1. Snapped or disconnected Type-K thermocouple lead wire at junction box JB-2.<br/>2. Fractured mineral-insulated thermocouple probe sheath resulting from mechanical vibration or platen movement.<br/>3. Loose or oxidized terminal screws on terminal strip TB4-12.<br/>4. Welded solid-state relay (SSR) contact holding heater circuit continuously energized.", body_style))
    story.append(Paragraph("<b>Step-by-Step Corrective Action:</b>", h2_style))
    story.append(Paragraph("1. Turn off platen heating master circuit breaker CB3 and allow platens to cool below 50°C before opening junction enclosures.<br/>2. Disconnect thermocouple leads and measure resistance across terminals T1+ and T1- using an ohmmeter. A healthy sensor measures 10 to 15 ohms at 25°C ambient temperature. A resistance reading greater than 10 Megohms confirms an open or snapped thermocouple probe.<br/>3. Inspect terminal strip TB4-12 and re-torque all wire clamping screws to 0.6 Nm using an insulated torque screwdriver.<br/>4. Check the status indicator LED on solid-state relay SSR-1; if the LED remains illuminated while the controller heating command is OFF, the SSR is internally shorted and welded.<br/>5. Replace failed Type-K thermocouple assembly with Part #TH-2000-K or replace damaged solid-state relay with Part #SSR-75A.", body_style))
    story.append(Paragraph("<b>Escalation Procedure (If Initial Corrective Action Does Not Fix It):</b>", h2_style))
    story.append(Paragraph("If the thermocouple probe measures within nominal range (10 - 15 ohms) and wiring continuity is verified back to cabinet C1, but Error E101 persists immediately upon power-up, the cold-junction compensation circuit on the main temperature controller module has failed. Replace platen controller module Part #TC-MOD-01 on DIN rail 3.", callout_style))
    story.append(PageBreak())

    # PAGE 6: SECTION 3.2 PLATEN HEATING SCHEMATIC
    story.append(Paragraph("Section 3.2: Platen Heating Zones & SSR Switching", h1_style))
    story.append(Paragraph("Platen thermal distribution is managed across four distinct PID zones (Top Center, Top Edge, Bottom Center, Bottom Edge). Each zone is switched at zero-crossing AC line voltage by 75A solid state relays mounted on aluminum heatsinks in enclosure C1.", body_style))
    story.append(Paragraph("<b>Thermocouple Extension Lead Rules:</b> Only use Type-K compensating extension wire (yellow jacket: positive chromel, red jacket: negative alumel). Never splice copper wire into thermocouple runs, as this introduces parasite thermocouple EMF junctions causing temperature reading offsets of 20°C to 50°C.", body_style))
    story.append(PageBreak())

    # PAGE 7: SECTION 4.0 HYDRAULIC CLAMPING
    story.append(Paragraph("Section 4.0: Hydraulic Clamping System Diagnostics", h1_style))
    story.append(Paragraph("<b>Section 4.1: Error E104 - Hydraulic Ram Pressure Relief Trip</b>", h2_style))
    story.append(Paragraph("<b>Meaning:</b> Pressure transducer PT-1 detected cylinder pressure exceeding 225 bar. Check proportional relief cartridge RV-1 pilot orifice for metal particle debris.", body_style))
    story.append(Paragraph("<b>Section 4.2: Error E205 - Proportional Valve Drift</b>", h2_style))
    story.append(Paragraph("<b>Meaning:</b> Proportional directional valve SV-1 spool feedback LVDT reports > 5% position error from commanded setpoint. Calibrate spool zero point via amplifier card potentiometer P2.", body_style))
    story.append(PageBreak())

    # PAGE 8: SECTION 5.3 OVERHEATING SYMPTOM (NATURAL LANGUAGE TARGET)
    story.append(Paragraph("Section 5.3: Hydraulic Power Unit Overheating & Thermal Imbalance", h1_style))
    story.append(Paragraph("<b>Symptom: Why is Machine B / ThermaPress Pro 2000 Overheating?</b>", h2_style))
    story.append(Paragraph("<b>Meaning & Symptom Description:</b> Thermal overload and persistent hydraulic oil overheating where reservoir bulk oil temperature exceeds 65°C (149°F) during normal operational pressing cycles, operating without an active E-code or preceding high-temperature alarm trips.", body_style))
    story.append(Paragraph("<b>Probable Causes:</b>", h2_style))
    story.append(Paragraph("1. Mineral scale and silt clogging inside the water-oil shell-and-tube heat exchanger (Unit HE-1).<br/>2. Main hydraulic recirculation unloader valve RV-3 mechanically jammed in the bypass seat, forcing continuous high-pressure pump discharge over the relief valve.<br/>3. Viscosity breakdown and chemical oxidation of ISO VG 46 anti-wear hydraulic oil due to extended service hours.<br/>4. Cooling water proportional solenoid valve SV-2 seized in the closed position or defective 24VDC actuator coil.", body_style))
    story.append(Paragraph("<b>Step-by-Step Corrective Action:</b>", h2_style))
    story.append(Paragraph("1. Measure the cooling water temperature differential between heat exchanger inlet port CH-1 and outlet port CH-2 using an infrared pyrometer. A delta T below 4°C indicates severe tube fouling (nominal delta T is 8°C to 12°C).<br/>2. Isolate the cooling water loop and flush the heat exchanger tube bundle with a 10% sulfamic acid descaling solution for 45 minutes, then flush thoroughly with clean neutral water.<br/>3. Check electrical coil resistance across solenoid valve SV-2 terminals; nominal resistance must measure 32 ohms (±2 ohms). If resistance reads 0 ohms or open circuit, replace the 24VDC coil.<br/>4. Check oil reservoir fluid level on sight gauge LG-1 and inspect oil clarity; if oil has turned dark brown or emits an acrid burnt odor, drain and refill reservoir with 120 liters of fresh ISO VG 46 hydraulic fluid.", body_style))
    story.append(Paragraph("<b>Escalation Procedure (If Initial Corrective Action Does Not Fix It):</b>", h2_style))
    story.append(Paragraph("If the heat exchanger is verified clean, water valve SV-2 opens fully, and oil is fresh, but oil temperature continues to climb past 65°C within 30 minutes of operation, the main variable-displacement axial piston pump (Pump P1) internal bronze valve plate has experienced severe scoring, bypassing high-pressure fluid directly into the pump case drain. Measure case drain flow into an external graduated cylinder; if drain leakage exceeds 4.5 liters per minute at 210 bar idle, replace Pump P1 Assembly Part #HP-2000-P1.", callout_style))
    story.append(PageBreak())

    # PAGE 9: SECTION 5.4 COOLING SCHEMATIC (DIAGRAM)
    story.append(Paragraph("Section 5.4: Hydraulic Cooling Loop & Heat Exchanger Flow Diagram", h1_style))
    story.append(Paragraph("The schematic below illustrates the fluid flow paths between the 120L reservoir, Shell-and-Tube Exchanger Unit HE-1, and Proportional Water Solenoid Valve SV-2.", body_style))
    story.append(Spacer(1, 10))
    if diag_path.exists():
        story.append(Image(str(diag_path), width=6.2*inch, height=3.0*inch))
    story.append(Spacer(1, 10))
    story.append(Paragraph("<b>Figure 5.3: Hydraulic Cooling Loop & Heat Exchanger Flow Diagram</b>", ParagraphStyle("CapB", fontName="Helvetica-Bold", fontSize=9, alignment=1, textColor=colors.HexColor("#78716C"))))
    story.append(Spacer(1, 12))
    story.append(Paragraph("<b>Operational Thermal Warning:</b> Running the press with bulk oil temperatures exceeding 65°C degrades cylinder polyurethane piston seals (causing internal leakage) and halves pump bearing service life.", body_style))
    story.append(PageBreak())

    # PAGE 10: SECTION 6.0 VACUUM DEGASSING
    story.append(Paragraph("Section 6.0: Vacuum Degassing & Seal Troubleshooting", h1_style))
    story.append(Paragraph("<b>Section 6.1: Error E302 - Vacuum Seal Degradation</b>", h2_style))
    story.append(Paragraph("<b>Meaning:</b> Vacuum degassing hood failed to reach 50 mbar within 45 seconds of platen closure.", body_style))
    story.append(Paragraph("<b>Corrective Action:</b> Inspect silicone perimeter seal for cuts or cured resin flash. Replace vacuum pump exhaust oil mist filter element.", body_style))
    story.append(PageBreak())

    # PAGE 11: SECTION 7.0 SPARE PARTS CATALOG
    story.append(Paragraph("Section 7.0: Recommended Spare Parts Catalog", h1_style))
    story.append(Paragraph("Keep the following critical replacement items on site to support rapid troubleshooting and prevent prolonged press shutdowns.", body_style))
    parts_data = [
        [Paragraph("Part Number", table_header), Paragraph("Description", table_header), Paragraph("Primary Section", table_header), Paragraph("Factory Stock Status", table_header)],
        [Paragraph("<b>#TH-2000-K</b>", table_text), Paragraph("Type-K Mineral Insulated Thermocouple Sensor Assembly", table_text), Paragraph("Section 3.1 (Page 5)", table_text), Paragraph("Immediate Shelf Stock", table_text)],
        [Paragraph("<b>#SSR-75A</b>", table_text), Paragraph("75A Solid State Relay with Heatsink Mount", table_text), Paragraph("Section 3.1 (Page 5)", table_text), Paragraph("Immediate Shelf Stock", table_text)],
        [Paragraph("<b>#TC-MOD-01</b>", table_text), Paragraph("DIN-Rail Multi-Zone Temperature Controller Module", table_text), Paragraph("Section 3.1 (Page 5)", table_text), Paragraph("Stock / 24 Hours", table_text)],
        [Paragraph("<b>#HP-2000-P1</b>", table_text), Paragraph("Axial Piston Hydraulic Pump Assembly P1", table_text), Paragraph("Section 5.3 (Page 8)", table_text), Paragraph("3 Business Days", table_text)],
        [Paragraph("<b>#VALVE-SV2</b>", table_text), Paragraph("Proportional Water Solenoid Valve SV-2 (24VDC)", table_text), Paragraph("Section 5.3 (Page 8)", table_text), Paragraph("Immediate Shelf Stock", table_text)],
        [Paragraph("<b>#SEAL-KIT-TPP</b>", table_text), Paragraph("Main Cylinder Polyurethane High-Temp Seal Kit", table_text), Paragraph("Section 4.1 (Page 7)", table_text), Paragraph("Stock / 48 Hours", table_text)]
    ]
    parts_table = Table(parts_data, colWidths=[1.5*inch, 2.7*inch, 1.4*inch, 1.4*inch])
    parts_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#B45309")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(parts_table)
    story.append(Spacer(1, 20))
    story.append(Paragraph("For technical support or emergency hydraulic parts dispatch, contact ThermaForm Industrial Systems Service Division: 1-888-THERMA-PRESS or email support@thermaform-press.com.", body_style))

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Built ThermaPress manual at: {pdf_path}")


def main():
    manuals_dir = settings.MANUALS_DIR
    manuals_dir.mkdir(parents=True, exist_ok=True)
    
    diagrams_dir = settings.DATA_DIR / "diagrams"
    print("Generating technical diagrams...")
    apex_diag, therma_diag = create_diagrams(diagrams_dir)
    
    manual_a_path = manuals_dir / "apexcnc_ultramill_500_manual.pdf"
    manual_b_path = manuals_dir / "thermapress_pro_2000_manual.pdf"
    
    print("Building ApexCNC UltraMill 500 manual...")
    build_manual_a(manual_a_path, apex_diag)
    
    print("Building ThermaPress Pro 2000 manual...")
    build_manual_b(manual_b_path, therma_diag)
    
    print("Both manuals built successfully!")

if __name__ == "__main__":
    main()

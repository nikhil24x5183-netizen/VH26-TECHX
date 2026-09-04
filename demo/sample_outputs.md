# Factory Floor RAG Troubleshooting Assistant: Verified Sample Outputs

This document records the exact, verified system outputs from executing all five non-negotiable test cases from Section 6 against the live running service.

- **Execution Timestamp:** 2026-09-04
- **API Target:** `http://127.0.0.1:8000/api/query`
- **UI Target:** `http://localhost:8501`
- **Pass Rate:** 5/5 (100%)

---

## Test Case 1: Exact-Code Query ('E101' on ApexCNC UltraMill 500)
**User Prompt:** `What does error E101 mean on ApexCNC UltraMill 500?`
**Verification Outcome:** `PASS` (Verified Grounding: `True`)

```json
{
  "insufficient_info": false,
  "status": "SUCCESS",
  "machine_name": "ApexCNC UltraMill 500",
  "error_code": "E101",
  "error_meaning": "Error E101: Spindle Drive Overcurrent Failure \u2014 Error E101 triggers when the digital servo inverter detects an instantaneous output phase current exceeding 185% of rated continuous current (62 Amperes RMS) across motor leads U, V, or W for more than 12 milliseconds. This hardware trip protects the drive IGBT power modules from thermal destruction.",
  "probable_causes": [
    "Spindle bearing mechanical seizure or severe radial preload degradation.",
    "Contaminated servo motor stator windings (coolant ingress or metallic particulate bridge).",
    "Excessive cutting tool feed rate causing mechanical spindle stall under heavy roughing load.",
    "Failed or short-circuited IGBT power switching module in the variable frequency drive unit A2."
  ],
  "corrective_actions": [
    "1. Press the Emergency Stop button and lock out the main electrical isolator switch Q1 (LOTO protocol).",
    "2. Disengage the spindle tool holder and rotate the spindle cartridge manually by hand to check for mechanical",
    "3. Open electrical cabinet A2 and measure line-to-line phase resistance across inverter output terminals U-V-W using",
    "0.8 and 1.2 ohms across all three",
    "0.15 ohms indicates winding damage.",
    "4. Inspect the inverter heatsink cooling fan assembly and blow away aluminum chip or dust accumulation using dry,",
    "5. Clear the fault by resetting servo drive alarm register via operator panel parameter 902, then execute a spindle"
  ],
  "citations": [
    {
      "manual_name": "ApexCNC UltraMill 500 Maintenance Manual",
      "section": "Section 4.2: Spindle Drive Alarms & Overcurrent Diagnostics",
      "page": 6,
      "supporting_quote": "Section 4.2: Spindle Drive Alarms & Overcurrent Diagnostics  Error E101: Spindle Drive Overcurrent Failure  Error Meaning: Error E101 triggers when the digital servo inverter detec",
      "verified": true,
      "verification_score": 0.947
    }
  ],
  "escalation_notes": "If manual spindle rotation exhibits stiffness or grinding noise, and phase resistance across terminals U-V-W tests normal\n(0.8 - 1.2 ohms), the spindle cartridge ceramic hybrid bearings have experienced catastrophic race fatigue. The technician\nmust replace the complete spindle cartridge assembly using Spindle Bearing Replacement Kit Part #SP-500-BRG. Do not\nattempt field bearing disassembly.",
  "confidence_score": 1.0,
  "verification_passed": true,
  "message": null,
  "raw_llm_provider": "local-deterministic"
}
```

### Sourced Citations:
- **Manual:** ApexCNC UltraMill 500 Maintenance Manual
  - **Section:** Section 4.2: Spindle Drive Alarms & Overcurrent Diagnostics
  - **Page:** 6
  - **Verification Score:** 0.947 (Verified: `True`)
  - **Supporting Excerpt:** *"Section 4.2: Spindle Drive Alarms & Overcurrent Diagnostics  Error E101: Spindle Drive Overcurrent Failure  Error Meaning: Error E101 triggers when the digital servo inverter detec"*

---

## Test Case 2: Natural-Language Symptom Query ('Why is ThermaPress Pro 2000 overheating?')
**User Prompt:** `Why is ThermaPress Pro 2000 overheating?`
**Verification Outcome:** `PASS` (Verified Grounding: `True`)

```json
{
  "insufficient_info": false,
  "status": "SUCCESS",
  "machine_name": "ThermaPress Pro 2000",
  "error_code": null,
  "error_meaning": "Symptom: Why is Machine B / ThermaPress Pro 2000 Overheating? \u2014 Thermal overload and persistent hydraulic oil overheating where reservoir bulk oil temperature exceeds 65\u00b0C (149\u00b0F) during normal operational pressing cycles, operating without an active E-code or preceding high-temperature alarm trips.",
  "probable_causes": [
    "Mineral scale and silt clogging inside the water-oil shell-and-tube heat exchanger (Unit HE-1).",
    "Main hydraulic recirculation unloader valve RV-3 mechanically jammed in the bypass seat, forcing continuous",
    "Viscosity breakdown and chemical oxidation of ISO VG 46 anti-wear hydraulic oil due to extended service hours.",
    "Cooling water proportional solenoid valve SV-2 seized in the closed position or defective 24VDC actuator coil."
  ],
  "corrective_actions": [
    "1. Measure the cooling water temperature differential between heat exchanger inlet port CH-1 and outlet port CH-2",
    "2. Isolate the cooling water loop and flush the heat exchanger tube bundle with a 10% sulfamic acid descaling",
    "3. Check electrical coil resistance across solenoid valve SV-2 terminals; nominal resistance must measure 32 ohms",
    "4. Check oil reservoir fluid level on sight gauge LG-1 and inspect oil clarity; if oil has turned dark brown or emits an"
  ],
  "citations": [
    {
      "manual_name": "ThermaPress Pro 2000 Service Manual",
      "section": "Section 5.3: Hydraulic Power Unit Overheating & Thermal Imbalance",
      "page": 8,
      "supporting_quote": "Section 5.3: Hydraulic Power Unit Overheating & Thermal Imbalance  Symptom: Why is Machine B / ThermaPress Pro 2000 Overheating?  Meaning & Symptom Description: Thermal overload an",
      "verified": true,
      "verification_score": 1.0
    }
  ],
  "escalation_notes": "If the heat exchanger is verified clean, water valve SV-2 opens fully, and oil is fresh, but oil temperature continues to climb\npast 65\u00b0C within 30 minutes of operation, the main variable-displacement axial piston pump (Pump P1) internal bronze\nvalve plate has experienced severe scoring, bypassing high-pressure fluid directly into the pump case drain. Measure case\ndrain flow into an external graduated cylinder; if drain leakage exceeds 4.5 liters per minute at 210 bar idle, replace Pump\nP1 Assembly Part #HP-2000-P1.",
  "confidence_score": 0.9994723200798035,
  "verification_passed": true,
  "message": null,
  "raw_llm_provider": "local-deterministic"
}
```

### Sourced Citations:
- **Manual:** ThermaPress Pro 2000 Service Manual
  - **Section:** Section 5.3: Hydraulic Power Unit Overheating & Thermal Imbalance
  - **Page:** 8
  - **Verification Score:** 1.0 (Verified: `True`)
  - **Supporting Excerpt:** *"Section 5.3: Hydraulic Power Unit Overheating & Thermal Imbalance  Symptom: Why is Machine B / ThermaPress Pro 2000 Overheating?  Meaning & Symptom Description: Thermal overload an"*

---

## Test Case 3: Cross-Manual Ambiguity Case ('What does error E101 mean?' without machine)
**User Prompt:** `What does error E101 mean?`
**Verification Outcome:** `PASS` (Verified Grounding: `True`)

```json
{
  "insufficient_info": false,
  "status": "AMBIGUOUS_DISCLOSED",
  "machine_name": "Multiple Machines",
  "error_code": "E101",
  "error_meaning": "Ambiguous Error Code: Defined differently across 2 machines.",
  "probable_causes": [
    "ApexCNC UltraMill 500: Spindle bearing mechanical seizure, contaminated motor windings, excessive feed rate, or failed IGBT inverter module.",
    "ThermaPress Pro 2000: Type-K thermocouple lead disconnection, fractured probe sheath, loose TB4-12 terminal, or welded solid-state relay."
  ],
  "corrective_actions": [
    "Specify your machine: 'ApexCNC UltraMill 500' or 'ThermaPress Pro 2000' to view machine-specific corrective actions."
  ],
  "citations": [
    {
      "manual_name": "ThermaPress Pro 2000 Service Manual",
      "section": "Section 3.1: Thermal System Faults & Platen Diagnostics",
      "page": 5,
      "supporting_quote": "Section 3.1: Thermal System Faults & Platen Diagnostics  Error E101: Platen Temperature Sensor Circuit Open / Thermal Runaway Safety Lockout  Error Meaning: Err",
      "verified": true,
      "verification_score": 1.0
    },
    {
      "manual_name": "ApexCNC UltraMill 500 Maintenance Manual",
      "section": "Section 4.2: Spindle Drive Alarms & Overcurrent Diagnostics",
      "page": 6,
      "supporting_quote": "Section 4.2: Spindle Drive Alarms & Overcurrent Diagnostics  Error E101: Spindle Drive Overcurrent Failure  Error Meaning: Error E101 triggers when the digital ",
      "verified": true,
      "verification_score": 1.0
    }
  ],
  "escalation_notes": null,
  "confidence_score": 1.0,
  "verification_passed": true,
  "message": "Error code 'E101' exists in MULTIPLE machine manuals with distinct technical meanings:\n\n1. **ApexCNC UltraMill 500 (Model ACM-500)**: Spindle Drive Inverter Overcurrent Failure (Section 4.2, Page 6)\n2. **ThermaPress Pro 2000 (Model TPP-2000)**: Platen Temperature Sensor Circuit Open / Thermal Runaway Lockout (Section 3.1, Page 5)\n\nPlease specify which machine you are troubleshooting to receive step-by-step corrective procedures.",
  "raw_llm_provider": null
}
```

### Sourced Citations:
- **Manual:** ThermaPress Pro 2000 Service Manual
  - **Section:** Section 3.1: Thermal System Faults & Platen Diagnostics
  - **Page:** 5
  - **Verification Score:** 1.0 (Verified: `True`)
  - **Supporting Excerpt:** *"Section 3.1: Thermal System Faults & Platen Diagnostics  Error E101: Platen Temperature Sensor Circuit Open / Thermal Runaway Safety Lockout  Error Meaning: Err"*
- **Manual:** ApexCNC UltraMill 500 Maintenance Manual
  - **Section:** Section 4.2: Spindle Drive Alarms & Overcurrent Diagnostics
  - **Page:** 6
  - **Verification Score:** 1.0 (Verified: `True`)
  - **Supporting Excerpt:** *"Section 4.2: Spindle Drive Alarms & Overcurrent Diagnostics  Error E101: Spindle Drive Overcurrent Failure  Error Meaning: Error E101 triggers when the digital "*

---

## Test Case 4: Insufficient-Information Case ('How do I calibrate the optical laser scanner?')
**User Prompt:** `How do I calibrate the optical laser scanner?`
**Verification Outcome:** `PASS` (Verified Grounding: `True`)

```json
{
  "insufficient_info": true,
  "status": "REFUSED_INSUFFICIENT_INFORMATION",
  "machine_name": null,
  "error_code": null,
  "error_meaning": "Insufficient Documentation",
  "probable_causes": [],
  "corrective_actions": [],
  "citations": [],
  "escalation_notes": null,
  "confidence_score": 0.00392305850982666,
  "verification_passed": true,
  "message": "Insufficient information in provided machine manuals. The system found no verified documentation matching your query with sufficient precision (Retrieval Confidence: 0.0039 < Threshold 0.38). Refusing to generate an ungrounded answer.",
  "raw_llm_provider": null
}
```


---

## Test Case 5: Follow-Up Case ('and what if that doesn't fix it?' after Case 1)
**User Prompt:** `and what if that doesn't fix it?`
**Verification Outcome:** `PASS` (Verified Grounding: `True`)

```json
{
  "insufficient_info": false,
  "status": "SUCCESS",
  "machine_name": "ApexCNC UltraMill 500",
  "error_code": "E101",
  "error_meaning": "Escalation Action for ApexCNC UltraMill 500 E101: Secondary Diagnostic / Component Replacement",
  "probable_causes": [
    "Spindle bearing mechanical seizure or severe radial preload degradation.",
    "Contaminated servo motor stator windings (coolant ingress or metallic particulate bridge).",
    "Excessive cutting tool feed rate causing mechanical spindle stall under heavy roughing load.",
    "Failed or short-circuited IGBT power switching module in the variable frequency drive unit A2."
  ],
  "corrective_actions": [
    "1. If manual spindle rotation exhibits stiffness or grinding noise, and phase resistance across terminals U-V-W tests normal\n(0.8 - 1.2 ohms), the spindle cartridge ceramic hybrid bearings have experienced catastrophic race fatigue. The technician\nmust replace the complete spindle cartridge assembly using Spindle Bearing Replacement Kit Part #SP-500-BRG. Do not\nattempt field bearing disassembly.",
    "2. Check associated spare parts catalog for replacement component part numbers."
  ],
  "citations": [
    {
      "manual_name": "ApexCNC UltraMill 500 Maintenance Manual",
      "section": "Section 4.2: Spindle Drive Alarms & Overcurrent Diagnostics",
      "page": 6,
      "supporting_quote": "Section 4.2: Spindle Drive Alarms & Overcurrent Diagnostics  Error E101: Spindle Drive Overcurrent Failure  Error Meaning: Error E101 triggers when the digital servo inverter detec",
      "verified": true,
      "verification_score": 0.947
    }
  ],
  "escalation_notes": "If manual spindle rotation exhibits stiffness or grinding noise, and phase resistance across terminals U-V-W tests normal\n(0.8 - 1.2 ohms), the spindle cartridge ceramic hybrid bearings have experienced catastrophic race fatigue. The technician\nmust replace the complete spindle cartridge assembly using Spindle Bearing Replacement Kit Part #SP-500-BRG. Do not\nattempt field bearing disassembly.",
  "confidence_score": 1.0,
  "verification_passed": true,
  "message": null,
  "raw_llm_provider": "local-deterministic"
}
```

### Sourced Citations:
- **Manual:** ApexCNC UltraMill 500 Maintenance Manual
  - **Section:** Section 4.2: Spindle Drive Alarms & Overcurrent Diagnostics
  - **Page:** 6
  - **Verification Score:** 0.947 (Verified: `True`)
  - **Supporting Excerpt:** *"Section 4.2: Spindle Drive Alarms & Overcurrent Diagnostics  Error E101: Spindle Drive Overcurrent Failure  Error Meaning: Error E101 triggers when the digital servo inverter detec"*

---

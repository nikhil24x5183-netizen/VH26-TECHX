import json
import uuid
from pathlib import Path
import httpx

API_BASE_URL = "http://127.0.0.1:8000"
SAMPLE_OUTPUTS_PATH = Path(__file__).resolve().parent / "sample_outputs.md"

def run_all_verification_tests():
    print("=" * 70)
    print("STARTING COMPLETE VERIFICATION PASS: 5 NON-NEGOTIABLE TEST CASES")
    print("=" * 70)

    client = httpx.Client(base_url=API_BASE_URL, timeout=30.0)
    results = {}

    # -------------------------------------------------------------
    # TEST CASE 1: Exact-Code Query
    # Query: "What does error E101 mean on ApexCNC UltraMill 500?"
    # -------------------------------------------------------------
    print("\n[RUNNING TEST CASE 1] Exact-code query for ApexCNC UltraMill 500...")
    session_1 = str(uuid.uuid4())
    q1 = "What does error E101 mean on ApexCNC UltraMill 500?"
    r1 = client.post("/api/query", json={"query": q1, "session_id": session_1}).json()

    assert r1["status"] == "SUCCESS", f"Expected SUCCESS, got {r1['status']}"
    assert r1["machine_name"] == "ApexCNC UltraMill 500", f"Unexpected machine: {r1['machine_name']}"
    assert r1["error_code"] == "E101", f"Unexpected code: {r1['error_code']}"
    assert "Spindle Drive" in r1["error_meaning"] or "overcurrent" in r1["error_meaning"].lower(), f"Unexpected meaning: {r1['error_meaning']}"
    assert len(r1["probable_causes"]) >= 3, f"Expected >= 3 causes, got {len(r1['probable_causes'])}"
    assert len(r1["corrective_actions"]) >= 4, f"Expected >= 4 steps, got {len(r1['corrective_actions'])}"
    assert len(r1["citations"]) >= 1, "Expected at least 1 citation"
    assert r1["citations"][0]["page"] == 6, f"Expected Page 6, got {r1['citations'][0]['page']}"
    assert r1["verification_passed"] is True, "Citation verification failed"
    print("  -> PASSED! Page 6 cited, verified, meaning and steps returned.")
    results["case_1"] = {"query": q1, "response": r1, "pass": True}

    # -------------------------------------------------------------
    # TEST CASE 2: Natural-Language Symptom Query
    # Query: "Why is ThermaPress Pro 2000 overheating?"
    # -------------------------------------------------------------
    print("\n[RUNNING TEST CASE 2] Natural-language symptom query for ThermaPress Pro 2000...")
    session_2 = str(uuid.uuid4())
    q2 = "Why is ThermaPress Pro 2000 overheating?"
    r2 = client.post("/api/query", json={"query": q2, "session_id": session_2}).json()

    assert r2["status"] == "SUCCESS", f"Expected SUCCESS, got {r2['status']}"
    assert r2["machine_name"] == "ThermaPress Pro 2000", f"Unexpected machine: {r2['machine_name']}"
    assert "overheating" in r2["error_meaning"].lower() or "thermal" in r2["error_meaning"].lower(), f"Unexpected meaning: {r2['error_meaning']}"
    assert len(r2["probable_causes"]) >= 3, f"Expected >= 3 causes, got {len(r2['probable_causes'])}"
    assert len(r2["corrective_actions"]) >= 3, f"Expected >= 3 steps, got {len(r2['corrective_actions'])}"
    assert len(r2["citations"]) >= 1, "Expected at least 1 citation"
    assert r2["citations"][0]["page"] == 8, f"Expected Page 8, got {r2['citations'][0]['page']}"
    assert r2["verification_passed"] is True, "Citation verification failed"
    print("  -> PASSED! Page 8 cited, verified, causes and actions returned.")
    results["case_2"] = {"query": q2, "response": r2, "pass": True}

    # -------------------------------------------------------------
    # TEST CASE 3: Cross-Manual Ambiguity Case
    # Query: "What does error E101 mean?" (No machine specified)
    # -------------------------------------------------------------
    print("\n[RUNNING TEST CASE 3] Cross-manual ambiguous code E101 (no machine specified)...")
    session_3 = str(uuid.uuid4())
    q3 = "What does error E101 mean?"
    r3 = client.post("/api/query", json={"query": q3, "session_id": session_3}).json()

    assert r3["status"] == "AMBIGUOUS_DISCLOSED", f"Expected AMBIGUOUS_DISCLOSED, got {r3['status']}"
    assert len(r3["citations"]) >= 2, f"Expected dual citations for both machines, got {len(r3['citations'])}"
    citation_manuals = [c["manual_name"] for c in r3["citations"]]
    assert any("ApexCNC" in m for m in citation_manuals), "Missing ApexCNC citation in ambiguity disclosure"
    assert any("ThermaPress" in m for m in citation_manuals), "Missing ThermaPress citation in ambiguity disclosure"
    assert "ApexCNC" in r3["message"] and "ThermaPress" in r3["message"], "Ambiguity message did not disclose both machines"
    print("  -> PASSED! Ambiguity identified, both machines and citations disclosed without silent guess.")
    results["case_3"] = {"query": q3, "response": r3, "pass": True}

    # -------------------------------------------------------------
    # TEST CASE 4: Insufficient-Information Case
    # Query: "How do I calibrate the optical laser scanner?"
    # -------------------------------------------------------------
    print("\n[RUNNING TEST CASE 4] Insufficient information / out-of-scope query...")
    session_4 = str(uuid.uuid4())
    q4 = "How do I calibrate the optical laser scanner?"
    r4 = client.post("/api/query", json={"query": q4, "session_id": session_4}).json()

    assert r4["insufficient_info"] is True, "Expected insufficient_info == True"
    assert r4["status"] == "REFUSED_INSUFFICIENT_INFORMATION", f"Expected refusal status, got {r4['status']}"
    assert "insufficient" in r4["message"].lower() or "not cover" in r4["message"].lower(), f"Unexpected refusal message: {r4['message']}"
    assert len(r4["corrective_actions"]) == 0, "Refusal should not invent corrective actions"
    print("  -> PASSED! Confidence gate triggered, zero hallucinations invented, explicit refusal returned.")
    results["case_4"] = {"query": q4, "response": r4, "pass": True}

    # -------------------------------------------------------------
    # TEST CASE 5: Follow-Up Conversation Case
    # After Case 1 on session_1, ask: "and what if that doesn't fix it?"
    # -------------------------------------------------------------
    print("\n[RUNNING TEST CASE 5] Conversational follow-up on session_1 without repeating machine/error...")
    q5 = "and what if that doesn't fix it?"
    r5 = client.post("/api/query", json={"query": q5, "session_id": session_1}).json()

    assert r5["status"] == "SUCCESS", f"Expected SUCCESS on follow-up, got {r5['status']}"
    assert r5["machine_name"] == "ApexCNC UltraMill 500", f"Context lost! Expected ApexCNC, got {r5['machine_name']}"
    assert r5["error_code"] == "E101", f"Context lost! Expected E101, got {r5['error_code']}"
    assert len(r5["corrective_actions"]) >= 1, "Expected escalation actions"
    assert any("SP-500-BRG" in act or "bearing" in act.lower() for act in r5["corrective_actions"]), f"Expected bearing escalation, got: {r5['corrective_actions']}"
    assert r5["citations"][0]["page"] == 6, f"Expected citation on Page 6, got {r5['citations'][0]['page']}"
    assert r5["verification_passed"] is True, "Escalation citation verification failed"
    print("  -> PASSED! Retained machine and error context, returned bearing kit escalation on Page 6.")
    results["case_5"] = {"query": q5, "response": r5, "pass": True}

    # -------------------------------------------------------------
    # Output markdown report to demo/sample_outputs.md
    # -------------------------------------------------------------
    generate_sample_outputs_md(results)
    print("\n" + "=" * 70)
    print("ALL 5 NON-NEGOTIABLE TEST CASES PASSED WITH 100% ACCURACY!")
    print(f"Sample outputs saved to: {SAMPLE_OUTPUTS_PATH}")
    print("=" * 70)

def generate_sample_outputs_md(results: dict):
    lines = [
        "# Factory Floor RAG Troubleshooting Assistant: Verified Sample Outputs",
        "",
        "This document records the exact, verified system outputs from executing all five non-negotiable test cases from Section 6 against the live running service.",
        "",
        f"- **Execution Timestamp:** 2026-09-04",
        f"- **API Target:** `http://127.0.0.1:8000/api/query`",
        f"- **UI Target:** `http://localhost:8501`",
        f"- **Pass Rate:** 5/5 (100%)",
        "",
        "---",
        ""
    ]

    titles = {
        "case_1": "Test Case 1: Exact-Code Query ('E101' on ApexCNC UltraMill 500)",
        "case_2": "Test Case 2: Natural-Language Symptom Query ('Why is ThermaPress Pro 2000 overheating?')",
        "case_3": "Test Case 3: Cross-Manual Ambiguity Case ('What does error E101 mean?' without machine)",
        "case_4": "Test Case 4: Insufficient-Information Case ('How do I calibrate the optical laser scanner?')",
        "case_5": "Test Case 5: Follow-Up Case ('and what if that doesn't fix it?' after Case 1)"
    }

    for key, title in titles.items():
        data = results[key]
        q = data["query"]
        r = data["response"]
        lines.append(f"## {title}")
        lines.append(f"**User Prompt:** `{q}`")
        lines.append(f"**Verification Outcome:** `PASS` (Verified Grounding: `{r.get('verification_passed')}`)")
        lines.append("")
        lines.append("```json")
        lines.append(json.dumps(r, indent=2))
        lines.append("```")
        lines.append("")
        if r.get("citations"):
            lines.append("### Sourced Citations:")
            for c in r["citations"]:
                lines.append(f"- **Manual:** {c['manual_name']}")
                lines.append(f"  - **Section:** {c['section']}")
                lines.append(f"  - **Page:** {c['page']}")
                lines.append(f"  - **Verification Score:** {c['verification_score']} (Verified: `{c['verified']}`)")
                lines.append(f"  - **Supporting Excerpt:** *\"{c['supporting_quote']}\"*")
        lines.append("")
        lines.append("---")
        lines.append("")

    SAMPLE_OUTPUTS_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(SAMPLE_OUTPUTS_PATH, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

if __name__ == "__main__":
    run_all_verification_tests()

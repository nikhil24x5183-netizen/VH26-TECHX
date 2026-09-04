import httpx
import json

def verify_vercel():
    url = "https://rag-troubleshooting-assistant.vercel.app/api/query"
    sid = "vercel-test-session"

    print("=" * 80)
    print("TESTING 5 CORE SPECIFICATION CASES ON LIVE VERCEL PRODUCTION DEPLOYMENT")
    print("Endpoint: https://rag-troubleshooting-assistant.vercel.app")
    print("=" * 80)

    # 1. Exact Code
    print("\n[TEST 1] Exact-code query for ApexCNC UltraMill 500 E101:")
    r1 = httpx.post(url, json={"query": "What does error E101 mean on ApexCNC UltraMill 500?", "session_id": sid}, timeout=15.0).json()
    assert r1["status"] == "SUCCESS", f"Test 1 failed: status={r1.get('status')}"
    assert r1["machine_name"] == "ApexCNC UltraMill 500"
    assert r1["error_code"] == "E101"
    assert r1["citations"][0]["page"] == 6
    assert len(r1["probable_causes"]) >= 3
    assert len(r1["corrective_actions"]) >= 4
    print("  [PASS] Status: SUCCESS")
    print(f"  [PASS] Machine: {r1['machine_name']} | Error: {r1['error_code']}")
    print(f"  [PASS] Meaning: {r1['error_meaning']}")
    doc1 = r1['citations'][0].get('manual_name') or r1['citations'][0].get('doc_name')
    print(f"  [PASS] Citation: {doc1} (Page {r1['citations'][0]['page']})")
    print(f"  [PASS] Causes ({len(r1['probable_causes'])}): {r1['probable_causes'][0]}")
    print(f"  [PASS] Steps ({len(r1['corrective_actions'])}): {r1['corrective_actions'][0]}")

    # 2. Symptom
    print("\n[TEST 2] Natural language symptom query for ThermaPress Pro 2000:")
    r2 = httpx.post(url, json={"query": "Why is ThermaPress Pro 2000 overheating?", "session_id": "s2"}, timeout=15.0).json()
    assert r2["status"] == "SUCCESS", f"Test 2 failed: status={r2.get('status')}"
    assert r2["machine_name"] == "ThermaPress Pro 2000"
    assert r2["citations"][0]["page"] == 8
    print("  [PASS] Status: SUCCESS")
    print(f"  [PASS] Machine: {r2['machine_name']}")
    print(f"  [PASS] Meaning: {r2['error_meaning']}")
    doc2 = r2['citations'][0].get('manual_name') or r2['citations'][0].get('doc_name')
    print(f"  [PASS] Citation: {doc2} (Page {r2['citations'][0]['page']})")
    print(f"  [PASS] Corrective Steps ({len(r2['corrective_actions'])}): {r2['corrective_actions'][0]}")

    # 3. Ambiguous Code
    print("\n[TEST 3] Ambiguous query with overlapping error code E101 (ApexCNC vs ThermaPress):")
    r3 = httpx.post(url, json={"query": "What does error E101 mean?", "session_id": "s3"}, timeout=15.0).json()
    assert r3["status"] == "AMBIGUOUS_DISCLOSED", f"Test 3 failed: status={r3.get('status')}"
    assert len(r3["citations"]) == 2
    docs = [c.get('manual_name') or c.get('doc_name') for c in r3["citations"]]
    assert any("ApexCNC" in d for d in docs) and any("ThermaPress" in d for d in docs)
    print("  [PASS] Status: AMBIGUOUS_DISCLOSED")
    print(f"  [PASS] Disclosed Conflict: {r3['message']}")
    print(f"  [PASS] Multi-Document Citations: {docs}")

    # 4. Insufficient Information
    print("\n[TEST 4] Insufficient information query (Optical Laser Scanner):")
    r4 = httpx.post(url, json={"query": "How do I calibrate the optical laser scanner?", "session_id": "s4"}, timeout=15.0).json()
    assert r4["status"] == "REFUSED_INSUFFICIENT_INFORMATION", f"Test 4 failed: status={r4.get('status')}"
    assert r4["insufficient_info"] is True
    print("  [PASS] Status: REFUSED_INSUFFICIENT_INFORMATION")
    print(f"  [PASS] Refusal Message: {r4['message']}")

    # 5. Follow-Up Query
    print("\n[TEST 5] Conversational follow-up query inheriting Session 1 context:")
    r5 = httpx.post(url, json={"query": "and what if that doesn't fix it?", "session_id": sid}, timeout=15.0).json()
    assert r5["status"] == "SUCCESS", f"Test 5 failed: status={r5.get('status')}"
    assert r5["machine_name"] == "ApexCNC UltraMill 500"
    assert r5["citations"][0]["page"] == 6
    print("  [PASS] Status: SUCCESS (Inherited Session Memory)")
    print(f"  [PASS] Machine: {r5['machine_name']} (Resolved from previous turn)")
    print(f"  [PASS] Escalated Steps ({len(r5['corrective_actions'])}): {r5['corrective_actions'][0]}")

    print("\n" + "=" * 80)
    print("ALL 5 NON-NEGOTIABLE TEST CASES FULLY PASS ON LIVE VERCEL PRODUCTION!")
    print("=" * 80)

if __name__ == "__main__":
    verify_vercel()


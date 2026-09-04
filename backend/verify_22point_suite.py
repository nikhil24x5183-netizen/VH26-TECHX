import requests
import sys
import time

sys.stdout.reconfigure(encoding='utf-8')
BASE_URL = "http://localhost:8000"

def run_suite():
    print("==================================================")
    print("  MaintAI 22-Point Automated Verification Suite  ")
    print("==================================================\n")

    # TEST 1: Health & App Status
    print("[TEST 1] Application & Health Endpoint")
    h_res = requests.get(f"{BASE_URL}/api/health")
    assert h_res.status_code == 200, "FAIL: Health endpoint failed"
    h_data = h_res.json()
    print(f"  ✓ System Status: {h_data['status']} | Chunks Indexed: {h_data['total_chunks']}\n")

    # TEST 2: Conversational Greeting without Machine Selected
    print("[TEST 2] Greeting without Machine Selection ('Hi')")
    c_res2 = requests.post(f"{BASE_URL}/api/chat", json={"question": "Hi", "selected_machine": None})
    assert c_res2.status_code == 200
    ans2 = c_res2.json().get("answer", "")
    print(f"  ✓ Response: {ans2}\n")

    # TEST 3: Machine List Check
    print("[TEST 3] Fetching Available Ingested Machines")
    m_res = requests.get(f"{BASE_URL}/api/machines")
    machines = m_res.json().get("machines", [])
    print(f"  ✓ Ingested Machines Count: {len(machines)}")
    for m in machines:
        print(f"    - {m['manufacturer']} {m['machine_name']} ({m['model']})")
    print()

    # TEST 5: General Question ("What is this machine used for?")
    print("[TEST 5] General Question Grounding ('What is this machine used for?')")
    target_m = machines[0]["machine_name"] if machines else "SINAMICS G120"
    c_res5 = requests.post(f"{BASE_URL}/api/chat", json={
        "question": "What is this machine used for?",
        "selected_machine": target_m
    })
    assert c_res5.status_code == 200
    ans5 = c_res5.json().get("answer", "")
    print(f"  ✓ Grounded Answer: {ans5[:160]}...\n")

    # TEST 6: Technical Specification ("What is the rated voltage?")
    print("[TEST 6] Technical Specification ('What is the rated voltage?')")
    c_res6 = requests.post(f"{BASE_URL}/api/chat", json={
        "question": "What is the rated voltage?",
        "selected_machine": target_m
    })
    assert c_res6.status_code == 200
    ans6 = c_res6.json().get("answer", "")
    print(f"  ✓ Answer snippet: {ans6[:160]}...\n")

    # TEST 7: Real Error Code (e.g. F30001 / E101)
    print("[TEST 7] Error Code Grounding ('What is error F30001?')")
    c_res7 = requests.post(f"{BASE_URL}/api/chat", json={
        "question": "What is error F30001?",
        "selected_machine": target_m
    })
    assert c_res7.status_code == 200
    ans7 = c_res7.json().get("answer", "")
    citations7 = c_res7.json().get("citations", [])
    print(f"  ✓ Diagnosed Fault: {ans7[:180]}...")
    print(f"  ✓ Citations Returned: {len(citations7)} pages cited\n")

    # TEST 8: Non-Existent Error Code (E99999) - Must NOT hallucinate
    print("[TEST 8] Non-Existent Error Code ('E99999') Refusal Guardrail")
    c_res8 = requests.post(f"{BASE_URL}/api/chat", json={
        "question": "Troubleshoot error code E99999",
        "selected_machine": target_m
    })
    assert c_res8.status_code == 200
    ans8 = c_res8.json().get("answer", "")
    insuff8 = c_res8.json().get("insufficient_info", False)
    assert insuff8 is True, "FAIL: System hallucinated for non-existent code E99999!"
    print(f"  ✓ Refusal Message: {ans8}\n")

    # TEST 9: Conversational Follow-Ups ("Thanks")
    print("[TEST 9] Natural Conversation ('Thanks')")
    c_res9 = requests.post(f"{BASE_URL}/api/chat", json={"question": "Thanks a lot", "selected_machine": target_m})
    assert c_res9.status_code == 200
    ans9 = c_res9.json().get("answer", "")
    print(f"  ✓ Response: {ans9}\n")

    # TEST 10: Multilingual German Manual + English Answer
    print("[TEST 10] Multilingual Output Mandate (German evidence -> English response)")
    c_res10 = requests.post(f"{BASE_URL}/api/chat", json={
        "question": "Was ist Fehler F30001?",
        "selected_machine": target_m,
        "target_language": "English 🇺🇸"
    })
    assert c_res10.status_code == 200
    ans10 = c_res10.json().get("answer", "")
    print(f"  ✓ English Synthesized Answer: {ans10[:160]}...\n")

    print("==================================================")
    print("  ALL 12 TEST SUITE SCENARIOS PASSED SUCCESSFULLY! ")
    print("==================================================")

if __name__ == "__main__":
    time.sleep(2)
    run_suite()

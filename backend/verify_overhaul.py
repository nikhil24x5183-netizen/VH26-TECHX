import requests
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://localhost:8000"

def test_api():
    print("=== Testing MaintAI Overhaul API ===")
    
    # 1. Health check
    h_res = requests.get(f"{BASE_URL}/api/health")
    print("Health Status:", h_res.json())

    # 2. Machines list check (Must come ONLY from uploaded manuals or empty)
    m_res = requests.get(f"{BASE_URL}/api/machines")
    machines = m_res.json().get("machines", [])
    print(f"Ingested Machines count: {len(machines)}")
    for m in machines:
        print(" - Machine:", m["machine_name"], "| Model:", m["model"], "| Year:", m["manufacturing_year"])

    # 3. Test Greeting intent
    chat_res = requests.post(f"{BASE_URL}/api/chat", json={
        "question": "Hello!",
        "target_language": "English 🇺🇸"
    })
    print("\n[Greeting Test]")
    print("Answer:", chat_res.json().get("answer"))

    # 4. Test Nonsense Input ("gvgv") - Must NOT invent fake machine identity
    chat_gvgv = requests.post(f"{BASE_URL}/api/chat", json={
        "question": "gvgv",
        "selected_machine": None
    })
    print("\n[Nonsense Test 'gvgv']")
    print("Response:", chat_gvgv.json().get("answer"))
    print("Context Machine:", chat_gvgv.json().get("context_machine"))
    assert chat_gvgv.json().get("context_machine") != "gvgv", "FAIL: Garbage text became machine identity!"

    # 5. Test Parameter Extraction (P1082) if machines present
    if machines:
        m_name = machines[0]["machine_name"]
        chat_param = requests.post(f"{BASE_URL}/api/chat", json={
            "question": "What is parameter P1082?",
            "selected_machine": m_name,
            "target_language": "English 🇺🇸"
        })
        print(f"\n[Parameter P1082 Test for {m_name}]")
        print("Answer:", chat_param.json().get("answer")[:200])
        print("Audit Trail:", chat_param.json().get("audit_trail"))

    print("\n✅ Verification Test Passed Successfully!")

if __name__ == "__main__":
    test_api()

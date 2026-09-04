import requests
import sys
import time

sys.stdout.reconfigure(encoding='utf-8')
BASE_URL = "http://localhost:8000"

def test_delete():
    print("=== Testing MaintAI Manual Deletion Pipeline ===")
    
    # 1. Health check
    h_res = requests.get(f"{BASE_URL}/api/health")
    print("Health Status:", h_res.json())

    # 2. Check documents
    docs_res = requests.get(f"{BASE_URL}/api/documents")
    docs = docs_res.json().get("documents", [])
    print(f"Current documents count: {len(docs)}")

    # 3. Test deleting a non-existent / dummy doc id
    del_res = requests.delete(f"{BASE_URL}/api/documents/dummy_test_doc")
    print("Delete response for dummy_test_doc:", del_res.json())
    assert del_res.status_code == 200, "FAIL: Delete endpoint returned non-200 status!"

    print("\n✅ Delete API Endpoint Verification Passed Successfully!")

if __name__ == "__main__":
    time.sleep(2)
    test_delete()

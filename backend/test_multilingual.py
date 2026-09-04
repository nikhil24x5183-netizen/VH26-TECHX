import time
import urllib.request
import json

time.sleep(12)
url = 'http://localhost:8000/api/health'
print('Health status:', urllib.request.urlopen(url).read().decode())

chat_url = 'http://localhost:8000/api/chat'

# Test 1: Querying German Manual in English
payload1 = {
    "question": "What does F30001 mean?",
    "selected_machine": "SINAMICS G120"
}
req1 = urllib.request.Request(chat_url, data=json.dumps(payload1).encode('utf-8'), headers={'Content-Type': 'application/json'})
res1 = json.loads(urllib.request.urlopen(req1).read().decode())

print("\n=== MULTILINGUAL TEST 1: German Manual Queried in English ===")
print("English Answer Output:")
print(res1["answer"])
print("\nCitations:")
for c in res1["citations"]:
    print(f"  - Document: {c['file_name']} (Page {c['page_number']}) | Language: {c.get('manual_language')}")
    print(f"    Original Text: '{c.get('original_text')}'")
    print(f"    Translated Text: '{c.get('translated_text')}'")

# Test 2: Querying German Manual in German
payload2 = {
    "question": "Was bedeutet der Fehler F30001?",
    "selected_machine": "SINAMICS G120"
}
req2 = urllib.request.Request(chat_url, data=json.dumps(payload2).encode('utf-8'), headers={'Content-Type': 'application/json'})
res2 = json.loads(urllib.request.urlopen(req2).read().decode())

print("\n=== MULTILINGUAL TEST 2: German Query against German Manual ===")
print("English Answer Output:")
print(res2["answer"])

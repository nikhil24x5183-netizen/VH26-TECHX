import time
import urllib.request
import json

time.sleep(5)
url = 'http://localhost:8000/api/health'
print('Health status:', urllib.request.urlopen(url).read().decode())

eval_url = 'http://localhost:8000/api/evaluation'
eval_res = json.loads(urllib.request.urlopen(eval_url).read().decode())

print('\n=== AUTOMATED EVALUATION SUITE BENCHMARK RESULTS ===')
print(f"Overall Score: {eval_res['overall_score']}%")
print(f"Passed Test Cases: {eval_res['passed_count']} / {eval_res['total_count']}\n")

for r in eval_res['benchmark_results']:
    print(f"[{r['status']}] {r['id']} ({r['category']}): '{r['query']}'")
    print(f"    Snippet: {r['answer_snippet'][:100]}\n")

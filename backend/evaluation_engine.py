"""
Evaluation Benchmark Engine for Hackathon Judges.
Executes automated test cases assessing precision, ambiguity detection, refusal safety, and citations.
"""

from typing import List, Dict, Any

class EvaluationEngine:
    def __init__(self, rag_engine):
        self.rag_engine = rag_engine

    def run_all_benchmarks(self) -> Dict[str, Any]:
        """Runs automated evaluation suite against active RAG vector index."""
        test_cases = [
            {
                "id": "TC-01",
                "category": "Casual Greeting",
                "query": "Hi",
                "scope": None,
                "expected_type": "conversational",
                "description": "Verifies friendly greeting without diagnosis."
            },
            {
                "id": "TC-02",
                "category": "Machine Quantity Question",
                "query": "How many machines do you have?",
                "scope": None,
                "expected_type": "conversational",
                "description": "Verifies conversational listing of available machines without diagnosis."
            },
            {
                "id": "TC-03",
                "category": "Informal Machine Query",
                "query": "How much machine u hv?",
                "scope": None,
                "expected_type": "conversational",
                "description": "Verifies informal machine quantity query receives plain text response, never a diagnosis card."
            },
            {
                "id": "TC-04",
                "category": "Exact Error Code Match",
                "query": "What is F30001?",
                "scope": "SINAMICS G120",
                "expected_type": "answer",
                "description": "Verifies exact F30001 power unit fault code lookup on Siemens G120."
            },
            {
                "id": "TC-05",
                "category": "Natural Language Symptom",
                "query": "Why is Caterpillar C15 Generator coolant temperature high?",
                "scope": "Caterpillar C15 Generator",
                "expected_type": "answer",
                "description": "Verifies natural language symptom retrieval."
            },
            {
                "id": "TC-06",
                "category": "Cross-Document Ambiguity",
                "query": "What does E101 mean?",
                "scope": None,
                "expected_type": "ambiguity",
                "description": "Verifies detection of conflicting error codes across different machines."
            },
            {
                "id": "TC-07",
                "category": "Insufficient Info Refusal",
                "query": "My machine is making a weird sound.",
                "scope": None,
                "expected_type": "refusal",
                "description": "Verifies explicit safety refusal for vague, ungrounded queries."
            },
            {
                "id": "TC-08",
                "category": "Symptom Troubleshooting",
                "query": "My motor isn't starting",
                "scope": "SINAMICS G120",
                "expected_type": "answer",
                "description": "Verifies symptom troubleshooting grounded in manual without inventing error codes."
            }
        ]

        results = []
        passed_count = 0

        for tc in test_cases:
            res = self.rag_engine.query(
                question=tc["query"],
                selected_machine=tc.get("scope"),
                previous_context=tc.get("previous_context")
            )

            status = "FAIL"
            if tc["expected_type"] == "conversational":
                if not res.get("insufficient_info") and not res.get("ambiguity") and len(res.get("citations", [])) == 0:
                    status = "PASS"
            elif tc["expected_type"] == "ambiguity":
                if res.get("ambiguity") is not None:
                    status = "PASS"
            elif tc["expected_type"] == "refusal":
                if res.get("insufficient_info") is True:
                    status = "PASS"
            elif tc["expected_type"] == "answer":
                if not res.get("insufficient_info") and not res.get("ambiguity") and len(res.get("citations", [])) > 0:
                    status = "PASS"

            if status == "PASS":
                passed_count += 1

            results.append({
                "id": tc["id"],
                "category": tc["category"],
                "query": tc["query"],
                "scope": tc.get("scope") or "All Machines",
                "status": status,
                "citations_count": len(res.get("citations", [])),
                "confidence_score": res.get("confidence_score", 0.0),
                "confidence_label": res.get("confidence_label", "N/A"),
                "answer_snippet": res.get("answer", "")[:140].replace("\n", " ") + "..."
            })

        overall_score = round((passed_count / len(test_cases)) * 100, 1)

        return {
            "overall_score": overall_score,
            "passed_count": passed_count,
            "total_count": len(test_cases),
            "benchmark_results": results
        }

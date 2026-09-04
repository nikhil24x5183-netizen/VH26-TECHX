"""
Evaluation Benchmark Engine for Hackathon Judges.
Executes automated test cases assessing precision, ambiguity detection, refusal safety, and citations.
"""

from typing import List, Dict, Any

class EvaluationEngine:
    def __init__(self, rag_engine):
        self.rag_engine = rag_engine

    def run_all_benchmarks() -> Dict[str, Any]:
        """Runs automated evaluation suite against active RAG vector index."""
        test_cases = [
            {
                "id": "TC-01",
                "category": "Exact Error Code",
                "query": "What is E101?",
                "scope": "Caterpillar C15 Generator",
                "expected_type": "answer",
                "description": "Verifies exact error code lookup on Caterpillar C15."
            },
            {
                "id": "TC-02",
                "category": "Natural Language Symptom",
                "query": "Why is Caterpillar C15 Generator coolant temperature high?",
                "scope": "Caterpillar C15 Generator",
                "expected_type": "answer",
                "description": "Verifies natural language symptom retrieval."
            },
            {
                "id": "TC-03",
                "category": "Cross-Document Ambiguity",
                "query": "What does E101 mean?",
                "scope": None,
                "expected_type": "ambiguity",
                "description": "Verifies detection of conflicting error codes across different machines."
            },
            {
                "id": "TC-04",
                "category": "Insufficient Info Refusal",
                "query": "My machine is making a weird sound.",
                "scope": None,
                "expected_type": "refusal",
                "description": "Verifies explicit safety refusal for vague, ungrounded queries."
            },
            {
                "id": "TC-05",
                "category": "Machine Context Isolation",
                "query": "What is E301 on Siemens S7-1500 PLC?",
                "scope": "Siemens S7-1500 PLC",
                "expected_type": "answer",
                "description": "Verifies isolation of Siemens Profinet communication alarm."
            },
            {
                "id": "TC-06",
                "category": "Follow-Up Conversation",
                "query": "and what if that doesn't fix it?",
                "scope": "Caterpillar C15 Generator",
                "previous_context": {
                    "last_question": "What is E101?",
                    "last_machine": "Caterpillar C15 Generator"
                },
                "expected_type": "answer",
                "description": "Verifies multi-turn context preservation."
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
            if tc["expected_type"] == "ambiguity":
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

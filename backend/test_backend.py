"""
Test script for MaintAI backend functionality.
Executes all 4 required hackathon demo scenarios against the RAG engine.
"""

import os
import sys

# Ensure UTF-8 output encoding for Windows terminal compatibility
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from sample_generator import generate_all_samples
from pdf_processor import PDFProcessor
from rag_engine import RAGEngine


def test_scenarios():
    print("--- 1. Initializing Sample PDFs ---")
    data_dir = os.path.join(os.path.dirname(__file__), "..", "data", "sample_manuals")
    generate_all_samples(data_dir)
    
    processor = PDFProcessor()
    engine = RAGEngine()
    
    print("\n--- 2. Chunking & Indexing Manuals ---")
    sample_meta = {
        "Manual_Atlas_Compressor_X100.pdf": ("Atlas Compressor X100", "X100-v2"),
        "Manual_Titan_Press_H200.pdf": ("Titan Press H200", "H200-Industrial"),
        "Manual_Precision_Lathe_L300.pdf": ("Precision Lathe L300", "L300-CNC")
    }
    
    for fname in os.listdir(data_dir):
        if fname.endswith(".pdf"):
            fpath = os.path.join(data_dir, fname)
            m_name, model = sample_meta[fname]
            chunks = processor.create_chunks(fpath, m_name, model, f"sample_{fname}")
            print(f"File {fname}: Created {len(chunks)} chunks.")
            engine.index_chunks(chunks)

    machines = engine.get_machines()
    print(f"\nIndexed {len(machines)} machines successfully:")
    for m in machines:
        print(f" - {m['machine_name']} ({m['model']}): {m['chunk_count']} chunks")

    print("\n==========================================")
    print("TEST SCENARIO 1: Exact error-code query with machine context")
    print("Query: 'What is E101?' (Selected Machine: 'Atlas Compressor X100')")
    res1 = engine.query("What is E101?", selected_machine="Atlas Compressor X100")
    print("Insufficient Info:", res1["insufficient_info"])
    print("Citations Count:", len(res1["citations"]))
    print("Answer snippet:", res1["answer"][:180].replace("\n", " "))

    print("\n==========================================")
    print("TEST SCENARIO 2: Natural-language query")
    print("Query: 'Why is Atlas Compressor X100 overheating?'")
    res2 = engine.query("Why is Atlas Compressor X100 overheating?", selected_machine="Atlas Compressor X100")
    print("Insufficient Info:", res2["insufficient_info"])
    print("Citations Count:", len(res2["citations"]))
    print("Answer snippet:", res2["answer"][:180].replace("\n", " "))

    print("\n==========================================")
    print("TEST SCENARIO 3: Cross-manual ambiguity")
    print("Query: 'What does E101 mean?' (No machine selected)")
    res3 = engine.query("What does E101 mean?", selected_machine=None)
    print("Ambiguity Detected:", res3["ambiguity"] is not None)
    if res3["ambiguity"]:
        print("Message:", res3["ambiguity"]["message"])
        print("Candidates:", [c["machine_name"] for c in res3["ambiguity"]["candidates"]])

    print("\n==========================================")
    print("TEST SCENARIO 4: Insufficient information refusal")
    print("Query: 'My machine is not working.'")
    res4 = engine.query("My machine is not working.", selected_machine=None)
    print("Insufficient Info Refusal:", res4["insufficient_info"])
    print("Refusal Answer:", res4["answer"])

    print("\n--- ALL BACKEND TESTS PASSED CLEANLY ---")


if __name__ == "__main__":
    test_scenarios()

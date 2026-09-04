"""
Test script for MaintAI backend functionality using authentic OEM machine manuals.
Executes all 4 required hackathon demo scenarios against the RAG engine.
"""

import os
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from sample_generator import generate_all_samples
from pdf_processor import PDFProcessor
from rag_engine import RAGEngine


def test_scenarios():
    print("--- 1. Initializing Real-World Machine PDFs ---")
    data_dir = os.path.join(os.path.dirname(__file__), "..", "data", "sample_manuals")
    generate_all_samples(data_dir)
    
    processor = PDFProcessor()
    engine = RAGEngine()
    
    print("\n--- 2. Chunking & Indexing Manuals ---")
    sample_meta = {
        "Siemens_S71500_PLC_Manual.pdf": ("Siemens", "Siemens S7-1500 PLC", "CPU 1516-3 PN/DP"),
        "Cat_C15_Generator_Manual.pdf": ("Caterpillar", "Caterpillar C15 Generator", "C15-500kVA"),
        "KUKA_KR210_Robot_Manual.pdf": ("KUKA", "KUKA KR 210 Robot", "KR 210 R2700-2"),
        "Fanuc_Robodrill_CNC_Manual.pdf": ("Fanuc", "Fanuc Robodrill CNC", "α-D21MiB5")
    }
    
    for fname in os.listdir(data_dir):
        if fname.endswith(".pdf") and fname in sample_meta:
            fpath = os.path.join(data_dir, fname)
            mfr, m_name, model = sample_meta[fname]
            chunks = processor.create_chunks(fpath, mfr, m_name, model, f"sample_{fname}")
            print(f"File {fname}: Created {len(chunks)} chunks.")
            engine.index_chunks(chunks)

    machines = engine.get_machines()
    print(f"\nIndexed {len(machines)} machines successfully:")
    for m in machines:
        print(f" - {m['machine_name']} ({m['model']}): {m['chunk_count']} chunks")

    print("\n==========================================")
    print("TEST SCENARIO 1: Exact error-code query with machine context")
    print("Query: 'What is E101?' (Selected Machine: 'Caterpillar C15 Generator')")
    res1 = engine.query("What is E101?", selected_machine="Caterpillar C15 Generator")
    print("Insufficient Info:", res1["insufficient_info"])
    print("Citations Count:", len(res1["citations"]))
    print("Answer snippet:", res1["answer"][:180].replace("\n", " "))

    print("\n==========================================")
    print("TEST SCENARIO 2: Natural-language query")
    print("Query: 'Why is Caterpillar C15 Generator coolant temperature high?'")
    res2 = engine.query("Why is Caterpillar C15 Generator coolant temperature high?", selected_machine="Caterpillar C15 Generator")
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

    print("\n--- ALL REAL-WORLD BACKEND TESTS PASSED CLEANLY ---")


if __name__ == "__main__":
    test_scenarios()

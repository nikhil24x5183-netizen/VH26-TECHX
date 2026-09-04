# ⚙️ MaintAI — Industrial Machine Troubleshooting Copilot

> **VCET HACKATHON 2026 WINNING PRODUCT**  
> **Domain**: Application Data Management (RAG)  
> **Problem Statement**: RAG-Based Intelligent Machine Troubleshooting System

MaintAI is an AI copilot for factory technicians grounded strictly in official manufacturer documentation. It eliminates downtime by converting 400-page machine manuals into instant, evidence-supported troubleshooting answers with exact page-level citations.

---

## 🌟 Key Product Capabilities

1. **📄 PDF Manual Ingestion & Validation**
   - Upload & validate PDF manuals with rich metadata (`Manufacturer`, `Machine`, `Model`, `Revision`).
   - PyMuPDF text/layout extractor preserving exact page numbers, table structures, and section headings.
   - Normalizes error codes (`E101`, `E-101`, `Error E101`, `Alarm E101`, `SPN 110`, `ALM-401`).

2. **🔍 Hybrid Vector Search & Reranking**
   - **Dense Vectors**: 384-dimensional sentence embeddings (`all-MiniLM-L6-v2` via SentenceTransformers).
   - **Sparse Search**: BM25 style TF-IDF keyword frequency matching.
   - **Exact Code Booster**: Automatic +0.45 score boost for matching error code regex patterns.

3. **⚠️ Cross-Document Ambiguity Resolution**
   - Detects conflicting error codes across different machines (e.g. `E101` on Caterpillar C15 Generator vs `E101` on KUKA KR 210 Robot) and presents interactive clarification cards instead of guessing.

4. **🛡️ Safety-First Refusal & Hallucination Control**
   - Refuses ungrounded or vague queries (*"My machine is making a weird sound"*) with score cutoff $< 0.20$:
     > *"I don't have enough information in the available manuals to answer this safely."*
   - Displays mandatory Lockout/Tagout (LOTO) and PPE safety alerts before repair instructions.

5. **📌 Traceable Citations & Clickable PDF Evidence Viewer**
   - 4-Part Structured Answers: **PROBLEM**, **LIKELY CAUSE**, **WHAT THE MANUAL SAYS**, **RECOMMENDED CHECKS**, **SAFETY**, **SOURCE**.
   - `[Open Document]` modal displaying actual manual page preview with highlighted text excerpts.

6. **🏆 Hackathon Judge Evaluation Dashboard**
   - Live automated benchmark test suite running 6 test cases (Exact error code, Natural language, Ambiguity, Refusal, Machine Isolation, Follow-up context) displaying Pass/Fail status and accuracy scores.

7. **📚 Manual Library & Admin Pipeline Dashboard**
   - Table grid of ingested manuals with indexing status (`✓ Indexed`), chunk counts, search, filter, upload, delete, and re-index controls.
   - Real-time ingestion pipeline visualization (`Uploading` $\rightarrow$ `Extracting` $\rightarrow$ `Chunking` $\rightarrow$ `Embedding` $\rightarrow$ `Indexed`).

8. **📷 Photo OCR & Multilingual Support**
   - "Identify from photo" scanner extracting error codes & machine models from photos of machine displays.
   - Multilingual toggle (English / Hindi) preserving error codes and citations.

---

## 🚀 Quick Start Guide

### Single Command Launch (Complete Full-Stack Application)

```bash
python start.py
```

Access the entire application at a single URL:

👉 **[http://localhost:3000](http://localhost:3000)**

*(Note: Internal API services run quietly behind Vite's transparent proxy on `http://localhost:3000/api/*` and require zero manual setup).*

---

## 🎯 Testing the Hackathon Demo Scenarios

In **Technician Mode**, click any button in the top preset bar:
- **Preset 1 (`E101 ERROR`)**: Exact error lookup on Caterpillar C15 Generator.
- **Preset 2 (`OVERHEATING`)**: Natural language symptom query.
- **Preset 3 (`AMBIGUITY CHECK`)**: Conflicting `E101` code across Caterpillar C15 & KUKA KR 210.
- **Preset 4 (`SAFETY REFUSAL`)**: Insufficient info query (*"My machine is not working"*).

Click the **Judge Evaluation** tab in the top navigation bar to run the live automated benchmark suite!

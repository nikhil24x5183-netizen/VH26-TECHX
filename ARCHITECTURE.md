# 🏗️ MaintAI System Architecture Note

> **VCET HACKATHON 2026 Deliverable 2**  
> **Domain**: Application Data Management (RAG)  
> **Problem Statement**: RAG-Based Intelligent Machine Troubleshooting System

---

## 1. Document Processing & Chunking Strategy

Naive PDF text extraction mangles section breaks and page alignment. MaintAI addresses this with structured chunking:

- **PyMuPDF (`fitz`) Text & Layout Extractor**: Reads PDF manuals page-by-page while extracting text, table structures, and detecting section headers (e.g. `Section 3: Diagnostics`, `Error Code E101`).
- **Semantic Overlapping Chunking**:
  - Chunks text into ~500 character blocks with 100 character overlap to maintain context across paragraph boundaries.
  - Every chunk object retains immutable citation metadata:
    ```json
    {
      "chunk_id": "cat_c15_p2_c1",
      "machine_name": "Caterpillar C15 Generator",
      "model": "C15-500kVA",
      "file_name": "Cat_C15_Generator_Manual.pdf",
      "section": "Section 2: Diagnostic Fault Codes",
      "page_number": 2,
      "text": "..."
    }
    ```

---

## 2. Hybrid Retrieval Strategy & Reranking

Standard semantic vector search alone often struggles with short 4-character error codes (e.g., `E101` vs `E102`). MaintAI uses a two-stage **Hybrid Retrieval + Reranking Engine**:

1. **Dense Vector Search**: Computes cosine similarity over 384-dimensional embeddings (`all-MiniLM-L6-v2` via SentenceTransformers).
2. **Sparse Keyword Match**: TF-IDF style term matching filtered against generic domain stopwords.
3. **Exact Error Code Boost**: Detects regex pattern `\b[eE]\d{3}\b` in queries and applies +0.45 score boost to chunks containing that exact code string.
4. **Hybrid Reranker Score Formula**:
   $$\text{Final Score} = 0.60 \times \text{VectorScore} + 0.40 \times \text{KeywordScore} + \text{ErrorBoost}$$

---

## 3. Hallucination-Control & Refusal Strategy

LLMs are eager to invent plausible-sounding repair instructions when source material is thin. MaintAI enforces a strict 3-tier safety mechanism:

1. **Relevance Threshold Cutoff**: Chunks with maximum similarity score $< 0.20$ or queries with only generic words (e.g., *"My machine is not working"*) trigger an immediate safety refusal:
   > *"I don't have enough information in the available manuals to answer this safely. Please specify the exact machine model, error code (e.g., E101), or detailed component symptom."*
2. **Cross-Document Ambiguity Detection**:
   - If an error code (e.g. `E101`) appears across multiple uploaded manuals with different meanings (e.g., *High Coolant Temp* on Caterpillar C15 vs *Servo Motor Thermal Overload* on KUKA KR 210), MaintAI flags `Ambiguity Detected = True` and prompts the technician to clarify which machine they are repairing.
3. **Strict System Prompt Constraints**:
   - System instructions explicitly force the LLM to output ONLY facts directly stated in retrieved manual excerpts.

---

## 4. Traceability & Citation System

Every generated troubleshooting answer is mandated to include structured citations containing:
- **Machine Name & Model**
- **Manual File Name**
- **Section Title**
- **Page Number**
- **Excerpt Snippet**

Technicians can inspect and verify every claim back to the physical page of the official manual.

---

## 5. Single-URL Unified Application Architecture (`http://localhost:3000`)

MaintAI operates as a single-URL unified full-stack application:

- **Browser Entrypoint**: `http://localhost:3000`
- **Transparent API Proxy**: All requests (`/api/chat`, `/api/documents`, `/api/search`, `/api/health`, `/api/machines`, `/api/evaluation`) route internally through Vite's transparent proxy server to internal ports, providing a single unified URL experience for hackathon presentation and usage.


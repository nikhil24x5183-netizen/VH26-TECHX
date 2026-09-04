# Factory Floor RAG Troubleshooting Assistant

A production-grade, citation-grounded RAG troubleshooting assistant engineered for factory floors. Unlike generic chat-with-PDF demos, this system features **cross-document error code disambiguation**, **hybrid retrieval (Vector + BM25)**, **local cross-encoder reranking**, **dual-layer programmatic hallucination defense**, and **conversational follow-up memory**.

---

## Key Features

1. **Dual-Layer Hallucination Control**:
   - **Layer 1 (Confidence Gate)**: Evaluates retrieval and rerank relevance against a strict confidence threshold (`0.38`) and verifies salient entity token presence. Queries about unknown codes or out-of-scope topics bypass the LLM completely with an explicit refusal.
   - **Layer 2 (Programmatic Citation Verification)**: Post-generation code verifies that cited manual names, sections, page numbers, and supporting quotes exist verbatim in the source chunks.
2. **Cross-Document Disambiguation**:
   - Handles overlapping error codes (e.g., `E101` which exists on both ApexCNC and ThermaPress) by checking a cross-manual registry.
   - If no machine is specified, discloses both meanings side-by-side with citations—never silently guesses.
3. **Conversational Follow-Up Memory**:
   - Retains active machine and error code context across turns. Asking *"and what if that doesn't fix it?"* immediately retrieves secondary diagnostics and replacement part kits without re-specifying the machine.
4. **Layout-Aware PDF Ingestion**:
   - PyMuPDF table detection preserves structured alarm matrices as Markdown tables rather than flattening text into unformatted strings.
5. **Zero External Setup / Offline Ready**:
   - Local ChromaDB vector store + local FastEmbed ONNX embeddings (`bge-small-en-v1.5`) + local FlashRank cross-encoder (`ms-marco-TinyBERT`).
   - Runs 100% offline out-of-the-box with built-in extractive generation, with optional Gemini / OpenAI API key support.

---

## Directory Structure
```
rag-troubleshooting-assistant/
├── ARCHITECTURE.md               # Technical architectural design document
├── README.md                     # Setup and usage guide
├── requirements.txt              # Pinned Python dependencies
├── run.ps1                       # Windows one-command launcher
├── run.sh                        # POSIX one-command launcher
├── demo/
│   ├── sample_outputs.md         # Full verified output logs for all 5 test cases
│   ├── test_cases.py             # Automated test suite
│   ├── browser_test.py           # Playwright UI browser test
│   ├── ui_screenshot.png         # Screenshot of initial Streamlit UI
│   └── ui_response_screenshot.png# Screenshot of live verified UI answer
├── manuals_data/                 # 11-page technical PDF manuals with tables & schematics
│   ├── apexcnc_ultramill_500_manual.pdf
│   └── thermapress_pro_2000_manual.pdf
├── src/
│   ├── config.py                 # Pydantic settings and thresholds
│   ├── generator/
│   │   └── create_manuals.py     # ReportLab generator for 11-page test manuals
│   ├── ingestion/
│   │   ├── pdf_parser.py         # PyMuPDF table and layout extractor
│   │   ├── chunker.py            # Section-aware chunking and code registry
│   │   └── build_index.py        # Knowledge base index builder
│   ├── indexing/
│   │   ├── bm25_index.py         # BM25Okapi keyword search with code tokenization
│   │   ├── vector_store.py       # ChromaDB with FastEmbed ONNX embeddings
│   │   └── hybrid_search.py      # Reciprocal Rank Fusion (RRF)
│   ├── query/
│   │   ├── router.py             # Entity extraction & ambiguity router
│   │   └── session_memory.py     # Multi-turn conversational memory
│   ├── pipeline/
│   │   ├── reranker.py           # FlashRank cross-encoder with code precision tuning
│   │   ├── confidence_gate.py    # Layer 1 retrieval confidence gate
│   │   ├── generator.py          # Structured JSON generator (Gemini / OpenAI / Local)
│   │   ├── verifier.py           # Layer 2 programmatic citation grounding
│   │   └── service.py            # End-to-end orchestrator
│   └── api/
│       ├── schemas.py            # FastAPI Pydantic schemas
│       └── app.py                # FastAPI REST endpoints (/query, /health, /clear-session)
└── ui/
    └── app.py                    # Streamlit factory chat UI
```

---

## Quick Start (One Command)

### Windows
```powershell
.\run.ps1
```

### Linux / macOS
```bash
chmod +x run.sh
./run.sh
```

---

## Manual Step-by-Step Setup

### 1. Environment & Dependencies
```bash
# Using uv (fastest)
uv venv --python 3.11
.venv\Scripts\activate
uv pip install -r requirements.txt

# Or using standard pip
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Generate Demo Manuals & Build Indices
```bash
python -m src.generator.create_manuals
python -m src.ingestion.build_index
```

### 3. Start Backend & Web UI
```bash
# Terminal 1: FastAPI Backend
uvicorn src.api.app:app --host 127.0.0.1 --port 8000

# Terminal 2: Streamlit Web UI
streamlit run ui/app.py --server.port 8501
```
Open **http://localhost:8501** in your browser.

---

## Running the Automated Test Suite
To execute all 5 non-negotiable test cases and update `demo/sample_outputs.md`:
```bash
python -m demo.test_cases
```

To run the live browser UI test with Playwright:
```bash
python -m demo.browser_test
```

# ⚙️ MaintAI – AI Machine Troubleshooting Assistant

MaintAI is a hackathon-ready, RAG-powered industrial troubleshooting web application designed to help factory technicians diagnose machine errors using official PDF manuals.

---

## 🌟 Key Features

1. **📄 PDF Manual Ingestion & Parsing**
   - Upload multiple PDF manuals with metadata (`Machine Name`, `Model`).
   - Text extraction preserving exact page numbers and section headings.
   - Automatic chunking retaining document citations.

2. **🔍 RAG Vector Retrieval System**
   - Vector database indexing (`ChromaDB` / vector engine).
   - High-relevance semantic & keyword document retrieval.

3. **⚠️ Cross-Manual Ambiguity Detection**
   - If an error code (e.g. `E101`) has different meanings across different manuals (e.g., *Motor Overheating* on Atlas Compressor X100 vs *Low Hydraulic Pressure* on Titan Press H200), MaintAI detects the ambiguity and asks the technician to select the target machine.

4. **🛡️ Insufficient Information Refusal**
   - If a query is ungrounded or manuals lack necessary information, MaintAI explicitly refuses to guess and responds:
     > *"I don't have enough information in the available manuals to answer this safely."*

5. **📌 Verified Citations**
   - Every AI response embeds source cards detailing:
     - **Machine Name & Model**
     - **Manual Document Name**
     - **Section Title**
     - **Page Number**
     - **Excerpt Snippet**

---

## 🛠️ Architecture & Tech Stack

- **Frontend**: React, Vite, Tailwind CSS (Industrial dark theme), Lucide Icons.
- **Backend**: Python 3.13, FastAPI, Uvicorn, Pydantic.
- **RAG & AI**: PyMuPDF / PyPDF, ChromaDB, Sentence-Transformers / Cosine Vector Store, Google Gemini API.

---

## 🚀 Quick Start Guide

### Prerequisites
- Python 3.10+
- Node.js v18+

### 1. Start the Backend API Server

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Run FastAPI backend server (Port 8000)
python main.py
```

*Note: On backend startup, MaintAI automatically generates 3 sample PDF manuals (`Atlas Compressor X100`, `Titan Press H200`, `Precision Lathe L300`) and pre-indexes them so you can test immediately without extra setup!*

### 2. Start the Frontend React App

```bash
cd frontend

# Install dependencies
npm install

# Start Vite dev server (Port 3000)
npm run dev
```

Open your browser at **`http://localhost:3000`**.

---

## 🎯 Testing the 4 Demo Scenarios

In the top banner of the chat interface, click any of the **Hackathon Demo** preset buttons or type the questions directly:

### 1. Exact Error-Code Query
- **Prompt**: `"What is E101?"` (Scope: `Atlas Compressor X100`)
- **Expected Result**: Explains **Motor Overheating Fault** (Page 2, Section 3) with step-by-step resolution steps.

### 2. Natural-Language Query
- **Prompt**: `"Why is Atlas Compressor X100 overheating?"`
- **Expected Result**: Pinpoints causes (clogged intake air filter, cooling fan obstruction) with citation cards.

### 3. Cross-Manual Ambiguity
- **Prompt**: `"What does E101 mean?"` (Scope: `All Machines`)
- **Expected Result**: Detects that `E101` exists in both Atlas Compressor X100 (Motor Overheating) and Titan Press H200 (Low Hydraulic Line Pressure) and presents interactive machine selection cards!

### 4. Insufficient Information Refusal
- **Prompt**: `"My machine is not working."`
- **Expected Result**: Returns explicit safety refusal:
  > *"I don't have enough information in the available manuals to answer this safely. Please specify the exact machine name, model, or error code."*

---

## 📁 Project Structure

```
maint-ai/
├── backend/
│   ├── main.py              # FastAPI server endpoints
│   ├── pdf_processor.py     # PDF text & metadata extraction
│   ├── rag_engine.py        # RAG search, ambiguity & refusal logic
│   ├── sample_generator.py # Sample PDF manuals builder
│   ├── test_backend.py      # Automated RAG test script
│   └── requirements.txt     # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatInterface.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── AmbiguityCard.jsx
│   │   │   └── CitationCard.jsx
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── data/                    # Generated PDFs & manuals storage
├── .env.example
└── README.md
```

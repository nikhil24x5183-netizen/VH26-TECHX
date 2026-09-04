import json
import shutil
from pathlib import Path
from src.config import settings
from src.ingestion.pdf_parser import PDFParser
from src.ingestion.chunker import Chunker
from src.indexing.bm25_index import BM25Searcher
from src.indexing.vector_store import ChromaVectorStore

def build_all_indices(rebuild: bool = True):
    print("=" * 60)
    print("Building Hybrid Knowledge Base from Machine Manuals...")
    print("=" * 60)

    manuals_dir = settings.MANUALS_DIR
    pdf_files = list(manuals_dir.glob("*.pdf"))
    if not pdf_files:
        raise FileNotFoundError(f"No PDF manuals found in {manuals_dir}. Run create_manuals.py first.")

    print(f"Found {len(pdf_files)} manuals:")
    for f in pdf_files:
        print(f"  - {f.name}")

    # 1. Parse PDFs
    parser = PDFParser()
    all_units = []
    for pdf_path in pdf_files:
        print(f"Parsing structure from {pdf_path.name}...")
        units = parser.parse_pdf(pdf_path)
        all_units.extend(units)
    print(f"Total extracted document units: {len(all_units)}")

    # 2. Section-Aware Chunking
    chunker = Chunker(max_chunk_chars=2500, overlap_chars=200)
    chunks = chunker.create_chunks(all_units)
    print(f"Generated {len(chunks)} contextual chunks.")

    # 3. Build Metadata Registry & Cross-Document Ambiguity Map
    registry = Chunker.build_metadata_registry(chunks)
    settings.METADATA_REGISTRY_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(settings.METADATA_REGISTRY_PATH, "w", encoding="utf-8") as f:
        json.dump(registry, f, indent=2)
    print(f"Saved metadata registry to {settings.METADATA_REGISTRY_PATH}")
    print(f"Identified ambiguous cross-document codes: {registry['ambiguous_codes']}")

    # 4. Build BM25 Keyword Index
    print("Building BM25 keyword index...")
    bm25_searcher = BM25Searcher()
    bm25_searcher.build_index(chunks)
    bm25_searcher.save(settings.BM25_INDEX_PATH)
    print(f"Saved BM25 index to {settings.BM25_INDEX_PATH}")

    # 5. Build ChromaDB Vector Store
    if rebuild and settings.CHROMA_DIR.exists():
        print(f"Clearing previous ChromaDB directory at {settings.CHROMA_DIR}...")
        try:
            shutil.rmtree(settings.CHROMA_DIR)
        except Exception as e:
            print(f"Note on clearing chroma dir: {e}")

    print("Embedding chunks and building ChromaDB vector store...")
    vector_store = ChromaVectorStore(persist_dir=settings.CHROMA_DIR)
    vector_store.add_chunks(chunks)
    print("Knowledge base indexing complete!")

if __name__ == "__main__":
    build_all_indices(rebuild=True)

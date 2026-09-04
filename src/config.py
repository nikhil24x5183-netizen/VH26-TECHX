import os
from pathlib import Path
from pydantic_settings import BaseSettings

PROJECT_ROOT = Path(__file__).resolve().parent.parent

class Settings(BaseSettings):
    PROJECT_NAME: str = "Factory Floor RAG Troubleshooting Assistant"
    PROJECT_ROOT_PATH: Path = PROJECT_ROOT
    DATA_DIR: Path = PROJECT_ROOT / "data"
    MANUALS_DIR: Path = PROJECT_ROOT / "manuals_data"
    CHROMA_DIR: Path = PROJECT_ROOT / "data" / "chroma_db"
    BM25_INDEX_PATH: Path = PROJECT_ROOT / "data" / "bm25_index.pkl"
    METADATA_REGISTRY_PATH: Path = PROJECT_ROOT / "data" / "metadata_registry.json"

    # Embedding & Reranking Models
    EMBEDDING_MODEL: str = "BAAI/bge-small-en-v1.5"
    RERANKER_MODEL: str = "BAAI/bge-reranker-base"
    
    # Confidence Threshold for Layer 1 Hallucination Control
    # Queries scoring below this skip LLM and trigger refusal
    CONFIDENCE_THRESHOLD: float = 0.38
    
    # Retrieval Tuning
    VECTOR_TOP_K: int = 8
    BM25_TOP_K: int = 8
    FINAL_TOP_K: int = 4
    RRF_K: int = 60

    # API Keys & LLM Provider
    GEMINI_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""
    DEFAULT_LLM_PROVIDER: str = "auto" # "auto", "gemini", "openai", "local"
    
    # Server Ports
    API_PORT: int = 8000
    UI_PORT: int = 8501

    class Config:
        env_file = str(PROJECT_ROOT / ".env")
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()

# Ensure directories exist
settings.DATA_DIR.mkdir(parents=True, exist_ok=True)
settings.MANUALS_DIR.mkdir(parents=True, exist_ok=True)
settings.CHROMA_DIR.mkdir(parents=True, exist_ok=True)

import re
import pickle
from pathlib import Path
from typing import List, Tuple, Optional
from rank_bm25 import BM25Okapi
from src.ingestion.chunker import Chunk

class BM25Searcher:
    """BM25 index specifically optimized for factory floor queries and exact error codes."""

    # Regex token pattern that treats codes like E101, SP-500-BRG, ACM-500 as single tokens
    TOKEN_PATTERN = re.compile(r"\b[A-Za-z0-9]+(?:[-_][A-Za-z0-9]+)*\b")

    def __init__(self):
        self.chunks: List[Chunk] = []
        self.corpus_tokens: List[List[str]] = []
        self.bm25: Optional[BM25Okapi] = None

    def tokenize(self, text: str) -> List[str]:
        tokens = self.TOKEN_PATTERN.findall(text.lower())
        # Also include un-hyphenated variant (e.g. e101 for e-101)
        expanded = []
        for t in tokens:
            expanded.append(t)
            if "-" in t:
                expanded.append(t.replace("-", ""))
        return expanded

    def build_index(self, chunks: List[Chunk]):
        self.chunks = chunks
        self.corpus_tokens = [self.tokenize(c.text) for c in chunks]
        self.bm25 = BM25Okapi(self.corpus_tokens)

    def search(self, query: str, top_k: int = 10, machine_filter: Optional[str] = None) -> List[Tuple[Chunk, float]]:
        if not self.bm25 or not self.chunks:
            return []

        query_tokens = self.tokenize(query)
        if not query_tokens:
            return []

        raw_scores = self.bm25.get_scores(query_tokens)
        
        # Pair with chunks and apply machine filter if specified
        results = []
        for idx, score in enumerate(raw_scores):
            chunk = self.chunks[idx]
            if machine_filter and chunk.machine_name.lower() != machine_filter.lower():
                continue
            
            # Exact error code boost
            exact_code_bonus = 0.0
            query_upper = query.upper()
            for code in chunk.codes_mentioned:
                if code in query_upper:
                    exact_code_bonus += 5.0  # Decisive boost for exact error code presence

            adjusted_score = float(score) + exact_code_bonus
            if adjusted_score > 0.0:
                results.append((chunk, adjusted_score))

        # Sort descending by score
        results.sort(key=lambda x: x[1], reverse=True)
        return results[:top_k]

    def save(self, filepath: Path):
        filepath.parent.mkdir(parents=True, exist_ok=True)
        with open(filepath, "wb") as f:
            pickle.dump({
                "chunks": [c.model_dump() for c in self.chunks],
                "corpus_tokens": self.corpus_tokens,
                "bm25": self.bm25
            }, f)

    @classmethod
    def load(cls, filepath: Path) -> "BM25Searcher":
        instance = cls()
        with open(filepath, "rb") as f:
            data = pickle.load(f)
        instance.chunks = [Chunk(**c) for c in data["chunks"]]
        instance.corpus_tokens = data["corpus_tokens"]
        instance.bm25 = data["bm25"]
        return instance

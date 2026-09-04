from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from src.pipeline.confidence_gate import Citation, TroubleshootingResponse

class QueryRequest(BaseModel):
    query: str
    session_id: Optional[str] = None

class ClearSessionRequest(BaseModel):
    session_id: str

class HealthResponse(BaseModel):
    status: str
    project_name: str
    total_chunks: int
    machines: List[str]
    ambiguous_codes: Dict[str, List[str]]
    confidence_threshold: float
    llm_provider: str

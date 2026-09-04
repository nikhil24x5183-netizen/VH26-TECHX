import uuid
from typing import Dict, Any, Optional, List
from pydantic import BaseModel, Field
from src.pipeline.confidence_gate import TroubleshootingResponse, Citation

class SessionState(BaseModel):
    session_id: str
    active_machine: Optional[str] = None
    active_error_code: Optional[str] = None
    active_issue_summary: Optional[str] = None
    last_escalation_notes: Optional[str] = None
    last_corrective_actions: List[str] = []
    last_citations: List[Citation] = []
    troubleshooting_turn: int = 0
    messages: List[Dict[str, Any]] = []

class SessionManager:
    """Session-level conversation memory store for multi-turn troubleshooting."""

    def __init__(self):
        self.sessions: Dict[str, SessionState] = {}

    def get_or_create_session(self, session_id: Optional[str] = None) -> SessionState:
        if not session_id or session_id not in self.sessions:
            sid = session_id or str(uuid.uuid4())
            self.sessions[sid] = SessionState(session_id=sid)
            return self.sessions[sid]
        return self.sessions[session_id]

    def update_session(
        self,
        session_id: str,
        query: str,
        response: TroubleshootingResponse
    ) -> SessionState:
        session = self.get_or_create_session(session_id)

        # Record user query in conversation history
        session.messages.append({"role": "user", "content": query})

        # Update active context if resolved
        if response.machine_name and response.machine_name != "Multiple Machines":
            session.active_machine = response.machine_name
        
        if response.error_code:
            session.active_error_code = response.error_code

        if response.error_meaning and not response.insufficient_info:
            session.active_issue_summary = response.error_meaning

        if response.escalation_notes:
            session.last_escalation_notes = response.escalation_notes

        if response.corrective_actions:
            session.last_corrective_actions = response.corrective_actions

        if response.citations:
            session.last_citations = response.citations

        session.troubleshooting_turn += 1

        # Record assistant response summary
        session.messages.append({
            "role": "assistant",
            "content": response.error_meaning or response.message or "Response provided",
            "status": response.status,
            "machine": session.active_machine,
            "code": session.active_error_code
        })

        return session

    def clear_session(self, session_id: str) -> SessionState:
        new_session = SessionState(session_id=session_id)
        self.sessions[session_id] = new_session
        return new_session

# Global session manager instance
session_manager = SessionManager()

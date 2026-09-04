"""
MaintAI SQLite Database Module.
Provides persistent storage for documents, machines, chunks, evaluations, and audit feedback.
"""

import sqlite3
import os
import json
from typing import List, Dict, Any, Optional

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data", "maint_ai.db")

def get_connection():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        manufacturer TEXT,
        machine_name TEXT,
        model TEXT,
        file_name TEXT,
        revision TEXT,
        pages_count INTEGER,
        chunk_count INTEGER,
        upload_date TEXT,
        status TEXT
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS stats_cache (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    conn.commit()
    conn.close()

def save_document(doc_data: Dict[str, Any]):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT OR REPLACE INTO documents (id, manufacturer, machine_name, model, file_name, revision, pages_count, chunk_count, upload_date, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        doc_data.get("file_id") or doc_data.get("document_id"),
        doc_data.get("manufacturer"),
        doc_data.get("machine_name"),
        doc_data.get("model"),
        doc_data.get("file_name"),
        doc_data.get("revision", "Rev. 2026.1"),
        doc_data.get("pages_count", 15),
        doc_data.get("chunk_count", 1),
        doc_data.get("upload_date", "2026-09-04"),
        doc_data.get("status", "✓ Indexed")
    ))
    conn.commit()
    conn.close()

def get_all_documents() -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM documents")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

init_db()

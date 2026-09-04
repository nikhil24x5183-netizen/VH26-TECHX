import uuid
import streamlit as st
import httpx

st.set_page_config(
    page_title="Factory Floor RAG Troubleshooting Assistant",
    page_icon="🛠️",
    layout="wide",
    initial_sidebar_state="expanded"
)

API_BASE_URL = "http://127.0.0.1:8000"

# Custom CSS for high-contrast industrial factory UI
st.markdown("""
<style>
    .main-header {
        font-size: 24px;
        font-weight: 700;
        color: #0F172A;
        margin-bottom: 2px;
    }
    .sub-header {
        font-size: 14px;
        color: #475569;
        margin-bottom: 16px;
    }
    .badge-verified {
        background-color: #DCFCE7;
        color: #15803D;
        padding: 3px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: bold;
        border: 1px solid #86EFAC;
        display: inline-block;
    }
    .badge-ambiguous {
        background-color: #FEF3C7;
        color: #B45309;
        padding: 3px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: bold;
        border: 1px solid #FCD34D;
        display: inline-block;
    }
    .badge-refused {
        background-color: #FEE2E2;
        color: #B91C1C;
        padding: 3px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: bold;
        border: 1px solid #FCA5A5;
        display: inline-block;
    }
    .citation-card {
        background-color: #F8FAFC;
        border-left: 4px solid #0284C7;
        padding: 10px 14px;
        border-radius: 4px;
        margin-top: 8px;
        margin-bottom: 6px;
    }
    .citation-title {
        font-weight: bold;
        color: #0369A1;
        font-size: 13px;
    }
    .quote-box {
        font-style: italic;
        color: #334155;
        font-size: 12px;
        background-color: #FFFFFF;
        padding: 6px 10px;
        border-radius: 4px;
        border: 1px solid #E2E8F0;
        margin-top: 4px;
    }
    .escalation-box {
        background-color: #FFFBEB;
        border-left: 4px solid #D97706;
        padding: 10px 14px;
        border-radius: 4px;
        margin-top: 8px;
    }
</style>
""", unsafe_allow_html=True)

# Initialize Session State
if "session_id" not in st.session_state:
    st.session_state.session_id = str(uuid.uuid4())

if "messages" not in st.session_state:
    st.session_state.messages = []

if "active_machine" not in st.session_state:
    st.session_state.active_machine = None

if "active_code" not in st.session_state:
    st.session_state.active_code = None

# Sidebar Controls & Diagnostics
with st.sidebar:
    st.image("https://img.icons8.com/color/96/wrench.png", width=48)
    st.title("System Telemetry")
    
    # Check backend health
    backend_online = False
    health_data = {}
    try:
        r = httpx.get(f"{API_BASE_URL}/api/health", timeout=3.0)
        if r.status_code == 200:
            backend_online = True
            health_data = r.json()
    except Exception:
        backend_online = False

    if backend_online:
        st.success("FastAPI Backend: ONLINE")
        st.caption(f"Knowledge Base: **{health_data.get('total_chunks', 0)} chunks** indexed")
        st.caption(f"LLM Engine: **{health_data.get('llm_provider', 'local')}**")
        st.caption(f"Confidence Gate: **≥ {health_data.get('confidence_threshold', 0.38)}**")
    else:
        st.error("FastAPI Backend: OFFLINE (Port 8000)")

    st.divider()
    st.subheader("Active Session State")
    st.write(f"**Session ID:** `{st.session_state.session_id[:8]}...`")
    st.write(f"**Tracked Machine:** `{st.session_state.active_machine or 'None (Global)'}`")
    st.write(f"**Tracked Error Code:** `{st.session_state.active_code or 'None'}`")
    
    if st.button("🔄 Reset Conversation Session", use_container_width=True):
        try:
            httpx.post(f"{API_BASE_URL}/api/session/clear", json={"session_id": st.session_state.session_id}, timeout=3.0)
        except Exception:
            pass
        st.session_state.session_id = str(uuid.uuid4())
        st.session_state.messages = []
        st.session_state.active_machine = None
        st.session_state.active_code = None
        st.rerun()

    st.divider()
    st.subheader("📤 Upload Custom Manual")
    uploaded_file = st.file_uploader("Upload Manual (PDF, TXT, MD)", type=["pdf", "txt", "md"], key="sidebar_manual_upload")
    custom_mname = st.text_input("Machine Name (Optional)", placeholder="e.g. RoboWeld Pro 3000")
    if uploaded_file is not None and st.button("⚡ Ingest & Index Manual", use_container_width=True):
        with st.spinner("Scanning pages and indexing error codes..."):
            try:
                files = {"file": (uploaded_file.name, uploaded_file.getvalue(), uploaded_file.type or "application/octet-stream")}
                data = {"session_id": st.session_state.session_id}
                if custom_mname.strip():
                    data["machine_name"] = custom_mname.strip()
                up_res = httpx.post(f"{API_BASE_URL}/api/upload", files=files, data=data, timeout=30.0)
                if up_res.status_code == 200:
                    res_data = up_res.json()
                    st.success(f"✓ Ingested {res_data['machine_name']} ({res_data['total_pages']} pages, {res_data['chunks_count']} chunks)")
                    st.session_state.active_machine = res_data['machine_name']
                    if res_data.get('detected_codes'):
                        st.info(f"Detected codes: {', '.join(res_data['detected_codes'])}")
                    st.rerun()
                else:
                    st.error(f"Upload failed: {up_res.text}")
            except Exception as e:
                st.error(f"Upload error: {str(e)}")

    st.divider()
    st.subheader("Verified Test Cases")
    if st.button("1️⃣ Exact Code (E101 Machine A)", use_container_width=True):
        st.session_state.user_query_input = "What does error E101 mean on ApexCNC UltraMill 500?"
    if st.button("2️⃣ Symptom (Overheating Machine B)", use_container_width=True):
        st.session_state.user_query_input = "Why is ThermaPress Pro 2000 overheating?"
    if st.button("3️⃣ Ambiguous Code (E101 No Machine)", use_container_width=True):
        st.session_state.user_query_input = "What does error E101 mean?"
    if st.button("4️⃣ Insufficient Info (Laser Scanner)", use_container_width=True):
        st.session_state.user_query_input = "How do I calibrate the optical laser scanner?"
    if st.button("5️⃣ Follow-up ('what if that doesn't fix it?')", use_container_width=True):
        st.session_state.user_query_input = "and what if that doesn't fix it?"

# Main Chat View
st.markdown('<div class="main-header">Factory Floor Troubleshooting Assistant</div>', unsafe_allow_html=True)
st.markdown('<div class="sub-header">Grounded Technical Retrieval • Cross-Document Disambiguation • Zero Hallucination Safeguards</div>', unsafe_allow_html=True)

# Render Chat History
for msg in st.session_state.messages:
    with st.chat_message(msg["role"]):
        if msg["role"] == "user":
            st.write(msg["content"])
        else:
            resp = msg.get("response_data")
            if not resp:
                st.write(msg.get("content", ""))
                continue

            # Render Status Badge
            status = resp.get("status", "SUCCESS")
            if status == "SUCCESS":
                st.markdown('<span class="badge-verified">✓ VERIFIED GROUNDED CITATION</span>', unsafe_allow_html=True)
            elif status == "AMBIGUOUS_DISCLOSED":
                st.markdown('<span class="badge-ambiguous">⚠ AMBIGUOUS CODE DETECTED</span>', unsafe_allow_html=True)
            else:
                st.markdown('<span class="badge-refused">✕ REFUSED - INSUFFICIENT INFORMATION</span>', unsafe_allow_html=True)

            # Error Meaning Callout
            if resp.get("error_meaning"):
                st.info(f"**Diagnostic Summary:** {resp['error_meaning']}")

            if resp.get("message") and status != "SUCCESS":
                st.warning(resp["message"])

            # Probable Causes
            if resp.get("probable_causes"):
                st.markdown("#### Probable Causes:")
                for cause in resp["probable_causes"]:
                    st.markdown(f"- {cause}")

            # Corrective Actions
            if resp.get("corrective_actions"):
                st.markdown("#### Step-by-Step Corrective Action:")
                for step in resp["corrective_actions"]:
                    st.markdown(f"{step}")

            # Escalation Procedure
            if resp.get("escalation_notes") and status == "SUCCESS":
                st.markdown(f"""
                <div class="escalation-box">
                    <strong>Escalation / Next-Tier Procedure:</strong><br/>
                    {resp['escalation_notes']}
                </div>
                """, unsafe_allow_html=True)

            # Visible Source Citations (Never buried in logs)
            if resp.get("citations"):
                st.markdown("#### Sourced Technical Citations:")
                for cit in resp["citations"]:
                    verified_pill = '<span style="color:#15803D; font-weight:bold;">[Verified Grounding ✓]</span>' if cit.get("verified") else '<span style="color:#B45309; font-weight:bold;">[Unverified]</span>'
                    st.markdown(f"""
                    <div class="citation-card">
                        <div class="citation-title">📖 {cit['manual_name']} — {cit['section']} (Page {cit['page']}) {verified_pill}</div>
                        <div class="quote-box">"{cit['supporting_quote']}"</div>
                    </div>
                    """, unsafe_allow_html=True)

# User Query Input Handling
query_to_submit = None
if "user_query_input" in st.session_state and st.session_state.user_query_input:
    query_to_submit = st.session_state.user_query_input
    st.session_state.user_query_input = None

chat_input = st.chat_input("Ask about an error code, machine symptom, or corrective step...")
if chat_input:
    query_to_submit = chat_input

if query_to_submit:
    # 1. Append user message
    st.session_state.messages.append({"role": "user", "content": query_to_submit})
    
    with st.chat_message("user"):
        st.write(query_to_submit)

    # 2. Call backend API
    with st.chat_message("assistant"):
        with st.spinner("Retrieving manual chunks and validating citations..."):
            try:
                res = httpx.post(
                    f"{API_BASE_URL}/api/query",
                    json={
                        "query": query_to_submit,
                        "session_id": st.session_state.session_id
                    },
                    timeout=20.0
                )
                if res.status_code == 200:
                    resp_data = res.json()
                    
                    # Update local state
                    if resp_data.get("machine_name") and resp_data["machine_name"] != "Multiple Machines":
                        st.session_state.active_machine = resp_data["machine_name"]
                    if resp_data.get("error_code"):
                        st.session_state.active_code = resp_data["error_code"]

                    # Append to messages and rerun for clean render
                    st.session_state.messages.append({
                        "role": "assistant",
                        "response_data": resp_data
                    })
                    st.rerun()
                else:
                    st.error(f"API Error {res.status_code}: {res.text}")
            except Exception as e:
                st.error(f"Connection Error: Could not connect to FastAPI backend at {API_BASE_URL}. Ensure uvicorn is running. Details: {e}")

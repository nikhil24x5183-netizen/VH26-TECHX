import React from 'react';
import { Cpu, FileText, Layers, CheckCircle, Database, Server, RefreshCw, Activity, ShieldCheck } from 'lucide-react';

export default function AdminDashboard({ documents, onReset }) {
  const totalChunks = documents.reduce((acc, d) => acc + d.chunk_count, 0);

  const pipelineSteps = [
    { name: "PDF Upload & Validation", status: "Active", desc: "Magic byte header check & structure validation" },
    { name: "PyMuPDF Text & Layout Extractor", status: "Active", desc: "Page-level extraction & section header detection" },
    { name: "Semantic Overlapping Chunking", status: "Active", desc: "~500 char blocks with 100 char overlap" },
    { name: "Dense Embedding Generator", status: "Active", desc: "384-dim all-MiniLM-L6-v2 sentence embeddings" },
    { name: "ChromaDB / Hybrid Vector Store", status: "Active", desc: "Dense vectors + Sparse BM25 keyword index" }
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-y-auto p-6 space-y-6 select-none">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center">
            <Server size={22} className="mr-2 text-blue-600" /> Admin & Pipeline Diagnostics Dashboard
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Real-time RAG ingestion pipeline metrics, embedding status, and vector index health.
          </p>
        </div>
        <button
          onClick={onReset}
          className="px-6 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs uppercase flex items-center space-x-2 transition shadow-xs"
        >
          <RefreshCw size={14} />
          <span>Re-Initialize Store</span>
        </button>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-extrabold uppercase font-mono tracking-wider">TOTAL MANUALS</span>
            <FileText size={18} className="text-blue-600" />
          </div>
          <div className="text-3xl font-black text-slate-900">{documents.length}</div>
          <div className="text-[11px] font-mono font-bold text-emerald-600 flex items-center">
            <CheckCircle size={12} className="mr-1" /> 100% Ingested
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-extrabold uppercase font-mono tracking-wider">VECTOR CHUNKS</span>
            <Database size={18} className="text-blue-600" />
          </div>
          <div className="text-3xl font-black text-slate-900">{totalChunks}</div>
          <div className="text-[11px] font-mono font-bold text-blue-600">384-Dim Dense Embeddings</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-extrabold uppercase font-mono tracking-wider">EMBEDDING MODEL</span>
            <Activity size={18} className="text-blue-600" />
          </div>
          <div className="text-base font-extrabold text-slate-900 truncate">all-MiniLM-L6-v2</div>
          <div className="text-[11px] font-mono font-bold text-emerald-600">SentenceTransformers Active</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-extrabold uppercase font-mono tracking-wider">REFUSAL CONTROL</span>
            <ShieldCheck size={18} className="text-emerald-600" />
          </div>
          <div className="text-base font-extrabold text-emerald-700">Strict Safety Cutoff</div>
          <div className="text-[11px] font-mono font-bold text-slate-500">Threshold &lt; 0.20 Active</div>
        </div>
      </div>

      {/* Visual Ingestion Pipeline */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 flex items-center">
          <Layers size={16} className="mr-2 text-blue-600" /> Document Ingestion Pipeline Architecture
        </h3>

        <div className="space-y-3">
          {pipelineSteps.map((step, idx) => (
            <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="w-7 h-7 rounded-full bg-blue-600 text-white font-mono font-extrabold text-xs flex items-center justify-center">
                  {idx + 1}
                </span>
                <div>
                  <h4 className="font-extrabold text-xs text-slate-900">{step.name}</h4>
                  <p className="text-[11px] font-mono text-slate-500">{step.desc}</p>
                </div>
              </div>
              <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full text-xs font-mono font-bold flex items-center">
                <CheckCircle size={12} className="mr-1 text-emerald-600" /> {step.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

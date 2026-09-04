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
    <div className="flex-1 flex flex-col h-full bg-[#F7F9FC] overflow-y-auto p-6 space-y-4 select-none">
      {/* Top Banner */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-2xs flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-gray-900 tracking-tight flex items-center">
            <Server size={18} className="mr-2 text-blue-600" /> Admin & Pipeline Diagnostics Dashboard
          </h2>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            Real-time RAG ingestion pipeline metrics, embedding status, and vector index health.
          </p>
        </div>
        <button
          onClick={onReset}
          className="px-4 py-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium text-xs flex items-center space-x-1.5 transition-colors shadow-2xs"
        >
          <RefreshCw size={13} />
          <span>Re-Initialize Store</span>
        </button>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Manuals</span>
            <FileText size={16} className="text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900 font-mono">{documents.length}</div>
          <div className="text-[11px] font-medium text-emerald-600 flex items-center">
            <CheckCircle size={12} className="mr-1" /> 100% Ingested
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Vector Chunks</span>
            <Database size={16} className="text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900 font-mono">{totalChunks}</div>
          <div className="text-[11px] font-mono text-gray-500">384-Dim Dense Embeddings</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Embedding Model</span>
            <Activity size={16} className="text-blue-600" />
          </div>
          <div className="text-sm font-semibold text-gray-900 truncate">all-MiniLM-L6-v2</div>
          <div className="text-[11px] font-medium text-emerald-600">SentenceTransformers Active</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Refusal Control</span>
            <ShieldCheck size={16} className="text-emerald-600" />
          </div>
          <div className="text-sm font-semibold text-emerald-700">Strict Safety Cutoff</div>
          <div className="text-[11px] font-mono text-gray-500">Threshold &lt; 0.20 Active</div>
        </div>
      </div>

      {/* Visual Ingestion Pipeline */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-2xs space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-700 flex items-center">
          <Layers size={15} className="mr-1.5 text-blue-600" /> Document Ingestion Pipeline Architecture
        </h3>

        <div className="space-y-2">
          {pipelineSteps.map((step, idx) => (
            <div key={idx} className="p-3 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="w-6 h-6 rounded-md bg-blue-600 text-white font-mono font-bold text-xs flex items-center justify-center">
                  {idx + 1}
                </span>
                <div>
                  <h4 className="font-semibold text-xs text-gray-900">{step.name}</h4>
                  <p className="text-[11px] text-gray-500 font-mono">{step.desc}</p>
                </div>
              </div>
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded text-[11px] font-semibold flex items-center">
                <CheckCircle size={12} className="mr-1 text-emerald-600" /> {step.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


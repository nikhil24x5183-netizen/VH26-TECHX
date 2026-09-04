import React from 'react';
import { X, HelpCircle, ShieldCheck, Layers, BookOpen, Cpu } from 'lucide-react';

export default function WhyThisAnswerModal({ message, onClose }) {
  if (!message || !message.citations) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl relative border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center font-bold">
              <HelpCircle size={22} />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight">Why This Answer?</h2>
              <p className="text-xs text-slate-500 font-mono font-medium">Explainability & RAG Retrieval Audit Log</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl font-bold p-1">
            <X size={20} />
          </button>
        </div>

        {/* Explainability Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs text-slate-700">
          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100 space-y-2">
            <div className="font-extrabold text-blue-900 flex items-center">
              <ShieldCheck size={16} className="mr-1.5 text-blue-600" />
              Retrieval & Evidence Evaluation
            </div>
            <p className="leading-relaxed">
              MaintAI matched your question against indexed manufacturer manual chunks using <strong>Hybrid Vector Search + Sparse Keyword Reranking</strong>.
            </p>
            {message.confidence_score && (
              <div className="pt-1 flex items-center space-x-2 font-mono font-bold text-blue-800">
                <span>Calculated Relevance Score:</span>
                <span className="bg-blue-600 text-white px-2 py-0.5 rounded-full text-[11px]">
                  {Math.round(message.confidence_score * 100)}% ({message.confidence_label})
                </span>
              </div>
            )}
          </div>

          {/* Retrieved Excerpts Breakdown */}
          <div className="space-y-3">
            <div className="font-extrabold text-slate-900 uppercase tracking-wider text-[11px] flex items-center">
              <BookOpen size={14} className="mr-1 text-blue-600" /> Matches Found ({message.citations.length} sources)
            </div>
            {message.citations.map((cit, idx) => (
              <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between font-bold text-slate-900">
                  <span className="flex items-center">
                    <Cpu size={14} className="mr-1.5 text-blue-600" /> {cit.machine_name} ({cit.model})
                  </span>
                  <span className="font-mono text-[11px] bg-slate-200 px-2 py-0.5 rounded text-slate-700">
                    Page {cit.page_number}
                  </span>
                </div>
                <div className="text-[11px] font-mono text-slate-500">{cit.file_name} • {cit.section}</div>
                <div className="p-2.5 rounded-xl bg-white border border-slate-200 font-mono text-xs text-slate-800 mt-2">
                  "{cit.snippet}"
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-full bg-blue-600 text-white font-extrabold text-xs uppercase shadow-md shadow-blue-600/30"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}

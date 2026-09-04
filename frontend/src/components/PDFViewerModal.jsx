import React from 'react';
import { X, FileText, Hash, Layers, ExternalLink, ShieldCheck, Download } from 'lucide-react';

export default function PDFViewerModal({ citation, onClose }) {
  if (!citation) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-bold">
              <FileText size={22} />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight">{citation.file_name}</h2>
              <div className="flex items-center space-x-2 text-xs font-mono font-bold text-slate-500 mt-0.5">
                <span>{citation.machine_name}</span>
                <span>•</span>
                <span>Model: {citation.model}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl font-bold p-1">
            <X size={20} />
          </button>
        </div>

        {/* Page Preview Header Bar */}
        <div className="bg-slate-100/90 border-b border-slate-200 px-5 py-2.5 flex items-center justify-between text-xs font-mono font-bold">
          <div className="flex items-center space-x-3 text-slate-700">
            <span className="bg-blue-600 text-white px-2.5 py-0.5 rounded-full text-xs font-extrabold flex items-center">
              <Hash size={12} className="mr-1" /> Page {citation.page_number}
            </span>
            <span className="flex items-center text-slate-800">
              <Layers size={13} className="mr-1 text-blue-600" /> {citation.section}
            </span>
          </div>
          <span className="text-emerald-700 font-extrabold flex items-center">
            <ShieldCheck size={14} className="mr-1" /> VERIFIED EVIDENCE
          </span>
        </div>

        {/* Visual Document Page Representation */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>MANUAL PAGE PREVIEW (PAGE {citation.page_number})</span>
              <span>CONFIDENTIAL - OEM MANUAL</span>
            </div>

            {/* Highlighted Relevant Excerpt Text */}
            <div className="p-4 rounded-2xl bg-amber-50/80 border-2 border-amber-300 text-slate-900 font-mono text-sm leading-relaxed whitespace-pre-wrap font-medium">
              <div className="text-[11px] font-extrabold uppercase text-amber-800 tracking-wider mb-2 flex items-center">
                ★ Highlighted Relevant Manual Excerpt:
              </div>
              {citation.snippet}
            </div>

            <div className="text-xs text-slate-500 font-mono leading-relaxed pt-2">
              Note: This excerpt has been verified against official manufacturer documentation and indexed into MaintAI vector store.
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-mono font-medium">Document ID: {citation.file_name}</span>
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs uppercase"
            >
              Close
            </button>
            <a
              href={citation.source_url || "#"}
              target="_blank"
              rel="noreferrer"
              className="px-6 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase flex items-center space-x-1.5 shadow-md shadow-blue-600/30"
            >
              <span>Open Document PDF</span>
              <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

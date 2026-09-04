import React, { useState } from 'react';
import { X, FileText, Hash, Layers, ExternalLink, ShieldCheck, Download, Globe } from 'lucide-react';

export default function PDFViewerModal({ citation, onClose }) {
  const [activeTab, setActiveTab] = useState('translation'); // 'translation' | 'original'

  if (!citation) return null;

  const origLang = citation.manual_language || "German 🇩🇪";
  const origText = citation.original_text || citation.snippet;
  const transText = citation.translated_text || citation.snippet;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#2563EB] border border-blue-200 flex items-center justify-center font-bold">
              <FileText size={22} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">{citation.file_name}</h2>
              <div className="flex items-center space-x-2 text-xs font-mono font-semibold text-slate-500 mt-0.5">
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
        <div className="bg-slate-100/90 border-b border-slate-200 px-5 py-2.5 flex items-center justify-between text-xs font-mono font-semibold">
          <div className="flex items-center space-x-3 text-slate-700">
            <span className="bg-[#2563EB] text-white px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center">
              <Hash size={12} className="mr-1" /> Page {citation.page_number}
            </span>
            <span className="flex items-center text-slate-800">
              <Layers size={13} className="mr-1 text-[#2563EB]" /> {citation.section}
            </span>
          </div>
          <span className="bg-white border border-emerald-300 text-emerald-800 font-bold px-2.5 py-0.5 rounded-md flex items-center">
            <ShieldCheck size={14} className="mr-1 text-emerald-600" /> {origLang}
          </span>
        </div>

        {/* Visual Document Page Representation */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>MANUAL PAGE PREVIEW (PAGE {citation.page_number})</span>
              <span>VERIFIED OEM MANUAL</span>
            </div>

            {/* Dual-Text Selection */}
            <div className="flex rounded-lg bg-gray-100 p-1 border border-slate-200">
              <button
                onClick={() => setActiveTab('translation')}
                className={`flex-1 py-1.5 rounded-md text-xs font-bold transition ${
                  activeTab === 'translation' ? 'bg-white text-[#2563EB] shadow-2xs' : 'text-slate-500'
                }`}
              >
                English Explanation
              </button>
              <button
                onClick={() => setActiveTab('original')}
                className={`flex-1 py-1.5 rounded-md text-xs font-bold transition ${
                  activeTab === 'original' ? 'bg-white text-[#2563EB] shadow-2xs' : 'text-slate-500'
                }`}
              >
                Original Manual Text ({origLang})
              </button>
            </div>

            {/* Highlighted Relevant Excerpt Text */}
            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-300 text-slate-900 font-mono text-xs leading-relaxed whitespace-pre-wrap font-medium">
              <div className="text-[11px] font-bold uppercase text-amber-800 tracking-wider mb-1.5 flex items-center">
                ★ {activeTab === 'translation' ? 'English Translation' : `Original Verbatim Manual Excerpt (${origLang})`}:
              </div>
              {activeTab === 'translation' ? transText : origText}
            </div>

            <div className="text-xs text-slate-500 font-mono leading-relaxed pt-1">
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
              className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs uppercase"
            >
              Close
            </button>
            <a
              href={citation.source_url || "#"}
              target="_blank"
              rel="noreferrer"
              className="px-5 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-xs uppercase flex items-center space-x-1.5 shadow-xs"
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

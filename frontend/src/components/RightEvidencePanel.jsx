import React, { useState } from 'react';
import { X, FileText, ExternalLink, ShieldCheck, Globe, Languages } from 'lucide-react';

export default function RightEvidencePanel({ citation, onClose, onOpenPdf }) {
  const [activeTab, setActiveTab] = useState('english'); // 'english' | 'original'

  if (!citation) return null;

  const originalLang = citation.manual_language || "German 🇩🇪";
  const origText = citation.original_text || citation.snippet;
  const transText = citation.translated_text || citation.snippet;

  return (
    <div className="fixed inset-0 z-50 bg-gray-900/20 backdrop-blur-xs flex justify-end">
      <aside className="w-96 bg-white border-l border-[#E5E7EB] flex flex-col h-full shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Panel Header */}
        <div className="p-4 border-b border-[#E5E7EB] flex items-center justify-between bg-white">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-md bg-blue-50 text-[#2563EB] flex items-center justify-center font-bold">
              <FileText size={16} />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#111827]">Source Evidence</h3>
              <p className="text-[11px] text-[#64748B]">Verified Multilingual Manual Excerpt</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
            title="Close Panel"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* Grounded Verification & Language Badge */}
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between space-x-2">
            <div className="flex items-center space-x-2">
              <ShieldCheck size={18} className="text-emerald-600 shrink-0" />
              <div>
                <div className="font-bold text-xs text-emerald-900">100% Grounded Evidence</div>
                <div className="text-[11px] text-emerald-700">Multilingual indexing active</div>
              </div>
            </div>
            <span className="bg-white border border-emerald-300 text-emerald-900 font-bold px-2 py-0.5 rounded text-[11px] font-mono shrink-0 shadow-2xs">
              {originalLang}
            </span>
          </div>

          {/* Manual Metadata Card */}
          <div className="p-4 rounded-xl bg-gray-50 border border-[#E5E7EB] space-y-3">
            <div>
              <span className="text-[10px] font-semibold uppercase text-[#64748B] tracking-wider block mb-0.5">Manual Document</span>
              <div className="font-semibold text-[#111827] text-xs font-mono truncate">{citation.file_name}</div>
            </div>

            <div className="grid grid-cols-2 gap-3 border-t border-gray-200/80 pt-3">
              <div>
                <span className="text-[10px] text-[#64748B] font-semibold uppercase tracking-wider block mb-0.5">Machine</span>
                <div className="font-medium text-[#111827] truncate">{citation.machine_name}</div>
              </div>
              <div>
                <span className="text-[10px] text-[#64748B] font-semibold uppercase tracking-wider block mb-0.5">Page</span>
                <div className="font-bold text-[#2563EB] font-mono text-sm">Page {citation.page_number}</div>
              </div>
            </div>
          </div>

          {/* Dual-Text Tab Control */}
          <div className="flex rounded-lg bg-gray-100 p-1 border border-[#E5E7EB]">
            <button
              onClick={() => setActiveTab('english')}
              className={`flex-1 py-1.5 rounded-md text-xs font-bold transition ${
                activeTab === 'english'
                  ? 'bg-white text-[#2563EB] shadow-2xs'
                  : 'text-[#64748B] hover:text-[#111827]'
              }`}
            >
              English Explanation
            </button>
            <button
              onClick={() => setActiveTab('original')}
              className={`flex-1 py-1.5 rounded-md text-xs font-bold transition ${
                activeTab === 'original'
                  ? 'bg-white text-[#2563EB] shadow-2xs'
                  : 'text-[#64748B] hover:text-[#111827]'
              }`}
            >
              Original ({originalLang.split(' ')[0]})
            </button>
          </div>

          {/* Excerpt Display */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-semibold uppercase text-[#64748B] tracking-wider block">
              {activeTab === 'english' ? 'English Translation' : `Original Verbatim Manual Text (${originalLang})`}
            </span>
            <div className="p-4 rounded-xl bg-gray-50 border border-[#E5E7EB] font-mono text-[12px] text-gray-800 leading-relaxed whitespace-pre-wrap">
              "{activeTab === 'english' ? transText : origText}"
            </div>
          </div>
        </div>

        {/* Footer Action CTA */}
        <div className="p-4 border-t border-[#E5E7EB] bg-white">
          <button
            onClick={() => onOpenPdf(citation)}
            className="w-full py-2.5 px-4 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white font-medium text-sm flex items-center justify-center space-x-2 transition-colors cursor-pointer shadow-xs"
          >
            <ExternalLink size={16} />
            <span>Open PDF Viewer (Page {citation.page_number})</span>
          </button>
        </div>
      </aside>
    </div>
  );
}

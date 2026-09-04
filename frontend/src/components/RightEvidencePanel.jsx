import React from 'react';
import { X, FileText, ExternalLink, ShieldCheck, BookOpen } from 'lucide-react';

export default function RightEvidencePanel({ citation, onClose, onOpenPdf }) {
  if (!citation) return null;

  return (
    <div className="fixed inset-0 z-50 bg-gray-900/20 backdrop-blur-xs flex justify-end">
      <aside className="w-96 bg-white border-l border-[#E5E7EB] flex flex-col h-full shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Panel Header */}
        <div className="p-4 border-b border-[#E5E7EB] flex items-center justify-between bg-white">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-md bg-blue-50 text-[#2563EB] flex items-center justify-center">
              <FileText size={16} />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#111827]">Source Evidence</h3>
              <p className="text-[11px] text-[#64748B]">Verified Manual Excerpt</p>
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
          {/* Grounded Verification Badge */}
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center space-x-2.5">
            <ShieldCheck size={18} className="text-emerald-600 shrink-0" />
            <div>
              <div className="font-bold text-xs text-emerald-900">100% Grounded Manual Evidence</div>
              <div className="text-[11px] text-emerald-700">Matched via hybrid dense vector & BM25 search</div>
            </div>
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

          {/* Section Header */}
          {citation.section && (
            <div className="space-y-1">
              <span className="text-[10px] font-semibold uppercase text-[#64748B] tracking-wider block">Section</span>
              <div className="p-3 rounded-lg bg-blue-50/60 border border-blue-100 font-semibold text-[#111827] text-xs">
                {citation.section}
              </div>
            </div>
          )}

          {/* Verbatim Excerpt */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-semibold uppercase text-[#64748B] tracking-wider block">
              Relevant Excerpt
            </span>
            <div className="p-4 rounded-xl bg-gray-50 border border-[#E5E7EB] font-mono text-[12px] text-gray-800 leading-relaxed whitespace-pre-wrap">
              "{citation.snippet}"
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

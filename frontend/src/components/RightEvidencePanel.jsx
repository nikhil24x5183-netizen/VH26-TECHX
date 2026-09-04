import React from 'react';
import { X, FileText, ExternalLink, Layers, CheckCircle, ShieldCheck, Cpu } from 'lucide-react';

export default function RightEvidencePanel({ citation, onClose, onOpenPdf }) {
  if (!citation) return null;

  return (
    <aside className="w-80 bg-white border-l border-gray-200 flex flex-col h-full select-none shrink-0 shadow-xs z-30 transition-all">
      {/* Panel Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FileText size={16} className="text-blue-600" />
          <h3 className="font-bold text-sm text-gray-900 tracking-tight">Source Evidence</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          title="Close Panel"
        >
          <X size={16} />
        </button>
      </div>

      {/* Content Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* Verification Pill */}
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center space-x-2">
          <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
          <span className="font-semibold text-[11px]">100% Grounded Manual Citation</span>
        </div>

        {/* Manual Metadata Card */}
        <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 space-y-2.5">
          <div>
            <span className="text-[10px] font-semibold uppercase text-gray-400">Manual Title</span>
            <div className="font-semibold text-gray-900 font-mono text-xs mt-0.5 truncate">{citation.file_name}</div>
          </div>

          <div className="grid grid-cols-2 gap-2 border-t border-gray-200/60 pt-2 text-[11px]">
            <div>
              <span className="text-[10px] text-gray-400 font-semibold uppercase">Machine</span>
              <div className="font-semibold text-gray-900 truncate">{citation.machine_name}</div>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 font-semibold uppercase">Model</span>
              <div className="font-mono text-gray-700 truncate">{citation.model || 'Standard'}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 border-t border-gray-200/60 pt-2 text-[11px]">
            <div>
              <span className="text-[10px] text-gray-400 font-semibold uppercase">Page Number</span>
              <div className="font-mono font-bold text-blue-700">Page {citation.page_number}</div>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 font-semibold uppercase">Revision</span>
              <div className="font-mono text-gray-600">Rev. 2026.1</div>
            </div>
          </div>
        </div>

        {/* Section Header */}
        <div className="space-y-1">
          <div className="text-[10px] font-semibold uppercase text-gray-400 tracking-wider flex items-center">
            <Layers size={13} className="mr-1 text-blue-600" /> Section Header
          </div>
          <div className="p-2.5 rounded-lg bg-blue-50/50 border border-blue-100 font-semibold text-blue-900">
            {citation.section || 'General Troubleshooting'}
          </div>
        </div>

        {/* Verbatim Excerpt Snippet */}
        <div className="space-y-1">
          <div className="text-[10px] font-semibold uppercase text-gray-400 tracking-wider">
            Relevant Manual Excerpt
          </div>
          <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 font-mono text-[11px] text-gray-800 leading-relaxed whitespace-pre-wrap">
            "{citation.snippet}"
          </div>
        </div>
      </div>

      {/* Footer Action CTA */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <button
          onClick={() => onOpenPdf(citation)}
          className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs flex items-center justify-center space-x-1.5 transition-colors shadow-2xs"
        >
          <ExternalLink size={14} />
          <span>Open Full PDF Viewer</span>
        </button>
      </div>
    </aside>
  );
}

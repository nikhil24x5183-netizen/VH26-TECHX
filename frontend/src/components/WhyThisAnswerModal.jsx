import React from 'react';
import { X, HelpCircle, FileText } from 'lucide-react';

export default function WhyThisAnswerModal({ message, onClose }) {
  if (!message) return null;

  const audit = message.audit_trail || {};
  const score = message.confidence_score ? Math.round(message.confidence_score * 100) : 85;
  const citation = message.citations && message.citations[0] ? message.citations[0] : null;

  return (
    <div className="fixed inset-0 z-50 bg-gray-900/30 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-[#E5E7EB] rounded-xl max-w-lg w-full p-6 shadow-2xl relative space-y-4">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#2563EB] flex items-center justify-center font-bold">
              <HelpCircle size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#111827]">Why this answer?</h2>
              <p className="text-xs text-[#64748B]">Evidence Retrieval Audit Log</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Audit Details */}
        <div className="space-y-3 text-xs">
          <div className="p-3.5 rounded-xl bg-gray-50 border border-[#E5E7EB] space-y-2">
            <div>
              <span className="text-[10px] font-semibold uppercase text-[#64748B] block">User Query</span>
              <div className="font-semibold text-[#111827]">{audit.user_query || message.text?.slice(0, 80)}</div>
            </div>

            {audit.extracted_code && (
              <div>
                <span className="text-[10px] font-semibold uppercase text-[#64748B] block">Extracted Error Code</span>
                <div className="font-mono font-bold text-[#2563EB] text-sm">{audit.extracted_code}</div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-gray-50 border border-[#E5E7EB] space-y-1">
              <span className="text-[10px] font-semibold uppercase text-[#64748B] block">Retrieval Method</span>
              <div className="font-semibold text-[#2563EB]">{audit.match_type || citation?.match_type || "Exact Index / Vector"}</div>
            </div>

            <div className="p-3 rounded-xl bg-gray-50 border border-[#E5E7EB] space-y-1">
              <span className="text-[10px] font-semibold uppercase text-[#64748B] block">Calculated Confidence</span>
              <div className="font-mono font-bold text-emerald-600 text-sm">{score}% ({message.confidence_label || "High"})</div>
            </div>
          </div>

          {citation && (
            <div className="p-3.5 rounded-xl bg-blue-50/50 border border-blue-100 space-y-2">
              <div className="flex items-center space-x-2 text-[#2563EB] font-bold text-xs">
                <FileText size={15} />
                <span>Source Document & Page</span>
              </div>
              <div className="text-xs text-[#111827] space-y-0.5 font-medium">
                <div>Document: <strong>{citation.file_name}</strong></div>
                <div>Machine: <strong>{citation.machine_name} ({citation.model})</strong></div>
                <div>Section: <strong>{citation.section}</strong></div>
                <div>Page: <strong className="text-[#2563EB] font-mono">Page {citation.page_number}</strong></div>
              </div>
            </div>
          )}

          {/* Excerpt */}
          {citation && (
            <div className="space-y-1">
              <span className="text-[10px] font-semibold uppercase text-[#64748B] block">Retrieved Excerpt</span>
              <div className="p-3 rounded-xl bg-gray-50 border border-[#E5E7EB] font-mono text-[11px] text-gray-700 leading-relaxed max-h-32 overflow-y-auto">
                "{citation.snippet}"
              </div>
            </div>
          )}
        </div>

        <div className="pt-2 flex items-center justify-end border-t border-[#E5E7EB]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-xs cursor-pointer shadow-xs"
          >
            Close Audit Log
          </button>
        </div>
      </div>
    </div>
  );
}

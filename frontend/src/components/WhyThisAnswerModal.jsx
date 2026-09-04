import React, { useState } from 'react';
import { X, HelpCircle, FileText, Globe, Languages } from 'lucide-react';

export default function WhyThisAnswerModal({ message, onClose }) {
  const [activeTab, setActiveTab] = useState('translation'); // 'translation' | 'original'

  if (!message) return null;

  const audit = message.audit_trail || {};
  const score = message.confidence_score ? Math.round(message.confidence_score * 100) : 85;
  const citation = message.citations && message.citations[0] ? message.citations[0] : null;

  const origLang = citation?.manual_language || "German 🇩🇪";
  const origText = citation?.original_text || citation?.snippet;
  const transText = citation?.translated_text || citation?.snippet;

  return (
    <div className="fixed inset-0 z-50 bg-gray-900/30 backdrop-blur-xs flex items-center justify-center p-4 font-sans">
      <div className="bg-white border border-[#E5E7EB] rounded-2xl max-w-lg w-full p-6 shadow-2xl relative space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#2563EB] flex items-center justify-center font-bold">
              <HelpCircle size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#111827]">Why this answer?</h2>
              <p className="text-xs text-[#64748B]">Multilingual Evidence Audit Log</p>
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
              <span className="text-[10px] font-semibold uppercase text-[#64748B] block mb-0.5">User Query</span>
              <div className="font-semibold text-[#111827]">{audit.user_query || message.text?.slice(0, 80)}</div>
            </div>

            {audit.extracted_code && (
              <div>
                <span className="text-[10px] font-semibold uppercase text-[#64748B] block mb-0.5">Extracted Error Code</span>
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
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-[#2563EB] font-bold text-xs">
                  <FileText size={15} />
                  <span>Source Document & Page</span>
                </div>
                <span className="bg-white border border-blue-200 text-[#2563EB] font-bold px-2 py-0.5 rounded text-[10px] font-mono shadow-2xs">
                  {origLang}
                </span>
              </div>
              <div className="text-xs text-[#111827] space-y-0.5 font-medium">
                <div>Document: <strong>{citation.file_name}</strong></div>
                <div>Machine: <strong>{citation.machine_name} ({citation.model})</strong></div>
                <div>Section: <strong>{citation.section}</strong></div>
                <div>Page: <strong className="text-[#2563EB] font-mono">Page {citation.page_number}</strong></div>
              </div>
            </div>
          )}

          {/* Dual Excerpt View */}
          {citation && (
            <div className="space-y-2">
              <div className="flex rounded-lg bg-gray-100 p-1 border border-[#E5E7EB]">
                <button
                  onClick={() => setActiveTab('translation')}
                  className={`flex-1 py-1 rounded-md text-[11px] font-bold transition ${
                    activeTab === 'translation' ? 'bg-white text-[#2563EB] shadow-2xs' : 'text-[#64748B]'
                  }`}
                >
                  English Explanation
                </button>
                <button
                  onClick={() => setActiveTab('original')}
                  className={`flex-1 py-1 rounded-md text-[11px] font-bold transition ${
                    activeTab === 'original' ? 'bg-white text-[#2563EB] shadow-2xs' : 'text-[#64748B]'
                  }`}
                >
                  Original Manual Evidence ({origLang})
                </button>
              </div>

              <div className="p-3 rounded-xl bg-gray-50 border border-[#E5E7EB] font-mono text-[11px] text-gray-800 leading-relaxed max-h-36 overflow-y-auto whitespace-pre-wrap">
                "{activeTab === 'translation' ? transText : origText}"
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

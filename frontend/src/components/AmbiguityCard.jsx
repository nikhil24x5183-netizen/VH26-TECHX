import React from 'react';
import { HelpCircle, ArrowRight } from 'lucide-react';

export default function AmbiguityCard({ ambiguity, onSelectMachine }) {
  if (!ambiguity) return null;

  const candidates = ambiguity.candidates || [];
  const code = ambiguity.error_code || 'Fault';

  return (
    <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 text-[#111827] space-y-3 my-2">
      <div className="flex items-center space-x-2 text-sm font-bold text-[#2563EB]">
        <HelpCircle size={18} />
        <span>{code} found in {candidates.length} machines</span>
      </div>

      <p className="text-xs text-[#64748B] font-medium">
        Select which machine you are repairing to get exact manual evidence:
      </p>

      <div className="flex flex-wrap gap-2 pt-1">
        {candidates.map((machineName, idx) => (
          <button
            key={idx}
            onClick={() => onSelectMachine(machineName)}
            className="px-4 py-2 rounded-lg bg-white border border-[#2563EB] hover:bg-[#2563EB] text-[#2563EB] hover:text-white font-semibold text-xs transition-colors shadow-xs cursor-pointer flex items-center space-x-1.5"
          >
            <span>{machineName}</span>
            <ArrowRight size={14} />
          </button>
        ))}
      </div>
    </div>
  );
}

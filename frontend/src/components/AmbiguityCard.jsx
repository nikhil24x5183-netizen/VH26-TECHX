import React from 'react';
import { AlertTriangle, ChevronRight, Cpu } from 'lucide-react';

export default function AmbiguityCard({ ambiguity, onSelectMachine }) {
  if (!ambiguity) return null;

  return (
    <div className="my-2 p-3.5 rounded-lg border border-amber-200 bg-amber-50/40">
      <div className="flex items-center space-x-2 mb-2.5">
        <AlertTriangle size={16} className="text-amber-600 shrink-0" />
        <h4 className="text-xs font-semibold text-amber-900 flex items-center">
          Ambiguous Error Code: <span className="font-mono text-amber-950 bg-amber-100 px-1.5 py-0.5 rounded ml-1.5">{ambiguity.query_term}</span>
        </h4>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {ambiguity.candidates.map((cand, idx) => (
          <button
            key={idx}
            onClick={() => onSelectMachine(cand.machine_name)}
            className="group text-left p-3 rounded-lg border border-gray-200 bg-white hover:border-blue-500 transition-colors shadow-2xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-gray-900 group-hover:text-blue-600 flex items-center">
                  <Cpu size={14} className="mr-1 text-blue-600" />
                  {cand.machine_name}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                  {cand.model}
                </span>
              </div>
              <p className="text-[11px] text-gray-600 mt-1.5 line-clamp-2 italic font-mono bg-gray-50 p-1.5 rounded">
                "{cand.preview}"
              </p>
            </div>
            <div className="mt-2 flex items-center justify-end text-[11px] font-medium text-blue-600">
              Select Machine <ChevronRight size={13} className="ml-0.5" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}


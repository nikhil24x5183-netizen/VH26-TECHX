import React from 'react';
import { AlertTriangle, ChevronRight, Cpu } from 'lucide-react';

export default function AmbiguityCard({ ambiguity, onSelectMachine }) {
  if (!ambiguity) return null;

  return (
    <div className="my-3 p-4 rounded-xl border border-amber-200 bg-amber-50/50 shadow-xs">
      <div className="flex items-center space-x-2.5 mb-3">
        <AlertTriangle size={18} className="text-amber-600 shrink-0" />
        <h4 className="text-xs font-bold text-amber-900 flex items-center">
          AMBIGUOUS TERM: <span className="font-mono text-amber-950 bg-amber-200/60 px-2 py-0.5 rounded ml-1.5">{ambiguity.query_term}</span>
        </h4>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {ambiguity.candidates.map((cand, idx) => (
          <button
            key={idx}
            onClick={() => onSelectMachine(cand.machine_name)}
            className="group text-left p-3 rounded-xl border border-slate-200 bg-white hover:border-blue-500 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900 group-hover:text-blue-600 flex items-center">
                  <Cpu size={14} className="mr-1.5 text-blue-600" />
                  {cand.machine_name}
                </span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                  {cand.model}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mt-2 line-clamp-2 italic font-mono bg-slate-50 p-2 rounded-md">
                "{cand.preview}"
              </p>
            </div>
            <div className="mt-3 flex items-center justify-end text-[11px] font-bold text-blue-600 group-hover:translate-x-0.5 transition-transform">
              Select Machine <ChevronRight size={14} className="ml-0.5" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

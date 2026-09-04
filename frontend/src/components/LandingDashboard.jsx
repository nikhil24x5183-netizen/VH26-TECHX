import React from 'react';
import { ShieldCheck, BookOpen, Cpu, Sparkles, Activity, FileText } from 'lucide-react';

export default function LandingDashboard({ stats, onStartChat, onOpenLibrary, onOpenAdmin, onOpenEval }) {
  const manuals = stats ? stats.manuals_count : null;
  const pages = stats ? stats.pages_count : null;
  const chunks = stats ? stats.chunks_count : null;
  const accuracy = stats ? stats.accuracy_score : null;

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-3.5 shadow-2xs">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold uppercase text-blue-600 tracking-wider">Industrial AI Troubleshooting</span>
            <span className="text-gray-300">•</span>
            <span className="text-xs text-gray-500 font-medium">Grounded RAG System</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mt-0.5">
            Troubleshoot Machines with Verified Manual Evidence
          </h1>
        </div>

        {/* Interactive Visual Metric Cards (Zero Hardcoded Stats) */}
        <div className="grid grid-cols-4 gap-3 shrink-0">
          <button
            onClick={onOpenLibrary}
            className="px-4 py-2 rounded-xl bg-white hover:bg-blue-50/50 border border-gray-200 hover:border-blue-300 shadow-2xs text-center min-w-[100px] transition-all cursor-pointer group"
            title="Click to view Manual Library"
          >
            <div className="text-xl font-bold text-gray-900 group-hover:text-blue-600 font-mono">
              {manuals !== null && manuals > 0 ? manuals : "—"}
            </div>
            <div className="text-xs text-gray-500 group-hover:text-blue-700 font-medium">Indexed Manuals</div>
          </button>
          <button
            onClick={onOpenLibrary}
            className="px-4 py-2 rounded-xl bg-white hover:bg-blue-50/50 border border-gray-200 hover:border-blue-300 shadow-2xs text-center min-w-[100px] transition-all cursor-pointer group"
            title="Click to view Manual Library"
          >
            <div className="text-xl font-bold text-blue-600 font-mono">
              {pages !== null && pages > 0 ? pages : "—"}
            </div>
            <div className="text-xs text-gray-500 group-hover:text-blue-700 font-medium">Indexed Pages</div>
          </button>
          <button
            onClick={onOpenAdmin}
            className="px-4 py-2 rounded-xl bg-white hover:bg-emerald-50/50 border border-gray-200 hover:border-emerald-300 shadow-2xs text-center min-w-[100px] transition-all cursor-pointer group"
            title="Click to view Admin Pipeline"
          >
            <div className="text-xl font-bold text-emerald-600 font-mono">
              {chunks !== null && chunks > 0 ? chunks : "—"}
            </div>
            <div className="text-xs text-gray-500 group-hover:text-emerald-700 font-medium">Knowledge Chunks</div>
          </button>
          <button
            onClick={onOpenEval}
            className="px-4 py-2 rounded-xl bg-white hover:bg-amber-50/50 border border-gray-200 hover:border-amber-300 shadow-2xs text-center min-w-[100px] transition-all cursor-pointer group"
            title="Click to view Judge Evaluation"
          >
            <div className="text-xl font-bold text-amber-600 font-mono">
              {accuracy !== null && accuracy > 0 ? `${accuracy}%` : "—"}
            </div>
            <div className="text-xs text-gray-500 group-hover:text-amber-700 font-medium">RAG Verification</div>
          </button>
        </div>
      </div>
    </div>
  );
}

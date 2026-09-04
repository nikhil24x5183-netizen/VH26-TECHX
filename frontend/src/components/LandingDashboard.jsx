import React from 'react';
import { ShieldCheck, BookOpen, Cpu, Sparkles, Activity, FileText } from 'lucide-react';

export default function LandingDashboard({ stats, onStartChat, onOpenLibrary }) {
  const manuals = stats ? stats.manuals_count : null;
  const pages = stats ? stats.pages_count : null;
  const chunks = stats ? stats.chunks_count : null;
  const accuracy = stats ? stats.accuracy_score : null;

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4 select-none shadow-xs">
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

        {/* Real Visual Metric Cards (Zero Hardcoded Stats) */}
        <div className="grid grid-cols-4 gap-3 shrink-0">
          <div className="px-4 py-2.5 rounded-xl bg-white border border-gray-200 shadow-2xs text-center min-w-[100px]">
            <div className="text-xl font-bold text-gray-900 font-mono">
              {manuals !== null && manuals > 0 ? manuals : "—"}
            </div>
            <div className="text-xs text-gray-500 font-medium">Indexed Manuals</div>
          </div>
          <div className="px-4 py-2.5 rounded-xl bg-white border border-gray-200 shadow-2xs text-center min-w-[100px]">
            <div className="text-xl font-bold text-blue-600 font-mono">
              {pages !== null && pages > 0 ? pages : "—"}
            </div>
            <div className="text-xs text-gray-500 font-medium">Indexed Pages</div>
          </div>
          <div className="px-4 py-2.5 rounded-xl bg-white border border-gray-200 shadow-2xs text-center min-w-[100px]">
            <div className="text-xl font-bold text-emerald-600 font-mono">
              {chunks !== null && chunks > 0 ? chunks : "—"}
            </div>
            <div className="text-xs text-gray-500 font-medium">Knowledge Chunks</div>
          </div>
          <div className="px-4 py-2.5 rounded-xl bg-white border border-gray-200 shadow-2xs text-center min-w-[100px]">
            <div className="text-xl font-bold text-amber-600 font-mono">
              {accuracy !== null && accuracy > 0 ? `${accuracy}%` : "—"}
            </div>
            <div className="text-xs text-gray-500 font-medium">RAG Verification</div>
          </div>
        </div>
      </div>
    </div>
  );
}

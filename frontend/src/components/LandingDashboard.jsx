import React from 'react';
import { ShieldCheck, BookOpen, Cpu, Sparkles, Activity, FileText } from 'lucide-react';

export default function LandingDashboard({ onStartChat, onOpenLibrary }) {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4 select-none shadow-xs">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold uppercase text-blue-600 tracking-wider">Industrial AI Troubleshooting</span>
            <span className="text-gray-300">•</span>
            <span className="text-xs text-gray-500 font-medium">Grounded RAG System</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight mt-0.5">
            Troubleshoot Machines with Verified Manual Evidence
          </h1>
        </div>

        {/* Visual Metric Cards */}
        <div className="grid grid-cols-4 gap-3 shrink-0">
          <div className="px-4 py-2.5 rounded-xl bg-white border border-gray-200 shadow-2xs text-center min-w-[100px]">
            <div className="text-lg font-bold text-gray-900 font-mono">4</div>
            <div className="text-[11px] text-gray-500 font-medium">OEM Manuals</div>
          </div>
          <div className="px-4 py-2.5 rounded-xl bg-white border border-gray-200 shadow-2xs text-center min-w-[100px]">
            <div className="text-lg font-bold text-blue-600 font-mono">1,284</div>
            <div className="text-[11px] text-gray-500 font-medium">Indexed Pages</div>
          </div>
          <div className="px-4 py-2.5 rounded-xl bg-white border border-gray-200 shadow-2xs text-center min-w-[100px]">
            <div className="text-lg font-bold text-emerald-600 font-mono">98.2%</div>
            <div className="text-[11px] text-gray-500 font-medium">Retrieval Precision</div>
          </div>
          <div className="px-4 py-2.5 rounded-xl bg-white border border-gray-200 shadow-2xs text-center min-w-[100px]">
            <div className="text-lg font-bold text-amber-600 font-mono">0.20</div>
            <div className="text-[11px] text-gray-500 font-medium">Safety Cutoff</div>
          </div>
        </div>
      </div>
    </div>
  );
}


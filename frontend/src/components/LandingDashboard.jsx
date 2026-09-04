import React from 'react';
import { ShieldCheck, BookOpen, Cpu, Sparkles, ChevronRight } from 'lucide-react';

export default function LandingDashboard({ onStartChat, onOpenLibrary }) {
  return (
    <div className="bg-white border-b border-slate-200 p-6 select-none shadow-2xs">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center space-x-2 bg-blue-50 border border-blue-200 text-blue-800 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider mb-2">
            <Sparkles size={13} className="text-blue-600" />
            <span>VCET HACKATHON 2026 PRODUCT</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Troubleshoot Machines. Faster. <span className="text-blue-600">With Evidence.</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1 max-w-xl">
            AI-powered industrial troubleshooting copilot grounded strictly in official manufacturer manuals. Zero hallucination.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 shrink-0">
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center">
            <ShieldCheck size={18} className="mx-auto text-emerald-600 mb-1" />
            <div className="font-extrabold text-xs text-slate-900">Evidence-Based</div>
            <div className="text-[10px] text-slate-500 font-mono">Zero Hallucination</div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center">
            <BookOpen size={18} className="mx-auto text-blue-600 mb-1" />
            <div className="font-extrabold text-xs text-slate-900">Page Citations</div>
            <div className="text-[10px] text-slate-500 font-mono">Traceable Manuals</div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center">
            <Cpu size={18} className="mx-auto text-amber-600 mb-1" />
            <div className="font-extrabold text-xs text-slate-900">Safety-First</div>
            <div className="text-[10px] text-slate-500 font-mono">LOTO Protocols</div>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Building2, ArrowRight, PlusCircle, Layers, CheckCircle2 } from 'lucide-react';

export default function MachineSelectorCard({ onSelectMachine, machines = [], onOpenUploadModal }) {
  const [selectedIdx, setSelectedIdx] = useState(0);

  useEffect(() => {
    if (machines.length > 0) {
      setSelectedIdx(0);
    }
  }, [machines]);

  if (!machines || machines.length === 0) {
    return (
      <div className="max-w-xl mx-auto w-full bg-white border border-[#E2E8F0] rounded-2xl p-8 shadow-sm text-center space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 mx-auto flex items-center justify-center font-bold">
          <Building2 size={28} />
        </div>
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-bold uppercase tracking-wider">
            <span>NO MACHINES AVAILABLE</span>
          </div>
          <h2 className="text-xl font-bold text-[#0F172A] tracking-tight">No Machine Manuals Uploaded Yet</h2>
          <p className="text-xs text-[#64748B] max-w-md mx-auto leading-relaxed font-medium">
            No machine manuals have been uploaded yet. Please upload an OEM PDF manual to index equipment specs, error codes, and verified troubleshooting procedures.
          </p>
        </div>
        <div className="pt-2">
          <button
            type="button"
            onClick={onOpenUploadModal}
            className="px-5 py-3 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-xs uppercase tracking-wider inline-flex items-center space-x-2 transition cursor-pointer shadow-xs"
          >
            <PlusCircle size={16} />
            <span>+ Upload Machine Manual</span>
          </button>
        </div>
      </div>
    );
  }

  const currentMachine = machines[selectedIdx] || machines[0];

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (currentMachine) {
      onSelectMachine(currentMachine);
    }
  };

  return (
    <div className="max-w-2xl mx-auto w-full bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-sm space-y-6">
      <div className="flex items-start space-x-3.5 border-b border-[#F1F5F9] pb-4">
        <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center font-bold shrink-0">
          <Building2 size={22} />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#0F172A] tracking-tight">Which machine are you troubleshooting?</h2>
            <span className="text-xs font-semibold text-[#2563EB] bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
              {machines.length} OEM {machines.length === 1 ? 'Manual' : 'Manuals'} Ingested
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5 font-medium">
            Select your machine scope from indexed database manuals to retrieve verified troubleshooting evidence.
          </p>
        </div>
      </div>

      {/* Dynamic Ingested Machine Cards */}
      <div className="space-y-2.5">
        <span className="text-[11px] font-semibold uppercase text-[#64748B] tracking-wider block">
          Ingested OEM Machines (Database Source of Truth):
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {machines.map((m, idx) => {
            const isSelected = selectedIdx === idx;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setSelectedIdx(idx);
                  onSelectMachine(m);
                }}
                className={`p-3.5 rounded-xl border text-left flex items-start justify-between cursor-pointer transition-all ${
                  isSelected
                    ? 'border-[#2563EB] bg-blue-50/60 ring-2 ring-blue-100 shadow-2xs'
                    : 'border-[#E2E8F0] bg-[#F8FAFC] hover:bg-white hover:border-[#2563EB]'
                }`}
              >
                <div className="space-y-1 truncate pr-2">
                  <div className="flex items-center space-x-1.5 truncate">
                    <span className="text-xs font-bold text-[#0F172A] truncate">{m.machine_name}</span>
                    {m.manual_language && (
                      <span className="text-[10px] bg-white border border-[#E2E8F0] px-1.5 py-0.2 rounded shrink-0 font-medium">
                        {m.manual_language}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-[#64748B] font-mono">
                    {m.manufacturer} · {m.model}
                  </div>
                  <div className="text-[10px] text-[#2563EB] font-medium flex items-center">
                    <Layers size={10} className="mr-1" /> Year: {m.manufacturing_year || '2021'} · {m.chunk_count || 1} Chunks
                  </div>
                </div>
                <div className="shrink-0 mt-0.5">
                  {isSelected ? (
                    <CheckCircle2 size={18} className="text-[#2563EB]" />
                  ) : (
                    <ArrowRight size={14} className="text-[#64748B]" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selector Dropdown & Action */}
      <form onSubmit={handleSubmit} className="space-y-4 pt-2 border-t border-[#F1F5F9]">
        <div>
          <label className="block text-xs font-semibold text-[#0F172A] mb-1">
            Active Machine Scope Selection <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedIdx}
            onChange={(e) => {
              const idx = parseInt(e.target.value, 10);
              setSelectedIdx(idx);
            }}
            className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 py-2.5 text-xs font-medium text-[#0F172A] outline-none focus:border-[#2563EB]"
          >
            {machines.map((m, idx) => (
              <option key={idx} value={idx}>
                {m.manufacturer} - {m.machine_name} ({m.model}) [{m.manufacturing_year || '2021'}]
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-3 pt-1">
          <button
            type="submit"
            className="flex-1 py-3 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition cursor-pointer shadow-xs"
          >
            <span>CONTINUE TO TROUBLESHOOTING</span>
            <ArrowRight size={15} />
          </button>
          {onOpenUploadModal && (
            <button
              type="button"
              onClick={onOpenUploadModal}
              className="py-3 px-4 rounded-xl bg-[#F8FAFC] hover:bg-gray-100 border border-[#E2E8F0] text-[#0F172A] font-semibold text-xs transition cursor-pointer shrink-0"
            >
              + Upload Manual
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

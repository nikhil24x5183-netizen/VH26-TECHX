import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Hash, Layers } from 'lucide-react';

export default function CitationCard({ citation }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-slate-200 bg-white rounded-2xl overflow-hidden shadow-xs hover:border-blue-400 transition-all">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-3 bg-slate-50/90 hover:bg-slate-100/90 cursor-pointer flex items-center justify-between text-xs font-extrabold text-slate-900"
      >
        <div className="flex items-center space-x-2.5 truncate">
          <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 font-mono font-bold text-xs flex items-center justify-center">
            {citation.id}
          </span>
          <span className="font-extrabold text-slate-900 text-sm truncate">{citation.machine_name}</span>
          <span className="text-slate-300">•</span>
          <span className="text-slate-500 font-mono text-xs truncate">{citation.file_name}</span>
        </div>
        
        <div className="flex items-center space-x-3">
          <span className="bg-blue-50 text-blue-800 border border-blue-100 px-2.5 py-1 rounded-full text-xs font-mono font-bold flex items-center">
            <Hash size={12} className="mr-1 text-blue-600" /> PAGE {citation.page_number}
          </span>
          {isOpen ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
        </div>
      </div>

      {isOpen && (
        <div className="p-4 bg-white border-t border-slate-100 text-sm space-y-3 text-slate-800">
          <div className="flex items-center space-x-4 text-xs font-bold text-slate-600">
            <span className="flex items-center text-blue-700 font-extrabold">
              <Layers size={14} className="mr-1.5 text-blue-600" /> {citation.section}
            </span>
            <span className="font-mono text-slate-500">MODEL: {citation.model}</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-blue-50/50 border border-blue-100 font-mono text-xs text-slate-900 leading-relaxed whitespace-pre-wrap font-medium">
            {citation.snippet}
          </div>
        </div>
      )}
    </div>
  );
}

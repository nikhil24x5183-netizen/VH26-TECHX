import React, { useState } from 'react';
import { ChevronDown, ChevronUp, FileText, Hash, Layers } from 'lucide-react';

export default function CitationCard({ citation }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-gray-200 bg-white rounded-lg overflow-hidden shadow-2xs transition-colors hover:border-blue-300">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="px-3.5 py-2.5 bg-blue-50/40 hover:bg-blue-50/80 cursor-pointer flex items-center justify-between text-xs text-gray-900"
      >
        <div className="flex items-center space-x-2 min-w-0">
          <FileText size={15} className="text-blue-600 shrink-0" />
          <span className="font-semibold text-gray-900 text-xs truncate">{citation.machine_name}</span>
          <span className="text-gray-300">•</span>
          <span className="text-gray-500 font-mono text-[11px] truncate">{citation.file_name}</span>
        </div>
        
        <div className="flex items-center space-x-2 shrink-0">
          <span className="bg-white text-blue-700 border border-blue-200 px-2 py-0.5 rounded text-[11px] font-mono font-semibold flex items-center">
            p. {citation.page_number}
          </span>
          {isOpen ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
        </div>
      </div>

      {isOpen && (
        <div className="p-3 bg-white border-t border-gray-100 text-xs space-y-2 text-gray-800">
          <div className="flex items-center space-x-3 text-[11px] font-medium text-gray-500">
            <span className="flex items-center text-blue-700 font-semibold">
              <Layers size={13} className="mr-1 text-blue-600" /> {citation.section}
            </span>
            <span>Model: {citation.model}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-200 font-mono text-[11px] text-gray-800 leading-relaxed whitespace-pre-wrap font-normal">
            {citation.snippet}
          </div>
        </div>
      )}
    </div>
  );
}


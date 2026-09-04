import React, { useState } from 'react';
import { FileText, Plus, Trash2, RefreshCw, Search, CheckCircle, ExternalLink, Filter, Layers } from 'lucide-react';

export default function ManualLibrary({ documents, onUploadNew, onDeleteDocument, onReindex }) {
  const [filterText, setFilterText] = useState('');

  const filteredDocs = documents.filter(d =>
    d.machine_name.toLowerCase().includes(filterText.toLowerCase()) ||
    d.manufacturer.toLowerCase().includes(filterText.toLowerCase()) ||
    d.file_name.toLowerCase().includes(filterText.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F7F9FC] overflow-y-auto p-6 space-y-4">
      {/* Top Banner */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-2xs flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-gray-900 tracking-tight flex items-center">
            <FileText size={18} className="mr-2 text-blue-600" /> Manual Library & Knowledge Store
          </h2>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            Manage ingested manufacturer manuals, indexing status, and document metadata.
          </p>
        </div>
        <button
          onClick={onUploadNew}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs flex items-center space-x-1.5 transition-colors shadow-2xs"
        >
          <Plus size={15} />
          <span>Upload PDF Manual</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex items-center justify-between space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Filter manuals by manufacturer, machine, or file name..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-gray-900 font-medium outline-none focus:border-blue-600 transition-colors shadow-2xs"
          />
        </div>
        <div className="text-xs font-mono font-medium text-gray-500">
          Showing {filteredDocs.length} of {documents.length} manuals
        </div>
      </div>

      {/* Documents Grid Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-semibold text-[11px]">
              <th className="p-3.5">Manufacturer</th>
              <th className="p-3.5">Machine & Model</th>
              <th className="p-3.5">Manual Title</th>
              <th className="p-3.5">Chunks</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
            {filteredDocs.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-8 text-center text-gray-400 font-normal text-xs">
                  No manuals matching filter.
                </td>
              </tr>
            ) : (
              filteredDocs.map((doc, idx) => (
                <tr key={idx} className="hover:bg-gray-50/70 transition-colors">
                  <td className="p-3.5">
                    <span className="bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded text-[11px] font-semibold">
                      {doc.manufacturer}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <div className="font-semibold text-gray-900">{doc.machine_name}</div>
                    <div className="text-[11px] text-gray-500 font-mono">{doc.model}</div>
                  </td>
                  <td className="p-3.5 font-mono text-xs text-gray-600">
                    {doc.file_name}
                  </td>
                  <td className="p-3.5 font-mono font-semibold text-gray-700">
                    {doc.chunk_count} chunks
                  </td>
                  <td className="p-3.5">
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-[11px] font-semibold flex items-center w-fit">
                      <CheckCircle size={12} className="mr-1 text-emerald-600" /> {doc.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end space-x-1.5">
                      <button
                        onClick={onReindex}
                        className="p-1.5 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors"
                        title="Re-index Manual"
                      >
                        <RefreshCw size={13} />
                      </button>
                      <button
                        onClick={() => onDeleteDocument(doc.document_id)}
                        className="p-1.5 rounded-lg bg-white border border-gray-200 hover:bg-red-50 hover:border-red-200 text-gray-600 hover:text-red-600 transition-colors"
                        title="Delete Manual"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


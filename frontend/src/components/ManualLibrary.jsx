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
    <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-y-auto p-6 space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center">
            <FileText size={22} className="mr-2 text-blue-600" /> Manual Library & Knowledge Store
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Manage ingested manufacturer manuals, indexing status, and document metadata.
          </p>
        </div>
        <button
          onClick={onUploadNew}
          className="px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase flex items-center space-x-2 shadow-md shadow-blue-600/30 transition"
        >
          <Plus size={16} />
          <span>Upload PDF Manual</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex items-center justify-between space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Filter manuals by manufacturer, machine, or file name..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-full pl-10 pr-4 py-2 text-xs text-slate-900 font-medium outline-none focus:border-blue-500 shadow-2xs"
          />
        </div>
        <div className="text-xs font-mono font-bold text-slate-500">
          SHOWING {filteredDocs.length} OF {documents.length} MANUALS
        </div>
      </div>

      {/* Documents Grid Table */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-500 uppercase font-mono font-extrabold text-[11px]">
              <th className="p-4">MANUFACTURER</th>
              <th className="p-4">MACHINE & MODEL</th>
              <th className="p-4">MANUAL TITLE</th>
              <th className="p-4">CHUNKS</th>
              <th className="p-4">STATUS</th>
              <th className="p-4 text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
            {filteredDocs.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-8 text-center text-slate-400 font-mono text-xs">
                  No manuals matching filter.
                </td>
              </tr>
            ) : (
              filteredDocs.map((doc, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition">
                  <td className="p-4 font-bold text-slate-900">
                    <span className="bg-blue-50 text-blue-800 border border-blue-100 px-2.5 py-1 rounded-full font-mono text-[11px] font-extrabold">
                      {doc.manufacturer}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="font-extrabold text-slate-900">{doc.machine_name}</div>
                    <div className="text-[11px] font-mono text-slate-500">{doc.model}</div>
                  </td>
                  <td className="p-4 font-mono text-xs text-slate-700">
                    {doc.file_name}
                  </td>
                  <td className="p-4 font-mono font-bold">
                    {doc.chunk_count} chunks
                  </td>
                  <td className="p-4">
                    <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-full font-mono text-[11px] font-extrabold flex items-center w-fit">
                      <CheckCircle size={12} className="mr-1 text-emerald-600" /> {doc.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={onReindex}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600"
                        title="Re-index Manual"
                      >
                        <RefreshCw size={14} />
                      </button>
                      <button
                        onClick={() => onDeleteDocument(doc.document_id)}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600"
                        title="Delete Manual"
                      >
                        <Trash2 size={14} />
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

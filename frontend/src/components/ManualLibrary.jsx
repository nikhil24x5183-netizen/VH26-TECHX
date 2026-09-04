import React, { useState } from 'react';
import { FileText, Plus, Trash2, RefreshCw, Search, CheckCircle, ExternalLink, Filter, Layers, Calendar } from 'lucide-react';

export default function ManualLibrary({ documents, onUploadNew, onDeleteDocument, onReindex }) {
  const [filterText, setFilterText] = useState('');

  const filteredDocs = documents.filter(d =>
    d.machine_name.toLowerCase().includes(filterText.toLowerCase()) ||
    d.manufacturer.toLowerCase().includes(filterText.toLowerCase()) ||
    d.file_name.toLowerCase().includes(filterText.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F8FAFC] overflow-y-auto p-6 space-y-4 font-sans text-[#0F172A]">
      {/* Top Banner */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-2xs flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-[#0F172A] tracking-tight flex items-center">
            <FileText size={18} className="mr-2 text-[#2563EB]" /> Manual Library & Knowledge Store
          </h2>
          <p className="text-xs text-[#64748B] font-medium mt-0.5">
            Manage ingested manufacturer manuals, indexing status, and document metadata.
          </p>
        </div>
        <button
          onClick={onUploadNew}
          className="px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-xs flex items-center space-x-1.5 transition shadow-2xs cursor-pointer"
        >
          <Plus size={15} />
          <span>Upload Machine Manual</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex items-center justify-between space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-2.5 text-[#64748B]" />
          <input
            type="text"
            placeholder="Filter manuals by manufacturer, machine, or file name..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="w-full bg-white border border-[#E2E8F0] rounded-xl pl-9 pr-3 py-2 text-xs text-[#0F172A] font-medium outline-none focus:border-[#2563EB] transition shadow-2xs"
          />
        </div>
        <div className="text-xs font-mono font-semibold text-[#64748B]">
          Showing {filteredDocs.length} of {documents.length} manuals
        </div>
      </div>

      {/* Documents Grid Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-2xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-semibold text-[11px]">
              <th className="p-3.5">Manufacturer</th>
              <th className="p-3.5">Machine & Model</th>
              <th className="p-3.5">Year</th>
              <th className="p-3.5">Manual Type</th>
              <th className="p-3.5">Pages & Chunks</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 font-medium text-[#0F172A]">
            {filteredDocs.length === 0 ? (
              <tr>
                <td colSpan="7" className="p-8 text-center text-gray-400 font-normal text-xs">
                  No manuals matching filter.
                </td>
              </tr>
            ) : (
              filteredDocs.map((doc, idx) => (
                <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                  <td className="p-3.5">
                    <span className="bg-blue-50 text-[#2563EB] border border-blue-100 px-2.5 py-0.5 rounded-md text-[11px] font-bold">
                      {doc.manufacturer}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <div className="font-bold text-[#0F172A]">{doc.machine_name}</div>
                    <div className="text-[11px] text-[#64748B] font-mono">{doc.model}</div>
                  </td>
                  <td className="p-3.5 font-mono text-xs font-semibold text-[#0F172A]">
                    {doc.manufacturing_year || '2021'}
                  </td>
                  <td className="p-3.5 text-xs text-[#64748B]">
                    {doc.manual_type || 'Operating Instructions'}
                  </td>
                  <td className="p-3.5 font-mono text-xs text-[#0F172A]">
                    <div><strong>{doc.page_count || 624}</strong> pages</div>
                    <div className="text-[11px] text-[#64748B]">{doc.chunk_count} chunks</div>
                  </td>
                  <td className="p-3.5">
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-md text-[11px] font-bold flex items-center w-fit">
                      <CheckCircle size={12} className="mr-1 text-emerald-600" /> {doc.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end space-x-1.5">
                      <a
                        href={`/api/pdf/${doc.file_name}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 rounded-md bg-white border border-[#E2E8F0] hover:border-[#2563EB] text-[#2563EB] font-semibold text-xs transition flex items-center space-x-1"
                        title="View PDF"
                      >
                        <ExternalLink size={12} />
                        <span>View</span>
                      </a>
                      <button
                        onClick={() => onDeleteDocument(doc.document_id || doc.file_name || doc.machine_name)}
                        className="p-1.5 rounded-md bg-white border border-[#E2E8F0] hover:bg-red-50 hover:border-red-200 text-gray-400 hover:text-red-600 transition cursor-pointer"
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

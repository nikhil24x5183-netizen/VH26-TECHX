import React, { useState } from 'react';
import { Upload, Cpu, Trash2, RefreshCw, Plus, FileText, X, AlertCircle, Layers } from 'lucide-react';

export default function Sidebar({
  machines,
  selectedMachine,
  onSelectMachine,
  onUploadSuccess,
  onDeleteMachine,
  onResetDatabase,
  isLoading
}) {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [machineName, setMachineName] = useState('');
  const [model, setModel] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!file || !machineName || !model) {
      setUploadError('All fields required.');
      return;
    }

    setUploading(true);
    setUploadError('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('manufacturer', machineName.split(' ')[0] || 'Industrial OEM');
    formData.append('machine_name', machineName);
    formData.append('model', model);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Upload failed');
      }
      setUploading(false);
      setShowUploadModal(false);
      setMachineName('');
      setModel('');
      setFile(null);
      onUploadSuccess();
    } catch (err) {
      setUploading(false);
      setUploadError(err.message);
    }
  };

  return (
    <aside className="w-72 bg-white border-r border-gray-200 flex flex-col h-full select-none shrink-0">
      {/* Scope Title Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Layers size={16} className="text-blue-600" />
          <h2 className="font-semibold text-sm text-gray-900 tracking-tight">Machine Library</h2>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="py-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs flex items-center space-x-1 transition-colors"
        >
          <Plus size={14} />
          <span>Upload</span>
        </button>
      </div>

      {/* Scope Selector */}
      <div className="p-3.5 bg-gray-50/50 border-b border-gray-200">
        <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
          TARGET SCOPE
        </label>
        <select
          value={selectedMachine || 'all'}
          onChange={(e) => onSelectMachine(e.target.value === 'all' ? null : e.target.value)}
          className="w-full bg-white border border-gray-200 text-gray-900 text-xs font-medium rounded-lg px-3 py-2 outline-none cursor-pointer focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
        >
          <option value="all">All Machines (Global Scope)</option>
          {machines.map((m, idx) => (
            <option key={idx} value={m.machine_name}>
              {m.machine_name} ({m.model})
            </option>
          ))}
        </select>
      </div>

      {/* Manuals List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        <div className="flex items-center justify-between px-1 mb-1.5">
          <span className="text-[11px] font-semibold uppercase text-gray-400 tracking-wider">
            MANUALS ({machines.length})
          </span>
          {isLoading && <RefreshCw size={13} className="animate-spin text-blue-600" />}
        </div>

        {machines.length === 0 ? (
          <div className="p-4 text-center border border-dashed border-gray-200 rounded-xl text-gray-400 text-xs font-normal">
            No manuals loaded.
          </div>
        ) : (
          machines.map((m, idx) => {
            const isSelected = selectedMachine === m.machine_name;
            return (
              <div
                key={idx}
                onClick={() => onSelectMachine(isSelected ? null : m.machine_name)}
                className={`group p-3 rounded-xl border transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-blue-50/80 border-blue-500 text-blue-900'
                    : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <FileText size={16} className={isSelected ? 'text-blue-600' : 'text-gray-400'} />
                    <div className="min-w-0">
                      <h3 className={`text-xs font-semibold truncate ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                        {m.machine_name}
                      </h3>
                      <p className="text-[11px] text-gray-500 truncate">{m.model}</p>
                    </div>
                  </div>
                  {m.file_id && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteMachine(m.file_id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-600 text-gray-400 transition-colors"
                      title="Delete Manual"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-gray-400 border-t border-gray-100 pt-1.5">
                  <span className="truncate max-w-[130px] font-mono">{m.file_name}</span>
                  <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 font-medium">
                    {m.chunk_count} ch
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Reset */}
      <div className="p-3 border-t border-gray-200 bg-gray-50/50">
        <button
          onClick={onResetDatabase}
          className="w-full py-2 px-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium flex items-center justify-center space-x-1.5 transition-colors shadow-2xs"
        >
          <RefreshCw size={13} />
          <span>Reset Sample Manuals</span>
        </button>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-gray-900/30 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl relative border border-gray-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900 flex items-center">
                <Upload size={16} className="mr-2 text-blue-600" />
                Upload Machine Manual
              </h2>
              <button onClick={() => setShowUploadModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="mt-4 space-y-3.5">
              {uploadError && (
                <div className="p-3 rounded-lg bg-red-50 text-red-600 text-xs font-medium flex items-center space-x-2 border border-red-100">
                  <AlertCircle size={15} />
                  <span>{uploadError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Machine Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Siemens S7-1500 PLC"
                  value={machineName}
                  onChange={(e) => setMachineName(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 font-medium outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 placeholder-gray-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Model Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. CPU 1516-3 PN/DP"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 font-medium outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 placeholder-gray-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  PDF File <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setFile(e.target.files[0])}
                  className="w-full text-xs text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                  required
                />
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 text-xs font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs flex items-center space-x-1.5 transition-colors disabled:opacity-50"
                >
                  {uploading ? <RefreshCw size={14} className="animate-spin" /> : <Upload size={14} />}
                  <span>Ingest Manual</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </aside>
  );
}

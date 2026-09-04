import React, { useState } from 'react';
import { Upload, Cpu, Trash2, RefreshCw, Plus, FileText, X, AlertCircle } from 'lucide-react';

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
    <aside className="w-80 bg-white border-r border-slate-200 flex flex-col h-full select-none shadow-xs">
      {/* App Header */}
      <div className="p-5 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-600/30">
            <Cpu size={20} />
          </div>
          <div>
            <h1 className="font-extrabold text-base text-slate-900 tracking-tight">MaintAI</h1>
            <span className="text-[11px] text-blue-600 font-mono font-extrabold tracking-wider uppercase">Troubleshooting</span>
          </div>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="py-2 px-3.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs flex items-center space-x-1.5 transition shadow-md shadow-blue-600/30 active:scale-95"
        >
          <Plus size={16} />
          <span>Upload</span>
        </button>
      </div>

      {/* Scope Selector */}
      <div className="p-4 bg-slate-50/80 border-b border-slate-200">
        <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">
          TARGET MACHINE SCOPE
        </label>
        <select
          value={selectedMachine || 'all'}
          onChange={(e) => onSelectMachine(e.target.value === 'all' ? null : e.target.value)}
          className="w-full bg-white border border-slate-200 text-slate-900 text-sm font-bold rounded-2xl px-4 py-2.5 outline-none cursor-pointer focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
        >
          <option value="all">⚡ All Machines Scope</option>
          {machines.map((m, idx) => (
            <option key={idx} value={m.machine_name}>
              ⚙️ {m.machine_name} ({m.model})
            </option>
          ))}
        </select>
      </div>

      {/* Manuals List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
        <div className="flex items-center justify-between px-1 mb-2">
          <span className="text-xs font-extrabold uppercase text-slate-500 tracking-wider">
            AVAILABLE MANUALS ({machines.length})
          </span>
          {isLoading && <RefreshCw size={14} className="animate-spin text-blue-600" />}
        </div>

        {machines.length === 0 ? (
          <div className="p-4 text-center border border-dashed border-slate-200 rounded-2xl text-slate-400 text-sm font-medium">
            No manuals loaded.
          </div>
        ) : (
          machines.map((m, idx) => {
            const isSelected = selectedMachine === m.machine_name;
            return (
              <div
                key={idx}
                onClick={() => onSelectMachine(isSelected ? null : m.machine_name)}
                className={`group p-3.5 rounded-2xl border transition-all cursor-pointer shadow-xs ${
                  isSelected
                    ? 'bg-blue-50/90 border-blue-500 ring-2 ring-blue-500/20'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2.5 truncate">
                    <FileText size={18} className={isSelected ? 'text-blue-600' : 'text-slate-400'} />
                    <div className="truncate">
                      <h3 className={`text-sm font-bold truncate ${isSelected ? 'text-blue-950' : 'text-slate-900'}`}>
                        {m.machine_name}
                      </h3>
                      <p className="text-xs text-slate-500 font-mono font-medium">{m.model}</p>
                    </div>
                  </div>
                  {m.file_id && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteMachine(m.file_id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-600 text-slate-400 transition"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
                <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500 font-mono border-t border-slate-100 pt-2 font-medium">
                  <span className="truncate max-w-[140px]">{m.file_name}</span>
                  <span className="bg-slate-100 px-2 py-0.5 rounded-md text-slate-800 font-bold">
                    {m.chunk_count} chunks
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Reset */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/80">
        <button
          onClick={onResetDatabase}
          className="w-full py-2.5 px-4 rounded-full border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-extrabold flex items-center justify-center space-x-2 transition shadow-xs"
        >
          <RefreshCw size={14} />
          <span>RESET SAMPLE DATABASE</span>
        </button>
      </div>

      {/* Upload Modal (Styled after uploaded modal image: rounded-3xl, big bold header, uppercase labels, soft blue input, pill buttons) */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-7 shadow-2xl relative border border-slate-100">
            <div className="flex items-center justify-between pb-4">
              <h2 className="text-xl font-extrabold text-slate-900 flex items-center">
                <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-2 text-sm font-bold">+</span>
                Add New Machine Manual
              </h2>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="mt-4 space-y-4">
              {uploadError && (
                <div className="p-3 rounded-2xl bg-red-50 text-red-600 text-xs font-bold flex items-center space-x-2">
                  <AlertCircle size={16} />
                  <span>{uploadError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">
                  FACULTY / MACHINE FULL NAME <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Atlas Compressor X100"
                  value={machineName}
                  onChange={(e) => setMachineName(e.target.value)}
                  className="w-full bg-blue-50/60 border border-blue-100 rounded-2xl px-4 py-3 text-base text-slate-900 font-semibold outline-none focus:border-blue-500 focus:bg-white transition placeholder-slate-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">
                  MACHINE MODEL CODE <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. X100-v2"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full bg-blue-50/60 border border-blue-100 rounded-2xl px-4 py-3 text-base text-slate-900 font-semibold outline-none focus:border-blue-500 focus:bg-white transition placeholder-slate-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">
                  MANUAL PDF DOCUMENT <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setFile(e.target.files[0])}
                  className="w-full text-xs text-slate-600 file:mr-3 file:py-2.5 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-extrabold file:bg-blue-600 file:text-white cursor-pointer"
                  required
                />
              </div>

              <div className="pt-4 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-6 py-3 rounded-full bg-slate-100 text-slate-700 font-extrabold text-xs tracking-wider uppercase hover:bg-slate-200 transition"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-7 py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs tracking-wider uppercase flex items-center space-x-2 transition shadow-md shadow-blue-600/30 disabled:opacity-50"
                >
                  {uploading ? <RefreshCw size={15} className="animate-spin" /> : <Upload size={15} />}
                  <span>REGISTER MANUAL</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </aside>
  );
}

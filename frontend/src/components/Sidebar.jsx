import React, { useState } from 'react';
import { Upload, Cpu, Trash2, RefreshCw, Plus, FileText, X, AlertCircle, Layers, LayoutDashboard, Settings, Activity, Award, ShieldCheck } from 'lucide-react';
import { uploadDocument } from '../api/documents';
import { resetDatabase } from '../api/machines';

export default function Sidebar({
  machines,
  selectedMachine,
  onSelectMachine,
  onUploadSuccess,
  onDeleteMachine,
  onResetDatabase,
  activeTab,
  onNavigateTab,
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
      await uploadDocument(formData);
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

  const navItems = [
    { id: 'technician', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'machines', label: 'Machines', icon: Cpu },
    { id: 'library', label: 'Manual Library', icon: FileText },
    { id: 'admin', label: 'Diagnostics', icon: Activity },
    { id: 'evaluation', label: 'Evaluation', icon: Award }
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-full select-none shrink-0 z-20">
      {/* Brand Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-2xs">
            <Cpu size={18} />
          </div>
          <div>
            <h1 className="font-bold text-sm text-gray-900 tracking-tight">MaintAI</h1>
            <span className="text-[10px] text-blue-600 font-mono font-semibold uppercase tracking-wider">Workspace</span>
          </div>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
          title="Upload Manual"
        >
          <Plus size={15} />
        </button>
      </div>

      {/* Main Navigation Links */}
      <div className="p-3 border-b border-gray-200 space-y-1">
        <div className="text-[10px] font-semibold uppercase text-gray-400 px-2 mb-1 tracking-wider">
          NAVIGATION
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = (activeTab === item.id) || (activeTab === 'technician' && item.id === 'technician');
          return (
            <button
              key={item.id}
              onClick={() => onNavigateTab(item.id === 'machines' ? 'technician' : item.id)}
              className={`w-full px-3 py-2 rounded-lg text-xs font-medium flex items-center space-x-2.5 transition-colors ${
                isActive
                  ? 'bg-blue-50/80 text-blue-700 font-semibold'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon size={15} className={isActive ? 'text-blue-600' : 'text-gray-400'} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Target Scope Machine Selector */}
      <div className="p-3 bg-gray-50/40 border-b border-gray-200">
        <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1 px-1">
          TARGET MACHINE SCOPE
        </label>
        <select
          value={selectedMachine || 'all'}
          onChange={(e) => onSelectMachine(e.target.value === 'all' ? null : e.target.value)}
          className="w-full bg-white border border-gray-200 text-gray-900 text-xs font-medium rounded-lg px-2.5 py-1.5 outline-none cursor-pointer focus:border-blue-600 transition-colors"
        >
          <option value="all">⚡ All Machines Scope</option>
          {machines.map((m, idx) => (
            <option key={idx} value={m.machine_name}>
              {m.machine_name} ({m.model})
            </option>
          ))}
        </select>
      </div>

      {/* Manuals Scope List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        <div className="flex items-center justify-between px-1 mb-1">
          <span className="text-[10px] font-semibold uppercase text-gray-400 tracking-wider">
            MANUALS ({machines.length})
          </span>
          {isLoading && <RefreshCw size={12} className="animate-spin text-blue-600" />}
        </div>

        {machines.length === 0 ? (
          <div className="p-3 text-center border border-dashed border-gray-200 rounded-lg text-gray-400 text-xs">
            No manuals loaded.
          </div>
        ) : (
          machines.map((m, idx) => {
            const isSelected = selectedMachine === m.machine_name;
            return (
              <div
                key={idx}
                onClick={() => onSelectMachine(isSelected ? null : m.machine_name)}
                className={`group p-2.5 rounded-lg border transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-blue-50/80 border-blue-500 text-blue-900'
                    : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2 min-w-0">
                    <FileText size={14} className={isSelected ? 'text-blue-600' : 'text-gray-400'} />
                    <div className="min-w-0">
                      <h3 className={`text-xs font-semibold truncate ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                        {m.machine_name}
                      </h3>
                      <p className="text-[10px] text-gray-500 truncate">{m.model}</p>
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
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* System Status Block (Required bottom status indicators) */}
      <div className="p-3 border-t border-gray-200 bg-gray-50/50 space-y-1 text-xs">
        <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
          System Status
        </div>
        <div className="flex items-center space-x-2 text-emerald-700 font-semibold text-[11px]">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>AI Online</span>
        </div>
        <div className="flex items-center space-x-2 text-blue-700 font-semibold text-[11px]">
          <span className="w-2 h-2 rounded-full bg-blue-600"></span>
          <span>Knowledge Base Indexed</span>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-gray-900/30 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-xl relative border border-gray-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h2 className="text-sm font-bold text-gray-900 flex items-center">
                <Upload size={15} className="mr-2 text-blue-600" />
                Upload Machine Manual
              </h2>
              <button onClick={() => setShowUploadModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="mt-3 space-y-3">
              {uploadError && (
                <div className="p-2.5 rounded-lg bg-red-50 text-red-600 text-xs font-medium flex items-center space-x-2 border border-red-100">
                  <AlertCircle size={14} />
                  <span>{uploadError}</span>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-medium text-gray-700 mb-1">
                  Machine Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Siemens S7-1500 PLC"
                  value={machineName}
                  onChange={(e) => setMachineName(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-900 font-medium outline-none focus:border-blue-600"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-gray-700 mb-1">
                  Model Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. CPU 1516-3 PN/DP"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-900 font-medium outline-none focus:border-blue-600"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-gray-700 mb-1">
                  PDF Manual <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setFile(e.target.files[0])}
                  className="w-full text-xs text-gray-600 file:mr-3 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-700 text-xs font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs flex items-center space-x-1.5 disabled:opacity-50"
                >
                  {uploading ? <RefreshCw size={13} className="animate-spin" /> : <Upload size={13} />}
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

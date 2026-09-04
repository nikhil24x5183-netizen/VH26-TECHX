import React, { useState } from 'react';
import { Home, Cpu, FileText, Activity, Settings, Plus, X, Upload, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';
import { uploadDocument } from '../api/documents';

export default function Sidebar({
  machines,
  selectedMachine,
  onSelectMachine,
  onUploadSuccess,
  activeTab,
  onNavigateTab,
  onOpenKeyModal,
  isLoading
}) {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [manufacturer, setManufacturer] = useState('Siemens');
  const [machineName, setMachineName] = useState('');
  const [model, setModel] = useState('');
  const [manualTitle, setManualTitle] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!file || !machineName || !model) {
      setUploadError('Manufacturer, Product/Machine, Model, and PDF are required.');
      return;
    }

    setUploading(true);
    setUploadError('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('manufacturer', manufacturer || 'Industrial OEM');
    formData.append('machine_name', machineName);
    formData.append('model', model);
    if (manualTitle) formData.append('manual_title', manualTitle);

    try {
      await uploadDocument(formData);
      setUploading(false);
      setShowUploadModal(false);
      setManufacturer('Siemens');
      setMachineName('');
      setModel('');
      setManualTitle('');
      setFile(null);
      onUploadSuccess();
    } catch (err) {
      setUploading(false);
      setUploadError(err.message || 'Failed to upload manual');
    }
  };

  const navItems = [
    { id: 'technician', label: 'Home', icon: Home },
    { id: 'machines', label: 'Machines', icon: Cpu },
    { id: 'library', label: 'Manuals', icon: FileText },
    { id: 'admin', label: 'Diagnostics', icon: Activity }
  ];

  return (
    <aside className="w-60 bg-white border-r border-[#E5E7EB] flex flex-col h-full shrink-0 z-20">
      {/* Brand Header */}
      <div className="p-4 border-b border-[#E5E7EB] flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-[#2563EB] flex items-center justify-center text-white font-bold shadow-xs">
            <Cpu size={18} />
          </div>
          <div>
            <h1 className="font-bold text-base text-[#111827] tracking-tight">MaintAI</h1>
            <p className="text-[11px] text-[#64748B] font-medium">Copilot</p>
          </div>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="p-1.5 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white transition-colors cursor-pointer"
          title="Upload Manual PDF"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Main Minimal Navigation */}
      <div className="p-3 flex-1 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id || (activeTab === 'technician' && item.id === 'technician');
          return (
            <button
              key={item.id}
              onClick={() => onNavigateTab(item.id)}
              className={`w-full px-3 py-2.5 rounded-lg text-[14px] font-medium flex items-center space-x-3 transition-colors cursor-pointer ${
                isActive
                  ? 'bg-blue-50 text-[#2563EB] font-semibold'
                  : 'text-[#64748B] hover:bg-gray-50 hover:text-[#111827]'
              }`}
            >
              <Icon size={18} className={isActive ? 'text-[#2563EB]' : 'text-[#64748B]'} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Bottom Settings Button */}
      <div className="p-3 border-t border-[#E5E7EB] bg-white space-y-1">
        <button
          onClick={onOpenKeyModal}
          className={`w-full px-3 py-2.5 rounded-lg text-[14px] font-medium flex items-center space-x-3 transition-colors cursor-pointer ${
            activeTab === 'settings'
              ? 'bg-blue-50 text-[#2563EB] font-semibold'
              : 'text-[#64748B] hover:bg-gray-50 hover:text-[#111827]'
          }`}
        >
          <Settings size={18} className="text-[#64748B]" />
          <span>Settings</span>
        </button>

        {/* Minimal System Status */}
        <div className="pt-2 px-2 flex items-center justify-between text-[11px] text-[#64748B]">
          <span className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>AI Online</span>
          </span>
          <span className="font-mono text-[10px]">v2026.1</span>
        </div>
      </div>

      {/* Upload Manual Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-gray-900/30 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl relative border border-[#E5E7EB]">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <h2 className="text-base font-bold text-[#111827] flex items-center">
                <Upload size={16} className="mr-2 text-[#2563EB]" />
                Upload OEM Manual PDF
              </h2>
              <button onClick={() => setShowUploadModal(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
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
                <label className="block text-xs font-semibold text-[#111827] mb-1">
                  Manufacturer <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Siemens"
                  value={manufacturer}
                  onChange={(e) => setManufacturer(e.target.value)}
                  className="w-full bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm text-[#111827] font-medium outline-none focus:border-[#2563EB]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#111827] mb-1">
                  Product / Machine <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. SINAMICS G120"
                  value={machineName}
                  onChange={(e) => setMachineName(e.target.value)}
                  className="w-full bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm text-[#111827] font-medium outline-none focus:border-[#2563EB]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#111827] mb-1">
                  Model Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. CU240B/E-2"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm text-[#111827] font-medium outline-none focus:border-[#2563EB]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#111827] mb-1">
                  Manual Title <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. SINAMICS G120 Operating Instructions"
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  className="w-full bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm text-[#111827] font-medium outline-none focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#111827] mb-1">
                  PDF Manual <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setFile(e.target.files[0])}
                  className="w-full text-xs text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-[#2563EB] hover:file:bg-blue-100 cursor-pointer"
                  required
                />
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-lg bg-white border border-[#E5E7EB] text-[#111827] text-xs font-medium hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white font-medium text-xs flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer shadow-xs"
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

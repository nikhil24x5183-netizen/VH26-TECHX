import React, { useState } from 'react';
import { Home, Cpu, FileText, Activity, Settings, Plus, X, Upload, RefreshCw, AlertCircle, Sparkles, Award, Layers, CheckCircle, Clock } from 'lucide-react';
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
  const [manufacturingYear, setManufacturingYear] = useState('2021');
  const [firmware, setFirmware] = useState('');
  const [manualType, setManualType] = useState('Operating Instructions');
  const [manualTitle, setManualTitle] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgressStep, setUploadProgressStep] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [uploadResult, setUploadResult] = useState(null);

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!file || !machineName || !model) {
      setUploadError('Manufacturer, Product/Machine, Model Code, and PDF are required.');
      return;
    }

    setUploading(true);
    setUploadError('');
    setUploadProgressStep('Uploading PDF document...');

    setTimeout(() => setUploadProgressStep('Extracting text & page structures...'), 800);
    setTimeout(() => setUploadProgressStep('Processing sections & extracting error codes...'), 1600);
    setTimeout(() => setUploadProgressStep('Generating 384-dim dense embeddings & index...'), 2400);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('manufacturer', manufacturer || 'Industrial OEM');
    formData.append('machine_name', machineName);
    formData.append('model', model);
    formData.append('manufacturing_year', manufacturingYear || '2021');
    formData.append('firmware', firmware || 'Standard');
    formData.append('manual_type', manualType || 'Operating Instructions');
    if (manualTitle) formData.append('manual_title', manualTitle);

    try {
      const res = await uploadDocument(formData);
      setUploading(false);
      setUploadProgressStep('Ready!');
      setUploadResult(res);

      setTimeout(() => {
        setShowUploadModal(false);
        setManufacturer('Siemens');
        setMachineName('');
        setModel('');
        setManufacturingYear('2021');
        setFirmware('');
        setFile(null);
        setUploadResult(null);
        setUploadProgressStep('');
        onUploadSuccess();
      }, 1500);
    } catch (err) {
      setUploading(false);
      setUploadProgressStep('');
      setUploadError(err.message || 'Failed to upload manual');
    }
  };

  const navItems = [
    { id: 'technician', label: 'Home', icon: Home },
    { id: 'machines', label: 'Machines', icon: Cpu },
    { id: 'library', label: 'Manuals', icon: FileText },
    { id: 'admin', label: 'Diagnostics', icon: Activity },
    { id: 'evaluation', label: 'Evaluation', icon: Award },
    { id: 'graph', label: 'Knowledge Graph', icon: Layers }
  ];

  return (
    <aside className="w-60 bg-white border-r border-[#E2E8F0] flex flex-col h-full shrink-0 z-20">
      {/* Brand Header */}
      <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-[#2563EB] flex items-center justify-center text-white font-bold shadow-xs">
            <Cpu size={18} />
          </div>
          <div>
            <h1 className="font-bold text-[#0F172A] tracking-tight text-sm">MaintAI</h1>
            <p className="text-[11px] text-[#64748B] font-medium">Copilot</p>
          </div>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="p-1.5 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white transition cursor-pointer"
          title="Upload OEM Manual PDF"
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
              className={`w-full px-3 py-2 rounded-lg text-xs font-semibold flex items-center space-x-3 transition cursor-pointer ${
                isActive
                  ? 'bg-blue-50 text-[#2563EB]'
                  : 'text-[#64748B] hover:bg-gray-50 hover:text-[#0F172A]'
              }`}
            >
              <Icon size={17} className={isActive ? 'text-[#2563EB]' : 'text-[#64748B]'} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Bottom Settings Button */}
      <div className="p-3 border-t border-[#E2E8F0] bg-white space-y-1">
        <button
          onClick={onOpenKeyModal}
          className={`w-full px-3 py-2 rounded-lg text-xs font-semibold flex items-center space-x-3 transition cursor-pointer ${
            activeTab === 'settings'
              ? 'bg-blue-50 text-[#2563EB]'
              : 'text-[#64748B] hover:bg-gray-50 hover:text-[#0F172A]'
          }`}
        >
          <Settings size={17} className="text-[#64748B]" />
          <span>Settings</span>
        </button>

        <div className="pt-2 px-2 flex items-center justify-between text-[11px] text-[#64748B]">
          <span className="flex items-center space-x-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>AI Online</span>
          </span>
          <span className="font-mono text-[10px]">v2026.2</span>
        </div>
      </div>

      {/* Upload Manual Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl relative border border-[#E2E8F0] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <h2 className="text-sm font-bold text-[#0F172A] flex items-center">
                <Upload size={16} className="mr-2 text-[#2563EB]" />
                Upload Machine Manual PDF
              </h2>
              <button onClick={() => setShowUploadModal(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="mt-4 space-y-3">
              {uploadError && (
                <div className="p-3 rounded-lg bg-red-50 text-red-600 text-xs font-medium flex items-center space-x-2 border border-red-100">
                  <AlertCircle size={15} />
                  <span>{uploadError}</span>
                </div>
              )}

              {uploadProgressStep && (
                <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 text-xs space-y-2">
                  <div className="flex items-center space-x-2 font-bold text-[#2563EB]">
                    {uploadResult ? <CheckCircle size={16} className="text-emerald-600" /> : <RefreshCw size={15} className="animate-spin" />}
                    <span>{uploadProgressStep}</span>
                  </div>
                  {uploadResult && (
                    <div className="text-[11px] font-mono text-[#0F172A] space-y-0.5 pt-1 border-t border-blue-100">
                      <div>✓ Processed {uploadResult.pages_processed || 0} pages</div>
                      <div>✓ Indexed {uploadResult.chunks_indexed || 0} chunks</div>
                      <div>✓ Search Index Ready</div>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Manufacturer <span className="text-red-500">*</span>
                </label>
                <select
                  value={manufacturer}
                  onChange={(e) => setManufacturer(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 py-2 text-xs text-[#0F172A] font-medium outline-none focus:border-[#2563EB]"
                >
                  <option value="Siemens">Siemens</option>
                  <option value="Caterpillar">Caterpillar</option>
                  <option value="KUKA Systems">KUKA Systems</option>
                  <option value="Fanuc Automation">Fanuc Automation</option>
                  <option value="ABB">ABB</option>
                  <option value="Atlas Copco">Atlas Copco</option>
                  <option value="Schneider Electric">Schneider Electric</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Machine / Product <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. SINAMICS G120"
                  value={machineName}
                  onChange={(e) => setMachineName(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 py-2 text-xs text-[#0F172A] font-medium outline-none focus:border-[#2563EB]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                    Model Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. CU240B/E-2"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 py-2 text-xs text-[#0F172A] font-medium outline-none focus:border-[#2563EB]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                    Year <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={manufacturingYear}
                    onChange={(e) => setManufacturingYear(e.target.value)}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 py-2 text-xs text-[#0F172A] font-medium outline-none focus:border-[#2563EB]"
                  >
                    <option value="2024">2024</option>
                    <option value="2023">2023</option>
                    <option value="2022">2022</option>
                    <option value="2021">2021</option>
                    <option value="2020">2020</option>
                    <option value="2019">2019</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Manual Type
                </label>
                <select
                  value={manualType}
                  onChange={(e) => setManualType(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 py-2 text-xs text-[#0F172A] font-medium outline-none focus:border-[#2563EB]"
                >
                  <option value="Operating Instructions">Operating Instructions</option>
                  <option value="Maintenance Manual">Maintenance Manual</option>
                  <option value="Safety Instructions">Safety Instructions</option>
                  <option value="Technical Specifications">Technical Specifications</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  PDF Manual File <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setFile(e.target.files[0])}
                  className="w-full text-xs text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-[#2563EB] hover:file:bg-blue-100 cursor-pointer"
                  required
                />
                {file && (
                  <div className="mt-1 text-[11px] text-[#64748B] font-mono">
                    Selected: {file.name} ({Math.round(file.size / 1024)} KB)
                  </div>
                )}
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-lg bg-white border border-[#E2E8F0] text-[#0F172A] text-xs font-medium hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-xs flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {uploading ? <RefreshCw size={14} className="animate-spin" /> : <Upload size={14} />}
                  <span>INGEST MANUAL</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </aside>
  );
}

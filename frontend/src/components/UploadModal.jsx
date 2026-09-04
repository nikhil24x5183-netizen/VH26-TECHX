import React, { useState } from 'react';
import { Upload, X, RefreshCw, AlertCircle, CheckCircle, FileText } from 'lucide-react';
import { uploadDocument, detectMetadata } from '../api/documents';

const UPLOAD_STEPS = [
  'Uploading PDF to server',
  'Extracting text & page structure',
  'OCR check for scanned pages',
  'Chunking manual sections',
  'Generating dense embeddings',
  'Indexing into vector store',
  '✓ Ready for troubleshooting',
];

export default function UploadModal({ isOpen, onClose, onUploadSuccess }) {
  const [manufacturer, setManufacturer] = useState('Siemens');
  const [machineName, setMachineName] = useState('');
  const [model, setModel] = useState('');
  const [manufacturingYear, setManufacturingYear] = useState('2021');
  const [firmware, setFirmware] = useState('');
  const [manualType, setManualType] = useState('Operating Instructions');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [uploadStep, setUploadStep] = useState(-1);
  const [uploadError, setUploadError] = useState('');
  const [uploadResult, setUploadResult] = useState(null);

  if (!isOpen) return null;

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    setUploadError('');

    try {
      setDetecting(true);
      const fd = new FormData();
      fd.append('file', selectedFile);
      const data = await detectMetadata(fd);
      if (data?.detected_metadata) {
        const meta = data.detected_metadata;
        if (meta.manufacturer && meta.manufacturer !== 'Industrial OEM') {
          setManufacturer(meta.manufacturer);
        }
        if (meta.machine_name && meta.machine_name !== 'Industrial Machine' && !machineName) {
          setMachineName(meta.machine_name);
        }
        if (meta.model && meta.model !== 'Standard' && !model) {
          setModel(meta.model);
        }
      }
    } catch (err) {
      console.log('Metadata auto-detect info:', err);
    } finally {
      setDetecting(false);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!file || !machineName || !model) {
      setUploadError('Manufacturer, Machine / Product, Model Code, and PDF file are required.');
      return;
    }

    setUploading(true);
    setUploadError('');
    setUploadResult(null);

    // Simulate step progression while upload is in-flight
    const stepDelays = [0, 800, 1600, 2400, 3200, 4200];
    stepDelays.forEach((delay, idx) => {
      setTimeout(() => setUploadStep(idx), delay);
    });

    const formData = new FormData();
    formData.append('file', file);
    formData.append('manufacturer', manufacturer || 'Industrial OEM');
    formData.append('machine_name', machineName);
    formData.append('model', model);
    formData.append('manufacturing_year', manufacturingYear || '2021');
    formData.append('firmware', firmware || 'Standard');
    formData.append('manual_type', manualType || 'Operating Instructions');

    try {
      const res = await uploadDocument(formData);
      setUploadStep(6); // "Ready"
      setUploading(false);
      setUploadResult(res);

      setTimeout(() => {
        onClose();
        setMachineName('');
        setModel('');
        setFile(null);
        setUploadResult(null);
        setUploadStep(-1);
        onUploadSuccess && onUploadSuccess();
      }, 1400);
    } catch (err) {
      setUploading(false);
      setUploadStep(-1);
      setUploadError(err.message || 'Failed to upload manual');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 font-sans">
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between bg-white">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center font-bold">
              <Upload size={18} />
            </div>
            <div>
              <h3 className="font-bold text-[#0F172A] text-base tracking-tight">Upload Machine Manual PDF</h3>
              <p className="text-[11px] text-[#64748B] font-medium">Ingest OEM manual to extract specs, error codes & evidence.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleUploadSubmit} className="p-6 space-y-4">
          {uploadError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center space-x-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          {uploadResult && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center space-x-2">
              <CheckCircle size={18} className="text-emerald-600 shrink-0" />
              <div>
                <div>Manual ingested and indexed successfully!</div>
                <div className="text-[11px] font-normal text-emerald-700 mt-0.5">
                  {uploadResult.chunks_indexed} chunks ready for instant troubleshooting.
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                Manufacturer <span className="text-red-500">*</span>
              </label>
              <select
                value={manufacturer}
                onChange={(e) => setManufacturer(e.target.value)}
                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs text-[#0F172A] font-medium outline-none focus:border-[#2563EB] focus:bg-white transition"
              >
                <option value="Siemens">Siemens</option>
                <option value="Caterpillar">Caterpillar</option>
                <option value="KUKA Systems">KUKA Systems</option>
                <option value="Fanuc Automation">Fanuc Automation</option>
                <option value="ABB">ABB</option>
                <option value="Atlas Copco">Atlas Copco</option>
                <option value="Schneider Electric">Schneider Electric</option>
                <option value="Bosch Rexroth">Bosch Rexroth</option>
                <option value="Mitsubishi Electric">Mitsubishi Electric</option>
                <option value="Rockwell Automation">Rockwell Automation</option>
                <option value="Other">Other / Custom</option>
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
                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs text-[#0F172A] font-medium outline-none focus:border-[#2563EB] focus:bg-white transition"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                Model Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. CU240B/E-2"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs text-[#0F172A] font-medium outline-none focus:border-[#2563EB] focus:bg-white transition"
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
                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs text-[#0F172A] font-medium outline-none focus:border-[#2563EB] focus:bg-white transition"
              >
                {[2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016].map(y => (
                  <option key={y} value={String(y)}>{y}</option>
                ))}
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
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs text-[#0F172A] font-medium outline-none focus:border-[#2563EB] focus:bg-white transition"
            >
              <option value="Operating Instructions">Operating Instructions</option>
              <option value="Maintenance Manual">Maintenance Manual</option>
              <option value="Safety Instructions">Safety Instructions</option>
              <option value="Technical Manual">Technical Manual</option>
              <option value="Fault Code Reference">Fault Code Reference</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#0F172A] mb-1">
              PDF Manual File <span className="text-red-500">*</span>
            </label>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="w-full text-xs text-gray-600 file:mr-3 file:py-2 file:px-3.5 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-[#2563EB] hover:file:bg-blue-100 cursor-pointer border border-[#E2E8F0] rounded-xl bg-[#F8FAFC] p-1.5"
              required
            />
            {detecting && (
              <div className="mt-1 text-[11px] text-[#2563EB] font-medium flex items-center space-x-1">
                <RefreshCw size={12} className="animate-spin mr-1" /> Auto-detecting PDF metadata...
              </div>
            )}
            {file && !detecting && (
              <div className="mt-1 text-[11px] text-[#64748B] font-mono flex items-center space-x-1">
                <FileText size={11} />
                <span>{file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)</span>
              </div>
            )}
          </div>

          {/* 7-Step Progress Tracker */}
          {uploading && uploadStep >= 0 && (
            <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-100 space-y-1.5">
              <div className="text-[11px] font-bold text-[#1D4ED8] mb-2 uppercase tracking-wider">Ingestion Pipeline</div>
              {UPLOAD_STEPS.map((stepLabel, idx) => {
                const isDone = idx < uploadStep;
                const isCurrent = idx === uploadStep;
                const isPending = idx > uploadStep;
                return (
                  <div key={idx} className={`flex items-center space-x-2 text-[11px] font-medium ${isDone ? 'text-emerald-600' : isCurrent ? 'text-[#2563EB]' : 'text-slate-400'}`}>
                    {isDone ? (
                      <CheckCircle size={13} className="text-emerald-500 shrink-0" />
                    ) : isCurrent ? (
                      <RefreshCw size={13} className="animate-spin shrink-0" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />
                    )}
                    <span>{stepLabel}</span>
                  </div>
                );
              })}
            </div>
          )}

          <div className="pt-3 flex items-center justify-end space-x-2 border-t border-[#E2E8F0]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-white border border-[#E2E8F0] text-[#0F172A] text-xs font-semibold hover:bg-gray-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading || !file}
              className="px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-xs flex items-center space-x-1.5 disabled:opacity-50 transition cursor-pointer shadow-xs uppercase tracking-wider"
            >
              {uploading ? <RefreshCw size={14} className="animate-spin" /> : <Upload size={14} />}
              <span>INGEST MANUAL</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { X, Camera, Scan, CheckCircle, Upload, AlertCircle, RefreshCw } from 'lucide-react';

export default function PhotoUploadModal({ onExtractCode, onClose }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [extractedData, setExtractedData] = useState(null);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
      setExtractedData(null);
    }
  };

  const handleScan = () => {
    if (!file) return;
    setScanning(true);

    // Simulate OCR extraction from photo
    setTimeout(() => {
      setScanning(false);
      setExtractedData({
        detected_model: "Caterpillar C15 Generator",
        detected_code: "E101",
        confidence: "94% Visual Match"
      });
    }, 1200);
  };

  const handleConfirm = () => {
    if (extractedData) {
      onExtractCode(extractedData.detected_code, extractedData.detected_model);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative border border-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-600/30">
              <Camera size={18} />
            </div>
            <h2 className="text-sm font-extrabold text-slate-900">Identify from Photo / Camera</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl font-bold">
            <X size={20} />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {!preview ? (
            <div className="border-2 border-dashed border-slate-200 rounded-3xl p-8 text-center space-y-3 bg-slate-50">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <Camera size={24} />
              </div>
              <p className="text-xs font-bold text-slate-700">Upload Photo of Machine Display or Nameplate</p>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-extrabold file:bg-blue-600 file:text-white cursor-pointer"
              />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative rounded-2xl overflow-hidden max-h-48 border border-slate-200 bg-slate-900 flex items-center justify-center">
                <img src={preview} alt="Upload preview" className="max-h-48 object-contain" />
              </div>

              {!extractedData && (
                <button
                  onClick={handleScan}
                  disabled={scanning}
                  className="w-full py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition shadow-md shadow-blue-600/30"
                >
                  {scanning ? (
                    <>
                      <RefreshCw size={15} className="animate-spin" />
                      <span>Scanning Photo...</span>
                    </>
                  ) : (
                    <>
                      <Scan size={15} />
                      <span>Scan Photo for Error Code</span>
                    </>
                  )}
                </button>
              )}

              {extractedData && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs space-y-2">
                  <div className="font-extrabold text-emerald-900 flex items-center">
                    <CheckCircle size={16} className="mr-1.5 text-emerald-600" />
                    OCR Extraction Result ({extractedData.confidence})
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-slate-800 font-mono text-[11px] pt-1">
                    <div>Detected Machine: <strong>{extractedData.detected_model}</strong></div>
                    <div>Detected Code: <strong>{extractedData.detected_code}</strong></div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="pt-2 flex items-center justify-end space-x-2">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-full bg-slate-100 text-slate-700 font-extrabold text-xs uppercase"
            >
              Cancel
            </button>
            {extractedData && (
              <button
                onClick={handleConfirm}
                className="px-6 py-2.5 rounded-full bg-blue-600 text-white font-extrabold text-xs uppercase shadow-md shadow-blue-600/30"
              >
                Troubleshoot Code
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

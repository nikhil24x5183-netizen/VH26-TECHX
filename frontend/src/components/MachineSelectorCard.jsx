import React, { useState } from 'react';
import { Cpu, CheckCircle, ArrowRight, Layers, Calendar, Wrench, Sparkles, Building2 } from 'lucide-react';

export default function MachineSelectorCard({ onSelectMachine, machines = [] }) {
  const [manufacturer, setManufacturer] = useState('Siemens');
  const [machineName, setMachineName] = useState('SINAMICS G120');
  const [model, setModel] = useState('CU240B/E-2');
  const [year, setYear] = useState('2021');
  const [firmware, setFirmware] = useState('');
  const [manualType, setManualType] = useState('Operating Instructions');

  const presetMachines = [
    { manufacturer: 'Siemens', machine: 'SINAMICS G120', model: 'CU240B/E-2', year: '2021', icon: '⚡' },
    { manufacturer: 'Caterpillar', machine: 'Caterpillar C15 Generator', model: 'C15-500kVA', year: '2020', icon: '🔋' },
    { manufacturer: 'Siemens', machine: 'Siemens S7-1500 PLC', model: 'CPU 1516-3 PN/DP', year: '2022', icon: '⚙️' },
    { manufacturer: 'KUKA Systems', machine: 'KUKA KR 210 Robot', model: 'KR 210 R2700-2', year: '2023', icon: '🤖' },
    { manufacturer: 'Fanuc Automation', machine: 'Fanuc Robodrill CNC', model: 'α-D21MiB5', year: '2021', icon: '🛠️' }
  ];

  const handlePresetClick = (preset) => {
    setManufacturer(preset.manufacturer);
    setMachineName(preset.machine);
    setModel(preset.model);
    setYear(preset.year);
    onSelectMachine({
      manufacturer: preset.manufacturer,
      machine_name: preset.machine,
      model: preset.model,
      manufacturing_year: preset.year,
      firmware: firmware || 'Standard',
      manual_type: manualType
    });
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!machineName) return;
    onSelectMachine({
      manufacturer: manufacturer || 'Industrial OEM',
      machine_name: machineName,
      model: model || 'Standard',
      manufacturing_year: year || '2021',
      firmware: firmware || 'Standard',
      manual_type: manualType
    });
  };

  return (
    <div className="max-w-2xl mx-auto w-full bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-sm space-y-6">
      <div className="flex items-start space-x-3.5 border-b border-[#F1F5F9] pb-4">
        <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center font-bold shrink-0">
          <Building2 size={22} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-[#0F172A] tracking-tight">Which machine are you troubleshooting?</h2>
          <p className="text-xs text-[#64748B] mt-0.5 font-medium">
            Select your machine specifications first to load verified OEM manual evidence.
          </p>
        </div>
      </div>

      {/* Preset Quick Selection */}
      <div className="space-y-2">
        <span className="text-[11px] font-semibold uppercase text-[#64748B] tracking-wider block">
          Quick Select Ingested OEM Machines:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {presetMachines.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handlePresetClick(p)}
              className="p-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] hover:bg-blue-50/50 hover:border-[#2563EB] transition-all text-left flex items-center justify-between cursor-pointer group"
            >
              <div className="flex items-center space-x-2.5 truncate">
                <span className="text-lg">{p.icon}</span>
                <div className="truncate">
                  <div className="text-xs font-bold text-[#0F172A] group-hover:text-[#2563EB] truncate">{p.machine}</div>
                  <div className="text-[11px] text-[#64748B] font-mono">{p.model} · {p.year}</div>
                </div>
              </div>
              <ArrowRight size={14} className="text-[#2563EB] opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1" />
            </button>
          ))}
        </div>
      </div>

      <div className="relative flex py-1 items-center">
        <div className="flex-grow border-t border-[#E2E8F0]"></div>
        <span className="flex-shrink mx-4 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">OR CUSTOM SPECIFICATION</span>
        <div className="flex-grow border-t border-[#E2E8F0]"></div>
      </div>

      {/* Detailed Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-semibold text-[#0F172A] mb-1">
              Manufacturer <span className="text-red-500">*</span>
            </label>
            <select
              value={manufacturer}
              onChange={(e) => setManufacturer(e.target.value)}
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 py-2 text-xs font-medium text-[#0F172A] outline-none focus:border-[#2563EB]"
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
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 py-2 text-xs font-medium text-[#0F172A] outline-none focus:border-[#2563EB]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#0F172A] mb-1">
              Model Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. CU240B/E-2"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 py-2 text-xs font-medium text-[#0F172A] outline-none focus:border-[#2563EB]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#0F172A] mb-1">
              Manufacturing Year <span className="text-red-500">*</span>
            </label>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 py-2 text-xs font-medium text-[#0F172A] outline-none focus:border-[#2563EB]"
            >
              <option value="2024">2024</option>
              <option value="2023">2023</option>
              <option value="2022">2022</option>
              <option value="2021">2021</option>
              <option value="2020">2020</option>
              <option value="2019">2019</option>
              <option value="2018">2018</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#0F172A] mb-1">
              Firmware / Revision <span className="text-[#64748B] font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. FW v4.7 / Rev 2021"
              value={firmware}
              onChange={(e) => setFirmware(e.target.value)}
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 py-2 text-xs font-medium text-[#0F172A] outline-none focus:border-[#2563EB]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#0F172A] mb-1">
              Manual Type
            </label>
            <select
              value={manualType}
              onChange={(e) => setManualType(e.target.value)}
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 py-2 text-xs font-medium text-[#0F172A] outline-none focus:border-[#2563EB]"
            >
              <option value="Operating Instructions">Operating Instructions</option>
              <option value="Maintenance Manual">Maintenance Manual</option>
              <option value="Safety Instructions">Safety Instructions</option>
              <option value="Technical Manual">Technical Manual</option>
            </select>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition cursor-pointer shadow-xs"
          >
            <span>CONTINUE TO TROUBLESHOOTING</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </form>
    </div>
  );
}

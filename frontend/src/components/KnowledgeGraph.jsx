import React, { useState } from 'react';
import { Cpu, AlertCircle, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

export default function KnowledgeGraph({ machines, onSelectMachine, onAskError }) {
  const [zoom, setZoom] = useState(1);
  const [activeNode, setActiveNode] = useState(null);

  const graphNodes = [
    { id: 'root', label: 'Factory Floor 1', type: 'root', x: 450, y: 65, color: '#2563eb' },
    
    // Real Industrial Machine Nodes
    { id: 'm1', label: 'Siemens S7-1500 PLC', model: 'CPU 1516-3', type: 'machine', x: 130, y: 190, color: '#0284c7' },
    { id: 'm2', label: 'Caterpillar C15 Generator', model: 'C15-500kVA', type: 'machine', x: 340, y: 190, color: '#d97706' },
    { id: 'm3', label: 'KUKA KR 210 Robot', model: 'KR 210 R2700', type: 'machine', x: 560, y: 190, color: '#16a34a' },
    { id: 'm4', label: 'Fanuc Robodrill CNC', model: 'α-D21MiB5', type: 'machine', x: 770, y: 190, color: '#9333ea' },
    
    // Diagnostic Error Sub-Nodes
    { id: 'e301_a', label: 'E301: Profinet Fault', parent: 'm1', type: 'error', x: 130, y: 330, color: '#dc2626' },
    { id: 'e101_b', label: 'E101: High Coolant Temp', parent: 'm2', type: 'error', x: 340, y: 330, color: '#ea580c' },
    { id: 'e101_c', label: 'E101: Motor Overload', parent: 'm3', type: 'error', x: 560, y: 330, color: '#dc2626' },
    { id: 'e202_d', label: 'E202: Spindle Overload', parent: 'm4', type: 'error', x: 770, y: 330, color: '#d946ef' }
  ];

  const links = [
    { from: 'root', to: 'm1' },
    { from: 'root', to: 'm2' },
    { from: 'root', to: 'm3' },
    { from: 'root', to: 'm4' },
    { from: 'm1', to: 'e301_a' },
    { from: 'm2', to: 'e101_b' },
    { from: 'm3', to: 'e101_c' },
    { from: 'm4', to: 'e202_d' }
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 text-slate-900 overflow-hidden select-none">
      {/* Control Bar */}
      <div className="px-5 py-3 bg-white border-b border-slate-200 flex items-center justify-between shadow-2xs">
        <div className="flex items-center space-x-2">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 mr-1">LAYOUT:</span>
          <button className="px-3 py-1 rounded-full bg-blue-600 text-white font-extrabold text-xs shadow-xs">
            TREE GRAPH
          </button>
          <button className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 text-xs font-bold">
            RADIAL
          </button>
          <button className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 text-xs font-bold">
            HIERARCHY
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button onClick={() => setZoom(z => Math.min(z + 0.15, 1.5))} className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700">
            <ZoomIn size={14} />
          </button>
          <button onClick={() => setZoom(z => Math.max(z - 0.15, 0.6))} className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700">
            <ZoomOut size={14} />
          </button>
          <button onClick={() => setZoom(1)} className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700">
            <Maximize2 size={14} />
          </button>
        </div>
      </div>

      {/* Graph Visual Area */}
      <div className="flex-1 relative overflow-auto bg-slate-50 flex items-center justify-center p-6">
        <div style={{ transform: `scale(${zoom})`, transformOrigin: 'center center', transition: 'transform 0.2s ease-out' }} className="relative w-[920px] h-[430px]">
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {links.map((link, idx) => {
              const source = graphNodes.find(n => n.id === link.from);
              const target = graphNodes.find(n => n.id === link.to);
              if (!source || !target) return null;
              return (
                <line
                  key={idx}
                  x1={source.x}
                  y1={source.y}
                  x2={target.x}
                  y2={target.y}
                  stroke="#cbd5e1"
                  strokeWidth="2"
                  strokeDasharray={target.type === 'error' ? "3 3" : "none"}
                />
              );
            })}
          </svg>

          {graphNodes.map((node) => (
            <div
              key={node.id}
              onClick={() => {
                setActiveNode(node);
                if (node.type === 'machine') onSelectMachine(node.label);
                else if (node.type === 'error') onAskError(node.label.split(':')[0].trim());
              }}
              style={{ left: `${node.x - 75}px`, top: `${node.y - 25}px` }}
              className={`absolute w-[150px] p-3 rounded-2xl border bg-white shadow-xs transition-all cursor-pointer text-center ${
                activeNode?.id === node.id
                  ? 'border-blue-600 ring-2 ring-blue-500/20 scale-105 z-20 shadow-md'
                  : 'border-slate-200 hover:border-blue-400 hover:shadow-md z-10'
              }`}
            >
              <div className="w-4 h-4 rounded-full mx-auto mb-1 flex items-center justify-center text-[10px] font-extrabold text-white" style={{ backgroundColor: node.color }}>
                {node.type === 'root' ? '★' : node.type === 'machine' ? '⚙' : '!'}
              </div>
              <div className="font-extrabold text-xs text-slate-900 truncate">{node.label}</div>
              {node.model && <div className="text-[10px] font-mono text-slate-500 font-bold">{node.model}</div>}
              <div className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400 mt-0.5">
                [{node.type.toUpperCase()}]
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Node Action Drawer */}
      {activeNode && (
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-white shadow-xs" style={{ backgroundColor: activeNode.color }}>
              {activeNode.type === 'machine' ? <Cpu size={20} /> : <AlertCircle size={20} />}
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-slate-900">{activeNode.label}</h4>
              <p className="text-xs text-slate-500 font-mono font-medium">{activeNode.model ? `Model: ${activeNode.model}` : `Type: ${activeNode.type}`}</p>
            </div>
          </div>
          <div>
            {activeNode.type === 'machine' && (
              <button
                onClick={() => onSelectMachine(activeNode.label)}
                className="px-5 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider shadow-md shadow-blue-600/30"
              >
                SELECT MACHINE
              </button>
            )}
            {activeNode.type === 'error' && (
              <button
                onClick={() => onAskError(activeNode.label.split(':')[0].trim())}
                className="px-5 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider shadow-md shadow-blue-600/30"
              >
                TROUBLESHOOT ERROR
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

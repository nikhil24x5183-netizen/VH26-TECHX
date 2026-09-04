import React, { useState } from 'react';
import { Cpu, AlertCircle, ZoomIn, ZoomOut, Maximize2, RefreshCw } from 'lucide-react';

export default function KnowledgeGraph({ machines, onSelectMachine, onAskError }) {
  const [zoom, setZoom] = useState(1);
  const [activeNode, setActiveNode] = useState(null);

  const graphNodes = [
    { id: 'root', label: 'Factory Floor 1', type: 'root', x: 450, y: 70, color: '#3b82f6' },
    { id: 'm1', label: 'Atlas Compressor X100', model: 'X100-v2', type: 'machine', x: 200, y: 200, color: '#f59e0b', error: 'E101' },
    { id: 'm2', label: 'Titan Press H200', model: 'H200-Ind', type: 'machine', x: 450, y: 200, color: '#10b981', error: 'E101' },
    { id: 'm3', label: 'Precision Lathe L300', model: 'L300-CNC', type: 'machine', x: 700, y: 200, color: '#8b5cf6', error: 'E202' },
    
    { id: 'e101_a', label: 'E101: Motor Overheat', parent: 'm1', type: 'error', x: 130, y: 340, color: '#ef4444' },
    { id: 'e102_a', label: 'E102: High Pressure', parent: 'm1', type: 'error', x: 280, y: 340, color: '#f97316' },

    { id: 'e101_b', label: 'E101: Low Pressure', parent: 'm2', type: 'error', x: 450, y: 340, color: '#ef4444' },

    { id: 'e202_c', label: 'E202: Spindle Jam', parent: 'm3', type: 'error', x: 700, y: 340, color: '#ec4899' }
  ];

  const links = [
    { from: 'root', to: 'm1' },
    { from: 'root', to: 'm2' },
    { from: 'root', to: 'm3' },
    { from: 'm1', to: 'e101_a' },
    { from: 'm1', to: 'e102_a' },
    { from: 'm2', to: 'e101_b' },
    { from: 'm3', to: 'e202_c' }
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 text-slate-900 overflow-hidden select-none">
      {/* Control Bar */}
      <div className="px-5 py-3 bg-white border-b border-slate-200 flex items-center justify-between shadow-xs">
        <div className="flex items-center space-x-2">
          <span className="text-[11px] font-bold uppercase text-slate-400 mr-1">LAYOUT:</span>
          <button className="px-3 py-1 rounded-lg bg-blue-600 text-white font-bold text-xs shadow-xs">
            Tree (Root Top)
          </button>
          <button className="px-3 py-1 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 text-xs font-semibold">
            Radial
          </button>
          <button className="px-3 py-1 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 text-xs font-semibold">
            Hierarchy
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

      {/* Graph Area */}
      <div className="flex-1 relative overflow-auto bg-slate-50 flex items-center justify-center p-6">
        <div style={{ transform: `scale(${zoom})`, transformOrigin: 'center center', transition: 'transform 0.2s ease-out' }} className="relative w-[900px] h-[440px]">
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
              className={`absolute w-[150px] p-2.5 rounded-xl border bg-white shadow-sm transition-all cursor-pointer text-center ${
                activeNode?.id === node.id
                  ? 'border-blue-600 ring-2 ring-blue-500/20 scale-105 z-20'
                  : 'border-slate-200 hover:border-blue-400 hover:shadow-md z-10'
              }`}
            >
              <div className="w-3.5 h-3.5 rounded-full mx-auto mb-1 flex items-center justify-center text-[9px] font-bold text-white" style={{ backgroundColor: node.color }}>
                {node.type === 'root' ? '★' : node.type === 'machine' ? '⚙' : '!'}
              </div>
              <div className="font-bold text-xs text-slate-900 truncate">{node.label}</div>
              {node.model && <div className="text-[10px] font-mono text-slate-500">{node.model}</div>}
              <div className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400 mt-0.5">
                [{node.type.toUpperCase()}]
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Action Drawer */}
      {activeNode && (
        <div className="p-3.5 bg-white border-t border-slate-200 flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white" style={{ backgroundColor: activeNode.color }}>
              {activeNode.type === 'machine' ? <Cpu size={18} /> : <AlertCircle size={18} />}
            </div>
            <div>
              <h4 className="font-bold text-xs text-slate-900">{activeNode.label}</h4>
              <p className="text-[11px] text-slate-500 font-mono">{activeNode.model ? `Model: ${activeNode.model}` : `Type: ${activeNode.type}`}</p>
            </div>
          </div>
          <div>
            {activeNode.type === 'machine' && (
              <button
                onClick={() => onSelectMachine(activeNode.label)}
                className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs"
              >
                Focus Machine
              </button>
            )}
            {activeNode.type === 'error' && (
              <button
                onClick={() => onAskError(activeNode.label.split(':')[0].trim())}
                className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs"
              >
                Troubleshoot Code
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

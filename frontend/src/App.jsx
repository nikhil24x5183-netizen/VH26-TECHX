import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import KnowledgeGraph from './components/KnowledgeGraph';
import { Key, Cpu, Search, Layers, Network, MessageSquare, ChevronRight, X } from 'lucide-react';

export default function App() {
  const [machines, setMachines] = useState([]);
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [messages, setMessages] = useState([]);
  const [apiKey, setApiKey] = useState(localStorage.getItem('maint_ai_gemini_key') || '');
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [backendHealth, setBackendHealth] = useState('checking');
  const [viewMode, setViewMode] = useState('chat');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchMachines = async () => {
    try {
      const res = await fetch('/api/machines');
      if (res.ok) {
        const data = await res.json();
        setMachines(data.machines || []);
        setBackendHealth('online');
      } else {
        setBackendHealth('offline');
      }
    } catch (err) {
      console.error('Failed to fetch machines:', err);
      setBackendHealth('offline');
    }
  };

  useEffect(() => {
    fetchMachines();
  }, []);

  const handleSaveApiKey = (key) => {
    setApiKey(key);
    localStorage.setItem('maint_ai_gemini_key', key);
    setShowKeyModal(false);
  };

  const handleSendMessage = async (text) => {
    const userMsg = {
      sender: 'user',
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { 'X-API-Key': apiKey } : {})
        },
        body: JSON.stringify({
          question: text,
          selected_machine: selectedMachine,
          api_key: apiKey || null
        })
      });

      if (!res.ok) throw new Error('API request failed');

      const data = await res.json();

      const aiMsg = {
        sender: 'ai',
        text: data.answer,
        citations: data.citations || [],
        ambiguity: data.ambiguity || null,
        insufficient_info: data.insufficient_info || false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: 'Communication Error: Backend API unreachable.',
          citations: [],
          ambiguity: null,
          insufficient_info: true,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => setMessages([]);

  const handleResetDatabase = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/reset', { method: 'POST' });
      if (res.ok) {
        await fetchMachines();
        setMessages([]);
      }
    } catch (err) {
      console.error('Reset error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMachine = async (fileId) => {
    try {
      const res = await fetch(`/api/machines/${fileId}`, { method: 'DELETE' });
      if (res.ok) fetchMachines();
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setViewMode('chat');
      handleSendMessage(searchQuery.trim());
      setSearchQuery('');
    }
  };

  const activeMachineObj = machines.find(m => m.machine_name === selectedMachine) || {
    machine_name: selectedMachine || 'All Machines',
    model: selectedMachine ? 'Selected Scope' : 'Auto-Detect'
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-50 text-slate-900 overflow-hidden font-sans">
      {/* 1. Header Bar */}
      <header className="h-13 border-b border-slate-200 bg-white px-5 flex items-center justify-between z-20 select-none shadow-2xs">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex items-center">
          <div className="relative w-64 sm:w-80">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search error code or manual..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-full pl-9 pr-3 py-1 text-xs text-slate-900 placeholder-slate-400 font-medium focus:border-blue-500 outline-none"
            />
          </div>
        </form>

        {/* Center Case Stats */}
        <div className="hidden md:flex items-center space-x-3 text-xs font-mono font-bold">
          <span className="text-slate-400">CASE: <strong className="text-blue-600">TRX-2026-017</strong></span>
          <span className="text-slate-300">•</span>
          <span className="text-slate-400">SCOPE: <strong className="text-slate-800 uppercase">{activeMachineObj.machine_name}</strong></span>
          <span className="text-slate-300">•</span>
          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-[10px] uppercase">
            STATUS: {backendHealth.toUpperCase()}
          </span>
        </div>

        {/* Right Scope & Config */}
        <div className="flex items-center space-x-2">
          <select
            value={selectedMachine || 'all'}
            onChange={(e) => setSelectedMachine(e.target.value === 'all' ? null : e.target.value)}
            className="bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold rounded-lg px-2.5 py-1 focus:border-blue-500 outline-none cursor-pointer"
          >
            <option value="all">⚡ All Machines Scope</option>
            {machines.map((m, idx) => (
              <option key={idx} value={m.machine_name}>
                ⚙️ {m.machine_name} ({m.model})
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowKeyModal(true)}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 transition"
            title="API Key"
          >
            <Key size={14} className={apiKey ? "text-emerald-600" : "text-slate-500"} />
          </button>
        </div>
      </header>

      {/* 2. Breadcrumb & View Segment Control Bar */}
      <div className="bg-white border-b border-slate-200 px-5 py-2 flex items-center justify-between text-xs select-none">
        <div className="flex items-center space-x-2 text-slate-400 font-mono font-semibold text-[11px]">
          <span>MaintAI</span>
          <ChevronRight size={11} />
          <span>TRX-2026-017</span>
          <ChevronRight size={11} />
          <span className="text-slate-800 font-bold uppercase">{activeMachineObj.machine_name}</span>
        </div>

        {/* Segment Switcher */}
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => setViewMode('chat')}
            className={`px-3 py-1 rounded-md text-xs font-bold flex items-center space-x-1.5 transition ${
              viewMode === 'chat'
                ? 'bg-white text-blue-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageSquare size={13} />
            <span>Chat</span>
          </button>
          <button
            onClick={() => setViewMode('graph')}
            className={`px-3 py-1 rounded-md text-xs font-bold flex items-center space-x-1.5 transition ${
              viewMode === 'graph'
                ? 'bg-white text-blue-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Network size={13} />
            <span>Knowledge Graph</span>
          </button>
        </div>
      </div>

      {/* 3. Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          machines={machines}
          selectedMachine={selectedMachine}
          onSelectMachine={setSelectedMachine}
          onUploadSuccess={fetchMachines}
          onDeleteMachine={handleDeleteMachine}
          onResetDatabase={handleResetDatabase}
          isLoading={isLoading}
        />

        {viewMode === 'chat' ? (
          <ChatInterface
            messages={messages}
            onSendMessage={handleSendMessage}
            onClearChat={handleClearChat}
            onSelectMachine={setSelectedMachine}
            selectedMachine={selectedMachine}
            isLoading={isLoading}
          />
        ) : (
          <KnowledgeGraph
            machines={machines}
            onSelectMachine={(mName) => {
              setSelectedMachine(mName);
              setViewMode('chat');
            }}
            onAskError={(errCode) => {
              setViewMode('chat');
              handleSendMessage(`What is ${errCode}?`);
            }}
          />
        )}
      </div>

      {/* API Key Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full p-5 shadow-xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-xs font-bold text-slate-900 flex items-center">
                <Key size={14} className="mr-1.5 text-blue-600" /> Gemini API Key
              </h2>
              <button onClick={() => setShowKeyModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>

            <div className="mt-3 space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">API Key</label>
                <input
                  type="password"
                  placeholder="AIzaSy..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-mono outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  onClick={() => handleSaveApiKey('')}
                  className="px-3 py-1 rounded-lg text-xs font-bold text-slate-500 hover:text-red-600"
                >
                  Clear
                </button>
                <button
                  onClick={() => handleSaveApiKey(apiKey)}
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-2xs"
                >
                  Save Key
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

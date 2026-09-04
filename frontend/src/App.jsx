import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import KnowledgeGraph from './components/KnowledgeGraph';
import ManualLibrary from './components/ManualLibrary';
import AdminDashboard from './components/AdminDashboard';
import EvaluationDashboard from './components/EvaluationDashboard';
import LandingDashboard from './components/LandingDashboard';
import PDFViewerModal from './components/PDFViewerModal';
import WhyThisAnswerModal from './components/WhyThisAnswerModal';
import PhotoUploadModal from './components/PhotoUploadModal';
import { Key, Cpu, Search, Network, MessageSquare, ChevronRight, X, FileText, Server, Award, Camera, Mic, Globe } from 'lucide-react';

export default function App() {
  const [machines, setMachines] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [messages, setMessages] = useState([]);
  const [apiKey, setApiKey] = useState(localStorage.getItem('maint_ai_gemini_key') || '');
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [backendHealth, setBackendHealth] = useState('checking');
  const [activeTab, setActiveTab] = useState('technician'); // 'technician' | 'library' | 'admin' | 'evaluation'
  const [viewMode, setViewMode] = useState('chat'); // 'chat' | 'graph'
  const [searchQuery, setSearchQuery] = useState('');
  const [lastContext, setLastContext] = useState(null);

  // Modals
  const [pdfPreviewCitation, setPdfPreviewCitation] = useState(null);
  const [whyAnswerMessage, setWhyAnswerMessage] = useState(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [language, setLanguage] = useState('en'); // 'en' | 'hi'

  const fetchMachinesAndDocs = async () => {
    try {
      const [mRes, dRes] = await Promise.all([
        fetch('/api/machines'),
        fetch('/api/documents')
      ]);
      if (mRes.ok) {
        const data = await mRes.json();
        setMachines(data.machines || []);
        setBackendHealth('online');
      }
      if (dRes.ok) {
        const dData = await dRes.json();
        setDocuments(dData.documents || []);
      }
    } catch (err) {
      console.error('Failed to fetch machines/docs:', err);
      setBackendHealth('offline');
    }
  };

  useEffect(() => {
    fetchMachinesAndDocs();
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
          api_key: apiKey || null,
          previous_context: lastContext
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
        confidence_score: data.confidence_score || null,
        confidence_label: data.confidence_label || null,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, aiMsg]);
      setLastContext({
        last_question: text,
        last_machine: selectedMachine || (data.citations?.[0]?.machine_name) || ""
      });
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
          confidence_score: 0.0,
          confidence_label: "API Error",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setLastContext(null);
  };

  const handleResetDatabase = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/reset', { method: 'POST' });
      if (res.ok) {
        await fetchMachinesAndDocs();
        setMessages([]);
        setLastContext(null);
      }
    } catch (err) {
      console.error('Reset error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMachine = async (fileId) => {
    try {
      const res = await fetch(`/api/documents/${fileId}`, { method: 'DELETE' });
      if (res.ok) fetchMachinesAndDocs();
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setActiveTab('technician');
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
    <div className="flex flex-col h-screen w-screen bg-slate-50 text-slate-900 overflow-hidden font-sans select-none">
      {/* 1. Header Navigation Bar */}
      <header className="h-14 border-b border-slate-200 bg-white px-5 flex items-center justify-between z-20 shadow-2xs">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex items-center">
          <div className="relative w-60 sm:w-72">
            <Search size={14} className="absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search error code or manual..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-full pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 font-medium focus:border-blue-500 outline-none"
            />
          </div>
        </form>

        {/* Center Navigation Pages Tabs */}
        <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200 font-extrabold text-xs">
          <button
            onClick={() => setActiveTab('technician')}
            className={`px-4 py-1.5 rounded-xl flex items-center space-x-1.5 transition ${
              activeTab === 'technician' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Cpu size={14} />
            <span>Technician Mode</span>
          </button>
          <button
            onClick={() => setActiveTab('library')}
            className={`px-4 py-1.5 rounded-xl flex items-center space-x-1.5 transition ${
              activeTab === 'library' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText size={14} />
            <span>Manual Library</span>
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            className={`px-4 py-1.5 rounded-xl flex items-center space-x-1.5 transition ${
              activeTab === 'admin' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Server size={14} />
            <span>Admin Pipeline</span>
          </button>
          <button
            onClick={() => setActiveTab('evaluation')}
            className={`px-4 py-1.5 rounded-xl flex items-center space-x-1.5 transition ${
              activeTab === 'evaluation' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Award size={14} />
            <span>Judge Evaluation</span>
          </button>
        </div>

        {/* Right Tools & Config */}
        <div className="flex items-center space-x-2">
          {/* Photo Scanner Button */}
          <button
            onClick={() => setShowPhotoModal(true)}
            className="p-2 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-bold flex items-center space-x-1 transition"
            title="Scan Photo of Code"
          >
            <Camera size={15} />
          </button>

          {/* Language Switcher */}
          <button
            onClick={() => setLanguage(l => l === 'en' ? 'hi' : 'en')}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-bold flex items-center space-x-1 transition"
            title="Toggle Language (English / Hindi)"
          >
            <Globe size={15} />
            <span className="font-mono text-[11px] uppercase">{language}</span>
          </button>

          <button
            onClick={() => setShowKeyModal(true)}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 transition"
            title="API Key"
          >
            <Key size={15} className={apiKey ? "text-emerald-600" : "text-slate-500"} />
          </button>
        </div>
      </header>

      {/* 2. Top Product Landing Overview */}
      <LandingDashboard
        onStartChat={() => setActiveTab('technician')}
        onOpenLibrary={() => setActiveTab('library')}
      />

      {/* 3. Main Workspace Pages */}
      <div className="flex-1 flex overflow-hidden">
        {activeTab === 'technician' && (
          <>
            <Sidebar
              machines={machines}
              selectedMachine={selectedMachine}
              onSelectMachine={setSelectedMachine}
              onUploadSuccess={fetchMachinesAndDocs}
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
          </>
        )}

        {activeTab === 'library' && (
          <ManualLibrary
            documents={documents}
            onUploadNew={() => {
              setActiveTab('technician');
            }}
            onDeleteDocument={handleDeleteMachine}
            onReindex={handleResetDatabase}
          />
        )}

        {activeTab === 'admin' && (
          <AdminDashboard
            documents={documents}
            onReset={handleResetDatabase}
          />
        )}

        {activeTab === 'evaluation' && (
          <EvaluationDashboard />
        )}
      </div>

      {/* MODALS */}
      {pdfPreviewCitation && (
        <PDFViewerModal
          citation={pdfPreviewCitation}
          onClose={() => setPdfPreviewCitation(null)}
        />
      )}

      {whyAnswerMessage && (
        <WhyThisAnswerModal
          message={whyAnswerMessage}
          onClose={() => setWhyAnswerMessage(null)}
        />
      )}

      {showPhotoModal && (
        <PhotoUploadModal
          onExtractCode={(code, model) => {
            if (model) setSelectedMachine(model);
            handleSendMessage(`What is error ${code}?`);
          }}
          onClose={() => setShowPhotoModal(false)}
        />
      )}

      {/* API Key Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-6 shadow-xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-xs font-extrabold text-slate-900 flex items-center">
                <Key size={14} className="mr-1.5 text-blue-600" /> Gemini API Key
              </h2>
              <button onClick={() => setShowKeyModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">API Key</label>
                <input
                  type="password"
                  placeholder="AIzaSy..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-900 font-mono outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  onClick={() => handleSaveApiKey('')}
                  className="px-4 py-2 rounded-full text-xs font-extrabold text-slate-500 hover:text-red-600"
                >
                  Clear
                </button>
                <button
                  onClick={() => handleSaveApiKey(apiKey)}
                  className="px-6 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase shadow-md shadow-blue-600/30"
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

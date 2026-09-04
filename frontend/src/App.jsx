import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import KnowledgeGraph from './components/KnowledgeGraph';
import ManualLibrary from './components/ManualLibrary';
import AdminDashboard from './components/AdminDashboard';
import EvaluationDashboard from './components/EvaluationDashboard';
import RightEvidencePanel from './components/RightEvidencePanel';
import PDFViewerModal from './components/PDFViewerModal';
import WhyThisAnswerModal from './components/WhyThisAnswerModal';
import PhotoUploadModal from './components/PhotoUploadModal';
import { Key, Cpu, Search, Server, Award, Camera, Globe, FileText, X, AlertCircle, Settings, RefreshCw } from 'lucide-react';

import { getMachines, resetDatabase, getHealth, getStats } from './api/machines';
import { getDocuments, deleteDocument } from './api/documents';
import { sendChatMessage } from './api/chat';

export default function App() {
  const [machines, setMachines] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [stats, setStats] = useState(null);
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [messages, setMessages] = useState([]);
  const [apiKey, setApiKey] = useState(localStorage.getItem('maint_ai_gemini_key') || '');
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [backendHealth, setBackendHealth] = useState('checking');
  const [activeTab, setActiveTab] = useState('technician'); // 'technician' | 'machines' | 'library' | 'admin' | 'settings'
  const [lastContext, setLastContext] = useState(null);

  // Evidence Drawer & Modals
  const [selectedCitation, setSelectedCitation] = useState(null);
  const [pdfPreviewCitation, setPdfPreviewCitation] = useState(null);
  const [whyAnswerMessage, setWhyAnswerMessage] = useState(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  const fetchMachinesAndDocs = async () => {
    try {
      const [mRes, dRes, sRes] = await Promise.all([
        getMachines(),
        getDocuments(),
        getStats()
      ]);
      setMachines(mRes.machines || []);
      setDocuments(dRes.documents || []);
      setStats(sRes || null);
      setBackendHealth('online');
    } catch (err) {
      console.error('Failed to fetch machines/docs/stats:', err);
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
      const data = await sendChatMessage({
        question: text,
        selected_machine: selectedMachine,
        api_key: apiKey || null,
        previous_context: lastContext
      });

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
          text: `Communication Error: ${err.message || 'Backend API unreachable.'}`,
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
    setSelectedCitation(null);
  };

  const handleResetDatabase = async () => {
    setIsLoading(true);
    try {
      await resetDatabase();
      await fetchMachinesAndDocs();
      setMessages([]);
      setLastContext(null);
      setSelectedCitation(null);
    } catch (err) {
      console.error('Reset error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMachine = async (fileId) => {
    try {
      await deleteDocument(fileId);
      fetchMachinesAndDocs();
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  return (
    <div className="flex h-screen w-screen bg-[#F7F9FC] text-[#111827] overflow-hidden font-sans">
      {/* 1. Left Minimal Sidebar */}
      <Sidebar
        machines={machines}
        selectedMachine={selectedMachine}
        onSelectMachine={setSelectedMachine}
        onUploadSuccess={fetchMachinesAndDocs}
        activeTab={activeTab}
        onNavigateTab={setActiveTab}
        onOpenKeyModal={() => setShowKeyModal(true)}
        isLoading={isLoading}
      />

      {/* 2. Main Workspace Area */}
      <main className="flex-1 flex overflow-hidden">
        {activeTab === 'technician' && (
          <ChatInterface
            messages={messages}
            onSendMessage={handleSendMessage}
            onClearChat={handleClearChat}
            onSelectMachine={setSelectedMachine}
            selectedMachine={selectedMachine}
            onSelectCitation={(cit) => setSelectedCitation(cit)}
            onOpenWhyModal={(msg) => setWhyAnswerMessage(msg)}
            onOpenPhotoModal={() => setShowPhotoModal(true)}
            onNavigateTab={setActiveTab}
            machines={machines}
            isLoading={isLoading}
          />
        )}

        {activeTab === 'machines' && (
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 shadow-2xs flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-[#111827]">Ingested Machines & Models</h1>
                <p className="text-sm text-[#64748B] mt-1">Select a machine scope or manage ingested OEM models.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {machines.map((m, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setSelectedMachine(m.machine_name);
                    setActiveTab('technician');
                  }}
                  className={`p-5 rounded-xl border transition-all cursor-pointer bg-white shadow-2xs hover:border-[#2563EB] ${
                    selectedMachine === m.machine_name ? 'border-[#2563EB] ring-2 ring-blue-100' : 'border-[#E5E7EB]'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#2563EB] flex items-center justify-center font-bold">
                      <Cpu size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-[#111827]">{m.machine_name}</h3>
                      <p className="text-xs text-[#64748B] font-mono">{m.model}</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                    <span className="text-[#2563EB] font-semibold">Scope Active →</span>
                    {m.file_id && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteMachine(m.file_id);
                        }}
                        className="text-gray-400 hover:text-red-600 font-medium"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'library' && (
          <ManualLibrary
            documents={documents}
            onUploadNew={() => setActiveTab('technician')}
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

        {activeTab === 'settings' && (
          <div className="flex-1 p-6 overflow-y-auto max-w-3xl space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-[#111827]">Application Settings</h1>
              <p className="text-sm text-[#64748B] mt-1">Configure LLM API keys and reset knowledge base indices.</p>
            </div>

            <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 space-y-4 shadow-2xs">
              <h2 className="text-lg font-bold text-[#111827]">Gemini API Key</h2>
              <p className="text-xs text-[#64748B]">Provide an optional custom Gemini API key for external LLM reasoning.</p>
              <div className="flex items-center space-x-3">
                <input
                  type="password"
                  placeholder="AIzaSy..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="flex-1 bg-[#F7F9FC] border border-[#E5E7EB] rounded-lg px-4 py-2.5 text-sm font-mono outline-none focus:border-[#2563EB]"
                />
                <button
                  onClick={() => handleSaveApiKey(apiKey)}
                  className="px-5 py-2.5 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-sm cursor-pointer shadow-xs"
                >
                  Save Key
                </button>
              </div>
            </div>

            <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 space-y-4 shadow-2xs">
              <h2 className="text-lg font-bold text-red-600">Database & Knowledge Index Reset</h2>
              <p className="text-xs text-[#64748B]">Re-initialize vector database and reload default OEM manual benchmarks.</p>
              <button
                onClick={handleResetDatabase}
                disabled={isLoading}
                className="px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-sm flex items-center space-x-2 cursor-pointer shadow-xs disabled:opacity-50"
              >
                <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
                <span>Re-Initialize Store</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* 3. Slide-Over Evidence Inspector Modal Panel */}
      {selectedCitation && (
        <RightEvidencePanel
          citation={selectedCitation}
          onClose={() => setSelectedCitation(null)}
          onOpenPdf={(cit) => setPdfPreviewCitation(cit)}
        />
      )}

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

      {showKeyModal && (
        <div className="fixed inset-0 z-50 bg-gray-900/30 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E5E7EB] rounded-xl max-w-sm w-full p-6 shadow-xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h2 className="text-base font-bold text-[#111827] flex items-center">
                <Key size={16} className="mr-2 text-[#2563EB]" /> Gemini API Key
              </h2>
              <button onClick={() => setShowKeyModal(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-1">API Key</label>
                <input
                  type="password"
                  placeholder="AIzaSy..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full bg-[#F7F9FC] border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm text-[#111827] font-mono outline-none focus:border-[#2563EB]"
                />
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2 border-t border-gray-100">
                <button
                  onClick={() => handleSaveApiKey('')}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-gray-500 hover:text-red-600 cursor-pointer"
                >
                  Clear
                </button>
                <button
                  onClick={() => handleSaveApiKey(apiKey)}
                  className="px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-xs shadow-xs cursor-pointer"
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

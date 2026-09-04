import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import KnowledgeGraph from './components/KnowledgeGraph';
import ManualLibrary from './components/ManualLibrary';
import AdminDashboard from './components/AdminDashboard';
import EvaluationDashboard from './components/EvaluationDashboard';
import LandingDashboard from './components/LandingDashboard';
import RightEvidencePanel from './components/RightEvidencePanel';
import PDFViewerModal from './components/PDFViewerModal';
import WhyThisAnswerModal from './components/WhyThisAnswerModal';
import PhotoUploadModal from './components/PhotoUploadModal';
import { Key, Cpu, Search, Server, Award, Camera, Globe, FileText, X, AlertCircle } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState('technician');
  const [searchQuery, setSearchQuery] = useState('');
  const [lastContext, setLastContext] = useState(null);

  // Evidence Drawer & Modals
  const [selectedCitation, setSelectedCitation] = useState(null);
  const [pdfPreviewCitation, setPdfPreviewCitation] = useState(null);
  const [whyAnswerMessage, setWhyAnswerMessage] = useState(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [language, setLanguage] = useState('en');

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

      if (data.citations && data.citations.length > 0) {
        setSelectedCitation(data.citations[0]);
      }
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

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setActiveTab('technician');
      handleSendMessage(searchQuery.trim());
      setSearchQuery('');
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#F7F9FC] text-gray-900 overflow-hidden font-sans">
      {/* 1. Top Header Navigation Bar */}
      <header className="h-14 border-b border-gray-200 bg-white px-5 flex items-center justify-between z-20 shadow-2xs">
        {/* Brand & Search */}
        <div className="flex items-center space-x-5">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-2xs">
              <Cpu size={18} />
            </div>
            <span className="font-bold text-base text-gray-900 tracking-tight">MaintAI</span>
          </div>

          <form onSubmit={handleSearchSubmit} className="flex items-center">
            <div className="relative w-64">
              <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search error code or manual..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-gray-900 placeholder-gray-400 font-medium focus:border-blue-600 focus:bg-white outline-none transition-colors"
              />
            </div>
          </form>
        </div>

        {/* Center Navigation Pages Tabs */}
        <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600">
          <button
            onClick={() => setActiveTab('technician')}
            className={`px-3 py-1.5 rounded-md flex items-center space-x-1.5 transition-colors ${
              activeTab === 'technician' ? 'bg-blue-600 text-white shadow-2xs' : 'hover:text-gray-900 hover:bg-gray-200/60'
            }`}
          >
            <Cpu size={14} />
            <span>Technician Mode</span>
          </button>
          <button
            onClick={() => setActiveTab('library')}
            className={`px-3 py-1.5 rounded-md flex items-center space-x-1.5 transition-colors ${
              activeTab === 'library' ? 'bg-blue-600 text-white shadow-2xs' : 'hover:text-gray-900 hover:bg-gray-200/60'
            }`}
          >
            <FileText size={14} />
            <span>Manual Library</span>
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            className={`px-3 py-1.5 rounded-md flex items-center space-x-1.5 transition-colors ${
              activeTab === 'admin' ? 'bg-blue-600 text-white shadow-2xs' : 'hover:text-gray-900 hover:bg-gray-200/60'
            }`}
          >
            <Server size={14} />
            <span>Admin Pipeline</span>
          </button>
          <button
            onClick={() => setActiveTab('evaluation')}
            className={`px-3 py-1.5 rounded-md flex items-center space-x-1.5 transition-colors ${
              activeTab === 'evaluation' ? 'bg-blue-600 text-white shadow-2xs' : 'hover:text-gray-900 hover:bg-gray-200/60'
            }`}
          >
            <Award size={14} />
            <span>Judge Evaluation</span>
          </button>
        </div>

        {/* Right Tools & Config */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowPhotoModal(true)}
            className="p-2 rounded-lg bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-medium flex items-center space-x-1 transition-colors"
            title="Scan Photo OCR"
          >
            <Camera size={15} className="text-blue-600" />
            <span className="hidden sm:inline">OCR</span>
          </button>

          <button
            onClick={() => setLanguage(l => l === 'en' ? 'hi' : 'en')}
            className="p-2 rounded-lg bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-medium flex items-center space-x-1 transition-colors"
            title="Toggle Language"
          >
            <Globe size={15} className="text-gray-500" />
            <span className="font-mono text-xs uppercase">{language}</span>
          </button>

          <button
            onClick={() => setShowKeyModal(true)}
            className="p-2 rounded-lg bg-white hover:bg-gray-50 border border-gray-200 text-gray-600 transition-colors"
            title="API Key"
          >
            <Key size={15} className={apiKey ? "text-emerald-600" : "text-gray-400"} />
          </button>
        </div>
      </header>

      {/* 2. Visual Metrics Landing Dashboard Banner */}
      <LandingDashboard
        stats={stats}
        onStartChat={() => setActiveTab('technician')}
        onOpenLibrary={() => setActiveTab('library')}
        onOpenAdmin={() => setActiveTab('admin')}
        onOpenEval={() => setActiveTab('evaluation')}
      />

      {/* 3. Main Workspace Area */}
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
              activeTab={activeTab}
              onNavigateTab={setActiveTab}
              isLoading={isLoading}
            />

            <ChatInterface
              messages={messages}
              onSendMessage={handleSendMessage}
              onClearChat={handleClearChat}
              onSelectMachine={setSelectedMachine}
              selectedMachine={selectedMachine}
              onSelectCitation={(cit) => setSelectedCitation(cit)}
              onUploadModalOpen={() => {}}
              onOpenWhyModal={(msg) => setWhyAnswerMessage(msg)}
              onNavigateTab={setActiveTab}
              isLoading={isLoading}
            />

            {/* Right Evidence Inspector Panel */}
            {selectedCitation && (
              <RightEvidencePanel
                citation={selectedCitation}
                onClose={() => setSelectedCitation(null)}
                onOpenPdf={(cit) => setPdfPreviewCitation(cit)}
              />
            )}
          </>
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
        <div className="fixed inset-0 z-50 bg-gray-900/30 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-xl max-w-sm w-full p-5 shadow-xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h2 className="text-xs font-bold text-gray-900 flex items-center">
                <Key size={14} className="mr-1.5 text-blue-600" /> Gemini API Key
              </h2>
              <button onClick={() => setShowKeyModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            </div>

            <div className="mt-3 space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">API Key</label>
                <input
                  type="password"
                  placeholder="AIzaSy..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 font-mono outline-none focus:border-blue-600"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2 border-t border-gray-100">
                <button
                  onClick={() => handleSaveApiKey('')}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-500 hover:text-red-600"
                >
                  Clear
                </button>
                <button
                  onClick={() => handleSaveApiKey(apiKey)}
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-2xs"
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

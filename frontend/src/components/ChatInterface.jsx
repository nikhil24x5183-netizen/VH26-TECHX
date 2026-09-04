import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Trash2, Camera, Paperclip, Mic, FileText, CheckCircle, AlertTriangle, HelpCircle, ArrowRight } from 'lucide-react';
import AmbiguityCard from './AmbiguityCard';

export default function ChatInterface({
  messages,
  onSendMessage,
  onClearChat,
  onSelectMachine,
  selectedMachine,
  onSelectCitation,
  onOpenWhyModal,
  onOpenPhotoModal,
  onNavigateTab,
  machines = [],
  isLoading
}) {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleVoiceClick = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => prev ? `${prev} ${transcript}` : transcript);
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognition.start();
    } else {
      alert("Speech recognition is not supported in this browser environment.");
    }
  };

  const emptyActions = [
    { label: "Diagnose Error E101", query: "What is E101?", icon: "🔍" },
    { label: "Search Manual Safety", query: "Show LOTO safety inspection steps", icon: "📄" },
    { label: "Troubleshoot Overheating", query: "Why is Caterpillar C15 Generator coolant temperature high?", icon: "⚡" },
    { label: "Scan Error Photo", action: "photo", icon: "📷" }
  ];

  const parseDiagnosis = (text) => {
    if (!text) return { problem: '', assessment: text, checks: [], safety: '' };
    return { problem: '', assessment: text, checks: [], safety: "Follow standard lockout/tagout (LOTO) safety protocols before opening machine enclosure." };
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F7F9FC] text-[#111827] overflow-hidden min-w-0">
      {/* Main Top Header & Machine Context Selector */}
      <div className="bg-white border-b border-[#E5E7EB] px-6 py-4 flex items-center justify-between shadow-2xs">
        <div>
          <h1 className="text-2xl font-bold text-[#111827] tracking-tight">Troubleshooting Copilot</h1>
          <p className="text-xs text-[#64748B] font-medium">Verified RAG Manual Diagnostic Assistant</p>
        </div>

        {/* Minimal Context Selector Dropdowns */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-[#64748B]">Scope:</span>
            <select
              value={selectedMachine || 'all'}
              onChange={(e) => onSelectMachine(e.target.value === 'all' ? null : e.target.value)}
              className="bg-[#F7F9FC] border border-[#E5E7EB] text-[#111827] text-xs font-semibold rounded-lg px-3 py-1.5 outline-none cursor-pointer focus:border-[#2563EB]"
            >
              <option value="all">⚡ All Machines</option>
              {machines.map((m, idx) => (
                <option key={idx} value={m.machine_name}>
                  {m.machine_name} ({m.model})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={onClearChat}
            className="p-2 rounded-lg border border-[#E5E7EB] bg-white hover:bg-gray-50 text-[#64748B] hover:text-red-600 transition-colors cursor-pointer"
            title="Clear Chat"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Messages Feed / Empty State Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 ? (
          /* Clean 5-Second Home Empty State */
          <div className="h-full flex flex-col items-center justify-center text-center p-6 max-w-2xl mx-auto space-y-6">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#2563EB] shadow-xs">
              <Bot size={32} />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-[#111827]">How can I help?</h2>
              <p className="text-sm text-[#64748B] mt-1">
                Select a quick action or enter an error code / machine symptom below.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full pt-2">
              {emptyActions.map((act, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    if (act.action === 'photo') {
                      onOpenPhotoModal && onOpenPhotoModal();
                    } else {
                      onSendMessage(act.query);
                    }
                  }}
                  className="p-4 rounded-xl border border-[#E5E7EB] bg-white hover:bg-blue-50/40 hover:border-blue-200 text-left transition-all shadow-2xs flex items-center justify-between cursor-pointer group"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">{act.icon}</span>
                    <span className="text-sm font-semibold text-[#111827] group-hover:text-[#2563EB]">
                      {act.label}
                    </span>
                  </div>
                  <ArrowRight size={16} className="text-[#2563EB] opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isUser = msg.sender === 'user';
            const diag = !isUser ? parseDiagnosis(msg.text) : null;

            return (
              <div
                key={idx}
                className={`flex items-start space-x-3.5 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-9 h-9 rounded-xl bg-[#2563EB] text-white flex items-center justify-center font-bold shrink-0 mt-0.5 shadow-xs">
                    <Bot size={18} />
                  </div>
                )}

                <div className={`max-w-3xl rounded-xl text-base leading-relaxed ${
                  isUser
                    ? 'bg-[#2563EB] text-white font-medium px-5 py-3.5 rounded-tr-xs shadow-xs'
                    : 'bg-white border border-[#E5E7EB] text-[#111827] rounded-tl-xs p-6 space-y-5 shadow-2xs'
                }`}>
                  {!isUser && (
                    <>
                      {/* Top Audit Header */}
                      <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3 text-xs">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#2563EB] bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
                          Diagnosis
                        </span>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => onOpenWhyModal(msg)}
                            className="px-3 py-1 rounded-md bg-gray-50 hover:bg-gray-100 border border-[#E5E7EB] text-[#64748B] hover:text-[#111827] text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
                            title="Inspect Evidence Audit Log"
                          >
                            <HelpCircle size={14} className="text-[#2563EB]" />
                            <span>Why this answer?</span>
                          </button>
                        </div>
                      </div>

                      {/* Insufficient Information Helpful Prompt */}
                      {msg.insufficient_info && (
                        <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900 space-y-3">
                          <div className="font-bold text-sm text-amber-900 flex items-center space-x-2">
                            <HelpCircle size={18} className="text-amber-700" />
                            <span>I need a little more information.</span>
                          </div>
                          <p className="text-xs text-amber-800">
                            I couldn't find enough manual evidence to diagnose this query safely.
                          </p>
                          <div className="flex flex-wrap gap-2 pt-1">
                            <button
                              onClick={() => onSelectMachine('Caterpillar C15 Generator')}
                              className="px-3 py-1.5 rounded-lg bg-white border border-amber-300 text-amber-900 text-xs font-semibold hover:bg-amber-100 cursor-pointer"
                            >
                              [ Select Machine ]
                            </button>
                            <button
                              onClick={() => onSendMessage("Model C15 Generator")}
                              className="px-3 py-1.5 rounded-lg bg-white border border-amber-300 text-amber-900 text-xs font-semibold hover:bg-amber-100 cursor-pointer"
                            >
                              [ Enter Model ]
                            </button>
                            <button
                              onClick={() => onSendMessage("E101")}
                              className="px-3 py-1.5 rounded-lg bg-white border border-amber-300 text-amber-900 text-xs font-semibold hover:bg-amber-100 cursor-pointer"
                            >
                              [ Enter Error Code ]
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Prominent Error Code Display (18-22px bold) */}
                      {diag.problem && !msg.insufficient_info && (
                        <div className="space-y-1">
                          <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider block">Identified Fault</span>
                          <div className="inline-block bg-blue-50 border border-blue-200 text-[#2563EB] text-xl font-bold font-mono px-4 py-2 rounded-xl shadow-xs">
                            {diag.problem}
                          </div>
                        </div>
                      )}

                      {/* Main Assessment Section */}
                      {!msg.insufficient_info && (
                        <div className="space-y-1.5">
                          <h3 className="text-base font-bold text-[#111827]">Diagnosis</h3>
                          <div className="whitespace-pre-wrap text-sm text-[#111827] leading-relaxed">
                            {msg.text}
                          </div>
                        </div>
                      )}

                      {/* What to Check Section */}
                      {diag.checks.length > 0 && !msg.insufficient_info && (
                        <div className="space-y-2 pt-1 border-t border-gray-100">
                          <h3 className="text-base font-bold text-[#111827]">What to check</h3>
                          <ul className="space-y-1.5 text-sm text-[#111827]">
                            {diag.checks.map((chk, cIdx) => (
                              <li key={cIdx} className="flex items-start space-x-2">
                                <span className="text-[#2563EB] font-bold">•</span>
                                <span>{chk}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Safety Section */}
                      {!msg.insufficient_info && (
                        <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200 text-xs text-amber-900 font-medium flex items-center space-x-2.5">
                          <AlertTriangle size={18} className="text-amber-600 shrink-0" />
                          <div>
                            <span className="font-bold text-amber-900 block mb-0.5">Safety Protocol:</span>
                            <span>{diag.safety}</span>
                          </div>
                        </div>
                      )}

                      {/* Ambiguity Choices */}
                      {msg.ambiguity && (
                        <AmbiguityCard
                          ambiguity={msg.ambiguity}
                          onSelectMachine={(mName) => {
                            onSelectMachine(mName);
                            onSendMessage(`Troubleshoot ${mName}`);
                          }}
                        />
                      )}

                      {/* Compact Source Citation Pill */}
                      {msg.citations && msg.citations.length > 0 && (
                        <div className="pt-3 border-t border-[#E5E7EB] space-y-2">
                          <span className="text-xs font-semibold uppercase tracking-wider text-[#64748B] block">
                            Source Evidence
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {msg.citations.map((cit, cIdx) => (
                              <div
                                key={cIdx}
                                className="px-3.5 py-2 rounded-lg bg-gray-50 border border-[#E5E7EB] flex items-center justify-between text-xs space-x-4 transition-colors"
                              >
                                <div className="flex items-center space-x-2 font-medium text-[#111827]">
                                  <FileText size={15} className="text-[#2563EB]" />
                                  <span>{cit.machine_name || 'Machine Manual'} · <strong>Page {cit.page_number}</strong></span>
                                </div>
                                <button
                                  onClick={() => onSelectCitation(cit)}
                                  className="px-2.5 py-1 rounded-md bg-white border border-[#E5E7EB] hover:border-[#2563EB] text-[#2563EB] font-semibold text-xs transition-colors cursor-pointer"
                                >
                                  View source
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* User Bubble */}
                  {isUser && (
                    <div className="text-white text-base font-normal">
                      {msg.text}
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-9 h-9 rounded-xl bg-gray-200 text-gray-700 flex items-center justify-center font-bold shrink-0 mt-0.5">
                    <User size={18} />
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Loading Skeleton */}
        {isLoading && (
          <div className="flex items-start space-x-3.5">
            <div className="w-9 h-9 rounded-xl bg-[#2563EB] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Bot size={18} />
            </div>
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 text-sm text-[#64748B] flex items-center space-x-3 font-medium shadow-2xs">
              <div className="w-2.5 h-2.5 rounded-full bg-[#2563EB] animate-ping"></div>
              <span>Searching manual knowledge base...</span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input Bar */}
      <div className="p-4 bg-white border-t border-[#E5E7EB]">
        <form onSubmit={handleSubmit} className="flex items-center space-x-3 max-w-4xl mx-auto">
          <button
            type="button"
            onClick={onOpenPhotoModal}
            className="p-3 rounded-lg bg-white border border-[#E5E7EB] text-[#64748B] hover:bg-gray-50 hover:text-[#2563EB] transition-colors cursor-pointer"
            title="Scan Photo / OCR"
          >
            <Camera size={18} />
          </button>

          <button
            type="button"
            onClick={handleVoiceClick}
            className={`p-3 rounded-lg border transition-colors cursor-pointer ${
              isListening
                ? 'bg-rose-50 border-rose-300 text-rose-600 animate-pulse'
                : 'bg-white border-[#E5E7EB] text-[#64748B] hover:bg-gray-50 hover:text-[#2563EB]'
            }`}
            title="Voice Speech Input"
          >
            <Mic size={18} />
          </button>

          <input
            type="text"
            placeholder="Describe the problem or enter error code..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            className="flex-1 bg-[#F7F9FC] border border-[#E5E7EB] rounded-lg px-4 py-3 text-base text-[#111827] font-medium placeholder-[#64748B] focus:outline-none focus:border-[#2563EB] focus:bg-white transition-colors"
          />

          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-6 py-3 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-sm flex items-center space-x-2 transition-colors disabled:opacity-40 shrink-0 cursor-pointer shadow-xs"
          >
            <span>Send</span>
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}

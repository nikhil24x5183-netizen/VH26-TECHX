import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Trash2, Camera, Mic, FileText, CheckCircle, AlertTriangle, HelpCircle, RefreshCw, Sparkles, Building2, Plus } from 'lucide-react';
import AmbiguityCard from './AmbiguityCard';
import MachineSelectorCard from './MachineSelectorCard';
import RAGDiagnosticsPanel from './RAGDiagnosticsPanel';

export default function ChatInterface({
  messages,
  onSendMessage,
  onClearChat,
  onNewChat,
  targetLanguage = 'English 🇺🇸',
  onSelectTargetLanguage,
  onSelectMachine,
  selectedMachine,
  onSelectCitation,
  onOpenWhyModal,
  onOpenPhotoModal,
  onOpenUploadModal,
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

  const parseDiagnosisStructured = (rawText) => {
    if (!rawText) return { fault: '', meaning: '', causes: [], checks: [], safety: '' };

    // Strip raw markdown symbols
    let text = rawText
      .replace(/###\s*/g, '')
      .replace(/####\s*/g, '')
      .replace(/\*\*/g, '')
      .replace(/`/g, '');

    let fault = '';
    let meaning = '';
    let causes = [];
    let checks = [];
    let safety = 'Follow standard manufacturer lockout/tagout (LOTO) safety procedures before removing safety enclosures.';

    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.toLowerCase().startsWith('diagnosed fault:')) {
        fault = line.replace(/diagnosed fault:/i, '').trim();
      } else if (line.toLowerCase().startsWith('meaning:')) {
        meaning = lines[i + 1] && !lines[i + 1].includes(':') ? lines[i + 1] : line.replace(/meaning:/i, '').trim();
      } else if (line.toLowerCase().startsWith('likely cause:') || line.toLowerCase().startsWith('likely causes:')) {
        let j = i + 1;
        while (j < lines.length && (lines[j].startsWith('-') || lines[j].startsWith('*') || /^\d+\./.test(lines[j]))) {
          causes.push(lines[j].replace(/^[-*\d.]+\s*/, '').trim());
          j++;
        }
      } else if (line.toLowerCase().startsWith('recommended checks:')) {
        let k = i + 1;
        while (k < lines.length && (lines[k].startsWith('-') || lines[k].startsWith('*') || /^\d+\./.test(lines[k]))) {
          checks.push(lines[k].replace(/^[-*\d.]+\s*/, '').trim());
          k++;
        }
      } else if (line.toLowerCase().startsWith('safety protocol:') || line.toLowerCase().startsWith('safety:')) {
        if (lines[i + 1] && !lines[i + 1].includes(':')) {
          safety = lines[i + 1];
        } else {
          safety = line.replace(/safety protocol:|safety:/i, '').trim();
        }
      }
    }

    if (!meaning && lines.length > 0) {
      meaning = lines[0];
    }

    return { fault, meaning, causes, checks, safety };
  };

  const selectedObj = machines.find(m => m.machine_name === selectedMachine);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F8FAFC] text-[#0F172A] overflow-hidden min-w-0 font-sans">
      {/* Sticky Compact Machine Context Bar */}
      <div className="bg-white border-b border-[#E2E8F0] px-6 py-3 flex items-center justify-between shadow-2xs z-10">
        <div className="flex items-center space-x-3 truncate">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#2563EB] flex items-center justify-center font-bold shrink-0">
            <Building2 size={18} />
          </div>
          <div className="truncate">
            <div className="flex items-center space-x-2 text-xs font-semibold text-[#0F172A]">
              <span>{selectedMachine ? `MACHINE: ${selectedMachine}` : 'SELECT MACHINE TO START'}</span>
              {selectedObj && <span className="font-mono text-[#2563EB]">({selectedObj.model})</span>}
            </div>
            <div className="flex items-center space-x-2 text-[11px] text-[#64748B] font-medium truncate mt-0.5">
              <span>YEAR: {selectedObj?.manufacturing_year || '2021'}</span>
              <span>•</span>
              <span className="truncate max-w-xs">MANUAL: {selectedObj?.manual_title || `${selectedMachine || 'Machine'} Operating Instructions`}</span>
              <span>•</span>
              <span className="text-emerald-700 font-semibold flex items-center shrink-0">
                <CheckCircle size={12} className="mr-1 text-emerald-600" /> Evidence Ready
              </span>
            </div>
          </div>
        </div>

        {/* Header Actions: New Chat, Change Machine, Language Selector, Clear */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={onNewChat}
            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center space-x-1.5 transition cursor-pointer shadow-xs"
            title="Start new clean chat session"
          >
            <Plus size={14} />
            <span>+ New Chat</span>
          </button>

          {onSelectTargetLanguage && (
            <select
              value={targetLanguage}
              onChange={(e) => onSelectTargetLanguage(e.target.value)}
              className="bg-white border border-[#E2E8F0] rounded-lg px-2.5 py-1.5 text-xs text-[#0F172A] font-semibold outline-none focus:border-[#2563EB] cursor-pointer"
              title="Target Output Language"
            >
              <option value="English 🇺🇸">English 🇺🇸</option>
              <option value="Hindi 🇮🇳">Hindi 🇮🇳</option>
              <option value="German 🇩🇪">German 🇩🇪</option>
              <option value="French 🇫🇷">French 🇫🇷</option>
              <option value="Spanish 🇪🇸">Spanish 🇪🇸</option>
              <option value="Japanese 🇯🇵">Japanese 🇯🇵</option>
            </select>
          )}

          <button
            onClick={() => onSelectMachine(null)}
            className="px-3 py-1.5 rounded-lg border border-[#E2E8F0] bg-white hover:bg-gray-50 text-[#2563EB] font-semibold text-xs transition cursor-pointer"
          >
            [ Change Machine ]
          </button>
          <button
            onClick={onClearChat}
            className="p-2 rounded-lg border border-[#E2E8F0] bg-white hover:bg-gray-50 text-[#64748B] hover:text-red-600 transition cursor-pointer"
            title="Clear Chat Messages"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {!selectedMachine && messages.length === 0 ? (
          /* Step 1: Mandatory Machine Selection Card */
          <div className="py-4">
            <MachineSelectorCard
              onSelectMachine={(spec) => {
                onSelectMachine(typeof spec === 'string' ? spec : spec.machine_name);
              }}
              machines={machines}
              onOpenUploadModal={onOpenUploadModal}
            />
          </div>
        ) : messages.length === 0 ? (
          /* Selected Machine Welcome Screen */
          <div className="h-full flex flex-col items-center justify-center text-center p-6 max-w-xl mx-auto space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#2563EB]">
              <Bot size={28} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#0F172A]">WHAT'S THE PROBLEM?</h2>
              <p className="text-xs text-[#64748B] mt-1 font-medium">
                Troubleshooting locked to <strong>{selectedMachine}</strong>. Enter an error code or describe your symptom below.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 pt-2">
              <button
                onClick={() => onSendMessage("What is F30001?")}
                className="px-3.5 py-2 rounded-xl bg-white border border-[#E2E8F0] text-xs font-semibold text-[#0F172A] hover:border-[#2563EB] hover:text-[#2563EB] transition cursor-pointer shadow-2xs"
              >
                🔍 Check Error F30001
              </button>
              <button
                onClick={() => onSendMessage("My motor isn't starting")}
                className="px-3.5 py-2 rounded-xl bg-white border border-[#E2E8F0] text-xs font-semibold text-[#0F172A] hover:border-[#2563EB] hover:text-[#2563EB] transition cursor-pointer shadow-2xs"
              >
                ⚡ Troubleshoot Motor Start Failure
              </button>
              <button
                onClick={() => onOpenPhotoModal && onOpenPhotoModal()}
                className="px-3.5 py-2 rounded-xl bg-white border border-[#E2E8F0] text-xs font-semibold text-[#0F172A] hover:border-[#2563EB] hover:text-[#2563EB] transition cursor-pointer shadow-2xs"
              >
                📷 Scan Error Photo
              </button>
            </div>
          </div>
        ) : (
          /* Messages Feed */
          messages.map((msg, idx) => {
            const isUser = msg.sender === 'user';
            const isConversational = !isUser && (msg.citations?.length === 0) && !msg.insufficient_info && !msg.ambiguity;
            const diag = (!isUser && !isConversational) ? parseDiagnosisStructured(msg.text) : null;

            return (
              <div
                key={idx}
                className={`flex items-start space-x-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-[#2563EB] text-white flex items-center justify-center font-bold shrink-0 mt-0.5 shadow-xs">
                    <Bot size={17} />
                  </div>
                )}

                <div className={`max-w-2xl rounded-2xl text-sm leading-relaxed ${
                  isUser
                    ? 'bg-[#2563EB] text-white font-medium px-4 py-3 rounded-tr-xs shadow-xs'
                    : isConversational
                    ? 'bg-white border border-[#E2E8F0] text-[#0F172A] p-4 rounded-tl-xs shadow-2xs font-medium whitespace-pre-wrap'
                    : 'bg-white border border-[#E2E8F0] text-[#0F172A] rounded-tl-xs p-5 space-y-4 shadow-2xs'
                }`}>
                  {/* User Bubble Message Text */}
                  {isUser && (
                    <div className="whitespace-pre-wrap break-words text-white font-medium">{msg.text}</div>
                  )}

                  {/* Conversational Bot Bubble */}
                  {!isUser && isConversational && (
                    <div>{msg.text}</div>
                  )}

                  {/* Diagnostic Technical Card (Zero raw markdown) */}
                  {!isUser && !isConversational && (
                    <>
                      {/* Top Header Audit Trigger */}
                      <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2.5 text-xs">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#2563EB] bg-blue-50 px-2.5 py-0.5 rounded border border-blue-100">
                          DIAGNOSIS
                        </span>
                        <button
                          onClick={() => onOpenWhyModal(msg)}
                          className="px-2.5 py-1 rounded bg-[#F8FAFC] hover:bg-gray-100 border border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] text-xs font-semibold flex items-center space-x-1 transition cursor-pointer"
                        >
                          <HelpCircle size={13} className="text-[#2563EB]" />
                          <span>Why this answer?</span>
                        </button>
                      </div>

                      {/* Backend API Connection Error Card */}
                      {msg.is_api_error && (
                        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 space-y-2 text-xs">
                          <div className="font-bold text-red-700 flex items-center space-x-2 text-sm">
                            <AlertTriangle size={17} className="text-red-600" />
                            <span>Backend API Error</span>
                          </div>
                          <p className="text-red-800 font-mono text-[11px] bg-red-100/70 p-2 rounded border border-red-200">{msg.text}</p>
                          <p className="text-slate-600 text-[11px]">
                            Something went wrong while processing your request on the server. Please try again or check server logs.
                          </p>
                        </div>
                      )}

                      {/* Insufficient Evidence Prompt */}
                      {msg.insufficient_info && !msg.is_api_error && (
                        <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 space-y-2.5 text-xs">
                          <div className="font-bold text-amber-900 flex items-center space-x-1.5">
                            <HelpCircle size={16} className="text-amber-700" />
                            <span>Insufficient Evidence</span>
                          </div>
                          <p className="text-amber-800">{msg.text}</p>
                          <div className="flex flex-wrap gap-2 pt-1">
                            <button
                              onClick={() => onNavigateTab && onNavigateTab('library')}
                              className="px-2.5 py-1 rounded bg-white border border-amber-300 text-amber-900 text-xs font-semibold hover:bg-amber-100 cursor-pointer"
                            >
                              [ Search another manual ]
                            </button>
                            <button
                              onClick={() => onSelectMachine(null)}
                              className="px-2.5 py-1 rounded bg-white border border-amber-300 text-amber-900 text-xs font-semibold hover:bg-amber-100 cursor-pointer"
                            >
                              [ Change Machine ]
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Identified Fault Display */}
                      {diag && diag.fault && !msg.insufficient_info && (
                        <div className="space-y-1">
                          <span className="text-[11px] font-semibold uppercase text-[#64748B] tracking-wider block">Identified Fault</span>
                          <div className="inline-block bg-blue-50 border border-blue-200 text-[#2563EB] text-base font-bold font-mono px-3 py-1 rounded-lg">
                            {diag.fault}
                          </div>
                        </div>
                      )}

                      {/* Meaning / Assessment */}
                      {diag && diag.meaning && !msg.insufficient_info && (
                        <div className="space-y-1">
                          <span className="text-[11px] font-semibold uppercase text-[#64748B] tracking-wider block">Meaning</span>
                          <div className="text-xs text-[#0F172A] leading-relaxed font-medium">
                            {diag.meaning}
                          </div>
                        </div>
                      )}

                      {/* Causes */}
                      {diag && diag.causes.length > 0 && !msg.insufficient_info && (
                        <div className="space-y-1.5 pt-1 border-t border-[#F1F5F9]">
                          <span className="text-[11px] font-semibold uppercase text-[#64748B] tracking-wider block">Likely Cause</span>
                          <ul className="space-y-1 text-xs text-[#0F172A]">
                            {diag.causes.map((c, cIdx) => (
                              <li key={cIdx} className="flex items-start space-x-1.5">
                                <span className="text-[#2563EB] font-bold">•</span>
                                <span>{c}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Recommended Checks */}
                      {diag && diag.checks.length > 0 && !msg.insufficient_info && (
                        <div className="space-y-1.5 pt-1 border-t border-[#F1F5F9]">
                          <span className="text-[11px] font-semibold uppercase text-[#64748B] tracking-wider block">Recommended Checks</span>
                          <ol className="space-y-1 text-xs text-[#0F172A]">
                            {diag.checks.map((chk, chkIdx) => (
                              <li key={chkIdx} className="flex items-start space-x-2">
                                <span className="w-4 h-4 rounded-full bg-blue-50 text-[#2563EB] font-mono text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                                  {chkIdx + 1}
                                </span>
                                <span>{chk}</span>
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}

                      {/* Safety Protocol */}
                      {diag && diag.safety && !msg.insufficient_info && (
                        <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 font-medium flex items-center space-x-2">
                          <AlertTriangle size={16} className="text-amber-600 shrink-0" />
                          <div>
                            <span className="font-bold text-amber-900 block">Safety Protocol:</span>
                            <span>{diag.safety}</span>
                          </div>
                        </div>
                      )}

                      {/* Ambiguity Card */}
                      {msg.ambiguity && (
                        <AmbiguityCard
                          ambiguity={msg.ambiguity}
                          onSelectMachine={(mName) => {
                            onSelectMachine(mName);
                            onSendMessage(`Troubleshoot ${mName}`);
                          }}
                        />
                      )}

                      {/* Source Citation Pill */}
                      {msg.citations && msg.citations.length > 0 && (
                        <div className="pt-2.5 border-t border-[#E2E8F0] space-y-1.5">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B] block">
                            SOURCE EVIDENCE
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {msg.citations.map((cit, cIdx) => (
                              <div
                                key={cIdx}
                                className="px-3 py-1.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between text-xs space-x-3"
                              >
                                <div className="flex items-center space-x-1.5 font-medium text-[#0F172A] truncate">
                                  <FileText size={14} className="text-[#2563EB] shrink-0" />
                                  <span className="truncate">{cit.machine_name || 'Manual'} · <strong>Page {cit.page_number}</strong></span>
                                </div>
                                <button
                                  onClick={() => onSelectCitation(cit)}
                                  className="px-2 py-0.5 rounded bg-white border border-[#E2E8F0] hover:border-[#2563EB] text-[#2563EB] font-semibold text-xs transition cursor-pointer shrink-0"
                                >
                                  View Evidence
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Developer RAG Diagnostics Panel */}
                      {msg.audit_trail && (
                        <RAGDiagnosticsPanel diagnostics={msg.audit_trail} />
                      )}
                    </>
                  )}
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-gray-200 text-gray-700 flex items-center justify-center font-bold shrink-0 mt-0.5">
                    <User size={17} />
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-xl bg-[#2563EB] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Bot size={17} />
            </div>
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-3.5 text-xs text-[#64748B] flex items-center space-x-2.5 font-medium shadow-2xs">
              <RefreshCw size={14} className="animate-spin text-[#2563EB]" />
              <span>Searching OEM manual index for evidence...</span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input Form Bar */}
      <div className="p-4 bg-white border-t border-[#E2E8F0]">
        <form onSubmit={handleSubmit} className="flex items-center space-x-2.5 max-w-4xl mx-auto">
          <button
            type="button"
            onClick={onOpenPhotoModal}
            className="p-2.5 rounded-lg bg-white border border-[#E2E8F0] text-[#64748B] hover:bg-gray-50 hover:text-[#2563EB] transition cursor-pointer"
            title="Scan Error Photo"
          >
            <Camera size={17} />
          </button>

          <button
            type="button"
            onClick={handleVoiceClick}
            className={`p-2.5 rounded-lg border transition cursor-pointer ${
              isListening
                ? 'bg-rose-50 border-rose-300 text-rose-600 animate-pulse'
                : 'bg-white border-[#E2E8F0] text-[#64748B] hover:bg-gray-50 hover:text-[#2563EB]'
            }`}
            title="Voice Speech Input"
          >
            <Mic size={17} />
          </button>

          <input
            type="text"
            placeholder={selectedMachine ? `Enter error code or describe symptom for ${selectedMachine}...` : "Select machine first or enter query..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            className="flex-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-xs text-[#0F172A] font-medium placeholder-[#64748B] focus:outline-none focus:border-[#2563EB] focus:bg-white transition"
          />

          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-xs flex items-center space-x-1.5 transition disabled:opacity-40 shrink-0 cursor-pointer shadow-xs"
          >
            <span>Send</span>
            <Send size={15} />
          </button>
        </form>
      </div>
    </div>
  );
}

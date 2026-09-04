import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Trash2, ShieldAlert, Sparkles, BookOpen, ShieldCheck, Paperclip, Mic, ExternalLink, AlertTriangle, CheckCircle, HelpCircle, Cpu } from 'lucide-react';
import AmbiguityCard from './AmbiguityCard';

export default function ChatInterface({
  messages,
  onSendMessage,
  onClearChat,
  onSelectMachine,
  selectedMachine,
  onSelectCitation,
  onUploadModalOpen,
  onOpenWhyModal,
  onNavigateTab,
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

  const presets = [
    { label: "E101", query: "What is E101?", scope: "Caterpillar C15 Generator" },
    { label: "Overheating", query: "Why is Caterpillar C15 Generator coolant temperature high?", scope: "Caterpillar C15 Generator" },
    { label: "Ambiguity", query: "What does E101 mean?", scope: null },
    { label: "Safety", query: "My machine is not working.", scope: null }
  ];

  const emptyActions = [
    { label: "Diagnose Error E101", query: "What is E101?" },
    { label: "Find Error E301", query: "What does E301 mean?" },
    { label: "Check Motor Overheating", query: "Why is coolant temperature high?" },
    { label: "Search Manual Safety", query: "Show LOTO safety inspection steps" }
  ];

  const parseDiagnosis = (text) => {
    if (!text) return { problem: '', assessment: text, checks: [], safety: '' };
    
    let problem = '';
    let assessment = text;
    let checks = [];
    let safety = "Follow the manufacturer's lockout/tagout (LOTO) safety procedure before performing inspection.";

    if (text.includes("E101")) problem = "E101 — High Coolant Temperature / Motor Overload";
    else if (text.includes("E301")) problem = "E301 — PLC Profinet Bus Fault";
    else if (text.includes("E202")) problem = "E202 — CNC Spindle Overload";
    else if (text.includes("Error") || text.includes("Alarm")) {
      const match = text.match(/(?:Error|Alarm)\s+[A-Z0-9-]+/i);
      problem = match ? match[0] : "System Fault Detected";
    }

    const lines = text.split('\n').filter(l => l.trim());
    const checkLines = lines.filter(l => /^[0-9]+\.|\*/.test(l.trim()));
    if (checkLines.length > 0) {
      checks = checkLines.map(l => l.replace(/^[0-9]+\.|\*/, '').trim());
    }

    return { problem, assessment, checks, safety };
  };

  const latestMessage = messages[messages.length - 1];
  const activeAlarm = latestMessage?.sender === 'ai' && latestMessage.text.includes('E101') ? 'E101' : (latestMessage?.sender === 'user' ? latestMessage.text : '—');

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F7F9FC] text-gray-900 overflow-hidden min-w-0">
      {/* Top Header & Context Selectors */}
      <div className="bg-white border-b border-gray-200 px-6 py-3.5 shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h1 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">Troubleshooting Copilot</h1>
            <div className="flex items-center space-x-1.5 text-xs">
              <button
                onClick={() => onSelectMachine(null)}
                className={`px-3 py-1 rounded-md text-xs font-semibold border transition-colors cursor-pointer ${
                  !selectedMachine ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
                title="Filter by all machines"
              >
                [ All Machines ]
              </button>
              <button
                onClick={() => onSelectMachine('Caterpillar C15 Generator')}
                className={`px-3 py-1 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
                  selectedMachine === 'Caterpillar C15 Generator' ? 'bg-blue-50 border-blue-200 text-blue-700 font-semibold' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
                title="Select Caterpillar Model"
              >
                [ Select Model ]
              </button>
              <button
                onClick={() => onNavigateTab && onNavigateTab('library')}
                className="px-3 py-1 rounded-md bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-blue-600 text-xs font-medium cursor-pointer transition-colors"
                title="Open Manual Library"
              >
                [ Manual ]
              </button>
            </div>
          </div>

          <button
            onClick={onClearChat}
            className="py-1.5 px-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 hover:text-red-600 text-xs font-medium flex items-center space-x-1.5 transition-colors shadow-2xs cursor-pointer"
            title="Clear Chat"
          >
            <Trash2 size={14} />
            <span>Clear Chat</span>
          </button>
        </div>

        {/* Compact Diagnostic Status Strip */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 flex items-center justify-between text-xs font-mono text-gray-600">
          <div className="flex items-center space-x-4">
            <span>Machine: <button onClick={() => onSelectMachine(selectedMachine ? null : 'Caterpillar C15 Generator')} className="text-gray-900 font-semibold hover:text-blue-600 hover:underline cursor-pointer">{selectedMachine || 'All Scope'}</button></span>
            <span className="text-gray-300">|</span>
            <span>Model: <strong className="text-gray-900 font-semibold">{selectedMachine ? 'C15-OEM' : 'Auto-Detect'}</strong></span>
            <span className="text-gray-300">|</span>
            <span>Active Alarm: <button onClick={() => onSendMessage("What is E101?")} className="text-blue-700 font-semibold hover:underline cursor-pointer">{activeAlarm}</button></span>
          </div>
          <button onClick={() => onNavigateTab && onNavigateTab('library')} className="flex items-center space-x-1 text-emerald-700 font-semibold hover:text-emerald-800 cursor-pointer">
            <CheckCircle size={14} className="text-emerald-600" />
            <span>Evidence: Ready</span>
          </button>
        </div>
      </div>

      {/* Preset Chips Bar */}
      <div className="bg-white/90 border-b border-gray-200 px-6 py-2 flex items-center space-x-2 overflow-x-auto">
        <span className="text-xs font-semibold uppercase text-gray-400 tracking-wider shrink-0 flex items-center mr-1">
          Presets:
        </span>
        {presets.map((p, idx) => (
          <button
            key={idx}
            onClick={() => {
              if (p.scope !== undefined) onSelectMachine(p.scope);
              onSendMessage(p.query);
            }}
            className="shrink-0 px-3 py-1 rounded-md bg-white hover:bg-blue-50/60 border border-gray-200 hover:border-blue-300 text-xs text-gray-700 hover:text-blue-700 font-medium transition-colors shadow-2xs cursor-pointer"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Messages Feed Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {messages.length === 0 ? (
          /* Empty State */
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-500">
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-3 shadow-2xs">
              <Bot size={26} />
            </div>
            <h2 className="text-lg font-bold text-gray-900">How can I help diagnose the machine?</h2>
            <p className="text-xs text-gray-500 max-w-sm mt-1 mb-5">
              Ask about an error code, alarm, symptom, or maintenance procedure.
            </p>

            <div className="grid grid-cols-2 gap-3 max-w-lg w-full">
              {emptyActions.map((act, idx) => (
                <button
                  key={idx}
                  onClick={() => onSendMessage(act.query)}
                  className="p-3.5 rounded-lg border border-gray-200 bg-white hover:bg-blue-50/50 hover:border-blue-300 text-left text-xs font-semibold text-gray-800 transition-colors shadow-2xs flex items-center justify-between cursor-pointer"
                >
                  <span>{act.label}</span>
                  <span className="text-blue-600 text-sm font-bold">→</span>
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
                className={`flex items-start space-x-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold shrink-0 mt-0.5 shadow-2xs">
                    <Bot size={16} />
                  </div>
                )}

                <div className={`max-w-3xl rounded-xl text-xs sm:text-sm leading-relaxed ${
                  isUser
                    ? 'bg-gray-100 border border-gray-200 text-gray-900 font-medium px-4 py-3 rounded-tr-xs'
                    : 'bg-white border border-gray-200 text-gray-900 rounded-tl-xs p-5 space-y-4 shadow-2xs'
                }`}>
                  {/* AI Diagnostic Card Header */}
                  {!isUser && (
                    <>
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2.5 text-xs">
                        <span className="bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-0.5 rounded font-bold uppercase tracking-wider">
                          AI DIAGNOSIS
                        </span>
                        
                        <div className="flex items-center space-x-2">
                          {msg.confidence_score ? (
                            <span className={`px-2.5 py-0.5 rounded font-mono text-xs font-semibold flex items-center ${
                              msg.confidence_score >= 0.70
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                              <ShieldCheck size={13} className="mr-1" />
                              Evidence: {msg.confidence_score >= 0.70 ? 'Strong' : 'Moderate'} ({Math.round(msg.confidence_score * 100)}%)
                            </span>
                          ) : null}

                          {/* [ Why this answer? ] Trust Audit Trigger */}
                          <button
                            onClick={() => onOpenWhyModal(msg)}
                            className="px-2.5 py-0.5 rounded bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 text-xs font-semibold flex items-center space-x-1 transition-colors"
                            title="Inspect Retrieval Audit Log"
                          >
                            <HelpCircle size={13} className="text-blue-600" />
                            <span>Why this answer?</span>
                          </button>
                        </div>
                      </div>

                      {/* Safety Refusal UI */}
                      {msg.insufficient_info && (
                        <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 space-y-2">
                          <div className="flex items-center space-x-2 text-xs font-bold text-rose-700">
                            <ShieldAlert size={16} />
                            <span>INSUFFICIENT EVIDENCE</span>
                          </div>
                          <p className="text-xs text-rose-800">
                            I couldn't find enough information in the available manuals to answer this reliably.
                          </p>
                          <div className="flex items-center space-x-2 pt-1">
                            <button onClick={() => onSelectMachine('Caterpillar C15 Generator')} className="px-3 py-1 rounded bg-white border border-rose-200 text-rose-900 text-xs font-medium hover:bg-rose-100">
                              [Select Machine]
                            </button>
                            <button onClick={() => onSendMessage("Caterpillar C15 Generator model C15")} className="px-3 py-1 rounded bg-white border border-rose-200 text-rose-900 text-xs font-medium hover:bg-rose-100">
                              [Enter Model]
                            </button>
                            <button onClick={() => onSendMessage("E101")} className="px-3 py-1 rounded bg-white border border-rose-200 text-rose-900 text-xs font-medium hover:bg-rose-100">
                              [Enter Error Code]
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Prominent Error Code / Problem Header */}
                      {diag.problem && !msg.insufficient_info && (
                        <div className="space-y-1">
                          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Problem</span>
                          <div className="inline-block bg-blue-50 border border-blue-200 text-blue-900 text-base font-bold font-mono px-3 py-1.5 rounded-lg shadow-2xs">
                            {diag.problem}
                          </div>
                        </div>
                      )}

                      {/* Assessment Explanation */}
                      {!msg.insufficient_info && (
                        <div>
                          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Assessment</span>
                          <div className="whitespace-pre-wrap text-gray-800 text-xs sm:text-sm leading-relaxed font-normal">
                            {msg.text}
                          </div>
                        </div>
                      )}

                      {/* Recommended Checks */}
                      {diag.checks.length > 0 && !msg.insufficient_info && (
                        <div>
                          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Recommended Checks</span>
                          <ol className="space-y-1 pl-4 list-decimal text-xs sm:text-sm text-gray-800 font-medium">
                            {diag.checks.map((chk, cIdx) => (
                              <li key={cIdx}>{chk}</li>
                            ))}
                          </ol>
                        </div>
                      )}

                      {/* Safety Protocols */}
                      {!msg.insufficient_info && (
                        <div className="p-3 rounded-lg bg-amber-50/70 border border-amber-200 text-xs text-amber-900 font-medium flex items-center space-x-2">
                          <AlertTriangle size={15} className="text-amber-600 shrink-0" />
                          <span>Safety: {diag.safety}</span>
                        </div>
                      )}

                      {/* Ambiguity UI */}
                      {msg.ambiguity && (
                        <AmbiguityCard
                          ambiguity={msg.ambiguity}
                          onSelectMachine={(mName) => {
                            onSelectMachine(mName);
                            onSendMessage(`Troubleshoot ${mName}`);
                          }}
                        />
                      )}

                      {/* Sources & Citations */}
                      {msg.citations && msg.citations.length > 0 && (
                        <div className="pt-2 border-t border-gray-100 space-y-2">
                          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center">
                            <BookOpen size={13} className="mr-1.5 text-blue-600" /> Manual Sources ({msg.citations.length})
                          </span>
                          <div className="space-y-2">
                            {msg.citations.map((cit, cIdx) => (
                              <div
                                key={cIdx}
                                onClick={() => onSelectCitation(cit)}
                                className="p-3 rounded-lg bg-gray-50 hover:bg-blue-50/60 border border-gray-200 hover:border-blue-300 cursor-pointer flex items-center justify-between text-xs transition-colors"
                              >
                                <div className="flex items-center space-x-2.5 min-w-0">
                                  <span className="text-lg">📄</span>
                                  <div className="min-w-0">
                                    <div className="font-semibold text-gray-900 text-xs truncate">{cit.machine_name}</div>
                                    <div className="text-[11px] font-mono text-gray-500 truncate">{cit.section} · Page {cit.page_number}</div>
                                  </div>
                                </div>
                                <button className="px-2.5 py-1 rounded bg-white border border-gray-200 text-blue-700 text-xs font-semibold hover:bg-blue-50 shrink-0">
                                  [View page]
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* User Speech Bubble */}
                  {isUser && (
                    <div className="text-gray-900 text-xs sm:text-sm font-normal">
                      {msg.text}
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-lg bg-gray-200 text-gray-700 flex items-center justify-center font-bold shrink-0 mt-0.5">
                    <User size={16} />
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Loading Skeleton */}
        {isLoading && (
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Bot size={16} />
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-3.5 text-xs text-gray-600 flex items-center space-x-2.5 font-medium shadow-2xs">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping"></div>
              <span>Searching vector database & synthesizing evidence...</span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Compact Input Bar */}
      <div className="p-3.5 bg-white border-t border-gray-200">
        <form onSubmit={handleSubmit} className="flex items-center space-x-2">
          <button
            type="button"
            onClick={onUploadModalOpen}
            className="p-2.5 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-blue-600 transition-colors"
            title="Attach Manual PDF"
          >
            <Paperclip size={16} />
          </button>

          <button
            type="button"
            onClick={handleVoiceClick}
            className={`p-2.5 rounded-lg border transition-colors ${
              isListening
                ? 'bg-rose-50 border-rose-300 text-rose-600 animate-pulse'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-blue-600'
            }`}
            title="Voice Recognition"
          >
            <Mic size={16} />
          </button>

          <input
            type="text"
            placeholder="Describe the fault or enter an error code (e.g. 'What is E101?')..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-xs sm:text-sm text-gray-900 font-medium placeholder-gray-400 focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
          />

          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs sm:text-sm flex items-center space-x-1.5 transition-colors disabled:opacity-40 shrink-0 shadow-2xs"
          >
            <span>Send</span>
            <Send size={14} />
          </button>
        </form>
      </div>
    </div>
  );
}

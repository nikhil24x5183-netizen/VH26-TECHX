import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Trash2, ShieldAlert, Sparkles, BookOpen, ShieldCheck } from 'lucide-react';
import CitationCard from './CitationCard';
import AmbiguityCard from './AmbiguityCard';

export default function ChatInterface({
  messages,
  onSendMessage,
  onClearChat,
  onSelectMachine,
  selectedMachine,
  isLoading
}) {
  const [input, setInput] = useState('');
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput('');
  };

  const presets = [
    { label: "E101 ERROR", query: "What is E101?", scope: "Caterpillar C15 Generator" },
    { label: "OVERHEATING", query: "Why is Caterpillar C15 Generator coolant temperature high?", scope: "Caterpillar C15 Generator" },
    { label: "AMBIGUITY CHECK", query: "What does E101 mean?", scope: null },
    { label: "SAFETY REFUSAL", query: "My machine is not working.", scope: null }
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 text-slate-900 overflow-hidden">
      {/* Header Bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-600/30">
            <Bot size={22} />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight">RAG TROUBLESHOOTING ENGINE</h2>
              <span className="bg-blue-100 text-blue-800 text-xs font-mono font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                {selectedMachine ? `SCOPE: ${selectedMachine}` : 'ALL MACHINES'}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={onClearChat}
          className="py-2 px-4 rounded-full border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-red-600 text-xs font-extrabold flex items-center space-x-1.5 transition shadow-xs"
          title="Clear Conversation"
        >
          <Trash2 size={14} />
          <span>CLEAR CHAT</span>
        </button>
      </div>

      {/* Action Presets Bar */}
      <div className="bg-slate-100/90 border-b border-slate-200 px-6 py-2.5 flex items-center space-x-2.5 overflow-x-auto">
        <span className="text-xs font-extrabold uppercase text-slate-500 tracking-wider shrink-0 flex items-center">
          <Sparkles size={14} className="mr-1 text-blue-600" /> PRESETS:
        </span>
        {presets.map((p, idx) => (
          <button
            key={idx}
            onClick={() => {
              if (p.scope !== undefined) onSelectMachine(p.scope);
              onSendMessage(p.query);
            }}
            className="shrink-0 px-4 py-1.5 rounded-full bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-400 text-xs text-slate-800 hover:text-blue-700 font-extrabold transition flex items-center space-x-1.5 shadow-xs uppercase tracking-wider"
          >
            <span>{p.label}</span>
          </button>
        ))}
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
            <div className="w-16 h-16 rounded-3xl bg-white border border-slate-200 flex items-center justify-center text-blue-600 mb-4 shadow-md">
              <Bot size={32} />
            </div>
            <h3 className="text-lg font-extrabold text-slate-900">MaintAI Troubleshooting Assistant</h3>
            <p className="text-sm font-medium text-slate-500 max-w-sm mt-1.5">
              Select a preset button above or type your error code question below.
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex items-start space-x-3.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'ai' && (
                <div className="w-9 h-9 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold shrink-0 mt-0.5 shadow-md shadow-blue-600/30">
                  <Bot size={18} />
                </div>
              )}

              <div className={`max-w-2xl rounded-3xl p-5 shadow-xs text-base leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-blue-600 text-white font-bold rounded-tr-none'
                  : 'bg-white border border-slate-200 text-slate-900 rounded-tl-none space-y-4 font-medium'
              }`}>
                {/* Header with Confidence Score Badge */}
                {msg.sender === 'ai' && (
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 text-xs">
                    <span className="font-extrabold uppercase text-slate-400">AI DIAGNOSTIC RESULT</span>
                    {msg.confidence_score ? (
                      <span className={`px-2.5 py-0.5 rounded-full font-mono text-[11px] font-extrabold flex items-center ${
                        msg.confidence_score >= 0.70
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}>
                        <ShieldCheck size={12} className="mr-1" />
                        {Math.round(msg.confidence_score * 100)}% Match ({msg.confidence_label})
                      </span>
                    ) : null}
                  </div>
                )}

                {/* Refusal Alert */}
                {msg.insufficient_info && (
                  <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-extrabold flex items-center space-x-2.5">
                    <ShieldAlert size={18} className="shrink-0 text-rose-600" />
                    <span>SAFETY REFUSAL: Context in manuals is insufficient to answer safely.</span>
                  </div>
                )}

                {/* Message Content */}
                <div className="whitespace-pre-wrap text-slate-900 text-base leading-relaxed">
                  {msg.text}
                </div>

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

                {/* Citations */}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="pt-3 border-t border-slate-100 space-y-2.5">
                    <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center">
                      <BookOpen size={14} className="mr-1.5 text-blue-600" /> MANUAL CITATIONS ({msg.citations.length})
                    </div>
                    <div className="space-y-2.5">
                      {msg.citations.map((cit, cIdx) => (
                        <CitationCard key={cIdx} citation={cit} />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {msg.sender === 'user' && (
                <div className="w-9 h-9 rounded-2xl bg-slate-200 text-slate-700 flex items-center justify-center font-bold shrink-0 mt-0.5 shadow-xs">
                  <User size={18} />
                </div>
              )}
            </div>
          ))
        )}

        {/* Loading Spinner */}
        {isLoading && (
          <div className="flex items-start space-x-3">
            <div className="w-9 h-9 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-600/30">
              <Bot size={18} />
            </div>
            <div className="bg-white border border-slate-200 rounded-3xl p-4 text-sm text-slate-700 flex items-center space-x-3 font-mono font-bold shadow-xs">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping"></div>
              <span>Searching vector database & synthesizing...</span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Prominent Form Input Bar */}
      <div className="p-5 bg-white border-t border-slate-200">
        <form onSubmit={handleSubmit} className="flex items-center space-x-3">
          <input
            type="text"
            placeholder="Type error code or question (e.g. 'What is E101?')..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            className="flex-1 bg-blue-50/60 border border-blue-100 rounded-2xl px-5 py-3.5 text-base text-slate-900 font-semibold placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-7 py-3.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider flex items-center space-x-2 transition disabled:opacity-40 shadow-md shadow-blue-600/30 shrink-0 active:scale-95"
          >
            <span>ASK QUESTION</span>
            <Send size={15} />
          </button>
        </form>
      </div>
    </div>
  );
}

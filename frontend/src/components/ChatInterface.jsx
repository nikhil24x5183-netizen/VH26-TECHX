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
    { label: "E101 Error Code", query: "What is E101?", scope: "Caterpillar C15 Generator" },
    { label: "Motor Overheating", query: "Why is Caterpillar C15 Generator coolant temperature high?", scope: "Caterpillar C15 Generator" },
    { label: "Ambiguity Detection", query: "What does E101 mean?", scope: null },
    { label: "Safety Cutoff", query: "My machine is not working.", scope: null }
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F7F9FC] text-gray-900 overflow-hidden min-w-0">
      {/* Header Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3.5 flex items-center justify-between shadow-2xs">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
            <Bot size={18} />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-bold text-gray-900 tracking-tight">Troubleshooting Assistant</h2>
              <span className="bg-blue-50 text-blue-700 border border-blue-100 text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
                {selectedMachine ? `Scope: ${selectedMachine}` : 'Global Scope'}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={onClearChat}
          className="py-1.5 px-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 hover:text-red-600 text-xs font-medium flex items-center space-x-1.5 transition-colors shadow-2xs"
          title="Clear Conversation"
        >
          <Trash2 size={13} />
          <span>Clear Chat</span>
        </button>
      </div>

      {/* Action Presets Bar */}
      <div className="bg-white/80 border-b border-gray-200 px-6 py-2 flex items-center space-x-2 overflow-x-auto">
        <span className="text-[11px] font-semibold uppercase text-gray-400 tracking-wider shrink-0 flex items-center mr-1">
          <Sparkles size={13} className="mr-1 text-blue-600" /> Presets:
        </span>
        {presets.map((p, idx) => (
          <button
            key={idx}
            onClick={() => {
              if (p.scope !== undefined) onSelectMachine(p.scope);
              onSendMessage(p.query);
            }}
            className="shrink-0 px-3 py-1 rounded-lg bg-white hover:bg-blue-50/60 border border-gray-200 hover:border-blue-300 text-xs text-gray-700 hover:text-blue-700 font-medium transition-colors shadow-2xs"
          >
            <span>{p.label}</span>
          </button>
        ))}
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-gray-400">
            <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-blue-600 mb-3 shadow-xs">
              <Bot size={24} />
            </div>
            <h3 className="text-sm font-semibold text-gray-900">MaintAI Industrial Troubleshooting</h3>
            <p className="text-xs text-gray-500 max-w-sm mt-1">
              Select a preset above or type your machine error code or issue below.
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex items-start space-x-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'ai' && (
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold shrink-0 mt-0.5 shadow-xs">
                  <Bot size={15} />
                </div>
              )}

              <div className={`max-w-2xl rounded-xl p-4 text-xs leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-gray-100 border border-gray-200 text-gray-900 font-medium rounded-tr-xs'
                  : 'bg-white border border-gray-200 text-gray-900 rounded-tl-xs space-y-3 shadow-2xs'
              }`}>
                {/* Header with Confidence Score Badge */}
                {msg.sender === 'ai' && (
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2 text-[11px]">
                    <span className="font-semibold uppercase text-gray-400">Diagnostic Result</span>
                    {msg.confidence_score ? (
                      <span className={`px-2 py-0.5 rounded font-mono text-[11px] font-semibold flex items-center ${
                        msg.confidence_score >= 0.70
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        <ShieldCheck size={12} className="mr-1" />
                        {Math.round(msg.confidence_score * 100)}% Match ({msg.confidence_label})
                      </span>
                    ) : null}
                  </div>
                )}

                {/* Refusal Alert */}
                {msg.insufficient_info && (
                  <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center space-x-2">
                    <ShieldAlert size={16} className="shrink-0 text-rose-600" />
                    <span>SAFETY REFUSAL: Context in manuals is insufficient to answer safely.</span>
                  </div>
                )}

                {/* Message Content */}
                <div className="whitespace-pre-wrap text-gray-900 text-xs leading-relaxed font-normal">
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
                  <div className="pt-2.5 border-t border-gray-100 space-y-2">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 flex items-center">
                      <BookOpen size={13} className="mr-1.5 text-blue-600" /> Manual Evidence ({msg.citations.length})
                    </div>
                    <div className="space-y-2">
                      {msg.citations.map((cit, cIdx) => (
                        <CitationCard key={cIdx} citation={cit} />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {msg.sender === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-gray-200 text-gray-700 flex items-center justify-center font-bold shrink-0 mt-0.5">
                  <User size={15} />
                </div>
              )}
            </div>
          ))
        )}

        {/* Loading Spinner */}
        {isLoading && (
          <div className="flex items-start space-x-3">
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Bot size={15} />
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-3 text-xs text-gray-600 flex items-center space-x-2 font-medium shadow-2xs">
              <div className="w-2 h-2 rounded-full bg-blue-600 animate-ping"></div>
              <span>Searching manual vectors & synthesizing...</span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Prominent Form Input Bar */}
      <div className="p-4 bg-white border-t border-gray-200">
        <form onSubmit={handleSubmit} className="flex items-center space-x-2">
          <input
            type="text"
            placeholder="Ask question or error code (e.g. 'What does E101 mean?')..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-xs text-gray-900 font-medium placeholder-gray-400 focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs flex items-center space-x-1.5 transition-colors disabled:opacity-40 shrink-0"
          >
            <span>Ask</span>
            <Send size={13} />
          </button>
        </form>
      </div>
    </div>
  );
}


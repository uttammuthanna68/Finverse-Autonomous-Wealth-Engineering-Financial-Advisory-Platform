import React, { useState, useRef, useEffect } from 'react';
import { ShellyMascot } from './ShellyMascot';
import { fetchWithAuth } from '../api/config';
import {
  X,
  Send,
  Sparkles,
  Bot,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';

interface ActionLink {
  label: string;
  path: string;
}

interface ChatMessage {
  id: string;
  sender: 'shelly' | 'user';
  text: string;
  actions?: ActionLink[];
  timestamp: string;
}

interface ShellyChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (path: string) => void;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: '1',
    sender: 'shelly',
    text: "Hello! I'm **Prof. Shelly** 🐢, your personal AI Financial Assistant!\n\nAsk me about financial terms (like **SWP**, **SIP**, **CAGR**, **CIBIL**), or ask me how to use Finverse tools (e.g., *'How do I find the best way to diversify?'*).",
    timestamp: 'Just now',
    actions: [
      { label: 'Explore 6-Asset Portfolios', path: '/portfolios' },
      { label: 'Open Return Calculators', path: '/calculator' },
    ],
  },
];

const SUGGESTED_PROMPTS = [
  'What is SWP?',
  'How do I find the best way to diversify?',
  'Explain SIP vs FD',
  'How does Debt Waterfall work?',
  'What is CIBIL score impact?',
  'How to build an Emergency Reserve?',
];

export const ShellyChatModal: React.FC<ShellyChatModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputValue, setInputValue] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputValue).trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      const res = await fetchWithAuth('/api/engine/shelly-chat', {
        method: 'POST',
        body: JSON.stringify({
          message: query,
          current_path: window.location.pathname,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const shellyReply: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: 'shelly',
          text: data.reply || "I'm sorry, I couldn't process that query right now.",
          actions: data.actions || [],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, shellyReply]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            sender: 'shelly',
            text: "Sorry, I had trouble connecting to the financial engine. Please try again in a moment!",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    } catch (err) {
      console.error('Shelly Chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'shelly',
          text: "Sorry, I had trouble connecting to the financial engine. Please make sure the backend server is running and try again!",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages(INITIAL_MESSAGES);
  };

  const handleActionClick = (path: string) => {
    onNavigate(path);
    onClose();
  };

  // Helper to format bold markdown syntax (**text**)
  const renderFormattedText = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, lineIdx) => {
      const parts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <React.Fragment key={lineIdx}>
          {parts.map((part, partIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <strong key={partIdx} className="font-extrabold text-main">
                  {part.slice(2, -2)}
                </strong>
              );
            }
            return part;
          })}
          {lineIdx < lines.length - 1 && <br />}
        </React.Fragment>
      );
    });
  };

  return (
    <div className="fixed bottom-24 right-6 z-50 w-full max-w-md animate-scaleUp">
      <div className="bg-card-bg border-2 border-primary/20 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[560px] max-h-[80vh]">
        
        {/* Chat Header */}
        <div className="bg-primary p-4 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center p-1 relative">
              <ShellyMascot pose="happy" size="sm" animateFloat={false} />
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-primary rounded-full" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5 font-black text-sm tracking-tight">
                <span>Prof. Shelly AI Assistant</span>
                <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
              </div>
              <span className="text-[10px] text-white/80 font-bold block">
                Financial Terms & Finverse Navigation Guide
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={handleResetChat}
              className="p-1.5 hover:bg-white/10 rounded-lg text-white/80 hover:text-white transition-all"
              title="Reset Chat"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/10 rounded-lg text-white/80 hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Chat Message Stream */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-surface/50 text-xs">
          {messages.map((msg) => {
            const isShelly = msg.sender === 'shelly';

            return (
              <div
                key={msg.id}
                className={`flex space-x-2.5 ${isShelly ? 'justify-start' : 'justify-end'}`}
              >
                {isShelly && (
                  <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                )}

                <div
                  className={`max-w-[82%] rounded-2xl p-3.5 space-y-2 shadow-xs ${
                    isShelly
                      ? 'bg-card-bg border border-black/10 text-main rounded-tl-xs'
                      : 'bg-primary text-white rounded-tr-xs font-semibold'
                  }`}
                >
                  <div className="leading-relaxed whitespace-pre-wrap">
                    {renderFormattedText(msg.text)}
                  </div>

                  {/* Render Quick Navigation Action Cards */}
                  {isShelly && msg.actions && msg.actions.length > 0 && (
                    <div className="pt-2 border-t border-black/5 flex flex-wrap gap-1.5">
                      {msg.actions.map((act, actIdx) => (
                        <button
                          key={actIdx}
                          onClick={() => handleActionClick(act.path)}
                          className="bg-primary/10 hover:bg-primary text-primary hover:text-white font-extrabold text-[10px] py-1.5 px-3 rounded-lg flex items-center space-x-1 transition-all border border-primary/20"
                        >
                          <span>{act.label}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      ))}
                    </div>
                  )}

                  <span
                    className={`block text-[9px] text-right font-mono ${
                      isShelly ? 'text-muted' : 'text-white/70'
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isLoading && (
            <div className="flex items-center space-x-2 text-muted text-xs p-2">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="w-3.5 h-3.5 text-primary animate-pulse" />
              </div>
              <span className="font-extrabold text-primary animate-pulse">Prof. Shelly is analyzing...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggested Prompt Pills */}
        <div className="px-3 py-2 bg-surface border-t border-black/5 flex items-center space-x-1.5 overflow-x-auto no-scrollbar">
          {SUGGESTED_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt)}
              disabled={isLoading}
              className="bg-card-bg hover:bg-primary/10 border border-black/10 hover:border-primary/40 text-main hover:text-primary text-[10px] font-bold py-1 px-2.5 rounded-full whitespace-nowrap transition-all flex-shrink-0"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-card-bg border-t border-black/10 flex items-center space-x-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendMessage();
            }}
            placeholder="Ask about financial terms or tools..."
            disabled={isLoading}
            className="flex-1 bg-surface border border-black/10 rounded-xl px-3 py-2.5 text-xs font-semibold text-main focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={isLoading || !inputValue.trim()}
            className="bg-primary hover:bg-primary-hover disabled:opacity-40 text-white p-2.5 rounded-xl transition-all shadow-sm active:scale-95"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};

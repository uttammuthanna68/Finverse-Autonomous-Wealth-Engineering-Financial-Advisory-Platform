import React, { useState, useRef, useEffect } from 'react';
import { ShellyMascot } from './ShellyMascot';
import { X, Send, Sparkles, RotateCcw, ArrowRight } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { fetchWithAuth } from '../api/config';

interface ShellyChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (path: string) => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'shelly';
  text: string;
  actions?: { label: string; path: string }[];
  source?: 'rule' | 'gemini_ai';
}

export const ShellyChatModal: React.FC<ShellyChatModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const { user } = useAuth();

  const initialWelcomeText = `Hello ${
    user?.full_name ? user.full_name.split(' ')[0] : 'there'
  }! I'm **Prof. Shelly** 🐢, your personal AI Financial Advisor!

Ask me about financial concepts (like **SWP**, **SIP**, **CAGR**, **CIBIL**, **Tax Regimes**), or ask me how to navigate Finverse (e.g. *'How do I calculate debt payoff?'*).`;

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'shelly',
      text: initialWelcomeText,
      actions: [
        { label: '📊 How SIP works', path: '/calculator' },
        { label: '💳 Payoff toxic debt', path: '/debt' },
        { label: '📑 Check Tax Savings', path: '/tax' },
      ],
      source: 'rule',
    },
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleResetChat = () => {
    setMessages([
      {
        id: 'welcome-' + Date.now(),
        sender: 'shelly',
        text: initialWelcomeText,
        actions: [
          { label: '📊 How SIP works', path: '/calculator' },
          { label: '💳 Payoff toxic debt', path: '/debt' },
          { label: '📑 Check Tax Savings', path: '/tax' },
        ],
        source: 'rule',
      },
    ]);
  };

  const handleSend = async (queryText?: string) => {
    const q = (queryText || inputQuery).trim();
    if (!q) return;

    const userMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      sender: 'user',
      text: q,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!queryText) setInputQuery('');
    setIsTyping(true);

    try {
      let response = await fetchWithAuth('/api/engine/shelly-chat', {
        method: 'POST',
        body: JSON.stringify({
          message: q,
          query: q,
          user_name: user?.full_name || 'Investor',
        }),
      });

      if (!response.ok) {
        response = await fetchWithAuth('/api/shelly/ask', {
          method: 'POST',
          body: JSON.stringify({
            message: q,
            query: q,
            user_name: user?.full_name || 'Investor',
          }),
        });
      }

      if (!response.ok) {
        throw new Error('Shelly server response error');
      }

      const data = await response.json();
      const replyText = data.reply || data.answer || "I'm having trouble connecting right now, but remember: compounding is king!";
      const shellyMsg: ChatMessage = {
        id: 'shelly-' + Date.now(),
        sender: 'shelly',
        text: replyText,
        actions: data.actions || [],
        source: data.source || 'gemini_ai',
      };
      setMessages((prev) => [...prev, shellyMsg]);
    } catch (err) {
      console.error('Shelly Chat error:', err);
      // Dynamic local response
      const fallbackMsg: ChatMessage = {
        id: 'shelly-err-' + Date.now(),
        sender: 'shelly',
        text: `Here's what you need to know about **${q}**:\n\nFinverse is designed to help you optimize investments, clear toxic debt (>18% APR), and project real wealth adjusted for inflation. Explore our calculators and 6-asset portfolios below!`,
        actions: [
          { label: 'Explore Portfolios', path: '/portfolios' },
          { label: 'Open Calculators', path: '/calculator' },
        ],
        source: 'rule',
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleActionClick = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
      onClose();
    }
  };

  const renderFormattedText = (text: string) => {
    // Parse markdown-style bold **text** and italic *text*
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={index} className="font-black text-slate-950 dark:text-white bg-slate-200/60 dark:bg-slate-800/80 px-1 py-0.5 rounded">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return (
          <em key={index} className="italic text-emerald-850 dark:text-emerald-300 font-bold">
            {part.slice(1, -1)}
          </em>
        );
      }
      return part;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-end sm:pr-8 p-0 sm:p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
      <div className="w-full sm:w-[450px] bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl border border-slate-300 dark:border-emerald-500/40 shadow-2xl overflow-hidden flex flex-col h-[85vh] sm:h-[620px] max-h-[90vh]">
        {/* Chat Header */}
        <div className="bg-emerald-800 dark:bg-emerald-950 p-4 text-white flex items-center justify-between shadow-md border-b border-emerald-700/50">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 dark:bg-white/10 flex items-center justify-center p-1 relative overflow-visible flex-shrink-0">
              <ShellyMascot pose="happy" size="sm" animateFloat={false} />
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-400 border-2 border-emerald-900 rounded-full" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5 font-black text-sm tracking-tight text-white">
                <span>Prof. Shelly AI Assistant</span>
                <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300" />
              </div>
              <span className="text-[11px] text-emerald-100 font-medium block">
                Financial Terms & Finverse Navigation Guide
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={handleResetChat}
              className="p-1.5 hover:bg-white/15 rounded-lg text-emerald-100 hover:text-white transition-all"
              title="Reset Chat"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/15 rounded-lg text-emerald-100 hover:text-white transition-all"
              title="Close Chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Chat Message Stream */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-100/80 dark:bg-slate-950/80 text-sm">
          {messages.map((msg) => {
            const isShelly = msg.sender === 'shelly';

            return (
              <div
                key={msg.id}
                className={`flex space-x-2.5 ${isShelly ? 'justify-start' : 'justify-end'}`}
              >
                {isShelly && (
                  <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/60 border border-emerald-400/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <ShellyMascot pose="happy" size="sm" animateFloat={false} className="w-6 h-6" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-4 space-y-2 shadow-xs ${
                    isShelly
                      ? 'bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-tl-xs'
                      : 'bg-emerald-700 dark:bg-emerald-600 text-white rounded-tr-xs font-semibold shadow-xs'
                  }`}
                >
                  {isShelly && msg.source === 'gemini_ai' && (
                    <div className="flex items-center space-x-1.5 text-[10px] font-black text-amber-900 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 px-2.5 py-0.5 rounded-full w-fit mb-1.5 border border-amber-400/50">
                      <Sparkles className="w-3 h-3 text-amber-600 dark:text-amber-400 fill-amber-400" />
                      <span>Gemini AI Engine</span>
                    </div>
                  )}

                  <div className="leading-relaxed whitespace-pre-wrap text-sm font-medium text-slate-900 dark:text-slate-100">
                    {renderFormattedText(msg.text)}
                  </div>

                  {/* Quick Action Cards */}
                  {isShelly && msg.actions && msg.actions.length > 0 && (
                    <div className="pt-2.5 border-t border-slate-200 dark:border-slate-800 flex flex-wrap gap-2">
                      {msg.actions.map((act, actIdx) => (
                        <button
                          key={actIdx}
                          onClick={() => handleActionClick(act.path)}
                          className="bg-emerald-100 dark:bg-emerald-950/90 hover:bg-emerald-200 dark:hover:bg-emerald-900 text-emerald-950 dark:text-emerald-200 text-xs font-extrabold px-3.5 py-1.5 rounded-xl border border-emerald-400/60 dark:border-emerald-700/60 flex items-center space-x-1.5 transition-all hover:scale-105 shadow-2xs"
                        >
                          <span>{act.label}</span>
                          <ArrowRight className="w-3 h-3 text-emerald-700 dark:text-emerald-400" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isTyping && (
            <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300 text-xs font-bold p-2">
              <ShellyMascot pose="thinking" size="sm" animateFloat={true} className="w-8 h-8" />
              <span>Prof. Shelly is analyzing financial parameters...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Pills */}
        <div className="p-2.5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center space-x-2 overflow-x-auto no-scrollbar">
          <span className="text-[10px] font-black uppercase text-slate-600 dark:text-slate-400 flex-shrink-0 pl-2">Try:</span>
          {['What is SWP?', 'How to payoff 40% APR credit card?', 'SIP vs Lump sum'].map((suggest, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(suggest)}
              className="text-[11px] font-bold text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 hover:text-emerald-950 dark:hover:text-emerald-200 px-3 py-1.5 rounded-full border border-slate-300 dark:border-slate-700 flex-shrink-0 whitespace-nowrap transition-all shadow-2xs"
            >
              {suggest}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center space-x-2"
        >
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Ask Prof. Shelly anything..."
            className="flex-1 bg-slate-100 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
          />
          <button
            type="submit"
            disabled={!inputQuery.trim() || isTyping}
            className="bg-emerald-700 dark:bg-emerald-600 hover:bg-emerald-800 text-white p-2.5 rounded-xl shadow-xs disabled:opacity-40 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            title="Send Message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

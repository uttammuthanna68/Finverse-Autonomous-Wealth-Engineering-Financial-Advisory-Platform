import React, { useState, useRef, useEffect } from 'react';
import { ShellyMascot } from './ShellyMascot';
import { X, Send, Sparkles, RotateCcw, ArrowRight } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

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
      let response = await fetch('/api/engine/shelly-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: q,
          query: q,
          user_name: user?.full_name || 'Investor',
        }),
      });

      if (!response.ok) {
        response = await fetch('/api/shelly/ask', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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
          <strong key={index} className="font-extrabold text-main dark:text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return (
          <em key={index} className="italic text-primary dark:text-emerald-400">
            {part.slice(1, -1)}
          </em>
        );
      }
      return part;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-end sm:pr-8 p-0 sm:p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
      <div className="w-full sm:w-[440px] bg-card-bg rounded-t-3xl sm:rounded-3xl border border-primary/20 dark:border-emerald-500/30 shadow-floating overflow-hidden flex flex-col h-[85vh] sm:h-[600px] max-h-[90vh]">
        {/* Chat Header */}
        <div className="bg-primary dark:bg-emerald-950 p-4 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 dark:bg-white/10 flex items-center justify-center p-1 relative overflow-visible flex-shrink-0">
              <ShellyMascot pose="happy" size="sm" animateFloat={false} />
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-400 border-2 border-primary rounded-full" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5 font-black text-sm tracking-tight">
                <span>Prof. Shelly AI Assistant</span>
                <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300" />
              </div>
              <span className="text-[11px] text-white/80 font-bold block">
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
              title="Close Chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Chat Message Stream */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-surface/50 text-sm">
          {messages.map((msg) => {
            const isShelly = msg.sender === 'shelly';

            return (
              <div
                key={msg.id}
                className={`flex space-x-2.5 ${isShelly ? 'justify-start' : 'justify-end'}`}
              >
                {isShelly && (
                  <div className="w-8 h-8 rounded-full bg-primary/10 dark:bg-emerald-500/20 border border-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <ShellyMascot pose="happy" size="sm" animateFloat={false} className="w-6 h-6" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-4 space-y-2 shadow-xs ${
                    isShelly
                      ? 'bg-card-bg border border-black/10 dark:border-white/10 text-main rounded-tl-xs'
                      : 'bg-primary text-white rounded-tr-xs font-semibold'
                  }`}
                >
                  {isShelly && msg.source === 'gemini_ai' && (
                    <div className="flex items-center space-x-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full w-fit mb-1 border border-amber-500/20">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>Gemini AI Engine</span>
                    </div>
                  )}

                  <div className="leading-relaxed whitespace-pre-wrap text-sm font-medium">
                    {renderFormattedText(msg.text)}
                  </div>

                  {/* Quick Action Cards */}
                  {isShelly && msg.actions && msg.actions.length > 0 && (
                    <div className="pt-2 border-t border-black/10 dark:border-white/10 flex flex-wrap gap-1.5">
                      {msg.actions.map((act, actIdx) => (
                        <button
                          key={actIdx}
                          onClick={() => handleActionClick(act.path)}
                          className="bg-primary/10 hover:bg-primary/20 text-primary dark:text-emerald-300 text-xs font-bold px-3 py-1.5 rounded-xl border border-primary/20 flex items-center space-x-1 transition-all hover:scale-105"
                        >
                          <span>{act.label}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isTyping && (
            <div className="flex items-center space-x-2 text-muted text-xs font-semibold p-2">
              <ShellyMascot pose="thinking" size="sm" animateFloat={true} className="w-8 h-8" />
              <span>Prof. Shelly is analyzing financial parameters...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Pills */}
        <div className="p-2 border-t border-black/5 dark:border-white/5 bg-card-bg flex items-center space-x-2 overflow-x-auto no-scrollbar">
          <span className="text-[10px] font-bold uppercase text-muted flex-shrink-0 pl-2">Try:</span>
          {['What is SWP?', 'How to payoff 40% APR credit card?', 'SIP vs Lump sum'].map((suggest, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(suggest)}
              className="text-[11px] font-bold text-main dark:text-slate-200 bg-surface hover:bg-primary/10 px-2.5 py-1 rounded-full border border-black/10 dark:border-white/10 flex-shrink-0 whitespace-nowrap transition-colors"
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
          className="p-3 bg-card-bg border-t border-black/10 dark:border-white/10 flex items-center space-x-2"
        >
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Ask Prof. Shelly anything..."
            className="flex-1 bg-surface border border-black/10 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-main focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
          />
          <button
            type="submit"
            disabled={!inputQuery.trim() || isTyping}
            className="bg-primary hover:bg-primary/90 text-white p-2.5 rounded-xl shadow-xs disabled:opacity-40 transition-all hover:scale-105 active:scale-95"
            title="Send Message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

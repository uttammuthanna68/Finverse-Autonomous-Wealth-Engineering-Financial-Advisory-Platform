import React, { useState, useEffect } from 'react';
import { ShellyMascot } from './ShellyMascot';
import { ShellyChatModal } from './ShellyChatModal';
import { Sparkles, HelpCircle, X, Bot } from 'lucide-react';

interface FloatingShellyBadgeProps {
  onOpenTour: () => void;
  onNavigate: (path: string) => void;
}

export const FloatingShellyBadge: React.FC<FloatingShellyBadgeProps> = ({
  onOpenTour,
  onNavigate = (path: string) => { window.location.hash = path; },
}) => {
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [isBubbleOpen, setIsBubbleOpen] = useState<boolean>(false);
  const [quoteIndex, setQuoteIndex] = useState<number>(0);

  useEffect(() => {
    const handleOpenChat = () => {
      setIsChatOpen(true);
      setIsBubbleOpen(false);
    };
    window.addEventListener('open_shelly_chat' as any, handleOpenChat);
    return () => window.removeEventListener('open_shelly_chat' as any, handleOpenChat);
  }, []);

  const ShellyQuotes = [
    "Slow and steady wins the compounding race! 🐢",
    "High credit card dues (>24% APR) are scarier than a T-Rex. Clear them first!",
    "Emergency funds are your shell against life's unexpected rainy days.",
    "Diversify across equity, debt, and gold—never put all eggs in one basket!",
  ];

  const handleNextQuote = () => {
    setQuoteIndex((prev) => (prev + 1) % ShellyQuotes.length);
  };

  return (
    <>
      <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40 flex flex-col items-end">
        {/* Quick Speech Bubble Popup */}
        {isBubbleOpen && !isChatOpen && (
          <div className="bg-card-bg/95 shadow-floating rounded-2xl border border-primary/20 dark:border-emerald-500/30 p-4 sm:p-5 max-w-xs sm:max-w-sm mb-3 animate-fadeIn text-sm space-y-3 relative backdrop-blur-md">
            <button
              onClick={() => setIsBubbleOpen(false)}
              className="absolute top-2 right-2 text-muted hover:text-main p-1 rounded-full hover:bg-surface"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center space-x-1.5 text-primary dark:text-emerald-400 font-extrabold uppercase text-xs">
              <Sparkles className="w-4 h-4" />
              <span>Prof. Shelly's Wisdom</span>
            </div>

            <p
              onClick={handleNextQuote}
              title="Click to read another tip"
              className="text-main dark:text-slate-100 font-semibold leading-relaxed bg-surface p-3 rounded-xl border border-black/5 dark:border-white/5 cursor-pointer hover:bg-primary/5 transition-colors text-xs sm:text-sm"
            >
              "{ShellyQuotes[quoteIndex]}"
            </p>

            <div className="flex justify-between items-center pt-2 border-t border-black/5 dark:border-white/5">
              <button
                onClick={() => {
                  setIsBubbleOpen(false);
                  setIsChatOpen(true);
                }}
                className="text-xs font-bold text-primary dark:text-emerald-400 hover:underline flex items-center space-x-1"
              >
                <Bot className="w-4 h-4" />
                <span>Ask Question</span>
              </button>

              <button
                onClick={() => {
                  setIsBubbleOpen(false);
                  onOpenTour();
                }}
                className="bg-primary text-white font-extrabold px-3 py-1.5 rounded-lg text-xs flex items-center space-x-1 shadow-xs hover:bg-primary-hover transition-colors"
              >
                <HelpCircle className="w-4 h-4" />
                <span>Take Tour</span>
              </button>
            </div>
          </div>
        )}

        {/* Floating Mascot Button */}
        <button
          onClick={() => {
            setIsChatOpen(true);
            setIsBubbleOpen(false);
          }}
          className="group relative flex items-center focus:outline-none transition-transform hover:scale-105 active:scale-95 cursor-pointer"
          title="Ask Prof. Shelly AI Assistant"
        >
          <ShellyMascot pose="confident" size="md" animateFloat={true} />
          <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-md group-hover:bg-primary-hover flex items-center space-x-1 border border-white/20">
            <Sparkles className="w-3 h-3 fill-amber-300 text-amber-300" />
            <span>Ask Shelly</span>
          </span>
        </button>
      </div>

      {/* AI Chatbot Drawer Modal */}
      <ShellyChatModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        onNavigate={onNavigate}
      />
    </>
  );
};

import React, { useState } from 'react';
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
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end">
        {/* Quick Speech Bubble Popup */}
        {isBubbleOpen && !isChatOpen && (
          <div className="bg-card-bg shadow-2xl rounded-2xl border border-black/10 p-4 max-w-xs mb-3 animate-fadeIn text-xs space-y-3 relative">
            <button
              onClick={() => setIsBubbleOpen(false)}
              className="absolute top-2 right-2 text-muted hover:text-main p-1"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center space-x-1 text-primary font-extrabold uppercase text-[10px]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Prof. Shelly's Wisdom</span>
            </div>

            <p
              onClick={handleNextQuote}
              title="Click to read another tip"
              className="text-main font-semibold leading-relaxed bg-surface p-2.5 rounded-xl border border-black/5 cursor-pointer hover:bg-black/5 transition-colors"
            >
              "{ShellyQuotes[quoteIndex]}"
            </p>

            <div className="flex justify-between items-center pt-1 border-t border-black/5">
              <button
                onClick={() => {
                  setIsBubbleOpen(false);
                  setIsChatOpen(true);
                }}
                className="text-[11px] font-bold text-primary hover:underline flex items-center space-x-1"
              >
                <Bot className="w-3.5 h-3.5" />
                <span>Ask Question</span>
              </button>

              <button
                onClick={() => {
                  setIsBubbleOpen(false);
                  onOpenTour();
                }}
                className="bg-primary text-white font-extrabold px-3 py-1.5 rounded-lg text-[11px] flex items-center space-x-1 shadow-xs"
              >
                <HelpCircle className="w-3.5 h-3.5" />
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
          className="group relative flex items-center focus:outline-none transition-transform hover:scale-105 active:scale-95"
          title="Ask Prof. Shelly AI Assistant"
        >
          <ShellyMascot pose="confident" size="md" animateFloat={true} />
          <span className="absolute -top-1 -right-1 bg-primary text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-md group-hover:bg-primary-hover flex items-center space-x-1">
            <Sparkles className="w-2.5 h-2.5 fill-amber-300 text-amber-300" />
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


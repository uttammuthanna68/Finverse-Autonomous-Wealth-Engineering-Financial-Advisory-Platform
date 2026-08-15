import React, { useState, useEffect } from 'react';
import { ShellyMascot, ShellyPose } from './ShellyMascot';
import { X, Sparkles } from 'lucide-react';

export interface ShellyToastPayload {
  message: string;
  title?: string;
  pose?: ShellyPose;
  duration?: number;
}

export const showShellyToast = (payload: ShellyToastPayload) => {
  window.dispatchEvent(new CustomEvent('shelly_toast_event', { detail: payload }));
};

export const ShellyToast: React.FC = () => {
  const [toast, setToast] = useState<ShellyToastPayload | null>(null);

  useEffect(() => {
    const handleEvent = (e: CustomEvent<ShellyToastPayload>) => {
      setToast(e.detail);
    };

    window.addEventListener('shelly_toast_event' as any, handleEvent);
    return () => {
      window.removeEventListener('shelly_toast_event' as any, handleEvent);
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, toast.duration || 4500);

    return () => clearTimeout(timer);
  }, [toast]);

  if (!toast) return null;

  const pose = toast.pose || 'happy';

  return (
    <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-50 animate-bounce-in max-w-md w-full select-none p-2 sm:p-0">
      <div className="bg-card-bg/95 dark:bg-card-bg/95 border-2 border-primary/30 dark:border-emerald-500/40 p-4 sm:p-5 rounded-2xl shadow-floating flex items-center space-x-4 relative overflow-hidden backdrop-blur-md">
        <button
          onClick={() => setToast(null)}
          className="absolute top-2.5 right-2.5 p-1 text-muted hover:text-main rounded-full hover:bg-surface transition-colors"
          title="Dismiss Message"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex-shrink-0">
          <ShellyMascot pose={pose} size="sm" animateFloat={true} />
        </div>

        <div className="flex-1 space-y-1 pr-3">
          <div className="flex items-center space-x-1.5 text-primary dark:text-emerald-400 text-xs font-black uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{toast.title || 'Prof. Shelly'}</span>
          </div>
          <p className="text-sm font-semibold text-main leading-relaxed">
            {toast.message}
          </p>
        </div>
      </div>
    </div>
  );
};

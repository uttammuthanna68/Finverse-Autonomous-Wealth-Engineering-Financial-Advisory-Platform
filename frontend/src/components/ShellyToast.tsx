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
    <div className="fixed bottom-6 right-6 z-50 animate-bounce-in max-w-sm w-full select-none">
      <div className="bg-card-bg border-2 border-primary/30 p-4 rounded-card-lg shadow-2xl flex items-center space-x-3.5 relative overflow-hidden backdrop-blur-md">
        <button
          onClick={() => setToast(null)}
          className="absolute top-2 right-2 p-1 text-muted hover:text-main rounded-full hover:bg-surface transition-colors"
          title="Dismiss Message"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        <div className="flex-shrink-0">
          <ShellyMascot pose={pose} size="sm" animateFloat={true} className="w-14 h-14" />
        </div>

        <div className="flex-1 space-y-0.5 pr-3">
          <div className="flex items-center space-x-1 text-primary text-[11px] font-black uppercase tracking-wider">
            <Sparkles className="w-3 h-3" />
            <span>{toast.title || 'Prof. Shelly'}</span>
          </div>
          <p className="text-xs font-bold text-main leading-snug">
            {toast.message}
          </p>
        </div>
      </div>
    </div>
  );
};

'use client';

import { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info' | 'loading';
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, type, onClose, duration = 4000 }: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    if (type !== 'loading') {
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onClose, 300);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose, type]);

  const icons = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
    loading: '⏳',
  };

  const colors = {
    success: 'border-green-500/40 bg-green-950/90',
    error: 'border-red-500/40 bg-red-950/90',
    info: 'border-purple-500/40 bg-purple-950/90',
    loading: 'border-blue-500/40 bg-blue-950/90',
  };

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-md shadow-2xl text-sm text-white
        transition-all duration-300
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
        ${colors[type]}`}
      style={{ maxWidth: 380 }}
    >
      <span>{icons[type]}</span>
      <span className="flex-1">{message}</span>
      {type !== 'loading' && (
        <button onClick={onClose} className="text-white/40 hover:text-white transition-colors ml-2">×</button>
      )}
    </div>
  );
}

// Toast Container
export function ToastContainer({ toasts }: { toasts: ToastItem[] }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <Toast key={t.id} {...t} />
      ))}
    </div>
  );
}

export interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'loading';
  onClose: () => void;
  duration?: number;
}

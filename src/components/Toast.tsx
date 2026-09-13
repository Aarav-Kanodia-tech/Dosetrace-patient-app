import { useEffect, useState, type ReactNode } from 'react';
import { CheckCircle2 } from 'lucide-react';

type ToastProps = {
  message: string;
  onClose: () => void;
  duration?: number;
};

export function Toast({ message, onClose, duration = 2500 }: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    const timer = window.setTimeout(() => {
      setVisible(false);
      window.setTimeout(onClose, 300);
    }, duration);
    return () => window.clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div
      className={`fixed bottom-24 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-2 rounded-full bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-xl transition-all duration-300 ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      }`}
    >
      <CheckCircle2 size={15} className="text-emerald-400" />
      {message}
    </div>
  );
}

export function useToast() {
  const [toast, setToast] = useState<ReactNode | null>(null);

  function showToast(message: string) {
    setToast(<Toast message={message} onClose={() => setToast(null)} />);
  }

  return { toast, showToast };
}

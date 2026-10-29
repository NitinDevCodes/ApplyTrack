import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { CheckCircle2, X, AlertCircle } from 'lucide-react';

const ToastContext = createContext(null);
export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const notify = useCallback((message, type = 'success') => setToast({ message, type, id: Date.now() }), []);
  useEffect(() => { if (toast) { const timer = setTimeout(() => setToast(null), 5000); return () => clearTimeout(timer); } }, [toast]);
  return <ToastContext.Provider value={notify}>{children}<div className="toast-region" aria-live="polite">{toast && <div className={`toast ${toast.type === 'error' ? 'toast-error' : ''}`}>{toast.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}<span>{toast.message}</span><button aria-label="Dismiss notification" onClick={() => setToast(null)}><X size={17} /></button></div>}</div></ToastContext.Provider>;
}
export const useToast = () => useContext(ToastContext);

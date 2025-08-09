import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface ToastState {
  message: string;
  type: ToastType;
  isVisible: boolean;
}

interface ToastContextType {
  showToast: (message: string, type: ToastType) => void;
  toastConfig: ToastState | null;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toastConfig, setToastConfig] = useState<ToastState | null>(null);
  const [timeoutId, setTimeoutId] = useState<number | null>(null);

  const showToast = useCallback((message: string, type: ToastType) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    setToastConfig({ message, type, isVisible: true });
    
    const newTimeoutId = window.setTimeout(() => {
      setToastConfig(prev => prev ? { ...prev, isVisible: false } : null);
    }, 4000);
    setTimeoutId(newTimeoutId);
  }, [timeoutId]);


  return (
    <ToastContext.Provider value={{ showToast, toastConfig }}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

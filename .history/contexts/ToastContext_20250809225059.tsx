import React, { createContext, useState, useContext, ReactNode, useCallback, useRef } from 'react';

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
  const timeoutIdRef = useRef<number | null>(null);

  const showToast = useCallback((message: string, type: ToastType) => {
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
    }
    setToastConfig({ message, type, isVisible: true });
    
    timeoutIdRef.current = window.setTimeout(() => {
      setToastConfig(prev => prev ? { ...prev, isVisible: false } : null);
      timeoutIdRef.current = null;
    }, 4000);
  }, []);


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
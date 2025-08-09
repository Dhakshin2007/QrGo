import React from 'react';
import { useToast } from '../contexts/ToastContext';
import { CheckCircle, XCircle, Info } from 'lucide-react';

const icons = {
  success: <CheckCircle className="text-green-400" size={24} />,
  error: <XCircle className="text-red-400" size={24} />,
  info: <Info className="text-blue-400" size={24} />,
};

const bgColors = {
  success: 'bg-green-500/20 border-green-500',
  error: 'bg-red-500/20 border-red-500',
  info: 'bg-blue-500/20 border-blue-500',
};

const Toast: React.FC = () => {
  const { toastConfig } = useToast();

  if (!toastConfig) {
    return null;
  }
  
  const { message, type, isVisible } = toastConfig;
  
  return (
    <div
      aria-live="assertive"
      className={`fixed bottom-5 right-5 z-50 transition-all duration-300 ease-in-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
    >
      <div className={`flex items-center gap-4 p-4 rounded-lg shadow-lg border-l-4 text-on-surface bg-surface ${bgColors[type]}`}>
        <div>{icons[type]}</div>
        <p className="font-semibold">{message}</p>
      </div>
    </div>
  );
};

export default Toast;

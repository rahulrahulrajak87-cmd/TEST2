import React from 'react';

interface AlertToastProps {
  message: string;
  type: 'error' | 'success' | 'info';
  visible: boolean;
  onClose: () => void;
}

export const AlertToast: React.FC<AlertToastProps> = ({ message, type, visible, onClose }) => {
  if (!visible) return null;

  const getBorderAndBg = () => {
    switch (type) {
      case 'success':
        return 'border-green-500 bg-green-950/90 text-green-300';
      case 'info':
        return 'border-blue-500 bg-blue-950/90 text-blue-300';
      default:
        return 'border-red-500 bg-red-950/90 text-red-300';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return 'fa-check-circle text-green-400';
      case 'info':
        return 'fa-info-circle text-blue-400';
      default:
        return 'fa-exclamation-triangle text-red-400';
    }
  };

  return (
    <div className={`fixed top-8 left-4 right-4 max-w-md mx-auto p-4 rounded-2xl shadow-2xl flex items-center z-[500] font-medium border backdrop-blur-md transition-all fade-in ${getBorderAndBg()}`}>
      <i className={`fas ${getIcon()} text-xl mr-3`}></i>
      <span className="flex-1 text-sm leading-snug">{message}</span>
      <button onClick={onClose} className="p-1 hover:opacity-100 opacity-70 transition ml-2">
        <i className="fas fa-times text-base"></i>
      </button>
    </div>
  );
};

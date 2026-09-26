import React from 'react';
import { NotificationItem } from '../types';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  loading: boolean;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  notifications,
  loading
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[200] flex flex-col p-4 fade-in max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-6 pt-2 border-b border-gray-800 pb-3">
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-[#1b263b] border border-gray-800 flex items-center justify-center text-gray-300 hover:text-white transition active:scale-90"
        >
          <i className="fas fa-arrow-left"></i>
        </button>
        <h2 className="text-xl font-bold text-white">System Messages</h2>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pb-10 hide-scroll">
        {loading ? (
          <p className="text-center text-gray-500 py-10 animate-pulse">Loading messages...</p>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <i className="fas fa-bell-slash text-4xl mb-3 opacity-40"></i>
            <p className="text-sm">No messages yet.</p>
          </div>
        ) : (
          notifications.map((n) => {
            let icon = 'fa-bell text-blue-400';
            let border = 'border-blue-900/30';
            if (n.type === 'success') {
              icon = 'fa-check-circle text-green-400';
              border = 'border-green-900/30';
            } else if (n.type === 'error') {
              icon = 'fa-exclamation-circle text-red-400';
              border = 'border-red-900/30';
            }

            const dateStr = n.date?.seconds
              ? new Date(n.date.seconds * 1000).toLocaleString()
              : 'Just now';

            return (
              <div key={n.id} className={`glass-panel p-4 rounded-xl border ${border} shadow-md`}>
                <div className="flex gap-3">
                  <i className={`fas ${icon} mt-1 text-lg`}></i>
                  <div className="flex-1">
                    <h3 className="font-bold text-white text-sm mb-1">{n.title}</h3>
                    <p className="text-xs text-gray-300 leading-relaxed">{n.msg}</p>
                    <p className="text-[10px] text-gray-500 mt-2">{dateStr}</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

interface GlobalNoticeModalProps {
  isOpen: boolean;
  message: string;
  onClose: () => void;
}

export const GlobalNoticeModal: React.FC<GlobalNoticeModalProps> = ({
  isOpen,
  message,
  onClose
}) => {
  if (!isOpen || !message) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[500] flex items-center justify-center p-4 fade-in">
      <div className="glass-panel w-full max-w-sm p-6 rounded-3xl shadow-[0_0_40px_rgba(0,180,216,0.3)] relative text-center border border-[#00b4d8]/40">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition active:scale-95 text-lg"
        >
          <i className="fas fa-times"></i>
        </button>
        <div className="w-16 h-16 bg-[#00b4d8] rounded-full flex items-center justify-center text-white text-3xl mx-auto mb-4 shadow-lg shadow-[#00b4d8]/40">
          <i className="fas fa-bullhorn animate-bounce"></i>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Important Notice</h2>
        <div className="text-sm text-gray-300 mb-6 leading-relaxed bg-[#0d1b2a] p-4 rounded-xl border border-gray-800 max-h-60 overflow-y-auto">
          {message}
        </div>
        <button
          onClick={onClose}
          className="w-full btn-primary py-3.5 rounded-xl text-white font-black tracking-widest uppercase"
        >
          I Understand
        </button>
      </div>
    </div>
  );
};

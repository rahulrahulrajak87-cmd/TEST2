import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { UserData, GlobalSettings, TeamCounts } from '../types';

interface HomeTabProps {
  user: UserData;
  settings: GlobalSettings;
  teamCounts: TeamCounts;
  unreadCount: number;
  onOpenNotifications: () => void;
  onOpenRecharge: () => void;
  onOpenWithdraw: () => void;
  onOpenTeam: () => void;
  onOpenWheel: () => void;
  onNavigateToInvest: () => void;
  onDailySignIn: () => Promise<void>;
  showAlert: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const HomeTab: React.FC<HomeTabProps> = ({
  user,
  settings,
  teamCounts,
  unreadCount,
  onOpenNotifications,
  onOpenRecharge,
  onOpenWithdraw,
  onOpenTeam,
  onOpenWheel,
  onNavigateToInvest,
  onDailySignIn,
  showAlert
}) => {
  const [checkingIn, setCheckingIn] = useState(false);

  const handleCopyInvite = () => {
    const inviteLink = `${window.location.origin}/?ref=${user.inviteCode}`;
    navigator.clipboard.writeText(inviteLink);
    showAlert(`Invite link copied to clipboard! Code: ${user.inviteCode}`, 'success');
  };

  const handleSignInClick = async () => {
    const today = new Date().toDateString();
    if (user.lastSignIn === today) {
      showAlert('You have already claimed your daily check-in today!', 'error');
      return;
    }
    setCheckingIn(true);
    try {
      await onDailySignIn();
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    } catch (err: any) {
      showAlert(err.message || 'Check-in failed', 'error');
    } finally {
      setCheckingIn(false);
    }
  };

  return (
    <div className="tab-content block p-4 fade-in pb-28">
      {/* Top Header & Profile */}
      <div className="flex justify-between items-center mb-6 pt-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full border-2 border-[#00b4d8] flex items-center justify-center bg-[#1b263b] text-[#00b4d8] shadow-[0_0_10px_rgba(0,180,216,0.2)]">
            <i className="fas fa-user-tie text-xl"></i>
          </div>
          <div>
            <h2 className="text-lg font-bold text-white leading-tight flex items-center gap-2">
              {user.name || 'User'}{' '}
              <i className="fas fa-circle-check text-[10px] text-blue-400"></i>
            </h2>
            <p className="text-[10px] text-gray-400 font-mono mt-0.5">
              ID: <span className="text-white">{user.uid.slice(0, 6)}</span> |{' '}
              <span>{user.email.replace(/(.{2})(.*)(@.*)/, '$1***$3')}</span>
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <a
            href="https://t.me/Pvt_ruhi"
            target="_blank"
            rel="noreferrer"
            className="w-10 h-10 rounded-full bg-[#1b263b] border border-gray-800 flex items-center justify-center text-gray-300 hover:text-[#00b4d8] transition active:scale-90"
          >
            <i className="fas fa-headset"></i>
          </a>
          <button
            onClick={onOpenNotifications}
            className="w-10 h-10 rounded-full bg-[#1b263b] border border-gray-800 flex items-center justify-center text-gray-300 hover:text-[#00b4d8] transition active:scale-90 relative"
          >
            <i className="fas fa-bell"></i>
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-[#1b263b]"></span>
            )}
          </button>
        </div>
      </div>

      {/* Balance & Dashboard Section */}
      <div className="bg-gradient-to-br from-[#172233] to-[#0d1b2a] rounded-2xl p-5 border border-gray-800 shadow-[0_8px_30px_rgba(0,0,0,0.6)] mb-6 relative overflow-hidden slide-up">
        <div className="w-40 h-40 bg-[#00b4d8] opacity-5 rounded-full -top-10 -right-10 absolute pointer-events-none filter blur-2xl"></div>

        <div className="grid grid-cols-3 gap-2 mb-6 border-b border-gray-800 pb-5 relative z-10">
          <div className="text-center">
            <p className="text-[10px] text-gray-400 mb-1 uppercase tracking-wider">Recharge Bal</p>
            <h3 className="text-sm font-bold text-white">₹{user.rechargeBal.toFixed(2)}</h3>
          </div>
          <div className="text-center border-l border-gray-800">
            <p className="text-[10px] text-[#00e676] mb-1 uppercase tracking-wider font-bold">
              Withdrawable Bal
            </p>
            <h3 className="text-sm font-bold text-white">₹{user.withdrawBal.toFixed(2)}</h3>
          </div>
          <div className="text-center border-l border-gray-800">
            <p className="text-[10px] text-gray-400 mb-1 uppercase tracking-wider">Product Income</p>
            <h3 className="text-sm font-bold text-[#00b4d8] drop-shadow-md">
              ₹{user.incomeBal.toFixed(2)}
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 relative z-10">
          <button
            onClick={onOpenRecharge}
            className="flex flex-col items-center gap-2 group active:scale-90 transition cursor-pointer"
          >
            <div className="w-11 h-11 rounded-2xl bg-[#223047] border border-gray-700 flex items-center justify-center text-[#00b4d8] group-hover:bg-[#00b4d8] group-hover:text-black transition">
              <i className="fas fa-wallet text-lg"></i>
            </div>
            <span className="text-[10px] text-gray-400 font-medium">Recharge</span>
          </button>
          <button
            onClick={onOpenWithdraw}
            className="flex flex-col items-center gap-2 group active:scale-90 transition cursor-pointer"
          >
            <div className="w-11 h-11 rounded-2xl bg-[#223047] border border-gray-700 flex items-center justify-center text-[#00e676] group-hover:bg-[#00e676] group-hover:text-black transition">
              <i className="fas fa-arrow-up-from-bracket text-lg"></i>
            </div>
            <span className="text-[10px] text-gray-400 font-medium">Withdraw</span>
          </button>
          <button
            onClick={onOpenTeam}
            className="flex flex-col items-center gap-2 group active:scale-90 transition cursor-pointer"
          >
            <div className="w-11 h-11 rounded-2xl bg-[#223047] border border-gray-700 flex items-center justify-center text-blue-400 group-hover:bg-blue-400 group-hover:text-black transition">
              <i className="fas fa-user-group text-lg"></i>
            </div>
            <span className="text-[10px] text-gray-400 font-medium">Team</span>
          </button>
          <a
            href="https://t.me/premiumwealth8"
            target="_blank"
            rel="noreferrer"
            className="flex flex-col items-center gap-2 group active:scale-90 transition"
          >
            <div className="w-11 h-11 rounded-2xl bg-[#223047] border border-gray-700 flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition">
              <i className="fab fa-telegram-plane text-xl"></i>
            </div>
            <span className="text-[10px] text-gray-400 font-medium">Telegram</span>
          </a>
        </div>
      </div>

      {/* Referral & Commission Section */}
      <div className="glass-panel p-4 rounded-xl shadow-lg mb-6 flex justify-between items-center slide-up">
        <div>
          <h3 className="font-bold text-sm text-[#00b4d8] mb-0.5">Invite Friends to Earn Commission</h3>
          <p className="text-[10px] text-gray-400 mb-3">Invest together, grow rich together</p>
          <div className="flex items-center gap-5">
            <div>
              <p className="text-[9px] text-gray-500 uppercase tracking-wide">Total Commission</p>
              <p className="text-xs font-bold text-white mt-0.5">₹{user.totalCommission.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-[9px] text-gray-500 uppercase tracking-wide">Invite Code</p>
              <p className="text-xs font-bold text-[#00e676] mt-0.5 tracking-wider">
                {user.inviteCode}
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={handleCopyInvite}
          className="w-12 h-12 shrink-0 rounded-full bg-gradient-to-tr from-[#00b4d8] to-blue-300 text-white flex items-center justify-center text-xl shadow-[0_4px_15px_rgba(0,180,216,0.3)] active:scale-90 transition cursor-pointer"
        >
          <i className="fas fa-link"></i>
        </button>
      </div>

      {/* Dynamic Rebate / Level Tier Section */}
      <div className="mb-6 space-y-3 slide-up">
        <div className="bg-[#1e2a3e] p-3.5 rounded-xl flex items-center justify-between border border-gray-800 relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>
          <div className="flex items-center gap-3 pl-2">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/30">
              <i className="fas fa-medal text-lg"></i>
            </div>
            <div>
              <p className="font-bold text-sm text-white">{settings.tier1}% Lv 1 Rebate</p>
              <p className="text-[10px] text-gray-400 font-semibold">LV 1</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-white">
              <span>{teamCounts.lv1}</span>{' '}
              <span className="font-normal text-gray-500 text-[10px]">Total invite</span>
            </p>
          </div>
        </div>

        <div className="bg-[#1e2a3e] p-3.5 rounded-xl flex items-center justify-between border border-gray-800 relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gray-300"></div>
          <div className="flex items-center gap-3 pl-2">
            <div className="w-10 h-10 rounded-full bg-gray-300/10 flex items-center justify-center text-gray-300 border border-gray-300/30">
              <i className="fas fa-medal text-lg"></i>
            </div>
            <div>
              <p className="font-bold text-sm text-white">{settings.tier2}% Lv 2 Rebate</p>
              <p className="text-[10px] text-gray-400 font-semibold">LV 2</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-white">
              <span>{teamCounts.lv2}</span>{' '}
              <span className="font-normal text-gray-500 text-[10px]">Total invite</span>
            </p>
          </div>
        </div>

        <div className="bg-[#1e2a3e] p-3.5 rounded-xl flex items-center justify-between border border-gray-800 relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-400"></div>
          <div className="flex items-center gap-3 pl-2">
            <div className="w-10 h-10 rounded-full bg-blue-400/10 flex items-center justify-center text-blue-400 border border-blue-400/30">
              <i className="fas fa-medal text-lg"></i>
            </div>
            <div>
              <p className="font-bold text-sm text-white">{settings.tier3}% Lv 3 Rebate</p>
              <p className="text-[10px] text-gray-400 font-semibold">LV 3</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-white">
              <span>{teamCounts.lv3}</span>{' '}
              <span className="font-normal text-gray-500 text-[10px]">Total invite</span>
            </p>
          </div>
        </div>
      </div>

      {/* Rewards & Tasks Section */}
      <div className="mb-4 slide-up">
        <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
          <i className="fas fa-gift text-[#00b4d8]"></i> Rewards & Tasks
        </h3>
        <div className="space-y-3">
          <div className="bg-[#1b263b] p-4 rounded-xl border border-gray-800 flex justify-between items-center relative overflow-hidden">
            <div className="z-10 w-[70%]">
              <h4 className="font-bold text-sm text-white mb-1">Sign in to receive rewards</h4>
              <p className="text-[10px] text-gray-400 mb-3 leading-snug">
                Daily check-in can receive ₹1.00 - ₹5.00
              </p>
              <button
                onClick={handleSignInClick}
                disabled={checkingIn}
                className="bg-gradient-to-r from-blue-400 to-blue-600 text-white text-[11px] font-bold px-5 py-2 rounded-full shadow-[0_0_15px_rgba(0,180,216,0.4)] active:scale-95 transition cursor-pointer"
              >
                {checkingIn ? 'Claiming...' : 'Sign in now'}
              </button>
            </div>
            <div className="absolute -right-3 top-4 opacity-90 z-0 drop-shadow-[0_0_15px_rgba(0,180,216,0.4)]">
              <i className="fas fa-box-open text-6xl text-blue-500"></i>
            </div>
          </div>

          <div className="bg-[#1b263b] p-4 rounded-xl border border-gray-800 flex justify-between items-center relative overflow-hidden">
            <div className="z-10 w-[70%]">
              <h4 className="font-bold text-sm text-white mb-1">Lucky Draw</h4>
              <p className="text-[10px] text-gray-400 mb-3 leading-snug">
                The lucky wheel keeps spinning with great gifts
              </p>
              <button
                onClick={onOpenWheel}
                className="bg-gradient-to-r from-blue-400 to-blue-600 text-white text-[11px] font-bold px-6 py-2 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.4)] active:scale-95 transition cursor-pointer"
              >
                Go <i className="fas fa-arrow-right ml-1"></i>
              </button>
            </div>
            <div className="absolute -right-3 top-4 opacity-90 z-0 drop-shadow-[0_0_15px_rgba(59,130,246,0.4)]">
              <i className="fas fa-gem text-6xl text-blue-400"></i>
            </div>
          </div>

          <div className="bg-[#1b263b] p-4 rounded-xl border border-gray-800 flex justify-between items-center relative overflow-hidden">
            <div className="z-10 w-[70%]">
              <h4 className="font-bold text-sm text-white mb-1">Task reward</h4>
              <p className="text-[10px] text-gray-400 mb-3 leading-snug">
                Buy plans and refer friends to get wheel spins
              </p>
              <button
                onClick={onNavigateToInvest}
                className="bg-gradient-to-r from-blue-400 to-blue-600 text-white text-[11px] font-bold px-6 py-2 rounded-full shadow-[0_0_15px_rgba(0,180,216,0.4)] active:scale-95 transition cursor-pointer"
              >
                Go <i className="fas fa-arrow-right ml-1"></i>
              </button>
            </div>
            <div className="absolute -right-3 top-4 opacity-90 z-0 drop-shadow-[0_0_15px_rgba(0,180,216,0.4)]">
              <i className="fas fa-sack-dollar text-6xl text-blue-400"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="text-center mt-8 pb-2 text-[10px] text-gray-500 tracking-wider">
        &copy; 2026 SR MILKS PVT. LTD. All Rights Reserved.
      </div>
    </div>
  );
};

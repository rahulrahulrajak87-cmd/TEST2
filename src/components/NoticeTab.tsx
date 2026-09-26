import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { UserData } from '../types';

interface NoticeTabProps {
  user: UserData;
  onClaimVipReward: (level: number, bonus: number) => Promise<void>;
  onBackToHome: () => void;
  showAlert: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

const vips = [
  { level: 0, req: 0 },
  { level: 1, req: 280 },
  { level: 2, req: 1000 },
  { level: 3, req: 3000 },
  { level: 4, req: 8000 },
  { level: 5, req: 15000 },
  { level: 6, req: 35000 },
  { level: 7, req: 80000 },
  { level: 8, req: 150000 }
];

const vipRewards: Record<number, number> = {
  0: 0,
  1: 5,
  2: 25,
  3: 80,
  4: 250,
  5: 500,
  6: 1200,
  7: 3000,
  8: 7000
};

export const NoticeTab: React.FC<NoticeTabProps> = ({
  user,
  onClaimVipReward,
  onBackToHome,
  showAlert
}) => {
  const [claiming, setClaiming] = useState(false);

  // Compute current VIP Level
  let currentLevel = 0;
  for (let i = 0; i < vips.length; i++) {
    if ((user.totalRecharged || 0) >= vips[i].req) {
      currentLevel = vips[i].level;
    }
  }

  const bonus = vipRewards[currentLevel] || 0;
  const todayStr = new Date().toDateString();
  const alreadyClaimed = user.lastVipClaimDate === todayStr;

  const handleClaim = async () => {
    if (bonus <= 0) {
      showAlert('Current VIP reward is ₹0. Upgrade your VIP tier to claim daily rewards!', 'info');
      return;
    }
    if (alreadyClaimed) {
      showAlert('Already claimed your VIP Daily Reward today!', 'error');
      return;
    }

    setClaiming(true);
    try {
      await onClaimVipReward(currentLevel, bonus);
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    } catch (err: any) {
      showAlert(err.message || 'Claim failed', 'error');
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="tab-content block p-4 fade-in pb-28">
      {/* Top Header */}
      <div className="flex justify-between items-center mb-6 pt-2 sticky top-0 z-40 bg-[#0d1b2a]/90 backdrop-blur-md pb-3 border-b border-gray-800/50">
        <button
          onClick={onBackToHome}
          className="w-10 h-10 rounded-full bg-[#1b263b] border border-gray-800 flex items-center justify-center text-gray-300 hover:text-[#00b4d8] transition shadow-[0_0_15px_rgba(0,0,0,0.5)] active:scale-90"
        >
          <i className="fas fa-arrow-left text-lg"></i>
        </button>
        <h1 className="text-2xl font-bold tracking-wide text-white">
          Notice & <span className="text-[#00b4d8]">Rewards</span>
        </h1>
        <div className="w-10 h-10"></div>
      </div>

      <div className="space-y-5 relative">
        {/* Recharge Rewards Card */}
        <div className="glass-panel p-5 rounded-2xl shadow-lg relative overflow-hidden slide-up border border-blue-900/40">
          <div className="absolute top-0 right-0 w-24 h-24 notice-icon-bg rounded-bl-full z-0 flex items-start justify-end p-4 opacity-50">
            <i className="fas fa-hand-holding-dollar text-4xl text-blue-400 drop-shadow-lg"></i>
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 border border-blue-500/30">
                <i className="fas fa-coins text-lg"></i>
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Recharge Rewards</h3>
                <p className="text-[10px] text-blue-300">Daily Cumulative Bonus (Compounds)</p>
              </div>
            </div>

            <div className="space-y-3 mt-4">
              <div className="bg-[#0d1b2a] rounded-xl p-3 border border-gray-800 flex justify-between items-center">
                <div>
                  <p className="text-xs text-gray-400">
                    Recharge <span className="text-white font-bold tracking-wide">₹10,000</span>
                  </p>
                  <p className="text-[10px] text-[#00b4d8] mt-0.5">
                    Reward: <span className="font-bold text-[#00e676]">+₹800</span>
                  </p>
                </div>
                <button
                  onClick={() => showAlert('Requirement not met. Cumulative deposit must reach ₹10,000.', 'error')}
                  className="bg-gray-800 text-gray-400 text-[10px] font-bold px-4 py-1.5 rounded-full border border-gray-700 cursor-pointer"
                >
                  Claim
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* VIP Sign-In Reward Card */}
        <div className="glass-panel p-5 rounded-2xl shadow-lg relative overflow-hidden slide-up">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-blue-600/20 to-transparent rounded-bl-full z-0 flex items-start justify-end p-4 opacity-70">
            <i className="fas fa-crown text-4xl text-[#00b4d8] drop-shadow-[0_0_10px_rgba(0,180,216,0.8)]"></i>
          </div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-white text-base">VIP Sign-In Reward</h3>
                <p className="text-[10px] text-gray-400">Daily automated bonus by tier</p>
              </div>
              <span className="bg-[#00b4d8]/20 text-[#00b4d8] text-[10px] px-2 py-1 rounded border border-[#00b4d8]/30 font-bold">
                Current: V{currentLevel}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4">
              <div
                className={`bg-[#0d1b2a] p-2.5 rounded-lg border text-center ${
                  currentLevel === 0 ? 'border-[#00b4d8] bg-[#00b4d8]/10' : 'border-gray-800'
                }`}
              >
                <p className="text-[10px] text-gray-400 font-bold">V0</p>
                <p className="text-xs text-white mt-0.5">₹0</p>
              </div>
              <div
                className={`bg-[#0d1b2a] p-2.5 rounded-lg border text-center ${
                  currentLevel === 1 ? 'border-[#00b4d8] bg-[#00b4d8]/10' : 'border-gray-800'
                }`}
              >
                <p className="text-[10px] text-[#00b4d8] font-bold">V1</p>
                <p className="text-xs text-[#00e676] font-bold mt-0.5">₹5</p>
              </div>
              <div
                className={`bg-[#0d1b2a] p-2.5 rounded-lg border text-center ${
                  currentLevel >= 2 ? 'border-[#00b4d8] bg-[#00b4d8]/10' : 'border-gray-800'
                }`}
              >
                <p className="text-[10px] text-blue-400 font-bold">V2+</p>
                <p className="text-xs text-[#00e676] font-bold mt-0.5">₹25+</p>
              </div>
            </div>

            <button
              onClick={handleClaim}
              disabled={claiming || alreadyClaimed}
              className={`w-full btn-primary py-2.5 rounded-xl text-sm text-white shadow-md active:scale-[0.98] ${
                alreadyClaimed ? 'btn-disabled' : ''
              }`}
            >
              {claiming
                ? 'Processing...'
                : alreadyClaimed
                ? 'Claimed Today'
                : `Claim Daily Reward (₹${bonus})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

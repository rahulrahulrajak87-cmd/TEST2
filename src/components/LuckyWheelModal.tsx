import React, { useState } from 'react';
import confetti from 'canvas-confetti';

interface LuckyWheelModalProps {
  isOpen: boolean;
  onClose: () => void;
  spinCount: number;
  onSpinWin: (amount: number) => Promise<void>;
}

export const LuckyWheelModal: React.FC<LuckyWheelModalProps> = ({
  isOpen,
  onClose,
  spinCount,
  onSpinWin
}) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);

  if (!isOpen) return null;

  const handleSpin = async () => {
    if (isSpinning) return;
    if (spinCount <= 0) return;

    setIsSpinning(true);

    const rewards = [
      { amt: 3, angle: 1774.3 },
      { amt: 7, angle: 1722.9 },
      { amt: 9, angle: 1671.5 },
      { amt: 13, angle: 1620.1 },
      { amt: 25, angle: 1568.7 }
    ];
    const picked = rewards[Math.floor(Math.random() * rewards.length)];

    const finalAngle = wheelRotation + picked.angle;
    setWheelRotation(finalAngle);

    setTimeout(async () => {
      try {
        await onSpinWin(picked.amt);
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 }
        });
      } finally {
        setIsSpinning(false);
      }
    }, 4000);
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[200] flex items-center justify-center p-4">
      <div className="glass-panel p-6 rounded-3xl shadow-[0_0_40px_rgba(0,180,216,0.2)] relative max-w-[320px] w-full text-center border border-[#00b4d8]/40">
        <h2 className="text-2xl font-black text-white mb-2 tracking-wide uppercase">
          Lucky <span className="text-[#00b4d8]">Draw</span>
        </h2>
        <p className="text-xs text-gray-300 mb-6">
          Spins Available:{' '}
          <span className="text-[#00e676] font-black text-sm ml-1">{spinCount}</span>
        </p>

        <div className="relative w-[240px] h-[240px] mx-auto mb-8">
          <div className="wheel-pointer"></div>
          <div
            id="wheelElement"
            className="w-full h-full rounded-full border-4 border-[#00b4d8] shadow-[0_0_25px_rgba(0,180,216,0.6)] relative overflow-hidden"
            style={{
              transition: isSpinning
                ? 'transform 4s cubic-bezier(0.17, 0.67, 0.1, 1)'
                : 'none',
              transform: `rotate(${wheelRotation}deg)`,
              background:
                'conic-gradient(#1b263b 0 51.4deg, #223047 51.4deg 102.8deg, #1b263b 102.8deg 154.2deg, #223047 154.2deg 205.7deg, #1b263b 205.7deg 257.1deg, #223047 257.1deg 308.5deg, #1b263b 308.5deg 360deg)'
            }}
          >
            <div className="absolute inset-0" style={{ transform: 'rotate(25.7deg)' }}>
              <div className="absolute top-3 left-1/2 -translate-x-1/2 text-white font-black text-base drop-shadow-md">₹3</div>
            </div>
            <div className="absolute inset-0" style={{ transform: 'rotate(77.1deg)' }}>
              <div className="absolute top-3 left-1/2 -translate-x-1/2 text-[#00b4d8] font-black text-base drop-shadow-md">₹7</div>
            </div>
            <div className="absolute inset-0" style={{ transform: 'rotate(128.5deg)' }}>
              <div className="absolute top-3 left-1/2 -translate-x-1/2 text-white font-black text-base drop-shadow-md">₹9</div>
            </div>
            <div className="absolute inset-0" style={{ transform: 'rotate(179.9deg)' }}>
              <div className="absolute top-3 left-1/2 -translate-x-1/2 text-[#00b4d8] font-black text-base drop-shadow-md">₹13</div>
            </div>
            <div className="absolute inset-0" style={{ transform: 'rotate(231.3deg)' }}>
              <div className="absolute top-3 left-1/2 -translate-x-1/2 text-white font-black text-base drop-shadow-md">₹25</div>
            </div>
            <div className="absolute inset-0" style={{ transform: 'rotate(282.7deg)' }}>
              <div className="absolute top-3 left-1/2 -translate-x-1/2 text-[#00b4d8] font-black text-base drop-shadow-md">₹35</div>
            </div>
            <div className="absolute inset-0" style={{ transform: 'rotate(334.1deg)' }}>
              <div className="absolute top-3 left-1/2 -translate-x-1/2 text-white font-black text-base drop-shadow-md">₹50</div>
            </div>

            <div className="absolute inset-0 m-auto w-10 h-10 bg-[#00b4d8] rounded-full border-[3px] border-[#0d1b2a] z-10 shadow-lg"></div>
          </div>
        </div>

        <button
          onClick={handleSpin}
          disabled={isSpinning || spinCount <= 0}
          className={`btn-primary w-full py-3.5 rounded-xl text-white font-black text-base tracking-wider uppercase mb-3 shadow-[0_0_15px_rgba(0,180,216,0.4)] ${
            isSpinning || spinCount <= 0 ? 'btn-disabled' : ''
          }`}
        >
          {isSpinning ? 'Spinning...' : 'Spin Now'}
        </button>
        <button
          onClick={onClose}
          disabled={isSpinning}
          className="text-gray-500 text-xs font-bold uppercase tracking-wider hover:text-white transition"
        >
          Close
        </button>
      </div>
    </div>
  );
};

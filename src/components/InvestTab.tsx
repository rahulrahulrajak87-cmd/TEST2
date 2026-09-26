import React, { useState } from 'react';
import { Product } from '../types';

interface InvestTabProps {
  products: Product[];
  rechargeBal: number;
  onBuyProduct: (product: Product) => Promise<void>;
  onOpenOrderHistory: () => void;
  loading: boolean;
  showAlert: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const InvestTab: React.FC<InvestTabProps> = ({
  products,
  rechargeBal,
  onBuyProduct,
  onOpenOrderHistory,
  loading,
  showAlert
}) => {
  const [activeCategory, setActiveCategory] = useState<'stable' | 'welfare' | 'activity'>('stable');
  const [buyingId, setBuyingId] = useState<string | null>(null);

  const filteredProducts = products.filter((p) => p.category === activeCategory);

  const handleBuy = async (product: Product) => {
    const priceNum = Number(product.price);
    if (rechargeBal < priceNum) {
      showAlert(
        `Insufficient Recharge Balance! Price is ₹${product.price}, your balance is ₹${rechargeBal.toFixed(2)}. Please recharge first.`,
        'error'
      );
      return;
    }

    setBuyingId(product.id);
    try {
      await onBuyProduct(product);
    } catch (err: any) {
      showAlert(err.message || 'Purchase failed', 'error');
    } finally {
      setBuyingId(null);
    }
  };

  return (
    <div className="tab-content block p-4 fade-in pb-28">
      {/* Top Header */}
      <div className="flex justify-between items-center mb-6 pt-2">
        <h1 className="text-3xl font-bold tracking-wide">
          Welcome <span className="text-[#00b4d8]">Here</span>
        </h1>
        <a
          href="https://t.me/Pvt_ruhi"
          target="_blank"
          rel="noreferrer"
          className="w-10 h-10 rounded-full bg-[#1b263b] border border-gray-800 flex items-center justify-center text-gray-300 hover:text-[#00b4d8] transition shadow-[0_0_15px_rgba(0,0,0,0.5)] active:scale-90"
        >
          <i className="fas fa-headset text-lg"></i>
        </a>
      </div>

      {/* Filter Buttons & Order Record Shortcut */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex bg-[#1b263b] rounded-full p-1 border border-gray-800 w-[82%] relative shadow-inner">
          <button
            onClick={() => setActiveCategory('stable')}
            className={`flex-1 py-2 text-xs font-bold rounded-full transition-all duration-300 cursor-pointer ${
              activeCategory === 'stable'
                ? 'bg-[#00b4d8] text-[#0d1b2a] shadow-md'
                : 'text-white hover:text-[#00b4d8]'
            }`}
          >
            Stable
          </button>
          <button
            onClick={() => setActiveCategory('welfare')}
            className={`flex-1 py-2 text-xs font-bold rounded-full transition-all duration-300 cursor-pointer ${
              activeCategory === 'welfare'
                ? 'bg-[#00b4d8] text-[#0d1b2a] shadow-md'
                : 'text-white hover:text-[#00b4d8]'
            }`}
          >
            Welfare
          </button>
          <button
            onClick={() => setActiveCategory('activity')}
            className={`flex-1 py-2 text-xs font-bold rounded-full transition-all duration-300 cursor-pointer ${
              activeCategory === 'activity'
                ? 'bg-[#00b4d8] text-[#0d1b2a] shadow-md'
                : 'text-white hover:text-[#00b4d8]'
            }`}
          >
            Activity
          </button>
        </div>

        <button
          onClick={onOpenOrderHistory}
          title="My Orders"
          className="w-11 h-11 rounded-full bg-[#1b263b] border border-gray-800 flex items-center justify-center text-[#00b4d8] hover:text-white transition shadow-md active:scale-90 shrink-0 cursor-pointer"
        >
          <i className="fas fa-clipboard-list text-lg"></i>
        </button>
      </div>

      {/* Product Cards List (Instant Render from Cache) */}
      <div className="space-y-5">
        {loading && products.length === 0 ? (
          <p className="text-center text-gray-500 mt-10 animate-pulse">
            Loading cached investment plans...
          </p>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <i className="fas fa-box-open text-4xl mb-3 opacity-40"></i>
            <p className="text-sm">No products available in this category.</p>
          </div>
        ) : (
          filteredProducts.map((product, idx) => {
            const durationLabel = `${product.durationValue || product.duration} ${
              product.durationUnit || 'Days'
            }`;
            const totalRevenue = (Number(product.daily) * Number(product.duration)).toFixed(2);
            const isProcessing = buyingId === product.id;

            return (
              <div
                key={product.id}
                className="glass-panel rounded-2xl border border-gray-800 overflow-hidden relative slide-up shadow-lg"
                style={{ animationDelay: `${idx * 0.05}s` }}
              >
                <div className="p-4 flex gap-4 bg-[#1e2a3e]">
                  <div className="w-24 h-24 rounded-xl bg-gray-800 shrink-0 border border-gray-700 shadow-inner overflow-hidden flex items-center justify-center">
                    <img
                      src={product.image}
                      alt={product.title}
                      className="w-full h-full object-cover aspect-square"
                      loading="lazy"
                    />
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <h3 className="text-white font-bold text-sm mb-3 leading-tight">
                      <i className="fas fa-crown text-[#00b4d8] mr-1 drop-shadow-md"></i>{' '}
                      {product.title}
                    </h3>
                    <div className="grid grid-cols-2 gap-y-1.5 text-[10px] text-gray-400">
                      <p>Daily Earnings:</p>
                      <p className="text-[#00e676] font-bold text-right tracking-wide">
                        ₹{product.daily}
                      </p>
                      <p>Total Revenue:</p>
                      <p className="text-[#00b4d8] font-bold text-right tracking-wide">
                        ₹{totalRevenue}
                      </p>
                      <p>Duration:</p>
                      <p className="text-white font-semibold text-right">{durationLabel}</p>
                    </div>
                  </div>
                </div>

                <div
                  className={`card-action-bar p-3.5 px-5 flex justify-between items-center cursor-pointer hover:brightness-110 active:scale-[0.98] transition-all ${
                    isProcessing ? 'btn-disabled' : ''
                  }`}
                  onClick={() => !isProcessing && handleBuy(product)}
                >
                  <span className="text-black font-extrabold text-sm tracking-wide">
                    Price ₹{product.price}
                  </span>
                  <span className="text-black font-bold text-sm flex items-center bg-black/10 px-3 py-1 rounded-full shadow-sm">
                    {isProcessing ? 'Processing...' : 'Invest Now'}
                    <i className="fas fa-arrow-right ml-2 text-xs"></i>
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

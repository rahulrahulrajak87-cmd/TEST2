import React, { useState } from 'react';
import {
  UserData,
  GlobalSettings,
  TeamCounts,
  Order,
  RechargeRecord,
  WithdrawRecord
} from '../types';

interface AccountTabProps {
  user: UserData;
  settings: GlobalSettings;
  teamCounts: TeamCounts;
  orders: Order[];
  ordersHasMore: boolean;
  ordersLoading: boolean;
  onLoadMoreOrders: () => void;
  recharges: RechargeRecord[];
  rechargesHasMore: boolean;
  rechargesLoading: boolean;
  onLoadMoreRecharges: () => void;
  withdraws: WithdrawRecord[];
  withdrawsHasMore: boolean;
  withdrawsLoading: boolean;
  onLoadMoreWithdraws: () => void;
  onSaveBankDetails: (name: string, accNo: string, ifsc: string) => Promise<void>;
  onSubmitWithdraw: (amount: number) => Promise<void>;
  onSubmitRechargeUTR: (amount: number, utr: string) => Promise<void>;
  onUpdateNickname: (name: string) => Promise<void>;
  onLogout: () => void;
  showAlert: (msg: string, type?: 'success' | 'error' | 'info') => void;
  initialSubPage?: string | null;
  onClearInitialSubPage?: () => void;
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

export const AccountTab: React.FC<AccountTabProps> = ({
  user,
  settings,
  teamCounts,
  orders,
  ordersHasMore,
  ordersLoading,
  onLoadMoreOrders,
  recharges,
  rechargesHasMore,
  rechargesLoading,
  onLoadMoreRecharges,
  withdraws,
  withdrawsHasMore,
  withdrawsLoading,
  onLoadMoreWithdraws,
  onSaveBankDetails,
  onSubmitWithdraw,
  onSubmitRechargeUTR,
  onUpdateNickname,
  onLogout,
  showAlert,
  initialSubPage,
  onClearInitialSubPage
}) => {
  const [activeSubPage, setActiveSubPage] = useState<string | null>(initialSubPage || null);

  // Form states
  const [bankName, setBankName] = useState(user.bankDetails?.name || '');
  const [bankAccNo, setBankAccNo] = useState(user.bankDetails?.accNo || '');
  const [bankIFSC, setBankIFSC] = useState(user.bankDetails?.ifsc || '');
  const [savingBank, setSavingBank] = useState(false);

  // Withdraw states
  const [withdrawAmt, setWithdrawAmt] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);

  // Recharge states
  const [selectedRechargeAmt, setSelectedRechargeAmt] = useState<number>(500);
  const [customRechargeAmt, setCustomRechargeAmt] = useState<string>('500');
  const [currentPayUpi, setCurrentPayUpi] = useState<string>('');
  const [utrNumber, setUtrNumber] = useState('');
  const [submittingUtr, setSubmittingUtr] = useState(false);

  // Nickname
  const [nicknameInput, setNicknameInput] = useState(user.name || '');

  // Handle initial subpage prop updates
  React.useEffect(() => {
    if (initialSubPage) {
      setActiveSubPage(initialSubPage);
      if (onClearInitialSubPage) onClearInitialSubPage();
    }
  }, [initialSubPage]);

  // VIP computation
  let currentLevel = 0;
  for (let i = 0; i < vips.length; i++) {
    if ((user.totalRecharged || 0) >= vips[i].req) {
      currentLevel = vips[i].level;
    }
  }

  let nextReq = vips[1].req;
  let progress = 0;
  if (currentLevel < vips.length - 1) {
    nextReq = vips[currentLevel + 1].req;
    progress = Math.min(100, Math.round(((user.totalRecharged || 0) / nextReq) * 100));
  } else {
    progress = 100;
    nextReq = user.totalRecharged || 0;
  }

  // Subpage Handlers
  const handleSaveBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankName.trim() || !bankAccNo.trim() || !bankIFSC.trim()) {
      showAlert('Please fill in all bank details', 'error');
      return;
    }
    setSavingBank(true);
    try {
      await onSaveBankDetails(bankName.trim(), bankAccNo.trim(), bankIFSC.trim().toUpperCase());
      showAlert('Bank card bound successfully!', 'success');
      setActiveSubPage(null);
    } catch (err: any) {
      showAlert(err.message || 'Failed to save bank', 'error');
    } finally {
      setSavingBank(false);
    }
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings.withdrawSwitch) {
      showAlert('Withdrawals are temporarily disabled by the system.', 'error');
      return;
    }
    const amt = Number(withdrawAmt);
    if (amt < settings.minWithdraw) {
      showAlert(`Minimum withdrawal is ₹${settings.minWithdraw}`, 'error');
      return;
    }
    if (amt > user.withdrawBal) {
      showAlert('Insufficient Withdrawable Balance!', 'error');
      return;
    }
    if (!user.bankDetails?.accNo) {
      showAlert('Please bind your Bank Card first before withdrawing.', 'error');
      setActiveSubPage('accountBankView');
      return;
    }

    setWithdrawing(true);
    try {
      await onSubmitWithdraw(amt);
      showAlert(`Withdrawal request of ₹${amt} submitted successfully!`, 'success');
      setWithdrawAmt('');
      setActiveSubPage(null);
    } catch (err: any) {
      showAlert(err.message || 'Withdrawal failed', 'error');
    } finally {
      setWithdrawing(false);
    }
  };

  const handleProceedToQR = () => {
    const amt = Number(customRechargeAmt || selectedRechargeAmt);
    if (amt < settings.minRecharge) {
      showAlert(`Minimum deposit amount is ₹${settings.minRecharge}`, 'error');
      return;
    }
    // Pick random UPI ID from active list
    const list = settings.upiIds?.length > 0 ? settings.upiIds : [settings.upiId || 'admin@upi'];
    const chosen = list[Math.floor(Math.random() * list.length)];
    setCurrentPayUpi(chosen);
    setSelectedRechargeAmt(amt);
    setUtrNumber('');
    setActiveSubPage('accountPayQRView');
  };

  const handleUtrSubmit = async () => {
    if (utrNumber.trim().length < 12) {
      showAlert('Please enter a valid 12-digit UTR / Reference number', 'error');
      return;
    }
    setSubmittingUtr(true);
    try {
      await onSubmitRechargeUTR(selectedRechargeAmt, utrNumber.trim());
      showAlert('Payment submitted! Admin will verify and credit your balance.', 'success');
      setUtrNumber('');
      setActiveSubPage(null);
    } catch (err: any) {
      showAlert(err.message || 'Submission failed', 'error');
    } finally {
      setSubmittingUtr(false);
    }
  };

  // ----------------------------------------------------
  // SUB-PAGES RENDERER
  // ----------------------------------------------------

  // 1. ORDERS PAGE
  if (activeSubPage === 'accountOrderRecordView') {
    return (
      <div className="account-sub-page p-4 fade-in pb-28">
        <div className="flex items-center gap-3 mb-6 pt-2 sticky top-0 z-10 bg-[#0d1b2a]/95 backdrop-blur-md pb-3 border-b border-gray-800/50">
          <button
            onClick={() => setActiveSubPage(null)}
            className="w-10 h-10 rounded-full bg-[#1b263b] border border-gray-800 flex items-center justify-center text-gray-300 hover:text-white transition active:scale-90"
          >
            <i className="fas fa-arrow-left"></i>
          </button>
          <h2 className="text-xl font-bold text-white">My Investments</h2>
        </div>

        <div className="space-y-4">
          {orders.length === 0 && !ordersLoading ? (
            <p className="text-center text-gray-500 py-16 italic">No active or past orders found.</p>
          ) : (
            orders.map((o) => {
              const durText = `${o.durationValue || o.duration} ${o.durationUnit || 'Days'}`;
              const totalEst = (Number(o.daily) * Number(o.duration)).toFixed(2);
              const isRunning = o.status === 'active';

              return (
                <div
                  key={o.id}
                  className={`glass-panel p-4 rounded-xl border ${
                    isRunning
                      ? 'border-[#00b4d8]/30 shadow-[0_0_15px_rgba(0,180,216,0.1)]'
                      : 'border-gray-800'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3 border-b border-gray-800 pb-3">
                    <div>
                      <h3 className="font-bold text-white text-sm leading-tight">{o.title}</h3>
                      <p className="text-[9px] text-gray-500 mt-1">
                        {o.date?.seconds
                          ? new Date(o.date.seconds * 1000).toLocaleString()
                          : 'Recent'}
                      </p>
                    </div>
                    {isRunning ? (
                      <span className="text-xs font-bold text-[#00e676] bg-green-500/10 px-2 py-1 border border-green-500/20 rounded animate-pulse">
                        Running...
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-gray-400 bg-gray-800 px-2 py-1 rounded border border-gray-700">
                        Completed
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-[9px] text-gray-500 uppercase">Invested</p>
                      <p className="font-bold text-white">₹{Number(o.price).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-gray-500 uppercase">Daily Return</p>
                      <p className="font-bold text-[#00b4d8]">₹{Number(o.daily).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-gray-500 uppercase">Duration</p>
                      <p className="font-bold text-gray-300">{durText}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-gray-500 uppercase">Total Est.</p>
                      <p className="font-black text-[#00e676]">₹{totalEst}</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {ordersHasMore && (
            <button
              onClick={onLoadMoreOrders}
              disabled={ordersLoading}
              className="w-full py-3 bg-[#1e2a3e] border border-gray-700 text-white rounded-xl text-xs font-bold hover:border-[#00b4d8] transition cursor-pointer"
            >
              {ordersLoading ? 'Loading more...' : 'Load More Orders'}
            </button>
          )}
        </div>
      </div>
    );
  }

  // 2. ORDER CREDITS PAGE
  if (activeSubPage === 'accountOrderCreditsView') {
    return (
      <div className="account-sub-page p-4 fade-in pb-28">
        <div className="flex items-center gap-3 mb-6 pt-2 sticky top-0 z-10 bg-[#0d1b2a]/95 backdrop-blur-md pb-3 border-b border-gray-800/50">
          <button
            onClick={() => setActiveSubPage(null)}
            className="w-10 h-10 rounded-full bg-[#1b263b] border border-gray-800 flex items-center justify-center text-gray-300 hover:text-white transition active:scale-90"
          >
            <i className="fas fa-arrow-left"></i>
          </button>
          <h2 className="text-xl font-bold text-white">Order Credits (Daily Accruals)</h2>
        </div>

        <div className="space-y-4">
          {orders.length === 0 ? (
            <p className="text-center text-gray-500 py-16 italic">No active or accrued investments.</p>
          ) : (
            orders.map((o) => {
              const start = o.date?.seconds ? new Date(o.date.seconds * 1000) : new Date();
              const hoursPassed = Math.max(0, (Date.now() - start.getTime()) / (1000 * 60 * 60));
              let limitHours = Number(o.durationValue || o.duration || 1);
              if (o.durationUnit === 'days') limitHours *= 24;
              else if (o.durationUnit === 'months') limitHours *= 24 * 30;

              let earned = hoursPassed * (Number(o.daily) / 24);
              const maxEarn = limitHours * (Number(o.daily) / 24);
              if (earned > maxEarn) earned = maxEarn;

              return (
                <div key={o.id} className="glass-panel p-4 rounded-xl border border-gray-800 shadow-md">
                  <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-800/50">
                    <div>
                      <h4 className="font-bold text-white text-xs">{o.title}</h4>
                      <p className="text-[9px] text-gray-500 mt-0.5">
                        Purchased: {start.toLocaleString()}
                      </p>
                    </div>
                    {hoursPassed < limitHours ? (
                      <span className="text-[10px] font-bold text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20">
                        Accruing...
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">
                        Fully Credited
                      </span>
                    )}
                  </div>
                  <div className="space-y-1.5 text-xs text-gray-400">
                    <div className="flex justify-between">
                      <span>Duration:</span>
                      <span className="text-white font-semibold">
                        {o.durationValue || o.duration} {o.durationUnit || 'Days'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Current Accrued:</span>
                      <span className="text-[#00b4d8] font-bold">₹{earned.toFixed(4)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Est. Total Payout:</span>
                      <span className="text-[#00e676] font-bold">₹{maxEarn.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }

  // 3. RECHARGE HISTORY
  if (activeSubPage === 'accountRechargeRecordView') {
    return (
      <div className="account-sub-page p-4 fade-in pb-28">
        <div className="flex items-center gap-3 mb-6 pt-2 sticky top-0 z-10 bg-[#0d1b2a]/95 backdrop-blur-md pb-3 border-b border-gray-800/50">
          <button
            onClick={() => setActiveSubPage(null)}
            className="w-10 h-10 rounded-full bg-[#1b263b] border border-gray-800 flex items-center justify-center text-gray-300 hover:text-white transition active:scale-90"
          >
            <i className="fas fa-arrow-left"></i>
          </button>
          <h2 className="text-xl font-bold text-white">Deposit History</h2>
        </div>

        <div className="space-y-4">
          {recharges.length === 0 && !rechargesLoading ? (
            <p className="text-center text-gray-500 py-16 italic">No deposit records found.</p>
          ) : (
            recharges.map((r) => (
              <div
                key={r.id}
                className="glass-panel p-4 rounded-xl border border-gray-800 flex justify-between items-center shadow-md"
              >
                <div>
                  <p className="font-bold text-white text-lg tracking-wide mb-1">
                    ₹{Number(r.amount).toFixed(2)}
                  </p>
                  <p className="text-[10px] text-gray-400 font-mono">UTR: {r.utr}</p>
                  <p className="text-[9px] text-gray-500 mt-1">
                    {r.date?.seconds
                      ? new Date(r.date.seconds * 1000).toLocaleString()
                      : 'Pending'}
                  </p>
                </div>
                {r.status === 'approved' ? (
                  <span className="text-xs font-bold text-green-400 bg-green-500/10 px-2.5 py-1 rounded">
                    Success
                  </span>
                ) : r.status === 'rejected' ? (
                  <span className="text-xs font-bold text-red-400 bg-red-500/10 px-2.5 py-1 rounded">
                    Failed
                  </span>
                ) : (
                  <span className="text-xs font-bold text-yellow-400 bg-yellow-500/10 px-2.5 py-1 rounded">
                    Pending
                  </span>
                )}
              </div>
            ))
          )}

          {rechargesHasMore && (
            <button
              onClick={onLoadMoreRecharges}
              disabled={rechargesLoading}
              className="w-full py-3 bg-[#1e2a3e] border border-gray-700 text-white rounded-xl text-xs font-bold hover:border-[#00b4d8] transition cursor-pointer"
            >
              {rechargesLoading ? 'Loading more...' : 'Load More Records'}
            </button>
          )}
        </div>
      </div>
    );
  }

  // 4. WITHDRAW HISTORY
  if (activeSubPage === 'accountWithdrawRecordView') {
    return (
      <div className="account-sub-page p-4 fade-in pb-28">
        <div className="flex items-center gap-3 mb-6 pt-2 sticky top-0 z-10 bg-[#0d1b2a]/95 backdrop-blur-md pb-3 border-b border-gray-800/50">
          <button
            onClick={() => setActiveSubPage(null)}
            className="w-10 h-10 rounded-full bg-[#1b263b] border border-gray-800 flex items-center justify-center text-gray-300 hover:text-white transition active:scale-90"
          >
            <i className="fas fa-arrow-left"></i>
          </button>
          <h2 className="text-xl font-bold text-white">Withdrawal History</h2>
        </div>

        <div className="space-y-4">
          {withdraws.length === 0 && !withdrawsLoading ? (
            <p className="text-center text-gray-500 py-16 italic">No withdrawal records found.</p>
          ) : (
            withdraws.map((w) => {
              const taxVal = Number(w.tax || w.amount * (settings.withdrawTax / 100));
              const recVal = Number(w.receiveAmount || w.amount - taxVal);

              return (
                <div key={w.id} className="glass-panel p-4 rounded-xl border border-gray-800 shadow-md">
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-bold text-white text-sm">Withdraw Request</p>
                    {w.status === 'approved' ? (
                      <span className="text-xs font-bold text-green-400 bg-green-500/10 px-2 py-1 rounded">
                        Paid
                      </span>
                    ) : w.status === 'rejected' ? (
                      <span className="text-xs font-bold text-red-400 bg-red-500/10 px-2 py-1 rounded">
                        Refunded
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded">
                        Pending
                      </span>
                    )}
                  </div>
                  <div className="space-y-1 text-xs text-gray-400 border-b border-gray-800 pb-2">
                    <div className="flex justify-between">
                      <span>Requested:</span>
                      <span className="text-white font-bold">₹{Number(w.amount).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax ({settings.withdrawTax}%):</span>
                      <span className="text-red-400 font-bold">-₹{taxVal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t border-gray-800/50 pt-1">
                      <span>Receive Amount:</span>
                      <span className="text-[#00e676] font-bold text-sm">₹{recVal.toFixed(2)}</span>
                    </div>
                  </div>
                  {w.remark && (
                    <div
                      className={`mt-2 text-[10px] p-2 rounded border font-medium ${
                        w.status === 'approved'
                          ? 'text-green-400 bg-green-950/30 border-green-900/30'
                          : w.status === 'rejected'
                          ? 'text-red-400 bg-red-950/30 border-red-900/30'
                          : 'text-yellow-400 bg-yellow-950/30 border-yellow-900/30'
                      }`}
                    >
                      {w.remark}
                    </div>
                  )}
                  <p className="text-[8px] text-gray-500 mt-2 text-right">
                    {w.date?.seconds
                      ? new Date(w.date.seconds * 1000).toLocaleString()
                      : 'Just now'}
                  </p>
                </div>
              );
            })
          )}

          {withdrawsHasMore && (
            <button
              onClick={onLoadMoreWithdraws}
              disabled={withdrawsLoading}
              className="w-full py-3 bg-[#1e2a3e] border border-gray-700 text-white rounded-xl text-xs font-bold hover:border-[#00b4d8] transition cursor-pointer"
            >
              {withdrawsLoading ? 'Loading more...' : 'Load More Records'}
            </button>
          )}
        </div>
      </div>
    );
  }

  // 5. BANK CARD BINDING PAGE
  if (activeSubPage === 'accountBankView') {
    return (
      <div className="account-sub-page p-4 fade-in pb-28">
        <div className="flex items-center gap-3 mb-6 pt-2 sticky top-0 z-10 bg-[#0d1b2a]/95 backdrop-blur-md pb-3 border-b border-gray-800/50">
          <button
            onClick={() => setActiveSubPage(null)}
            className="w-10 h-10 rounded-full bg-[#1b263b] border border-gray-800 flex items-center justify-center text-gray-300 hover:text-white transition active:scale-90"
          >
            <i className="fas fa-arrow-left"></i>
          </button>
          <h2 className="text-xl font-bold text-white">My Bank Card</h2>
        </div>

        <div className="glass-panel p-6 rounded-2xl shadow-lg border border-purple-900/30">
          <p className="text-xs text-gray-400 mb-5 leading-relaxed">
            Please bind your authentic bank details for payouts. For security reasons, this cannot
            be easily modified once linked.
          </p>

          <form onSubmit={handleSaveBank}>
            <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1.5 pl-1">
              Cardholder Name
            </label>
            <input
              type="text"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              placeholder="Real Name on Bank Account"
              required
              className="w-full bg-[#0d1b2a] border border-gray-800 rounded-xl px-4 py-3.5 mb-4 text-white text-sm outline-none focus:border-purple-500 transition"
            />

            <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1.5 pl-1">
              Bank Account Number
            </label>
            <input
              type="text"
              value={bankAccNo}
              onChange={(e) => setBankAccNo(e.target.value)}
              placeholder="Account Number"
              required
              className="w-full bg-[#0d1b2a] border border-gray-800 rounded-xl px-4 py-3.5 mb-4 text-white text-sm outline-none focus:border-purple-500 transition"
            />

            <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1.5 pl-1">
              IFSC Code
            </label>
            <input
              type="text"
              value={bankIFSC}
              onChange={(e) => setBankIFSC(e.target.value.toUpperCase())}
              placeholder="e.g. SBIN0001234"
              required
              className="w-full bg-[#0d1b2a] border border-gray-800 rounded-xl px-4 py-3.5 mb-6 text-white text-sm outline-none focus:border-purple-500 transition uppercase font-mono"
            />

            <button
              type="submit"
              disabled={savingBank}
              className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold py-3.5 rounded-xl shadow-[0_4px_15px_rgba(168,85,247,0.4)] active:scale-95 transition cursor-pointer"
            >
              {savingBank ? 'Saving...' : 'Save Bank Details'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 6. WITHDRAW FORM PAGE
  if (activeSubPage === 'accountWithdrawView') {
    return (
      <div className="account-sub-page p-4 fade-in pb-28">
        <div className="flex items-center gap-3 mb-6 pt-2 sticky top-0 z-10 bg-[#0d1b2a]/95 backdrop-blur-md pb-3 border-b border-gray-800/50">
          <button
            onClick={() => setActiveSubPage(null)}
            className="w-10 h-10 rounded-full bg-[#1b263b] border border-gray-800 flex items-center justify-center text-gray-300 hover:text-white transition active:scale-90"
          >
            <i className="fas fa-arrow-left"></i>
          </button>
          <h2 className="text-xl font-bold text-white">Withdraw Funds</h2>
        </div>

        {/* Bank Preview */}
        <div className="bg-gradient-to-tr from-purple-900 to-[#1b263b] rounded-2xl p-5 border border-purple-800 mb-6 shadow-lg relative overflow-hidden">
          <i className="fas fa-university absolute right-0 bottom-0 text-6xl text-purple-500 opacity-10 -mr-2 -mb-2"></i>
          <p className="text-[10px] text-purple-300 uppercase tracking-wider mb-1">
            Withdrawal Account
          </p>
          <h3 className="font-bold text-white text-lg tracking-widest mb-1">
            {user.bankDetails?.accNo
              ? `**** **** ${user.bankDetails.accNo.slice(-4)}`
              : 'No Card Linked'}
          </h3>
          <p className="text-xs text-gray-300">
            {user.bankDetails?.name || 'Please link bank details'}
          </p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-gray-800">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-gray-400">Withdrawable Balance:</span>
            <span className="text-lg font-bold text-[#00e676]">
              ₹{user.withdrawBal.toFixed(2)}
            </span>
          </div>

          <form onSubmit={handleWithdrawSubmit}>
            <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1.5 pl-1">
              Enter Amount
            </label>
            <div className="relative mb-6">
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#00b4d8] font-bold text-lg">
                ₹
              </span>
              <input
                type="number"
                value={withdrawAmt}
                onChange={(e) => setWithdrawAmt(e.target.value)}
                placeholder={`Min. ${settings.minWithdraw}`}
                required
                className="w-full bg-[#0d1b2a] border border-gray-800 rounded-xl pl-10 pr-20 py-4 text-white text-xl font-bold outline-none focus:border-[#00b4d8] transition"
              />
              <button
                type="button"
                onClick={() => setWithdrawAmt(String(user.withdrawBal))}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs font-bold text-[#00b4d8] bg-[#00b4d8]/10 px-3 py-1.5 rounded-full cursor-pointer"
              >
                MAX
              </button>
            </div>

            <button
              type="submit"
              disabled={withdrawing}
              className="w-full btn-primary py-3.5 rounded-xl text-lg text-white mb-4 cursor-pointer"
            >
              {withdrawing ? 'Submitting...' : 'Submit Withdrawal'}
            </button>
          </form>

          <ul className="text-[10px] text-gray-400 space-y-1.5 list-disc pl-4">
            <li>Withdrawal timing: 10:00 AM - 6:00 PM.</li>
            <li>Minimum withdrawal amount is ₹{settings.minWithdraw}.</li>
            <li>Tax fee of {settings.withdrawTax}% applies on withdrawals.</li>
            <li>Recharge balances cannot be directly withdrawn.</li>
          </ul>
        </div>
      </div>
    );
  }

  // 7. RECHARGE AMOUNT SELECTION PAGE
  if (activeSubPage === 'accountRechargeView') {
    const presets = [220, 350, 470, 500, 700, 1000, 1300, 1500];
    return (
      <div className="account-sub-page p-4 fade-in pb-28">
        <div className="flex items-center gap-3 mb-6 pt-2 sticky top-0 z-10 bg-[#0d1b2a]/95 backdrop-blur-md pb-3 border-b border-gray-800/50">
          <button
            onClick={() => setActiveSubPage(null)}
            className="w-10 h-10 rounded-full bg-[#1b263b] border border-gray-800 flex items-center justify-center text-gray-300 hover:text-white transition active:scale-90"
          >
            <i className="fas fa-arrow-left"></i>
          </button>
          <h2 className="text-xl font-bold text-white">Deposit Funds</h2>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-gray-800 shadow-lg">
          <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-2 pl-1">
            Recharge Amount <span className="text-[#00b4d8]">(Min {settings.minRecharge})</span>
          </label>
          <div className="relative mb-5">
            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#00b4d8] font-bold text-xl">
              ₹
            </span>
            <input
              type="number"
              value={customRechargeAmt}
              onChange={(e) => setCustomRechargeAmt(e.target.value)}
              placeholder="Enter amount"
              className="w-full bg-[#0d1b2a] border border-[#00b4d8] rounded-xl pl-10 pr-4 py-4 text-white text-2xl font-bold outline-none shadow-[0_0_15px_rgba(0,180,216,0.1)] transition text-center"
            />
          </div>

          <div className="grid grid-cols-4 gap-3 mb-8">
            {presets.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setCustomRechargeAmt(String(amt))}
                className="bg-[#1e2a3e] border border-gray-700 hover:border-[#00b4d8] hover:text-[#00b4d8] text-white font-bold py-2 rounded-xl text-sm transition cursor-pointer"
              >
                {amt}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleProceedToQR}
            className="w-full btn-primary py-3.5 rounded-xl text-lg text-white font-bold cursor-pointer"
          >
            Proceed To Recharge
          </button>
        </div>
      </div>
    );
  }

  // 8. SCAN & PAY QR PAGE
  if (activeSubPage === 'accountPayQRView') {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=upi://pay?pa=${currentPayUpi}&pn=Admin&am=${selectedRechargeAmt}&cu=INR`;

    return (
      <div className="account-sub-page p-4 fade-in pb-28">
        <div className="flex items-center gap-3 mb-6 pt-2 sticky top-0 z-10 bg-[#0d1b2a]/95 backdrop-blur-md pb-3 border-b border-gray-800/50">
          <button
            onClick={() => setActiveSubPage('accountRechargeView')}
            className="w-10 h-10 rounded-full bg-[#1b263b] border border-gray-800 flex items-center justify-center text-gray-300 hover:text-white transition active:scale-90"
          >
            <i className="fas fa-arrow-left"></i>
          </button>
          <h2 className="text-xl font-bold text-white">Scan & Pay</h2>
        </div>

        <div className="glass-panel p-6 rounded-2xl shadow-lg border border-[#00b4d8]/30 text-center">
          <h3 className="text-base font-bold text-white mb-2">
            Pay exactly:{' '}
            <span className="text-[#00b4d8] text-2xl ml-1 font-black">
              ₹{selectedRechargeAmt}
            </span>
          </h3>
          <p className="text-[10px] text-gray-400 mb-6">
            Scan the QR code below or copy the UPI ID in your payment app.
          </p>

          <div className="bg-white p-3 rounded-2xl inline-block mb-6 shadow-[0_0_20px_rgba(0,180,216,0.4)]">
            <img src={qrUrl} alt="Payment QR" className="w-48 h-48 object-contain" />
          </div>

          <div className="bg-[#0d1b2a] border border-gray-800 rounded-xl flex items-center justify-between p-3 mb-6">
            <div className="text-left w-3/4 overflow-hidden">
              <p className="text-[9px] text-gray-500 uppercase">Official UPI ID</p>
              <p className="font-bold text-sm text-white tracking-wider truncate">
                {currentPayUpi}
              </p>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(currentPayUpi);
                showAlert('UPI ID Copied!', 'success');
              }}
              className="bg-[#00b4d8] text-white px-4 py-2 rounded-full text-[10px] font-bold active:scale-90 transition shadow-lg cursor-pointer"
            >
              Copy
            </button>
          </div>

          <div className="mb-4 text-left">
            <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1.5 pl-1">
              Enter 12-Digit UTR / Ref No.
            </label>
            <input
              type="text"
              value={utrNumber}
              onChange={(e) => setUtrNumber(e.target.value)}
              placeholder="e.g. 312345678901"
              maxLength={16}
              className="w-full bg-[#0d1b2a] border border-gray-800 rounded-xl px-4 py-3.5 text-white text-sm outline-none focus:border-[#00b4d8] transition font-bold tracking-widest text-center"
            />
          </div>

          <button
            onClick={handleUtrSubmit}
            disabled={submittingUtr}
            className="w-full btn-primary py-3.5 rounded-xl text-lg text-white font-bold shadow-lg cursor-pointer"
          >
            {submittingUtr ? 'Submitting...' : 'Submit Payment'}
          </button>
        </div>
      </div>
    );
  }

  // 9. TEAM PAGE
  if (activeSubPage === 'accountTeamView') {
    return (
      <div className="account-sub-page p-4 fade-in pb-28">
        <div className="flex items-center gap-3 mb-6 pt-2">
          <button
            onClick={() => setActiveSubPage(null)}
            className="w-10 h-10 rounded-full bg-[#1b263b] border border-gray-800 flex items-center justify-center text-gray-300 hover:text-white transition active:scale-90"
          >
            <i className="fas fa-arrow-left"></i>
          </button>
          <h2 className="text-xl font-bold text-white">My Team</h2>
        </div>

        <div className="glass-panel p-5 rounded-2xl shadow-lg mb-6 text-center border-t border-[#00b4d8]/30">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Total Commission</p>
          <h1 className="text-4xl font-black text-[#00b4d8] drop-shadow-md mb-4">
            ₹{user.totalCommission.toFixed(2)}
          </h1>
          <div className="flex items-center justify-center gap-3 bg-[#0d1b2a] rounded-xl p-3 border border-gray-800">
            <p className="text-xs text-gray-400">
              Invite Code:{' '}
              <span className="font-bold text-white tracking-widest ml-1">{user.inviteCode}</span>
            </p>
            <button
              onClick={() => {
                const link = `${window.location.origin}/?ref=${user.inviteCode}`;
                navigator.clipboard.writeText(link);
                showAlert('Invite link copied!', 'success');
              }}
              className="bg-[#00b4d8] text-white text-[10px] font-bold px-3 py-1.5 rounded-full active:scale-90 transition cursor-pointer"
            >
              Copy Link
            </button>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          <div className="bg-[#1e2a3e] p-4 rounded-xl flex items-center justify-between border border-gray-800 relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>
            <div className="pl-2">
              <p className="font-bold text-white">LV 1</p>
              <p className="text-[10px] text-blue-500 font-bold">{settings.tier1}% Rebate</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-white">{teamCounts.lv1}</p>
              <p className="text-[9px] text-gray-500 uppercase">Total Invite</p>
            </div>
          </div>

          <div className="bg-[#1e2a3e] p-4 rounded-xl flex items-center justify-between border border-gray-800 relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gray-300"></div>
            <div className="pl-2">
              <p className="font-bold text-white">LV 2</p>
              <p className="text-[10px] text-gray-300 font-bold">{settings.tier2}% Rebate</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-white">{teamCounts.lv2}</p>
              <p className="text-[9px] text-gray-500 uppercase">Total Invite</p>
            </div>
          </div>

          <div className="bg-[#1e2a3e] p-4 rounded-xl flex items-center justify-between border border-gray-800 relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-400"></div>
            <div className="pl-2">
              <p className="font-bold text-white">LV 3</p>
              <p className="text-[10px] text-blue-400 font-bold">{settings.tier3}% Rebate</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-white">{teamCounts.lv3}</p>
              <p className="text-[9px] text-gray-500 uppercase">Total Invite</p>
            </div>
          </div>
        </div>

        <div className="bg-[#1b263b] rounded-xl p-4 border border-gray-800 text-xs text-gray-400 leading-relaxed">
          <h3 className="text-white font-bold text-sm mb-2">
            <i className="fas fa-info-circle text-blue-400 mr-1"></i> Referral Reward System
          </h3>
          <p className="mb-2">
            Invite friends and earn a percentage of their total investments. The system uses a
            dynamic 3-tier structure.
          </p>
          <p className="text-[#00b4d8] font-semibold">
            Profits are credited instantly to your Withdrawable Balance upon successful product
            purchase by your downline.
          </p>
        </div>
      </div>
    );
  }

  // 10. VIP LEVELS PAGE
  if (activeSubPage === 'accountVIPView') {
    return (
      <div className="account-sub-page p-4 fade-in pb-28">
        <div className="flex items-center gap-3 mb-6 pt-2 sticky top-0 z-10 bg-[#0d1b2a]/95 backdrop-blur-md pb-3 border-b border-gray-800/50">
          <button
            onClick={() => setActiveSubPage(null)}
            className="w-10 h-10 rounded-full bg-[#1b263b] border border-gray-800 flex items-center justify-center text-gray-300 hover:text-white transition active:scale-90"
          >
            <i className="fas fa-arrow-left"></i>
          </button>
          <h2 className="text-xl font-bold text-white">VIP Levels</h2>
        </div>

        <div className="space-y-4">
          {vips.map((v) => {
            const isCurrent = v.level === currentLevel;
            const isPassed = v.level < currentLevel;
            let barWidth = '0%';
            if (isPassed || isCurrent) barWidth = '100%';
            else if (v.level === currentLevel + 1) barWidth = `${progress}%`;

            return (
              <div
                key={v.level}
                className={`glass-panel p-4 rounded-xl border ${
                  isCurrent
                    ? 'border-[#00b4d8] shadow-[0_0_10px_rgba(0,180,216,0.2)]'
                    : 'border-gray-800'
                } relative overflow-hidden`}
              >
                {isCurrent && (
                  <div className="absolute right-0 top-0 bg-[#00b4d8] text-[#0d1b2a] text-[9px] font-bold px-2 py-0.5 rounded-bl-lg">
                    CURRENT
                  </div>
                )}
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-bold text-white flex items-center gap-2">
                    <i
                      className={`fas fa-crown ${
                        isCurrent || isPassed ? 'text-[#00b4d8]' : 'text-gray-500'
                      }`}
                    ></i>{' '}
                    VIP {v.level}
                  </h3>
                  <span
                    className={`text-xs font-bold ${
                      isCurrent || isPassed ? 'text-[#00b4d8]' : 'text-gray-400'
                    }`}
                  >
                    ₹{v.req.toLocaleString()}
                  </span>
                </div>
                <div>
                  <div className="flex justify-between text-[10px] mb-1.5">
                    <span className="text-gray-400">Total Investment</span>
                    <span className="text-white font-bold">
                      {isPassed || isCurrent ? v.req : user.totalRecharged || 0} / {v.req}
                    </span>
                  </div>
                  <div className="w-full bg-[#0d1b2a] rounded-full h-1.5 border border-gray-800">
                    <div
                      className="bg-gray-600 h-1.5 rounded-full"
                      style={{
                        width: barWidth,
                        background:
                          isCurrent || isPassed
                            ? 'linear-gradient(90deg, #00b4d8, #caf0f8)'
                            : undefined
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // 11. HELP CENTER
  if (activeSubPage === 'accountHelpView') {
    return (
      <div className="account-sub-page p-4 fade-in pb-28">
        <div className="flex items-center gap-3 mb-6 pt-2">
          <button
            onClick={() => setActiveSubPage(null)}
            className="w-10 h-10 rounded-full bg-[#1b263b] border border-gray-800 flex items-center justify-center text-gray-300 hover:text-white transition active:scale-90"
          >
            <i className="fas fa-arrow-left"></i>
          </button>
          <h2 className="text-xl font-bold text-white">Help Center</h2>
        </div>

        <div className="w-full h-32 rounded-2xl bg-gradient-to-r from-blue-900 to-[#1b263b] mb-6 border border-blue-800 flex flex-col items-center justify-center text-center p-4 relative overflow-hidden shadow-lg">
          <i className="fas fa-headset text-5xl text-blue-500/20 absolute -right-2 -bottom-2"></i>
          <h2 className="text-lg font-bold text-white z-10 mb-1">Customer Support</h2>
          <p className="text-xs text-blue-200 z-10">24/7 dedicated wealth advisory</p>
        </div>

        <div className="space-y-3">
          <a
            href="https://t.me/Pvt_ruhi"
            target="_blank"
            rel="noreferrer"
            className="w-full bg-[#1b263b] border border-gray-800 rounded-xl p-4 flex items-center justify-between hover:bg-[#223047] transition active:scale-[0.98]"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                <i className="fas fa-comments text-lg"></i>
              </div>
              <span className="font-bold text-white text-sm">Online Telegram Support</span>
            </div>
            <i className="fas fa-chevron-right text-gray-600 text-sm"></i>
          </a>

          <button
            onClick={() => setActiveSubPage('accountFeedbackView')}
            className="w-full bg-[#1b263b] border border-gray-800 rounded-xl p-4 flex items-center justify-between hover:bg-[#223047] transition active:scale-[0.98] cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-400">
                <i className="fas fa-file-invoice-dollar text-lg"></i>
              </div>
              <span className="font-bold text-white text-sm">Deposit Not Received?</span>
            </div>
            <i className="fas fa-chevron-right text-gray-600 text-sm"></i>
          </button>
        </div>
      </div>
    );
  }

  // 12. FEEDBACK
  if (activeSubPage === 'accountFeedbackView') {
    return (
      <div className="account-sub-page p-4 fade-in pb-28">
        <div className="flex items-center gap-3 mb-6 pt-2 sticky top-0 z-10 bg-[#0d1b2a]/95 backdrop-blur-md pb-3 border-b border-gray-800/50">
          <button
            onClick={() => setActiveSubPage('accountHelpView')}
            className="w-10 h-10 rounded-full bg-[#1b263b] border border-gray-800 flex items-center justify-center text-gray-300 hover:text-white transition active:scale-90"
          >
            <i className="fas fa-arrow-left"></i>
          </button>
          <h2 className="text-xl font-bold text-white">Recharge Issue</h2>
        </div>

        <div className="glass-panel p-5 rounded-2xl shadow-lg border border-red-900/30">
          <p className="text-xs text-gray-400 mb-5 leading-relaxed">
            If your deposit hasn't arrived within 30 minutes, submit your payment details below.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              showAlert('Issue submitted! Our technical team will review within 1 hour.', 'success');
              setActiveSubPage('accountHelpView');
            }}
          >
            <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1.5 pl-1">
              Payment Account (UPI / 12-digit UTR)
            </label>
            <input
              type="text"
              placeholder="Enter UTR or UPI"
              required
              className="w-full bg-[#0d1b2a] border border-gray-800 rounded-xl px-4 py-3 mb-4 text-white text-sm outline-none focus:border-[#00b4d8] transition"
            />

            <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1.5 pl-1">
              Payer's Name
            </label>
            <input
              type="text"
              placeholder="Name on bank account"
              required
              className="w-full bg-[#0d1b2a] border border-gray-800 rounded-xl px-4 py-3 mb-4 text-white text-sm outline-none focus:border-[#00b4d8] transition"
            />

            <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1.5 pl-1">
              Description
            </label>
            <textarea
              rows={3}
              placeholder="Describe the issue..."
              required
              className="w-full bg-[#0d1b2a] border border-gray-800 rounded-xl px-4 py-3 mb-6 text-white text-sm outline-none focus:border-[#00b4d8] transition resize-none"
            ></textarea>

            <button
              type="submit"
              className="w-full btn-primary text-white font-bold py-3.5 rounded-xl shadow-[0_4px_15px_rgba(0,180,216,0.3)] cursor-pointer"
            >
              Submit Feedback
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 13. SETTINGS
  if (activeSubPage === 'accountSettingsView') {
    return (
      <div className="account-sub-page p-4 fade-in pb-28">
        <div className="flex items-center gap-3 mb-6 pt-2 sticky top-0 z-10 bg-[#0d1b2a]/95 backdrop-blur-md pb-3 border-b border-gray-800/50">
          <button
            onClick={() => setActiveSubPage(null)}
            className="w-10 h-10 rounded-full bg-[#1b263b] border border-gray-800 flex items-center justify-center text-gray-300 hover:text-white transition active:scale-90"
          >
            <i className="fas fa-arrow-left"></i>
          </button>
          <h2 className="text-xl font-bold text-white">Settings Info</h2>
        </div>

        <div className="glass-panel p-6 rounded-2xl shadow-lg border border-gray-800 flex flex-col items-center text-center">
          <div className="relative mb-6">
            <div className="w-20 h-20 rounded-full border-2 border-[#00b4d8] bg-[#0d1b2a] flex items-center justify-center text-[#00b4d8] text-3xl shadow-[0_0_15px_rgba(0,180,216,0.3)]">
              <i className="fas fa-user-tie"></i>
            </div>
          </div>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!nicknameInput.trim()) return;
              await onUpdateNickname(nicknameInput.trim());
              showAlert('Profile updated successfully!', 'success');
              setActiveSubPage(null);
            }}
            className="w-full"
          >
            <div className="text-left mb-6">
              <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1.5 pl-1">
                Nickname
              </label>
              <input
                type="text"
                value={nicknameInput}
                onChange={(e) => setNicknameInput(e.target.value)}
                placeholder="Enter new nickname"
                required
                className="w-full bg-[#0d1b2a] border border-gray-800 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#00b4d8] transition text-center font-bold"
              />
            </div>
            <button
              type="submit"
              className="w-full btn-primary text-white font-bold py-3.5 rounded-xl shadow-[0_4px_15px_rgba(0,180,216,0.3)] cursor-pointer"
            >
              <i className="fas fa-save mr-2"></i> Save Info
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // MAIN ACCOUNT DASHBOARD
  // ----------------------------------------------------
  return (
    <div className="fade-in p-4 pb-28">
      {/* Profile Header */}
      <div className="flex items-center gap-4 mb-6 mt-2 relative">
        <div className="w-16 h-16 rounded-full border-2 border-[#00b4d8] bg-[#1b263b] flex items-center justify-center text-[#00b4d8] text-2xl overflow-hidden shadow-[0_0_15px_rgba(0,180,216,0.3)]">
          <i className="fas fa-user-tie"></i>
        </div>
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            {user.name || 'User'}{' '}
            <i className="fas fa-circle-check text-blue-400 text-xs"></i>
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            ID: <span className="text-white">{user.uid.slice(0, 6)}</span> |{' '}
            <span className="text-gray-300">
              {user.email.replace(/(.{2})(.*)(@.*)/, '$1***$3')}
            </span>
          </p>
        </div>
      </div>

      {/* Dynamic VIP Progress Card */}
      <div className="glass-panel p-4 rounded-2xl shadow-lg mb-5 border border-[#00b4d8]/30 bg-gradient-to-br from-[#1b263b] to-[#0d1b2a] relative overflow-hidden slide-up">
        <div className="absolute -right-5 -bottom-5 opacity-20">
          <i className="fas fa-crown text-[80px] text-[#00b4d8]"></i>
        </div>
        <div className="flex justify-between items-center mb-3 relative z-10">
          <h3 className="text-white font-bold flex items-center gap-2">
            <i className="fas fa-crown text-[#00b4d8]"></i> VIP {currentLevel}
          </h3>
          <button
            onClick={() => setActiveSubPage('accountVIPView')}
            className="text-[10px] text-[#00b4d8] font-bold bg-[#00b4d8]/10 px-3 py-1 rounded-full border border-[#00b4d8]/30 hover:bg-[#00b4d8] hover:text-black transition cursor-pointer"
          >
            Upgrade
          </button>
        </div>
        <div className="relative z-10">
          <div className="flex justify-between text-[10px] mb-1.5">
            <span className="text-gray-400">Total Deposit</span>
            <span className="text-[#00b4d8] font-bold">
              ₹{user.totalRecharged || 0} / ₹{nextReq}
            </span>
          </div>
          <div className="w-full bg-[#0d1b2a] rounded-full h-1.5 border border-gray-800">
            <div
              className="bg-gradient-to-r from-blue-500 to-[#00b4d8] h-1.5 rounded-full shadow-[0_0_5px_rgba(0,180,216,0.5)] transition-all"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="bg-[#1e2a3e] rounded-2xl p-4 mb-5 border border-gray-800 shadow-md slide-up">
        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={() => setActiveSubPage('accountRechargeView')}
            className="flex flex-col items-center gap-2 active:scale-95 transition group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-xl bg-[#0d1b2a] border border-gray-700 flex items-center justify-center text-[#00b4d8] group-hover:bg-[#00b4d8] group-hover:text-black transition shadow-inner">
              <i className="fas fa-wallet text-xl"></i>
            </div>
            <span className="text-[10px] text-gray-300 font-medium">Recharge</span>
          </button>
          <button
            onClick={() => setActiveSubPage('accountWithdrawView')}
            className="flex flex-col items-center gap-2 active:scale-95 transition group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-xl bg-[#0d1b2a] border border-gray-700 flex items-center justify-center text-[#00e676] group-hover:bg-[#00e676] group-hover:text-black transition shadow-inner">
              <i className="fas fa-arrow-up-from-bracket text-xl"></i>
            </div>
            <span className="text-[10px] text-gray-300 font-medium">Withdraw</span>
          </button>
          <button
            onClick={() => setActiveSubPage('accountOrderRecordView')}
            className="flex flex-col items-center gap-2 active:scale-95 transition group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-xl bg-[#0d1b2a] border border-gray-700 flex items-center justify-center text-blue-400 group-hover:bg-blue-400 group-hover:text-black transition shadow-inner">
              <i className="fas fa-clipboard-list text-xl"></i>
            </div>
            <span className="text-[10px] text-gray-300 font-medium">My Orders</span>
          </button>
          <button
            onClick={() => setActiveSubPage('accountBankView')}
            className="flex flex-col items-center gap-2 active:scale-95 transition group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-xl bg-[#0d1b2a] border border-gray-700 flex items-center justify-center text-purple-400 group-hover:bg-purple-400 group-hover:text-white transition shadow-inner">
              <i className="fas fa-credit-card text-xl"></i>
            </div>
            <span className="text-[10px] text-gray-300 font-medium">Bank Card</span>
          </button>
        </div>
      </div>

      {/* Menu Lists */}
      <p className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider pl-1">
        My Business
      </p>
      <div className="bg-[#1b263b] rounded-2xl border border-gray-800 mb-5 overflow-hidden">
        <button
          onClick={() => setActiveSubPage('accountTeamView')}
          className="w-full flex items-center justify-between p-4 border-b border-gray-800/50 hover:bg-[#223047] transition active:bg-gray-800 cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <i className="fas fa-users text-blue-400 w-5"></i>
            <span className="text-sm font-medium text-white">Team</span>
          </div>
          <i className="fas fa-chevron-right text-gray-600 text-xs"></i>
        </button>
      </div>

      <p className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider pl-1">
        Fund Profile
      </p>
      <div className="bg-[#1b263b] rounded-2xl border border-gray-800 mb-5 overflow-hidden">
        <button
          onClick={() => setActiveSubPage('accountOrderCreditsView')}
          className="w-full flex items-center justify-between p-4 border-b border-gray-800/50 hover:bg-[#223047] transition active:bg-gray-800 cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <i className="fas fa-chart-line text-blue-400 w-5"></i>
            <span className="text-sm font-medium text-white">Order Credits</span>
          </div>
          <i className="fas fa-chevron-right text-gray-600 text-xs"></i>
        </button>
        <button
          onClick={() => setActiveSubPage('accountRechargeRecordView')}
          className="w-full flex items-center justify-between p-4 border-b border-gray-800/50 hover:bg-[#223047] transition active:bg-gray-800 cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <i className="fas fa-file-invoice-dollar text-green-400 w-5"></i>
            <span className="text-sm font-medium text-white">Recharge Record</span>
          </div>
          <i className="fas fa-chevron-right text-gray-600 text-xs"></i>
        </button>
        <button
          onClick={() => setActiveSubPage('accountWithdrawRecordView')}
          className="w-full flex items-center justify-between p-4 hover:bg-[#223047] transition active:bg-gray-800 cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <i className="fas fa-file-export text-red-400 w-5"></i>
            <span className="text-sm font-medium text-white">Withdraw Record</span>
          </div>
          <i className="fas fa-chevron-right text-gray-600 text-xs"></i>
        </button>
      </div>

      <p className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider pl-1">
        Other Activities
      </p>
      <div className="bg-[#1b263b] rounded-2xl border border-gray-800 mb-6 overflow-hidden">
        <button
          onClick={() => setActiveSubPage('accountVIPView')}
          className="w-full flex items-center justify-between p-4 border-b border-gray-800/50 hover:bg-[#223047] transition active:bg-gray-800 cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <i className="fas fa-crown text-[#00b4d8] w-5"></i>
            <span className="text-sm font-medium text-white">VIP Levels</span>
          </div>
          <i className="fas fa-chevron-right text-gray-600 text-xs"></i>
        </button>
        <button
          onClick={() => setActiveSubPage('accountHelpView')}
          className="w-full flex items-center justify-between p-4 border-b border-gray-800/50 hover:bg-[#223047] transition active:bg-gray-800 cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <i className="fas fa-headset text-blue-400 w-5"></i>
            <span className="text-sm font-medium text-white">Support Center</span>
          </div>
          <i className="fas fa-chevron-right text-gray-600 text-xs"></i>
        </button>
        <button
          onClick={() => setActiveSubPage('accountSettingsView')}
          className="w-full flex items-center justify-between p-4 hover:bg-[#223047] transition active:bg-gray-800 cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <i className="fas fa-cog text-gray-400 w-5"></i>
            <span className="text-sm font-medium text-white">Settings</span>
          </div>
          <i className="fas fa-chevron-right text-gray-600 text-xs"></i>
        </button>
      </div>

      <button
        onClick={onLogout}
        className="w-full bg-red-900/20 border border-red-800 text-red-500 font-bold py-3.5 rounded-xl hover:bg-red-900 hover:text-white transition cursor-pointer"
      >
        <i className="fas fa-sign-out-alt mr-2"></i> Secure Logout
      </button>
    </div>
  );
};

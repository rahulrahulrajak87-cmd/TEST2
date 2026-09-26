import React, { useState } from 'react';
import {
  GlobalSettings,
  Product,
  UserData,
  RechargeRecord,
  WithdrawRecord,
  AnnouncementItem
} from '../types';

interface AdminPanelProps {
  settings: GlobalSettings;
  onUpdateSettings: (settings: Partial<GlobalSettings>) => Promise<void>;
  products: Product[];
  onAddProduct: (prod: Omit<Product, 'id'>) => Promise<void>;
  onDeleteProduct: (id: string) => Promise<void>;
  users: UserData[];
  onUpdateUserBalance: (
    uid: string,
    updates: { rechargeBal?: number; withdrawBal?: number }
  ) => Promise<void>;
  pendingRecharges: RechargeRecord[];
  onApproveRecharge: (rec: RechargeRecord) => Promise<void>;
  onRejectRecharge: (rec: RechargeRecord, reason: string) => Promise<void>;
  pendingWithdraws: WithdrawRecord[];
  onApproveWithdraw: (w: WithdrawRecord, remark?: string) => Promise<void>;
  onRejectWithdraw: (w: WithdrawRecord, reason: string) => Promise<void>;
  announcements: AnnouncementItem[];
  onAddAnnouncement: (text: string) => Promise<void>;
  onDeleteAnnouncement: (id: string) => Promise<void>;
  metrics: {
    totalUsers: number;
    totalRechargeApproved: number;
    totalWithdrawApproved: number;
    totalActiveInvestments: number;
  };
  onExitAdmin: () => void;
  showAlert: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  settings,
  onUpdateSettings,
  products,
  onAddProduct,
  onDeleteProduct,
  users,
  onUpdateUserBalance,
  pendingRecharges,
  onApproveRecharge,
  onRejectRecharge,
  pendingWithdraws,
  onApproveWithdraw,
  onRejectWithdraw,
  announcements,
  onAddAnnouncement,
  onDeleteAnnouncement,
  metrics,
  onExitAdmin,
  showAlert
}) => {
  const [activeTab, setActiveTab] = useState<
    'adDash' | 'adFin' | 'adUsers' | 'adProd' | 'adTeam' | 'adNotice' | 'adCore'
  >('adDash');

  // Multi-UPI states
  const [newUpi, setNewUpi] = useState('');

  // Core settings form
  const [minRec, setMinRec] = useState(String(settings.minRecharge));
  const [minWit, setMinWit] = useState(String(settings.minWithdraw));
  const [tax, setTax] = useState(String(settings.withdrawTax));
  const [withdrawSwitch, setWithdrawSwitch] = useState(settings.withdrawSwitch);

  // Team rates form
  const [t1, setT1] = useState(String(settings.tier1));
  const [t2, setT2] = useState(String(settings.tier2));
  const [t3, setT3] = useState(String(settings.tier3));

  // Product form
  const [pTitle, setPTitle] = useState('');
  const [pCategory, setPCategory] = useState<'stable' | 'welfare' | 'activity'>('stable');
  const [pPrice, setPPrice] = useState('');
  const [pDaily, setPDaily] = useState('');
  const [pDurVal, setPDurVal] = useState('60');
  const [pDurUnit, setPDurUnit] = useState<'hours' | 'days' | 'months'>('days');
  const [pImageBase64, setPImageBase64] = useState<string>('');

  // Notice form
  const [noticeText, setNoticeText] = useState('');

  // User search
  const [userSearch, setUserSearch] = useState('');

  // Selected withdrawal for Pay Modal
  const [payModalWithdraw, setPayModalWithdraw] = useState<WithdrawRecord | null>(null);

  // Rejection modal
  const [rejectItem, setRejectItem] = useState<{
    type: 'recharge' | 'withdraw';
    item: any;
  } | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Process image upload
  const handleImageFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 300;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const minDir = Math.min(img.width, img.height);
          const sx = (img.width - minDir) / 2;
          const sy = (img.height - minDir) / 2;
          ctx.drawImage(img, sx, sy, minDir, minDir, 0, 0, size, size);
          setPImageBase64(canvas.toDataURL('image/jpeg', 0.8));
          showAlert('Product image processed and resized!', 'success');
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Add UPI ID
  const handleAddUpi = async () => {
    if (!newUpi.trim()) return;
    const currentList = settings.upiIds || [settings.upiId || 'admin@upi'];
    if (currentList.includes(newUpi.trim())) {
      showAlert('UPI ID already exists', 'error');
      return;
    }
    const updated = [...currentList, newUpi.trim()];
    await onUpdateSettings({ upiIds: updated, upiId: updated[0] });
    setNewUpi('');
    showAlert('UPI ID added successfully!', 'success');
  };

  // Remove UPI ID
  const handleRemoveUpi = async (index: number) => {
    const currentList = [...(settings.upiIds || [])];
    if (currentList.length <= 1) {
      showAlert('You must keep at least one active UPI ID', 'error');
      return;
    }
    currentList.splice(index, 1);
    await onUpdateSettings({ upiIds: currentList, upiId: currentList[0] });
    showAlert('UPI ID deleted!', 'success');
  };

  // Filtered users
  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.uid.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0d1b2a] pb-28 relative z-50 fade-in">
      {/* Top Header */}
      <div className="sticky top-0 z-50 bg-[#0d1b2a]/95 backdrop-blur-md border-b border-gray-800 p-4 shadow-lg">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black text-[#00b4d8] flex items-center gap-2">
              <i className="fas fa-shield-alt"></i> Admin Pro
            </h1>
            <p className="text-[10px] text-gray-400 font-mono">Real-Time Control Center</p>
          </div>
          <button
            onClick={onExitAdmin}
            className="bg-red-900/40 text-red-500 border border-red-800 px-4 py-2 rounded-xl text-xs font-bold shadow-md hover:bg-red-800 hover:text-white transition cursor-pointer"
          >
            <i className="fas fa-power-off mr-1"></i> Exit Admin
          </button>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="p-4 overflow-x-auto whitespace-nowrap hide-scroll space-x-2 border-b border-gray-800 mb-4 pb-3">
        <button
          onClick={() => setActiveTab('adDash')}
          className={`adm-tab px-4 py-2 rounded-full text-xs font-bold cursor-pointer ${
            activeTab === 'adDash'
              ? 'bg-[#00b4d8] text-black shadow-md'
              : 'bg-[#1b263b] text-gray-400 border border-gray-700'
          }`}
        >
          <i className="fas fa-chart-pie mr-1"></i> Dashboard
        </button>
        <button
          onClick={() => setActiveTab('adFin')}
          className={`adm-tab px-4 py-2 rounded-full text-xs font-bold cursor-pointer ${
            activeTab === 'adFin'
              ? 'bg-[#00b4d8] text-black shadow-md'
              : 'bg-[#1b263b] text-gray-400 border border-gray-700'
          }`}
        >
          <i className="fas fa-university mr-1"></i> Approvals Queue
        </button>
        <button
          onClick={() => setActiveTab('adUsers')}
          className={`adm-tab px-4 py-2 rounded-full text-xs font-bold cursor-pointer ${
            activeTab === 'adUsers'
              ? 'bg-[#00b4d8] text-black shadow-md'
              : 'bg-[#1b263b] text-gray-400 border border-gray-700'
          }`}
        >
          <i className="fas fa-users mr-1"></i> User Wallets
        </button>
        <button
          onClick={() => setActiveTab('adProd')}
          className={`adm-tab px-4 py-2 rounded-full text-xs font-bold cursor-pointer ${
            activeTab === 'adProd'
              ? 'bg-[#00b4d8] text-black shadow-md'
              : 'bg-[#1b263b] text-gray-400 border border-gray-700'
          }`}
        >
          <i className="fas fa-box mr-1"></i> Products DB
        </button>
        <button
          onClick={() => setActiveTab('adTeam')}
          className={`adm-tab px-4 py-2 rounded-full text-xs font-bold cursor-pointer ${
            activeTab === 'adTeam'
              ? 'bg-[#00b4d8] text-black shadow-md'
              : 'bg-[#1b263b] text-gray-400 border border-gray-700'
          }`}
        >
          <i className="fas fa-network-wired mr-1"></i> Team Sync
        </button>
        <button
          onClick={() => setActiveTab('adNotice')}
          className={`adm-tab px-4 py-2 rounded-full text-xs font-bold cursor-pointer ${
            activeTab === 'adNotice'
              ? 'bg-[#00b4d8] text-black shadow-md'
              : 'bg-[#1b263b] text-gray-400 border border-gray-700'
          }`}
        >
          <i className="fas fa-bullhorn mr-1"></i> Content Msg
        </button>
        <button
          onClick={() => setActiveTab('adCore')}
          className={`adm-tab px-4 py-2 rounded-full text-xs font-bold cursor-pointer ${
            activeTab === 'adCore'
              ? 'bg-[#00b4d8] text-black shadow-md'
              : 'bg-[#1b263b] text-gray-400 border border-gray-700'
          }`}
        >
          <i className="fas fa-cogs mr-1"></i> Core Settings
        </button>
      </div>

      <div className="px-4 pb-16">
        {/* 1. DASHBOARD */}
        {activeTab === 'adDash' && (
          <div className="slide-up">
            <h2 className="text-lg font-bold text-white mb-4">Live Metrics Overview</h2>
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="glass-panel p-4 rounded-xl border-l-2 border-blue-500 shadow-md">
                <p className="text-[10px] text-gray-400 mb-1">Total Registered</p>
                <h3 className="text-2xl font-black text-white">{metrics.totalUsers}</h3>
              </div>
              <div className="glass-panel p-4 rounded-xl border-l-2 border-green-500 shadow-md">
                <p className="text-[10px] text-gray-400 mb-1">Approved Deposits</p>
                <h3 className="text-2xl font-black text-[#00e676]">
                  ₹{metrics.totalRechargeApproved.toFixed(2)}
                </h3>
              </div>
              <div className="glass-panel p-4 rounded-xl border-l-2 border-red-500 shadow-md">
                <p className="text-[10px] text-gray-400 mb-1">Approved Withdraws</p>
                <h3 className="text-2xl font-black text-red-400">
                  ₹{metrics.totalWithdrawApproved.toFixed(2)}
                </h3>
              </div>
              <div className="glass-panel p-4 rounded-xl border-l-2 border-purple-500 shadow-md">
                <p className="text-[10px] text-gray-400 mb-1">Active Investments</p>
                <h3 className="text-2xl font-black text-purple-400">
                  {metrics.totalActiveInvestments}
                </h3>
              </div>
            </div>
          </div>
        )}

        {/* 2. APPROVALS QUEUE */}
        {activeTab === 'adFin' && (
          <div className="slide-up">
            {/* Multi-UPI Management */}
            <div className="glass-panel p-5 rounded-2xl mb-6 border border-[#00b4d8] shadow-[0_0_20px_rgba(0,180,216,0.2)]">
              <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                <i className="fas fa-qrcode text-[#00b4d8]"></i> Dynamic Multi-UPI Setup
              </h3>
              <p className="text-[10px] text-gray-400 mb-3">
                System picks a random active UPI ID for every user payment attempt.
              </p>

              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newUpi}
                  onChange={(e) => setNewUpi(e.target.value)}
                  placeholder="e.g. merchant@upi"
                  className="flex-1 bg-[#0d1b2a] border border-gray-700 rounded-xl px-4 py-3 text-white text-sm font-bold outline-none focus:border-[#00b4d8]"
                />
                <button
                  onClick={handleAddUpi}
                  className="bg-[#00b4d8] text-white font-black px-5 py-3 rounded-xl shadow-lg hover:brightness-110 active:scale-95 transition text-xs uppercase cursor-pointer"
                >
                  + Add UPI
                </button>
              </div>

              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                Active UPI IDs List
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {(settings.upiIds || []).map((upi, idx) => (
                  <div
                    key={upi}
                    className="bg-[#0d1b2a] border border-gray-800 p-3 rounded-xl flex items-center justify-between"
                  >
                    <span className="text-xs font-bold text-white tracking-wider">{upi}</span>
                    <button
                      onClick={() => handleRemoveUpi(idx)}
                      className="text-red-400 bg-red-950/40 border border-red-900/50 px-3 py-1 rounded-lg text-[10px] font-bold hover:bg-red-900 hover:text-white transition cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Recharges Queue */}
            <h4 className="text-xs font-bold text-gray-400 mb-2 uppercase border-b border-gray-800 pb-1">
              Deposit Approvals ({pendingRecharges.length})
            </h4>
            <div className="space-y-3 mb-6">
              {pendingRecharges.length === 0 ? (
                <p className="text-xs text-gray-500 italic py-2">No pending deposit requests.</p>
              ) : (
                pendingRecharges.map((rec) => (
                  <div
                    key={rec.id}
                    className="glass-panel p-4 rounded-xl border border-gray-800 flex justify-between items-center shadow-md"
                  >
                    <div>
                      <p className="font-bold text-white text-base">₹{rec.amount.toFixed(2)}</p>
                      <p className="text-[10px] text-gray-400 font-mono mt-0.5">UTR: {rec.utr}</p>
                      <p className="text-[9px] text-gray-500">{rec.email}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => onApproveRecharge(rec)}
                        className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow hover:bg-green-500 cursor-pointer"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          setRejectItem({ type: 'recharge', item: rec });
                          setRejectReason('');
                        }}
                        className="bg-red-900/40 border border-red-800 text-red-400 px-3 py-1.5 rounded-lg text-xs font-bold shadow hover:bg-red-800 hover:text-white cursor-pointer"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Withdrawals Queue */}
            <h4 className="text-xs font-bold text-gray-400 mb-2 uppercase border-b border-gray-800 pb-1">
              Withdrawal Approvals ({pendingWithdraws.length})
            </h4>
            <div className="space-y-3">
              {pendingWithdraws.length === 0 ? (
                <p className="text-xs text-gray-500 italic py-2">No pending withdrawal requests.</p>
              ) : (
                pendingWithdraws.map((w) => {
                  const net = Number(w.receiveAmount || w.amount * 0.9);
                  return (
                    <div
                      key={w.id}
                      className="glass-panel p-4 rounded-xl border border-gray-800 flex justify-between items-center shadow-md"
                    >
                      <div>
                        <p className="font-bold text-white text-base">
                          Pay: <span className="text-[#00e676]">₹{net.toFixed(2)}</span>{' '}
                          <span className="text-xs text-gray-400">(Req: ₹{w.amount})</span>
                        </p>
                        <p className="text-[10px] text-gray-300 font-medium">
                          {w.name} | Acc: {w.accNo} | IFSC: {w.ifsc}
                        </p>
                        <p className="text-[9px] text-gray-500">{w.email}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setPayModalWithdraw(w)}
                          className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow hover:bg-blue-500 cursor-pointer"
                        >
                          Pay User
                        </button>
                        <button
                          onClick={() => {
                            setRejectItem({ type: 'withdraw', item: w });
                            setRejectReason('');
                          }}
                          className="bg-red-900/40 border border-red-800 text-red-400 px-3 py-1.5 rounded-lg text-xs font-bold shadow hover:bg-red-800 hover:text-white cursor-pointer"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* 3. USER WALLETS */}
        {activeTab === 'adUsers' && (
          <div className="slide-up">
            <h3 className="font-bold text-white text-lg mb-3">User Wallets & Accounts</h3>
            <input
              type="text"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Search by email or UID..."
              className="w-full bg-[#1e2a3e] border border-gray-800 rounded-xl px-4 py-3 text-white text-sm mb-4 outline-none focus:border-[#00b4d8]"
            />

            <div className="space-y-4">
              {filteredUsers.length === 0 ? (
                <p className="text-center text-gray-500 py-10">No users found.</p>
              ) : (
                filteredUsers.map((u) => (
                  <div
                    key={u.uid}
                    className="glass-panel p-4 rounded-xl border border-gray-800 shadow-md"
                  >
                    <div className="flex justify-between items-start mb-3 border-b border-gray-800 pb-2">
                      <div>
                        <h4 className="font-bold text-white text-sm">
                          {u.name || 'User'} ({u.email})
                        </h4>
                        <p className="text-[10px] text-gray-400 font-mono mt-0.5">UID: {u.uid}</p>
                      </div>
                      <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded font-mono font-bold">
                        Code: {u.inviteCode}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                      <div>
                        <span className="text-gray-400 text-[10px] uppercase">Recharge Bal:</span>
                        <p className="font-bold text-white">₹{u.rechargeBal.toFixed(2)}</p>
                      </div>
                      <div>
                        <span className="text-gray-400 text-[10px] uppercase">Withdrawable:</span>
                        <p className="font-bold text-[#00e676]">₹{u.withdrawBal.toFixed(2)}</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const val = prompt(
                            `Set new Recharge Balance for ${u.name || u.email}:`,
                            String(u.rechargeBal)
                          );
                          if (val !== null && !isNaN(Number(val))) {
                            onUpdateUserBalance(u.uid, { rechargeBal: Number(val) });
                            showAlert('Recharge balance updated!', 'success');
                          }
                        }}
                        className="flex-1 bg-[#1e2a3e] border border-gray-700 text-gray-300 py-1.5 rounded-lg text-xs font-bold hover:border-[#00b4d8] hover:text-[#00b4d8] transition cursor-pointer"
                      >
                        Edit Recharge Bal
                      </button>
                      <button
                        onClick={() => {
                          const val = prompt(
                            `Set new Withdrawable Balance for ${u.name || u.email}:`,
                            String(u.withdrawBal)
                          );
                          if (val !== null && !isNaN(Number(val))) {
                            onUpdateUserBalance(u.uid, { withdrawBal: Number(val) });
                            showAlert('Withdrawable balance updated!', 'success');
                          }
                        }}
                        className="flex-1 bg-[#1e2a3e] border border-gray-700 text-gray-300 py-1.5 rounded-lg text-xs font-bold hover:border-[#00e676] hover:text-[#00e676] transition cursor-pointer"
                      >
                        Edit Withdraw Bal
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 4. PRODUCTS DB */}
        {activeTab === 'adProd' && (
          <div className="slide-up">
            <h3 className="font-bold text-white text-lg mb-2">Launch New Investment Plan</h3>
            <div className="glass-panel p-4 rounded-xl border border-gray-700 mb-6 space-y-3">
              <input
                type="text"
                value={pTitle}
                onChange={(e) => setPTitle(e.target.value)}
                placeholder="Product Title"
                className="w-full bg-[#0d1b2a] border border-gray-800 rounded-lg px-4 py-3 text-white text-sm outline-none"
              />

              <div className="flex flex-col gap-1 w-full text-left">
                <label className="text-[10px] text-gray-400 uppercase tracking-wider pl-1">
                  Product Image (Direct Upload)
                </label>
                <div className="w-full bg-[#0d1b2a] border border-gray-800 rounded-xl p-3 flex items-center justify-between gap-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files?.[0]) handleImageFile(e.target.files[0]);
                    }}
                    className="text-xs text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[#00b4d8]/10 file:text-[#00b4d8] cursor-pointer"
                  />
                  {pImageBase64 ? (
                    <img
                      src={pImageBase64}
                      alt="Preview"
                      className="w-10 h-10 rounded object-cover border border-gray-700"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded border border-gray-700 bg-gray-800 flex items-center justify-center text-xs text-gray-500">
                      <i className="fas fa-image text-lg"></i>
                    </div>
                  )}
                </div>
              </div>

              <select
                value={pCategory}
                onChange={(e) => setPCategory(e.target.value as any)}
                className="w-full bg-[#0d1b2a] border border-gray-800 rounded-lg px-4 py-3 text-white text-sm outline-none"
              >
                <option value="stable">Stable</option>
                <option value="welfare">Welfare</option>
                <option value="activity">Activity</option>
              </select>

              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  value={pPrice}
                  onChange={(e) => setPPrice(e.target.value)}
                  placeholder="Price (₹)"
                  className="w-full bg-[#0d1b2a] border border-gray-800 rounded-lg px-4 py-3 text-white text-sm outline-none"
                />
                <input
                  type="number"
                  value={pDaily}
                  onChange={(e) => setPDaily(e.target.value)}
                  placeholder="Daily Income (₹)"
                  className="w-full bg-[#0d1b2a] border border-gray-800 rounded-lg px-4 py-3 text-white text-sm outline-none"
                />
              </div>

              <div className="flex gap-2">
                <input
                  type="number"
                  value={pDurVal}
                  onChange={(e) => setPDurVal(e.target.value)}
                  placeholder="Duration Value"
                  className="w-1/2 bg-[#0d1b2a] border border-gray-800 rounded-lg px-4 py-3 text-white text-sm outline-none"
                />
                <select
                  value={pDurUnit}
                  onChange={(e) => setPDurUnit(e.target.value as any)}
                  className="w-1/2 bg-[#0d1b2a] border border-gray-800 rounded-lg px-4 py-3 text-white text-sm outline-none"
                >
                  <option value="hours">Hour(s)</option>
                  <option value="days">Day(s)</option>
                  <option value="months">Month(s)</option>
                </select>
              </div>

              <button
                onClick={async () => {
                  if (!pTitle || !pPrice || !pDaily) {
                    showAlert('Please enter all required product fields', 'error');
                    return;
                  }
                  await onAddProduct({
                    title: pTitle,
                    category: pCategory,
                    price: Number(pPrice),
                    daily: Number(pDaily),
                    duration: Number(pDurVal),
                    durationValue: Number(pDurVal),
                    durationUnit: pDurUnit,
                    image:
                      pImageBase64 ||
                      'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=300&q=80'
                  });
                  showAlert('New product published successfully!', 'success');
                  setPTitle('');
                  setPPrice('');
                  setPDaily('');
                  setPImageBase64('');
                }}
                className="w-full bg-[#00b4d8] text-white font-black py-3 rounded-lg shadow-lg cursor-pointer"
              >
                Publish New Product
              </button>
            </div>

            <h3 className="font-bold text-white text-lg mb-3">Live Products Database</h3>
            <div className="space-y-3">
              {products.map((p) => (
                <div
                  key={p.id}
                  className="bg-[#1e2a3e] p-3.5 rounded-xl border border-gray-800 flex justify-between items-center"
                >
                  <div className="flex items-center gap-3">
                    <img src={p.image} alt={p.title} className="w-12 h-12 rounded object-cover" />
                    <div>
                      <h4 className="font-bold text-white text-xs">{p.title}</h4>
                      <p className="text-[10px] text-gray-400">
                        Price: ₹{p.price} | Daily: ₹{p.daily} | {p.durationValue || p.duration}{' '}
                        {p.durationUnit || 'days'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm(`Delete product ${p.title}?`)) onDeleteProduct(p.id);
                    }}
                    className="w-8 h-8 rounded-lg bg-red-900/30 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition cursor-pointer"
                  >
                    <i className="fas fa-trash text-xs"></i>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. TEAM SYNC */}
        {activeTab === 'adTeam' && (
          <div className="slide-up">
            <div className="glass-panel p-5 rounded-2xl mb-5">
              <h3 className="text-sm font-bold text-white mb-1">Global Commission Setup</h3>
              <p className="text-[10px] text-gray-400 mb-4">
                These percentages instantly sync to all users' downline rewards.
              </p>
              <div className="grid grid-cols-3 gap-3 mb-5">
                <div>
                  <label className="text-[10px] text-gray-400">Level 1 (%)</label>
                  <input
                    type="number"
                    value={t1}
                    onChange={(e) => setT1(e.target.value)}
                    className="w-full bg-[#0d1b2a] rounded-lg px-2 py-3 text-center text-lg font-bold text-white border border-gray-700 mt-1 focus:border-[#00b4d8]"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400">Level 2 (%)</label>
                  <input
                    type="number"
                    value={t2}
                    onChange={(e) => setT2(e.target.value)}
                    className="w-full bg-[#0d1b2a] rounded-lg px-2 py-3 text-center text-lg font-bold text-white border border-gray-700 mt-1 focus:border-[#00b4d8]"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400">Level 3 (%)</label>
                  <input
                    type="number"
                    value={t3}
                    onChange={(e) => setT3(e.target.value)}
                    className="w-full bg-[#0d1b2a] rounded-lg px-2 py-3 text-center text-lg font-bold text-white border border-gray-700 mt-1 focus:border-[#00b4d8]"
                  />
                </div>
              </div>
              <button
                onClick={async () => {
                  await onUpdateSettings({
                    tier1: Number(t1),
                    tier2: Number(t2),
                    tier3: Number(t3)
                  });
                  showAlert('Team rebate rates synchronized globally!', 'success');
                }}
                className="w-full btn-primary text-white font-black py-3.5 rounded-xl text-sm shadow-lg cursor-pointer"
              >
                Synchronize Team Rates
              </button>
            </div>
          </div>
        )}

        {/* 6. CONTENT NOTICE */}
        {activeTab === 'adNotice' && (
          <div className="slide-up">
            <div className="glass-panel p-5 rounded-2xl mb-5 border border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.15)]">
              <h3 className="text-sm font-bold text-white mb-1">Global Popup Notice</h3>
              <p className="text-[10px] text-gray-400 mb-3">
                This message will pop up on every user's screen.
              </p>
              <textarea
                rows={4}
                value={noticeText}
                onChange={(e) => setNoticeText(e.target.value)}
                placeholder="Enter alert message..."
                className="w-full bg-[#0d1b2a] rounded-xl p-4 text-sm text-white font-bold border border-gray-700 mb-4 outline-none focus:border-purple-500 transition"
              ></textarea>
              <button
                onClick={async () => {
                  if (!noticeText.trim()) return;
                  await onAddAnnouncement(noticeText.trim());
                  await onUpdateSettings({ noticeMsg: noticeText.trim() });
                  setNoticeText('');
                  showAlert('Notice published globally!', 'success');
                }}
                className="w-full bg-purple-600 text-white font-black py-3.5 rounded-xl shadow-lg active:scale-95 transition cursor-pointer"
              >
                Publish Notice Now
              </button>
            </div>

            <h3 className="font-bold text-white text-lg mb-3 flex items-center gap-2">
              <i className="fas fa-history text-purple-400"></i> Announcement History
            </h3>
            <div className="space-y-3">
              {announcements.map((a) => (
                <div
                  key={a.id}
                  className="bg-[#1e2a3e] p-4 rounded-xl border border-gray-800 flex justify-between items-center shadow-md"
                >
                  <div className="pr-4">
                    <p className="text-xs text-white leading-relaxed font-semibold">{a.text}</p>
                    <p className="text-[9px] text-gray-500 mt-1">
                      {a.date?.seconds
                        ? new Date(a.date.seconds * 1000).toLocaleString()
                        : 'Recent'}
                    </p>
                  </div>
                  <button
                    onClick={() => onDeleteAnnouncement(a.id)}
                    className="w-8 h-8 rounded-lg bg-red-900/30 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition shrink-0 cursor-pointer"
                  >
                    <i className="fas fa-trash text-xs"></i>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 7. CORE SETTINGS */}
        {activeTab === 'adCore' && (
          <div className="slide-up">
            <div className="glass-panel p-5 rounded-2xl mb-5">
              <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-4">
                <div>
                  <p className="font-bold text-white text-sm">Master Withdrawal Switch</p>
                  <p className="text-[10px] text-gray-400">
                    Turn OFF to completely block withdrawals site-wide
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setWithdrawSwitch(!withdrawSwitch)}
                  className={`w-14 h-7 rounded-full relative transition-colors cursor-pointer ${
                    withdrawSwitch ? 'bg-green-500' : 'bg-red-500'
                  }`}
                >
                  <div
                    className={`w-6 h-6 bg-white rounded-full absolute top-0.5 transition-all ${
                      withdrawSwitch ? 'right-0.5' : 'left-0.5'
                    }`}
                  ></div>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-5">
                <div>
                  <label className="text-[10px] text-gray-400 uppercase tracking-wider">
                    Min Recharge (₹)
                  </label>
                  <input
                    type="number"
                    value={minRec}
                    onChange={(e) => setMinRec(e.target.value)}
                    className="w-full bg-[#0d1b2a] rounded-xl px-4 py-3 font-bold text-white border border-gray-700 mt-1 text-center outline-none focus:border-[#00b4d8]"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 uppercase tracking-wider">
                    Min Withdraw (₹)
                  </label>
                  <input
                    type="number"
                    value={minWit}
                    onChange={(e) => setMinWit(e.target.value)}
                    className="w-full bg-[#0d1b2a] rounded-xl px-4 py-3 font-bold text-white border border-gray-700 mt-1 text-center outline-none focus:border-[#00b4d8]"
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="text-[10px] text-gray-400 uppercase tracking-wider">
                  Withdrawal Tax (%)
                </label>
                <input
                  type="number"
                  value={tax}
                  onChange={(e) => setTax(e.target.value)}
                  className="w-full bg-[#0d1b2a] rounded-xl px-4 py-3 font-bold text-white border border-gray-700 mt-1 text-center outline-none focus:border-[#00b4d8]"
                />
              </div>

              <button
                onClick={async () => {
                  await onUpdateSettings({
                    withdrawSwitch,
                    minRecharge: Number(minRec),
                    minWithdraw: Number(minWit),
                    withdrawTax: Number(tax)
                  });
                  showAlert('Core System Settings applied globally!', 'success');
                }}
                className="w-full btn-primary text-white font-black py-3.5 rounded-xl shadow-lg active:scale-95 transition cursor-pointer"
              >
                Save Core Config
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Pay User Modal */}
      {payModalWithdraw && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[9999] flex items-center justify-center p-4 fade-in">
          <div className="bg-gradient-to-b from-[#1b263b] to-[#0d1b2a] w-full max-w-sm p-6 rounded-3xl border border-blue-900/50 relative slide-up shadow-[0_0_50px_rgba(59,130,246,0.15)]">
            <h3 className="text-xl font-black text-white mb-1">Pay User</h3>
            <p className="text-[10px] text-gray-400 mb-5">
              Copy details or initiate UPI direct payout
            </p>

            <div className="bg-[#0d1b2a] rounded-xl p-4 border border-gray-800 mb-4 space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-[9px] text-gray-500 uppercase">Amount to Pay</p>
                  <p className="text-lg font-black text-red-400">
                    ₹{Number(payModalWithdraw.receiveAmount || payModalWithdraw.amount * 0.9).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] text-gray-500 uppercase text-right">Tax Deduction</p>
                  <p className="text-xs font-bold text-gray-300 text-right">
                    -₹{Number(payModalWithdraw.tax || payModalWithdraw.amount * 0.1).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2 mb-6">
              <div className="bg-[#1e2a3e] border border-gray-800 rounded-lg p-3 flex justify-between items-center">
                <div className="overflow-hidden pr-2">
                  <p className="text-[9px] text-gray-500 uppercase">Name</p>
                  <p className="font-bold text-white text-sm truncate">{payModalWithdraw.name}</p>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(payModalWithdraw.name);
                    showAlert('Name copied', 'success');
                  }}
                  className="text-blue-400 bg-blue-500/10 p-2 rounded cursor-pointer"
                >
                  <i className="fas fa-copy"></i>
                </button>
              </div>

              <div className="bg-[#1e2a3e] border border-gray-800 rounded-lg p-3 flex justify-between items-center">
                <div className="overflow-hidden pr-2">
                  <p className="text-[9px] text-gray-500 uppercase">Account No.</p>
                  <p className="font-bold text-[#00b4d8] text-base tracking-widest truncate">
                    {payModalWithdraw.accNo}
                  </p>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(payModalWithdraw.accNo);
                    showAlert('Account copied', 'success');
                  }}
                  className="text-blue-400 bg-blue-500/10 p-2 rounded cursor-pointer"
                >
                  <i className="fas fa-copy"></i>
                </button>
              </div>

              <div className="bg-[#1e2a3e] border border-gray-800 rounded-lg p-3 flex justify-between items-center">
                <div className="overflow-hidden pr-2">
                  <p className="text-[9px] text-gray-500 uppercase">IFSC Code</p>
                  <p className="font-bold text-white text-sm tracking-widest truncate uppercase">
                    {payModalWithdraw.ifsc}
                  </p>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(payModalWithdraw.ifsc);
                    showAlert('IFSC copied', 'success');
                  }}
                  className="text-blue-400 bg-blue-500/10 p-2 rounded cursor-pointer"
                >
                  <i className="fas fa-copy"></i>
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <a
                href={`upi://pay?pa=${payModalWithdraw.accNo}@${payModalWithdraw.ifsc.toLowerCase()}&pn=${encodeURIComponent(
                  payModalWithdraw.name
                )}&am=${
                  payModalWithdraw.receiveAmount || payModalWithdraw.amount * 0.9
                }&cu=INR`}
                className="w-full bg-blue-600 text-white font-black py-3.5 rounded-xl shadow-lg hover:bg-blue-500 transition flex items-center justify-center gap-2"
              >
                <i className="fas fa-paper-plane"></i> Open UPI App
              </a>
              <div className="flex gap-2">
                <button
                  onClick={() => setPayModalWithdraw(null)}
                  className="flex-1 bg-gray-800 text-gray-300 font-bold py-3 rounded-xl text-xs cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={async () => {
                    await onApproveWithdraw(payModalWithdraw);
                    setPayModalWithdraw(null);
                    showAlert('Withdrawal marked as PAID successfully!', 'success');
                  }}
                  className="flex-1 bg-green-600 text-white font-bold py-3 rounded-xl text-xs shadow-lg hover:bg-green-500 cursor-pointer"
                >
                  Mark as PAID
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {rejectItem && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[9999] flex items-center justify-center p-4 fade-in">
          <div className="bg-[#1b263b] w-full max-w-sm p-6 rounded-3xl border border-gray-800 relative slide-up shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <i className="fas fa-exclamation-circle text-red-500"></i> Reject Request
            </h3>
            <p className="text-xs text-gray-400 mb-4">
              Enter reason for rejecting this {rejectItem.type}:
            </p>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Invalid UTR or Bank IFSC mismatch..."
              className="w-full bg-[#0d1b2a] border border-gray-700 rounded-xl p-3 text-white text-sm mb-6 focus:border-[#00b4d8] outline-none resize-none transition"
            ></textarea>
            <div className="flex gap-3">
              <button
                onClick={() => setRejectItem(null)}
                className="flex-1 bg-gray-800 text-gray-300 font-bold py-3 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!rejectReason.trim()) {
                    showAlert('Please provide a reason', 'error');
                    return;
                  }
                  if (rejectItem.type === 'recharge') {
                    await onRejectRecharge(rejectItem.item, rejectReason.trim());
                  } else {
                    await onRejectWithdraw(rejectItem.item, rejectReason.trim());
                  }
                  setRejectItem(null);
                  showAlert('Request rejected and user notified', 'info');
                }}
                className="flex-1 bg-red-600 text-white font-bold py-3 rounded-xl shadow-lg hover:bg-red-500 cursor-pointer"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

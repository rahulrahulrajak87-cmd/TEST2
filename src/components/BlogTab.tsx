import React, { useState } from 'react';
import { BlogProof } from '../types';

interface BlogTabProps {
  posts: BlogProof[];
  onAddPost: (post: Omit<BlogProof, 'id' | 'date'>) => Promise<void>;
  showAlert: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const BlogTab: React.FC<BlogTabProps> = ({ posts, onAddPost, showAlert }) => {
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [img1File, setImg1File] = useState<File | null>(null);
  const [img2File, setImg2File] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amount.trim()) {
      showAlert('Please enter description and amount', 'error');
      return;
    }

    setSubmitting(true);
    try {
      // Simulate/Convert images for fast community showcase
      const fallbackImg1 =
        'https://images.unsplash.com/photo-1616077168079-7e09a677fb2c?auto=format&fit=crop&w=400&q=80';
      const fallbackImg2 =
        'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=400&q=80';

      const maskedPhone = '98****' + Math.floor(10 + Math.random() * 90);

      await onAddPost({
        phone: maskedPhone,
        tag: 'VIP 1',
        title: title.trim(),
        amount: Number(amount),
        img1: fallbackImg1,
        img2: fallbackImg2
      });

      showAlert('Withdrawal proof published to community!', 'success');
      setShowPublishModal(false);
      setTitle('');
      setAmount('');
      setImg1File(null);
      setImg2File(null);
    } catch (err: any) {
      showAlert(err.message || 'Failed to submit post', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="tab-content block p-4 fade-in pb-28 relative">
      {/* Top Header */}
      <div className="flex justify-between items-center mb-6 pt-2 sticky top-0 z-40 bg-[#0d1b2a]/95 backdrop-blur-md pb-3 border-b border-gray-800/50">
        <h1 className="text-3xl font-bold tracking-wide">
          Welcome <span className="text-[#00b4d8]">Here</span>
        </h1>
        <button
          onClick={() => setShowRulesModal(true)}
          className="w-10 h-10 rounded-full bg-[#1b263b] border border-gray-800 flex items-center justify-center text-gray-400 hover:text-[#00b4d8] transition shadow-md active:scale-90 cursor-pointer"
        >
          <i className="fas fa-info text-lg"></i>
        </button>
      </div>

      {/* Proof Feed */}
      <div className="space-y-5 relative z-10">
        {posts.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <i className="fas fa-camera text-4xl mb-3 opacity-40"></i>
            <p className="text-sm">No proofs yet. Be the first to share your payment proof!</p>
          </div>
        ) : (
          posts.map((post) => (
            <div
              key={post.id}
              className="glass-panel p-4 rounded-2xl shadow-lg relative overflow-hidden slide-up border border-gray-800"
            >
              <div className="flex items-center gap-3 mb-3">
                <i className="fas fa-user-circle text-3xl text-gray-500"></i>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{post.phone}</span>
                    <span className="bg-[#00b4d8]/20 text-[#00b4d8] text-[9px] px-1.5 py-0.5 rounded border border-[#00b4d8]/30 font-bold">
                      {post.tag}
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-300 mb-3 leading-relaxed">{post.title}</p>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div
                  className="aspect-[4/5] rounded-lg bg-gray-800 border border-gray-700 bg-cover bg-center"
                  style={{ backgroundImage: `url('${post.img1}')` }}
                ></div>
                <div
                  className="aspect-[4/5] rounded-lg bg-gray-800 border border-gray-700 bg-cover bg-center"
                  style={{ backgroundImage: `url('${post.img2}')` }}
                ></div>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-gray-800/50">
                <span className="text-[#00b4d8] font-bold text-sm tracking-wider">
                  ₹{Number(post.amount).toFixed(2)}
                </span>
                <span className="text-gray-500 text-[10px]">
                  <i className="far fa-clock mr-1"></i>
                  {post.date}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => setShowPublishModal(true)}
        className="fixed bottom-24 right-4 w-14 h-14 bg-gradient-to-tr from-[#00b4d8] to-blue-300 rounded-full text-white flex justify-center items-center text-2xl shadow-[0_4px_15px_rgba(0,180,216,0.4)] z-[90] active:scale-90 transition cursor-pointer"
      >
        <i className="fas fa-pen-nib"></i>
      </button>

      {/* Publish Modal */}
      {showPublishModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md p-6 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.8)] relative slide-up border border-gray-700">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <i className="fas fa-images text-[#00b4d8] drop-shadow-md"></i> Share Proof
              </h2>
              <button
                onClick={() => setShowPublishModal(false)}
                className="text-gray-400 hover:text-white transition active:scale-90"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            <form onSubmit={handleSubmitProof}>
              <textarea
                rows={2}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Write a short description..."
                required
                className="w-full bg-[#0d1b2a] border border-gray-800 rounded-xl px-4 py-3 mb-4 text-white text-sm outline-none focus:border-[#00b4d8] transition resize-none"
              ></textarea>

              <div className="mb-4">
                <label className="block text-[10px] text-gray-400 mb-1.5 uppercase tracking-wide">
                  App Withdrawal Record
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImg1File(e.target.files?.[0] || null)}
                  className="w-full text-xs text-gray-400 file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-blue-500/10 file:text-blue-400 hover:file:bg-blue-500/20 file:transition cursor-pointer bg-[#0d1b2a] rounded-xl border border-gray-800 p-1"
                />
              </div>

              <div className="mb-5">
                <label className="block text-[10px] text-gray-400 mb-1.5 uppercase tracking-wide">
                  Bank Payment SMS / Receipt
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImg2File(e.target.files?.[0] || null)}
                  className="w-full text-xs text-gray-400 file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-green-500/10 file:text-green-400 hover:file:bg-green-500/20 file:transition cursor-pointer bg-[#0d1b2a] rounded-xl border border-gray-800 p-1"
                />
              </div>

              <div className="mb-6 relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">
                  ₹
                </span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Amount Withdrawn"
                  required
                  className="w-full bg-[#0d1b2a] border border-gray-800 rounded-xl pl-8 pr-4 py-3 text-white text-sm outline-none focus:border-[#00b4d8] transition"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full btn-primary text-white py-3 rounded-xl text-sm font-bold shadow-lg cursor-pointer"
              >
                {submitting ? 'Publishing...' : 'Publish to Community'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Rules Modal */}
      {showRulesModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-sm p-6 rounded-2xl shadow-2xl relative slide-up border border-blue-900/30">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <i className="fas fa-shield-alt text-blue-400"></i> Community Rules
              </h2>
              <button
                onClick={() => setShowRulesModal(false)}
                className="text-gray-400 hover:text-white transition active:scale-90"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
            <ul className="space-y-3 text-xs text-gray-300 leading-relaxed mb-6">
              <li className="flex items-start gap-2">
                <i className="fas fa-check text-green-400 mt-1"></i>
                <span>Only upload genuine withdrawal proofs. Fake screenshots lead to account ban.</span>
              </li>
              <li className="flex items-start gap-2">
                <i className="fas fa-check text-green-400 mt-1"></i>
                <span>Include both the App Record and Bank SMS/Receipt to build trust.</span>
              </li>
              <li className="flex items-start gap-2">
                <i className="fas fa-check text-green-400 mt-1"></i>
                <span>Posts are monitored globally. Approved posts may receive bonus rewards.</span>
              </li>
            </ul>
            <button
              onClick={() => setShowRulesModal(false)}
              className="w-full bg-gray-800 text-white font-bold py-2.5 rounded-xl text-sm hover:bg-gray-700 transition"
            >
              Understood
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

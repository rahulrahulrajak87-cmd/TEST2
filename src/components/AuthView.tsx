import React, { useState } from 'react';

interface AuthViewProps {
  onLogin: (email: string, pass: string) => Promise<void>;
  onRegister: (email: string, pass: string, name: string, inviteCode: string) => Promise<void>;
  onForgotPassword: (email: string) => Promise<void>;
  loading: boolean;
  showAlert: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const AuthView: React.FC<AuthViewProps> = ({
  onLogin,
  onRegister,
  onForgotPassword,
  loading,
  showAlert
}) => {
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot'>('login');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [showLoginPass, setShowLoginPass] = useState(false);

  // Register form state
  const [regEmail, setRegEmail] = useState('');
  const [regName, setRegName] = useState('');
  const [regPass, setRegPass] = useState('');
  const [showRegPass, setShowRegPass] = useState(false);
  const [regInvite, setRegInvite] = useState('');

  // Check URL params for ref code on load
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      setRegInvite(ref.toUpperCase());
      setAuthMode('register');
    }
  }, []);

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPass.trim()) {
      showAlert('Please enter email and password', 'error');
      return;
    }
    try {
      await onLogin(loginEmail.trim(), loginPass);
    } catch (err: any) {
      showAlert(err.message || 'Login failed', 'error');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regEmail.trim() || !regPass.trim() || !regName.trim()) {
      showAlert('Please enter all required registration details', 'error');
      return;
    }
    if (regPass.length < 6) {
      showAlert('Password must be at least 6 characters long', 'error');
      return;
    }
    try {
      await onRegister(regEmail.trim(), regPass, regName.trim(), regInvite.trim().toUpperCase());
    } catch (err: any) {
      showAlert(err.message || 'Registration failed', 'error');
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      showAlert('Please enter your registered email address', 'error');
      return;
    }
    try {
      await onForgotPassword(forgotEmail.trim());
      showAlert('Password reset link sent to your email!', 'success');
      setAuthMode('login');
    } catch (err: any) {
      showAlert(err.message || 'Reset failed', 'error');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative z-10 fade-in bg-[#0d1b2a]">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-1 tracking-wide">
          SR <span className="text-gradient">MILKS</span>
        </h1>
        <p className="text-gray-400 text-xs tracking-widest uppercase">Premium Dairy Investments</p>
      </div>

      <div className="glass-panel w-full max-w-md p-7 rounded-3xl shadow-[0_0_30px_rgba(0,0,0,0.5)] relative overflow-hidden border border-[#00b4d8]/20">
        <div className="w-32 h-32 bg-[#00b4d8] opacity-10 rounded-full top-0 right-0 absolute pointer-events-none filter blur-xl"></div>

        {/* LOGIN FORM */}
        {authMode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="relative z-10">
            <h2 className="text-2xl font-bold mb-6 text-white">Login</h2>
            <input
              type="email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              placeholder="Email Address"
              required
              className="w-full bg-[#0d1b2a] border border-gray-800 rounded-xl px-4 py-3.5 mb-4 text-white outline-none focus:border-[#00b4d8] transition text-sm"
            />
            <div className="relative w-full mb-3">
              <input
                type={showLoginPass ? 'text' : 'password'}
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
                placeholder="Password"
                required
                className="w-full bg-[#0d1b2a] border border-gray-800 rounded-xl px-4 py-3.5 text-white outline-none focus:border-[#00b4d8] transition text-sm pr-12"
              />
              <button
                type="button"
                onClick={() => setShowLoginPass(!showLoginPass)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
              >
                <i className={`fas ${showLoginPass ? 'fa-eye' : 'fa-eye-slash'}`}></i>
              </button>
            </div>

            <div className="flex justify-end mb-6">
              <button
                type="button"
                onClick={() => setAuthMode('forgot')}
                className="text-gray-400 text-xs hover:text-[#00b4d8] transition cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3.5 rounded-xl text-base text-white mb-5 cursor-pointer font-bold"
            >
              {loading ? 'Authenticating...' : 'Secure Login'}
            </button>

            <p className="text-center text-sm text-gray-400">
              No account yet?{' '}
              <button
                type="button"
                onClick={() => setAuthMode('register')}
                className="text-[#00b4d8] font-bold hover:underline cursor-pointer ml-1"
              >
                Create one
              </button>
            </p>
          </form>
        )}

        {/* REGISTER FORM */}
        {authMode === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="relative z-10">
            <h2 className="text-2xl font-bold mb-6 text-white">Create Account</h2>
            <input
              type="email"
              value={regEmail}
              onChange={(e) => setRegEmail(e.target.value)}
              placeholder="Email Address"
              required
              className="w-full bg-[#0d1b2a] border border-gray-800 rounded-xl px-4 py-3.5 mb-4 text-white outline-none focus:border-[#00b4d8] transition text-sm"
            />
            <input
              type="text"
              value={regName}
              onChange={(e) => setRegName(e.target.value)}
              placeholder="Full Name"
              required
              className="w-full bg-[#0d1b2a] border border-gray-800 rounded-xl px-4 py-3.5 mb-4 text-white outline-none focus:border-[#00b4d8] transition text-sm"
            />
            <div className="relative w-full mb-4">
              <input
                type={showRegPass ? 'text' : 'password'}
                value={regPass}
                onChange={(e) => setRegPass(e.target.value)}
                placeholder="Password (Min 6 chars)"
                required
                className="w-full bg-[#0d1b2a] border border-gray-800 rounded-xl px-4 py-3.5 text-white outline-none focus:border-[#00b4d8] transition text-sm pr-12"
              />
              <button
                type="button"
                onClick={() => setShowRegPass(!showRegPass)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
              >
                <i className={`fas ${showRegPass ? 'fa-eye' : 'fa-eye-slash'}`}></i>
              </button>
            </div>
            <input
              type="text"
              value={regInvite}
              onChange={(e) => setRegInvite(e.target.value.toUpperCase())}
              placeholder="Invitation code (Optional)"
              className="w-full bg-[#0d1b2a] border border-[#00b4d8] rounded-xl px-4 py-3.5 mb-6 text-[#00b4d8] font-bold tracking-widest uppercase outline-none focus:shadow-[0_0_10px_rgba(0,180,216,0.2)] text-sm"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3.5 rounded-xl text-base text-white mb-5 cursor-pointer font-bold"
            >
              {loading ? 'Creating Account...' : 'Register Account'}
            </button>

            <p className="text-center text-sm text-gray-400">
              Already registered?{' '}
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className="text-[#00b4d8] font-bold hover:underline cursor-pointer ml-1"
              >
                Login here
              </button>
            </p>
          </form>
        )}

        {/* FORGOT PASSWORD FORM */}
        {authMode === 'forgot' && (
          <form onSubmit={handleForgotSubmit} className="relative z-10">
            <h2 className="text-2xl font-bold mb-3 text-white">Reset Password</h2>
            <p className="text-sm text-gray-400 mb-5 leading-relaxed">
              Enter your registered email address to receive a secure password reset link.
            </p>
            <input
              type="email"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              placeholder="Registered Email Address"
              required
              className="w-full bg-[#0d1b2a] border border-gray-800 rounded-xl px-4 py-3.5 mb-6 text-white outline-none focus:border-[#00b4d8] transition text-sm"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full border border-[#00b4d8] text-[#00b4d8] py-3.5 rounded-xl text-base mb-5 font-bold hover:bg-[#00b4d8] hover:text-black transition cursor-pointer"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
            <p className="text-center text-sm text-gray-400">
              Remembered password?{' '}
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className="text-[#00b4d8] font-bold hover:underline cursor-pointer ml-1"
              >
                Login here
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

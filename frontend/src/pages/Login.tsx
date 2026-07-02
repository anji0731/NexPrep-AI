import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Mail, Lock, Loader2, AlertCircle } from 'lucide-react';
import LoginMascot from '../components/LoginMascot';
import GoogleAccountsModal, { type GoogleAccount } from '../components/GoogleAccountsModal';

const Login: React.FC = () => {
  const { login, mockGoogleLogin, error, setError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [googleModalOpen, setGoogleModalOpen] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      // Error is set in context
    } finally {
      setLoading(false);
    }
  };

  const triggerGoogleAccountsPopup = () => {
    setError(null);
    setGoogleModalOpen(true);
  };

  const handleSelectGoogleAccount = async (account: GoogleAccount) => {
    setGoogleModalOpen(false);
    setGoogleLoading(true);
    try {
      await mockGoogleLogin(account.name, account.email);
      navigate('/dashboard');
    } catch (err) {
      setError('Google login failed.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col font-sans selection:bg-blue-600/10 selection:text-blue-600">
      <Navbar />
      
      <div className="flex-1 flex items-center justify-center p-6 bg-dot-pattern py-[120px]">
        <div className="bg-white p-8 md:p-10 rounded-[20px] border border-[#ECECEC] shadow-minimal max-w-md w-full space-y-6 text-left">
          
          {/* Funny Anime Mascot */}
          <LoginMascot isPasswordFocused={passwordFocused} />

          <div className="text-center space-y-2">
            <h2 className="text-card-title font-bold text-slate-900 tracking-tight">Welcome back</h2>
            <p className="text-xs text-slate-450 font-semibold uppercase tracking-wider">Sign in to NexPrep AI</p>
          </div>

          {error && (
            <div className="p-4 bg-red-50/50 border border-red-100 rounded-xl text-red-655 text-xs font-semibold flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
                  <Mail size={15} />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                  disabled={loading || googleLoading}
                  className="pl-10 w-full rounded-xl border border-[#ECECEC] px-3 py-3 text-xs focus:outline-none focus:border-blue-500 transition-all disabled:bg-slate-50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-455 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
                  <Lock size={15} />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  placeholder="••••••••"
                  required
                  disabled={loading || googleLoading}
                  className="pl-10 w-full rounded-xl border border-[#ECECEC] px-3 py-3 text-xs focus:outline-none focus:border-blue-500 transition-all disabled:bg-slate-50"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full btn-primary flex items-center justify-center gap-2 px-4 py-3.5 text-xs font-bold uppercase tracking-wider rounded-xl"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="relative flex justify-center text-[10px] uppercase">
            <span className="bg-white px-3 text-slate-400 font-bold tracking-wider relative z-10">Or continue with</span>
            <div className="absolute inset-y-1/2 left-0 right-0 border-t border-[#ECECEC] z-0"></div>
          </div>

          <button
            type="button"
            onClick={triggerGoogleAccountsPopup}
            disabled={loading || googleLoading}
            className="w-full btn-glass flex items-center justify-center gap-2.5 px-4 py-3.5 text-xs font-bold text-slate-800 rounded-xl"
          >
            {googleLoading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
            )}
            Sign in with Google
          </button>

          <p className="text-center text-xs font-semibold text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-bold text-blue-600 hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
      
      {/* Google Accounts Selection Popup Dialog */}
      <GoogleAccountsModal
        isOpen={googleModalOpen}
        onClose={() => setGoogleModalOpen(false)}
        onSelectAccount={handleSelectGoogleAccount}
      />

      <Footer />
    </div>
  );
};

export default Login;

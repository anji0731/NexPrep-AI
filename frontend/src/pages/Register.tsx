import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Mail, Lock, User, Loader2, AlertCircle } from 'lucide-react';
import LoginMascot from '../components/LoginMascot';
import { GoogleLogin } from '@react-oauth/google';

const Register: React.FC = () => {
  const { register, googleLogin, error, setError } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !email || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await register(username, email, password, confirmPassword);
      navigate('/dashboard');
    } catch (err) {
      // Error is handled in context
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setGoogleLoading(true);
    try {
      if (credentialResponse.credential) {
        await googleLogin(credentialResponse.credential);
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Google login failed:', err);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col font-sans selection:bg-blue-600/10 selection:text-blue-600">
      <Navbar />
      
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 bg-dot-pattern py-[80px] sm:py-[120px]">
        <div className="bg-white p-6 sm:p-8 md:p-10 rounded-[20px] border border-[#ECECEC] shadow-minimal max-w-md w-full space-y-6 text-left">
          
          {/* Funny Anime Mascot */}
          <LoginMascot isPasswordFocused={passwordFocused} />

          <div className="text-center space-y-2">
            <h2 className="text-card-title font-bold text-slate-900 tracking-tight">Create account</h2>
            <p className="text-xs text-slate-450 font-semibold uppercase tracking-wider">Get started with NexPrep AI</p>
          </div>

          {error && (
            <div className="p-4 bg-red-50/50 border border-red-100 rounded-xl text-red-655 text-xs font-semibold flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Username */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-455 uppercase tracking-wider">
                Full Name / Username
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
                  <User size={15} />
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="John Doe"
                  required
                  disabled={loading || googleLoading}
                  className="pl-10 w-full rounded-xl border border-[#ECECEC] px-3 py-3 text-xs focus:outline-none focus:border-blue-500 transition-all disabled:bg-slate-50"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-455 uppercase tracking-wider">
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

            {/* Password */}
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

            {/* Confirm Password */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-455 uppercase tracking-wider">
                Confirm Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
                  <Lock size={15} />
                </span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="relative flex justify-center text-[10px] uppercase">
            <span className="bg-white px-3 text-slate-400 font-bold tracking-wider relative z-10">Or continue with</span>
            <div className="absolute inset-y-1/2 left-0 right-0 border-t border-[#ECECEC] z-0"></div>
          </div>

          <div className="flex justify-center w-full">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Google Registration Failed')}
              theme="outline"
              size="large"
              shape="rectangular"
              text="signup_with"
            />
          </div>

          <p className="text-center text-xs font-semibold text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-blue-600 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* Real Google Auth replaced mock modal */}

      <Footer />
    </div>
  );
};

export default Register;

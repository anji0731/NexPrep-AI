import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, FileText, Code, Users, History, LogOut, LogIn, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/resume', label: 'Resume', icon: FileText },
    { path: '/technical', label: 'Technical Practice', icon: Code },
    { path: '/hr', label: 'HR Practice', icon: Users },
    { path: '/history', label: 'History', icon: History }
  ];

  return (
    <nav className="sticky top-0 z-50 bg-[#FAF9F6]/80 backdrop-blur-md border-b border-[#ECECEC]">
      <div className="max-w-[1400px] mx-auto px-6 sm:px-8">
        <div className="flex justify-between h-[72px]">
          
          {/* Brand Logo */}
          <div className="flex items-center">
            <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-2.5 group">
              <img 
                src="/tablogo.png" 
                className="w-10 h-10 rounded-xl shadow-sm group-hover:scale-105 transition-transform object-cover" 
                alt="NexPrep AI Logo" 
              />
              <span className="font-bold text-lg tracking-tight text-slate-900 flex items-center gap-1.5">
                NexPrep <span className="text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded text-xs">AI</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          {user && (
            <div className="hidden md:flex items-center gap-2">
              {menuItems.map((item) => {
                const active = isActive(item.path);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`relative flex items-center gap-2 px-3 py-1.5 rounded-full text-[15px] font-medium tracking-wide transition-all ${
                      active ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {active && (
                      <motion.div
                        layoutId="active-pill"
                        className="absolute inset-0 bg-white border border-[#ECECEC] rounded-full -z-10 shadow-sm"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                    <Icon size={14} className={active ? "text-blue-600" : "text-slate-400"} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          )}

          {/* Desktop Right Actions */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-50/60 text-blue-650 border border-blue-100/30 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                    {user.username.charAt(0)}
                  </div>
                  <span className="text-[13px] font-medium text-slate-800 leading-none">
                    {user.username}
                  </span>
                </div>
                <button aria-label="Action button"
                  onClick={handleLogout}
                  className="btn-glass h-10 px-4 flex items-center gap-1.5 text-[15px] font-semibold text-slate-700 rounded-xl shadow-sm"
                >
                  <LogOut size={12} className="text-slate-400" />
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="h-10 px-4 flex items-center gap-1.5 text-[15px] font-semibold text-slate-655 hover:text-slate-900 transition-colors"
                >
                  <LogIn size={13} className="text-slate-400" />
                  Login
                </Link>
                <Link
                  to="/register"
                  className="btn-primary h-10 px-5 flex items-center justify-center text-[15px] font-semibold rounded-xl shadow-sm"
                >
                  Start Preparing
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden">
            <button aria-label="Action button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-[#ECECEC] overflow-hidden"
          >
            <div className="px-4 py-3 space-y-1">
              {user ? (
                <>
                  <div className="px-3 py-2.5 border-b border-slate-100 mb-2">
                    <p className="text-sm font-bold text-slate-800">{user.username}</p>
                    <p className="text-xs text-slate-400">{user.email}</p>
                  </div>
                  {menuItems.map((item) => {
                    const active = isActive(item.path);
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold ${
                          active ? 'text-blue-600 bg-blue-50/50' : 'text-slate-655 hover:bg-slate-50'
                        }`}
                      >
                        <Icon size={16} />
                        {item.label}
                      </Link>
                    );
                  })}
                  <button aria-label="Action button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-red-655 hover:bg-red-50/30 transition-colors mt-2"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-2 pt-2 pb-2">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-700"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center px-4 py-2.5 rounded-xl bg-blue-600 text-sm font-bold text-white shadow-sm"
                  >
                    Start preparing
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;

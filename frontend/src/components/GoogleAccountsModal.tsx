import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User } from 'lucide-react';

interface GoogleAccount {
  name: string;
  email: string;
  avatarLetter: string;
}

interface GoogleAccountsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAccount: (account: GoogleAccount) => void;
}

const ACCOUNTS_LIST: GoogleAccount[] = [
  { name: 'Anjineyulu', email: 'anjineyulu@gmail.com', avatarLetter: 'A' },
  { name: 'Candidate Guest', email: 'candidate@gmail.com', avatarLetter: 'C' }
];

const GoogleAccountsModal: React.FC<GoogleAccountsModalProps> = ({ isOpen, onClose, onSelectAccount }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px]">
          {/* Modal backdrop clickable to close */}
          <div className="absolute inset-0" onClick={onClose} />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="relative bg-white w-full max-w-sm rounded-[24px] border border-slate-200 shadow-2xl p-6 overflow-hidden text-left"
          >
            {/* Close Button */}
            <button aria-label="Action button" 
              onClick={onClose} 
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-450 hover:text-slate-700 transition-colors"
            >
              <X size={16} />
            </button>

            {/* Google Identity Brand Header */}
            <div className="flex flex-col items-center text-center mt-2 space-y-4">
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
              
              <div className="space-y-1">
                <h3 className="font-bold text-slate-800 text-lg">Choose an account</h3>
                <p className="text-xs text-slate-500 font-medium">to continue to <span className="font-bold text-blue-600">NexPrep AI</span></p>
              </div>
            </div>

            {/* Google Accounts list */}
            <div className="mt-6 border border-slate-100 rounded-2xl overflow-hidden divide-y divide-slate-100">
              {ACCOUNTS_LIST.map((acc, index) => (
                <button aria-label="Action button"
                  key={index}
                  onClick={() => onSelectAccount(acc)}
                  className="w-full flex items-center gap-3.5 p-4 text-left hover:bg-slate-50/70 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs border border-blue-100/50 uppercase">
                    {acc.avatarLetter}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-slate-800 leading-tight truncate">{acc.name}</p>
                    <p className="text-[11px] font-semibold text-slate-500 truncate">{acc.email}</p>
                  </div>
                </button>
              ))}
              
              {/* Fake 'Use another account' option */}
              <button aria-label="Action button"
                onClick={() => onSelectAccount(ACCOUNTS_LIST[1])} // Default to guest or first for mock demo
                className="w-full flex items-center gap-3.5 p-4 text-left hover:bg-slate-50/70 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center border border-slate-200">
                  <User size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-slate-600">Use another account</p>
                </div>
              </button>
            </div>

            {/* Footer privacy text */}
            <p className="mt-6 text-[10px] leading-relaxed text-slate-400 font-medium text-center">
              To continue, Google will share your name, email address, language preference, and profile picture with NexPrep AI.
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default GoogleAccountsModal;
export type { GoogleAccount };

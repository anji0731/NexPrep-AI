import React from 'react';
import { AlertTriangle, WifiOff, Clock, Info } from 'lucide-react';
import type { FriendlyError } from '../services/errorHelper';

interface FriendlyErrorCardProps {
  error: FriendlyError;
  onAction: () => void;
}

const FriendlyErrorCard: React.FC<FriendlyErrorCardProps> = ({ error, onAction }) => {
  const icon = {
    busy: <AlertTriangle className="h-8 w-8 text-yellow-500" />,
    connection: <WifiOff className="h-8 w-8 text-sky-500" />,
    timeout: <Clock className="h-8 w-8 text-orange-500" />,
    unexpected: <Info className="h-8 w-8 text-emerald-500" />,
  }[error.scenario];

  return (
    <div className="bg-white border border-slate-200 rounded-[24px] shadow-minimal p-8 max-w-2xl mx-auto text-center">
      <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-slate-900 mb-2">{error.title}</h3>
      <p className="text-sm text-slate-500 leading-relaxed max-w-md mx-auto mb-6">{error.message}</p>
      <button aria-label="Action button"
        type="button"
        onClick={onAction}
        className="inline-flex items-center justify-center rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
      >
        {error.actionLabel}
      </button>
    </div>
  );
};

export default FriendlyErrorCard;

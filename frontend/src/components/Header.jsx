import React from 'react';
import { Sparkles, RefreshCw, Bot } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Header = ({ title, subtitle, onOpenCopilot, lastSync, isDemoMode = true }) => {
  const navigate = useNavigate();

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-20">
      <div>
        <h2 className="text-lg font-bold text-slate-900 tracking-tight leading-none">{title}</h2>
        {subtitle && (
          <p className="text-xs text-slate-500 mt-1 font-normal">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center space-x-3">
        {/* Sync Status Button */}
        <button
          onClick={() => navigate('/sync')}
          className="flex items-center text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          title="Open Sync Center"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
          <span>{isDemoMode ? 'Demo Store' : 'WooCommerce Store'}</span>
        </button>

        {/* Copilot Action Button */}
        <button
          onClick={onOpenCopilot}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Ask AI Copilot</span>
        </button>
      </div>
    </header>
  );
};

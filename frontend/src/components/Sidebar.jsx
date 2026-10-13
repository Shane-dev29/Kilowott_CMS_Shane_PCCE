import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  ShoppingBag, 
  CheckSquare, 
  RefreshCw, 
  Bot, 
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Zap
} from 'lucide-react';

export const Sidebar = ({ onOpenCopilot, isDemoMode = true }) => {
  const navItems = [
    { to: '/', label: 'Overview', icon: LayoutDashboard },
    { to: '/insights', label: 'Store Insights', icon: Zap },
    { to: '/customers', label: 'Customers', icon: Users },
    { to: '/orders', label: 'Orders', icon: ShoppingBag },
    { to: '/tasks', label: 'Follow-up Tasks', icon: CheckSquare },
    { to: '/sync', label: 'Sync Center', icon: RefreshCw },
    { to: '/copilot', label: 'AI Copilot View', icon: Bot },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0 shrink-0 z-30 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 tracking-tight leading-tight">Customer 360</h1>
            <p className="text-xs text-slate-500 font-medium">WooCommerce CRM</p>
          </div>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Core CRM
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              <Icon className="w-4 h-4 mr-3 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}

        <div className="pt-4 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Agentic Assistant
        </div>
        <button
          onClick={onOpenCopilot}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-xs hover:from-indigo-600 hover:to-purple-700 transition-all cursor-pointer"
        >
          <div className="flex items-center">
            <Sparkles className="w-4 h-4 mr-2.5 animate-pulse" />
            <span>Launch Copilot</span>
          </div>
          <span className="text-[10px] uppercase font-bold bg-white/20 px-1.5 py-0.5 rounded">AI</span>
        </button>
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/70">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-500">Data Source</span>
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
            isDemoMode 
              ? 'bg-amber-50 text-amber-700 border-amber-200' 
              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          }`}>
            {isDemoMode ? 'Demo Store' : 'Live Store'}
          </span>
        </div>
        <p className="text-[11px] text-slate-400 leading-tight">
          WooCommerce REST API v3 integrated with LangGraph agent workflow.
        </p>
      </div>
    </aside>
  );
};

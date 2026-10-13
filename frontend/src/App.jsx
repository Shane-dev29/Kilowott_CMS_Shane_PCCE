import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { CopilotDrawer } from './components/CopilotDrawer';
import { Dashboard } from './pages/Dashboard';
import { Customers } from './pages/Customers';
import { CustomerDetail } from './pages/CustomerDetail';
import { Orders } from './pages/Orders';
import { Tasks } from './pages/Tasks';
import { SyncCenter } from './pages/SyncCenter';
import { CopilotPage } from './pages/CopilotPage';
import { Sparkles } from 'lucide-react';

function AppLayout() {
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [customerContext, setCustomerContext] = useState(null);
  const location = useLocation();

  const handleOpenCopilot = () => {
    setIsCopilotOpen(true);
  };

  const handleOpenCopilotWithContext = (cust) => {
    setCustomerContext(cust);
    setIsCopilotOpen(true);
  };

  const getPageMeta = () => {
    const path = location.pathname;
    if (path === '/') return { title: 'Overview Dashboard', subtitle: 'Real-time WooCommerce sales analytics and customer engagement' };
    if (path.startsWith('/customers/')) return { title: 'Customer 360 Profile', subtitle: 'Comprehensive customer metrics, purchase history, and notes' };
    if (path === '/customers') return { title: 'Customer Directory', subtitle: 'Manage, search, segment, and export WooCommerce customers' };
    if (path === '/orders') return { title: 'Orders Directory', subtitle: 'Track purchases, line items, and fulfillment statuses' };
    if (path === '/tasks') return { title: 'Follow-up Task Queue', subtitle: 'Manage pending customer touchpoints and schedule follow-ups' };
    if (path === '/sync') return { title: 'Synchronization Center', subtitle: 'Monitor WooCommerce REST API v3 health and audit sync runs' };
    if (path === '/copilot') return { title: 'AI Copilot Studio', subtitle: 'LangGraph multi-step agent reasoning and automated actions' };
    return { title: 'Customer 360 CRM', subtitle: 'WooCommerce CRM Platform' };
  };

  const meta = getPageMeta();

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans">
      {/* Sidebar */}
      <Sidebar 
        onOpenCopilot={handleOpenCopilot} 
        isDemoMode={true} 
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header 
          title={meta.title}
          subtitle={meta.subtitle}
          onOpenCopilot={handleOpenCopilot}
          isDemoMode={true}
        />

        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Dashboard onOpenCopilot={handleOpenCopilot} />} />
            <Route path="/customers" element={<Customers onOpenCopilot={handleOpenCopilot} />} />
            <Route 
              path="/customers/:id" 
              element={<CustomerDetail onOpenCopilotWithContext={handleOpenCopilotWithContext} />} 
            />
            <Route path="/orders" element={<Orders />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/sync" element={<SyncCenter />} />
            <Route path="/copilot" element={<CopilotPage />} />
            <Route path="*" element={<Dashboard onOpenCopilot={handleOpenCopilot} />} />
          </Routes>
        </main>
      </div>

      {/* Floating AI Launcher Button (Visible in bottom right corner on all pages) */}
      <button
        onClick={handleOpenCopilot}
        className="fixed bottom-6 right-6 z-40 flex items-center space-x-2 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 cursor-pointer group"
        title="Open AI Copilot"
      >
        <Sparkles className="w-5 h-5 animate-pulse" />
        <span className="text-xs font-bold tracking-wide pr-1">Ask AI Copilot</span>
      </button>

      {/* Global AI Copilot Slide-Over Drawer */}
      <CopilotDrawer
        isOpen={isCopilotOpen}
        onClose={() => {
          setIsCopilotOpen(false);
          setCustomerContext(null);
        }}
        customerContext={customerContext}
      />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}

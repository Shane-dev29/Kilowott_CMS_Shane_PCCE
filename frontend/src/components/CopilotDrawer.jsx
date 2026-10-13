import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Send, 
  Sparkles, 
  Bot, 
  User, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ArrowRight,
  ShieldAlert,
  Loader2,
  Trash2,
  Check,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';
import { sendChatMessage, approveAction, getAiConfigStatus } from '../api/client';

export const CopilotDrawer = ({ isOpen, onClose, customerContext = null }) => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I am your AI Copilot for Customer 360. I can search customers, calculate AOV, analyze inactive accounts, and create follow-up tasks with your approval.\n\nHow can I help you today?',
      events: []
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [configStatus, setConfigStatus] = useState(null);
  const [showConfigHint, setShowConfigHint] = useState(true);
  const [expandedEvents, setExpandedEvents] = useState({});

  const messagesEndRef = useRef(null);

  useEffect(() => {
    getAiConfigStatus()
      .then(res => setConfigStatus(res))
      .catch(() => {});
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, pendingAction]);

  const handleSend = async (textToSend = null) => {
    const query = (textToSend || input).trim();
    if (!query || isLoading) return;

    const userMsg = { role: 'user', content: query };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const historyForApi = newMessages
        .slice(-6)
        .map(m => ({ role: m.role, content: m.content }));

      const res = await sendChatMessage(
        query,
        customerContext ? customerContext.id : null,
        historyForApi
      );

      const assistantMsg = {
        role: 'assistant',
        content: res.reply,
        events: res.events || [],
        llm_configured: res.llm_configured,
        provider: res.provider,
        model: res.model
      };

      setMessages(prev => [...prev, assistantMsg]);

      if (res.requires_approval && res.pending_action) {
        setPendingAction(res.pending_action);
      } else {
        setPendingAction(null);
      }
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ Failed to reach CRM backend: ${err.message}. Please verify the backend server is running on port 8000.`,
          events: []
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproval = async (approved) => {
    if (!pendingAction) return;

    setIsLoading(true);
    const actionToken = pendingAction.action_token;
    const payload = pendingAction.payload;

    try {
      const res = await approveAction(actionToken, approved, payload);
      
      const confirmMsg = {
        role: 'assistant',
        content: approved
          ? `✅ **Approval Confirmed:** ${res.message}`
          : `❌ **Action Rejected:** ${res.message}`,
        events: res.events || []
      };

      setMessages(prev => [...prev, confirmMsg]);
      setPendingAction(null);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ Error executing approved action: ${err.message}`,
          events: []
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleExpandEvents = (idx) => {
    setExpandedEvents(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const clearChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: 'Conversation history reset. How can I assist you with your WooCommerce CRM data?',
        events: []
      }
    ]);
    setPendingAction(null);
  };

  const suggestedPrompts = customerContext ? [
    `Summarize ${customerContext.full_name}'s purchase history`,
    `What is this customer's average order value?`,
    `Find inactive customers who have spent more than ₹5,000`,
    `Who are my top 10 customers by spending?`
  ] : [
    `Find customers who haven't purchased in 60 days but have spent more than ₹5,000. Create follow-up tasks for them.`,
    `Who are my top 10 customers by spending?`,
    `Which customers have placed multiple orders?`,
    `Why has revenue decreased compared with previous months?`
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <aside className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col z-10 border-l border-slate-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-slate-900">CRM AI Copilot</h3>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 uppercase">
                  LangGraph
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {customerContext ? `Context: ${customerContext.full_name}` : 'Global Store Context'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={clearChat}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-lg transition-colors"
              title="Clear chat"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-lg transition-colors"
              title="Close panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Config Status Banner */}
        {configStatus && !configStatus.llm_configured && showConfigHint && (
          <div className="bg-amber-50/90 border-b border-amber-200/70 p-3 text-xs text-amber-800 flex items-start justify-between">
            <div className="flex items-start space-x-2 pr-2">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Offline Structured Agent Mode:</span> Real CRM database tools and approvals are fully active. Set <code className="bg-amber-100 px-1 py-0.2 rounded font-mono text-[11px]">LLM_API_KEY</code> in <code className="bg-amber-100 px-1 py-0.2 rounded font-mono text-[11px]">backend/.env</code> for live OpenAI/Groq model reasoning.
              </div>
            </div>
            <button 
              onClick={() => setShowConfigHint(false)} 
              className="text-amber-500 hover:text-amber-700 text-xs font-bold shrink-0"
            >
              ✕
            </button>
          </div>
        )}

        {/* Messages Feed */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/40">
          {messages.map((m, idx) => (
            <div key={idx} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className="flex items-start max-w-[92%] space-x-2">
                {m.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-600 shrink-0 mt-1">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                )}
                
                <div className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-xs shadow-xs'
                    : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-xs shadow-xs'
                }`}>
                  <div className="whitespace-pre-line font-normal">
                    {m.content}
                  </div>

                  {/* Tool execution event badges */}
                  {m.events && m.events.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-slate-100">
                      <button
                        onClick={() => toggleExpandEvents(idx)}
                        className="flex items-center text-[11px] font-semibold text-slate-500 hover:text-slate-800"
                      >
                        <span className="mr-1">Agent Tool Activity ({m.events.length} step{m.events.length > 1 ? 's' : ''})</span>
                        {expandedEvents[idx] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>

                      {expandedEvents[idx] && (
                        <div className="mt-2 space-y-1.5 pl-1">
                          {m.events.map((ev, eIdx) => (
                            <div key={eIdx} className="flex items-center text-[11px] text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-200/70">
                              {ev.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mr-1.5 shrink-0" />}
                              {ev.status === 'calling' && <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin mr-1.5 shrink-0" />}
                              {ev.status === 'requires_approval' && <ShieldAlert className="w-3.5 h-3.5 text-amber-500 mr-1.5 shrink-0" />}
                              {ev.status === 'failed' && <AlertCircle className="w-3.5 h-3.5 text-rose-500 mr-1.5 shrink-0" />}
                              
                              <span className="font-mono text-[10px] text-indigo-700 font-semibold mr-1.5">
                                {ev.tool_name}:
                              </span>
                              <span className="truncate">{ev.message || ev.status}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {m.role === 'user' && (
                  <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 shrink-0 mt-1">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Pending Approval Card */}
          {pendingAction && (
            <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 shadow-sm animate-fade-in">
              <div className="flex items-center space-x-2 text-amber-900 font-bold text-xs mb-2">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <span>Action Approval Required</span>
              </div>
              
              <p className="text-xs text-amber-800 mb-3 font-medium">
                {pendingAction.description}
              </p>

              {/* Task list preview */}
              {pendingAction.payload?.tasks && (
                <div className="bg-white/80 rounded-lg p-2.5 mb-3 border border-amber-200 space-y-1.5 max-h-40 overflow-y-auto">
                  {pendingAction.payload.tasks.map((t, idx) => (
                    <div key={idx} className="text-[11px] text-slate-700 flex items-start justify-between border-b border-slate-100 pb-1 last:border-none">
                      <div>
                        <span className="font-semibold text-slate-900">{t.customer_name || `Customer #${t.customer_id}`}:</span> {t.title}
                      </div>
                      <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-rose-100 text-rose-700 ml-2 shrink-0">
                        {t.priority}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleApproval(true)}
                  disabled={isLoading}
                  className="flex-1 flex items-center justify-center space-x-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Approve & Execute</span>
                </button>
                <button
                  onClick={() => handleApproval(false)}
                  disabled={isLoading}
                  className="py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  Reject
                </button>
              </div>
            </div>
          )}

          {/* Loading Indicator */}
          {isLoading && !pendingAction && (
            <div className="flex items-center space-x-2 text-xs text-slate-500 bg-white p-3 rounded-xl border border-slate-200 shadow-xs max-w-xs">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
              <span>Agent is retrieving data & reasoning...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompts */}
        <div className="p-3 border-t border-slate-100 bg-white">
          <div className="text-[11px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
            Suggested Prompts:
          </div>
          <div className="flex flex-wrap gap-1.5">
            {suggestedPrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(p)}
                disabled={isLoading}
                className="text-left text-[11px] bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 text-slate-600 border border-slate-200 px-2.5 py-1 rounded-full transition-all cursor-pointer"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-slate-200 bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center space-x-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={customerContext ? `Ask about ${customerContext.full_name}...` : 'Ask anything about CRM data or execute tasks...'}
              disabled={isLoading}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-xs"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </aside>
    </div>
  );
};

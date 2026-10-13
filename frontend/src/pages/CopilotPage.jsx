import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Sparkles, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ShieldAlert, 
  Check, 
  Loader2, 
  Trash2, 
  User, 
  HelpCircle,
  Database,
  ArrowRight,
  Info
} from 'lucide-react';
import { sendChatMessage, approveAction, getAiConfigStatus } from '../api/client';

export const CopilotPage = () => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Welcome to the AI Copilot for Customer 360!\n\nI am connected directly to your CRM database via LangGraph tool orchestration. I can:\n• Identify inactive or high-value accounts with real criteria\n• Calculate AOV and sales breakdowns\n• Propose and execute follow-up tasks with your explicit approval\n\nTry one of the example prompts below or ask any question.',
      events: []
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [configStatus, setConfigStatus] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    getAiConfigStatus().then(res => setConfigStatus(res)).catch(() => {});
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

      const res = await sendChatMessage(query, null, historyForApi);

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
          content: `⚠️ Failed to execute agent request: ${err.message}`,
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

  const clearChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: 'Conversation history reset. How can I help you analyze your CRM data?',
        events: []
      }
    ]);
    setPendingAction(null);
  };

  const examplePrompts = [
    "Find customers who haven't purchased in 60 days but have spent more than ₹5,000. Create follow-up tasks for them.",
    "Who are my top 10 customers by spending?",
    "Which customers have placed multiple orders?",
    "Why has revenue decreased compared with the previous month?",
    "Find inactive customers who have spent more than ₹5,000.",
    "Show me the customers with the highest average order value."
  ];

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto flex flex-col h-[calc(100vh-4rem)]">
      {/* Top Bar */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-xs">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Agentic AI Copilot</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 uppercase tracking-wide">
                LangGraph Multi-Step
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Tool-calling agent with human-in-the-loop task approval and real CRM execution.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="text-right text-xs">
            <span className="text-slate-400">Agent Mode: </span>
            <span className="font-semibold text-slate-800">
              {configStatus?.llm_configured ? `${configStatus.provider} (${configStatus.model})` : 'Offline Structured Agent (Real Tools)'}
            </span>
          </div>
          <button
            onClick={clearChat}
            className="p-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-lg text-xs"
            title="Clear Chat"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main chat layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-0">
        {/* Left column: Example prompts & capabilities */}
        <div className="hidden lg:flex flex-col bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-4 overflow-y-auto">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Demonstration Prompts
            </h4>
            <p className="text-xs text-slate-500 mb-3">
              Click any prompt to trigger multi-step reasoning and tool execution:
            </p>
          </div>

          <div className="space-y-2">
            {examplePrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(p)}
                disabled={isLoading}
                className="w-full text-left p-3 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 text-xs text-slate-700 transition-all cursor-pointer group"
              >
                <span className="group-hover:text-indigo-900 font-medium leading-relaxed block">{p}</span>
              </button>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 mt-auto text-[11px] text-slate-400 space-y-1">
            <p className="font-semibold text-slate-600">LangGraph Safety Guarantee:</p>
            <p>Sensitive bulk actions require explicit confirmation before database commits.</p>
          </div>
        </div>

        {/* Right column: Chat stream & input */}
        <div className="lg:col-span-3 flex flex-col bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden min-h-0">
          {/* Messages */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/40">
            {messages.map((m, idx) => (
              <div key={idx} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className="flex items-start max-w-[90%] space-x-3">
                  {m.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                      <Sparkles className="w-4 h-4" />
                    </div>
                  )}

                  <div className={`p-4 rounded-2xl text-xs leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-xs shadow-xs'
                      : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-xs shadow-xs'
                  }`}>
                    <div className="whitespace-pre-line font-normal text-xs leading-relaxed">
                      {m.content}
                    </div>

                    {/* Tool events */}
                    {m.events && m.events.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                          Tool Execution Activity:
                        </span>
                        {m.events.map((ev, eIdx) => (
                          <div key={eIdx} className="flex items-center space-x-2 text-[11px] text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-md border border-slate-200">
                            {ev.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                            {ev.status === 'calling' && <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin shrink-0" />}
                            {ev.status === 'requires_approval' && <ShieldAlert className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                            {ev.status === 'failed' && <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />}
                            
                            <span className="font-mono text-indigo-700 font-bold text-[10px]">
                              {ev.tool_name}:
                            </span>
                            <span className="truncate">{ev.message || ev.status}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {m.role === 'user' && (
                    <div className="w-8 h-8 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Pending Action Card */}
            {pendingAction && (
              <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-5 shadow-sm max-w-xl mx-auto my-2">
                <div className="flex items-center space-x-2 text-amber-900 font-bold text-xs mb-2">
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  <span>Action Approval Required Before Execution</span>
                </div>
                
                <p className="text-xs text-amber-800 mb-3 font-medium">
                  {pendingAction.description}
                </p>

                {pendingAction.payload?.tasks && (
                  <div className="bg-white/90 rounded-lg p-3 mb-3 border border-amber-200 space-y-2 max-h-48 overflow-y-auto">
                    {pendingAction.payload.tasks.map((t, idx) => (
                      <div key={idx} className="text-xs text-slate-800 flex items-start justify-between border-b border-slate-100 pb-1.5 last:border-none">
                        <div>
                          <span className="font-bold">{t.customer_name || `Customer #${t.customer_id}`}:</span> {t.title}
                        </div>
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 ml-2 shrink-0">
                          {t.priority}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleApproval(true)}
                    disabled={isLoading}
                    className="flex-1 flex items-center justify-center space-x-1.5 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve & Create Follow-up Tasks</span>
                  </button>
                  <button
                    onClick={() => handleApproval(false)}
                    disabled={isLoading}
                    className="py-2 px-4 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Reject
                  </button>
                </div>
              </div>
            )}

            {isLoading && !pendingAction && (
              <div className="flex items-center space-x-2 text-xs text-slate-500 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs max-w-xs">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                <span>Agent is retrieving data & reasoning...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Chat input */}
          <div className="p-4 border-t border-slate-200 bg-white shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center space-x-3"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about high-value accounts, sales trends, or execute CRM actions..."
                disabled={isLoading}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 text-xs font-semibold flex items-center space-x-1.5 shadow-xs cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

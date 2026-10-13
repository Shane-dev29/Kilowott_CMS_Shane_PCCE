import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  ShieldAlert, 
  AlertTriangle, 
  HeartPulse, 
  IndianRupee, 
  RefreshCw, 
  Send, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  Award, 
  Users, 
  CreditCard,
  ChevronRight,
  Zap,
  Check
} from 'lucide-react';
import { getStoreInsights, refreshStoreInsights, createTask } from '../api/client';
import { RFMSegmentBadge, ChurnRiskBadge, HealthScoreBadge, OrderStatusBadge } from '../components/StatusBadge';

export const Insights = ({ onOpenCopilot, onOpenCopilotWithContext }) => {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [executedActions, setExecutedActions] = useState(new Set());
  const [actionNotice, setActionNotice] = useState(null);

  const fetchInsights = (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
      refreshStoreInsights()
        .then(res => setInsights(res))
        .catch(err => console.error(err))
        .finally(() => setRefreshing(false));
    } else {
      setLoading(true);
      getStoreInsights()
        .then(res => setInsights(res))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  const handleExecuteAction = async (action) => {
    if (action.type === 'payment_recovery' && action.customer_id) {
      try {
        await createTask({
          customer_id: action.customer_id,
          title: `Urgent Recovery: ${action.order_number} (${action.customer_name})`,
          description: action.recommended_action,
          priority: 'urgent',
          created_by: 'AI Executive Insights'
        });
        setExecutedActions(prev => new Set(prev).add(action.id));
        setActionNotice(`✅ Priority payment recovery task assigned for ${action.customer_name}`);
        setTimeout(() => setActionNotice(null), 4000);
      } catch (err) {
        alert(`Failed to assign task: ${err.message}`);
      }
    } else if (action.type === 'vip_winback') {
      if (onOpenCopilotWithContext) {
        onOpenCopilotWithContext({ id: action.customer_id, full_name: action.customer_name });
      } else if (onOpenCopilot) {
        onOpenCopilot();
      }
      setExecutedActions(prev => new Set(prev).add(action.id));
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-3">
          <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-sm font-semibold text-slate-700">Synthesizing AI Store Intelligence & Churn Telemetry...</p>
          <p className="text-xs text-slate-400">Auditing RFM patterns, stalled payments, and retention opportunities</p>
        </div>
      </div>
    );
  }

  if (!insights) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-slate-500">Failed to load store insights.</p>
        <button onClick={() => fetchInsights()} className="mt-3 text-xs text-indigo-600 underline font-semibold">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700 border border-indigo-200">
              Executive Telemetry
            </span>
            <span className="text-xs text-slate-400">Updated {insights.generated_at}</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-1">AI Store Insights & Churn Radar</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Holistic intelligence on revenue at risk, churn vulnerabilities, and prioritized revenue recovery interventions.
          </p>
        </div>

        <button
          onClick={() => fetchInsights(true)}
          disabled={refreshing}
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-all cursor-pointer disabled:opacity-50 shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? 'Synthesizing...' : 'Generate Fresh Intelligence'}</span>
        </button>
      </div>

      {/* Action Notification Toast */}
      {actionNotice && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between shadow-xs">
          <span>{actionNotice}</span>
          <button onClick={() => setActionNotice(null)} className="text-emerald-500 hover:text-emerald-700">×</button>
        </div>
      )}

      {/* Executive KPI Scoreboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Revenue at Risk</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-bold text-rose-600">
              ₹{insights.revenue_at_risk.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">
              Stalled checkouts + High-risk accounts
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Recovery Opportunity</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-bold text-emerald-600">
              ₹{insights.recovery_opportunity_value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">
              {insights.stalled_orders?.length || 0} recoverable checkout dropouts
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Churn Danger Accounts</span>
            <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-bold text-slate-900">
              {insights.churn_danger_count} Customers
            </h3>
            <p className="text-[11px] text-orange-600 font-medium mt-1">
              ₹{insights.churn_danger_value?.toLocaleString('en-IN', { minimumFractionDigits: 2 })} historical volume
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Storewide Customer Health</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <HeartPulse className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-bold text-slate-900">
              {insights.average_health_score}/100
            </h3>
            <p className="text-[11px] text-indigo-600 font-medium mt-1">
              Weighted engagement & repeat rate
            </p>
          </div>
        </div>
      </div>

      {/* AI Executive Brief Card */}
      <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex items-center space-x-2 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-2">
          <Sparkles className="w-4 h-4 animate-pulse text-indigo-400" />
          <span>AI Executive Strategic Brief</span>
        </div>

        <p className="text-sm md:text-base text-slate-100 font-normal leading-relaxed max-w-4xl">
          {insights.executive_summary}
        </p>

        <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs text-indigo-200">
          <div className="flex items-center space-x-4">
            <span>• Direct Recovery Pipeline: ₹{insights.recovery_opportunity_value.toLocaleString('en-IN')}</span>
            <span>• At-Risk Relationship Equity: ₹{insights.churn_danger_value.toLocaleString('en-IN')}</span>
          </div>

          <button
            onClick={onOpenCopilot}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white text-xs font-semibold transition-all cursor-pointer"
          >
            <span>Consult Copilot on Strategy</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Priority Action Center */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Priority Operational Actions</h3>
            <p className="text-xs text-slate-500">Immediate high-ROI interventions recommended by the store intelligence engine.</p>
          </div>
          <span className="text-xs font-semibold text-slate-400">
            {insights.priority_actions?.length || 0} Actions Available
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.priority_actions?.map((act) => {
            const isDone = executedActions.has(act.id);
            const isCritical = act.urgency === 'critical' || act.urgency === 'urgent';

            return (
              <div 
                key={act.id} 
                className={`bg-white rounded-xl border p-4 shadow-xs flex flex-col justify-between space-y-3 transition-all ${
                  isCritical ? 'border-rose-200/80 hover:border-rose-300' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      isCritical ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {act.urgency} Priority
                    </span>
                    <span className="text-xs font-bold text-slate-900">{act.impact}</span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 mt-2">{act.title}</h4>
                  <p className="text-xs text-slate-600 mt-1 leading-normal">{act.recommended_action}</p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  {act.customer_id ? (
                    <Link
                      to={`/customers/${act.customer_id}`}
                      className="text-xs font-semibold text-indigo-600 hover:underline flex items-center"
                    >
                      <span>Customer 360</span>
                      <ChevronRight className="w-3 h-3 ml-0.5" />
                    </Link>
                  ) : (
                    <span className="text-xs text-slate-400">Guest Checkout</span>
                  )}

                  <button
                    onClick={() => handleExecuteAction(act)}
                    disabled={isDone}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      isDone
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : act.type === 'payment_recovery'
                        ? 'bg-rose-600 hover:bg-rose-700 text-white'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    }`}
                  >
                    {isDone ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Action Assigned</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{act.type === 'payment_recovery' ? 'Assign Recovery Task' : 'Launch AI Win-Back'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Distribution Analytics Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* RFM Segments Distribution */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-900">RFM Segment Breakdown</h4>
              <p className="text-xs text-slate-500">Distribution across active store accounts</p>
            </div>
            <Award className="w-5 h-5 text-indigo-500" />
          </div>

          <div className="space-y-2.5">
            {Object.entries(insights.segments_distribution || {}).map(([seg, count]) => (
              <div key={seg} className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                <RFMSegmentBadge segment={seg} />
                <span className="text-xs font-bold text-slate-800">{count} Customers</span>
              </div>
            ))}
          </div>
        </div>

        {/* Churn Risk Distribution */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-900">Churn Risk Cadence</h4>
              <p className="text-xs text-slate-500">Inactivity against average purchase cycles</p>
            </div>
            <ShieldAlert className="w-5 h-5 text-rose-500" />
          </div>

          <div className="space-y-2.5">
            {Object.entries(insights.churn_risk_distribution || {}).map(([risk, count]) => (
              <div key={risk} className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                <ChurnRiskBadge risk={risk} />
                <span className="text-xs font-bold text-slate-800">{count} Customers</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

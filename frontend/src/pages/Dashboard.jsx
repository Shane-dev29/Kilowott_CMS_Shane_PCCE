import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  ShoppingBag, 
  IndianRupee, 
  TrendingUp, 
  Repeat, 
  CheckSquare, 
  RefreshCw, 
  Sparkles,
  ArrowRight,
  Clock,
  AlertCircle
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { getDashboardSummary } from '../api/client';
import { MetricCard } from '../components/MetricCard';
import { OrderStatusBadge } from '../components/StatusBadge';

const STATUS_COLORS = {
  completed: '#10b981',
  processing: '#3b82f6',
  pending: '#f59e0b',
  'on-hold': '#eab308',
  cancelled: '#f43f5e',
  failed: '#ef4444',
  refunded: '#8b5cf6'
};

export const Dashboard = ({ onOpenCopilot }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = () => {
    setLoading(true);
    getDashboardSummary()
      .then(res => {
        setData(res);
        setError(null);
      })
      .catch(err => {
        setError(err.message || 'Failed to load dashboard data');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-3">
          <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-sm font-medium text-slate-600">Calculating real-time CRM analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-5 text-rose-800 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold">Failed to load CRM data</h4>
            <p className="text-xs text-rose-700 mt-1">{error}</p>
            <button
              onClick={fetchDashboard}
              className="mt-3 px-3 py-1.5 bg-rose-600 text-white text-xs font-semibold rounded-lg hover:bg-rose-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const pieData = Object.entries(data.status_distribution || {}).map(([status, count]) => ({
    name: status.charAt(0).toUpperCase() + status.slice(1),
    value: count,
    color: STATUS_COLORS[status.toLowerCase()] || '#94a3b8'
  }));

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Sync Status Banner */}
      <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 uppercase tracking-wider">
              {data.is_demo_mode ? 'Demo Store Mode' : 'Live Store Connected'}
            </span>
            <span className="text-xs text-slate-400">
              Last synced: {data.last_sync ? new Date(data.last_sync).toLocaleString() : 'Just now'}
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white mt-1.5">
            Store Performance & Customer Intelligence
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            {data.is_demo_mode
              ? 'Displaying realistic seeded WooCommerce customer and order data. Ready for AI exploration, segmentation, and automated task workflows.'
              : 'Directly synchronized with your live WooCommerce store instance.'}
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <Link
            to="/sync"
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-lg border border-white/20 transition-all flex items-center space-x-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync Center</span>
          </Link>
          <button
            onClick={onOpenCopilot}
            className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center space-x-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ask Copilot</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <MetricCard
          title="Total Customers"
          value={data.total_customers}
          subtitle="Registered accounts"
          icon={Users}
          color="indigo"
        />
        <MetricCard
          title="Total Orders"
          value={data.total_orders}
          subtitle="All statuses"
          icon={ShoppingBag}
          color="blue"
        />
        <MetricCard
          title="Valid Revenue"
          value={`₹${data.total_revenue.toLocaleString('en-IN')}`}
          subtitle="Excl. cancelled/failed"
          icon={IndianRupee}
          color="emerald"
        />
        <MetricCard
          title="Average Order (AOV)"
          value={`₹${data.average_order_value.toLocaleString('en-IN')}`}
          subtitle="Per completed order"
          icon={TrendingUp}
          color="purple"
        />
        <MetricCard
          title="Returning Rate"
          value={`${data.returning_customer_rate}%`}
          subtitle=">= 2 valid purchases"
          icon={Repeat}
          color="amber"
        />
        <MetricCard
          title="Pending Tasks"
          value={data.pending_tasks_count}
          subtitle="Follow-ups queued"
          icon={CheckSquare}
          color="rose"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trends */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Revenue Trends Over Time</h3>
              <p className="text-xs text-slate-500">Monthly gross sales from valid purchases</p>
            </div>
            <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
              Past 6 Months
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.revenue_trends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis 
                  tick={{ fontSize: 11, fill: '#64748b' }} 
                  axisLine={false} 
                  tickLine={false}
                  tickFormatter={(val) => `₹${val >= 1000 ? (val/1000).toFixed(0) + 'k' : val}`}
                />
                <Tooltip 
                  formatter={(val) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Revenue']}
                  labelStyle={{ fontWeight: 600, color: '#0f172a' }}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Order Status Breakdown */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs flex flex-col">
          <div className="mb-2">
            <h3 className="text-sm font-bold text-slate-900">Order Status Distribution</h3>
            <p className="text-xs text-slate-500">Distribution across fulfillment states</p>
          </div>

          <div className="h-64 w-full flex-1 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(val, name) => [`${val} orders`, name]}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  iconSize={8}
                  formatter={(val) => <span className="text-xs text-slate-600 font-medium">{val}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Two-Column Section: Recent Orders & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders Table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Recent Store Orders</h3>
              <p className="text-xs text-slate-500">Latest orders placed on WooCommerce</p>
            </div>
            <Link
              to="/orders"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1"
            >
              <span>View all orders</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3">Order</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Total (INR)</th>
                  <th className="px-5 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.recent_orders?.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-indigo-600">
                      {ord.order_number}
                    </td>
                    <td className="px-5 py-3.5 text-slate-900 font-medium">
                      {ord.customer_id ? (
                        <Link to={`/customers/${ord.customer_id}`} className="hover:underline text-slate-900 font-semibold">
                          {ord.customer_name}
                        </Link>
                      ) : (
                        <span className="text-slate-500">{ord.guest_name || 'Guest'}</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <OrderStatusBadge status={ord.status} />
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-slate-900">
                      ₹{ord.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">
                      {new Date(ord.date_created).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activity Timeline Feed */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Recent Activity Feed</h3>
              <p className="text-xs text-slate-500">Orders, notes, and task events</p>
            </div>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>

          <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
            {data.recent_activity?.map((act) => (
              <div key={act.id} className="flex items-start space-x-3 text-xs">
                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                  act.type === 'order' ? 'bg-indigo-500 ring-4 ring-indigo-50' :
                  act.type === 'note' ? 'bg-amber-500 ring-4 ring-amber-50' :
                  'bg-emerald-500 ring-4 ring-emerald-50'
                }`} />
                <div className="flex-1">
                  <p className="font-semibold text-slate-800">{act.title}</p>
                  <p className="text-slate-500 text-[11px] mt-0.5 leading-snug">{act.description}</p>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    {new Date(act.timestamp).toLocaleDateString()} • {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

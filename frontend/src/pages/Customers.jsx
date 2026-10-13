import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Download, 
  ArrowUpDown, 
  Filter, 
  Sparkles, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  ExternalLink,
  RefreshCw,
  Tag,
  ShieldAlert,
  HeartPulse,
  Award,
  AlertTriangle
} from 'lucide-react';
import { getCustomers, getCustomerExportUrl, getRfmSummary } from '../api/client';
import { SegmentBadge, RFMSegmentBadge, ChurnRiskBadge, HealthScoreBadge } from '../components/StatusBadge';

const RFM_SEGMENTS = ['All', 'Champions', 'Loyal Customers', 'Potential Loyalists', 'At Risk', 'Hibernating', 'New Leads'];
const LIFECYCLE_SEGMENTS = ['All', 'High-Value', 'Inactive', 'Returning', 'New', 'Lead'];

export const Customers = ({ onOpenCopilot }) => {
  const [customers, setCustomers] = useState([]);
  const [rfmSummary, setRfmSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedRfmSegment, setSelectedRfmSegment] = useState('All');
  const [selectedLifecycle, setSelectedLifecycle] = useState('All');
  const [sortBy, setSortBy] = useState('total_spent');
  const [sortOrder, setSortOrder] = useState('desc');

  const fetchRfmSummary = () => {
    getRfmSummary()
      .then(res => setRfmSummary(res))
      .catch(err => console.error('Error loading RFM summary:', err));
  };

  const fetchCustomers = () => {
    setLoading(true);
    getCustomers({
      search: search || undefined,
      segment: selectedLifecycle !== 'All' ? selectedLifecycle : undefined,
      rfm_segment: selectedRfmSegment !== 'All' ? selectedRfmSegment : undefined,
      sort_by: sortBy,
      sort_order: sortOrder
    })
      .then(res => setCustomers(res))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRfmSummary();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers();
    }, 200);
    return () => clearTimeout(timer);
  }, [search, selectedRfmSegment, selectedLifecycle, sortBy, sortOrder]);

  const handleExportCSV = () => {
    const url = getCustomerExportUrl({
      search: search || undefined,
      segment: selectedLifecycle !== 'All' ? selectedLifecycle : undefined,
      rfm_segment: selectedRfmSegment !== 'All' ? selectedRfmSegment : undefined,
      sort_by: sortBy,
      sort_order: sortOrder
    });
    window.open(url, '_blank');
  };

  const handleSortToggle = (field) => {
    if (sortBy === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Customer Management & RFM Intelligence</h2>
          <p className="text-xs text-slate-500 mt-1">
            Recency, Frequency & Monetary segmentation, automated churn risk monitoring, and health metrics.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={onOpenCopilot}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ask Copilot about Customers</span>
          </button>
        </div>
      </div>

      {/* RFM Intelligence Scoreboard Cards */}
      {rfmSummary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Average Customer Health</p>
              <h3 className="text-xl font-bold text-slate-900 mt-0.5">{rfmSummary.average_health_score}/100</h3>
              <p className="text-[11px] text-emerald-600 font-medium mt-0.5 flex items-center">
                <span>Weighted recency & cadence</span>
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
              <HeartPulse className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Revenue at Risk</p>
              <h3 className="text-xl font-bold text-rose-600 mt-0.5">₹{rfmSummary.revenue_at_risk.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h3>
              <p className="text-[11px] text-rose-500 font-medium mt-0.5">
                Critical & High churn danger
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Champions & Loyal</p>
              <h3 className="text-xl font-bold text-slate-900 mt-0.5">
                {(rfmSummary.segments_distribution?.['Champions'] || 0) + (rfmSummary.segments_distribution?.['Loyal Customers'] || 0)} Accounts
              </h3>
              <p className="text-[11px] text-indigo-600 font-medium mt-0.5">
                Top spenders with high recency
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
              <Award className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">At-Risk & Hibernating</p>
              <h3 className="text-xl font-bold text-amber-600 mt-0.5">
                {(rfmSummary.segments_distribution?.['At Risk'] || 0) + (rfmSummary.segments_distribution?.['Hibernating'] || 0)} Accounts
              </h3>
              <p className="text-[11px] text-amber-600 font-medium mt-0.5">
                Require win-back re-engagement
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs space-y-3.5">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, phone, city..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
            <span className="text-xs text-slate-500 font-medium shrink-0">Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="total_spent">Total Spent</option>
              <option value="health_score">Customer Health Score</option>
              <option value="orders_count">Order Count</option>
              <option value="recency_days">Purchase Recency</option>
              <option value="name">Name</option>
              <option value="last_order_date">Last Purchase Date</option>
            </select>
            <button
              onClick={() => setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))}
              className="p-1.5 border border-slate-200 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs cursor-pointer"
              title={`Order: ${sortOrder.toUpperCase()}`}
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* RFM Segment Filter Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pt-1 pb-0.5">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-1 text-[10px] shrink-0">
            RFM Segment:
          </span>
          {RFM_SEGMENTS.map((seg) => (
            <button
              key={seg}
              onClick={() => setSelectedRfmSegment(seg)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer shrink-0 ${
                selectedRfmSegment === seg
                  ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
              }`}
            >
              {seg}
            </button>
          ))}
        </div>

        {/* Lifecycle Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pt-0.5 text-[11px] border-t border-slate-100 pt-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-1 text-[10px] shrink-0">
            Lifecycle:
          </span>
          {LIFECYCLE_SEGMENTS.map((seg) => (
            <button
              key={seg}
              onClick={() => setSelectedLifecycle(seg)}
              className={`px-2.5 py-0.5 rounded-md text-[11px] font-medium transition-all cursor-pointer shrink-0 ${
                selectedLifecycle === seg
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
              }`}
            >
              {seg}
            </button>
          ))}
        </div>
      </div>

      {/* Customer Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Customer</th>
                <th className="px-5 py-3.5">Contact & Location</th>
                <th className="px-5 py-3.5">RFM Segment</th>
                <th 
                  className="px-5 py-3.5 cursor-pointer hover:text-slate-800"
                  onClick={() => handleSortToggle('health_score')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Health Score</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="px-5 py-3.5">Churn Risk</th>
                <th 
                  className="px-5 py-3.5 cursor-pointer hover:text-slate-800"
                  onClick={() => handleSortToggle('orders_count')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Orders</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th 
                  className="px-5 py-3.5 cursor-pointer hover:text-slate-800"
                  onClick={() => handleSortToggle('total_spent')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Total Spent</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th 
                  className="px-5 py-3.5 cursor-pointer hover:text-slate-800"
                  onClick={() => handleSortToggle('last_order_date')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Last Purchase</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="9" className="px-5 py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                    <span>Loading customer profiles & RFM scores...</span>
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-5 py-12 text-center text-slate-500">
                    <p className="font-semibold text-sm">No customers match your criteria</p>
                    <p className="text-xs text-slate-400 mt-1">Try resetting search or segment filter.</p>
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Customer Name & Tags */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center shrink-0 border border-indigo-100 text-xs">
                          {c.first_name ? c.first_name[0] : 'C'}
                        </div>
                        <div>
                          <Link 
                            to={`/customers/${c.id}`}
                            className="font-bold text-slate-900 hover:text-indigo-600 transition-colors block text-xs"
                          >
                            {c.full_name}
                          </Link>
                          {c.custom_tags && (
                            <span className="text-[10px] text-slate-400 flex items-center mt-0.5">
                              <Tag className="w-2.5 h-2.5 mr-1" />
                              {c.custom_tags}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Contact & Location */}
                    <td className="px-5 py-3.5 text-slate-600">
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-1.5 text-slate-700">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span>{c.email}</span>
                        </div>
                        {c.phone && (
                          <div className="flex items-center space-x-1.5 text-slate-500 text-[11px]">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{c.phone}</span>
                          </div>
                        )}
                        {c.city && (
                          <div className="flex items-center space-x-1.5 text-slate-400 text-[10px]">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span>{c.city}, {c.state || c.country}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* RFM Segment Badge */}
                    <td className="px-5 py-3.5">
                      <RFMSegmentBadge segment={c.rfm_segment || 'New Leads'} />
                    </td>

                    {/* Health Score */}
                    <td className="px-5 py-3.5">
                      <HealthScoreBadge score={c.health_score} />
                    </td>

                    {/* Churn Risk Badge */}
                    <td className="px-5 py-3.5">
                      <ChurnRiskBadge risk={c.churn_risk} />
                    </td>

                    {/* Orders count */}
                    <td className="px-5 py-3.5 font-semibold text-slate-800">
                      {c.orders_count}
                    </td>

                    {/* Total spent */}
                    <td className="px-5 py-3.5 font-bold text-slate-900">
                      ₹{c.total_spent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>

                    {/* Last purchase date */}
                    <td className="px-5 py-3.5 text-slate-600">
                      {c.last_order_date ? (
                        <div>
                          <span className="font-medium text-slate-800">
                            {new Date(c.last_order_date).toLocaleDateString()}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            {c.recency_days !== null && c.recency_days !== undefined ? `${c.recency_days}d ago` : ''}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">No purchases</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        to={`/customers/${c.id}`}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-md transition-colors"
                      >
                        <span>Customer 360</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Showing {customers.length} customer records</span>
          <span className="text-[11px] text-slate-400">RFM segments and health scores calculated from order recency & volume</span>
        </div>
      </div>
    </div>
  );
};

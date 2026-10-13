import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  MapPin, 
  ShoppingBag, 
  IndianRupee, 
  TrendingUp, 
  Calendar, 
  Sparkles, 
  CheckSquare, 
  FileText, 
  Plus, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Tag,
  UserCheck
} from 'lucide-react';
import { getCustomerDetail, createCustomerNote, createTask, updateTask } from '../api/client';
import { SegmentBadge, OrderStatusBadge, PriorityBadge } from '../components/StatusBadge';
import { MetricCard } from '../components/MetricCard';

export const CustomerDetail = ({ onOpenCopilotWithContext }) => {
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('timeline'); // timeline, orders, notes, tasks

  // Form states
  const [newNote, setNewNote] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('medium');
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);

  const fetchCustomer = () => {
    setLoading(true);
    getCustomerDetail(id)
      .then(res => {
        setCustomer(res);
        setError(null);
      })
      .catch(err => {
        setError(err.message || 'Customer not found');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCustomer();
  }, [id]);

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim() || isSubmittingNote) return;

    setIsSubmittingNote(true);
    try {
      await createCustomerNote(id, { content: newNote, created_by: 'CRM Agent' });
      setNewNote('');
      fetchCustomer();
    } catch (err) {
      alert(`Failed to add note: ${err.message}`);
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || isSubmittingTask) return;

    setIsSubmittingTask(true);
    try {
      await createTask({
        customer_id: Number(id),
        title: newTaskTitle,
        description: newTaskDesc,
        priority: newTaskPriority,
        created_by: 'CRM Agent'
      });
      setNewTaskTitle('');
      setNewTaskDesc('');
      fetchCustomer();
    } catch (err) {
      alert(`Failed to create task: ${err.message}`);
    } finally {
      setIsSubmittingTask(false);
    }
  };

  const handleToggleTaskStatus = async (taskId, currentStatus) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    try {
      await updateTask(taskId, { status: newStatus });
      fetchCustomer();
    } catch (err) {
      alert(`Failed to update task: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-3">
          <Clock className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-sm font-medium text-slate-600">Building Customer 360 profile...</p>
        </div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="p-8">
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-5 text-rose-800">
          <h4 className="text-sm font-bold">Error loading customer</h4>
          <p className="text-xs text-rose-700 mt-1">{error}</p>
          <Link to="/customers" className="mt-3 inline-block text-xs font-semibold underline">
            Return to Customers List
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Back button & Breadcrumb */}
      <div className="flex items-center space-x-2 text-xs text-slate-500">
        <Link to="/customers" className="hover:text-indigo-600 flex items-center space-x-1 font-medium">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Customers</span>
        </Link>
        <span>/</span>
        <span className="font-semibold text-slate-900">{customer.full_name}</span>
      </div>

      {/* Profile Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-start space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white font-bold text-xl flex items-center justify-center shadow-xs shrink-0">
            {customer.first_name ? customer.first_name[0] : 'C'}
          </div>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">{customer.full_name}</h1>
              <SegmentBadge segment={customer.segment} />
              {customer.is_demo && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                  Demo
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-2">
              <div className="flex items-center space-x-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{customer.email}</span>
              </div>
              {customer.phone && (
                <div className="flex items-center space-x-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{customer.phone}</span>
                </div>
              )}
              {customer.city && (
                <div className="flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{customer.address_line1 ? `${customer.address_line1}, ` : ''}{customer.city}, {customer.state || customer.country}</span>
                </div>
              )}
            </div>

            {customer.custom_tags && (
              <div className="flex items-center space-x-1.5 mt-2.5">
                <Tag className="w-3 h-3 text-slate-400" />
                <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                  {customer.custom_tags}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={() => onOpenCopilotWithContext(customer)}
            className="flex items-center space-x-1.5 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ask Copilot about {customer.first_name}</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          title="Total Lifetime Spent"
          value={`₹${customer.total_spent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          subtitle="Valid completed purchases"
          icon={IndianRupee}
          color="emerald"
        />
        <MetricCard
          title="Orders Count"
          value={customer.orders_count}
          subtitle="Order frequency"
          icon={ShoppingBag}
          color="indigo"
        />
        <MetricCard
          title="Average Order Value"
          value={`₹${customer.average_order_value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          subtitle="AOV benchmark"
          icon={TrendingUp}
          color="purple"
        />
        <MetricCard
          title="First Purchase"
          value={customer.first_order_date ? new Date(customer.first_order_date).toLocaleDateString() : 'N/A'}
          subtitle="Acquisition date"
          icon={Calendar}
          color="blue"
        />
        <MetricCard
          title="Latest Purchase"
          value={customer.last_order_date ? new Date(customer.last_order_date).toLocaleDateString() : 'N/A'}
          subtitle={customer.last_order_date ? `${Math.round((new Date() - new Date(customer.last_order_date)) / (1000 * 60 * 60 * 24))} days ago` : 'No orders yet'}
          icon={Clock}
          color={customer.segment === 'Inactive' ? 'amber' : 'emerald'}
        />
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-slate-200 flex space-x-6">
        {[
          { id: 'timeline', label: `Activity Timeline (${customer.timeline?.length || 0})` },
          { id: 'orders', label: `Purchase History (${customer.orders?.length || 0})` },
          { id: 'notes', label: `Internal Notes (${customer.notes?.length || 0})` },
          { id: 'tasks', label: `Follow-up Tasks (${customer.tasks?.length || 0})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Activity Timeline */}
      {activeTab === 'timeline' && (
        <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Unified Customer Timeline</h3>
          <p className="text-xs text-slate-500 mb-6">
            Chronological aggregation of purchases, internal CRM agent notes, and task activities.
          </p>

          <div className="space-y-6 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-200">
            {customer.timeline?.map((ev) => (
              <div key={ev.id} className="relative flex items-start space-x-4 pl-1">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 text-white text-xs ${
                  ev.type === 'order' ? 'bg-indigo-600' :
                  ev.type === 'note' ? 'bg-amber-500' :
                  'bg-emerald-600'
                }`}>
                  {ev.type === 'order' ? <ShoppingBag className="w-3 h-3" /> :
                   ev.type === 'note' ? <FileText className="w-3 h-3" /> :
                   <CheckSquare className="w-3 h-3" />}
                </div>

                <div className="flex-1 bg-slate-50 rounded-xl p-3.5 border border-slate-200/70">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900">{ev.title}</h4>
                    <span className="text-[10px] text-slate-400">
                      {new Date(ev.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{ev.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Orders History */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">All Customer Orders</h3>
            <span className="text-xs text-slate-500">{customer.orders?.length} orders recorded</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3">Order Number</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Payment Method</th>
                  <th className="px-5 py-3">Items Purchased</th>
                  <th className="px-5 py-3 text-right">Total (INR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customer.orders?.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-3.5 font-bold text-indigo-600">
                      {ord.order_number}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">
                      {new Date(ord.date_created).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5">
                      <OrderStatusBadge status={ord.status} />
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">
                      {ord.payment_method}
                    </td>
                    <td className="px-5 py-3.5 text-slate-700">
                      <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                        {ord.items?.map((it) => (
                          <li key={it.id}>
                            {it.quantity}x {it.product_name} (₹{it.unit_price.toLocaleString('en-IN')})
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-900 text-right">
                      ₹{ord.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Internal Notes */}
      {activeTab === 'notes' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Notes list */}
          <div className="md:col-span-2 bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Customer Notes History</h3>

            {customer.notes?.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No internal notes written yet.</p>
            ) : (
              customer.notes?.map((n) => (
                <div key={n.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-indigo-700">{n.created_by}</span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(n.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">{n.content}</p>
                </div>
              ))
            )}
          </div>

          {/* Add note form */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs h-fit">
            <h4 className="text-xs font-bold text-slate-900 mb-3 flex items-center space-x-1.5">
              <Plus className="w-3.5 h-3.5 text-indigo-600" />
              <span>Add Internal Note</span>
            </h4>
            <form onSubmit={handleAddNote} className="space-y-3">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                rows={4}
                placeholder="Log customer conversation, preferences, or observations..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white resize-none"
              />
              <button
                type="submit"
                disabled={!newNote.trim() || isSubmittingNote}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                {isSubmittingNote ? 'Saving note...' : 'Post Internal Note'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Tab 4: Follow-up Tasks */}
      {activeTab === 'tasks' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Tasks list */}
          <div className="md:col-span-2 bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 mb-2">Customer Follow-up Tasks</h3>

            {customer.tasks?.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No tasks assigned for this customer.</p>
            ) : (
              customer.tasks?.map((t) => (
                <div 
                  key={t.id} 
                  className={`p-3.5 rounded-xl border flex items-start space-x-3 transition-colors ${
                    t.status === 'completed' ? 'bg-slate-50 border-slate-200 opacity-75' : 'bg-white border-slate-200 shadow-xs'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={t.status === 'completed'}
                    onChange={() => handleToggleTaskStatus(t.id, t.status)}
                    className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className={`text-xs font-bold ${t.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                        {t.title}
                      </h4>
                      <PriorityBadge priority={t.priority} />
                    </div>
                    {t.description && (
                      <p className="text-[11px] text-slate-500 mt-1">{t.description}</p>
                    )}
                    <div className="flex items-center space-x-3 text-[10px] text-slate-400 mt-2">
                      <span>Created by {t.created_by}</span>
                      <span>•</span>
                      <span>Created {new Date(t.created_at).toLocaleDateString()}</span>
                      {t.completed_at && (
                        <>
                          <span>•</span>
                          <span className="text-emerald-600 font-medium">Completed {new Date(t.completed_at).toLocaleDateString()}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Create task form */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs h-fit">
            <h4 className="text-xs font-bold text-slate-900 mb-3 flex items-center space-x-1.5">
              <Plus className="w-3.5 h-3.5 text-indigo-600" />
              <span>Create Task for Customer</span>
            </h4>
            <form onSubmit={handleAddTask} className="space-y-3">
              <div>
                <label className="text-[10px] font-semibold text-slate-500 uppercase">Title</label>
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="e.g., Call regarding abandoned cart discount"
                  className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-500 uppercase">Description</label>
                <textarea
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  rows={2}
                  placeholder="Details or specific instructions..."
                  className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-500 uppercase">Priority</label>
                <select
                  value={newTaskPriority}
                  onChange={(e) => setNewTaskPriority(e.target.value)}
                  className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={!newTaskTitle.trim() || isSubmittingTask}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                {isSubmittingTask ? 'Creating...' : 'Create Follow-up Task'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  CheckSquare, 
  Plus, 
  Filter, 
  Calendar, 
  User, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  RefreshCw,
  X
} from 'lucide-react';
import { getTasks, createTask, updateTask, getCustomers } from '../api/client';
import { PriorityBadge } from '../components/StatusBadge';

export const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending'); // all, pending, completed
  const [priorityFilter, setPriorityFilter] = useState('all');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customerId, setCustomerId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDays, setDueDays] = useState(3);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTasks = () => {
    setLoading(true);
    getTasks({
      status: statusFilter !== 'all' ? statusFilter : undefined,
      priority: priorityFilter !== 'all' ? priorityFilter : undefined
    })
      .then(res => setTasks(res))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTasks();
  }, [statusFilter, priorityFilter]);

  useEffect(() => {
    getCustomers().then(res => setCustomers(res)).catch(() => {});
  }, []);

  const handleToggleStatus = async (task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    try {
      await updateTask(task.id, { status: newStatus });
      fetchTasks();
    } catch (err) {
      alert(`Failed to update task: ${err.message}`);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!customerId || !title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + Number(dueDays));

      await createTask({
        customer_id: Number(customerId),
        title,
        description,
        priority,
        due_date: dueDate.toISOString(),
        created_by: 'CRM User'
      });

      setIsModalOpen(false);
      setTitle('');
      setDescription('');
      fetchTasks();
    } catch (err) {
      alert(`Failed to create task: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Follow-up Task Management</h2>
          <p className="text-xs text-slate-500 mt-1">
            Track and complete scheduled customer interactions, re-engagement calls, and special offers.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Follow-up Task</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Status Pills */}
        <div className="flex items-center space-x-1.5">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-1 text-[10px]">
            Status:
          </span>
          {[
            { id: 'pending', label: 'Pending' },
            { id: 'completed', label: 'Completed' },
            { id: 'all', label: 'All Tasks' }
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setStatusFilter(t.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                statusFilter === t.id
                  ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Priority Filter */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-500 font-medium">Priority:</span>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Tasks List */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
            <span>Loading follow-up tasks...</span>
          </div>
        ) : tasks.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="font-semibold text-sm">No tasks matching criteria</p>
            <p className="text-xs text-slate-400 mt-1">
              {statusFilter === 'pending' ? 'All caught up! Great job.' : 'No tasks in this view.'}
            </p>
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className={`p-4.5 flex items-start space-x-3.5 hover:bg-slate-50/70 transition-colors ${
                task.status === 'completed' ? 'opacity-70 bg-slate-50/40' : ''
              }`}
            >
              <input
                type="checkbox"
                checked={task.status === 'completed'}
                onChange={() => handleToggleStatus(task)}
                className="mt-1 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
              />

              <div className="flex-1">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center space-x-2">
                    <h3 className={`text-xs font-bold ${
                      task.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-900'
                    }`}>
                      {task.title}
                    </h3>
                    <PriorityBadge priority={task.priority} />
                  </div>

                  <Link
                    to={`/customers/${task.customer_id}`}
                    className="text-xs text-indigo-600 font-semibold hover:underline flex items-center space-x-1"
                  >
                    <User className="w-3 h-3 text-slate-400" />
                    <span>{task.customer_name}</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>

                {task.description && (
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {task.description}
                  </p>
                )}

                <div className="flex items-center space-x-4 text-[11px] text-slate-400 mt-2.5">
                  <span className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>Created: {new Date(task.created_at).toLocaleDateString()}</span>
                  </span>
                  <span>•</span>
                  <span>Author: {task.created_by}</span>
                  {task.due_date && (
                    <>
                      <span>•</span>
                      <span className="text-indigo-600 font-medium">
                        Due: {new Date(task.due_date).toLocaleDateString()}
                      </span>
                    </>
                  )}
                  {task.completed_at && (
                    <>
                      <span>•</span>
                      <span className="text-emerald-600 font-medium">
                        Completed: {new Date(task.completed_at).toLocaleDateString()}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 mb-1">Create Follow-up Task</h3>
            <p className="text-xs text-slate-500 mb-4">Assign a new task to an existing CRM customer.</p>

            <form onSubmit={handleCreateTask} className="space-y-3.5 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Target Customer</label>
                <select
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select a customer...</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.full_name} ({c.email}) — {c.segment}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Task Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="e.g., Call regarding abandoned cart discount"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Description (Optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Notes, instructions or special offers..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">Due In (Days)</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={dueDays}
                    onChange={(e) => setDueDays(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!customerId || !title.trim() || isSubmitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
                >
                  {isSubmitting ? 'Creating...' : 'Save Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

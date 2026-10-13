import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  ShoppingBag, 
  ExternalLink, 
  RefreshCw, 
  X, 
  Calendar, 
  CreditCard, 
  Package, 
  User,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Clock,
  Send,
  Check,
  ShieldAlert
} from 'lucide-react';
import { getOrders, getOrderDetail, createTask } from '../api/client';
import { OrderStatusBadge } from '../components/StatusBadge';

const STATUS_FILTERS = ['All', 'Payment Attention', 'completed', 'processing', 'pending', 'on-hold', 'cancelled', 'failed'];

export const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [recoveredOrderIds, setRecoveredOrderIds] = useState(new Set());
  const [recoveryMessage, setRecoveryMessage] = useState(null);

  const fetchOrders = () => {
    setLoading(true);
    let apiStatus = undefined;
    if (statusFilter !== 'All' && statusFilter !== 'Payment Attention') {
      apiStatus = statusFilter;
    }

    getOrders({
      search: search || undefined,
      status: apiStatus
    })
      .then(res => {
        let filtered = res;
        if (statusFilter === 'Payment Attention') {
          filtered = res.filter(o => ['failed', 'on-hold', 'pending'].includes(o.status.toLowerCase()));
        }
        setOrders(filtered);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOrders();
    }, 200);
    return () => clearTimeout(timer);
  }, [search, statusFilter]);

  const openOrderModal = (orderId) => {
    getOrderDetail(orderId)
      .then(res => setSelectedOrder(res))
      .catch(err => alert(`Failed to load order: ${err.message}`));
  };

  const handleCreateRecoveryTask = async (ord) => {
    if (!ord.customer_id) {
      alert("This order was placed via guest checkout. A manual outreach note or email can be sent directly to " + (ord.guest_email || "the guest"));
      return;
    }

    const title = `Payment Recovery: ${ord.order_number} (${ord.customer_name}) - ₹${ord.total.toLocaleString('en-IN')}`;
    const desc = `Rescue stalled transaction for Order ${ord.order_number}. Payment method: ${ord.payment_method}. Initiate WhatsApp / Email payment link outreach.`;

    try {
      await createTask({
        customer_id: ord.customer_id,
        title,
        description: desc,
        priority: 'urgent',
        created_by: 'Payment Recovery Hub'
      });

      setRecoveredOrderIds(prev => new Set(prev).add(ord.id));
      setRecoveryMessage(`✅ Urgent recovery task created for ${ord.order_number} (${ord.customer_name})`);
      setTimeout(() => setRecoveryMessage(null), 4000);
    } catch (err) {
      alert(`Failed to create recovery task: ${err.message}`);
    }
  };

  // Compute metrics for attention orders
  const attentionOrders = orders.filter(o => ['failed', 'on-hold', 'pending'].includes(o.status.toLowerCase()));
  const stalledValue = attentionOrders.reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Order Management & Payment Recovery</h2>
          <p className="text-xs text-slate-500 mt-1">
            Review customer transactions, purchased line items, payment gateways, and fulfill stalled checkout recovery.
          </p>
        </div>

        <button
          onClick={() => setStatusFilter(prev => prev === 'Payment Attention' ? 'All' : 'Payment Attention')}
          className={`flex items-center space-x-1.5 px-3.5 py-2 text-xs font-bold rounded-lg shadow-xs transition-all cursor-pointer ${
            statusFilter === 'Payment Attention'
              ? 'bg-rose-600 text-white shadow-rose-200'
              : 'bg-white border border-rose-200 text-rose-700 hover:bg-rose-50'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
          <span>Payment Attention Hub ({attentionOrders.length})</span>
        </button>
      </div>

      {/* Recovery Toast Notice */}
      {recoveryMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between shadow-xs">
          <span>{recoveryMessage}</span>
          <button onClick={() => setRecoveryMessage(null)} className="text-emerald-500 hover:text-emerald-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Stalled Payment Alert Banner */}
      {statusFilter === 'Payment Attention' && (
        <div className="bg-gradient-to-r from-rose-50 via-amber-50 to-orange-50 border border-rose-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                  {attentionOrders.length} Stalled Orders
                </span>
                <span className="text-xs font-bold text-slate-900">
                  ₹{stalledValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })} Recoverable Checkout Value
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Orders with gateway dropouts, bank wire verification delays, or pending UPI QR payments. Click "Recover Payment" to assign urgent follow-up touchpoints.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Search & Filters */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by order #, customer, email..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
          </div>

          <div className="text-xs text-slate-400">
            Showing {orders.length} orders
          </div>
        </div>

        {/* Status Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pt-1 pb-0.5">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-1 text-[10px] shrink-0">
            Status:
          </span>
          {STATUS_FILTERS.map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-all cursor-pointer shrink-0 ${
                statusFilter === st
                  ? st === 'Payment Attention' 
                    ? 'bg-rose-600 text-white shadow-xs font-bold'
                    : 'bg-indigo-600 text-white shadow-xs font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Order</th>
                <th className="px-5 py-3.5">Customer</th>
                <th className="px-5 py-3.5">Date & Overdue Age</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Line Items</th>
                <th className="px-5 py-3.5">Payment Method</th>
                <th className="px-5 py-3.5 text-right">Total</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-5 py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                    <span>Loading orders...</span>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-5 py-12 text-center text-slate-500">
                    <p className="font-semibold text-sm">No orders match your filter</p>
                    <p className="text-xs text-slate-400 mt-1">Try relaxing the search query or status filter.</p>
                  </td>
                </tr>
              ) : (
                orders.map((ord) => {
                  const isAttention = ['failed', 'on-hold', 'pending'].includes(ord.status.toLowerCase());
                  const isRecovered = recoveredOrderIds.has(ord.id);
                  const orderAgeDays = Math.round((new Date() - new Date(ord.date_created)) / (1000 * 60 * 60 * 24));

                  return (
                    <tr key={ord.id} className={`hover:bg-slate-50/70 transition-colors ${isAttention ? 'bg-rose-50/20' : ''}`}>
                      <td className="px-5 py-3.5 font-bold text-indigo-600">
                        {ord.order_number}
                      </td>

                      <td className="px-5 py-3.5">
                        {ord.customer_id ? (
                          <Link 
                            to={`/customers/${ord.customer_id}`}
                            className="font-semibold text-slate-900 hover:text-indigo-600 transition-colors block"
                          >
                            {ord.customer_name}
                          </Link>
                        ) : (
                          <div>
                            <span className="font-semibold text-slate-700">{ord.guest_name || 'Guest Checkout'}</span>
                            <span className="text-[10px] text-slate-400 block">{ord.guest_email}</span>
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-3.5 text-slate-600">
                        <div>
                          <span>{new Date(ord.date_created).toLocaleDateString()}</span>
                          {isAttention && (
                            <span className="text-[10px] font-bold text-rose-600 block">
                              {orderAgeDays > 0 ? `${orderAgeDays}d overdue` : 'Recent dropout'}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <OrderStatusBadge status={ord.status} />
                      </td>

                      <td className="px-5 py-3.5 text-slate-600 max-w-xs truncate">
                        {ord.items && ord.items.length > 0 ? (
                          <span>{ord.items.map(it => `${it.quantity}x ${it.product_name}`).join(', ')}</span>
                        ) : (
                          <span>{ord.items_count} item(s)</span>
                        )}
                      </td>

                      <td className="px-5 py-3.5 text-slate-600">
                        {ord.payment_method}
                      </td>

                      <td className="px-5 py-3.5 font-bold text-slate-900 text-right">
                        ₹{ord.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>

                      <td className="px-5 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                        {isAttention && (
                          <button
                            onClick={() => handleCreateRecoveryTask(ord)}
                            disabled={isRecovered}
                            className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                              isRecovered
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs'
                            }`}
                            title="Create urgent payment recovery follow-up task"
                          >
                            {isRecovered ? (
                              <span className="flex items-center space-x-1">
                                <Check className="w-3 h-3" />
                                <span>Task Created</span>
                              </span>
                            ) : (
                              <span>Recover Payment</span>
                            )}
                          </button>
                        )}

                        <button
                          onClick={() => openOrderModal(ord.id)}
                          className="px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-md transition-colors cursor-pointer"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 relative">
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2.5 mb-4">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Order {selectedOrder.order_number}</h3>
                <span className="text-xs text-slate-500">Placed on {new Date(selectedOrder.date_created).toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              {/* Customer info */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/70">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Customer & Shipping Info
                </span>
                <div className="font-semibold text-slate-800">{selectedOrder.customer_name}</div>
                <div className="text-slate-500">{selectedOrder.customer_email || selectedOrder.guest_email}</div>
                {selectedOrder.customer_id && (
                  <Link 
                    to={`/customers/${selectedOrder.customer_id}`}
                    className="inline-flex items-center space-x-1 text-indigo-600 hover:underline mt-1.5 font-medium"
                  >
                    <span>View Customer 360</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                )}
              </div>

              {/* Status and Gateway */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/70">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Fulfillment Status
                  </span>
                  <OrderStatusBadge status={selectedOrder.status} />
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/70">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Payment Gateway
                  </span>
                  <div className="font-semibold text-slate-800">{selectedOrder.payment_method}</div>
                </div>
              </div>

              {/* Line Items */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  Purchased Items ({selectedOrder.items?.length || 0})
                </span>
                <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-48 overflow-y-auto">
                  {selectedOrder.items?.map((item) => (
                    <div key={item.id} className="p-3 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-800">{item.product_name}</div>
                        <div className="text-[10px] text-slate-400">
                          SKU: {item.sku || 'N/A'} • Qty: {item.quantity} × ₹{item.unit_price}
                        </div>
                      </div>
                      <div className="font-bold text-slate-900">
                        ₹{item.total_price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Totals */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/70 space-y-1">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal:</span>
                  <span>₹{selectedOrder.subtotal?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Tax:</span>
                  <span>₹{selectedOrder.tax_total?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Shipping:</span>
                  <span>₹{selectedOrder.shipping_total?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 text-sm pt-2 border-t border-slate-200">
                  <span>Grand Total:</span>
                  <span className="text-indigo-600">₹{selectedOrder.total?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

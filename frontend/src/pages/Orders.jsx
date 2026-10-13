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
  AlertCircle
} from 'lucide-react';
import { getOrders, getOrderDetail } from '../api/client';
import { OrderStatusBadge } from '../components/StatusBadge';

const STATUS_FILTERS = ['All', 'completed', 'processing', 'pending', 'on-hold', 'cancelled', 'failed'];

export const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchOrders = () => {
    setLoading(true);
    getOrders({
      search: search || undefined,
      status: statusFilter !== 'All' ? statusFilter : undefined
    })
      .then(res => setOrders(res))
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

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Order Management</h2>
        <p className="text-xs text-slate-500 mt-1">
          Review customer transactions, purchased line items, payment gateways, and fulfillment statuses.
        </p>
      </div>

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
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-1 text-[10px]">
            Status:
          </span>
          {STATUS_FILTERS.map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-indigo-600 text-white shadow-xs font-semibold'
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
                <th className="px-5 py-3.5">Date</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Items</th>
                <th className="px-5 py-3.5">Payment</th>
                <th className="px-5 py-3.5 text-right">Total</th>
                <th className="px-5 py-3.5 text-right">Action</th>
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
                    <p className="font-semibold text-sm">No orders found</p>
                    <p className="text-xs text-slate-400 mt-1">Try relaxing the search query or status filter.</p>
                  </td>
                </tr>
              ) : (
                orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/70 transition-colors">
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
                      {new Date(ord.date_created).toLocaleDateString()}
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

                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => openOrderModal(ord.id)}
                        className="px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-md transition-colors cursor-pointer"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))
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
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
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
                  Customer Information
                </span>
                {selectedOrder.customer_id ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900">{selectedOrder.customer_name}</p>
                      <p className="text-slate-500 text-[11px]">{selectedOrder.customer_email}</p>
                    </div>
                    <Link
                      to={`/customers/${selectedOrder.customer_id}`}
                      className="text-xs text-indigo-600 font-semibold hover:underline flex items-center space-x-1"
                    >
                      <span>View Profile</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                ) : (
                  <div>
                    <p className="font-bold text-slate-900">{selectedOrder.guest_name || 'Guest Checkout'}</p>
                    <p className="text-slate-500 text-[11px]">{selectedOrder.guest_email}</p>
                  </div>
                )}
              </div>

              {/* Status & Payment */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Status</span>
                  <OrderStatusBadge status={selectedOrder.status} />
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Payment Method</span>
                  <span className="font-semibold text-slate-800">{selectedOrder.payment_method}</span>
                </div>
              </div>

              {/* Line items */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  Line Items ({selectedOrder.items?.length})
                </span>
                <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden">
                  {selectedOrder.items?.map((it) => (
                    <div key={it.id} className="p-3 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">{it.product_name}</p>
                        <p className="text-slate-400 text-[11px]">Qty: {it.quantity} × ₹{it.unit_price.toLocaleString('en-IN')}</p>
                      </div>
                      <span className="font-bold text-slate-900">
                        ₹{it.total_price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Summary */}
              <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline text-sm font-bold text-slate-900">
                <span>Total Amount:</span>
                <span className="text-base text-indigo-700">₹{selectedOrder.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

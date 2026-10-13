import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

// Standard API client (15s timeout for all normal endpoints)
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// AI-specific client with extended timeout for local LLM responses
// Local models (Ollama/qwen2.5) can take 30-120s depending on query complexity
const aiApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 180000, // 3 minutes
});

// Dashboard
export const getDashboardSummary = () => api.get('/dashboard/summary').then(res => res.data);
export const getRevenueAnalytics = () => api.get('/dashboard/revenue').then(res => res.data);

// Customers
export const getCustomers = (params = {}) => api.get('/customers', { params }).then(res => res.data);
export const getCustomerDetail = (id) => api.get(`/customers/${id}`).then(res => res.data);
export const getCustomerOrders = (id) => api.get(`/customers/${id}/orders`).then(res => res.data);
export const getCustomerNotes = (id) => api.get(`/customers/${id}/notes`).then(res => res.data);
export const createCustomerNote = (id, data) => api.post(`/customers/${id}/notes`, data).then(res => res.data);
export const getCustomerExportUrl = (params = {}) => {
  const query = new URLSearchParams({ ...params, export: 'csv' }).toString();
  return `${API_BASE_URL}/customers?${query}`;
};

// Orders
export const getOrders = (params = {}) => api.get('/orders', { params }).then(res => res.data);
export const getOrderDetail = (id) => api.get(`/orders/${id}`).then(res => res.data);

// Tasks
export const getTasks = (params = {}) => api.get('/tasks', { params }).then(res => res.data);
export const createTask = (data) => api.post('/tasks', data).then(res => res.data);
export const updateTask = (id, data) => api.patch(`/tasks/${id}`, data).then(res => res.data);

// WooCommerce Sync
export const testWooConnection = () => api.post('/sync/test-connection').then(res => res.data);
export const runSync = (mode = 'auto') => api.post(`/sync/run?mode=${mode}`).then(res => res.data);
export const getSyncHistory = () => api.get('/sync/history').then(res => res.data);

// AI Copilot — uses aiApi with extended timeout for local LLM
export const sendChatMessage = (message, customerContextId = null, chatHistory = []) =>
  aiApi.post('/ai/chat', {
    message,
    customer_context_id: customerContextId,
    chat_history: chatHistory
  }).then(res => res.data);

export const approveAction = (actionToken, approved, payload) =>
  aiApi.post('/ai/approve', {
    action_token: actionToken,
    approved,
    payload
  }).then(res => res.data);

export const getAiConfigStatus = () => api.get('/ai/config-status').then(res => res.data);

export default api;

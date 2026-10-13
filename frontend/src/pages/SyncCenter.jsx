import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Key, 
  Globe, 
  ShieldCheck, 
  Database,
  ArrowRight,
  Loader2,
  Server
} from 'lucide-react';
import { testWooConnection, runSync, getSyncHistory } from '../api/client';

export const SyncCenter = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);

  const fetchHistory = () => {
    setLoading(true);
    getSyncHistory()
      .then(res => setHistory(res))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await testWooConnection();
      setTestResult(res);
    } catch (err) {
      setTestResult({
        success: false,
        message: `Connection error: ${err.message}`
      });
    } finally {
      setTesting(false);
    }
  };

  const handleRunSync = async (mode = 'auto') => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await runSync(mode);
      setSyncResult(res);
      fetchHistory();
    } catch (err) {
      setSyncResult({
        success: false,
        message: `Sync execution error: ${err.message}`
      });
    } finally {
      setSyncing(false);
    }
  };

  const latestLog = history.length > 0 ? history[0] : null;

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Synchronization Center</h2>
        <p className="text-xs text-slate-500 mt-1">
          Monitor WooCommerce REST API v3 health, run database synchronization, and inspect external sync logs.
        </p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Mode Card */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Current Mode</span>
            <Database className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="flex items-center space-x-2">
            <span className={`inline-block w-2.5 h-2.5 rounded-full ${latestLog?.is_demo_sync ? 'bg-amber-500' : 'bg-emerald-500'}`} />
            <h3 className="text-lg font-bold text-slate-900">
              {latestLog?.is_demo_sync ? 'Demo Mode' : 'Live Store Mode'}
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {latestLog?.is_demo_sync 
              ? 'Operating on realistic seeded demo dataset.'
              : 'Synchronized with external WooCommerce database.'}
          </p>
        </div>

        {/* Last Sync Card */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Last Synchronization</span>
            <Clock className="w-4 h-4 text-indigo-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">
            {latestLog?.finished_at ? new Date(latestLog.finished_at).toLocaleString() : 'N/A'}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Status: <span className="font-semibold capitalize text-slate-700">{latestLog?.status || 'Idle'}</span>
          </p>
        </div>

        {/* Records Synced Card */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Synchronized Records</span>
            <Server className="w-4 h-4 text-indigo-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">
            {latestLog?.customers_synced || 0} Customers • {latestLog?.orders_synced || 0} Orders
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Verified across customers and orders tables.
          </p>
        </div>
      </div>

      {/* Integration Control Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Connection Tester */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">WooCommerce API Connection</h3>
              <p className="text-xs text-slate-500">Test live store REST API v3 handshake</p>
            </div>
            <Globe className="w-4 h-4 text-slate-400" />
          </div>

          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-xs space-y-1.5 text-slate-600">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700">Environment Configuration:</span>
              <span className="font-mono text-[10px] bg-slate-200 px-1.5 py-0.5 rounded">backend/.env</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Set <code className="text-indigo-600">WOOCOMMERCE_STORE_URL</code>, <code className="text-indigo-600">WOOCOMMERCE_CONSUMER_KEY</code>, and <code className="text-indigo-600">WOOCOMMERCE_CONSUMER_SECRET</code> to synchronize with a live store.
            </p>
          </div>

          <button
            onClick={handleTestConnection}
            disabled={testing}
            className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
            <span>{testing ? 'Testing Endpoint Connection...' : 'Test Store Connection'}</span>
          </button>

          {testResult && (
            <div className={`p-3.5 rounded-xl border text-xs flex items-start space-x-2.5 ${
              testResult.success
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}>
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-semibold">{testResult.success ? 'Connection Successful' : 'Connection Notice'}</p>
                <p className="text-[11px] mt-0.5">{testResult.message}</p>
              </div>
            </div>
          )}
        </div>

        {/* Sync Trigger Panel */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Database Synchronization</h3>
              <p className="text-xs text-slate-500">Trigger immediate data sync or reset demo data</p>
            </div>
            <RefreshCw className="w-4 h-4 text-slate-400" />
          </div>

          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-xs space-y-1.5 text-slate-600">
            <p className="font-semibold text-slate-700">Safe Sync Rules:</p>
            <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-500">
              <li>Identifies external records using WooCommerce IDs.</li>
              <li>Preserves existing internal notes and follow-up tasks.</li>
              <li>Prevents duplicate records upon repeated executions.</li>
            </ul>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => handleRunSync('auto')}
              disabled={syncing}
              className="flex-1 flex items-center justify-center space-x-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              <span>{syncing ? 'Synchronizing...' : 'Run Sync (Auto)'}</span>
            </button>

            <button
              onClick={() => handleRunSync('demo')}
              disabled={syncing}
              className="py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              Refresh Demo Data
            </button>
          </div>

          {syncResult && (
            <div className={`p-3.5 rounded-xl border text-xs flex items-start space-x-2.5 ${
              syncResult.success
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}>
              {syncResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-semibold">{syncResult.success ? 'Sync Completed' : 'Sync Failed'}</p>
                <p className="text-[11px] mt-0.5">{syncResult.message}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sync History Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Synchronization History</h3>
            <p className="text-xs text-slate-500">Audit logs of all synchronization runs</p>
          </div>
          <button
            onClick={fetchHistory}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            title="Refresh history"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Started At</th>
                <th className="px-5 py-3.5">Finished At</th>
                <th className="px-5 py-3.5">Mode</th>
                <th className="px-5 py-3.5">Customers</th>
                <th className="px-5 py-3.5">Orders</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-5 py-8 text-center text-slate-400">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-1 text-indigo-500" />
                    <span>Loading logs...</span>
                  </td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-5 py-8 text-center text-slate-500">
                    No sync logs recorded yet.
                  </td>
                </tr>
              ) : (
                history.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-3.5 text-slate-700">
                      {new Date(log.started_at).toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">
                      {log.finished_at ? new Date(log.finished_at).toLocaleTimeString() : 'In progress'}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${
                        log.is_demo_sync
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        {log.is_demo_sync ? 'Demo' : 'Live Store'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-slate-800">
                      {log.customers_synced}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-slate-800">
                      {log.orders_synced}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold capitalize ${
                        log.status === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        log.status === 'failed' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                        'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 max-w-sm truncate text-[11px]">
                      {log.error_message || log.details || 'Sync completed normally.'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

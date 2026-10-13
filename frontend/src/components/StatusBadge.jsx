import React from 'react';

export const SegmentBadge = ({ segment }) => {
  const styles = {
    'High-Value': 'bg-purple-50 text-purple-700 border-purple-200 ring-purple-500/20',
    'Inactive': 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-500/20',
    'Returning': 'bg-blue-50 text-blue-700 border-blue-200 ring-blue-500/20',
    'New': 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/20',
    'Lead': 'bg-slate-50 text-slate-600 border-slate-200 ring-slate-500/20',
  };

  const style = styles[segment] || 'bg-slate-50 text-slate-600 border-slate-200';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${style}`}>
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-70"></span>
      {segment}
    </span>
  );
};

export const OrderStatusBadge = ({ status }) => {
  const s = (status || '').toLowerCase();
  let style = 'bg-slate-50 text-slate-600 border-slate-200';

  if (s === 'completed') {
    style = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  } else if (s === 'processing') {
    style = 'bg-blue-50 text-blue-700 border-blue-200';
  } else if (s === 'pending' || s === 'on-hold') {
    style = 'bg-amber-50 text-amber-700 border-amber-200';
  } else if (s === 'cancelled' || s === 'failed') {
    style = 'bg-rose-50 text-rose-700 border-rose-200';
  } else if (s === 'refunded') {
    style = 'bg-purple-50 text-purple-700 border-purple-200';
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${style}`}>
      {status}
    </span>
  );
};

export const PriorityBadge = ({ priority }) => {
  const p = (priority || '').toLowerCase();
  let style = 'bg-slate-100 text-slate-600 border-slate-200';

  if (p === 'high') {
    style = 'bg-rose-50 text-rose-700 border-rose-200';
  } else if (p === 'medium') {
    style = 'bg-amber-50 text-amber-700 border-amber-200';
  } else if (p === 'low') {
    style = 'bg-slate-50 text-slate-600 border-slate-200';
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${style}`}>
      {priority}
    </span>
  );
};

export const RFMSegmentBadge = ({ segment }) => {
  const styles = {
    'Champions': 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold',
    'Loyal Customers': 'bg-blue-50 text-blue-700 border-blue-200 font-semibold',
    'Potential Loyalists': 'bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold',
    'At Risk': 'bg-orange-50 text-orange-700 border-orange-300 font-bold',
    'Hibernating': 'bg-slate-100 text-slate-700 border-slate-300',
    'New Leads': 'bg-teal-50 text-teal-700 border-teal-200',
  };
  const style = styles[segment] || 'bg-slate-50 text-slate-600 border-slate-200';

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] border ${style}`}>
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-80"></span>
      {segment}
    </span>
  );
};

export const ChurnRiskBadge = ({ risk }) => {
  const r = (risk || 'Low').toLowerCase();
  let style = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  let dotColor = 'bg-emerald-500';

  if (r === 'critical') {
    style = 'bg-rose-100 text-rose-800 border-rose-300 font-bold animate-pulse';
    dotColor = 'bg-rose-600';
  } else if (r === 'high') {
    style = 'bg-orange-50 text-orange-800 border-orange-300 font-semibold';
    dotColor = 'bg-orange-500';
  } else if (r === 'medium') {
    style = 'bg-amber-50 text-amber-700 border-amber-200';
    dotColor = 'bg-amber-500';
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] border ${style}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${dotColor}`}></span>
      {risk}
    </span>
  );
};

export const HealthScoreBadge = ({ score }) => {
  const sc = score || 50;
  let color = 'text-emerald-700 bg-emerald-50 border-emerald-200';
  let barColor = 'bg-emerald-500';

  if (sc < 40) {
    color = 'text-rose-700 bg-rose-50 border-rose-200';
    barColor = 'bg-rose-500';
  } else if (sc < 70) {
    color = 'text-amber-700 bg-amber-50 border-amber-200';
    barColor = 'bg-amber-500';
  }

  return (
    <div className="flex items-center space-x-2">
      <div className="w-12 bg-slate-200 rounded-full h-1.5 overflow-hidden">
        <div className={`h-1.5 rounded-full ${barColor}`} style={{ width: `${sc}%` }}></div>
      </div>
      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${color}`}>
        {sc}/100
      </span>
    </div>
  );
};


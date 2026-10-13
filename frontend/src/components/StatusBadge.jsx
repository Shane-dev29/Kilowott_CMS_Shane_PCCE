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

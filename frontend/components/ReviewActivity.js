'use client';

import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export default function ReviewActivity({ activities = [] }) {
  const getActivityIcon = (type) => {
    switch (type) {
      case 'approved':
        return <CheckCircle size={18} className="text-green-400" />;
      case 'rejected':
        return <XCircle size={18} className="text-red-400" />;
      case 'warning':
        return <AlertCircle size={18} className="text-amber-400" />;
      default:
        return <AlertCircle size={18} className="text-slate-400" />;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'approved':
        return 'bg-green-900/20 border-l-green-600';
      case 'rejected':
        return 'bg-red-900/20 border-l-red-600';
      case 'warning':
        return 'bg-amber-900/20 border-l-amber-600';
      default:
        return 'bg-slate-800/50 border-l-slate-600';
    }
  };

  return (
    <div className="card">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <div className="w-1 h-6 bg-indigo-600 rounded-full"></div>
          Review Activity
        </h3>
      </div>

      <div className="space-y-3">
        {activities.length === 0 ? (
          <p className="text-slate-500 text-center py-4">No recent activities</p>
        ) : (
          activities.map((activity, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border-l-2 ${getActivityColor(activity.type)}`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-1">{getActivityIcon(activity.type)}</div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-100">
                    {activity.message}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {activity.timestamp}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

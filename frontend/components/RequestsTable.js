'use client';

import { Badge, CheckCircle, XCircle, Clock, MoreVertical } from 'lucide-react';
import { useState } from 'react';

export default function RequestsTable({ requests, onApprove, onReject, loading }) {
  const [expandedId, setExpandedId] = useState(null);

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'REQUESTED':
        return 'badge-warning';
      case 'BOOKED':
        return 'badge-success';
      case 'REJECTED':
        return 'badge-danger';
      case 'CANCEL_REQUESTED':
        return 'badge-info';
      default:
        return 'badge-primary';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'REQUESTED':
        return 'Pending';
      case 'BOOKED':
        return 'Approved';
      case 'REJECTED':
        return 'Rejected';
      case 'CANCEL_REQUESTED':
        return 'Cancel Pending';
      default:
        return status;
    }
  };

  return (
    <div className="card overflow-hidden">
      {/* Table Header */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700 bg-slate-800/50">
              <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Registrar
              </th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Course & Slot
              </th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Room Reference
              </th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Status
              </th>
              <th className="text-right px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {requests.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center">
                  <p className="text-slate-400">No requests found</p>
                </td>
              </tr>
            ) : (
              requests.map((request) => (
                <tr
                  key={request._id}
                  className="hover:bg-slate-800/50 transition-colors border-l-4 border-l-transparent hover:border-l-indigo-600"
                >
                  {/* Registrar */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-indigo-600/20 flex items-center justify-center font-bold text-indigo-400">
                        {request.requestedBy?.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-100">
                          {request.requestedBy?.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {request.requestedBy?.email}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Course & Slot */}
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-100">
                        {request.courseName || 'N/A'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {request.startTime} - {request.endTime}
                      </p>
                    </div>
                  </td>

                  {/* Room Reference */}
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-100">
                        {request.classroom?.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {request.classroom?.subject}
                      </p>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    <span className={`badge ${getStatusBadgeClass(request.status)}`}>
                      {getStatusLabel(request.status)}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 text-right">
                    {request.status === 'REQUESTED' ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onApprove(request._id)}
                          disabled={loading}
                          className="p-2 hover:bg-green-600/20 rounded-lg transition-colors text-green-400 hover:text-green-300"
                          title="Approve"
                        >
                          <CheckCircle size={18} />
                        </button>
                        <button
                          onClick={() => onReject(request._id)}
                          disabled={loading}
                          className="p-2 hover:bg-red-600/20 rounded-lg transition-colors text-red-400 hover:text-red-300"
                          title="Reject"
                        >
                          <XCircle size={18} />
                        </button>
                      </div>
                    ) : (
                      <div className="text-slate-500">
                        <MoreVertical size={18} />
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

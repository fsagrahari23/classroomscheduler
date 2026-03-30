'use client';

import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createRequest, clearError } from '@/lib/store/schedulesSlice.js';
import { X, AlertCircle, CheckCircle } from 'lucide-react';

export default function RequestModal({ classroom, onClose }) {
  const [formData, setFormData] = useState({
    courseName: '',
    startTime: '09:00',
    endTime: '10:30',
  });
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.schedules);
  const { token } = useSelector((state) => state.auth);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!classroom?._id) return;

    await dispatch(
      createRequest({
        classroomId: classroom._id,
        startTime: formData.startTime,
        endTime: formData.endTime,
        courseName: formData.courseName,
        token,
      })
    );

    if (!error) {
      setTimeout(() => onClose(), 500);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg border border-slate-700 max-w-md w-full shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold text-slate-100">Request Classroom</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Classroom Info */}
          <div className="mb-6 p-4 bg-indigo-600/10 border border-indigo-600/30 rounded-lg">
            <p className="text-sm text-slate-400 mb-1">Selected Classroom</p>
            <h3 className="text-lg font-bold text-slate-100">{classroom?.name}</h3>
            <p className="text-sm text-slate-400 mt-2">{classroom?.subject}</p>
            {classroom?.facultyId?.name && (
              <p className="text-sm text-slate-400">Faculty: {classroom.facultyId.name}</p>
            )}
          </div>

          {/* Error Alert */}
          {error && (
            <div className="alert alert-danger mb-4 flex items-start gap-3">
              <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">
                Course Name
              </label>
              <input
                type="text"
                name="courseName"
                value={formData.courseName}
                onChange={handleChange}
                placeholder="e.g., Physics 101, Advanced Calculus"
                className="input"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Start Time
                </label>
                <input
                  type="time"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleChange}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  End Time
                </label>
                <input
                  type="time"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleChange}
                  className="input"
                  required
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary flex-1"
              >
                {loading ? 'Requesting...' : 'Submit Request'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

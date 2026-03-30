'use client';

import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { BookOpen, User, Clock, ChevronRight } from 'lucide-react';
import RequestModal from './RequestModal.js';

export default function ClassroomCard({ classroom }) {
  const [showModal, setShowModal] = useState(false);
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const canRequest = user?.role === 'teacher' || user?.role === 'cr';

  return (
    <>
      <div className="card hover:shadow-xl hover:border-indigo-500 transition-all duration-300 cursor-pointer">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-slate-100 mb-2">{classroom.name}</h3>
            <div className="flex flex-wrap gap-2 items-center">
              <span className="badge badge-info flex items-center gap-1">
                <BookOpen size={14} />
                {classroom.subject}
              </span>
            </div>
          </div>
          <div className="w-12 h-12 bg-indigo-600/20 rounded-lg flex items-center justify-center">
            <BookOpen className="text-indigo-400" size={24} />
          </div>
        </div>

        <div className="border-t border-slate-700 pt-4 mt-4">
          <div className="flex items-center gap-2 text-sm text-slate-400 mb-3">
            <User size={16} />
            <span>Faculty: {classroom.facultyId?.name || 'N/A'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-400 mb-4">
            <Clock size={16} />
            <span>Email: {classroom.facultyId?.email || 'N/A'}</span>
          </div>
        </div>

        {canRequest && (
          <button
            onClick={() => setShowModal(true)}
            className="btn btn-primary w-full mt-4 justify-center"
          >
            Request Classroom
            <ChevronRight size={16} />
          </button>
        )}
      </div>

      {showModal && (
        <RequestModal
          classroom={classroom}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}

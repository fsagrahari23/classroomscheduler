"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  setFacultyFilter,
  fetchClassrooms,
  fetchFaculties,
} from "../lib/store/classroomsSlice.js";
import { Users } from "lucide-react";

export default function FacultyFilter() {
  const dispatch = useDispatch();
  const classrooms = useSelector((state) => state.classrooms);
  const filters = classrooms?.filters;
  const faculties = classrooms?.faculties;
  const { token } = useSelector((state) => state.auth);

  useEffect(() => {
    if (token) {
      dispatch(fetchFaculties({ token }));
    }
  }, [token, dispatch]);

  const handleFacultyChange = (e) => {
    const facultyId = e.target.value;
    dispatch(setFacultyFilter(facultyId));
    dispatch(
      fetchClassrooms({
        search: filters.search,
        facultyId: facultyId,
        token,
      }),
    );
  };

  return (
    <div className="relative">
      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none">
        <Users size={20} />
      </div>
      <select
        value={filters?.facultyId}
        onChange={handleFacultyChange}
        className="input pl-12 pr-4 appearance-none cursor-pointer"
      >
        <option value="all">All Faculties</option>
        {faculties?.map((faculty) => (
          <option key={faculty._id} value={faculty._id}>
            {faculty.name}
          </option>
        ))}
      </select>
      <style jsx>{`
        select {
          background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
          background-repeat: no-repeat;
          background-position: right 1rem center;
          background-size: 1.5em 1.5em;
          padding-right: 2.5rem;
        }
      `}</style>
    </div>
  );
}

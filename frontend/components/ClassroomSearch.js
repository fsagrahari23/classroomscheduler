"use client";

import { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Search, X } from "lucide-react";
import {
  setSearchFilter,
  fetchClassrooms,
} from "../lib/store/classroomsSlice.js";

export default function ClassroomSearch() {
  const [searchInput, setSearchInput] = useState("");
  const dispatch = useDispatch();
  const data = useSelector((state) => state.classrooms);
  const filters = data?.filters || [];
  const { token } = useSelector((state) => state.auth);

  // Debounce search
  const debounceSearch = useCallback(
    (() => {
      let timeoutId;
      return (value) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          dispatch(setSearchFilter(value));
          dispatch(
            fetchClassrooms({
              search: value,
              facultyId: filters.facultyId,
              token,
            }),
          );
        }, 300);
      };
    })(),
    [dispatch, filters.facultyId, token],
  );

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);
    debounceSearch(value);
  };

  const handleClear = () => {
    setSearchInput("");
    dispatch(setSearchFilter(""));
    dispatch(
      fetchClassrooms({
        search: "",
        facultyId: filters.facultyId,
        token,
      }),
    );
  };

  return (
    <div className="relative">
      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400">
        <Search size={20} />
      </div>
      <input
        type="text"
        placeholder="Search classroom (e.g., G-08, 101, Physics)..."
        value={searchInput}
        onChange={handleInputChange}
        className="input pl-12 pr-10"
      />
      {searchInput && (
        <button
          onClick={handleClear}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <X size={18} />
        </button>
      )}
    </div>
  );
}

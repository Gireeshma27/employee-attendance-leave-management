"use client";

import { useState, useRef, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
} from "lucide-react";

export function DatePicker({
  value,
  onChange,
  placeholder = "Select date",
  align = "left",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(
    value ? new Date(value) : new Date(),
  );
  const dropdownRef = useRef(null);

  // Helper to format date as YYYY-MM-DD
  const formatDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toISOString().split("T")[0];
  };

  // Helper to format date for display (MM-DD-YYYY)
  const formatDisplayDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${month}-${day}-${year}`;
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const handlePrevMonth = (e) => {
    e.stopPropagation();
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = (e) => {
    e.stopPropagation();
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const handleDateSelect = (day) => {
    const selectedDate = new Date(
      viewDate.getFullYear(),
      viewDate.getMonth(),
      day,
    );
    onChange(formatDate(selectedDate));
    setIsOpen(false);
  };

  const handleToday = (e) => {
    e.stopPropagation();
    const today = new Date();
    onChange(formatDate(today));
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange("");
    setIsOpen(false);
  };

  const renderDays = () => {
    const totalDays = daysInMonth(viewDate.getFullYear(), viewDate.getMonth());
    const firstDay = firstDayOfMonth(
      viewDate.getFullYear(),
      viewDate.getMonth(),
    );
    const days = [];

    // Empty spaces for previous month's days
    for (let i = 0; i < firstDay; i++) {
      const prevMonthLastDay = new Date(
        viewDate.getFullYear(),
        viewDate.getMonth(),
        0,
      ).getDate();
      const dayNum = prevMonthLastDay - (firstDay - i - 1);
      days.push(
        <div
          key={`prev-${i}`}
          className="h-9 w-9 flex items-center justify-center text-slate-300 text-sm"
        >
          {dayNum}
        </div>,
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = value ? new Date(value) : null;
    if (selected) selected.setHours(0, 0, 0, 0);

    for (let day = 1; day <= totalDays; day++) {
      const current = new Date(
        viewDate.getFullYear(),
        viewDate.getMonth(),
        day,
      );
      const isToday = current.getTime() === today.getTime();
      const isSelected = selected && current.getTime() === selected.getTime();

      days.push(
        <button
          key={day}
          onClick={(e) => {
            e.stopPropagation();
            handleDateSelect(day);
          }}
          className={`h-9 w-9 flex items-center justify-center rounded-md text-sm transition-colors
            ${
              isSelected
                ? "bg-blue-600 text-white font-semibold shadow-sm"
                : isToday
                  ? "text-blue-600 font-semibold border border-blue-200"
                  : "text-slate-700 hover:bg-slate-100 hover:text-blue-600"
            }`}
        >
          {day}
        </button>,
      );
    }

    // Filling up the rest of the 7x6 grid (to keep it stable)
    const totalCells = 42;
    const remaining = totalCells - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push(
        <div
          key={`next-${i}`}
          className="h-9 w-9 flex items-center justify-center text-slate-300 text-sm"
        >
          {i}
        </div>,
      );
    }

    return days;
  };

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-slate-300 transition-all text-sm font-medium text-slate-700 min-w-[160px]"
      >
        <CalendarIcon size={18} className="text-slate-400" />
        {value ? (
          formatDisplayDate(value)
        ) : (
          <span className="text-slate-400">{placeholder}</span>
        )}
      </button>

      {isOpen && (
        <div
          className={`absolute top-full mt-2 z-50 bg-white border border-slate-200 rounded-xl shadow-2xl p-4 w-[320px] animate-in fade-in zoom-in duration-200 ${
            align === "right"
              ? "right-0 origin-top-right"
              : "left-0 origin-top-left"
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1 group cursor-pointer">
              <span className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                {monthNames[viewDate.getMonth()]}, {viewDate.getFullYear()}
              </span>
              <ChevronRight size={14} className="text-slate-400 rotate-90" />
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
                title="Previous Month"
              >
                <ChevronLeft size={18} className="rotate-90" />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
                title="Next Month"
              >
                <ChevronLeft size={18} className="-rotate-90" />
              </button>
            </div>
          </div>

          {/* Week Days */}
          <div className="grid grid-cols-7 mb-2">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
              <div
                key={day}
                className="h-8 flex items-center justify-center text-xs font-semibold text-slate-400 uppercase"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-y-1">{renderDays()}</div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
            <button
              onClick={handleClear}
              className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
            >
              Clear
            </button>
            <button
              onClick={handleToday}
              className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

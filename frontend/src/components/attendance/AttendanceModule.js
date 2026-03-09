"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Badge } from "@/components/ui/Badge";
import {
  Clock,
  CheckCircle2,
  LogOut,
  LogIn,
  Locate,
  AlertTriangle,
  Eye,
} from "lucide-react";
import { useState, useEffect } from "react";
import apiService from "@/lib/api";
import { SuccessModal } from "@/components/ui/SuccessModal";
import { useToast } from "@/components/ui/Toast";
import {
  formatTime,
  getActiveDuration,
  formatDuration,
  getStatusVariant,
} from "@/utils/attendance";
import { formatDate } from "@/utils/formatDate";

/**
 * Reusable Attendance Module — shared across Employee, Manager, and Admin dashboards.
 *
 * Props:
 *  @param {string} role - "employee" | "manager" | "admin" — controls DashboardLayout role
 *
 * Features:
 *  - Check-in / Check-out with WFH support
 *  - Summary cards (Check-in time, Check-out time, Total hours)
 *  - Action Center with WFH toggle
 *  - Attendance history table (Date, Check-in, Check-out, Duration, Status, Action)
 *  - Success modal on check-in/out
 *  - Centralized duration calculation via shared utilities
 */
export default function AttendanceModule({ role = "employee" }) {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successConfig, setSuccessConfig] = useState({
    title: "",
    message: "",
    time: "",
  });

  // GEOFENCING TEMPORARILY DISABLED
  const isOutOfRange = false;

  const [isWFH, setIsWFH] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    fetchAttendanceData();
    fetchUserProfile();

    if (typeof window !== "undefined") {
      const storedWfh = localStorage.getItem("wfhMode") === "true";
      setIsWFH(storedWfh);
    }

    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("wfhMode", isWFH);
    }
  }, [isWFH]);

  const fetchUserProfile = async () => {
    try {
      const res = await apiService.user.getProfile();
      setUserProfile(res.data);
    } catch (err) {
      console.error("Error fetching user profile:", err);
    }
  };

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      const historyData = await apiService.attendance.getMyAttendance();

      const todayStr = new Date().toISOString().split('T')[0];
      const todayRecord = historyData.data?.find((r) => {
        return new Date(r.date).toISOString().split('T')[0] === todayStr;
      });

      setTodayAttendance(todayRecord || null);
      if (todayRecord?.status === "WFH") setIsWFH(true);
      setAttendanceHistory(historyData.data || []);
    } catch (err) {
      console.error("Error fetching attendance:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (isWFH && !userProfile?.wfhAllowed) {
      setError(
        "WFH permission not granted by admin. Please contact your manager.",
      );
      return;
    }

    try {
      setIsSubmitting(true);
      const checkInTime = new Date();
      const response = await apiService.attendance.checkIn({
        checkInTime,
        isWFH,
      });

      if (response.success) {
        setTodayAttendance(response.data);
        apiService.attendance.getMyAttendance().then((historyData) => {
          setAttendanceHistory(historyData.data || []);
        });
        fetchUserProfile();

        // Show late-login toast if backend flagged it
        if (response.data?.isLate) {
          toast.warning(
            "Late Login Detected",
            "You logged in after the allowed time.",
          );
        }
      }

      setSuccessConfig({
        title: isWFH ? "WFH Check-in Successful!" : "Check-in Successful!",
        message: isWFH
          ? "Your remote attendance from Verified Home Location has been recorded. Have a great day!"
          : "Your attendance from Verified Office Location has been recorded for today. Have a productive day ahead!",
        time: formatTime(checkInTime),
      });
      setShowSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckOut = async () => {
    try {
      setIsSubmitting(true);
      const checkOutTime = new Date();
      const response = await apiService.attendance.checkOut({
        checkOutTime,
      });

      if (response.success) {
        setTodayAttendance(response.data);
        apiService.attendance.getMyAttendance().then((historyData) => {
          setAttendanceHistory(historyData.data || []);
        });
      }

      setSuccessConfig({
        title: "Check-out Successful!",
        message: "You've been successfully checked out. Have a great evening!",
        time: formatTime(checkOutTime),
      });
      setShowSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeDuration = getActiveDuration(
    todayAttendance?.checkInTime,
    todayAttendance?.checkOutTime,
    currentTime,
  );

  if (loading) {
    return (
      <DashboardLayout role={role}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-slate-500 font-medium">
              Loading attendance...
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role={role}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 border border-red-200/60 text-red-700 px-4 py-3 rounded-xl flex items-start gap-3 animate-in slide-in-from-top-4 duration-300">
            <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm font-medium">{error}</p>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-600"
            >
              ×
            </button>
          </div>
        )}

        {/* Page Title */}
        <div className="pt-1 md:pt-2 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-lg sm:text-2xl font-semibold text-slate-900">
              Attendance
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Track your daily check-in, check-out and location data.
            </p>
          </div>
          {userProfile?.wfhAllowed && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-2 flex items-center gap-3">
              <div className="h-6 w-6 flex items-center justify-center rounded-full bg-blue-600 text-white text-[10px] font-semibold">
                {userProfile.wfhDaysRemaining}
              </div>
              <div className="text-xs">
                <p className="font-medium text-blue-900 leading-none">
                  WFH Days Available
                </p>
                <p className="text-blue-700 opacity-80 mt-1 leading-none">
                  Remaining this month
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                <LogIn size={20} />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Check-in Time
                </p>
                <p className="text-xl sm:text-2xl font-semibold text-slate-900 mt-1">
                  {formatTime(todayAttendance?.checkInTime)}
                </p>
              </div>
            </div>
          </div>

          <div
            className={`rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow border ${
              isOutOfRange
                ? "bg-red-50 border-red-200/60"
                : "bg-green-50 border-green-200/60"
            }`}
          >
            <div className="flex flex-col items-center text-center space-y-2">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  isOutOfRange
                    ? "bg-red-100 text-red-600"
                    : "bg-green-100 text-green-600"
                }`}
              >
                <Clock size={20} />
              </div>
              <div>
                <p
                  className={`text-[10px] font-semibold uppercase tracking-wider ${
                    isOutOfRange ? "text-red-400" : "text-green-500"
                  }`}
                >
                  Check-out Time
                </p>
                <p
                  className={`text-xl sm:text-2xl font-semibold mt-1 ${
                    isOutOfRange ? "text-red-900" : "text-green-900"
                  }`}
                >
                  {formatTime(todayAttendance?.checkOutTime)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                <Locate size={20} />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Total Hours
                </p>
                <div className="flex items-baseline gap-1 mt-1 justify-center">
                  <p className="text-xl sm:text-2xl font-semibold text-slate-900">
                    {activeDuration.h}h
                  </p>
                  <p className="text-base font-semibold text-slate-400">
                    {activeDuration.m}m
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Center */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          <div className="lg:col-span-2 bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
              <h2 className="text-base font-semibold text-slate-900">
                Action Center
              </h2>
              <div className="flex items-center gap-4">
                {userProfile?.wfhAllowed && !todayAttendance?.checkInTime && (
                  <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/60 hover:bg-white transition-colors">
                    <input
                      type="checkbox"
                      checked={isWFH}
                      onChange={(e) => setIsWFH(e.target.checked)}
                      disabled={userProfile.wfhDaysRemaining <= 0}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                    />
                    <span className="text-xs font-medium text-slate-700">
                      Work From Home
                    </span>
                  </label>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
              <button
                onClick={handleCheckIn}
                disabled={
                  !!todayAttendance?.checkInTime ||
                  (isOutOfRange && !isWFH) ||
                  isSubmitting
                }
                className={`flex-1 flex items-center justify-center gap-2 md:gap-3 py-3 md:py-4 px-4 md:px-6 rounded-2xl font-semibold transition-all text-sm md:text-base ${
                  todayAttendance?.checkInTime
                    ? "bg-blue-50 text-blue-400 cursor-not-allowed"
                    : isOutOfRange && !isWFH
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                      : "bg-[#10b981] text-white hover:bg-[#059669] shadow-lg shadow-green-100 active:scale-95"
                }`}
              >
                {todayAttendance?.checkInTime ? (
                  <CheckCircle2 size={20} className="md:hidden" />
                ) : (
                  <LogIn size={20} className="md:hidden" />
                )}
                {todayAttendance?.checkInTime ? (
                  <CheckCircle2 size={24} className="hidden md:inline" />
                ) : (
                  <LogIn size={24} className="hidden md:inline" />
                )}
                {isSubmitting
                  ? "Processing..."
                  : todayAttendance?.checkInTime
                    ? todayAttendance.status === "WFH"
                      ? "WFH STARTED"
                      : "CHECKED IN"
                    : isWFH
                      ? "START WFH"
                      : "CHECK IN"}
              </button>

              <button
                onClick={handleCheckOut}
                disabled={
                  !todayAttendance?.checkInTime ||
                  !!todayAttendance?.checkOutTime ||
                  isSubmitting
                }
                className={`flex-1 flex items-center justify-center gap-2 md:gap-3 py-3 md:py-4 px-4 md:px-6 rounded-2xl font-semibold transition-all text-sm md:text-base ${
                  todayAttendance?.checkOutTime
                    ? "bg-red-50 text-red-400 cursor-not-allowed"
                    : !todayAttendance?.checkInTime
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                      : "bg-[#ef4444] text-white hover:bg-[#dc2626] shadow-lg shadow-red-100 active:scale-95"
                }`}
              >
                <LogOut size={20} className="md:hidden" />
                <LogOut size={24} className="hidden md:inline" />
                {isSubmitting
                  ? "Processing..."
                  : todayAttendance?.checkOutTime
                    ? "CHECKED OUT"
                    : todayAttendance?.status === "WFH"
                      ? "FINISH WFH"
                      : "CHECK OUT"}
              </button>
            </div>

            {/* Hint Box */}
            <div className="mt-6 text-center bg-slate-50/50 border border-slate-200/60 rounded-xl p-3">
              {isOutOfRange && !isWFH ? (
                <p className="text-xs text-red-500 font-medium flex items-center justify-center gap-2">
                  <AlertTriangle size={16} className="flex-shrink-0" /> Check-in
                  disabled: You are outside the office geofence.
                </p>
              ) : todayAttendance?.checkInTime ? (
                <p className="text-xs text-slate-500">
                  Last activity:{" "}
                  {todayAttendance.status === "WFH"
                    ? "Remote Check-in"
                    : "Check-in"}{" "}
                  at{" "}
                  <span className="text-blue-600 font-medium">
                    {formatTime(todayAttendance.checkInTime)}
                  </span>{" "}
                  from{" "}
                  <span className="text-blue-600 font-medium">
                    {todayAttendance.status === "WFH"
                      ? "Verified Home Location"
                      : "Verified Office Location"}
                  </span>
                </p>
              ) : (
                <p className="text-xs text-slate-500">
                  {isWFH
                    ? "Ready for remote work session."
                    : "Verify your location to enable check-in/out actions."}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Attendance History */}
        <div className="bg-white border border-slate-200/60 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">
              Attendance History
            </h3>
            <span className="text-slate-400 text-xs">
              Showing all {attendanceHistory.length} records
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs md:text-sm">
              <thead className="bg-slate-50/50 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                <tr>
                  <th className="px-5 py-3.5 text-left">Date</th>
                  <th className="px-5 py-3.5 text-left hidden sm:table-cell">
                    Check-in
                  </th>
                  <th className="px-5 py-3.5 text-left hidden md:table-cell">
                    Check-out
                  </th>
                  <th className="px-5 py-3.5 text-left">Duration</th>
                  <th className="px-5 py-3.5 text-left">Status</th>
                  <th className="px-5 py-3.5 text-center hidden xs:table-cell">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attendanceHistory.map((record, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <p className="text-sm font-medium text-slate-800">
                        {formatDate(record.date)}
                      </p>
                    </td>
                    <td className="px-5 py-3.5 text-sm font-medium text-slate-500 hidden sm:table-cell">
                      {formatTime(record.checkInTime)}
                    </td>
                    <td className="px-5 py-3.5 text-sm font-medium text-slate-500 hidden md:table-cell">
                      {formatTime(record.checkOutTime)}
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-medium text-slate-800">
                        {formatDuration(record)}
                      </p>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge
                        variant={getStatusVariant(record.status)}
                        dot
                      >
                        {record.status?.toUpperCase() || "PENDING"}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 hidden xs:table-cell">
                      <div className="flex justify-center">
                        <button
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-blue-600 transition-colors"
                          title="View details"
                        >
                          <Eye size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <SuccessModal
          isOpen={showSuccess}
          onClose={() => setShowSuccess(false)}
          title={successConfig.title}
          message={successConfig.message}
          time={successConfig.time}
        />
      </div>
    </DashboardLayout>
  );
}

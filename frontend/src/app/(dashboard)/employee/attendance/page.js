"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Badge } from "@/components/ui/Badge";
import {
  Clock,
  MapPin,
  CheckCircle2,
  LogOut,
  LogIn,
  Locate,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";
import { useState, useEffect } from "react";
import apiService from "@/lib/api";
import { SuccessModal } from "@/components/ui/SuccessModal";

export default function AttendancePage() {
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
  // Geofence Simulation State (can be wired to actual GPS later)
  // const [isOutOfRange, setIsOutOfRange] = useState(false);
  const isOutOfRange = false; // Always in-range when geofencing is disabled

  const [isWFH, setIsWFH] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    fetchAttendanceData();
    fetchUserProfile();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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

      // Better today detection: compare local date strings
      const todayStr = new Date().toLocaleDateString();
      const todayRecord = historyData.data?.find((r) => {
        return new Date(r.date).toLocaleDateString() === todayStr;
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
    // GEOFENCING TEMPORARILY DISABLED - removed geofence check
    // Original: if (isOutOfRange && !isWFH) return;

    try {
      setIsSubmitting(true);
      const checkInTime = new Date();
      const response = await apiService.attendance.checkIn({
        checkInTime,
        isWFH,
      });

      if (response.success) {
        setTodayAttendance(response.data);
        // Refresh history in background
        apiService.attendance.getMyAttendance().then((historyData) => {
          setAttendanceHistory(historyData.data || []);
        });
        // Refresh profile to update WFH quota
        fetchUserProfile();
      }

      setSuccessConfig({
        title: isWFH ? "WFH Check-in Successful!" : "Check-in Successful!",
        message: isWFH
          ? "Your remote attendance has been recorded. Have a great day!"
          : "Your attendance has been recorded for today. Have a productive day ahead!",
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
        // Refresh history in background
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

  const formatTime = (date) => {
    if (!date) return "-- : --";
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getActiveDuration = () => {
    const checkIn = todayAttendance?.checkInTime;
    const checkOut = todayAttendance?.checkOutTime;

    if (!checkIn) return { h: 0, m: 0 };

    const startTime = new Date(checkIn);
    const endTime = checkOut ? new Date(checkOut) : currentTime;

    const diffMs = endTime - startTime;
    if (diffMs < 0) return { h: 0, m: 0 };

    const totalMinutes = Math.floor(diffMs / (1000 * 60));
    return {
      h: Math.floor(totalMinutes / 60),
      m: totalMinutes % 60,
    };
  };

  const activeDuration = getActiveDuration();

  if (loading) {
    return (
      <DashboardLayout role="employee">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-gray-500 font-medium">Loading attendance...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="employee">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* GEOFENCING TEMPORARILY DISABLED - Geofence Alert commented out */}
        {/* {isOutOfRange && (
          <div className="bg-red-50 border border-red-100 rounded-xl md:rounded-2xl p-3 md:p-4 flex flex-col sm:flex-row sm:items-start gap-3 md:gap-4 animate-in slide-in-from-top-4 duration-300">
            <div className="w-9 md:w-10 h-9 md:h-10 bg-red-100 rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="text-red-600" size={18} />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs md:text-sm font-semibold text-red-900">
                Out of Geofence Range
              </h4>
              <p className="text-[12px] md:text-xs text-red-700 mt-1 leading-relaxed">
                Your current location is outside the designated office
                perimeter. Attendance actions are restricted.
              </p>
            </div>
          </div>
        )} */}

        {/* Page Title */}
        <div className="pt-1 md:pt-2 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-lg sm:text-2xl font-semibold text-gray-900">
              Attendance
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          <div className="bg-white border border-gray-100 rounded-2xl p-4 md:p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex flex-col items-center text-center space-y-2 md:space-y-3">
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                <LogIn size={20} />
              </div>
              <div>
                <p className="text-[9px] md:text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                  Check-in Time
                </p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mt-1">
                  {formatTime(todayAttendance?.checkInTime)}
                </p>
              </div>
            </div>
          </div>

          <div
            className={`rounded-2xl p-4 md:p-6 shadow-sm hover:shadow-md transition-shadow border ${
              isOutOfRange
                ? "bg-red-50 border-red-100"
                : "bg-green-50 border-green-100"
            }`}
          >
            <div className="flex flex-col items-center text-center space-y-2 md:space-y-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  isOutOfRange
                    ? "bg-red-100 text-red-600"
                    : "bg-green-100 text-green-600"
                }`}
              >
                <Clock size={20} />
              </div>
              <div>
                <p
                  className={`text-[9px] md:text-[10px] font-semibold uppercase tracking-wider ${
                    isOutOfRange ? "text-red-400" : "text-green-500"
                  }`}
                >
                  Current Time
                </p>
                <p
                  className={`text-xl md:text-2xl font-bold mt-1 ${
                    isOutOfRange ? "text-red-900" : "text-green-900"
                  }`}
                >
                  {currentTime.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-4 md:p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex flex-col items-center text-center space-y-2 md:space-y-3">
              <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center">
                <Locate size={20} />
              </div>
              <div>
              <p className="text-[9px] md:text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                Total Hours
              </p>
              <div className="flex items-baseline gap-1 mt-1 justify-center">
                <p className="text-xl md:text-2xl font-bold text-gray-900">
                    {activeDuration.h}h
                  </p>
                  <p className="text-base md:text-lg font-bold text-gray-400">
                    {activeDuration.m}m
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Center & Map */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Action Center */}
          <div className="lg:col-span-2 bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 md:mb-8">
              <h2 className="text-base md:text-lg font-semibold text-gray-900">
                Action Center
              </h2>
              <div className="flex items-center gap-4">
                {userProfile?.wfhAllowed && !todayAttendance?.checkInTime && (
                  <label className="flex items-center gap-2 cursor-pointer bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100 hover:bg-white transition-colors">
                    <input
                      type="checkbox"
                      checked={isWFH}
                      onChange={(e) => setIsWFH(e.target.checked)}
                      disabled={userProfile.wfhDaysRemaining <= 0}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="text-xs font-semibold text-gray-700 uppercase tracking-tighter">
                      Work From Home
                    </span>
                  </label>
                )}
                {/* GEOFENCING TEMPORARILY DISABLED - Dev Toggle hidden */}
                {/* <div
                  onClick={() => setIsOutOfRange(!isOutOfRange)}
                  className="cursor-pointer"
                >
                  <Badge
                    variant="secondary"
                    className="text-[9px] md:text-[10px] py-0 px-1.5 opacity-50 hover:opacity-100 transition-opacity whitespace-nowrap"
                  >
                    Toggle Dev: {isOutOfRange ? "Out of Range" : "In Range"}
                  </Badge>
                </div> */}
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
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
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
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
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
            <div className="mt-6 md:mt-8 text-center bg-gray-50/50 border border-gray-100 rounded-2xl p-3 md:p-4">
              {isOutOfRange && !isWFH ? (
                <p className="text-xs md:text-sm text-red-500 font-medium flex items-center justify-center gap-2">
                  <AlertTriangle size={16} className="flex-shrink-0" /> Check-in
                  disabled: You are outside the office geofence.
                </p>
              ) : todayAttendance?.checkInTime ? (
                <p className="text-xs md:text-sm text-gray-500 font-medium">
                  Last activity:{" "}
                  {todayAttendance.status === "WFH"
                    ? "Remote Check-in"
                    : "Check-in"}{" "}
                  at{" "}
                  <span className="text-blue-600">
                    {formatTime(todayAttendance.checkInTime)}
                  </span>{" "}
                  from{" "}
                  <span
                    className={
                      todayAttendance.status === "WFH"
                        ? "text-purple-600 font-semibold"
                        : "text-green-600 font-semibold"
                    }
                  >
                    {todayAttendance.status === "WFH"
                      ? "Home/Remote Location"
                      : "Verified Office Location"}
                  </span>
                </p>
              ) : (
                <p className="text-xs md:text-sm text-gray-500 font-medium">
                  {isWFH
                    ? "Ready for remote work session."
                    : "Verify your location to enable check-in/out actions."}
                </p>
              )}
            </div>
          </div>

          {/* Live Location Card */}
          <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm flex flex-col">
            <div className="p-4 md:p-5 border-b border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin size={18} className="text-red-500 flex-shrink-0" />
                <span className="text-xs md:text-sm font-semibold text-gray-900">
                  Live Location
                </span>
              </div>
              <Badge
                variant={isOutOfRange ? "danger" : "success"}
                className="text-[9px] md:text-[10px] font-semibold tracking-tight"
              >
                {isOutOfRange ? "● OUT OF RANGE" : "● VERIFIED"}
              </Badge>
            </div>

            {/* Mock Map UI */}
            <div className="relative flex-1 bg-gray-100 min-h-[200px] md:min-h-[220px] flex items-center justify-center">
              <div
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 2px 2px, #000 1px, transparent 0)",
                  backgroundSize: "24px 24px",
                }}
              ></div>

              {/* Geofence Circle */}
              <div
                className={`relative w-24 md:w-32 h-24 md:h-32 rounded-full flex items-center justify-center border-2 border-dashed ${
                  isOutOfRange
                    ? "bg-red-50 border-red-200"
                    : "bg-green-50 border-green-200"
                }`}
              >
                {/* User Pin */}
                <div
                  className={`absolute transition-all duration-700 ${
                    isOutOfRange
                      ? "-top-4 -right-4"
                      : "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                  }`}
                >
                  <div className="relative">
                    <div
                      className={`absolute inset-0 rounded-full animate-ping opacity-25 ${
                        isOutOfRange ? "bg-red-500" : "bg-blue-600"
                      }`}
                    ></div>
                    <div
                      className={`w-4 h-4 rounded-full border-2 border-white shadow-md shadow-black/20 ${
                        isOutOfRange ? "bg-red-500" : "bg-blue-600"
                      }`}
                    ></div>
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white text-[8px] md:text-[9px] font-semibold py-0.5 px-2 rounded-full border border-gray-100 shadow-sm whitespace-nowrap">
                      You
                    </div>
                  </div>
                </div>
              </div>

              {/* Location Label */}
              <div className="absolute bottom-3 left-3 right-3 md:bottom-4 md:left-4 md:right-4 bg-white/95 backdrop-blur-sm p-2 md:p-3 rounded-xl border border-gray-100 shadow-xl">
                <p className="text-[8px] md:text-[10px] font-semibold text-gray-400 uppercase tracking-widest leading-none">
                  Detected Location
                </p>
                <p className="text-[9px] md:text-[11px] font-semibold text-gray-800 mt-1.5 leading-tight">
                  {isOutOfRange
                    ? "Sector 22, Residential Block"
                    : "Office Building 4, Zone A"}
                </p>
                <p className="text-[8px] md:text-[10px] font-medium text-gray-500 mt-0.5">
                  {isOutOfRange
                    ? "Distance: 1.2km from perimeter"
                    : "Lat: 12.9716° N, Long: 77.5946° E"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Attendance History */}
        <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-gray-50 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Attendance History</h3>
            <span className="text-gray-400 text-xs">
              Showing all {attendanceHistory.length} records
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs md:text-sm">
              <thead className="bg-gray-50/50 text-[9px] md:text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                <tr>
                  <th className="px-4 md:px-6 py-3 md:py-4 text-left">Date</th>
                  <th className="px-4 md:px-6 py-3 md:py-4 text-left hidden sm:table-cell">
                    Check-in
                  </th>
                  <th className="px-4 md:px-6 py-3 md:py-4 text-left hidden md:table-cell">
                    Check-out
                  </th>
                  <th className="px-4 md:px-6 py-3 md:py-4 text-left">
                    Duration
                  </th>
                  <th className="px-4 md:px-6 py-3 md:py-4 text-left">
                    Status
                  </th>
                  <th className="px-4 md:px-6 py-3 md:py-4 text-center hidden xs:table-cell">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {attendanceHistory.map((record, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-gray-50/80 transition-colors"
                  >
                    <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap">
                      <p className="text-xs md:text-sm font-semibold text-gray-800">
                        {new Date(record.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </td>
                    <td className="px-4 md:px-6 py-3 md:py-4 text-xs md:text-sm font-medium text-gray-500 hidden sm:table-cell">
                      {formatTime(record.checkInTime)}
                    </td>
                    <td className="px-4 md:px-6 py-3 md:py-4 text-xs md:text-sm font-medium text-gray-500 hidden md:table-cell">
                      {formatTime(record.checkOutTime)}
                    </td>
                    <td className="px-4 md:px-6 py-3 md:py-4">
                      <p className="text-xs md:text-sm font-semibold text-gray-800">
                        {record.workingHours
                          ? `${Math.floor(record.workingHours)}h ${Math.round((record.workingHours % 1) * 60)}m`
                          : "-"}
                      </p>
                    </td>
                    <td className="px-4 md:px-6 py-3 md:py-4">
                      <Badge
                        variant={
                          record.status === "Present"
                            ? "success"
                            : record.status === "Absent"
                              ? "danger"
                              : "secondary"
                        }
                        className="text-[9px] md:text-[10px] font-semibold py-0.5 px-2"
                      >
                        {record.status?.toUpperCase() || "PENDING"}
                      </Badge>
                    </td>
                    <td className="px-4 md:px-6 py-3 md:py-4 hidden xs:table-cell">
                      <button className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
                        <AlertTriangle size={16} />
                      </button>
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

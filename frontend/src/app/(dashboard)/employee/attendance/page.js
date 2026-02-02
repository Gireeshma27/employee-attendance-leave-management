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
  ExternalLink,
} from "lucide-react";
import { useState, useEffect } from "react";
import { apiService } from "@/lib/api";

export default function AttendancePage() {
  const [loading, setLoading] = useState(true);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Geofence Simulation State (can be wired to actual GPS later)
  const [isOutOfRange, setIsOutOfRange] = useState(false);

  useEffect(() => {
    fetchAttendanceData();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      const historyData = await apiService.attendance.getMyAttendance();

      const today = new Date().toISOString().split("T")[0];
      const todayRecord = historyData.data?.find((r) => {
        const recordDate = new Date(r.date).toISOString().split("T")[0];
        return recordDate === today;
      });

      setTodayAttendance(todayRecord || null);
      setAttendanceHistory(historyData.data || []);
    } catch (err) {
      console.error("Error fetching attendance:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (isOutOfRange) return;
    try {
      setIsSubmitting(true);
      await apiService.attendance.checkIn({
        checkInTime: new Date(),
      });
      await fetchAttendanceData();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckOut = async () => {
    try {
      setIsSubmitting(true);
      await apiService.attendance.checkOut({
        checkOutTime: new Date(),
      });
      await fetchAttendanceData();
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
        {/* Geofence Alert */}
        {isOutOfRange && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-start gap-4 animate-in slide-in-from-top-4 duration-300">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="text-red-600" size={20} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-red-900">
                Out of Geofence Range
              </h4>
              <p className="text-xs text-red-700 mt-1 leading-relaxed">
                Your current location is outside the designated office
                perimeter. Attendance actions are restricted.
              </p>
            </div>
          </div>
        )}

        {/* Page Title */}
        <div className="pt-2">
          <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track your daily check-in, check-out and location data.
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                <LogIn size={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Check-in Time
                </p>
                <p className="text-2xl font-black text-gray-900 mt-1">
                  {formatTime(todayAttendance?.checkInTime)}
                </p>
              </div>
            </div>
          </div>

          <div
            className={`rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow border ${
              isOutOfRange
                ? "bg-red-50 border-red-100"
                : "bg-green-50 border-green-100"
            }`}
          >
            <div className="flex flex-col items-center text-center space-y-3">
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
                  className={`text-xs font-bold uppercase tracking-wider ${
                    isOutOfRange ? "text-red-400" : "text-green-500"
                  }`}
                >
                  Current Time
                </p>
                <p
                  className={`text-2xl font-black mt-1 ${
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

          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center">
                <Locate size={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Total Hours
                </p>
                <div className="flex items-baseline gap-1 mt-1 justify-center">
                  <p className="text-2xl font-black text-gray-900">
                    {Math.floor(todayAttendance?.workingHours || 0)}h
                  </p>
                  <p className="text-lg font-bold text-gray-400">
                    {Math.round(
                      ((todayAttendance?.workingHours || 0) % 1) * 60,
                    )}
                    m
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Center & Map */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Action Center */}
          <div className="lg:col-span-2 bg-white border border-gray-100 rounded-3xl p-8 shadow-sm">
            <div className="flex items-center gap-2 mb-8">
              <h2 className="text-lg font-bold text-gray-900">Action Center</h2>
              <div
                onClick={() => setIsOutOfRange(!isOutOfRange)}
                className="cursor-pointer"
              >
                <Badge
                  variant="secondary"
                  className="text-[10px] py-0 px-1.5 opacity-50 hover:opacity-100 transition-opacity"
                >
                  Toggle Dev: {isOutOfRange ? "Out of Range" : "In Range"}
                </Badge>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleCheckIn}
                disabled={
                  !!todayAttendance?.checkInTime || isOutOfRange || isSubmitting
                }
                className={`flex-1 flex items-center justify-center gap-3 py-4 px-6 rounded-2xl font-bold transition-all ${
                  todayAttendance?.checkInTime
                    ? "bg-blue-50 text-blue-400 cursor-not-allowed"
                    : isOutOfRange
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-[#10b981] text-white hover:bg-[#059669] shadow-lg shadow-green-100 active:scale-95"
                }`}
              >
                {todayAttendance?.checkInTime ? (
                  <CheckCircle2 size={24} />
                ) : (
                  <LogIn size={24} />
                )}
                {isSubmitting
                  ? "Processing..."
                  : todayAttendance?.checkInTime
                    ? "CHECKED IN"
                    : "CHECK IN"}
              </button>

              <button
                onClick={handleCheckOut}
                disabled={
                  !todayAttendance?.checkInTime ||
                  !!todayAttendance?.checkOutTime ||
                  isSubmitting
                }
                className={`flex-1 flex items-center justify-center gap-3 py-4 px-6 rounded-2xl font-bold transition-all ${
                  todayAttendance?.checkOutTime
                    ? "bg-red-50 text-red-400 cursor-not-allowed"
                    : !todayAttendance?.checkInTime
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-[#ef4444] text-white hover:bg-[#dc2626] shadow-lg shadow-red-100 active:scale-95"
                }`}
              >
                <LogOut size={24} />
                {isSubmitting
                  ? "Processing..."
                  : todayAttendance?.checkOutTime
                    ? "CHECKED OUT"
                    : "CHECK OUT"}
              </button>
            </div>

            {/* Hint Box */}
            <div className="mt-8 text-center bg-gray-50/50 border border-gray-100 rounded-2xl p-4">
              {isOutOfRange ? (
                <p className="text-sm text-red-500 font-medium flex items-center justify-center gap-2">
                  <AlertTriangle size={16} /> Check-in disabled: You are outside
                  the office geofence.
                </p>
              ) : todayAttendance?.checkInTime ? (
                <p className="text-sm text-gray-500 font-medium">
                  Last activity: Check-in at{" "}
                  <span className="text-blue-600">
                    {formatTime(todayAttendance.checkInTime)}
                  </span>{" "}
                  from{" "}
                  <span className="text-green-600 font-bold">
                    Verified Office Location
                  </span>
                </p>
              ) : (
                <p className="text-sm text-gray-500 font-medium">
                  Verify your location to enable check-in/out actions.
                </p>
              )}
            </div>
          </div>

          {/* Live Location Card */}
          <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm flex flex-col">
            <div className="p-5 border-b border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin size={18} className="text-red-500" />
                <span className="text-sm font-bold text-gray-900">
                  Live Location
                </span>
              </div>
              <Badge
                variant={isOutOfRange ? "danger" : "success"}
                className="text-[10px] font-black tracking-tight"
              >
                {isOutOfRange ? "● OUT OF RANGE" : "● VERIFIED"}
              </Badge>
            </div>

            {/* Mock Map UI */}
            <div className="relative flex-1 bg-gray-100 min-h-[220px] flex items-center justify-center">
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
                className={`relative w-32 h-32 rounded-full flex items-center justify-center border-2 border-dashed ${
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
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white text-[9px] font-black py-0.5 px-2 rounded-full border border-gray-100 shadow-sm whitespace-nowrap">
                      You
                    </div>
                  </div>
                </div>
              </div>

              {/* Location Label */}
              <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm p-3 rounded-xl border border-gray-100 shadow-xl">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">
                  Detected Location
                </p>
                <p className="text-[11px] font-bold text-gray-800 mt-1.5 leading-tight">
                  {isOutOfRange
                    ? "Sector 22, Residential Block"
                    : "Office Building 4, Zone A"}
                </p>
                <p className="text-[10px] font-medium text-gray-500 mt-0.5">
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
            <h3 className="font-bold text-gray-900">Attendance History</h3>
            <button className="text-blue-600 text-xs font-bold hover:underline flex items-center gap-1 group">
              View Full Report{" "}
              <ExternalLink
                size={12}
                className="transition-transform group-hover:-translate-y-0.5"
              />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4 text-left">Date</th>
                  <th className="px-6 py-4 text-left">Check-in</th>
                  <th className="px-6 py-4 text-left">Check-out</th>
                  <th className="px-6 py-4 text-left">Duration</th>
                  <th className="px-6 py-4 text-left">Status</th>
                  <th className="px-6 py-4 text-left">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {attendanceHistory.map((record, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-gray-50/80 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm font-bold text-gray-800">
                        {new Date(record.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-500">
                      {formatTime(record.checkInTime)}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-500">
                      {formatTime(record.checkOutTime)}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-gray-800">
                        {record.workingHours
                          ? `${Math.floor(record.workingHours)}h ${Math.round((record.workingHours % 1) * 60)}m`
                          : "-"}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant={
                          record.status === "Present"
                            ? "success"
                            : record.status === "Absent"
                              ? "danger"
                              : "secondary"
                        }
                        className="text-[10px] font-black py-0.5 px-2"
                      >
                        {record.status?.toUpperCase() || "PENDING"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
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
      </div>
    </DashboardLayout>
  );
}

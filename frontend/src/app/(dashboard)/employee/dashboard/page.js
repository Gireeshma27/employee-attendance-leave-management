"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Clock,
  Calendar,
  AlertCircle,
  TrendingUp,
  ChevronRight,
  CalendarDays,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import apiService from "@/lib/api";
import { formatDate, formatTime } from "@/utils/formatDate";

const EmployeeDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [todayStatus, setTodayStatus] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [pendingLeaves, setPendingLeaves] = useState(0);
  const [leaveBalance, setLeaveBalance] = useState({
    CL: 0,
    SL: 0,
    PL: 0,
    total: 0,
  });
  const [error, setError] = useState(null);
  const [upcomingHolidays, setUpcomingHolidays] = useState([]);
  const router = useRouter();

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch profile, dashboard statistics, and holidays in parallel
      const [profileRes, dashboardRes, holidayRes] = await Promise.all([
        apiService.user.getProfile(),
        apiService.dashboard.getEmployeeStats(),
        apiService.holiday.getAll(),
      ]);

      if (profileRes.success) setUser(profileRes.data);

      // Derive upcoming holidays (next 3, from today onward)
      if (holidayRes.success) {
        const FIXED = [
          { title: "Republic Day", month: 1, day: 26 },
          { title: "Independence Day", month: 8, day: 15 },
          { title: "Gandhi Jayanti", month: 10, day: 2 },
        ];
        const year = new Date().getFullYear();
        const fixedList = FIXED.map(({ title, month, day }) => ({
          title,
          startDate: new Date(year, month - 1, day).toISOString(),
          endDate: new Date(year, month - 1, day).toISOString(),
          type: "PUBLIC_FIXED",
        }));
        const dbList = (holidayRes.data || []).filter((h) => h.source === "DB");
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const upcoming = [...fixedList, ...dbList]
          .filter((h) => new Date(h.endDate) >= today)
          .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
          .slice(0, 3);
        setUpcomingHolidays(upcoming);
      }

      if (dashboardRes.success) {
        const { todayStatus, stats, recentAttendance } = dashboardRes.data;

        setTodayStatus(todayStatus);
        setAttendanceHistory(recentAttendance || []);
        setPendingLeaves(stats.pendingRequests || 0);
        setLeaveBalance(
          stats.leaveBalance || { CL: 0, SL: 0, PL: 0, total: 0 },
        );
      } else {
        throw new Error(
          dashboardRes.message || "Failed to fetch dashboard data",
        );
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <DashboardLayout role="employee">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-500 font-medium">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Only show last 5 attendance records
  const recentAttendance = attendanceHistory.slice(0, 5);

  return (
    <DashboardLayout role="employee">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">
              Welcome back, {user?.name || "Employee"}!
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Here's your attendance overview for today
            </p>
          </div>
          <Badge variant="info" className="px-3 py-1 w-fit text-xs">
            {user?.employeeId || "EMP-001"}
          </Badge>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2">
            <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Today's Status"
            value={todayStatus?.checkInTime ? "Present" : "Not Checked In"}
            icon={Clock}
            color="green"
          />

          <StatCard
            label="Working Hours"
            value={
              todayStatus?.workingHours
                ? `${Math.floor(todayStatus.workingHours)}h ${Math.round((todayStatus.workingHours % 1) * 60)}m`
                : "0h 0m"
            }
            icon={TrendingUp}
            color="blue"
          />

          <StatCard
            label="Leave Balance"
            value={`${leaveBalance.total} days`}
            icon={Calendar}
            color="yellow"
          />

          <StatCard
            label="Pending Requests"
            value={String(pendingLeaves)}
            icon={AlertCircle}
            color="red"
          />
        </div>

        {/* Upcoming Holidays Widget */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <CalendarDays size={16} className="text-amber-500" />
              Upcoming Holidays
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {upcomingHolidays.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-2">No upcoming holidays</p>
            ) : (
              <div className="space-y-2">
                {upcomingHolidays.map((h, i) => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const start = new Date(h.startDate);
                  const end = new Date(h.endDate);
                  start.setHours(0, 0, 0, 0);
                  end.setHours(0, 0, 0, 0);
                  const isToday = today >= start && today <= end;
                  const typeColors = {
                    PUBLIC_FIXED: "bg-green-50 text-green-700",
                    FESTIVAL: "bg-amber-50 text-amber-700",
                    COMPANY: "bg-blue-50 text-blue-700",
                  };
                  const colorClass = typeColors[h.type] || "bg-slate-50 text-slate-700";
                  return (
                    <div key={i} className={`flex items-center justify-between rounded-xl px-3 py-2 ${colorClass}`}>
                      <div>
                        {isToday ? (
                          <p className="font-semibold text-sm">🎉 Today is {h.title}</p>
                        ) : (
                          <p className="font-medium text-sm">{h.title}</p>
                        )}
                        <p className="text-xs opacity-70 mt-0.5">
                          {formatDate(start)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Attendance */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold text-slate-800">
              Recent Attendance
            </CardTitle>
            <span className="text-xs text-slate-400">Last 5 records</span>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-400 bg-slate-50/30 uppercase text-[10px] font-semibold tracking-widest">
                    <th className="text-left px-5 py-3.5">Date</th>
                    <th className="text-left px-5 py-3.5">Check-in</th>
                    <th className="text-left px-5 py-3.5 hidden sm:table-cell">
                      Check-out
                    </th>
                    <th className="text-left px-5 py-3.5">Hours</th>
                    <th className="text-left px-5 py-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentAttendance.length > 0 ? (
                    recentAttendance.map((record, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="px-5 py-3.5 text-slate-800 font-medium">
                          {formatDate(record.date)}
                        </td>
                        <td className="px-5 py-3.5 text-slate-500">
                          {record.checkInTime
                            ? formatTime(record.checkInTime)
                            : "-"}
                        </td>
                        <td className="px-5 py-3.5 text-slate-500 hidden sm:table-cell">
                          {record.checkOutTime
                            ? formatTime(record.checkOutTime)
                            : "-"}
                        </td>
                        <td className="px-5 py-3.5 text-slate-700 font-medium">
                          {record.workingHours
                            ? `${Math.floor(record.workingHours)}h ${Math.round((record.workingHours % 1) * 60)}m`
                            : "0h 0m"}
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge
                            variant={
                              record.status === "Present"
                                ? "success"
                                : record.status === "Absent"
                                  ? "danger"
                                  : "secondary"
                            }
                            dot
                          >
                            {record.status}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="5"
                        className="px-5 py-12 text-center text-slate-400"
                      >
                        No attendance records found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* View Full Attendance Button */}
        <div className="flex justify-center sm:justify-start pt-2">
          <Button
            variant="secondary"
            onClick={() => router.push("/employee/attendance")}
            className="flex items-center gap-2"
          >
            View Full Attendance
            <ChevronRight size={18} />
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

const StatCard = ({ label, value, icon: Icon, color }) => {
  const colors = {
    green: "bg-green-500 text-white shadow-green-500/20",
    blue: "bg-blue-600 text-white shadow-blue-600/20",
    yellow: "bg-yellow-500 text-white shadow-yellow-500/20",
    red: "bg-red-500 text-white shadow-red-500/20",
  };

  return (
    <Card className="hover:shadow-md transition-all duration-300 overflow-hidden relative group">
      <div className="absolute top-0 right-0 w-20 h-20 bg-slate-50 rounded-full translate-x-8 -translate-y-8 opacity-40 group-hover:scale-110 transition-transform duration-500" />
      <div className="flex flex-col gap-3 relative z-10 p-4 md:p-5">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${colors[color] || colors.blue}`}
        >
          <Icon size={18} strokeWidth={2} />
        </div>
        <div>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            {label}
          </p>
          <p className="text-xl md:text-2xl font-semibold text-slate-900 tracking-tight leading-none">
            {value}
          </p>
        </div>
      </div>
    </Card>
  );
};

export default EmployeeDashboard;

"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Clock, Calendar, AlertCircle, TrendingUp, ChevronRight } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import apiService from "@/lib/api";

const EmployeeDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [todayStatus, setTodayStatus] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [pendingLeaves, setPendingLeaves] = useState(0);
  const [error, setError] = useState(null);
  const router = useRouter();

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch profile, attendance, and leaves in parallel
      const [profileRes, attendanceRes, leavesRes] = await Promise.all([
        apiService.user.getProfile(),
        apiService.attendance.getMyAttendance(),
        apiService.leave.getMyLeaves(),
      ]);

      if (profileRes.success) setUser(profileRes.data);
      if (attendanceRes.success) {
        const history = attendanceRes.data || [];
        setAttendanceHistory(history);

        // Identify today's record
        const today = new Date().toISOString().split("T")[0];
        const todayRecord = history.find((r) => {
          const recordDate = new Date(r.date).toISOString().split("T")[0];
          return recordDate === today;
        });
        setTodayStatus(todayRecord || null);
      }
      if (leavesRes.success) {
        const pending = leavesRes.data?.filter(l => l.status === 'Pending')?.length || 0;
        setPendingLeaves(pending);
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
            <p className="text-gray-500 font-medium">Loading dashboard...</p>
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
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
              Welcome back, {user?.name || "Employee"}!
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Here's your attendance overview for today
            </p>
          </div>
          <Badge variant="info" className="px-4 py-1 w-fit">
            {user?.employeeId || "EMP-001"}
          </Badge>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 animate-in fade-in slide-in-from-top-2">
            <p className="text-sm text-red-600 flex items-center gap-2">
              <AlertCircle size={16} />
              {error}
            </p>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Today's Status"
            value={
              todayStatus?.checkInTime
                ? "Present"
                : "Not Checked In"
            }
            icon={Clock}
            color="blue"
          />

          <StatCard
            label="Working Hours"
            value={`${todayStatus?.workingHours?.toFixed(1) || "0"} hrs`}
            icon={TrendingUp}
            color="emerald"
          />

          <StatCard
            label="Leave Balance"
            value="38 days"
            icon={Calendar}
            color="amber"
          />

          <StatCard
            label="Pending Requests"
            value={String(pendingLeaves)}
            icon={AlertCircle}
            color="rose"
          />
        </div>

        {/* Recent Attendance */}
        <Card className="overflow-hidden shadow-sm border-slate-200">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold text-gray-800">Recent Attendance</CardTitle>
            <span className="text-xs text-gray-400">Last 5 records</span>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 bg-slate-50/30 uppercase text-[10px] font-semibold tracking-widest">
                    <th className="text-left px-4 md:px-6 py-4">Date</th>
                    <th className="text-left px-4 md:px-6 py-4">Check-in</th>
                    <th className="text-left px-4 md:px-6 py-4 hidden sm:table-cell">Check-out</th>
                    <th className="text-left px-4 md:px-6 py-4">Hours</th>
                    <th className="text-left px-4 md:px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentAttendance.length > 0 ? (
                    recentAttendance.map((record, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="px-4 md:px-6 py-4 text-gray-900 font-medium">
                          {new Date(record.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-4 md:px-6 py-4 text-gray-600">
                          {record.checkInTime
                            ? new Date(record.checkInTime).toLocaleTimeString(
                                "en-US",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: true,
                                },
                              )
                            : "-"}
                        </td>
                        <td className="px-4 md:px-6 py-4 text-gray-600 hidden sm:table-cell">
                          {record.checkOutTime
                            ? new Date(record.checkOutTime).toLocaleTimeString(
                                "en-US",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: true,
                                },
                              )
                            : "-"}
                        </td>
                        <td className="px-4 md:px-6 py-4 text-gray-700 font-medium">
                          {record.workingHours?.toFixed(1) || "0"}
                        </td>
                        <td className="px-4 md:px-6 py-4">
                          <Badge
                            variant={
                              record.status === "Present"
                                ? "success"
                                : record.status === "Absent"
                                  ? "danger"
                                  : "secondary"
                            }
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
                        className="px-6 py-10 text-center text-gray-400"
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
  const colorMap = {
    blue: "text-blue-600 bg-blue-50",
    emerald: "text-emerald-600 bg-emerald-50",
    amber: "text-amber-600 bg-amber-50",
    rose: "text-rose-600 bg-rose-50",
  };

  return (
    <Card className="hover:shadow-md transition-shadow border-slate-200">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">
              {label}
            </p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">{value}</p>
          </div>
          <div
            className={`p-3 rounded-xl ${colorMap[color] || colorMap.blue}`}
          >
            <Icon size={22} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmployeeDashboard;

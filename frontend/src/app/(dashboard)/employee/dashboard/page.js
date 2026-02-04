"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Clock, Calendar, AlertCircle, TrendingUp } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { apiService } from "@/lib/api";

const EmployeeDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [todayStatus, setTodayStatus] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [error, setError] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch profile and attendance in parallel for better performance
      const [profileRes, attendanceRes] = await Promise.all([
        apiService.user.getProfile(),
        apiService.attendance.getMyAttendance(),
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="employee">
      <div className="space-y-6 md:space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
              Welcome back, {user?.firstName || user?.name || "Employee"}!
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-gray-600 mt-1">
              Here's your attendance overview for today
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="info" className="px-4 py-1">
              {user?.employeeId || "EMP-001"}
            </Badge>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 md:p-4 animate-in fade-in slide-in-from-top-2">
            <p className="text-xs sm:text-sm text-red-600 flex items-center gap-2">
              <AlertCircle size={16} />
              {error}
            </p>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <StatCard
            label="Today's Status"
            value={
              todayStatus?.status === "checked-in"
                ? "Present"
                : "Not Checked In"
            }
            icon={Clock}
            badgeVariant={
              todayStatus?.status === "checked-in" ? "success" : "secondary"
            }
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
            value={`${user?.leaveBalance || "0"} days`}
            icon={Calendar}
            color="amber"
          />

          <StatCard
            label="Pending Approvals"
            value="0"
            icon={AlertCircle}
            color="rose"
          />
        </div>

        {/* Recent Attendance */}
        <Card className="overflow-hidden shadow-sm border-slate-200">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100">
            <CardTitle className="text-gray-800">Recent Attendance</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 bg-slate-50/30 uppercase text-[10px] font-black tracking-widest">
                    <th className="text-left px-6 py-4">Date</th>
                    <th className="text-left px-6 py-4">Check-in</th>
                    <th className="text-left px-6 py-4">Check-out</th>
                    <th className="text-left px-6 py-4">Hours</th>
                    <th className="text-left px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {attendanceHistory.length > 0 ? (
                    attendanceHistory.map((record, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="px-6 py-4 text-gray-900 font-medium">
                          {new Date(record.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
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
                        <td className="px-6 py-4 text-gray-600">
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
                        <td className="px-6 py-4 text-gray-900 font-bold">
                          {record.workingHours?.toFixed(1) || "0"}
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
                        className="px-6 py-10 text-center text-gray-400 italic"
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

        {/* Quick Actions */}
        <div className="flex flex-col sm:flex-row gap-3 md:gap-4 pt-4">
          <Button
            variant="primary"
            size="lg"
            className="w-full sm:w-auto shadow-lg shadow-blue-500/20"
          >
            Check In Now
          </Button>
          <Button variant="secondary" size="lg" className="w-full sm:w-auto">
            View Full Attendance
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

const StatCard = ({ label, value, icon: Icon, badgeVariant, color }) => {
  const colorMap = {
    blue: "text-blue-600 bg-blue-50",
    emerald: "text-emerald-600 bg-emerald-50",
    amber: "text-amber-600 bg-amber-50",
    rose: "text-rose-600 bg-rose-50",
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-xs font-black uppercase tracking-widest">
              {label}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-2xl font-black text-gray-900">{value}</span>
              {badgeVariant && (
                <Badge variant={badgeVariant} className="scale-75 origin-left">
                  {value}
                </Badge>
              )}
            </div>
          </div>
          <div
            className={`p-3 rounded-2xl ${colorMap[color] || colorMap.blue}`}
          >
            <Icon size={24} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmployeeDashboard;

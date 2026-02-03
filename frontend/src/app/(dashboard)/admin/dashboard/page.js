"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Users, Clock, Calendar, BarChart3, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import apiService from "@/lib/api";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    absentToday: 0,
    pendingLeaves: 0,
    avgAttendance: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [usersRes, todayAttendanceRes, leavesRes] = await Promise.all([
        apiService.user.getAll(),
        apiService.attendance.getTeamAttendance(),
        apiService.leave.getPendingLeaves(),
      ]);

      // Handle paginated response from users API
      const employees = usersRes.data?.records || usersRes.data || [];
      const attendance = todayAttendanceRes.data?.records || [];
      const pendingLeaves = leavesRes.data || [];

      // Get all employees
      const totalEmployees = Array.isArray(employees) ? employees.length : 0;

      // Calculate today's attendance
      const today = new Date().toISOString().split("T")[0];
      const todayAttendance = attendance.filter((a) => {
        const attendanceDate = new Date(a.date).toISOString().split("T")[0];
        return attendanceDate === today;
      });

      // Get unique employee IDs that checked in today
      const presentEmployeeIds = new Set(
        todayAttendance
          .filter(
            (a) =>
              a.checkInTime && a.status !== "Absent" && a.status !== "Leave",
          )
          .map((a) => a.userId._id || a.userId),
      );
      const presentToday = presentEmployeeIds.size;
      const absentToday = Math.max(0, totalEmployees - presentToday);
      const avgAttendance =
        totalEmployees > 0
          ? Math.round((presentToday / totalEmployees) * 100)
          : 0;

      setStats({
        totalEmployees: totalEmployees || 0,
        presentToday: presentToday || 0,
        absentToday: absentToday || 0,
        pendingLeaves: Array.isArray(pendingLeaves) ? pendingLeaves.length : 0,
        avgAttendance: !isNaN(avgAttendance) ? avgAttendance : 0,
      });
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError(err.message || "Failed to load dashboard data");
      // Set default values on error to prevent NaN
      setStats({
        totalEmployees: 0,
        presentToday: 0,
        absentToday: 0,
        pendingLeaves: 0,
        avgAttendance: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <DashboardLayout role="admin">
        <div className="space-y-6 md:space-y-8">
          <div>
            <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-gray-900">
              Admin Dashboard
            </h1>
          </div>
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-4 md:pt-6">
              <p className="text-xs sm:text-sm text-red-700">{error}</p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6 md:space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Admin Dashboard</h1>
          <p className="text-sm text-gray-500">
            System-wide attendance and leave management
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
          <Card className="h-full hover:shadow-lg transition-all duration-200 border-gray-100/60 group">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Total Employees</p>
                  <p className="text-3xl font-bold text-gray-900 tracking-tight">
                    {loading ? "..." : stats.totalEmployees}
                  </p>
                </div>
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform duration-200">
                  <Users size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="h-full hover:shadow-lg transition-all duration-200 border-gray-100/60 group">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Present Today</p>
                  <p className="text-3xl font-bold text-green-600 tracking-tight">
                    {loading ? "..." : stats.presentToday}
                  </p>
                </div>
                <div className="p-3 bg-green-50 text-green-600 rounded-xl group-hover:scale-110 transition-transform duration-200">
                  <Clock size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="h-full hover:shadow-lg transition-all duration-200 border-gray-100/60 group">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Absent Today</p>
                  <p className="text-3xl font-bold text-red-600 tracking-tight">
                    {loading ? "..." : stats.absentToday}
                  </p>
                </div>
                <div className="p-3 bg-red-50 text-red-600 rounded-xl group-hover:scale-110 transition-transform duration-200">
                  <AlertCircle size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="h-full hover:shadow-lg transition-all duration-200 border-gray-100/60 group">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Pending Leaves</p>
                  <p className="text-3xl font-bold text-yellow-600 tracking-tight">
                    {loading ? "..." : stats.pendingLeaves}
                  </p>
                </div>
                <div className="p-3 bg-yellow-50 text-yellow-600 rounded-xl group-hover:scale-110 transition-transform duration-200">
                  <Calendar size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="h-full hover:shadow-lg transition-all duration-200 border-gray-100/60 group">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Avg. Attendance</p>
                  <p className="text-3xl font-bold text-purple-600 tracking-tight">
                    {loading ? "..." : stats.avgAttendance}<span className="text-lg align-top ml-0.5">%</span>
                  </p>
                </div>
                <div className="p-3 bg-purple-50 text-purple-600 rounded-xl group-hover:scale-110 transition-transform duration-200">
                  <BarChart3 size={24} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 md:space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <span className="text-sm md:text-base text-gray-700">
                  Database
                </span>
                <Badge variant="success">Connected</Badge>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <span className="text-sm md:text-base text-gray-700">
                  API Server
                </span>
                <Badge variant="success">Active</Badge>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <span className="text-sm md:text-base text-gray-700">
                  Reports
                </span>
                <Badge variant="success">Running</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

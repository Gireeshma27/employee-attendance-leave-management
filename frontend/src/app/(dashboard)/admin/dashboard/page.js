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

      const employees = usersRes.data || [];
      const attendance = todayAttendanceRes.data?.records || [];
      const pendingLeaves = leavesRes.data || [];

      // Get all employees
      const totalEmployees = employees.length;

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
      const absentToday = totalEmployees - presentToday;
      const avgAttendance =
        totalEmployees > 0
          ? Math.round((presentToday / totalEmployees) * 100)
          : 0;

      setStats({
        totalEmployees,
        presentToday,
        absentToday,
        pendingLeaves: pendingLeaves.length,
        avgAttendance,
      });
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <DashboardLayout role="admin">
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Admin Dashboard
            </h1>
          </div>
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-700">{error}</p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">
            System-wide attendance and leave management
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-xs">Total Employees</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {loading ? "..." : stats.totalEmployees}
                  </p>
                </div>
                <Users className="text-blue-600" size={28} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-xs">Present Today</p>
                  <p className="text-2xl font-bold text-green-600 mt-2">
                    {loading ? "..." : stats.presentToday}
                  </p>
                </div>
                <Clock className="text-green-600" size={28} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-xs">Absent Today</p>
                  <p className="text-2xl font-bold text-red-600 mt-2">
                    {loading ? "..." : stats.absentToday}
                  </p>
                </div>
                <AlertCircle className="text-red-600" size={28} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-xs">Pending Leaves</p>
                  <p className="text-2xl font-bold text-yellow-600 mt-2">
                    {loading ? "..." : stats.pendingLeaves}
                  </p>
                </div>
                <Calendar className="text-yellow-600" size={28} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-xs">Avg. Attendance</p>
                  <p className="text-2xl font-bold text-purple-600 mt-2">
                    {loading ? "..." : stats.avgAttendance}%
                  </p>
                </div>
                <BarChart3 className="text-purple-600" size={28} />
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
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Database</span>
                <Badge variant="success">Connected</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">API Server</span>
                <Badge variant="success">Active</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Reports</span>
                <Badge variant="success">Running</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

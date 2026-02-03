"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Clock, AlertCircle, Users, TrendingUp } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { apiService } from "@/lib/api";

/**
 * @description Modernized Manager Dashboard with standardized state management and API calls.
 */
const ManagerDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    teamSize: 0,
    presentToday: 0,
    absentToday: 0,
    pendingApprovals: 0,
  });
  const [teamData, setTeamData] = useState([]);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [attendanceRes, leavesRes] = await Promise.all([
        apiService.attendance.getTeamAttendance(),
        apiService.leave.getPendingLeaves(),
      ]);

      const attendance = attendanceRes.data?.records || [];
      const pending = leavesRes.data || [];

      // Extract unique team members from attendance records
      const uniqueTeamMembers = new Map();
      attendance.forEach((record) => {
        if (record.userId && !uniqueTeamMembers.has(record.userId._id)) {
          uniqueTeamMembers.set(record.userId._id, record.userId);
        }
      });
      const team = Array.from(uniqueTeamMembers.values());

      // Calculate stats
      const today = new Date().toISOString().split("T")[0];
      const todayAttendance = attendance.filter((a) => {
        const attendanceDate = new Date(a.date).toISOString().split("T")[0];
        return attendanceDate === today;
      });

      const presentCount = todayAttendance.filter(
        (a) => a.checkInTime || a.checkIn,
      ).length;
      const absentCount = Math.max(0, team.length - presentCount);

      setStats({
        teamSize: team.length,
        presentToday: presentCount,
        absentToday: absentCount,
        pendingApprovals: pending.length,
      });

      setTeamData(team.slice(0, 5)); // Show first 5 team members
    } catch (err) {
      console.error("[MANAGER DASHBOARD ERROR]:", err);
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
      <DashboardLayout role="manager">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Syncing team data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="manager">
      <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            Manager Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Real-time team attendance and performance metrics
          </p>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex items-center gap-3 animate-in slide-in-from-top-2">
            <AlertCircle className="text-rose-500" size={20} />
            <p className="text-rose-600 text-xs md:text-sm font-bold">
              {error}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Team Size"
            value={stats.teamSize}
            icon={Users}
            color="blue"
          />
          <StatCard
            label="Present Today"
            value={stats.presentToday}
            icon={Clock}
            color="emerald"
          />
          <StatCard
            label="Absent Today"
            value={stats.absentToday}
            icon={AlertCircle}
            color="rose"
          />
          <StatCard
            label="Pending"
            value={stats.pendingApprovals}
            icon={TrendingUp}
            color="amber"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Team Attendance Today</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs md:text-sm text-left">
                  <thead>
                    <tr className="text-slate-400 bg-slate-50/50 uppercase text-[10px] font-black tracking-widest border-b border-slate-100">
                      <th className="py-4 px-6">Employee</th>
                      <th className="py-4 px-6 hidden sm:table-cell">
                        Check-in
                      </th>
                      <th className="py-4 px-6 hidden md:table-cell">
                        Check-out
                      </th>
                      <th className="py-4 px-6">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {teamData.map((member, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="py-4 px-6 text-slate-900 font-bold">
                          {member.name}
                        </td>
                        <td className="py-4 px-6 text-slate-500">-</td>
                        <td className="py-4 px-6 text-slate-500">-</td>
                        <td className="py-4 px-6">
                          <Badge variant="info">Active</Badge>
                        </td>
                      </tr>
                    ))}
                    {teamData.length === 0 && (
                      <tr>
                        <td
                          colSpan="4"
                          className="py-10 text-center text-slate-400 italic"
                        >
                          No team data available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Team Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {teamData.map((emp, idx) => (
                <div key={idx} className="group cursor-default">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-slate-700 group-hover:text-blue-600 transition-colors">
                      {emp.name}
                    </h4>
                    <span className="text-xs font-black text-slate-900">
                      85%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden p-[1px] border border-slate-200/50">
                    <div
                      className="bg-blue-600 h-full rounded-full shadow-lg shadow-blue-600/20 transition-all duration-1000"
                      style={{ width: "85%" }}
                    />
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">
                    Avg. 8.2h/day
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

const StatCard = ({ label, value, icon: Icon, color }) => {
  const colors = {
    blue: "text-blue-600 bg-blue-50",
    emerald: "text-emerald-600 bg-emerald-50",
    rose: "text-rose-600 bg-rose-50",
    amber: "text-amber-600 bg-amber-50",
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
              {label}
            </p>
            <p className="text-3xl font-black text-slate-900 tracking-tighter">
              {value}
            </p>
          </div>
          <div className={`p-3.5 rounded-2xl ${colors[color] || colors.blue}`}>
            <Icon size={24} strokeWidth={2.5} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ManagerDashboard;

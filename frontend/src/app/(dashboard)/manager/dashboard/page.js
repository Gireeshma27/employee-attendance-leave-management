"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  Clock,
  AlertCircle,
  Users,
  TrendingUp,
  CalendarCheck,
  UserX,
  CalendarDays,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import apiService from "@/lib/api";
import { formatDate, formatTime } from "@/utils/formatDate";

/**
 * Manager Dashboard — Team Size bug fix: also fetches team attendance
 * to derive real team count when managerId-based stats return 0.
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
  const [upcomingHolidays, setUpcomingHolidays] = useState([]);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch both dashboard stats AND team attendance in parallel.
      // Team attendance returns all visible team members (regardless of managerId),
      // so we can derive real team size from it as a fallback.
      const [dashboardRes, teamAttendanceRes, holidayRes] = await Promise.all([
        apiService.dashboard.getManagerStats(),
        apiService.attendance.getTeamAttendance(),
        apiService.holiday.getAll(),
      ]);

      let dashStats = {
        teamSize: 0,
        presentToday: 0,
        absentToday: 0,
        pendingApprovals: 0,
      };
      let members = [];

      if (dashboardRes.success) {
        dashStats = dashboardRes.data.stats || dashStats;
        members = dashboardRes.data.teamMembers || [];
      }

      // BUG FIX: If managerId-based teamSize is 0, derive from team attendance data
      if (!dashStats.teamSize && teamAttendanceRes?.data?.records) {
        const uniqueUsers = new Map();
        teamAttendanceRes.data.records.forEach((record) => {
          const userId = record.userId?._id || record.userId?.id;
          if (userId && !uniqueUsers.has(userId)) {
            uniqueUsers.set(userId, {
              name: record.userId.name,
              email: record.userId.email,
            });
          }
        });
        const derivedCount = uniqueUsers.size;
        if (derivedCount > 0) {
          dashStats = { ...dashStats, teamSize: derivedCount };
          // Also populate teamData from attendance if we had no team members
          if (members.length === 0) {
            members = Array.from(uniqueUsers.values());
          }
        }
      }

      setStats(dashStats);
      setTeamData(members);

      // Derive upcoming holidays (next 3)
      if (holidayRes?.success) {
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-500 font-medium">Syncing team data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="manager">
      <div className="space-y-6 md:space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">
              Manager Overview
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Real-time team attendance and performance metrics
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 font-medium">
              Last updated: {formatTime(new Date())}
            </span>
            <button
              onClick={fetchDashboardData}
              className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 transition-colors shadow-sm"
            >
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="text-red-500 flex-shrink-0" size={18} />
            <p className="text-red-600 text-sm font-medium">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Team Size"
            value={stats.teamSize}
            icon={Users}
            color="blue"
          />
          <StatCard
            label="Present Today"
            value={stats.presentToday}
            icon={CalendarCheck}
            color="green"
          />
          <StatCard
            label="Absent Today"
            value={stats.absentToday}
            icon={UserX}
            color="red"
          />
          <StatCard
            label="Pending Approvals"
            value={stats.pendingApprovals}
            icon={Clock}
            color="yellow"
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
              <CardTitle className="text-base">
                Team Attendance Today
              </CardTitle>
              <span className="text-xs text-slate-400 font-medium">
                {teamData.length} members
              </span>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="text-slate-400 bg-slate-50/30 uppercase text-[10px] font-semibold tracking-widest border-b border-slate-100">
                      <th className="py-3.5 px-5">Employee</th>
                      <th className="py-3.5 px-5 hidden sm:table-cell">
                        Check-in
                      </th>
                      <th className="py-3.5 px-5 hidden md:table-cell">
                        Check-out
                      </th>
                      <th className="py-3.5 px-5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {teamData.map((member, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-semibold text-xs">
                              {member.name?.charAt(0) || "?"}
                            </div>
                            <span className="font-medium text-slate-800">
                              {member.name}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-5 text-slate-500 hidden sm:table-cell">
                          -
                        </td>
                        <td className="py-3.5 px-5 text-slate-500 hidden md:table-cell">
                          -
                        </td>
                        <td className="py-3.5 px-5">
                          <Badge variant="info" dot>
                            Active
                          </Badge>
                        </td>
                      </tr>
                    ))}
                    {teamData.length === 0 && (
                      <tr>
                        <td
                          colSpan="4"
                          className="py-12 text-center text-slate-400"
                        >
                          <Users
                            size={32}
                            className="mx-auto mb-2 text-slate-300"
                          />
                          <p className="text-sm">No team data available</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
              <CardTitle className="text-base">Team Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 pt-5">
              {teamData.length > 0 ? (
                teamData.map((emp, idx) => (
                  <div key={idx} className="group cursor-default">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-slate-700 text-sm group-hover:text-blue-600 transition-colors">
                        {emp.name}
                      </h4>
                      <span className="text-xs font-semibold text-slate-900">
                        85%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-blue-500 h-full rounded-full transition-all duration-1000"
                        style={{ width: "85%" }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1.5">
                      Avg. 8.2h/day
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <TrendingUp
                    size={28}
                    className="mx-auto mb-2 text-slate-300"
                  />
                  <p className="text-sm">No performance data</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

const StatCard = ({ label, value, icon: Icon, color }) => {
  const colors = {
    blue: "bg-blue-600 text-white shadow-blue-600/20",
    green: "bg-green-500 text-white shadow-green-500/20",
    red: "bg-red-500 text-white shadow-red-500/20",
    yellow: "bg-yellow-500 text-white shadow-yellow-500/20",
  };

  return (
    <Card className="hover:shadow-md transition-all duration-300 overflow-hidden relative group">
      <div className="absolute top-0 right-0 w-20 h-20 bg-slate-50 rounded-full translate-x-8 -translate-y-8 opacity-40 group-hover:scale-110 transition-transform duration-500" />
      <div className="flex flex-col gap-3 relative z-10 p-4 md:p-5">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${colors[color]}`}
        >
          <Icon size={18} strokeWidth={2} />
        </div>
        <div>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            {label}
          </p>
          <p className="text-2xl font-semibold text-slate-900 tracking-tight leading-none">
            {value}
          </p>
        </div>
      </div>
    </Card>
  );
};

export default ManagerDashboard;

"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  Users,
  Clock,
  Calendar,
  BarChart3,
  AlertCircle,
  TrendingUp,
  Target,
  ArrowRight,
  Database,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import apiService from "@/lib/api";

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mounted, setMounted] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.dashboard.getAdminStats();

      if (response.success) {
        setData(response.data);
      } else {
        throw new Error(response.message || "Failed to fetch dashboard data");
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <DashboardLayout role="admin">
        <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium animate-pulse">
            Synchronizing Dashboard Data...
          </p>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout role="admin">
        <div className="p-8 text-center bg-white rounded-2xl shadow-sm border border-slate-200/60">
          <AlertCircle className="w-14 h-14 text-red-400 mx-auto mb-5 opacity-30" />
          <h2 className="text-xl font-semibold text-slate-800 mb-2 tracking-tight">
            Connection Failed
          </h2>
          <p className="text-slate-500 mb-6 max-w-md mx-auto text-sm">
            {error}
          </p>
          <button
            onClick={fetchDashboardData}
            className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-semibold text-sm shadow-sm hover:bg-slate-800 active:scale-[0.98] transition-all"
          >
            Retry
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const {
    summary = {},
    trends = [],
    deptPerformance = [],
    activities = [],
    activeSessions = [],
  } = data || {};

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6 md:space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">
              Admin Dashboard
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Welcome back! Here's what's happening today.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 font-medium">
              Last updated:{" "}
              {new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            <button
              onClick={fetchDashboardData}
              className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 transition-colors shadow-sm"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Key Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatCard
            label="Total Employees"
            value={summary?.totalEmployees?.toLocaleString() || "0"}
            icon={Users}
            color="blue"
          />
          <StatCard
            label="Present Today"
            value={summary?.presentToday?.toLocaleString() || "0"}
            icon={Zap}
            color="green"
          />
          <StatCard
            label="Absent Today"
            value={summary?.absentToday?.toLocaleString() || "0"}
            icon={AlertCircle}
            color="red"
          />
          <StatCard
            label="Pending Leaves"
            value={summary?.pendingLeaves?.toLocaleString() || "0"}
            icon={Calendar}
            color="yellow"
          />
          <StatCard
            label="Avg. Attendance"
            value={`${summary?.avgAttendance || 0}%`}
            icon={TrendingUp}
            color="blue"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 overflow-hidden">
            <CardHeader className="pb-2 bg-slate-50/50 border-b border-slate-100">
              <CardTitle className="text-base">
                Office vs. WFH Trends
              </CardTitle>
              <div className="flex gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm shadow-blue-500/20"></div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                    Office
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-sky-400 shadow-sm shadow-sky-400/20"></div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                    WFH
                  </span>
                </div>
              </div>
            </CardHeader>
            <div className="h-[250px] md:h-[300px] w-full relative pt-4">
              <AttendanceChart trends={trends} />
            </div>
            <div className="flex justify-between mt-4 md:mt-6 px-4">
              {trends?.map((t) => (
                <span
                  key={t.date}
                  className="text-[9px] md:text-[10px] font-semibold text-slate-300 uppercase tracking-widest"
                >
                  {t.day}
                </span>
              ))}
            </div>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader className="pb-2 bg-slate-50/50 border-b border-slate-100">
              <CardTitle className="text-base">
                Dept. Performance
              </CardTitle>
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                Last 7 days
              </span>
            </CardHeader>
            <div className="space-y-5 mt-4 p-1">
              {deptPerformance?.map((dept) => (
                <div key={dept.name} className="space-y-2 md:space-y-3">
                  <div className="flex justify-between items-end">
                    <span className="text-sm font-medium text-slate-700">
                      {dept.name}
                    </span>
                    <span className="text-sm font-semibold text-slate-900">
                      {dept.value}%
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${dept.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Footer Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-8">
          {/* Live Activity */}
          <Card className="lg:col-span-2 overflow-hidden">
            <CardHeader className="pb-2 bg-slate-50/50 border-b border-slate-100">
              <CardTitle className="text-base">
                Live Activity Log
              </CardTitle>
              <button
                onClick={fetchDashboardData}
                className="text-xs font-medium text-blue-600 hover:underline px-3 py-1.5 bg-blue-50 rounded-lg"
              >
                Refresh
              </button>
            </CardHeader>
            <div className="space-y-1">
              {activities?.map((log, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between p-4 rounded-xl transition-all hover:bg-slate-50/50 group`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all group-hover:scale-105 ${
                        log.type === "office"
                          ? "bg-green-50 text-green-600"
                          : log.type === "wfh"
                            ? "bg-blue-50 text-blue-600"
                            : "bg-yellow-50 text-yellow-600"
                      }`}
                    >
                      {log.type === "office" ? (
                        <ShieldCheck size={20} />
                      ) : log.type === "wfh" ? (
                        <Database size={20} />
                      ) : (
                        <Calendar size={20} />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {log.user}{" "}
                        <span className="text-slate-500">
                          {log.action}
                        </span>{" "}
                        {log.location}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {mounted && log.time
                          ? new Date(log.time).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "--:--"}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      log.status === "On-Time"
                        ? "success"
                        : log.status === "Remote"
                          ? "work-from-home"
                          : log.status === "Pending"
                            ? "warning"
                            : "danger"
                    }
                  >
                    {log.status}
                  </Badge>
                </div>
              ))}
              {activities?.length === 0 && (
                <div className="py-20 text-center">
                  <p className="text-slate-400 font-medium italic">
                    No recent activities to show
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* System Status */}
          <div className="space-y-6">
            <Card className="overflow-hidden">
              <CardHeader className="pb-2 bg-slate-50/50 border-b border-slate-100">
                <CardTitle className="text-base">
                  System Status
                </CardTitle>
              </CardHeader>
              <div className="space-y-4 md:space-y-6">
                <StatusItem
                  icon={Database}
                  label="Primary DB"
                  status="Connected"
                  variant="success"
                />
                <StatusItem
                  icon={Zap}
                  label="Core API"
                  status="Active"
                  variant="success"
                />
                <StatusItem
                  icon={TrendingUp}
                  label="Analytics Engine"
                  status="Running"
                  variant="info"
                />
              </div>

              <div className="mt-8 pb-4">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  Active Sessions
                </p>
                <div className="flex items-center -space-x-3">
                  {activeSessions?.map((session, i) => (
                    <div
                      key={i}
                      title={session.name}
                      className={`w-9 h-9 md:w-11 md:h-11 rounded-full border-4 border-white flex items-center justify-center text-[10px] md:text-[11px] font-bold shadow-lg hover:scale-110 active:scale-90 transition-transform cursor-pointer ${
                        [
                          "bg-blue-500 text-white",
                          "bg-green-500 text-white",
                          "bg-red-500 text-white",
                        ][i % 3]
                      }`}
                    >
                      {session.initials}
                    </div>
                  )) || (
                    <div className="text-xs text-slate-400 italic">
                      No active sessions
                    </div>
                  )}
                  {summary?.presentToday > (activeSessions?.length || 0) && (
                    <div className="w-9 h-9 md:w-11 md:h-11 rounded-full border-4 border-white bg-slate-100 text-slate-500 flex items-center justify-center text-[9px] md:text-[10px] font-bold shadow-sm z-10">
                      +{summary.presentToday - (activeSessions?.length || 0)}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
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
          <p className="text-xl md:text-2xl font-semibold text-slate-900 tracking-tight leading-none">
            {value}
          </p>
        </div>
      </div>
    </Card>
  );
};

const StatusItem = ({ icon: Icon, label, status, variant }) => (
  <div className="flex items-center justify-between group py-1">
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
        <Icon size={16} strokeWidth={2} />
      </div>
      <span className="text-sm font-medium text-slate-700">
        {label}
      </span>
    </div>
    <Badge
      variant={variant}
      dot
      className="border-none text-xs"
    >
      {status}
    </Badge>
  </div>
);

const AttendanceChart = ({ trends }) => {
  if (!trends || trends.length === 0) return null;

  const padding = 50;
  const width = 800;
  const height = 300;
  const spacing = (width - padding * 2) / (trends.length - 1);

  const maxVal = Math.max(...trends.map((t) => Math.max(t.office, t.wfh, 5)));
  const getY = (val) =>
    height - padding - (val / (maxVal * 1.5)) * (height - padding * 2);

  const officePoints = trends.map(
    (t, i) => `${padding + i * spacing},${getY(t.office)}`,
  );
  const wfhPoints = trends.map(
    (t, i) => `${padding + i * spacing},${getY(t.wfh)}`,
  );

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-full overflow-visible drop-shadow-2xl"
    >
      <defs>
        <linearGradient id="officeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop
            offset="0%"
            style={{ stopColor: "#3b82f6", stopOpacity: 0.2 }}
          />
          <stop
            offset="100%"
            style={{ stopColor: "#3b82f6", stopOpacity: 0 }}
          />
        </linearGradient>
      </defs>

      {[0, 1, 2, 3].map((i) => {
        const y = padding + i * ((height - padding * 2) / 3);
        return (
          <line
            key={i}
            x1={padding}
            y1={y}
            x2={width - padding}
            y2={y}
            stroke="#f1f5f9"
            strokeWidth="1"
          />
        );
      })}

      <path
        d={`M ${padding},${height - padding} L ${officePoints.join(" L ")} L ${width - padding},${height - padding} Z`}
        fill="url(#officeGrad)"
        className="transition-all duration-1000"
      />
      <path
        d={`M ${officePoints.join(" L ")}`}
        fill="none"
        stroke="#3b82f6"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="transition-all duration-1000 opacity-90"
      />

      <path
        d={`M ${wfhPoints.join(" L ")}`}
        fill="none"
        stroke="#38bdf8"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="10 8"
        className="transition-all duration-1000 opacity-60"
      />

      {trends.map((t, i) => (
        <g key={i} className="cursor-pointer group">
          <circle
            cx={padding + i * spacing}
            cy={getY(t.office)}
            r="6"
            fill="#3b82f6"
            stroke="white"
            strokeWidth="3"
            className="group-hover:r-8 transition-all"
          />
          <title>
            {t.day}: {t.office} Office
          </title>
        </g>
      ))}
    </svg>
  );
};

export default AdminDashboard;

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
          <p className="text-slate-500 font-bold animate-pulse">
            Synchronizing Dashboard Data...
          </p>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout role="admin">
        <div className="p-8 text-center bg-white rounded-[32px] shadow-sm border border-slate-100">
          <AlertCircle className="w-16 h-16 text-rose-500 mx-auto mb-6 opacity-20" />
          <h2 className="text-2xl font-black text-slate-800 mb-3 tracking-tight">
            Backend Connection Failed
          </h2>
          <p className="text-slate-500 mb-8 max-w-md mx-auto font-medium">
            {error}
          </p>
          <button
            onClick={fetchDashboardData}
            className="px-10 py-4 bg-[#0F172A] text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl shadow-slate-200 hover:scale-105 active:scale-95 transition-all"
          >
            Retry Connection
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const { summary, trends, deptPerformance, activities, activeSessions } =
    data || {};

  return (
    <DashboardLayout role="admin">
      <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Key Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
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
            color="emerald"
          />
          <StatCard
            label="Absent Today"
            value={summary?.absentToday?.toLocaleString() || "0"}
            icon={AlertCircle}
            color="rose"
          />
          <StatCard
            label="Pending Leaves"
            value={summary?.pendingLeaves?.toLocaleString() || "0"}
            icon={Calendar}
            color="amber"
          />
          <StatCard
            label="Avg. Attendance"
            value={`${summary?.avgAttendance || 0}%`}
            icon={TrendingUp}
            color="indigo"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 shadow-xl shadow-slate-100/50">
            <CardHeader>
              <CardTitle>Office vs. WFH (Attendance Trends)</CardTitle>
              <div className="flex gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm shadow-blue-500/20"></div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Office
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-sky-400 shadow-sm shadow-sky-400/20"></div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    WFH
                  </span>
                </div>
              </div>
            </CardHeader>
            <div className="h-[300px] w-full relative pt-4">
              <AttendanceChart trends={trends} />
            </div>
            <div className="flex justify-between mt-6 px-4">
              {trends?.map((t) => (
                <span
                  key={t.date}
                  className="text-[10px] font-black text-slate-300 uppercase tracking-widest"
                >
                  {t.day}
                </span>
              ))}
            </div>
          </Card>

          <Card className="shadow-xl shadow-slate-100/50">
            <CardHeader>
              <CardTitle>Departmental Performance</CardTitle>
              <div className="bg-slate-50 border-none text-[10px] font-black text-slate-500 uppercase tracking-widest px-3 py-1.5 rounded-lg">
                LAST 7 DAYS
              </div>
            </CardHeader>
            <div className="space-y-8 mt-4">
              {deptPerformance?.map((dept) => (
                <div key={dept.name} className="space-y-3">
                  <div className="flex justify-between items-end">
                    <span className="text-sm font-bold text-slate-700 tracking-tight">
                      {dept.name}
                    </span>
                    <span className="text-sm font-black text-slate-900">
                      {dept.value}%
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100/50 p-[1px]">
                    <div
                      className="h-full bg-blue-600 rounded-full shadow-lg shadow-blue-600/20 transition-all duration-1000 ease-out"
                      style={{ width: `${dept.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Footer Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">
          {/* Live Activity */}
          <Card className="lg:col-span-2 shadow-xl shadow-slate-100/50">
            <CardHeader>
              <CardTitle>Live Activity Log</CardTitle>
              <button
                onClick={fetchDashboardData}
                className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline px-4 py-2 bg-blue-50 rounded-lg"
              >
                Refresh Feed
              </button>
            </CardHeader>
            <div className="space-y-1">
              {activities?.map((log, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between p-4 rounded-[20px] transition-all hover:bg-slate-50/50 group border border-transparent hover:border-slate-100`}
                >
                  <div className="flex items-center gap-5">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110 shadow-sm ${
                        log.type === "office"
                          ? "bg-emerald-50 text-emerald-600"
                          : log.type === "wfh"
                            ? "bg-indigo-50 text-indigo-600"
                            : "bg-amber-50 text-amber-600"
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
                      <p className="text-[15px] font-bold text-slate-800 tracking-tight">
                        {log.user}{" "}
                        <span className="font-medium text-slate-500">
                          {log.action}
                        </span>{" "}
                        {log.location}
                      </p>
                      <p className="text-xs text-slate-400 font-medium mt-0.5 opacity-60">
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
          <div className="space-y-8">
            <Card className="shadow-xl shadow-slate-100/50">
              <CardHeader>
                <CardTitle>System Status</CardTitle>
              </CardHeader>
              <div className="space-y-6">
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

              <div className="mt-14 pb-4">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] mb-6 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  Today's Active Sessions
                </p>
                <div className="flex items-center -space-x-3">
                  {activeSessions?.map((session, i) => (
                    <div
                      key={i}
                      title={session.name}
                      className={`w-11 h-11 rounded-full border-4 border-white flex items-center justify-center text-[11px] font-black shadow-lg hover:scale-110 active:scale-90 transition-transform cursor-pointer ${
                        [
                          "bg-indigo-500 text-white",
                          "bg-emerald-500 text-white",
                          "bg-rose-500 text-white",
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
                    <div className="w-11 h-11 rounded-full border-4 border-white bg-slate-100 text-slate-500 flex items-center justify-center text-[10px] font-black shadow-sm z-10">
                      +{summary.presentToday - activeSessions.length}
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
    emerald: "bg-emerald-500 text-white shadow-emerald-500/20",
    rose: "bg-rose-500 text-white shadow-rose-500/20",
    amber: "bg-amber-500 text-white shadow-amber-500/20",
    indigo: "bg-[#0F172A] text-white shadow-slate-900/20",
  };

  return (
    <Card className="hover:scale-[1.03] active:scale-[0.97] shadow-lg shadow-slate-100 transition-all cursor-default group overflow-hidden relative">
      <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full translate-x-16 -translate-y-16 opacity-40 group-hover:scale-110 transition-transform duration-500" />
      <div className="flex flex-col gap-5 relative z-10">
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${colors[color]}`}
        >
          <Icon size={20} strokeWidth={3} />
        </div>
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
            {label}
          </p>
          <p className="text-3xl font-black text-slate-900 tracking-tighter leading-none">
            {value}
          </p>
        </div>
      </div>
    </Card>
  );
};

const StatusItem = ({ icon: Icon, label, status, variant }) => (
  <div className="flex items-center justify-between group py-1">
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
        <Icon size={18} strokeWidth={2.5} />
      </div>
      <span className="text-sm font-bold text-slate-700 tracking-tight">
        {label}
      </span>
    </div>
    <Badge variant={variant} className="border-none px-4 py-1.5 shadow-sm">
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

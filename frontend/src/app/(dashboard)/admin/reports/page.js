"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  Users,
  Clock,
  Calendar,
  BarChart3,
  AlertCircle,
  TrendingUp,
  Target,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  Eye,
  ArrowUpRight,
  Monitor,
  CheckCircle2,
} from "lucide-react";
import { useState, useEffect } from "react";
import apiService from "@/lib/api";

export default function AdminReports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [timeRange, setTimeRange] = useState("Monthly");
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchReportData();
  }, [timeRange]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.report.getAdminData({
        period: timeRange.toLowerCase(),
      });
      if (response.success) {
        setData(response.data);
      } else {
        throw new Error(response.message || "Failed to fetch report data");
      }
    } catch (err) {
      console.error("Error fetching report data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExportToExcel = async () => {
    setIsExporting(true);
    try {
      await apiService.report.exportToExcel({
        period: timeRange.toLowerCase(),
      });
    } catch (err) {
      console.error("Error exporting to Excel:", err);
      alert("Failed to export report to Excel");
    } finally {
      setIsExporting(false);
    }
  };

  if (loading && !data) {
    return (
      <DashboardLayout role="admin">
        <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium animate-pulse">
            Generating Reports...
          </p>
        </div>
      </DashboardLayout>
    );
  }

  const { stats, deptPerformance, availability, employees } = data || {};

  return (
    <DashboardLayout role="admin">
      <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Header with Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex bg-white p-1 rounded-2xl border border-slate-100 shadow-sm w-fit">
            {["Weekly", "Monthly", "Yearly"].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-6 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-widest transition-all ${
                  timeRange === range
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                    : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-white px-5 py-3 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
              <Calendar size={18} className="text-slate-400" />
              <span className="text-xs font-semibold text-slate-700 tracking-tight">
                Jan 01, 2026 - Jan 31, 2026
              </span>
            </div>
            <button 
              onClick={handleExportToExcel}
              disabled={isExporting}
              className="flex items-center gap-3 px-6 py-3 bg-blue-600 text-white rounded-2xl font-semibold uppercase tracking-widest text-[11px] shadow-xl shadow-blue-600/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileSpreadsheet size={18} />
              {isExporting ? "Exporting..." : "Export to Excel"}
            </button>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <ReportStatCard
            label="Active WFH Users"
            value={stats?.activeWFH?.value || "0"}
            trend={stats?.activeWFH?.trend}
            icon={Monitor}
            color="blue"
          />
          <ReportStatCard
            label="Avg. Attendance Rate"
            value={stats?.attendanceRate?.value || "0%"}
            trend={stats?.attendanceRate?.trend}
            icon={CheckCircle2}
            color="indigo"
          />
          <ReportStatCard
            label="Avg. Clock-in Time"
            value={stats?.avgClockIn?.value || "00:00"}
            trend={stats?.avgClockIn?.trend}
            icon={Clock}
            color="amber"
          />
          <ReportStatCard
            label="Pending Leaves"
            value={stats?.pendingLeaves?.value || "0"}
            trend={stats?.pendingLeaves?.trend}
            icon={Calendar}
            color="emerald"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <Card className="lg:col-span-3 shadow-xl shadow-slate-100/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Departmental Performance Comparison</CardTitle>
              <button className="text-slate-400 hover:text-slate-600">
                <AlertCircle size={20} />
              </button>
            </CardHeader>
            <div className="h-[300px] w-full pt-6 flex items-end justify-between px-6">
              {deptPerformance?.map((dept, i) => (
                <div
                  key={dept.name}
                  className="flex flex-col items-center gap-4 w-full px-2"
                >
                  <div className="w-full relative group">
                    <div className="absolute bottom-0 w-full bg-slate-100 rounded-t-2xl opacity-40 h-[250px]" />
                    <div
                      className="absolute bottom-0 w-full bg-blue-500 rounded-t-2xl shadow-lg shadow-blue-500/20 transition-all duration-1000 ease-out cursor-pointer hover:bg-blue-600"
                      style={{ height: `${dept.value * 2.5}px` }}
                    >
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#0F172A] text-white text-[10px] font-semibold px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {dept.value}% Score
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                    {dept.name}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="lg:col-span-2 shadow-xl shadow-slate-100/50 flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-slate-50 rounded-full translate-x-20 -translate-y-20 opacity-40" />
            <CardHeader className="w-full">
              <CardTitle>Staff Availability</CardTitle>
              <div className="flex gap-4 mt-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-tighter">
                    On-site
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-tighter">
                    Remote
                  </span>
                </div>
              </div>
            </CardHeader>
            <div className="relative w-64 h-64 flex items-center justify-center my-6">
              <svg
                className="w-full h-full -rotate-90 transform"
                viewBox="0 0 100 100"
              >
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="#f1f5f9"
                  strokeWidth="10"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="#3b82f6"
                  strokeWidth="10"
                  strokeDasharray="251.2"
                  strokeDashoffset={
                    251.2 - (251.2 * (availability?.rate || 0)) / 100
                  }
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-1000 ease-out"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="#10b981"
                  strokeWidth="10"
                  strokeDasharray="251.2"
                  strokeDashoffset={
                    251.2 - (251.2 * (availability?.remote || 0)) / 100
                  }
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-1000 ease-out opacity-20"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-4xl font-bold text-slate-900 tracking-tighter">
                  {availability?.rate || 0}%
                </span>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em] mt-1">
                  Available
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Employee Report Table */}
        <Card className="shadow-xl shadow-slate-100/50 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 pb-6">
            <CardTitle>Comprehensive Employee Report</CardTitle>
            <div className="flex gap-4">
              <select className="bg-slate-50 border border-slate-200 text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-4 py-2 rounded-xl focus:ring-0">
                <option>Status: All</option>
                <option>On-site</option>
                <option>Remote</option>
              </select>
              <select className="bg-slate-50 border border-slate-200 text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-4 py-2 rounded-xl focus:ring-0">
                <option>Dept: All</option>
                <option>IT</option>
                <option>HR</option>
              </select>
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/50">
                  {[
                    "Employee",
                    "ID",
                    "Department",
                    "Status",
                    "Days Present",
                    "Late Marks",
                    "Efficiency",
                    "Actions",
                  ].map((head) => (
                    <th
                      key={head}
                      className="text-left px-8 py-5 text-[10px] font-semibold text-slate-400 uppercase tracking-widest whitespace-nowrap"
                    >
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {employees?.map((emp) => (
                  <tr
                    key={emp.id}
                    className="hover:bg-slate-50/50 transition-colors group"
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-[#0F172A] rounded-full flex items-center justify-center text-white text-[10px] font-bold">
                          {emp.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>
                        <p className="text-sm font-semibold text-slate-800">
                          {emp.name}
                        </p>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-[11px] font-semibold text-slate-400 font-mono tracking-tight">
                      {emp.employeeId}
                    </td>
                    <td className="px-8 py-6 text-sm font-medium text-slate-600">
                      {emp.department}
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${
                            emp.status === "On-site"
                              ? "bg-emerald-500"
                              : emp.status === "Remote"
                                ? "bg-blue-500"
                                : "bg-amber-500"
                          }`}
                        />
                        <span className="text-xs font-semibold text-slate-700">
                          {emp.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-sm font-semibold text-slate-800">
                      {emp.daysPresent}
                    </td>
                    <td className="px-8 py-6">
                      <span
                        className={`text-sm font-bold ${emp.lateMarks > 0 ? "text-rose-500" : "text-slate-400"}`}
                      >
                        {emp.lateMarks}
                      </span>
                    </td>
                    <td className="px-8 py-6 min-w-[150px]">
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full"
                          style={{ width: `${emp.efficiency}%` }}
                        />
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-8 py-6 border-t border-slate-50 flex items-center justify-between">
            <p className="text-xs font-medium text-slate-400">
              Showing <span className="text-slate-900 font-semibold">1-10</span> of{" "}
              <span className="text-slate-900 font-semibold">248</span> results
            </p>
            <div className="flex items-center gap-2">
              <button
                className="p-2 border border-slate-100 rounded-xl hover:bg-slate-50 transition-all text-slate-400 group disabled:opacity-30"
                disabled
              >
                <ChevronLeft size={20} />
              </button>
              <button className="p-2 border border-slate-100 rounded-xl hover:bg-slate-50 transition-all text-slate-600 group">
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}

function ReportStatCard({ label, value, trend, icon: Icon, color }) {
  const colors = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
  };

  const isTrendPositive = trend?.startsWith("+");

  return (
    <Card className="shadow-lg shadow-slate-100 transition-all group overflow-hidden relative border-none">
      <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-full translate-x-12 -translate-y-12 opacity-50 transition-transform group-hover:scale-110" />
      <div className="flex flex-col gap-6 relative z-10">
        <div className="flex justify-between items-start">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${colors[color]}`}
          >
            <Icon size={20} strokeWidth={2.5} />
          </div>
          {trend && (
            <div
              className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${isTrendPositive ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"} flex items-center gap-0.5`}
            >
              {trend}
            </div>
          )}
        </div>
        <div>
          <p className="text-3xl font-bold text-slate-900 tracking-tighter leading-none mb-2">
            {value}
          </p>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
            {label}
          </p>
        </div>
      </div>
    </Card>
  );
}

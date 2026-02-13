"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { SideDrawer } from "@/components/ui/SideDrawer";
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
  Pencil,
  ArrowUpRight,
  Monitor,
  CheckCircle2,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";
import apiService from "@/lib/api";

export default function AdminReports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [timeRange, setTimeRange] = useState("Weekly");
  const [isExporting, setIsExporting] = useState(false);
  
  // Employee details drawer state
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  
  // Employee table filters
  const [statusFilter, setStatusFilter] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

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

  const handleViewEmployee = (employee) => {
    setSelectedEmployee(employee);
    setIsDetailOpen(true);
  };

  // Destructure data first so we can use employees in filters
  const { stats, deptPerformance, availability, employees } = data || {};

  // Filter employees based on selected filters
  const filteredEmployees = (employees || []).filter(emp => {
    const matchesStatus = !statusFilter || emp.status === statusFilter;
    const matchesDept = !deptFilter || emp.department === deptFilter;
    const matchesSearch = !searchQuery || 
      emp.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.employeeId?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesDept && matchesSearch;
  });

  // Get unique departments from employees for filter dropdown
  const departments = [...new Set((employees || []).map(emp => emp.department).filter(Boolean))];

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

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6 md:space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-gray-900">Reports</h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">System-wide performance and attendance reports</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button 
              onClick={handleExportToExcel}
              disabled={isExporting}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-semibold text-sm shadow-sm hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileSpreadsheet size={18} />
              {isExporting ? "Exporting..." : "Export to Excel"}
            </button>
          </div>
        </div>

        {/* Time Range Toggle */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Report Period</span>
            </div>
            <div className="flex bg-gray-100 p-1 rounded-lg w-fit">
              {["Weekly", "Monthly", "Yearly"].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                    timeRange === range
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <Card className="border-none shadow-sm bg-white overflow-hidden">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
                  <Monitor size={20} />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-500 font-medium">Active WFH Users</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">
                      {stats?.activeWFH?.value || "0"}
                    </p>
                    {stats?.activeWFH?.trend && (
                      <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                        stats.activeWFH.trend.startsWith("+") 
                          ? "bg-green-50 text-green-600" 
                          : "bg-red-50 text-red-600"
                      }`}>
                        {stats.activeWFH.trend}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white overflow-hidden">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-green-50 text-green-600 rounded-lg">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-500 font-medium">Avg. Attendance Rate</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">
                      {stats?.attendanceRate?.value || "0%"}
                    </p>
                    {stats?.attendanceRate?.trend && (
                      <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                        stats.attendanceRate.trend.startsWith("+") 
                          ? "bg-green-50 text-green-600" 
                          : "bg-red-50 text-red-600"
                      }`}>
                        {stats.attendanceRate.trend}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white overflow-hidden">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg">
                  <Clock size={20} />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-500 font-medium">Avg. Clock-in Time</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">
                      {stats?.avgClockIn?.value || "00:00"}
                    </p>
                    {stats?.avgClockIn?.trend && (
                      <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                        stats.avgClockIn.trend.startsWith("+") 
                          ? "bg-green-50 text-green-600" 
                          : "bg-red-50 text-red-600"
                      }`}>
                        {stats.avgClockIn.trend}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white overflow-hidden">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-purple-50 text-purple-600 rounded-lg">
                  <Calendar size={20} />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-500 font-medium">Pending Leaves</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">
                      {stats?.pendingLeaves?.value || "0"}
                    </p>
                    {stats?.pendingLeaves?.trend && (
                      <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                        stats.pendingLeaves.trend.startsWith("+") 
                          ? "bg-green-50 text-green-600" 
                          : "bg-red-50 text-red-600"
                      }`}>
                        {stats.pendingLeaves.trend}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Departmental Performance */}
          <Card className="lg:col-span-2 border border-gray-100 shadow-sm">
            <CardHeader className="border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-gray-900">Departmental Performance</CardTitle>
                <Badge variant="outline" className="text-xs">{timeRange}</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {deptPerformance?.map((dept, i) => (
                  <div key={dept.name} className="flex items-center gap-4">
                    <div className="w-20 text-xs font-medium text-gray-600 truncate">{dept.name}</div>
                    <div className="flex-1">
                      <div className="h-8 bg-gray-100 rounded-lg overflow-hidden relative">
                        <div 
                          className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg transition-all duration-700 ease-out"
                          style={{ width: `${dept.value}%` }}
                        />
                        <div className="absolute inset-0 flex items-center justify-end pr-3">
                          <span className="text-xs font-bold text-gray-700">{dept.value}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {(!deptPerformance || deptPerformance.length === 0) && (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    No department performance data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Staff Availability */}
          <Card className="border border-gray-100 shadow-sm">
            <CardHeader className="border-b border-gray-100 bg-gray-50/50">
              <CardTitle className="text-base font-semibold text-gray-900">Staff Availability</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex flex-col items-center">
                <div className="relative w-36 h-36 mb-4">
                  <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="#f1f5f9"
                      strokeWidth="12"
                      fill="transparent"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="#3b82f6"
                      strokeWidth="12"
                      strokeDasharray="251.2"
                      strokeDashoffset={251.2 - (251.2 * (availability?.rate || 0)) / 100}
                      strokeLinecap="round"
                      fill="transparent"
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-gray-900">{availability?.rate || 0}%</span>
                    <span className="text-xs text-gray-500">Available</span>
                  </div>
                </div>
                <div className="flex gap-6 mt-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-xs text-gray-600">On-site</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-xs text-gray-600">Remote</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Employee Report Table */}
        <Card className="border border-gray-100 shadow-sm overflow-hidden">
          <CardHeader className="border-b border-gray-100 bg-gray-50/50">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="text-base font-semibold text-gray-900">
                Employee Report
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({filteredEmployees.length} {filteredEmployees.length === 1 ? 'employee' : 'employees'})
                </span>
              </CardTitle>
              <div className="flex flex-wrap gap-2 sm:gap-3">
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-white border border-gray-200 text-xs font-medium text-gray-600 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none w-full sm:w-32"
                />
                <select 
                  className="bg-white border border-gray-200 text-xs font-medium text-gray-600 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">Status: All</option>
                  <option value="On-site">On-site</option>
                  <option value="Remote">Remote</option>
                  <option value="Leave">Leave</option>
                </select>
                <select 
                  className="bg-white border border-gray-200 text-xs font-medium text-gray-600 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                >
                  <option value="">Dept: All</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
                {(statusFilter || deptFilter || searchQuery) && (
                  <button
                    onClick={() => {
                      setStatusFilter("");
                      setDeptFilter("");
                      setSearchQuery("");
                    }}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium px-2"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-white border-b border-gray-100">
                  <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs whitespace-nowrap">
                    Employee
                  </th>
                  <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs whitespace-nowrap">
                    ID
                  </th>
                  <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs whitespace-nowrap">
                    Department
                  </th>
                  <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs whitespace-nowrap">
                    Status
                  </th>
                  <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs whitespace-nowrap">
                    Days Present
                  </th>
                  <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs whitespace-nowrap">
                    Late Marks
                  </th>
                  <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs whitespace-nowrap">
                    Efficiency
                  </th>
                  <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs whitespace-nowrap text-center sticky right-0 bg-white z-10">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredEmployees?.map((emp) => (
                  <tr
                    key={emp.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center text-xs font-semibold border border-gray-200">
                          {emp.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>
                        <p className="text-sm font-medium text-gray-900">
                          {emp.name}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-medium text-gray-500 font-mono">
                      {emp.employeeId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {emp.department}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge
                        variant={
                          emp.status === "On-site"
                            ? "success"
                            : emp.status === "Remote"
                              ? "primary"
                              : "warning"
                        }
                        className="text-xs"
                      >
                        {emp.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800">
                      {emp.daysPresent}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`text-sm font-bold ${emp.lateMarks > 0 ? "text-red-500" : "text-gray-400"}`}
                      >
                        {emp.lateMarks}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap min-w-[120px]">
                      <div className="flex items-center gap-2">
                        <div className="h-2 flex-1 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full transition-all"
                            style={{ width: `${emp.efficiency}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-gray-600 w-10 text-right">{emp.efficiency}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center sticky right-0 bg-white z-10">
                      <button 
                        onClick={() => handleViewEmployee(emp)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        title="View employee details"
                      >
                        <Pencil size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                {(!filteredEmployees || filteredEmployees.length === 0) && (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center text-gray-400 text-sm">
                      {(statusFilter || deptFilter || searchQuery) 
                        ? "No employees match your filters"
                        : "No employee data available for this period"
                      }
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-white">
            <p className="text-xs text-gray-500">
              Showing <span className="font-semibold text-gray-700">1-{filteredEmployees?.length || 0}</span> of{" "}
              <span className="font-semibold text-gray-700">{filteredEmployees?.length || 0}</span> results
              {(statusFilter || deptFilter || searchQuery) && (
                <span className="text-gray-400 ml-2">(filtered from {employees?.length || 0} total)</span>
              )}
            </p>
            <div className="flex items-center gap-2">
              <button
                className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all text-gray-400 disabled:opacity-30"
                disabled
              >
                <ChevronLeft size={18} />
              </button>
              <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all text-gray-600">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </Card>
      </div>

      {/* Employee Detail Drawer */}
      <SideDrawer
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedEmployee(null);
        }}
        title="Employee Report Details"
      >
        {selectedEmployee && (
          <div className="space-y-6">
            {/* Employee Info */}
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
              <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-lg font-bold">
                {selectedEmployee.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{selectedEmployee.name}</h3>
                <p className="text-sm text-gray-500">{selectedEmployee.employeeId}</p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white border border-gray-100 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">Department</p>
                <p className="font-semibold text-gray-900">{selectedEmployee.department}</p>
              </div>
              <div className="bg-white border border-gray-100 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">Status</p>
                <Badge
                  variant={
                    selectedEmployee.status === "On-site"
                      ? "success"
                      : selectedEmployee.status === "Remote"
                        ? "primary"
                        : "warning"
                  }
                >
                  {selectedEmployee.status}
                </Badge>
              </div>
              <div className="bg-white border border-gray-100 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">Days Present</p>
                <p className="text-2xl font-bold text-gray-900">{selectedEmployee.daysPresent}</p>
              </div>
              <div className="bg-white border border-gray-100 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">Late Marks</p>
                <p className={`text-2xl font-bold ${selectedEmployee.lateMarks > 0 ? "text-red-500" : "text-gray-400"}`}>
                  {selectedEmployee.lateMarks}
                </p>
              </div>
            </div>

            {/* Efficiency */}
            <div className="bg-white border border-gray-100 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-gray-700">Overall Efficiency</p>
                <span className="text-lg font-bold text-blue-600">{selectedEmployee.efficiency}%</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                  style={{ width: `${selectedEmployee.efficiency}%` }}
                />
              </div>
            </div>

            {/* Period Info */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <p className="text-xs text-blue-600 font-medium mb-1">Report Period</p>
              <p className="text-sm font-semibold text-blue-900">{timeRange} Report</p>
            </div>
          </div>
        )}
      </SideDrawer>
    </DashboardLayout>
  );
}

"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { DatePicker } from "@/components/ui/DatePicker";
import { SideDrawer } from "@/components/ui/SideDrawer";
import {
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  Download,
  Pencil,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Calendar,
} from "lucide-react";
import apiService from "@/lib/api";

export default function AttendancePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [dateFilter, setDateFilter] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [attendanceData, setAttendanceData] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    present: 0,
    absent: 0,
    late: 0,
  });
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 1,
  });

  // Filter Drawer State
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [tempFilters, setTempFilters] = useState({
    status: "",
    department: "",
    role: "",
  });
  const [activeFilters, setActiveFilters] = useState({
    status: "",
    department: "",
    role: "",
  });

  // Edit Drawer State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [editForm, setEditForm] = useState({
    totalHours: "",
    status: "",
    reason: "",
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Download Dialog State
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
  const [downloadRange, setDownloadRange] = useState({
    from: new Date().toISOString().split("T")[0],
    to: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    fetchAttendanceData();
  }, [dateFilter, searchQuery, currentPage, rowsPerPage, activeFilters]);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: currentPage,
        limit: rowsPerPage,
        fromDate: dateFilter,
        toDate: dateFilter,
        search: searchQuery,
        ...activeFilters,
      };

      const response = await apiService.attendance.getTeamAttendance(params);

      // Backend returns { records, stats, pagination }
      const {
        records,
        stats: statsData,
        pagination: paginationData,
      } = response.data;

      setAttendanceData(records || []);
      if (statsData) setStats(statsData);
      if (paginationData) setPagination(paginationData);
    } catch (err) {
      console.error("Error fetching attendance:", err);
      setError(err.message || "Failed to load attendance data");
    } finally {
      setLoading(false);
    }
  };

  const calculateHours = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return "0h";
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffMs = end - start;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${diffHours}h ${diffMins}m`;
  };

  const getStatus = (checkIn, checkOut) => {
    if (!checkIn) return "Absent";
    const checkInDate = new Date(checkIn);
    if (
      checkInDate.getHours() > 9 ||
      (checkInDate.getHours() === 9 && checkInDate.getMinutes() > 30)
    ) {
      return "Late";
    }
    return "Present";
  };

  const totalPages = pagination.pages;

  const handleApplyFilters = () => {
    setActiveFilters(tempFilters);
    setCurrentPage(1);
    setIsFilterOpen(false);
  };

  const handleResetFilters = () => {
    const reset = { status: "", department: "", role: "" };
    setTempFilters(reset);
    setActiveFilters(reset);
    setCurrentPage(1);
    setIsFilterOpen(false);
  };

  const handleEditClick = (record) => {
    setEditingEmployee(record.userId);
    // Calculate current total hours
    let totalHrs = "0";
    if (record.checkInTime && record.checkOutTime) {
      const start = new Date(record.checkInTime);
      const end = new Date(record.checkOutTime);
      const diffMs = end - start;
      const diffHours = (diffMs / (1000 * 60 * 60)).toFixed(1);
      totalHrs = diffHours;
    }
    setEditForm({
      recordId: record._id,
      totalHours: totalHrs,
      status: record.status,
      reason: "",
    });
    setIsEditOpen(true);
  };

  const handleDownloadExcel = async () => {
    try {
      setIsDownloading(true);
      const params = {
        fromDate: downloadRange.from,
        toDate: downloadRange.to,
        search: searchQuery,
        ...activeFilters,
      };
      await apiService.attendance.downloadExcelReport(params);
      setIsDownloadOpen(false);
    } catch (err) {
      console.error("Download error:", err);
      setError("Failed to download Excel report");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleUpdateRecord = async (e) => {
    e.preventDefault();
    if (!editingEmployee) return;

    try {
      setIsUpdating(true);
      const recordId = editForm.recordId;
      await apiService.attendance.updateRecord(recordId, editForm);
      await fetchAttendanceData();
      setIsEditOpen(false);
    } catch (err) {
      console.error("Update error:", err);
      setError(err.message || "Failed to update record");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Attendance Records
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            System-wide attendance management
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          <Card className="border-none shadow-sm bg-white overflow-hidden">
            <CardContent className="p-4 md:p-5">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                  <Users size={20} />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium">
                    Total Employees
                  </p>
                  <p className="text-xl sm:text-2xl font-semibold text-slate-900">
                    {loading ? "..." : stats.total}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white overflow-hidden">
            <CardContent className="p-4 md:p-5">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-green-50 text-green-600 rounded-xl">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium">Present</p>
                  <p className="text-xl sm:text-2xl font-semibold text-slate-900">
                    {loading ? "..." : stats.present}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white overflow-hidden">
            <CardContent className="p-4 md:p-5">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-red-50 text-red-600 rounded-xl">
                  <XCircle size={20} />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium">Absent</p>
                  <p className="text-xl sm:text-2xl font-semibold text-slate-900">
                    {loading ? "..." : stats.absent}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white overflow-hidden">
            <CardContent className="p-4 md:p-5">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-yellow-50 text-yellow-600 rounded-xl">
                  <Clock size={20} />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium">
                    Late Arrivals
                  </p>
                  <p className="text-xl sm:text-2xl font-semibold text-slate-900">
                    {loading ? "..." : stats.late}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2">
          <div className="relative flex-1 max-w-lg">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 bg-white shadow-sm transition-all"
              placeholder="Search employee or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3">
            <DatePicker
              value={dateFilter}
              onChange={setDateFilter}
              placeholder="Select date"
              align="right"
            />
            <button
              onClick={() => setIsFilterOpen(true)}
              className={`flex items-center justify-center p-2.5 border rounded-xl bg-white shadow-sm transition-colors ${Object.values(activeFilters).some((v) => v !== "")
                ? "border-blue-500 text-blue-600 bg-blue-50"
                : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
            >
              <Filter size={18} />
            </button>
            <button
              onClick={() => setIsDownloadOpen(true)}
              disabled={isDownloading}
              className="flex items-center justify-center p-2.5 border border-slate-200 rounded-xl bg-white text-slate-600 hover:bg-slate-50 shadow-sm disabled:opacity-50"
              title="Download Excel Report"
            >
              <Download
                size={18}
                className={isDownloading ? "animate-bounce" : ""}
              />
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200/60 text-red-700 px-4 py-3 rounded-xl flex items-start gap-3">
            <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Attendance Table */}
        <div className="bg-white border border-slate-200/60 rounded-xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Attendance for{" "}
                {new Date(dateFilter).toLocaleDateString("en-US", {
                  month: "short",
                  day: "2-digit",
                  year: "numeric",
                })}
              </h2>
            </div>
            <p className="text-sm text-slate-500">
              Showing {(pagination.page - 1) * pagination.limit + 1}-
              {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
              of {pagination.total} results
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-5 py-3.5 font-medium text-slate-500 text-xs">
                    Employee Name
                  </th>
                  <th className="px-5 py-3.5 font-medium text-slate-500 text-xs">
                    Employee ID
                  </th>
                  <th className="px-5 py-3.5 font-medium text-slate-500 text-xs">
                    Department
                  </th>
                  <th className="px-5 py-3.5 font-medium text-slate-500 text-xs">
                    Total Hours
                  </th>
                  <th className="px-5 py-3.5 font-medium text-slate-500 text-xs">
                    Status
                  </th>
                  <th className="px-5 py-3.5 font-medium text-slate-500 text-xs text-right sticky right-0 bg-white z-10">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-6 py-12 text-center text-slate-500 bg-white"
                    >
                      <p className="animate-pulse">
                        Loading attendance records...
                      </p>
                    </td>
                  </tr>
                ) : attendanceData.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-6 py-12 text-center text-slate-500 bg-white"
                    >
                      No records found matching your filters.
                    </td>
                  </tr>
                ) : (
                  attendanceData.map((record) => {
                    const employee = record.userId || {
                      name: "Deleted User",
                      employeeId: "N/A",
                    };
                    const status = record.status;
                    const hours = calculateHours(
                      record.checkInTime,
                      record.checkOutTime,
                    );

                    return (
                      <tr
                        key={record._id}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 bg-blue-50 text-blue-600 font-semibold rounded-lg flex items-center justify-center text-sm">
                              {employee.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-slate-900 text-sm leading-tight">
                                {employee.name}
                              </p>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                {employee.department || "Employee"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-slate-600 font-medium text-sm">
                          {employee.employeeId || "-"}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-slate-600 text-sm">
                          {employee.department || "N/A"}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span
                            className={
                              record.checkInTime
                                ? "text-slate-900 font-medium text-sm"
                                : "text-slate-300 text-sm"
                            }
                          >
                            {hours}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <Badge
                            variant={
                              status === "Present"
                                ? "success"
                                : status === "Late"
                                  ? "warning"
                                  : "absent"
                            }
                            dot
                          >
                            {status}
                          </Badge>
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-right sticky right-0 bg-white z-10">
                          <button
                            onClick={() => handleEditClick(record)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Pencil size={18} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-5 py-4 border-t border-slate-100 bg-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <p className="text-sm text-slate-500">Rows per page:</p>
              <select
                className="text-sm bg-transparent border-none focus:ring-0 text-slate-700 font-medium cursor-pointer"
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft size={18} className="text-slate-500" />
              </button>
              <div className="flex items-center">
                {[...Array(totalPages)]
                  .map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`min-w-[32px] h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${currentPage === i + 1
                        ? "bg-slate-900 text-white shadow-sm"
                        : "text-slate-500 hover:bg-slate-100"
                        }`}
                    >
                      {i + 1}
                    </button>
                  ))
                  .slice(0, 5)}
              </div>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 transition-colors"
              >
                <ChevronRight size={18} className="text-slate-500" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <SideDrawer
        isOpen={isDownloadOpen}
        onClose={() => setIsDownloadOpen(false)}
        title="Download Attendance Report"
      >
        <div className="space-y-6">
          <p className="text-sm text-slate-500">
            Select a date range to export the attendance records to Excel.
          </p>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-500">
                From Date
              </label>
              <input
                type="date"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 focus:outline-none text-sm bg-white transition-all"
                value={downloadRange.from}
                onChange={(e) =>
                  setDownloadRange({ ...downloadRange, from: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-500">
                To Date
              </label>
              <input
                type="date"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 focus:outline-none text-sm bg-white transition-all"
                value={downloadRange.to}
                onChange={(e) =>
                  setDownloadRange({ ...downloadRange, to: e.target.value })
                }
              />
            </div>
          </div>

          <div className="pt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsDownloadOpen(false)}
              className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDownloadExcel}
              disabled={isDownloading}
              className="flex-1 px-4 py-3 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition-all disabled:opacity-50 active:scale-[0.98]"
            >
              {isDownloading ? "Generating..." : "Download Excel"}
            </button>
          </div>
        </div>
      </SideDrawer>

      <SideDrawer
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        title="Advanced Filters"
      >
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-500">
              Department
            </label>
            <select
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 focus:outline-none text-sm appearance-none bg-white transition-all capitalize"
              value={tempFilters.department}
              onChange={(e) =>
                setTempFilters({ ...tempFilters, department: e.target.value })
              }
            >
              <option value="">All Departments</option>
              <option value="Administration">Administration</option>
              <option value="HR">HR</option>
              <option value="Engineering">Engineering</option>
              <option value="Design">Design</option>
              <option value="Marketing">Marketing</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-500">
              Attendance Status
            </label>
            <select
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 focus:outline-none text-sm appearance-none bg-white transition-all capitalize"
              value={tempFilters.status}
              onChange={(e) =>
                setTempFilters({ ...tempFilters, status: e.target.value })
              }
            >
              <option value="">All Statuses</option>
              <option value="Present">Present</option>
              <option value="Late">Late</option>
              <option value="Absent">Absent</option>
              <option value="Leave">Leave</option>
              <option value="Half-day">Half-day</option>
              <option value="WFH">WFH</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-500">
              Role
            </label>
            <select
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 focus:outline-none text-sm appearance-none bg-white transition-all capitalize"
              value={tempFilters.role}
              onChange={(e) =>
                setTempFilters({ ...tempFilters, role: e.target.value })
              }
            >
              <option value="">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="MANAGER">Manager</option>
              <option value="EMPLOYEE">Employee</option>
            </select>
          </div>

          <div className="pt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={handleResetFilters}
              className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Reset
            </button>
            <button
              onClick={handleApplyFilters}
              className="flex-1 px-4 py-3 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition-all active:scale-[0.98]"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </SideDrawer>

      {/* Edit Attendance Drawer */}
      <SideDrawer
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Attendance Record"
      >
        {editingEmployee && (
          <div className="space-y-6">
            {/* Employee Info Header */}
            <div className="p-4 bg-slate-50 rounded-xl flex items-center gap-4">
              <div className="h-12 w-12 bg-blue-50 text-blue-600 font-semibold rounded-lg flex items-center justify-center text-lg">
                {editingEmployee.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">
                  {editingEmployee.name}
                </h3>
                <p className="text-sm text-slate-500 font-medium">
                  Employee ID: {editingEmployee.employeeId}
                </p>
              </div>
            </div>

            <form onSubmit={handleUpdateRecord} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-500">
                  Total Working Hours
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="24"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 focus:outline-none text-sm transition-all"
                  value={editForm.totalHours}
                  onChange={(e) =>
                    setEditForm({ ...editForm, totalHours: e.target.value })
                  }
                  placeholder="Enter total hours (e.g., 8.5)"
                />
                <p className="text-[11px] text-slate-400">Enter hours in decimal format (e.g., 8.5 for 8h 30m)</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-500">
                  Status
                </label>
                <select
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 focus:outline-none text-sm appearance-none bg-white transition-all capitalize"
                  value={editForm.status}
                  onChange={(e) =>
                    setEditForm({ ...editForm, status: e.target.value })
                  }
                >
                  <option value="Present">Present</option>
                  <option value="Late">Late</option>
                  <option value="Absent">Absent</option>
                  <option value="Leave">Leave</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-500">
                  Reason for Change
                </label>
                <textarea
                  placeholder="Explain why this record is being modified..."
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 focus:outline-none text-sm min-h-[120px] transition-all"
                  value={editForm.reason}
                  onChange={(e) =>
                    setEditForm({ ...editForm, reason: e.target.value })
                  }
                />
                <p className="text-[11px] text-slate-400 italic">
                  This will be logged in the audit trail.
                </p>
              </div>

              <div className="pt-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex-1 px-4 py-3 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition-all disabled:opacity-50 active:scale-[0.98]"
                >
                  {isUpdating ? "Updating..." : "Update Record"}
                </button>
              </div>
            </form>
          </div>
        )}
      </SideDrawer>
    </DashboardLayout>
  );
}

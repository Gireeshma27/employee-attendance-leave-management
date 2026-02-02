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
    checkInTime: "",
    checkOutTime: "",
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
<<<<<<< HEAD
      const [attendanceRes, employeesRes] = await Promise.all([
        apiService.attendance.getTeamAttendance(),
        apiService.user.getAll(),
      ]);
      setAttendanceData(attendanceRes.data || []);
      setAllEmployees(employeesRes.data || []);
=======

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
>>>>>>> 5ac8cd0c0ea525059ca23962c6bb20b870e5ce3b
    } catch (err) {
      console.error("Error fetching attendance:", err);
      setError(err.message || "Failed to load attendance data");
    } finally {
      setLoading(false);
    }
  };

<<<<<<< HEAD
  // Filter attendance records for the selected date
  const todayAttendance = attendanceData.filter(a => {
    const attendanceDate = new Date(a.date).toISOString().split('T')[0];
    return attendanceDate === dateFilter;
  });

  // Create a map of attendance records by userId for quick lookup
  const attendanceMap = {};
  todayAttendance.forEach(record => {
    const userId = record.userId?._id || record.userId;
    attendanceMap[userId] = record;
  });

  // Build complete employee list with attendance data merged
  const employeeAttendanceList = allEmployees.map(employee => {
    const attendance = attendanceMap[employee._id];
    return {
      ...employee,
      attendance: attendance || {
        checkInTime: null,
        checkOutTime: null,
        workingHours: 0,
        status: 'Absent',
      },
    };
  });

  // Calculate statistics
  const presentCount = employeeAttendanceList.filter(
    (e) => e.attendance.checkInTime && e.attendance.status !== 'Absent' && e.attendance.status !== 'Leave'
  ).length;

  const absentCount = employeeAttendanceList.filter((e) => !e.attendance.checkInTime).length;

  const halfDayCount = employeeAttendanceList.filter((e) => {
    const a = e.attendance;
    return (
      a.checkInTime &&
      a.checkOutTime &&
      new Date(a.checkOutTime) - new Date(a.checkInTime) < 5 * 60 * 60 * 1000
    );
  }).length;

  const stats = {
    total: allEmployees.length,
    present: presentCount,
    absent: absentCount,
    halfDay: halfDayCount,
  };

=======
>>>>>>> 5ac8cd0c0ea525059ca23962c6bb20b870e5ce3b
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
    setEditForm({
      recordId: record._id,
      checkInTime: record.checkInTime
        ? new Date(record.checkInTime).toISOString().slice(0, 16)
        : "",
      checkOutTime: record.checkOutTime
        ? new Date(record.checkOutTime).toISOString().slice(0, 16)
        : "",
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
<<<<<<< HEAD
      <div className="space-y-6 md:space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Attendance Records</h1>
          <p className="text-xs md:text-sm text-gray-600 mt-1">System-wide attendance management</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
          <Input
            label="Date"
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full sm:w-48"
          />
=======
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Attendance Records
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            System-wide attendance management
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-none shadow-sm bg-white overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
                  <Users size={20} />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">
                    Total Employees
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {loading ? "..." : stats.total}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-green-50 text-green-600 rounded-lg">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Present</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {loading ? "..." : stats.present}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-red-50 text-red-600 rounded-lg">
                  <XCircle size={20} />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Absent</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {loading ? "..." : stats.absent}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-orange-50 text-orange-600 rounded-lg">
                  <Clock size={20} />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">
                    Late Arrivals
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
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
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
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
              className={`flex items-center justify-center p-2.5 border rounded-lg bg-white shadow-sm transition-colors ${
                Object.values(activeFilters).some((v) => v !== "")
                  ? "border-blue-500 text-blue-600 bg-blue-50"
                  : "border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Filter size={18} />
            </button>
            <button
              onClick={() => setIsDownloadOpen(true)}
              disabled={isDownloading}
              className="flex items-center justify-center p-2.5 border border-gray-200 rounded-lg bg-white text-gray-600 hover:bg-gray-50 shadow-sm disabled:opacity-50"
              title="Download Excel Report"
            >
              <Download
                size={18}
                className={isDownloading ? "animate-bounce" : ""}
              />
            </button>
          </div>
>>>>>>> 5ac8cd0c0ea525059ca23962c6bb20b870e5ce3b
        </div>

        {/* Error State */}
        {error && (
<<<<<<< HEAD
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-4 md:pt-6">
              <p className="text-red-700 text-xs md:text-sm">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Summary Stats */}
        {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <Card>
              <CardContent className="pt-4 md:pt-6 text-center">
                <p className="text-xs md:text-sm text-gray-600">Total Employees</p>
                <p className="text-2xl md:text-3xl font-bold text-gray-900 mt-1 md:mt-2">{stats.total}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 md:pt-6 text-center">
                <p className="text-xs md:text-sm text-gray-600">Present</p>
                <p className="text-2xl md:text-3xl font-bold text-green-600 mt-1 md:mt-2">{stats.present}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 md:pt-6 text-center">
                <p className="text-xs md:text-sm text-gray-600">Absent</p>
                <p className="text-2xl md:text-3xl font-bold text-red-600 mt-1 md:mt-2">{stats.absent}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 md:pt-6 text-center">
                <p className="text-xs md:text-sm text-gray-600">Half Day</p>
                <p className="text-2xl md:text-3xl font-bold text-yellow-600 mt-1 md:mt-2">{stats.halfDay}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <Card>
            <CardContent className="pt-4 md:pt-6">
              <div className="text-center py-6 md:py-8">
                <p className="text-xs md:text-sm text-gray-600">Loading attendance data...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Attendance Table */}
        {!loading && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base md:text-lg">Attendance for {dateFilter}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto -mx-4 md:mx-0">
                <table className="w-full text-xs md:text-sm">
                  <thead className="border-b border-gray-200 bg-gray-50">
                    <tr className="text-gray-600">
                      <th className="text-left py-2 md:py-3 px-4 md:px-4">Employee</th>
                      <th className="text-left py-2 md:py-3 px-4 md:px-4 hidden sm:table-cell">Employee ID</th>
                      <th className="text-left py-2 md:py-3 px-4 md:px-4 hidden md:table-cell">Check-in</th>
                      <th className="text-left py-2 md:py-3 px-4 md:px-4 hidden lg:table-cell">Check-out</th>
                      <th className="text-left py-2 md:py-3 px-4 md:px-4 hidden sm:table-cell">Hours</th>
                      <th className="text-left py-2 md:py-3 px-4 md:px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employeeAttendanceList.map((employee) => {
                      const status = getStatus(
                        employee.attendance.checkInTime,
                        employee.attendance.checkOutTime
                      );
                      const hours = calculateHours(
                        employee.attendance.checkInTime,
                        employee.attendance.checkOutTime
                      );
                      return (
                        <tr
                          key={employee._id}
                          className="border-b border-gray-100 hover:bg-gray-50"
                        >
                          <td className="py-2 md:py-4 px-4 font-medium text-gray-900 text-xs md:text-sm">
                            {employee.name}
                          </td>
                          <td className="py-2 md:py-4 px-4 text-gray-600 hidden sm:table-cell text-xs md:text-sm">
                            {employee.employeeId || '-'}
                          </td>
                          <td className="py-2 md:py-4 px-4 text-gray-600 hidden md:table-cell text-xs md:text-sm">
                            {employee.attendance.checkInTime
                              ? new Date(employee.attendance.checkInTime).toLocaleTimeString()
                              : '-'}
                          </td>
                          <td className="py-2 md:py-4 px-4 text-gray-600 hidden lg:table-cell text-xs md:text-sm">
                            {employee.attendance.checkOutTime
                              ? new Date(employee.attendance.checkOutTime).toLocaleTimeString()
                              : '-'}
                          </td>
                          <td className="py-2 md:py-4 px-4 text-gray-600 font-medium hidden sm:table-cell text-xs md:text-sm">
                            {hours}h
                          </td>
                          <td className="py-2 md:py-4 px-4">
                            <Badge
                              variant={
                                status === 'Present'
                                  ? 'success'
                                  : status === 'Absent'
                                  ? 'danger'
                                  : 'warning'
                              }
                              className="text-xs"
                            >
                              {status}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
=======
          <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3">
            <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Attendance Table */}
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Attendance for{" "}
                {new Date(dateFilter).toLocaleDateString("en-US", {
                  month: "short",
                  day: "2-digit",
                  year: "numeric",
                })}
              </h2>
            </div>
            <p className="text-sm text-gray-500">
              Showing {(pagination.page - 1) * pagination.limit + 1}-
              {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
              of {pagination.total} results
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-white border-b border-gray-100">
                  <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-[11px]">
                    Employee Name
                  </th>
                  <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-[11px]">
                    Employee ID
                  </th>
                  <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-[11px]">
                    Check-in
                  </th>
                  <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-[11px]">
                    Check-out
                  </th>
                  <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-[11px]">
                    Total Hours
                  </th>
                  <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-[11px]">
                    Status
                  </th>
                  <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-[11px] text-right">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="px-6 py-12 text-center text-gray-500 bg-white"
                    >
                      <p className="animate-pulse">
                        Loading attendance records...
                      </p>
                    </td>
                  </tr>
                ) : attendanceData.length === 0 ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="px-6 py-12 text-center text-gray-500 bg-white"
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
                        className="hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-gray-100 text-gray-600 font-semibold rounded-full flex items-center justify-center text-sm border border-gray-200">
                              {employee.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 text-sm leading-tight">
                                {employee.name}
                              </p>
                              <p className="text-[11px] text-gray-500 mt-0.5">
                                {employee.department || "Employee"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-600 font-medium">
                          {employee.employeeId || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                          {record.checkInTime
                            ? new Date(record.checkInTime).toLocaleTimeString(
                                "en-US",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: true,
                                },
                              )
                            : "—"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                          {record.checkOutTime
                            ? new Date(record.checkOutTime).toLocaleTimeString(
                                "en-US",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: true,
                                },
                              )
                            : "—"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={
                              record.checkInTime
                                ? "text-gray-900 font-medium"
                                : "text-gray-300"
                            }
                          >
                            {hours}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge
                            variant={
                              status === "Present"
                                ? "success"
                                : status === "Late"
                                  ? "warning"
                                  : "absent"
                            }
                            className="rounded-md px-2.5 py-0.5 text-[11px]"
                          >
                            {status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button
                            onClick={() => handleEditClick(record)}
                            className="text-gray-400 hover:text-blue-600 transition-colors"
                          >
                            <Pencil size={16} />
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
          <div className="px-5 py-4 border-t border-gray-100 bg-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <p className="text-sm text-gray-500">Rows per page:</p>
              <select
                className="text-sm bg-transparent border-none focus:ring-0 text-gray-700 font-medium cursor-pointer"
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
                className="p-1.5 rounded-md hover:bg-gray-100 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft size={18} className="text-gray-500" />
              </button>
              <div className="flex items-center">
                {[...Array(totalPages)]
                  .map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`min-w-[32px] h-8 flex items-center justify-center rounded-md text-sm font-medium transition-colors ${
                        currentPage === i + 1
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-gray-500 hover:bg-gray-100"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))
                  .slice(0, 5)}
>>>>>>> 5ac8cd0c0ea525059ca23962c6bb20b870e5ce3b
              </div>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-md hover:bg-gray-100 disabled:opacity-30 transition-colors"
              >
                <ChevronRight size={18} className="text-gray-500" />
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
          <p className="text-sm text-gray-500">
            Select a date range to export the attendance records to Excel.
          </p>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">
                From Date
              </label>
              <input
                type="date"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm bg-white"
                value={downloadRange.from}
                onChange={(e) =>
                  setDownloadRange({ ...downloadRange, from: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">
                To Date
              </label>
              <input
                type="date"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm bg-white"
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
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDownloadExcel}
              disabled={isDownloading}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 shadow-md shadow-blue-200 transition-all disabled:opacity-50"
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
            <label className="text-xs font-bold text-gray-500 uppercase">
              Department
            </label>
            <select
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm appearance-none bg-white transition-all capitalize"
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
            <label className="text-xs font-bold text-gray-500 uppercase">
              Attendance Status
            </label>
            <select
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm appearance-none bg-white transition-all capitalize"
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
            <label className="text-xs font-bold text-gray-500 uppercase">
              Role
            </label>
            <select
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm appearance-none bg-white transition-all capitalize"
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
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Reset
            </button>
            <button
              onClick={handleApplyFilters}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 shadow-md shadow-blue-200 transition-all"
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
            <div className="p-4 bg-gray-50 rounded-xl flex items-center gap-4">
              <div className="h-12 w-12 bg-blue-100 text-blue-600 font-bold rounded-full flex items-center justify-center text-lg">
                {editingEmployee.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="font-bold text-gray-900">
                  {editingEmployee.name}
                </h3>
                <p className="text-sm text-gray-500 font-medium">
                  Employee ID: {editingEmployee.employeeId}
                </p>
              </div>
            </div>

            <form onSubmit={handleUpdateRecord} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">
                    Check-in Time
                  </label>
                  <input
                    type="datetime-local"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm transition-all"
                    value={editForm.checkInTime}
                    onChange={(e) =>
                      setEditForm({ ...editForm, checkInTime: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">
                    Check-out Time
                  </label>
                  <input
                    type="datetime-local"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm transition-all"
                    value={editForm.checkOutTime}
                    onChange={(e) =>
                      setEditForm({ ...editForm, checkOutTime: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase">
                  Status
                </label>
                <select
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm appearance-none bg-white transition-all capitalize"
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
                <label className="text-xs font-bold text-gray-500 uppercase">
                  Reason for Change
                </label>
                <textarea
                  placeholder="Explain why this record is being modified..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm min-h-[120px] transition-all"
                  value={editForm.reason}
                  onChange={(e) =>
                    setEditForm({ ...editForm, reason: e.target.value })
                  }
                />
                <p className="text-[11px] text-gray-400 italic">
                  This will be logged in the audit trail.
                </p>
              </div>

              <div className="pt-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 shadow-md shadow-blue-200 transition-all disabled:opacity-50"
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

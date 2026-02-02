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
  const rowsPerPage = 10;
  const [dateFilter, setDateFilter] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [attendanceData, setAttendanceData] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  useEffect(() => {
    fetchAttendanceData();
  }, [dateFilter]);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [attendanceRes, employeesRes] = await Promise.all([
        apiService.attendance.getTeamAttendance(),
        apiService.user.getAll(),
      ]);
      setAttendanceData(attendanceRes.data || []);
      setAllEmployees(employeesRes.data || []);
    } catch (err) {
      console.error("Error fetching attendance:", err);
      setError(err.message || "Failed to load attendance data");
    } finally {
      setLoading(false);
    }
  };

  // Filter attendance records for the selected date
  const todayAttendance = attendanceData.filter((a) => {
    const attendanceDate = new Date(a.date).toISOString().split("T")[0];
    return attendanceDate === dateFilter;
  });

  // Create a map of attendance records by userId for quick lookup
  const attendanceMap = {};
  todayAttendance.forEach((record) => {
    const userId = record.userId?._id || record.userId;
    attendanceMap[userId] = record;
  });

  // Build complete employee list with attendance data merged
  const employeeAttendanceList = allEmployees.map((employee) => {
    const attendance = attendanceMap[employee._id];
    return {
      ...employee,
      attendance: attendance || {
        checkInTime: null,
        checkOutTime: null,
        workingHours: 0,
        status: "Absent",
      },
    };
  });

  // Calculate statistics
  const presentCount = employeeAttendanceList.filter((e) => {
    const checkIn = e.attendance.checkInTime;
    if (!checkIn) return false;
    const checkInDate = new Date(checkIn);
    // Late if after 9:30 AM
    const isLate =
      checkInDate.getHours() > 9 ||
      (checkInDate.getHours() === 9 && checkInDate.getMinutes() > 30);
    return (
      !isLate &&
      e.attendance.status !== "Absent" &&
      e.attendance.status !== "Leave"
    );
  }).length;

  const lateCount = employeeAttendanceList.filter((e) => {
    const checkIn = e.attendance.checkInTime;
    if (!checkIn) return false;
    const checkInDate = new Date(checkIn);
    // Late if after 9:30 AM
    return (
      checkInDate.getHours() > 9 ||
      (checkInDate.getHours() === 9 && checkInDate.getMinutes() > 30)
    );
  }).length;

  const absentCount = employeeAttendanceList.filter(
    (e) => !e.attendance.checkInTime,
  ).length;

  const stats = {
    total: allEmployees.length,
    present: presentCount,
    absent: absentCount,
    late: lateCount,
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

  // Filter based on search query
  const filteredEmployees = employeeAttendanceList.filter(
    (e) =>
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.employeeId &&
        e.employeeId.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage,
  );

  const totalPages = Math.ceil(filteredEmployees.length / rowsPerPage);

  const handleEditClick = (employee) => {
    setEditingEmployee(employee);
    setEditForm({
      checkInTime: employee.attendance.checkInTime
        ? new Date(employee.attendance.checkInTime).toISOString().slice(0, 16)
        : "",
      checkOutTime: employee.attendance.checkOutTime
        ? new Date(employee.attendance.checkOutTime).toISOString().slice(0, 16)
        : "",
      status: getStatus(
        employee.attendance.checkInTime,
        employee.attendance.checkOutTime,
      ),
      reason: "",
    });
    setIsEditOpen(true);
  };

  const handleUpdateRecord = async (e) => {
    e.preventDefault();
    if (!editingEmployee) return;

    try {
      setIsUpdating(true);
      const recordId = editingEmployee.attendance._id;

      // If no record exists yet (Absent), we might need to handle creation or just show a warning
      if (!recordId) {
        setError("Cannot edit an absent record that hasn't been created yet.");
        return;
      }

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
            <button className="flex items-center justify-center p-2.5 border border-gray-200 rounded-lg bg-white text-gray-600 hover:bg-gray-50 shadow-sm">
              <Filter size={18} />
            </button>
            <button className="flex items-center justify-center p-2.5 border border-gray-200 rounded-lg bg-white text-gray-600 hover:bg-gray-50 shadow-sm">
              <Download size={18} />
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && (
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
              Showing {(currentPage - 1) * rowsPerPage + 1}-
              {Math.min(currentPage * rowsPerPage, filteredEmployees.length)} of{" "}
              {filteredEmployees.length} results
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
                ) : paginatedEmployees.length === 0 ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="px-6 py-12 text-center text-gray-500 bg-white"
                    >
                      No matching records found for this date.
                    </td>
                  </tr>
                ) : (
                  paginatedEmployees.map((employee) => {
                    const status = getStatus(
                      employee.attendance.checkInTime,
                      employee.attendance.checkOutTime,
                    );
                    const hours = calculateHours(
                      employee.attendance.checkInTime,
                      employee.attendance.checkOutTime,
                    );

                    return (
                      <tr
                        key={employee._id}
                        className="hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-gray-100 text-gray-600 font-semibold rounded-full flex items-center justify-center text-sm border border-gray-200">
                              {employee.name.charAt(0).toUpperCase()}
                              {employee.name.split(" ").length > 1
                                ? employee.name
                                    .split(" ")[1]
                                    .charAt(0)
                                    .toUpperCase()
                                : ""}
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
                          {employee.attendance.checkInTime
                            ? new Date(
                                employee.attendance.checkInTime,
                              ).toLocaleTimeString("en-US", {
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true,
                              })
                            : "—"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                          {employee.attendance.checkOutTime
                            ? new Date(
                                employee.attendance.checkOutTime,
                              ).toLocaleTimeString("en-US", {
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true,
                              })
                            : "—"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={
                              employee.attendance.checkInTime
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
                            onClick={() => handleEditClick(employee)}
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
              <select className="text-sm bg-transparent border-none focus:ring-0 text-gray-700 font-medium cursor-pointer">
                <option>10</option>
                <option>20</option>
                <option>50</option>
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

"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Search, Eye } from "lucide-react";
import { useState, useEffect } from "react";
import apiService from "@/lib/api";
import { EditEmployeeModal } from "@/components/modals/EditEmployeeModal";

export default function TeamAttendancePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attendanceData, setAttendanceData] = useState([]);
  const [teamStats, setTeamStats] = useState(null);

  // Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  useEffect(() => {
    fetchAttendanceData();
  }, []);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      const [attendanceRes, dashboardRes] = await Promise.all([
        apiService.attendance.getTeamAttendance(),
        apiService.dashboard.getManagerStats(),
      ]);

      if (dashboardRes.success && dashboardRes.data?.stats) {
        setTeamStats(dashboardRes.data.stats);
      }

      const attendance = attendanceRes.data?.records || [];

      // Extract unique team members and calculate statistics
      const teamMap = new Map();

      attendance.forEach((record) => {
        const userId = record.userId?._id || record.userId?.id;
        if (userId && !teamMap.has(userId)) {
          teamMap.set(userId, {
            id: userId,
            name: record.userId.name,
            rawUser: record.userId, // Keep for editing
            attendance: [],
          });
        }
        if (userId) teamMap.get(userId).attendance.push(record);
      });

      // Calculate statistics for each team member
      const stats = Array.from(teamMap.values()).map((emp) => {
        const empAttendance = emp.attendance;
        const present = empAttendance.filter((a) => a.checkInTime).length;
        const absent = empAttendance.filter(
          (a) => !a.checkInTime && a.status === "Absent",
        ).length;
        const total = Math.max(empAttendance.length, 1);
        const percentage = Math.round((present / total) * 100) || 0;

        return {
          id: emp.id,
          name: emp.name,
          rawUser: emp.rawUser,
          days: total,
          present,
          absent,
          percentage,
        };
      });

      setAttendanceData(stats);
    } catch (err) {
      console.error("Error fetching attendance:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (emp) => {
    setSelectedEmployee(emp.rawUser);
    setIsEditModalOpen(true);
  };

  const handleEditSuccess = () => {
    fetchAttendanceData();
  };

  if (loading) {
    return (
      <DashboardLayout role="manager">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-500 font-medium">Loading team data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const filteredData = attendanceData.filter((emp) =>
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <DashboardLayout role="manager">
      <div className="space-y-6 md:space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">
            Team Attendance
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Monitor and manage your team's attendance records.
          </p>
        </div>

        {/* Summary Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatsCard
            label="Team Size"
            value={teamStats?.teamSize || attendanceData.length}
            color="blue"
          />
          <StatsCard
            label="Avg. Rate"
            value={`${Math.round(attendanceData.reduce((acc, curr) => acc + curr.percentage, 0) / (attendanceData.length || 1))}%`}
            color="blue"
          />
          <StatsCard
            label="Field Employees"
            value={attendanceData.filter((e) => !e.rawUser.officeId).length}
            color="yellow"
          />
          <StatsCard
            label="WFH Allowed"
            value={attendanceData.filter((e) => e.rawUser.wfhAllowed).length}
            color="blue"
          />
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <Input
              placeholder="Search team members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50 font-medium"
          >
            <option value="all">Recent Activity</option>
            <option value="present">Active Now</option>
          </select>
        </div>

        {/* Attendance Table */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100">
            <CardTitle className="text-base">
              Team Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest bg-slate-50/30">
                  <tr>
                    <th className="py-3.5 px-5">Employee</th>
                    <th className="py-3.5 px-5 text-center">Days Tracked</th>
                    <th className="py-3.5 px-5 text-center">Present</th>
                    <th className="py-3.5 px-5 text-center">Absent</th>
                    <th className="py-3.5 px-5 text-center">Rate (%)</th>
                    <th className="py-3.5 px-5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredData.map((emp) => (
                    <tr
                      key={emp.id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-semibold text-xs">
                            {emp.name.charAt(0)}
                          </div>
                          <span className="font-medium text-slate-800">
                            {emp.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-5 text-center text-slate-500 font-medium">
                        {emp.days}
                      </td>
                      <td className="py-3.5 px-5 text-center">
                        <Badge variant="success" className="font-semibold h-5">
                          {emp.present}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-5 text-center">
                        <Badge variant="danger" className="font-medium h-5">
                          {emp.absent}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-12 bg-slate-100 rounded-full h-1.5 hidden sm:block">
                            <div
                              className="h-1.5 rounded-full bg-blue-500"
                              style={{ width: `${emp.percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-semibold text-slate-900">
                            {emp.percentage}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-5 text-center">
                        <button
                          onClick={() => handleEditClick(emp)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors inline-flex items-center gap-2"
                          title="View Details"
                        >
                          <Eye size={18} />
                          <span className="text-xs font-medium md:hidden lg:inline text-blue-700">
                            Details
                          </span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

      </div>

      <EditEmployeeModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedEmployee(null);
        }}
        employee={selectedEmployee}
        onSuccess={handleEditSuccess}
      />
    </DashboardLayout>
  );
}

function StatsCard({ label, value, color }) {
  const colorMap = {
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    yellow: "bg-yellow-50 text-yellow-700 border-yellow-100",
  };

  return (
    <div className={`p-4 rounded-2xl border ${colorMap[color]} shadow-sm`}>
      <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70 leading-none">
        {label}
      </p>
      <p className="text-xl md:text-2xl font-bold mt-2 leading-none">
        {value}
      </p>
    </div>
  );
}

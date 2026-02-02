"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Search } from "lucide-react";
import { useState, useEffect } from "react";
import { apiService } from "@/lib/api";

export default function TeamAttendancePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attendanceData, setAttendanceData] = useState([]);

  useEffect(() => {
    fetchAttendanceData();
  }, []);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      const attendanceRes = await apiService.attendance.getTeamAttendance();
      const attendance = attendanceRes.data?.records || [];

      // Extract unique team members and calculate statistics
      const teamMap = new Map();

      attendance.forEach((record) => {
        const userId = record.userId._id || record.userId.id;
        if (!teamMap.has(userId)) {
          teamMap.set(userId, {
            id: userId,
            name: record.userId.name,
            attendance: [],
          });
        }
        teamMap.get(userId).attendance.push(record);
      });

      // Calculate statistics for each team member
      const stats = Array.from(teamMap.values()).map((emp) => {
        const empAttendance = emp.attendance;
        const present = empAttendance.filter((a) => a.checkIn).length;
        const absent = empAttendance.filter(
          (a) => !a.checkIn && a.status === "absent",
        ).length;
        const halfDay = empAttendance.filter(
          (a) =>
            a.checkOut &&
            new Date(a.checkOut) - new Date(a.checkIn) < 5 * 60 * 60 * 1000,
        ).length;
        const total = Math.max(empAttendance.length, 1);
        const percentage = Math.round((present / total) * 100) || 0;

        return {
          id: emp.id,
          name: emp.name,
          days: total,
          present,
          absent,
          halfDay,
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

  if (loading) {
    return (
      <DashboardLayout role="manager">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading attendance data...</p>
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
<<<<<<< HEAD
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Team Attendance</h1>
          <p className="text-xs md:text-sm text-gray-600 mt-1">Monitor your team's attendance records</p>
=======
          <h1 className="text-3xl font-bold text-gray-900">Team Attendance</h1>
          <p className="text-gray-600 mt-1">
            Monitor your team's attendance records
          </p>
>>>>>>> naveen
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 md:gap-4 sm:items-end">
          <div className="flex-1">
            <Input
              placeholder="Search employee..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full sm:w-auto px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All</option>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
          </select>
        </div>

        {/* Attendance Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-lg">Attendance Records (January 2026)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto -mx-4 md:mx-0">
              <table className="w-full text-xs md:text-sm">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr className="text-gray-600">
                    <th className="text-left py-2 md:py-3 px-4 md:px-4">Employee Name</th>
                    <th className="text-center py-2 md:py-3 px-4 md:px-4 hidden sm:table-cell">Working Days</th>
                    <th className="text-center py-2 md:py-3 px-4 md:px-4">Present</th>
                    <th className="text-center py-2 md:py-3 px-4 md:px-4 hidden md:table-cell">Absent</th>
                    <th className="text-center py-2 md:py-3 px-4 md:px-4 hidden lg:table-cell">Half-day</th>
                    <th className="text-center py-2 md:py-3 px-4 md:px-4">%</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((emp) => (
<<<<<<< HEAD
                    <tr key={emp.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2 md:py-4 px-4 text-gray-900 font-medium text-xs md:text-sm">{emp.name}</td>
                      <td className="py-2 md:py-4 px-4 text-center text-gray-600 hidden sm:table-cell text-xs md:text-sm">{emp.days}</td>
                      <td className="py-2 md:py-4 px-4 text-center">
                        <Badge variant="success" className="text-xs">{emp.present}</Badge>
=======
                    <tr
                      key={emp.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-4 px-4 text-gray-900 font-medium">
                        {emp.name}
                      </td>
                      <td className="py-4 px-4 text-center text-gray-600">
                        {emp.days}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <Badge variant="success">{emp.present}</Badge>
>>>>>>> naveen
                      </td>
                      <td className="py-2 md:py-4 px-4 text-center hidden md:table-cell">
                        <Badge variant="danger" className="text-xs">{emp.absent}</Badge>
                      </td>
                      <td className="py-2 md:py-4 px-4 text-center hidden lg:table-cell">
                        <Badge variant="warning" className="text-xs">{emp.halfDay}</Badge>
                      </td>
                      <td className="py-2 md:py-4 px-4">
                        <div className="flex items-center justify-center gap-1 md:gap-2">
                          <div className="w-8 md:w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                emp.percentage >= 90
                                  ? "bg-green-600"
                                  : emp.percentage >= 80
                                    ? "bg-yellow-600"
                                    : "bg-red-600"
                              }`}
                              style={{ width: `${emp.percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-xs md:text-sm font-semibold text-gray-900 w-8 md:w-10 text-right">
                            {emp.percentage}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <Card>
            <CardContent className="pt-4 md:pt-6 text-center">
              <p className="text-xs md:text-sm text-gray-600">Team Size</p>
              <p className="text-xl md:text-3xl font-bold text-gray-900 mt-1 md:mt-2">5</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 md:pt-6 text-center">
              <p className="text-xs md:text-sm text-gray-600">Avg. Attendance</p>
              <p className="text-xl md:text-3xl font-bold text-green-600 mt-1 md:mt-2">87%</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 md:pt-6 text-center">
              <p className="text-xs md:text-sm text-gray-600">Total Present</p>
              <p className="text-xl md:text-3xl font-bold text-blue-600 mt-1 md:mt-2">87</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 md:pt-6 text-center">
              <p className="text-xs md:text-sm text-gray-600">Total Absent</p>
              <p className="text-xl md:text-3xl font-bold text-red-600 mt-1 md:mt-2">8</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

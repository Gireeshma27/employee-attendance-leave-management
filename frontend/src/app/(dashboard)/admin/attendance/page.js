'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import apiService from '@/lib/api';

export default function AttendancePage() {
  const [dateFilter, setDateFilter] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [attendanceData, setAttendanceData] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      console.error('Error fetching attendance:', err);
      setError(err.message || 'Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

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

  const calculateHours = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return '0';
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const hours = (end - start) / (1000 * 60 * 60);
    return hours.toFixed(1);
  };

  const getStatus = (checkIn, checkOut) => {
    if (!checkIn) return 'Absent';
    if (!checkOut) return 'Present';
    const hours = calculateHours(checkIn, checkOut);
    return parseFloat(hours) < 5 ? 'Half Day' : 'Present';
  };

  return (
    <DashboardLayout role="admin">
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
        </div>

        {/* Error State */}
        {error && (
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
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

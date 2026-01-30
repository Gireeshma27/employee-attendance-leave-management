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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAttendanceData();
  }, [dateFilter]);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiService.attendance.getTeamAttendance();
      setAttendanceData(res.data || []);
    } catch (err) {
      console.error('Error fetching attendance:', err);
      setError(err.message || 'Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total: attendanceData.length,
    present: attendanceData.filter((a) => a.checkIn).length,
    absent: attendanceData.filter((a) => !a.checkIn).length,
    halfDay: attendanceData.filter(
      (a) =>
        a.checkIn &&
        a.checkOut &&
        new Date(a.checkOut) - new Date(a.checkIn) < 5 * 60 * 60 * 1000
    ).length,
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
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Attendance Records</h1>
          <p className="text-gray-600 mt-1">System-wide attendance management</p>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <Input
            label="Date"
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-48"
          />
        </div>

        {/* Error State */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-700">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Summary Stats */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-gray-600 text-sm">Total Employees</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-gray-600 text-sm">Present</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{stats.present}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-gray-600 text-sm">Absent</p>
                <p className="text-3xl font-bold text-red-600 mt-2">{stats.absent}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-gray-600 text-sm">Half Day</p>
                <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.halfDay}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <p className="text-gray-600">Loading attendance data...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Attendance Table */}
        {!loading && (
          <Card>
            <CardHeader>
              <CardTitle>Attendance for {dateFilter}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-200 bg-gray-50">
                    <tr className="text-gray-600">
                      <th className="text-left py-3 px-4">Employee</th>
                      <th className="text-left py-3 px-4">Check-in</th>
                      <th className="text-left py-3 px-4">Check-out</th>
                      <th className="text-left py-3 px-4">Hours</th>
                      <th className="text-left py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceData.map((record) => {
                      const status = getStatus(record.checkIn, record.checkOut);
                      const hours = calculateHours(record.checkIn, record.checkOut);
                      return (
                        <tr
                          key={record._id}
                          className="border-b border-gray-100 hover:bg-gray-50"
                        >
                          <td className="py-4 px-4 font-medium text-gray-900">
                            {record.userId?.name || 'Unknown'}
                          </td>
                          <td className="py-4 px-4 text-gray-600">
                            {record.checkIn
                              ? new Date(record.checkIn).toLocaleTimeString()
                              : '-'}
                          </td>
                          <td className="py-4 px-4 text-gray-600">
                            {record.checkOut
                              ? new Date(record.checkOut).toLocaleTimeString()
                              : '-'}
                          </td>
                          <td className="py-4 px-4 text-gray-600 font-medium">
                            {hours}
                          </td>
                          <td className="py-4 px-4">
                            <Badge
                              variant={
                                status === 'Present'
                                  ? 'success'
                                  : status === 'Absent'
                                  ? 'danger'
                                  : 'warning'
                              }
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

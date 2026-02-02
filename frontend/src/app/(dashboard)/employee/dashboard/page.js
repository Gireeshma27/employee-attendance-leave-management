'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Clock, Calendar, AlertCircle, TrendingUp } from 'lucide-react';
import { useState, useEffect } from 'react';
import { apiService } from '@/lib/api';

export default function EmployeeDashboard() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [todayStatus, setTodayStatus] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Get user profile
      const profileData = await apiService.user.getProfile();
      setUser(profileData.data);

      // Get user's attendance records
      const attendanceData = await apiService.attendance.getMyAttendance();
      
      // Get today's attendance from the records
      const today = new Date().toISOString().split('T')[0];
      const todayRecord = attendanceData.data?.find(r => {
        const recordDate = new Date(r.date).toISOString().split('T')[0];
        return recordDate === today;
      });
      
      setTodayStatus(todayRecord || null);
      setAttendanceHistory(attendanceData.data || []);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="employee">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="employee">
      <div className="space-y-6 md:space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Welcome back, {user?.firstName || 'Employee'}!
          </h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">Here's your attendance overview for today</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="text-gray-600 text-xs md:text-sm">Today's Status</p>
                  <p className="text-xl md:text-2xl font-bold text-gray-900 mt-2">
                    <Badge variant={todayStatus?.status === 'checked-in' ? 'success' : 'secondary'}>
                      {todayStatus?.status === 'checked-in' ? 'Present' : 'Not Checked In'}
                    </Badge>
                  </p>
                </div>
                <Clock className="text-blue-600 flex-shrink-0" size={32} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="text-gray-600 text-sm">Working Hours</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {todayStatus?.workingHours?.toFixed(1) || '0'} hrs
                  </p>
                </div>
                <TrendingUp className="text-green-600" size={32} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Leave Balance</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {user?.leaveBalance || '0'} days
                  </p>
                </div>
                <Calendar className="text-orange-600" size={32} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Pending Approvals</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">0</p>
                </div>
                <AlertCircle className="text-yellow-600" size={32} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Attendance */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-200">
                  <tr className="text-gray-600">
                    <th className="text-left py-3">Date</th>
                    <th className="text-left py-3">Check-in</th>
                    <th className="text-left py-3">Check-out</th>
                    <th className="text-left py-3">Hours</th>
                    <th className="text-left py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceHistory.length > 0 ? (
                    attendanceHistory.map((record, idx) => (
                      <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 text-gray-900">
                          {new Date(record.date).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                        </td>
                        <td className="py-3 text-gray-600">
                          {record.checkIn ? new Date(record.checkIn).toLocaleTimeString('en-US', { 
                            hour: '2-digit', 
                            minute: '2-digit',
                            hour12: true 
                          }) : '-'}
                        </td>
                        <td className="py-3 text-gray-600">
                          {record.checkOut ? new Date(record.checkOut).toLocaleTimeString('en-US', { 
                            hour: '2-digit', 
                            minute: '2-digit',
                            hour12: true 
                          }) : '-'}
                        </td>
                        <td className="py-3 text-gray-900 font-medium">
                          {record.workingHours?.toFixed(1) || '0'}
                        </td>
                        <td className="py-3">
                          <Badge
                            variant={
                              record.status === 'present'
                                ? 'success'
                                : record.status === 'absent'
                                ? 'danger'
                                : 'secondary'
                            }
                          >
                            {record.status?.charAt(0).toUpperCase() + record.status?.slice(1)}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="py-3 text-center text-gray-500">
                        No attendance records found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="flex gap-4">
          <Button variant="primary" size="lg">
            Check In Now
          </Button>
          <Button variant="secondary" size="lg">
            View Full Attendance
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}

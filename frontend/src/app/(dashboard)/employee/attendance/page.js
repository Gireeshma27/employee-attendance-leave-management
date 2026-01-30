'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Clock, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { apiService } from '@/lib/api';

export default function AttendancePage() {
  const [loading, setLoading] = useState(true);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchAttendanceData();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      const historyData = await apiService.attendance.getMyAttendance();
      
      // Get today's attendance
      const today = new Date().toISOString().split('T')[0];
      const todayRecord = historyData.data?.find(r => {
        const recordDate = new Date(r.date).toISOString().split('T')[0];
        return recordDate === today;
      });
      
      setTodayAttendance(todayRecord || null);
      setAttendanceHistory(historyData.data || []);
    } catch (err) {
      console.error('Error fetching attendance:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    try {
      setIsSubmitting(true);
      await apiService.attendance.checkIn({
        checkInTime: new Date(),
      });
      await fetchAttendanceData();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckOut = async () => {
    try {
      setIsSubmitting(true);
      await apiService.attendance.checkOut({
        checkOutTime: new Date(),
      });
      await fetchAttendanceData();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  if (loading) {
    return (
      <DashboardLayout role="employee">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading attendance data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="employee">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Attendance</h1>
          <p className="text-gray-600 mt-1">Track your daily check-in and check-out</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Today's Status */}
        <Card>
          <CardHeader>
            <CardTitle>Today's Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Clock className="mx-auto text-blue-600 mb-2" size={32} />
                  <p className="text-gray-600 text-sm">Check-in Time</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {formatTime(todayAttendance?.checkIn)}
                  </p>
                </div>

                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <Clock className="mx-auto text-green-600 mb-2" size={32} />
                  <p className="text-gray-600 text-sm">Current Time</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {currentTime.toLocaleTimeString('en-US', { 
                      hour: '2-digit', 
                      minute: '2-digit',
                      hour12: true 
                    })}
                  </p>
                </div>

                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <Clock className="mx-auto text-purple-600 mb-2" size={32} />
                  <p className="text-gray-600 text-sm">Working Hours</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {todayAttendance?.workingHours?.toFixed(2) || '0'} hrs
                  </p>
                </div>
              </div>

              <div className="flex gap-4 justify-center">
                <Button 
                  variant="success" 
                  size="lg" 
                  disabled={!!todayAttendance?.checkIn || isSubmitting}
                  onClick={handleCheckIn}
                >
                  {isSubmitting ? 'Processing...' : 'Check In'}
                </Button>
                <Button 
                  variant="danger" 
                  size="lg" 
                  disabled={!todayAttendance?.checkIn || !!todayAttendance?.checkOut || isSubmitting}
                  onClick={handleCheckOut}
                >
                  {isSubmitting ? 'Processing...' : 'Check Out'}
                </Button>
              </div>

              {todayAttendance?.checkIn && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
                  <div>
                    <p className="font-semibold text-green-900">You are checked in</p>
                    <p className="text-sm text-green-700 mt-1">
                      You checked in at {formatTime(todayAttendance?.checkIn)}. Don't forget to check out before leaving.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Attendance History */}
        <Card>
          <CardHeader>
            <CardTitle>Attendance History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-200">
                  <tr className="text-gray-600">
                    <th className="text-left py-3">Date</th>
                    <th className="text-left py-3">Check-in</th>
                    <th className="text-left py-3">Check-out</th>
                    <th className="text-left py-3">Duration</th>
                    <th className="text-left py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceHistory.length > 0 ? (
                    attendanceHistory.map((record, idx) => (
                      <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 text-gray-900">{formatDate(record.date)}</td>
                        <td className="py-3 text-gray-600">{formatTime(record.checkIn)}</td>
                        <td className="py-3 text-gray-600">{formatTime(record.checkOut)}</td>
                        <td className="py-3 text-gray-900 font-medium">
                          {record.workingHours ? `${Math.floor(record.workingHours)}h ${Math.round((record.workingHours % 1) * 60)}m` : '-'}
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
                            {record.status?.charAt(0).toUpperCase() + record.status?.slice(1) || 'Pending'}
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
      </div>
    </DashboardLayout>
  );
}

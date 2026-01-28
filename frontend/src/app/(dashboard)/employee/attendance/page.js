'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Clock, AlertCircle } from 'lucide-react';
import { useState } from 'react';

export default function AttendancePage() {
  const [checkedIn, setCheckedIn] = useState(true);
  const [checkInTime] = useState('09:00 AM');
  const [currentTime] = useState('5:45 PM');
  const [workingHours] = useState('8.75');

  return (
    <DashboardLayout role="employee">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Attendance</h1>
          <p className="text-gray-600 mt-1">Track your daily check-in and check-out</p>
        </div>

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
                  <p className="text-2xl font-bold text-gray-900 mt-1">{checkInTime}</p>
                </div>

                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <Clock className="mx-auto text-green-600 mb-2" size={32} />
                  <p className="text-gray-600 text-sm">Current Time</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{currentTime}</p>
                </div>

                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <Clock className="mx-auto text-purple-600 mb-2" size={32} />
                  <p className="text-gray-600 text-sm">Working Hours</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{workingHours} hrs</p>
                </div>
              </div>

              <div className="flex gap-4 justify-center">
                <Button variant="success" size="lg" disabled={checkedIn}>
                  Check In
                </Button>
                <Button variant="danger" size="lg" disabled={!checkedIn}>
                  Check Out
                </Button>
              </div>

              {checkedIn && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
                  <div>
                    <p className="font-semibold text-green-900">You are checked in</p>
                    <p className="text-sm text-green-700 mt-1">
                      You checked in at {checkInTime}. Don't forget to check out before leaving.
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
                  {[
                    { date: 'Jan 23, 2026', checkin: '09:00 AM', checkout: '05:30 PM', duration: '8h 30m', status: 'Present' },
                    { date: 'Jan 22, 2026', checkin: '09:15 AM', checkout: '05:45 PM', duration: '8h 30m', status: 'Present' },
                    { date: 'Jan 21, 2026', checkin: '09:30 AM', checkout: '02:00 PM', duration: '4h 30m', status: 'Half-day' },
                    { date: 'Jan 20, 2026', checkin: '-', checkout: '-', duration: '-', status: 'Absent' },
                    { date: 'Jan 19, 2026', checkin: '09:00 AM', checkout: '06:00 PM', duration: '9h', status: 'Present' },
                    { date: 'Jan 18, 2026', checkin: '10:00 AM', checkout: '06:30 PM', duration: '8h 30m', status: 'Present' },
                    { date: 'Jan 17, 2026', checkin: '09:00 AM', checkout: '05:00 PM', duration: '8h', status: 'Present' },
                    { date: 'Jan 16, 2026', checkin: '09:00 AM', checkout: '05:00 PM', duration: '8h', status: 'Present' },
                  ].map((record, idx) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 text-gray-900">{record.date}</td>
                      <td className="py-3 text-gray-600">{record.checkin}</td>
                      <td className="py-3 text-gray-600">{record.checkout}</td>
                      <td className="py-3 text-gray-900 font-medium">{record.duration}</td>
                      <td className="py-3">
                        <Badge
                          variant={
                            record.status === 'Present'
                              ? 'present'
                              : record.status === 'Absent'
                              ? 'absent'
                              : 'half-day'
                          }
                        >
                          {record.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

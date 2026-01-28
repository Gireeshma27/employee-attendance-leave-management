'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Clock, Calendar, AlertCircle, TrendingUp } from 'lucide-react';

export default function EmployeeDashboard() {
  return (
    <DashboardLayout role="employee">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, John Doe!</h1>
          <p className="text-gray-600 mt-1">Here's your attendance overview for today</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Today's Status</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    <Badge variant="success">Present</Badge>
                  </p>
                </div>
                <Clock className="text-blue-600" size={32} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Working Hours</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">8.5 hrs</p>
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
                  <p className="text-2xl font-bold text-gray-900 mt-2">18 days</p>
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
                  <p className="text-2xl font-bold text-gray-900 mt-2">1</p>
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
                  {[
                    { date: 'Jan 23, 2026', checkin: '09:00 AM', checkout: '05:30 PM', hours: '8.5', status: 'Present' },
                    { date: 'Jan 22, 2026', checkin: '09:15 AM', checkout: '05:45 PM', hours: '8.5', status: 'Present' },
                    { date: 'Jan 21, 2026', checkin: '09:30 AM', checkout: '02:00 PM', hours: '4.5', status: 'Half-day' },
                    { date: 'Jan 20, 2026', checkin: '-', checkout: '-', hours: '0', status: 'Absent' },
                    { date: 'Jan 19, 2026', checkin: '09:00 AM', checkout: '06:00 PM', hours: '9', status: 'Present' },
                  ].map((record, idx) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 text-gray-900">{record.date}</td>
                      <td className="py-3 text-gray-600">{record.checkin}</td>
                      <td className="py-3 text-gray-600">{record.checkout}</td>
                      <td className="py-3 text-gray-900 font-medium">{record.hours}</td>
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

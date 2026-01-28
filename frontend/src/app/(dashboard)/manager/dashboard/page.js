'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Clock, AlertCircle, Users, TrendingUp } from 'lucide-react';

export default function ManagerDashboard() {
  return (
    <DashboardLayout role="manager">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manager Dashboard</h1>
          <p className="text-gray-600 mt-1">Team attendance and performance overview</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Team Size</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">12</p>
                </div>
                <Users className="text-blue-600" size={32} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Present Today</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">10</p>
                </div>
                <Clock className="text-green-600" size={32} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Absent Today</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">2</p>
                </div>
                <AlertCircle className="text-red-600" size={32} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Pending Approvals</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">5</p>
                </div>
                <TrendingUp className="text-orange-600" size={32} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Team Attendance */}
        <Card>
          <CardHeader>
            <CardTitle>Team Attendance Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-200">
                  <tr className="text-gray-600">
                    <th className="text-left py-3">Employee</th>
                    <th className="text-left py-3">Check-in</th>
                    <th className="text-left py-3">Check-out</th>
                    <th className="text-left py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: 'Alice Johnson', checkin: '09:00 AM', checkout: '05:30 PM', status: 'Present' },
                    { name: 'Bob Smith', checkin: '09:15 AM', checkout: '05:45 PM', status: 'Present' },
                    { name: 'Carol Davis', checkin: '10:00 AM', checkout: '06:00 PM', status: 'Present' },
                    { name: 'David Wilson', checkin: '-', checkout: '-', status: 'Absent' },
                    { name: 'Emma Brown', checkin: '09:30 AM', checkout: '02:00 PM', status: 'Half-day' },
                    { name: 'Frank Miller', checkin: 'Not yet', checkout: '-', status: 'WFH' },
                  ].map((record, idx) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 text-gray-900 font-medium">{record.name}</td>
                      <td className="py-3 text-gray-600">{record.checkin}</td>
                      <td className="py-3 text-gray-600">{record.checkout}</td>
                      <td className="py-3">
                        <Badge variant={record.status === 'Present' ? 'present' : record.status === 'Absent' ? 'absent' : 'info'}>
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

        {/* Team Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Team Performance (This Month)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: 'Alice Johnson', attendance: 95, avgHours: 8.5 },
                { name: 'Bob Smith', attendance: 92, avgHours: 8.3 },
                { name: 'Carol Davis', attendance: 88, avgHours: 8.1 },
                { name: 'David Wilson', attendance: 75, avgHours: 7.5 },
              ].map((emp, idx) => (
                <div key={idx} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900">{emp.name}</h4>
                    <span className="text-sm text-gray-600">{emp.attendance}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${emp.attendance}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Avg. {emp.avgHours}h/day</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';

export default function AttendancePage() {
  const [dateFilter, setDateFilter] = useState('2026-01-23');
  const [deptFilter, setDeptFilter] = useState('all');

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
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Departments</option>
              <option value="engineering">Engineering</option>
              <option value="sales">Sales</option>
              <option value="hr">HR</option>
              <option value="finance">Finance</option>
            </select>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-gray-600 text-sm">Total Employees</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">156</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-gray-600 text-sm">Present</p>
              <p className="text-3xl font-bold text-green-600 mt-2">142</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-gray-600 text-sm">Absent</p>
              <p className="text-3xl font-bold text-red-600 mt-2">14</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-gray-600 text-sm">Half Day</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">0</p>
            </CardContent>
          </Card>
        </div>

        {/* Attendance Table */}
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
                    <th className="text-left py-3 px-4">Department</th>
                    <th className="text-left py-3 px-4">Check-in</th>
                    <th className="text-left py-3 px-4">Check-out</th>
                    <th className="text-left py-3 px-4">Hours</th>
                    <th className="text-left py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: 'Alice Johnson', dept: 'Engineering', checkin: '09:00 AM', checkout: '05:30 PM', hours: '8.5', status: 'Present' },
                    { name: 'Bob Smith', dept: 'Sales', checkin: '09:15 AM', checkout: '05:45 PM', hours: '8.5', status: 'Present' },
                    { name: 'Carol Davis', dept: 'HR', checkin: '09:00 AM', checkout: '05:00 PM', hours: '8', status: 'Present' },
                    { name: 'David Wilson', dept: 'Finance', checkin: '-', checkout: '-', hours: '0', status: 'Absent' },
                    { name: 'Emma Brown', dept: 'Marketing', checkin: '10:00 AM', checkout: '06:00 PM', hours: '8', status: 'Present' },
                    { name: 'Frank Miller', dept: 'Engineering', checkin: '09:30 AM', checkout: '02:00 PM', hours: '4.5', status: 'Half Day' },
                  ].map((record, idx) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4 font-medium text-gray-900">{record.name}</td>
                      <td className="py-4 px-4 text-gray-600">{record.dept}</td>
                      <td className="py-4 px-4 text-gray-600">{record.checkin}</td>
                      <td className="py-4 px-4 text-gray-600">{record.checkout}</td>
                      <td className="py-4 px-4 text-gray-600 font-medium">{record.hours}</td>
                      <td className="py-4 px-4">
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

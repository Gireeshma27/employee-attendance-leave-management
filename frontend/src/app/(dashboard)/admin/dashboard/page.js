'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Users, Clock, Calendar, BarChart3, AlertCircle } from 'lucide-react';

export default function AdminDashboard() {
  return (
    <DashboardLayout role="admin">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">System-wide attendance and leave management</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-xs">Total Employees</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">156</p>
                </div>
                <Users className="text-blue-600" size={28} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-xs">Present Today</p>
                  <p className="text-2xl font-bold text-green-600 mt-2">142</p>
                </div>
                <Clock className="text-green-600" size={28} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-xs">Absent Today</p>
                  <p className="text-2xl font-bold text-red-600 mt-2">14</p>
                </div>
                <AlertCircle className="text-red-600" size={28} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-xs">Pending Leaves</p>
                  <p className="text-2xl font-bold text-yellow-600 mt-2">12</p>
                </div>
                <Calendar className="text-yellow-600" size={28} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-xs">Avg. Attendance</p>
                  <p className="text-2xl font-bold text-purple-600 mt-2">91%</p>
                </div>
                <BarChart3 className="text-purple-600" size={28} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Department Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Department Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr className="text-gray-600">
                    <th className="text-left py-3 px-4">Department</th>
                    <th className="text-center py-3 px-4">Employees</th>
                    <th className="text-center py-3 px-4">Present</th>
                    <th className="text-center py-3 px-4">Absent</th>
                    <th className="text-center py-3 px-4">Attendance %</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { dept: 'Engineering', employees: 45, present: 41, absent: 4, percentage: 91 },
                    { dept: 'Sales', employees: 35, present: 33, absent: 2, percentage: 94 },
                    { dept: 'HR', employees: 12, present: 12, absent: 0, percentage: 100 },
                    { dept: 'Finance', employees: 25, present: 23, absent: 2, percentage: 92 },
                    { dept: 'Marketing', employees: 18, present: 17, absent: 1, percentage: 94 },
                    { dept: 'Operations', employees: 21, present: 16, absent: 5, percentage: 76 },
                  ].map((dept, idx) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4 font-medium text-gray-900">{dept.dept}</td>
                      <td className="py-4 px-4 text-center text-gray-600">{dept.employees}</td>
                      <td className="py-4 px-4 text-center">
                        <Badge variant="success">{dept.present}</Badge>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <Badge variant="danger">{dept.absent}</Badge>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                dept.percentage >= 90
                                  ? 'bg-green-600'
                                  : dept.percentage >= 80
                                  ? 'bg-yellow-600'
                                  : 'bg-red-600'
                              }`}
                              style={{ width: `${dept.percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-semibold text-gray-900 w-8">
                            {dept.percentage}%
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

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Employees On Leave Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  { name: 'John Wilson', leaveType: 'Sick Leave' },
                  { name: 'Sarah Johnson', leaveType: 'Casual Leave' },
                  { name: 'Mike Davis', leaveType: 'Paid Leave' },
                ].map((emp, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded"
                  >
                    <span className="text-gray-900 font-medium">{emp.name}</span>
                    <Badge variant="info">{emp.leaveType}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Database</span>
                  <Badge variant="success">Connected</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">API Server</span>
                  <Badge variant="success">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Reports</span>
                  <Badge variant="success">Running</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

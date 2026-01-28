'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { BarChart3, Download, TrendingUp } from 'lucide-react';
import { useState } from 'react';

export default function ReportsPage() {
  const [reportType, setReportType] = useState('attendance');

  return (
    <DashboardLayout role="admin">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
            <p className="text-gray-600 mt-1">Generate and view system reports</p>
          </div>
          <Button variant="primary" size="lg" className="flex items-center gap-2">
            <Download size={20} />
            Export Report
          </Button>
        </div>

        {/* Report Types */}
        <Card>
          <CardHeader>
            <CardTitle>Select Report Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { id: 'attendance', label: 'Attendance Report', icon: '📊' },
                { id: 'leave', label: 'Leave Report', icon: '📅' },
                { id: 'department', label: 'Department Report', icon: '👥' },
                { id: 'performance', label: 'Performance Report', icon: '📈' },
              ].map((report) => (
                <button
                  key={report.id}
                  onClick={() => setReportType(report.id)}
                  className={`p-6 rounded-lg border-2 transition-all text-center ${
                    reportType === report.id
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-400'
                  }`}
                >
                  <div className="text-3xl mb-2">{report.icon}</div>
                  <p className="font-semibold text-gray-900">{report.label}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Report Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Report Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  From Date
                </label>
                <input
                  type="date"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  defaultValue="2026-01-01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  To Date
                </label>
                <input
                  type="date"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  defaultValue="2026-01-31"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department
                </label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>All Departments</option>
                  <option>Engineering</option>
                  <option>Sales</option>
                  <option>HR</option>
                  <option>Finance</option>
                </select>
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <Button variant="primary">Generate Report</Button>
              <Button variant="outline">Clear Filters</Button>
            </div>
          </CardContent>
        </Card>

        {/* Sample Report Data */}
        {reportType === 'attendance' && (
          <Card>
            <CardHeader>
              <CardTitle>Attendance Report (January 2026)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-200 bg-gray-50">
                    <tr className="text-gray-600">
                      <th className="text-left py-3 px-4">Department</th>
                      <th className="text-center py-3 px-4">Total Employees</th>
                      <th className="text-center py-3 px-4">Days Worked</th>
                      <th className="text-center py-3 px-4">Total Days</th>
                      <th className="text-center py-3 px-4">Attendance %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { dept: 'Engineering', emp: 45, worked: 855, total: 900, pct: 95 },
                      { dept: 'Sales', emp: 35, worked: 658, total: 700, pct: 94 },
                      { dept: 'HR', emp: 12, worked: 240, total: 240, pct: 100 },
                      { dept: 'Finance', emp: 25, worked: 460, total: 500, pct: 92 },
                      { dept: 'Marketing', emp: 18, worked: 340, total: 360, pct: 94 },
                    ].map((row, idx) => (
                      <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4 font-medium text-gray-900">{row.dept}</td>
                        <td className="py-4 px-4 text-center text-gray-600">{row.emp}</td>
                        <td className="py-4 px-4 text-center text-gray-600">{row.worked}</td>
                        <td className="py-4 px-4 text-center text-gray-600">{row.total}</td>
                        <td className="py-4 px-4 text-center font-semibold text-gray-900">
                          {row.pct}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {reportType === 'leave' && (
          <Card>
            <CardHeader>
              <CardTitle>Leave Report (January 2026)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { type: 'Casual Leave', used: 34, balance: 122 },
                  { type: 'Sick Leave', used: 12, balance: 88 },
                  { type: 'Paid Leave', used: 45, balance: 210 },
                ].map((leave, idx) => (
                  <div
                    key={idx}
                    className="border border-gray-200 rounded-lg p-4 flex items-center justify-between"
                  >
                    <div>
                      <h4 className="font-semibold text-gray-900">{leave.type}</h4>
                      <p className="text-sm text-gray-600">
                        Used: {leave.used} days | Balance: {leave.balance} days
                      </p>
                    </div>
                    <div className="w-32 bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-blue-600 h-3 rounded-full"
                        style={{
                          width: `${(leave.used / (leave.used + leave.balance)) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Export Options */}
        <Card>
          <CardHeader>
            <CardTitle>Export Options</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline" className="flex items-center gap-2">
                <Download size={20} />
                Export as PDF
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <Download size={20} />
                Export as CSV
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <Download size={20} />
                Export as Excel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

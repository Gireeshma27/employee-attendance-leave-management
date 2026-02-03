'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Download } from 'lucide-react';
import { useState, useEffect } from 'react';
import apiService from '@/lib/api';

export default function ReportsPage() {
  const [reportType, setReportType] = useState('attendance');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fromDate, setFromDate] = useState('2026-01-01');
  const [toDate, setToDate] = useState('2026-01-31');

  useEffect(() => {
    generateReport();
  }, [reportType]);

  const generateReport = async () => {
    try {
      setLoading(true);
      setError(null);

      if (reportType === 'attendance') {
        const res = await apiService.attendance.getReport({
          fromDate,
          toDate,
        });
        setReportData(res.data || {});
      }
    } catch (err) {
      console.error('Error generating report:', err);
      setError(err.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6 md:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 md:gap-4">
          <div className="min-w-0">
            <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-gray-900">Reports</h1>
            <p className="text-xs sm:text-sm md:text-sm text-gray-600 mt-1">Generate and view system reports</p>
          </div>
          <Button variant="primary" size="lg" className="flex items-center gap-2 text-xs sm:text-sm">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  From Date
                </label>
                <input
                  type="date"
                  className="w-full px-2 sm:px-4 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  To Date
                </label>
                <input
                  type="date"
                  className="w-full px-2 sm:px-4 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-2 sm:gap-4 mt-4 sm:mt-6">
              <Button variant="primary" onClick={generateReport} className="text-xs sm:text-sm">
                Generate Report
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Error State */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-700">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {loading && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <p className="text-gray-600">Generating report...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Report Data */}
        {reportType === 'attendance' && reportData && !loading && (
          <Card>
            <CardHeader>
              <CardTitle>
                Attendance Report ({fromDate} to {toDate})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {reportData.summary ? (
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <p className="text-sm text-gray-600">Total Working Days</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {reportData.summary.workingDays || 0}
                      </p>
                    </div>
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <p className="text-sm text-gray-600">Total Employees</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {reportData.summary.totalEmployees || 0}
                      </p>
                    </div>
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <p className="text-sm text-gray-600">Avg. Attendance</p>
                      <p className="text-2xl font-bold text-green-600">
                        {reportData.summary.averageAttendance || 0}%
                      </p>
                    </div>
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <p className="text-sm text-gray-600">Total Days Present</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {reportData.summary.totalDaysPresent || 0}
                      </p>
                    </div>
                  </div>

                  {reportData.departmentWise && Array.isArray(reportData.departmentWise) && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Department-wise Breakdown
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="border-b border-gray-200 bg-gray-50">
                            <tr className="text-gray-600">
                              <th className="text-left py-3 px-4">Department</th>
                              <th className="text-center py-3 px-4">Employees</th>
                              <th className="text-center py-3 px-4">Avg Attendance %</th>
                            </tr>
                          </thead>
                          <tbody>
                            {reportData.departmentWise.map((row, idx) => (
                              <tr
                                key={idx}
                                className="border-b border-gray-100 hover:bg-gray-50"
                              >
                                <td className="py-4 px-4 font-medium text-gray-900">
                                  {row.department || 'N/A'}
                                </td>
                                <td className="py-4 px-4 text-center text-gray-600">
                                  {row.employees || 0}
                                </td>
                                <td className="py-4 px-4 text-center font-semibold text-gray-900">
                                  {row.averageAttendance || 0}%
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-600">No data available for this period</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export default function LeavesPage() {
  const [leaveRequests] = useState([
    { id: 1, employee: 'Alice Johnson', type: 'Casual Leave', from: 'Jan 25, 2026', to: 'Jan 26, 2026', days: 2, status: 'pending', manager: 'John Doe' },
    { id: 2, employee: 'Bob Smith', type: 'Sick Leave', from: 'Jan 24, 2026', to: 'Jan 24, 2026', days: 1, status: 'pending', manager: 'Jane Smith' },
    { id: 3, employee: 'Carol Davis', type: 'Paid Leave', from: 'Jan 10, 2026', to: 'Jan 12, 2026', days: 3, status: 'approved', manager: 'John Doe' },
    { id: 4, employee: 'David Wilson', type: 'Casual Leave', from: 'Jan 5, 2026', to: 'Jan 5, 2026', days: 1, status: 'rejected', manager: 'Jane Smith' },
    { id: 5, employee: 'Emma Brown', type: 'Paid Leave', from: 'Jan 15, 2026', to: 'Jan 19, 2026', days: 5, status: 'approved', manager: 'John Doe' },
  ]);

  const pendingCount = leaveRequests.filter(r => r.status === 'pending').length;
  const approvedCount = leaveRequests.filter(r => r.status === 'approved').length;
  const rejectedCount = leaveRequests.filter(r => r.status === 'rejected').length;

  return (
    <DashboardLayout role="admin">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Leave Management</h1>
          <p className="text-gray-600 mt-1">Manage all leave requests across the organization</p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-gray-600 text-sm">Total Requests</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{leaveRequests.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-gray-600 text-sm">Pending</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">{pendingCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-gray-600 text-sm">Approved</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{approvedCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-gray-600 text-sm">Rejected</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{rejectedCount}</p>
            </CardContent>
          </Card>
        </div>

        {/* Leave Requests Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Leave Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr className="text-gray-600">
                    <th className="text-left py-3 px-4">Employee</th>
                    <th className="text-left py-3 px-4">Leave Type</th>
                    <th className="text-left py-3 px-4">From</th>
                    <th className="text-left py-3 px-4">To</th>
                    <th className="text-center py-3 px-4">Days</th>
                    <th className="text-left py-3 px-4">Manager</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-center py-3 px-4">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {leaveRequests.map((request) => (
                    <tr key={request.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4 font-medium text-gray-900">{request.employee}</td>
                      <td className="py-4 px-4 text-gray-600">{request.type}</td>
                      <td className="py-4 px-4 text-gray-600">{request.from}</td>
                      <td className="py-4 px-4 text-gray-600">{request.to}</td>
                      <td className="py-4 px-4 text-center font-medium">{request.days}</td>
                      <td className="py-4 px-4 text-gray-600">{request.manager}</td>
                      <td className="py-4 px-4">
                        <Badge
                          variant={
                            request.status === 'pending'
                              ? 'warning'
                              : request.status === 'approved'
                              ? 'success'
                              : 'danger'
                          }
                        >
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        {request.status === 'pending' && (
                          <Button variant="primary" size="sm">
                            Review
                          </Button>
                        )}
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

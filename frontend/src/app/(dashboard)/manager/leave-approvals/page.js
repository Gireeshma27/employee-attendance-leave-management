'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { AlertCircle } from 'lucide-react';
import { useState } from 'react';

export default function LeaveApprovalsPage() {
  const [leaveRequests, setLeaveRequests] = useState([
    {
      id: 1,
      employeeName: 'Alice Johnson',
      leaveType: 'Casual Leave',
      from: 'Jan 25, 2026',
      to: 'Jan 26, 2026',
      days: 2,
      reason: 'Personal appointment',
      status: 'pending',
      submittedDate: 'Jan 22, 2026',
    },
    {
      id: 2,
      employeeName: 'Bob Smith',
      leaveType: 'Sick Leave',
      from: 'Jan 24, 2026',
      to: 'Jan 24, 2026',
      days: 1,
      reason: 'Medical checkup',
      status: 'pending',
      submittedDate: 'Jan 23, 2026',
    },
    {
      id: 3,
      employeeName: 'Carol Davis',
      leaveType: 'Paid Leave',
      from: 'Jan 27, 2026',
      to: 'Jan 31, 2026',
      days: 5,
      reason: 'Vacation',
      status: 'approved',
      submittedDate: 'Jan 20, 2026',
    },
    {
      id: 4,
      employeeName: 'David Wilson',
      leaveType: 'Casual Leave',
      from: 'Jan 20, 2026',
      to: 'Jan 20, 2026',
      days: 1,
      reason: 'Family event',
      status: 'rejected',
      submittedDate: 'Jan 19, 2026',
    },
  ]);

  const handleApprove = (id) => {
    setLeaveRequests(
      leaveRequests.map((req) =>
        req.id === id ? { ...req, status: 'approved' } : req
      )
    );
  };

  const handleReject = (id) => {
    setLeaveRequests(
      leaveRequests.map((req) =>
        req.id === id ? { ...req, status: 'rejected' } : req
      )
    );
  };

  const pendingRequests = leaveRequests.filter((req) => req.status === 'pending');
  const approvedRequests = leaveRequests.filter((req) => req.status === 'approved');
  const rejectedRequests = leaveRequests.filter((req) => req.status === 'rejected');

  return (
    <DashboardLayout role="manager">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Leave Approvals</h1>
          <p className="text-gray-600 mt-1">Review and approve team leave requests</p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-gray-600 text-sm">Pending</p>
                <p className="text-3xl font-bold text-yellow-600 mt-2">{pendingRequests.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-gray-600 text-sm">Approved</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{approvedRequests.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-gray-600 text-sm">Rejected</p>
                <p className="text-3xl font-bold text-red-600 mt-2">{rejectedRequests.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Requests */}
        {pendingRequests.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="text-yellow-600" size={24} />
                Pending Approval ({pendingRequests.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingRequests.map((request) => (
                  <div
                    key={request.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{request.employeeName}</h3>
                        <p className="text-sm text-gray-600 mt-1">{request.leaveType}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {request.from} to {request.to} ({request.days} days)
                        </p>
                      </div>
                      <Badge variant="warning">Pending</Badge>
                    </div>

                    <p className="text-sm text-gray-700 mb-4">
                      <span className="font-semibold">Reason: </span>
                      {request.reason}
                    </p>

                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleReject(request.id)}
                      >
                        Reject
                      </Button>
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => handleApprove(request.id)}
                      >
                        Approve
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Approved Requests */}
        {approvedRequests.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Approved Requests ({approvedRequests.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {approvedRequests.map((request) => (
                  <div
                    key={request.id}
                    className="border border-green-200 rounded-lg p-4 bg-green-50"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{request.employeeName}</h4>
                        <p className="text-sm text-gray-600">
                          {request.leaveType} - {request.from} to {request.to}
                        </p>
                      </div>
                      <Badge variant="success">Approved</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Rejected Requests */}
        {rejectedRequests.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Rejected Requests ({rejectedRequests.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {rejectedRequests.map((request) => (
                  <div
                    key={request.id}
                    className="border border-red-200 rounded-lg p-4 bg-red-50"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{request.employeeName}</h4>
                        <p className="text-sm text-gray-600">
                          {request.leaveType} - {request.from} to {request.to}
                        </p>
                      </div>
                      <Badge variant="danger">Rejected</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

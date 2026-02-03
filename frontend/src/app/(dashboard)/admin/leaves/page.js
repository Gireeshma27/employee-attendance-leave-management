'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import apiService from '@/lib/api';

export default function AdminLeavesPage() {
  const [leaves, setLeaves] = useState([]);
  const [stats, setStats] = useState({
    totalPending: 0,
    totalApproved: 0,
    totalRejected: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLeaveData();
  }, []);

  const fetchLeaveData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiService.leave.getAllLeavesAdmin();
      setLeaves(res.data?.leaves || []);
      setStats({
        totalPending: res.data?.totalPending || 0,
        totalApproved: res.data?.totalApproved || 0,
        totalRejected: res.data?.totalRejected || 0,
      });
    } catch (err) {
      console.error('Error fetching leave data:', err);
      setError(err.message || 'Failed to load leave requests');
    } finally {
      setLoading(false);
    }
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case 'Pending':
        return 'warning';
      case 'Approved':
        return 'success';
      case 'Rejected':
        return 'danger';
      default:
        return 'default';
    }
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6 md:space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-gray-900">Leave Management</h1>
          <p className="text-xs sm:text-sm md:text-sm text-gray-600 mt-1">System-wide leave request overview</p>
        </div>

        {/* Error State */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-4 md:pt-6">
              <p className="text-red-700 text-xs md:text-sm">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Summary Stats */}
        {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
            {/* Pending Requests */}
            <Card>
              <CardContent className="pt-4 md:pt-6 text-center">
                <p className="text-xs md:text-sm text-gray-600">Pending Requests</p>
                <p className="text-2xl md:text-3xl font-bold text-yellow-600 mt-1 md:mt-2">
                  {stats.totalPending}
                </p>
              </CardContent>
            </Card>

            {/* Approved Leaves */}
            <Card>
              <CardContent className="pt-4 md:pt-6 text-center">
                <p className="text-xs md:text-sm text-gray-600">Approved Leaves</p>
                <p className="text-2xl md:text-3xl font-bold text-green-600 mt-1 md:mt-2">
                  {stats.totalApproved}
                </p>
              </CardContent>
            </Card>

            {/* Rejected Leaves */}
            <Card>
              <CardContent className="pt-4 md:pt-6 text-center">
                <p className="text-xs md:text-sm text-gray-600">Rejected Leaves</p>
                <p className="text-2xl md:text-3xl font-bold text-red-600 mt-1 md:mt-2">
                  {stats.totalRejected}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <Card>
            <CardContent className="pt-4 md:pt-6">
              <div className="text-center py-6 md:py-8">
                <p className="text-xs md:text-sm text-gray-600">Loading leave requests...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Leaves Table */}
        {!loading && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base md:text-lg">All Leave Requests ({leaves.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto -mx-2 sm:-mx-4 md:mx-0">
                <table className="w-full text-xs sm:text-sm">
                  <thead className="border-b border-gray-200 bg-gray-50">
                    <tr className="text-gray-600">
                      <th className="text-left py-2 px-2 sm:py-3 sm:px-4 md:px-4">Applied Date</th>
                      <th className="text-left py-2 px-2 sm:py-3 sm:px-4 md:px-4 hidden sm:table-cell">Employee ID</th>
                      <th className="text-left py-2 px-2 sm:py-3 sm:px-4 md:px-4">Employee Name</th>
                      <th className="text-left py-2 px-2 sm:py-3 sm:px-4 md:px-4 hidden sm:table-cell">Department</th>
                      <th className="text-left py-2 px-2 sm:py-3 sm:px-4 md:px-4 hidden md:table-cell">Leave Duration</th>
                      <th className="text-left py-2 px-2 sm:py-3 sm:px-4 md:px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaves.length > 0 ? (
                      leaves.map((leave) => (
                        <tr
                          key={leave._id}
                          className="border-b border-gray-100 hover:bg-gray-50"
                        >
                          <td className="py-2 px-2 sm:py-4 sm:px-4 text-gray-600 text-xs sm:text-sm">
                            {formatDateTime(leave.appliedDate)}
                          </td>
                          <td className="py-2 px-2 sm:py-4 sm:px-4 text-gray-600 hidden sm:table-cell text-xs sm:text-sm">
                            {leave.employeeId}
                          </td>
                          <td className="py-2 px-2 sm:py-4 sm:px-4 font-medium text-gray-900 text-xs sm:text-sm">
                            {leave.employeeName}
                          </td>
                          <td className="py-2 px-2 sm:py-4 sm:px-4 text-gray-600 hidden sm:table-cell text-xs sm:text-sm">
                            {leave.department}
                          </td>
                          <td className="py-2 px-2 sm:py-4 sm:px-4 text-gray-600 hidden md:table-cell text-xs sm:text-sm">
                            {formatDate(leave.fromDate)} – {formatDate(leave.toDate)}
                          </td>
                          <td className="py-2 px-2 sm:py-4 sm:px-4">
                            <Badge
                              variant={getStatusVariant(leave.status)}
                              className="text-xs"
                            >
                              {leave.status}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="py-6 px-2 sm:py-8 sm:px-4 text-center">
                          <p className="text-xs sm:text-sm text-gray-600">No leave requests found</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!loading && !error && leaves.length === 0 && (
          <Card>
            <CardContent className="pt-4 md:pt-6">
              <div className="text-center py-6 md:py-8">
                <p className="text-xs md:text-sm text-gray-600">No leave requests to display</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

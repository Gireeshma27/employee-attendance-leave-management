'use client';

import { useState, useEffect, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Calendar } from 'lucide-react';
import apiService from '@/lib/api';

/* ======================
   DUMMY DATA
====================== */
const dummyLeaves = [
  {
    _id: '1',
    createdAt: new Date(),
    startDate: '2026-02-01',
    endDate: '2026-02-02',
    reason: 'Personal work',
    status: 'pending',
    userId: {
      employeeId: 'EMP001',
      name: 'John Doe',
      department: 'HR',
    },
  },
  {
    _id: '2',
    createdAt: new Date(),
    startDate: '2026-01-28',
    endDate: '2026-01-30',
    reason: 'Medical leave',
    status: 'approved',
    userId: {
      employeeId: 'EMP002',
      name: 'Lavanya',
      department: 'Engineering',
    },
  },
  {
    _id: '3',
    createdAt: new Date(),
    startDate: '2026-01-20',
    endDate: '2026-01-21',
    reason: 'Family function',
    status: 'rejected',
    userId: {
      employeeId: 'EMP003',
      name: 'Gireeshma',
      department: 'Finance',
    },
  },
];

export default function AdminLeavesPage() {
  const [leaves, setLeaves] = useState([]);
  const [stats, setStats] = useState({
    totalPending: 0,
    totalApproved: 0,
    totalRejected: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

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
      const res = await apiService.leave.getPendingLeaves();
      setLeaveRequests(res?.data?.length ? res.data : dummyLeaves);
    } catch {
      setLeaveRequests(dummyLeaves);
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
  const pendingCount = leaveRequests.filter(l => l.status === 'pending').length;
  const approvedCount = leaveRequests.filter(l => l.status === 'approved').length;
  const rejectedCount = leaveRequests.filter(l => l.status === 'rejected').length;

  const filteredData = useMemo(() => {
    return leaveRequests.filter(item => {
      const matchSearch = item.userId.employeeId
        .toLowerCase()
        .includes(search.toLowerCase());

      const itemDate = new Date(item.startDate);
      const matchFrom = fromDate ? itemDate >= new Date(fromDate) : true;
      const matchTo = toDate ? itemDate <= new Date(toDate) : true;

      return matchSearch && matchFrom && matchTo;
    });
  }, [leaveRequests, search, fromDate, toDate]);

  const totalPages = Math.ceil(filteredData.length / pageSize);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const statusBadge = (status) => {
    if (status === 'approved')
      return <Badge className="bg-green-100 text-green-700">Approved</Badge>;
    if (status === 'rejected')
      return <Badge className="bg-red-100 text-red-700">Rejected</Badge>;
    return <Badge className="bg-yellow-100 text-yellow-700">Pending</Badge>;
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6 md:space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-gray-900">Leave Management</h1>
          <p className="text-xs sm:text-sm md:text-sm text-gray-600 mt-1">System-wide leave request overview</p>
      <div className="space-y-8">

        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Leave Management</h1>
            <p className="text-gray-600">System-wide leave tracking</p>
          </div>
          <Button className="bg-blue-600 text-white">Export</Button>
        </div>

        {/* Error State */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-4 md:pt-6">
              <p className="text-red-700 text-xs md:text-sm">{error}</p>
            </CardContent>
          </Card>
        )}

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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card><CardContent className="pt-6 text-center">
              <p className="text-sm">Pending</p>
              <p className="text-3xl font-bold text-yellow-600">{pendingCount}</p>
            </CardContent></Card>

            <Card><CardContent className="pt-6 text-center">
              <p className="text-sm">Approved</p>
              <p className="text-3xl font-bold text-green-600">{approvedCount}</p>
            </CardContent></Card>

            <Card><CardContent className="pt-6 text-center">
              <p className="text-sm">Rejected</p>
              <p className="text-3xl font-bold text-red-600">{rejectedCount}</p>
            </CardContent></Card>

            <Card><CardContent className="pt-6 text-center">
              <p className="text-sm">Total</p>
              <p className="text-3xl font-bold">{leaveRequests.length}</p>
            </CardContent></Card>
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

        <div className="flex justify-between items-center gap-4">
          <Input
            placeholder="Search employee ID..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="max-w-sm"
          />

          <div className="flex items-center gap-2">
            {showDateFilter && (
              <>
                <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
                <Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
              </>
            )}
            <Button variant="outline" onClick={() => setShowDateFilter(p => !p)}>
              <Calendar size={16} />
            </Button>
          </div>
        </div>

        {/* Leaves Table */}
        {!loading && (
        {!loading && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base md:text-lg">All Leave Requests ({leaves.length})</CardTitle>
              <CardTitle>Leave Requests</CardTitle>
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

            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-wider text-gray-500">
                    <th className="px-6 py-4 text-left whitespace-nowrap">Date</th>
                    <th className="px-6 py-4 text-left whitespace-nowrap">Employee ID</th>
                    <th className="px-6 py-4 text-left whitespace-nowrap">Employee Name</th>
                    <th className="px-6 py-4 text-left whitespace-nowrap">Department</th>
                    <th className="px-6 py-4 text-left whitespace-nowrap">From</th>
                    <th className="px-6 py-4 text-left whitespace-nowrap">To</th>
                    <th className="px-6 py-4 text-left whitespace-nowrap">Message</th>
                    <th className="px-6 py-4 text-left whitespace-nowrap">Status</th>
                    <th className="px-6 py-4 text-left whitespace-nowrap">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedData.map(req => (
                    <tr key={req._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {new Date(req.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{req.userId.employeeId}</td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium">{req.userId.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{req.userId.department}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{req.startDate}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{req.endDate}</td>
                      <td className="px-6 py-4">{req.reason}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{statusBadge(req.status)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {req.status === 'pending' ? (
                          <div className="flex gap-2">
                            <Button size="sm" className="bg-green-600 text-white">Approve</Button>
                            <Button size="sm" className="bg-red-600 text-white">Reject</Button>
                          </div>
                        ) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-between items-center px-6 py-4">
                <p className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => p - 1)}>Prev</Button>
                  <Button size="sm" variant="outline" disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => p + 1)}>Next</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

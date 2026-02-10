'use client';

import { useState, useEffect, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Calendar, Edit } from 'lucide-react';
import apiService from '@/lib/api';
import { EditLeaveModal } from '@/components/modals/EditLeaveModal';

/* ======================
   DUMMY DATA
====================== */
const dummyLeaves = [
  {
    _id: '1',
    appliedAt: new Date(),
    startDate: '2026-02-01',
    endDate: '2026-02-02',
    reason: 'Personal work',
    status: 'Pending',
    employee: {
      employeeId: 'EMP001',
      name: 'John Doe',
      department: 'HR',
    },
  },
  {
    _id: '2',
    appliedAt: new Date(),
    startDate: '2026-01-28',
    endDate: '2026-01-30',
    reason: 'Medical leave',
    status: 'Approved',
    employee: {
      employeeId: 'EMP002',
      name: 'Lavanya',
      department: 'Engineering',
    },
  },
  {
    _id: '3',
    appliedAt: new Date(),
    startDate: '2026-01-20',
    endDate: '2026-01-21',
    reason: 'Family function',
    status: 'Rejected',
    employee: {
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

  // Modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);

  useEffect(() => {
    fetchLeaveData();
  }, []);

  const fetchLeaveData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiService.leave.getAllLeaves();
      setLeaves(res.data?.leaves || []);
      setStats({
        totalPending: res.data?.totalPending || 0,
        totalApproved: res.data?.totalApproved || 0,
        totalRejected: res.data?.totalRejected || 0,
      });
    } catch (err) {
      console.error('Error fetching leave data:', err);
      setError(err.message || 'Failed to load leave requests');
      // Fallback to dummy data if API fails
      setLeaves(dummyLeaves);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (leave) => {
    setSelectedLeave(leave);
    setShowEditModal(true);
  };

  const handleEditSuccess = () => {
    fetchLeaveData(); // Refresh data after successful edit
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
  const pendingCount = leaves.filter(l => l.status?.toLowerCase() === 'pending').length;
  const approvedCount = leaves.filter(l => l.status?.toLowerCase() === 'approved').length;
  const rejectedCount = leaves.filter(l => l.status?.toLowerCase() === 'rejected').length;

  const filteredData = useMemo(() => {
    return leaves.filter(item => {
      const matchSearch = item.employee?.employeeId
        .toLowerCase()
        .includes(search.toLowerCase());

      const itemDate = new Date(item.startDate);
      const matchFrom = fromDate ? itemDate >= new Date(fromDate) : true;
      const matchTo = toDate ? itemDate <= new Date(toDate) : true;

      return matchSearch && matchFrom && matchTo;
    });
  }, [leaves, search, fromDate, toDate]);

  const totalPages = Math.ceil(filteredData.length / pageSize);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const statusBadge = (status) => {
    const statusLower = status?.toLowerCase();
    if (statusLower === 'approved')
      return <Badge className="bg-green-100 text-green-700">Approved</Badge>;
    if (statusLower === 'rejected')
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
              <p className="text-3xl font-bold">{leaves.length}</p>
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
            <Button variant="outline" onClick={fetchLeaveData} disabled={loading}>
              {loading ? 'Refreshing...' : 'Refresh'}
            </Button>
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
          <Card>
            <CardHeader>
              <CardTitle className="text-base md:text-lg">All Leave Requests ({leaves.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto -mx-2 sm:-mx-4 md:mx-0">
                <table className="w-full text-xs sm:text-sm">
                  <thead className="border-b border-gray-200 bg-gray-50">
                    <tr className="text-gray-600">
                      <th className="text-left py-2 px-2 sm:py-3 sm:px-4 md:px-4">Date</th>
                      <th className="text-left py-2 px-2 sm:py-3 sm:px-4 md:px-4 hidden sm:table-cell">Employee ID</th>
                      <th className="text-left py-2 px-2 sm:py-3 sm:px-4 md:px-4">Employee Name</th>
                      <th className="text-left py-2 px-2 sm:py-3 sm:px-4 md:px-4 hidden sm:table-cell">Department</th>
                      <th className="text-left py-2 px-2 sm:py-3 sm:px-4 md:px-4 hidden md:table-cell">From</th>
                      <th className="text-left py-2 px-2 sm:py-3 sm:px-4 md:px-4 hidden md:table-cell">To</th>
                      <th className="text-left py-2 px-2 sm:py-3 sm:px-4 md:px-4">Status</th>
                      <th className="text-left py-2 px-2 sm:py-3 sm:px-4 md:px-4">Action</th>
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
                            {formatDateTime(leave.appliedAt)}
                          </td>
                          <td className="py-2 px-2 sm:py-4 sm:px-4 text-gray-600 hidden sm:table-cell text-xs sm:text-sm">
                            {leave.employee?.employeeId}
                          </td>
                          <td className="py-2 px-2 sm:py-4 sm:px-4 font-medium text-gray-900 text-xs sm:text-sm">
                            {leave.employee?.name}
                          </td>
                          <td className="py-2 px-2 sm:py-4 sm:px-4 text-gray-600 hidden sm:table-cell text-xs sm:text-sm">
                            {leave.employee?.department}
                          </td>
                          <td className="py-2 px-2 sm:py-4 sm:px-4 text-gray-600 hidden md:table-cell text-xs sm:text-sm">
                            {formatDate(leave.startDate)}
                          </td>
                          <td className="py-2 px-2 sm:py-4 sm:px-4 text-gray-600 hidden md:table-cell text-xs sm:text-sm">
                            {formatDate(leave.endDate)}
                          </td>
                          <td className="py-2 px-2 sm:py-4 sm:px-4">
                            <Badge
                              variant={getStatusVariant(leave.status)}
                              className="text-xs"
                            >
                              {leave.status}
                            </Badge>
                          </td>
                          <td className="py-2 px-2 sm:py-4 sm:px-4">
                            <button
                              onClick={() => handleEdit(leave)}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit leave status"
                            >
                              <Edit size={16} />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8" className="py-6 px-2 sm:py-8 sm:px-4 text-center">
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
      </div>

      {/* Edit Leave Modal */}
      <EditLeaveModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedLeave(null);
        }}
        leave={selectedLeave}
        onSuccess={handleEditSuccess}
      />
    </DashboardLayout>
  );
}

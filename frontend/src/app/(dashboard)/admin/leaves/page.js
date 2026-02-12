'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { SideDrawer } from '@/components/ui/SideDrawer';
import { Pencil, CheckCircle, XCircle, Clock, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import apiService from '@/lib/api';

export default function AdminLeavesPage() {
  const [leaves, setLeaves] = useState([]);
  const [filteredLeaves, setFilteredLeaves] = useState([]);
  const [stats, setStats] = useState({
    totalPending: 0,
    totalApproved: 0,
    totalRejected: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [leaveTypeFilter, setLeaveTypeFilter] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Edit Drawer State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingLeave, setEditingLeave] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchLeaveData();
  }, []);

  // Apply filters whenever leaves or filter values change
  useEffect(() => {
    let result = [...leaves];
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(leave => 
        leave.employeeName?.toLowerCase().includes(query) ||
        leave.employeeId?.toLowerCase().includes(query) ||
        leave.department?.toLowerCase().includes(query)
      );
    }
    
    // Status filter
    if (statusFilter) {
      result = result.filter(leave => leave.status === statusFilter);
    }
    
    // Department filter
    if (departmentFilter) {
      result = result.filter(leave => leave.department === departmentFilter);
    }
    
    // Leave type filter
    if (leaveTypeFilter) {
      result = result.filter(leave => leave.leaveType === leaveTypeFilter);
    }
    
    setFilteredLeaves(result);
    setCurrentPage(1); // Reset to first page when filters change
  }, [leaves, searchQuery, statusFilter, departmentFilter, leaveTypeFilter]);

  const fetchLeaveData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiService.leave.getAllLeavesAdmin();
      // Show ALL leaves for admin management
      const allLeaves = res.data?.leaves || [];
      setLeaves(allLeaves);
      setFilteredLeaves(allLeaves);
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

  // Pagination calculations
  const totalPages = Math.ceil(filteredLeaves.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedLeaves = filteredLeaves.slice(startIndex, startIndex + rowsPerPage);

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
    setDepartmentFilter('');
    setLeaveTypeFilter('');
    setIsFilterOpen(false);
  };

  const activeFilterCount = [statusFilter, departmentFilter, leaveTypeFilter].filter(Boolean).length;

  const handleEditClick = (leave) => {
    setEditingLeave(leave);
    setSelectedStatus(leave.status);
    setRejectionReason('');
    setIsEditOpen(true);
  };

  const handleUpdateStatus = async () => {
    if (!editingLeave || !selectedStatus) return;
    
    // Don't allow changing from non-pending status
    if (editingLeave.status !== 'Pending') {
      setError('Can only update pending leave requests');
      return;
    }

    try {
      setIsUpdating(true);
      setError(null);

      if (selectedStatus === 'Approved') {
        await apiService.leave.approve(editingLeave._id, {});
      } else if (selectedStatus === 'Rejected') {
        if (!rejectionReason.trim()) {
          setError('Rejection reason is required');
          setIsUpdating(false);
          return;
        }
        await apiService.leave.reject(editingLeave._id, { rejectionReason });
      }

      // Refresh data
      await fetchLeaveData();
      setIsEditOpen(false);
      setEditingLeave(null);
    } catch (err) {
      console.error('Error updating leave status:', err);
      setError(err.message || 'Failed to update leave status');
    } finally {
      setIsUpdating(false);
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

        {/* Search and Filter Bar */}
        {!loading && (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2">
            <div className="relative flex-1 max-w-lg">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
                placeholder="Search by name, ID, or department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-3">
              {/* Quick Status Filter */}
              <select
                className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>

              {/* Advanced Filter Button */}
              <button
                onClick={() => setIsFilterOpen(true)}
                className={`flex items-center justify-center gap-2 px-4 py-2.5 border rounded-lg bg-white shadow-sm transition-colors ${
                  activeFilterCount > 0
                    ? "border-blue-500 text-blue-600 bg-blue-50"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Filter size={18} />
                <span className="text-sm font-medium hidden sm:inline">Filters</span>
                {activeFilterCount > 0 && (
                  <span className="bg-blue-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>
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
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base md:text-lg">
                Leave Requests
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({filteredLeaves.length} {filteredLeaves.length === 1 ? 'request' : 'requests'})
                </span>
              </CardTitle>
              {(searchQuery || statusFilter || departmentFilter || leaveTypeFilter) && (
                <button 
                  onClick={handleResetFilters}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Clear all filters
                </button>
              )}
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto -mx-2 sm:-mx-4 md:mx-0">
                <table className="w-full text-xs sm:text-sm">
                  <thead className="border-b border-gray-200 bg-gray-50">
                    <tr className="text-gray-600">
                      <th className="text-left py-2 px-2 sm:py-3 sm:px-4 md:px-4 whitespace-nowrap">Employee Name</th>
                      <th className="text-left py-2 px-2 sm:py-3 sm:px-4 md:px-4 hidden sm:table-cell whitespace-nowrap">Employee ID</th>
                      <th className="text-left py-2 px-2 sm:py-3 sm:px-4 md:px-4 hidden lg:table-cell whitespace-nowrap">Department</th>
                      <th className="text-left py-2 px-2 sm:py-3 sm:px-4 md:px-4 whitespace-nowrap">Leave Type</th>
                      <th className="text-left py-2 px-2 sm:py-3 sm:px-4 md:px-4 hidden md:table-cell whitespace-nowrap">From</th>
                      <th className="text-left py-2 px-2 sm:py-3 sm:px-4 md:px-4 hidden md:table-cell whitespace-nowrap">To</th>
                      <th className="text-left py-2 px-2 sm:py-3 sm:px-4 md:px-4 hidden xl:table-cell whitespace-nowrap">Reason</th>
                      <th className="text-left py-2 px-2 sm:py-3 sm:px-4 md:px-4 whitespace-nowrap">Days</th>
                      <th className="text-left py-2 px-2 sm:py-3 sm:px-4 md:px-4 whitespace-nowrap">Status</th>
                      <th className="text-center py-2 px-2 sm:py-3 sm:px-4 md:px-4 whitespace-nowrap">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedLeaves.length > 0 ? (
                      paginatedLeaves.map((leave) => (
                        <tr
                          key={leave._id}
                          className="border-b border-gray-100 hover:bg-gray-50"
                        >
                          <td className="py-2 px-2 sm:py-4 sm:px-4 font-medium text-gray-900 text-xs sm:text-sm whitespace-nowrap">
                            {leave.employeeName}
                          </td>
                          <td className="py-2 px-2 sm:py-4 sm:px-4 text-gray-600 hidden sm:table-cell text-xs sm:text-sm whitespace-nowrap">
                            {leave.employeeId}
                          </td>
                          <td className="py-2 px-2 sm:py-4 sm:px-4 text-gray-600 hidden lg:table-cell text-xs sm:text-sm whitespace-nowrap">
                            {leave.department || '-'}
                          </td>
                          <td className="py-2 px-2 sm:py-4 sm:px-4 text-gray-600 text-xs sm:text-sm whitespace-nowrap">
                            {leave.leaveType}
                          </td>
                          <td className="py-2 px-2 sm:py-4 sm:px-4 text-gray-600 hidden md:table-cell text-xs sm:text-sm whitespace-nowrap">
                            {formatDate(leave.fromDate)}
                          </td>
                          <td className="py-2 px-2 sm:py-4 sm:px-4 text-gray-600 hidden md:table-cell text-xs sm:text-sm whitespace-nowrap">
                            {formatDate(leave.toDate)}
                          </td>
                          <td className="py-2 px-2 sm:py-4 sm:px-4 text-gray-600 hidden xl:table-cell text-xs sm:text-sm max-w-[150px] truncate" title={leave.reason}>
                            {leave.reason || '-'}
                          </td>
                          <td className="py-2 px-2 sm:py-4 sm:px-4 text-gray-600 text-xs sm:text-sm whitespace-nowrap">
                            {leave.numberOfDays || '-'}
                          </td>
                          <td className="py-2 px-2 sm:py-4 sm:px-4">
                            <Badge
                              variant={getStatusVariant(leave.status)}
                              className="text-xs"
                            >
                              {leave.status}
                            </Badge>
                          </td>
                          <td className="py-2 px-2 sm:py-4 sm:px-4 text-center">
                            <button
                              onClick={() => handleEditClick(leave)}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit leave status"
                            >
                              <Pencil size={18} />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="10" className="py-6 px-2 sm:py-8 sm:px-4 text-center">
                          <p className="text-xs sm:text-sm text-gray-600">
                            {searchQuery || statusFilter || departmentFilter || leaveTypeFilter 
                              ? 'No leave requests match your filters' 
                              : 'No leave requests found'}
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {filteredLeaves.length > 0 && (
                <div className="px-4 py-4 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-gray-500">Rows per page:</p>
                    <select
                      className="text-sm bg-white border border-gray-200 rounded-md px-2 py-1 focus:ring-1 focus:ring-blue-500 focus:outline-none text-gray-700 font-medium cursor-pointer"
                      value={rowsPerPage}
                      onChange={(e) => {
                        setRowsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                    <span className="text-sm text-gray-500 ml-2">
                      Showing {startIndex + 1}-{Math.min(startIndex + rowsPerPage, filteredLeaves.length)} of {filteredLeaves.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-1.5 rounded-md hover:bg-gray-100 disabled:opacity-30 transition-colors"
                    >
                      <ChevronLeft size={18} className="text-gray-500" />
                    </button>
                    <div className="flex items-center gap-1">
                      {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`min-w-[32px] h-8 flex items-center justify-center rounded-md text-sm font-medium transition-colors ${
                              currentPage === pageNum
                                ? "bg-blue-600 text-white shadow-sm"
                                : "text-gray-500 hover:bg-gray-100"
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages || totalPages === 0}
                      className="p-1.5 rounded-md hover:bg-gray-100 disabled:opacity-30 transition-colors"
                    >
                      <ChevronRight size={18} className="text-gray-500" />
                    </button>
                  </div>
                </div>
              )}
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

      {/* Advanced Filter Drawer */}
      <SideDrawer
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        title="Advanced Filters"
      >
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase">
              Leave Status
            </label>
            <select
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm appearance-none bg-white transition-all"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase">
              Department
            </label>
            <select
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm appearance-none bg-white transition-all"
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
            >
              <option value="">All Departments</option>
              <option value="Administration">Administration</option>
              <option value="HR">HR</option>
              <option value="Engineering">Engineering</option>
              <option value="Design">Design</option>
              <option value="Marketing">Marketing</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase">
              Leave Type
            </label>
            <select
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm appearance-none bg-white transition-all"
              value={leaveTypeFilter}
              onChange={(e) => setLeaveTypeFilter(e.target.value)}
            >
              <option value="">All Types</option>
              <option value="CL">Casual Leave (CL)</option>
              <option value="SL">Sick Leave (SL)</option>
              <option value="PL">Paid Leave (PL)</option>
              <option value="UL">Unpaid Leave (UL)</option>
            </select>
          </div>

          <div className="pt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={handleResetFilters}
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Reset All
            </button>
            <button
              onClick={() => setIsFilterOpen(false)}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 shadow-md shadow-blue-200 transition-all"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </SideDrawer>

      {/* Edit Leave Status Drawer */}
      <SideDrawer
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setEditingLeave(null);
          setRejectionReason('');
        }}
        title="Update Leave Status"
      >
        {editingLeave && (
          <div className="space-y-6">
            {/* Leave Details Summary */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Employee</span>
                <span className="text-sm font-medium text-gray-900">{editingLeave.employeeName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Department</span>
                <span className="text-sm font-medium text-gray-900">{editingLeave.department || '-'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Leave Type</span>
                <span className="text-sm font-medium text-gray-900">{editingLeave.leaveType}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Duration</span>
                <span className="text-sm font-medium text-gray-900">
                  {formatDate(editingLeave.fromDate)} - {formatDate(editingLeave.toDate)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Days</span>
                <span className="text-sm font-medium text-gray-900">{editingLeave.numberOfDays}</span>
              </div>
              {editingLeave.reason && (
                <div className="pt-2 border-t border-gray-200">
                  <span className="text-sm text-gray-500 block mb-1">Reason</span>
                  <p className="text-sm text-gray-700">{editingLeave.reason}</p>
                </div>
              )}
            </div>

            {/* Current Status */}
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-2">
                Current Status
              </label>
              <Badge variant={getStatusVariant(editingLeave.status)} className="text-sm px-3 py-1">
                {editingLeave.status}
              </Badge>
            </div>

            {/* Status Selection - Only for Pending leaves */}
            {editingLeave.status === 'Pending' ? (
              <>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-3">
                    Update Status
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedStatus('Pending')}
                      className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all ${
                        selectedStatus === 'Pending'
                          ? 'border-yellow-500 bg-yellow-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Clock size={24} className={selectedStatus === 'Pending' ? 'text-yellow-600' : 'text-gray-400'} />
                      <span className={`text-sm mt-2 font-medium ${selectedStatus === 'Pending' ? 'text-yellow-700' : 'text-gray-600'}`}>
                        Pending
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedStatus('Approved')}
                      className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all ${
                        selectedStatus === 'Approved'
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <CheckCircle size={24} className={selectedStatus === 'Approved' ? 'text-green-600' : 'text-gray-400'} />
                      <span className={`text-sm mt-2 font-medium ${selectedStatus === 'Approved' ? 'text-green-700' : 'text-gray-600'}`}>
                        Approve
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedStatus('Rejected')}
                      className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all ${
                        selectedStatus === 'Rejected'
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <XCircle size={24} className={selectedStatus === 'Rejected' ? 'text-red-600' : 'text-gray-400'} />
                      <span className={`text-sm mt-2 font-medium ${selectedStatus === 'Rejected' ? 'text-red-700' : 'text-gray-600'}`}>
                        Reject
                      </span>
                    </button>
                  </div>
                </div>

                {/* Rejection Reason */}
                {selectedStatus === 'Rejected' && (
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-2">
                      Rejection Reason <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Please provide a reason for rejection..."
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none text-sm resize-none"
                      rows={3}
                    />
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-4 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditOpen(false);
                      setEditingLeave(null);
                      setRejectionReason('');
                    }}
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateStatus}
                    disabled={isUpdating || selectedStatus === editingLeave.status}
                    className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl text-sm font-bold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUpdating ? 'Updating...' : 'Update Status'}
                  </button>
                </div>
              </>
            ) : (
              <div className="bg-gray-100 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600">
                  This leave request has already been {editingLeave.status.toLowerCase()}.
                  <br />
                  Only pending requests can be updated.
                </p>
                {editingLeave.rejectionReason && (
                  <div className="mt-3 pt-3 border-t border-gray-200 text-left">
                    <span className="text-xs font-bold text-gray-500 uppercase">Rejection Reason</span>
                    <p className="text-sm text-gray-700 mt-1">{editingLeave.rejectionReason}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </SideDrawer>
    </DashboardLayout>
  );
}

'use client';

import { useState, useEffect, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { SideDrawer } from '@/components/ui/SideDrawer';
import {
  Pencil, CheckCircle, XCircle, Clock, Search, Filter,
  ChevronLeft, ChevronRight, CalendarDays, List,
  CheckSquare, Square, AlertCircle,
} from 'lucide-react';
import apiService from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { formatDate } from '@/utils/formatDate';

export default function AdminLeavesPage() {
  const [leaves, setLeaves] = useState([]);
  const [filteredLeaves, setFilteredLeaves] = useState([]);
  const [stats, setStats] = useState({ totalPending: 0, totalApproved: 0, totalRejected: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // View mode: 'list' | 'calendar'
  const [viewMode, setViewMode] = useState('list');

  // Calendar state
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth()); // 0-indexed

  // Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [leaveTypeFilter, setLeaveTypeFilter] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkRejectionReason, setBulkRejectionReason] = useState('');
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [showBulkRejectInput, setShowBulkRejectInput] = useState(false);

  // Edit Drawer State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingLeave, setEditingLeave] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const toast = useToast();

  useEffect(() => {
    fetchLeaveData();
  }, []);

  useEffect(() => {
    let result = [...leaves];
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(leave =>
        leave.employeeName?.toLowerCase().includes(query) ||
        leave.employeeId?.toLowerCase().includes(query) ||
        leave.department?.toLowerCase().includes(query)
      );
    }
    if (statusFilter) result = result.filter(leave => leave.status === statusFilter);
    if (departmentFilter) result = result.filter(leave => leave.department === departmentFilter);
    if (leaveTypeFilter) result = result.filter(leave => leave.leaveType === leaveTypeFilter);
    setFilteredLeaves(result);
    setCurrentPage(1);
    setSelectedIds(new Set());
  }, [leaves, searchQuery, statusFilter, departmentFilter, leaveTypeFilter]);

  const fetchLeaveData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiService.leave.getAllLeavesAdmin();
      const allLeaves = res.data?.leaves || [];
      setLeaves(allLeaves);
      setFilteredLeaves(allLeaves);
      setStats({
        totalPending: res.data?.totalPending || 0,
        totalApproved: res.data?.totalApproved || 0,
        totalRejected: res.data?.totalRejected || 0,
      });
    } catch (err) {
      setError(err.message || 'Failed to load leave requests');
    } finally {
      setLoading(false);
    }
  };

  // â”€â”€ Pagination â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const totalPages = Math.ceil(filteredLeaves.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedLeaves = filteredLeaves.slice(startIndex, startIndex + rowsPerPage);

  // â”€â”€ Bulk selection helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const pendingOnPage = paginatedLeaves.filter(l => l.status === 'Pending');
  const allOnPageSelected = pendingOnPage.length > 0 && pendingOnPage.every(l => selectedIds.has(l._id));

  const toggleSelect = (id, status) => {
    if (status !== 'Pending') return;
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allOnPageSelected) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        pendingOnPage.forEach(l => next.delete(l._id));
        return next;
      });
    } else {
      setSelectedIds(prev => {
        const next = new Set(prev);
        pendingOnPage.forEach(l => next.add(l._id));
        return next;
      });
    }
  };

  const handleBulkApprove = async () => {
    if (selectedIds.size === 0) return;
    try {
      setIsBulkUpdating(true);
      await Promise.all([...selectedIds].map(id => apiService.leave.approve(id, {})));
      toast.success('Bulk Approved', `${selectedIds.size} leave request(s) approved.`);
      setSelectedIds(new Set());
      await fetchLeaveData();
    } catch (err) {
      toast.error('Bulk Approve Failed', err.message || 'Some approvals failed.');
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const handleBulkReject = async () => {
    if (selectedIds.size === 0) return;
    if (!bulkRejectionReason.trim()) {
      setShowBulkRejectInput(true);
      return;
    }
    try {
      setIsBulkUpdating(true);
      await Promise.all([...selectedIds].map(id =>
        apiService.leave.reject(id, { rejectionReason: bulkRejectionReason })
      ));
      toast.success('Bulk Rejected', `${selectedIds.size} leave request(s) rejected.`);
      setSelectedIds(new Set());
      setBulkRejectionReason('');
      setShowBulkRejectInput(false);
      await fetchLeaveData();
    } catch (err) {
      toast.error('Bulk Reject Failed', err.message || 'Some rejections failed.');
    } finally {
      setIsBulkUpdating(false);
    }
  };

  // â”€â”€ Filters & misc â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
    if (editingLeave.status !== 'Pending') {
      setError('Can only update pending leave requests');
      return;
    }
    try {
      setIsUpdating(true);
      setError(null);
      if (selectedStatus === 'Approved') {
        await apiService.leave.approve(editingLeave._id, {});
        toast.success('Leave Approved', `${editingLeave.employeeName}'s leave has been approved.`);
      } else if (selectedStatus === 'Rejected') {
        if (!rejectionReason.trim()) { setError('Rejection reason is required'); setIsUpdating(false); return; }
        await apiService.leave.reject(editingLeave._id, { rejectionReason });
        toast.success('Leave Rejected', `${editingLeave.employeeName}'s leave has been rejected.`);
      }
      await fetchLeaveData();
      setIsEditOpen(false);
      setEditingLeave(null);
    } catch (err) {
      setError(err.message || 'Failed to update leave status');
      toast.error('Update Failed', err.message || 'Failed to update leave status.');
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusVariant = (status) => {
    if (status === 'Pending') return 'warning';
    if (status === 'Approved') return 'success';
    if (status === 'Rejected') return 'danger';
    return 'default';
  };

  // â”€â”€ Calendar helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const calendarLeaves = useMemo(() => {
    // Build a map: "YYYY-MM-DD" â†’ leave[]
    const map = {};
    leaves.forEach(leave => {
      const from = new Date(leave.fromDate);
      const to = new Date(leave.toDate);
      const cur = new Date(from);
      while (cur <= to) {
        if (cur.getFullYear() === calendarYear && cur.getMonth() === calendarMonth) {
          const key = cur.toISOString().split('T')[0];
          if (!map[key]) map[key] = [];
          map[key].push(leave);
        }
        cur.setDate(cur.getDate() + 1);
      }
    });
    return map;
  }, [leaves, calendarYear, calendarMonth]);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(calendarYear, calendarMonth, 1);
    const lastDay = new Date(calendarYear, calendarMonth + 1, 0);
    const days = [];
    // Leading empty cells
    for (let i = 0; i < firstDay.getDay(); i++) days.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) days.push(d);
    return days;
  }, [calendarYear, calendarMonth]);

  const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const DAY_LABELS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  const prevMonth = () => {
    if (calendarMonth === 0) { setCalendarMonth(11); setCalendarYear(y => y - 1); }
    else setCalendarMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (calendarMonth === 11) { setCalendarMonth(0); setCalendarYear(y => y + 1); }
    else setCalendarMonth(m => m + 1);
  };

  // â”€â”€ Render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  return (
    <DashboardLayout role="admin">
      <div className="space-y-6 md:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-lg sm:text-2xl md:text-3xl font-semibold text-slate-900">Leave Management</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">System-wide leave request overview</p>
          </div>
          {/* View toggle */}
          <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 self-start sm:self-auto">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <List size={14} /> List
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${viewMode === 'calendar' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <CalendarDays size={14} /> Calendar
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <Card className="border-red-200/60 bg-red-50">
            <CardContent className="pt-4">
              <p className="text-red-700 text-xs md:text-sm">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
            <Card>
              <CardContent className="pt-4 md:pt-6 text-center">
                <p className="text-xs md:text-sm text-slate-500">Pending Requests</p>
                <p className="text-2xl md:text-3xl font-semibold text-yellow-600 mt-1 md:mt-2">{stats.totalPending}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 md:pt-6 text-center">
                <p className="text-xs md:text-sm text-slate-500">Approved Leaves</p>
                <p className="text-2xl md:text-3xl font-semibold text-green-600 mt-1 md:mt-2">{stats.totalApproved}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 md:pt-6 text-center">
                <p className="text-xs md:text-sm text-slate-500">Rejected Leaves</p>
                <p className="text-2xl md:text-3xl font-semibold text-red-600 mt-1 md:mt-2">{stats.totalRejected}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {loading && (
          <Card><CardContent className="pt-4 md:pt-6"><div className="text-center py-6 md:py-8"><p className="text-xs md:text-sm text-slate-500">Loading leave requests...</p></div></CardContent></Card>
        )}

        {/* â”€â”€ CALENDAR VIEW â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {!loading && viewMode === 'calendar' && (
          <Card className="overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{MONTH_NAMES[calendarMonth]} {calendarYear}</CardTitle>
                <div className="flex items-center gap-2">
                  <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"><ChevronLeft size={16} className="text-slate-500" /></button>
                  <button onClick={() => { setCalendarMonth(new Date().getMonth()); setCalendarYear(new Date().getFullYear()); }} className="px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Today</button>
                  <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"><ChevronRight size={16} className="text-slate-500" /></button>
                </div>
              </div>
              {/* Legend */}
              <div className="flex items-center gap-4 mt-3 flex-wrap">
                {[
                  { color: 'bg-yellow-400', label: 'Pending' },
                  { color: 'bg-green-500', label: 'Approved' },
                  { color: 'bg-red-400', label: 'Rejected' },
                ].map(({ color, label }) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
                    <span className="text-[10px] font-medium text-slate-500">{label}</span>
                  </div>
                ))}
              </div>
            </CardHeader>
            <CardContent className="p-3 md:p-4">
              {/* Day labels */}
              <div className="grid grid-cols-7 mb-2">
                {DAY_LABELS.map(d => (
                  <div key={d} className="text-center text-[10px] font-semibold text-slate-400 uppercase tracking-wider py-1">{d}</div>
                ))}
              </div>
              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, idx) => {
                  if (!day) return <div key={`empty-${idx}`} />;
                  const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const dayLeaves = calendarLeaves[dateStr] || [];
                  const pending = dayLeaves.filter(l => l.status === 'Pending');
                  const approved = dayLeaves.filter(l => l.status === 'Approved');
                  const rejected = dayLeaves.filter(l => l.status === 'Rejected');
                  const isToday = new Date().toISOString().split('T')[0] === dateStr;
                  return (
                    <div
                      key={dateStr}
                      className={`min-h-[64px] md:min-h-[80px] rounded-xl border p-1.5 transition-colors ${isToday ? 'border-blue-400 bg-blue-50/50' : 'border-slate-100 bg-white hover:bg-slate-50/50'}`}
                    >
                      <p className={`text-xs font-semibold mb-1 ${isToday ? 'text-blue-700' : 'text-slate-700'}`}>{day}</p>
                      <div className="space-y-0.5">
                        {pending.length > 0 && (
                          <div
                            className="flex items-center gap-1 px-1.5 py-0.5 bg-yellow-100 rounded text-[9px] font-medium text-yellow-800 cursor-pointer hover:bg-yellow-200 transition-colors truncate"
                            onClick={() => handleEditClick(pending[0])}
                            title={pending.map(l => l.employeeName).join(', ')}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 flex-shrink-0" />
                            <span className="truncate">{pending.length === 1 ? pending[0].employeeName?.split(' ')[0] : `${pending.length} pending`}</span>
                          </div>
                        )}
                        {approved.length > 0 && (
                          <div className="flex items-center gap-1 px-1.5 py-0.5 bg-green-100 rounded text-[9px] font-medium text-green-800 truncate" title={approved.map(l => l.employeeName).join(', ')}>
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                            <span className="truncate">{approved.length === 1 ? approved[0].employeeName?.split(' ')[0] : `${approved.length} approved`}</span>
                          </div>
                        )}
                        {rejected.length > 0 && (
                          <div className="flex items-center gap-1 px-1.5 py-0.5 bg-red-100 rounded text-[9px] font-medium text-red-800 truncate" title={rejected.map(l => l.employeeName).join(', ')}>
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                            <span className="truncate">{rejected.length === 1 ? rejected[0].employeeName?.split(' ')[0] : `${rejected.length} rejected`}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* â”€â”€ LIST VIEW â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {!loading && viewMode === 'list' && (
          <>
            {/* Search & Filter Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2">
              <div className="relative flex-1 max-w-lg">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 bg-white shadow-sm transition-all"
                  placeholder="Search by name, ID, or department..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-3">
                <select
                  className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
                <button
                  onClick={() => setIsFilterOpen(true)}
                  className={`flex items-center justify-center gap-2 px-4 py-2.5 border rounded-xl bg-white shadow-sm transition-colors ${activeFilterCount > 0 ? 'border-blue-500 text-blue-600 bg-blue-50' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  <Filter size={18} />
                  <span className="text-sm font-medium hidden sm:inline">Filters</span>
                  {activeFilterCount > 0 && <span className="bg-blue-600 text-white text-xs font-medium px-1.5 py-0.5 rounded-full">{activeFilterCount}</span>}
                </button>
              </div>
            </div>

            {/* Bulk Action Bar */}
            {selectedIds.size > 0 && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex items-center gap-2 text-sm font-medium text-blue-800">
                  <CheckSquare size={16} className="text-blue-600" />
                  {selectedIds.size} leave request{selectedIds.size !== 1 ? 's' : ''} selected
                </div>
                <div className="flex items-center gap-2 sm:ml-auto flex-wrap">
                  {showBulkRejectInput ? (
                    <>
                      <input
                        type="text"
                        value={bulkRejectionReason}
                        onChange={(e) => setBulkRejectionReason(e.target.value)}
                        placeholder="Rejection reason (required)..."
                        className="flex-1 min-w-[200px] px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
                      />
                      <button
                        onClick={handleBulkReject}
                        disabled={isBulkUpdating || !bulkRejectionReason.trim()}
                        className="flex items-center gap-1.5 px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <XCircle size={14} /> {isBulkUpdating ? 'Rejecting...' : 'Confirm Reject'}
                      </button>
                      <button onClick={() => { setShowBulkRejectInput(false); setBulkRejectionReason(''); }} className="px-3 py-1.5 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={handleBulkApprove}
                        disabled={isBulkUpdating}
                        className="flex items-center gap-1.5 px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <CheckCircle size={14} /> {isBulkUpdating ? 'Approving...' : 'Approve All'}
                      </button>
                      <button
                        onClick={() => setShowBulkRejectInput(true)}
                        disabled={isBulkUpdating}
                        className="flex items-center gap-1.5 px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <XCircle size={14} /> Reject All
                      </button>
                      <button onClick={() => setSelectedIds(new Set())} className="px-3 py-1.5 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Deselect</button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Leaves Table */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base md:text-lg">
                  Leave Requests
                  <span className="ml-2 text-sm font-normal text-slate-500">
                    ({filteredLeaves.length} {filteredLeaves.length === 1 ? 'request' : 'requests'})
                  </span>
                </CardTitle>
                {(searchQuery || statusFilter || departmentFilter || leaveTypeFilter) && (
                  <button onClick={handleResetFilters} className="text-sm text-blue-600 hover:text-blue-700 font-medium">Clear all filters</button>
                )}
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto -mx-2 sm:-mx-4 md:mx-0">
                  <table className="w-full text-xs sm:text-sm">
                    <thead className="border-b border-slate-200">
                      <tr className="text-slate-500">
                        <th className="text-left py-3 px-2 sm:px-4 w-10">
                          <button
                            onClick={toggleSelectAll}
                            className="text-slate-400 hover:text-slate-700 transition-colors"
                            title={allOnPageSelected ? 'Deselect all on page' : 'Select all pending on page'}
                          >
                            {allOnPageSelected ? <CheckSquare size={16} className="text-blue-600" /> : <Square size={16} />}
                          </button>
                        </th>
                        <th className="text-left py-3 px-2 sm:px-4 whitespace-nowrap text-xs font-medium">Employee</th>
                        <th className="text-left py-3 px-2 sm:px-4 hidden sm:table-cell whitespace-nowrap text-xs font-medium">ID</th>
                        <th className="text-left py-3 px-2 sm:px-4 hidden lg:table-cell whitespace-nowrap text-xs font-medium">Dept.</th>
                        <th className="text-left py-3 px-2 sm:px-4 whitespace-nowrap text-xs font-medium">Type</th>
                        <th className="text-left py-3 px-2 sm:px-4 hidden md:table-cell whitespace-nowrap text-xs font-medium">From</th>
                        <th className="text-left py-3 px-2 sm:px-4 hidden md:table-cell whitespace-nowrap text-xs font-medium">To</th>
                        <th className="text-left py-3 px-2 sm:px-4 hidden xl:table-cell whitespace-nowrap text-xs font-medium">Reason</th>
                        <th className="text-left py-3 px-2 sm:px-4 whitespace-nowrap text-xs font-medium">Days</th>
                        <th className="text-left py-3 px-2 sm:px-4 whitespace-nowrap text-xs font-medium">Status</th>
                        <th className="text-center py-3 px-2 sm:px-4 whitespace-nowrap text-xs font-medium sticky right-0 bg-white z-10">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedLeaves.length > 0 ? paginatedLeaves.map((leave) => (
                        <tr
                          key={leave._id}
                          className={`border-b border-slate-100 transition-colors ${selectedIds.has(leave._id) ? 'bg-blue-50/60' : 'hover:bg-slate-50/50'}`}
                        >
                          <td className="py-2 px-2 sm:px-4">
                            {leave.status === 'Pending' ? (
                              <button onClick={() => toggleSelect(leave._id, leave.status)} className="text-slate-400 hover:text-blue-600 transition-colors">
                                {selectedIds.has(leave._id) ? <CheckSquare size={16} className="text-blue-600" /> : <Square size={16} />}
                              </button>
                            ) : (
                              <span className="w-4 h-4 block" />
                            )}
                          </td>
                          <td className="py-2 px-2 sm:px-4 font-medium text-slate-900 text-xs sm:text-sm whitespace-nowrap">{leave.employeeName}</td>
                          <td className="py-2 px-2 sm:px-4 text-slate-600 hidden sm:table-cell text-xs sm:text-sm whitespace-nowrap">{leave.employeeId}</td>
                          <td className="py-2 px-2 sm:px-4 text-slate-600 hidden lg:table-cell text-xs sm:text-sm whitespace-nowrap">{leave.department || '-'}</td>
                          <td className="py-2 px-2 sm:px-4 text-slate-600 text-xs sm:text-sm whitespace-nowrap">{leave.leaveType}</td>
                          <td className="py-2 px-2 sm:px-4 text-slate-600 hidden md:table-cell text-xs sm:text-sm whitespace-nowrap">{formatDate(leave.fromDate)}</td>
                          <td className="py-2 px-2 sm:px-4 text-slate-600 hidden md:table-cell text-xs sm:text-sm whitespace-nowrap">{formatDate(leave.toDate)}</td>
                          <td className="py-2 px-2 sm:px-4 text-slate-500 hidden xl:table-cell text-xs sm:text-sm max-w-[150px] truncate" title={leave.reason}>{leave.reason || '-'}</td>
                          <td className="py-2 px-2 sm:px-4 text-slate-600 text-xs sm:text-sm whitespace-nowrap">{leave.numberOfDays || '-'}</td>
                          <td className="py-2 px-2 sm:px-4"><Badge variant={getStatusVariant(leave.status)} dot>{leave.status}</Badge></td>
                          <td className="py-2 px-2 sm:px-4 text-center sticky right-0 bg-white z-10">
                            <button
                              onClick={() => handleEditClick(leave)}
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit leave status"
                            >
                              <Pencil size={18} />
                            </button>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan="11" className="py-6 px-2 sm:py-8 sm:px-4 text-center">
                            <p className="text-xs sm:text-sm text-slate-500">
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
                  <div className="px-4 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-slate-500">Rows per page:</p>
                      <select
                        className="text-sm bg-white border border-slate-200 rounded-lg px-2 py-1 focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 focus:outline-none text-slate-700 font-medium cursor-pointer transition-all"
                        value={rowsPerPage}
                        onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                      >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                      </select>
                      <span className="text-sm text-slate-500 ml-2">
                        Showing {startIndex + 1}-{Math.min(startIndex + rowsPerPage, filteredLeaves.length)} of {filteredLeaves.length}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 transition-colors"><ChevronLeft size={18} className="text-slate-500" /></button>
                      <div className="flex items-center gap-1">
                        {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                          let pageNum;
                          if (totalPages <= 5) pageNum = i + 1;
                          else if (currentPage <= 3) pageNum = i + 1;
                          else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                          else pageNum = currentPage - 2 + i;
                          return (
                            <button key={pageNum} onClick={() => setCurrentPage(pageNum)} className={`min-w-[32px] h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${currentPage === pageNum ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}>{pageNum}</button>
                          );
                        })}
                      </div>
                      <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0} className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 transition-colors"><ChevronRight size={18} className="text-slate-500" /></button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {!error && leaves.length === 0 && (
              <Card><CardContent className="pt-4 md:pt-6"><div className="text-center py-6 md:py-8"><p className="text-xs md:text-sm text-slate-500">No leave requests to display</p></div></CardContent></Card>
            )}
          </>
        )}
      </div>

      {/* Advanced Filter Drawer */}
      <SideDrawer isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} title="Advanced Filters">
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-500">Leave Status</label>
            <select className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 focus:outline-none text-sm appearance-none bg-white transition-all" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-500">Department</label>
            <select className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 focus:outline-none text-sm appearance-none bg-white transition-all" value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)}>
              <option value="">All Departments</option>
              <option value="Administration">Administration</option>
              <option value="HR">HR</option>
              <option value="Engineering">Engineering</option>
              <option value="Design">Design</option>
              <option value="Marketing">Marketing</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-500">Leave Type</label>
            <select className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 focus:outline-none text-sm appearance-none bg-white transition-all" value={leaveTypeFilter} onChange={(e) => setLeaveTypeFilter(e.target.value)}>
              <option value="">All Types</option>
              <option value="CL">Casual Leave (CL)</option>
              <option value="SL">Sick Leave (SL)</option>
              <option value="PL">Paid Leave (PL)</option>
              <option value="UL">Unpaid Leave (UL)</option>
            </select>
          </div>
          <div className="pt-4 flex items-center gap-3">
            <button type="button" onClick={handleResetFilters} className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">Reset All</button>
            <button onClick={() => setIsFilterOpen(false)} className="flex-1 px-4 py-3 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition-all active:scale-[0.98]">Apply Filters</button>
          </div>
        </div>
      </SideDrawer>

      {/* Edit Leave Status Drawer */}
      <SideDrawer
        isOpen={isEditOpen}
        onClose={() => { setIsEditOpen(false); setEditingLeave(null); setRejectionReason(''); }}
        title="Update Leave Status"
      >
        {editingLeave && (
          <div className="space-y-6">
            <div className="bg-slate-50 rounded-xl p-4 space-y-3">
              {[
                { label: 'Employee', value: editingLeave.employeeName },
                { label: 'Department', value: editingLeave.department || '-' },
                { label: 'Leave Type', value: editingLeave.leaveType },
                { label: 'Duration', value: `${formatDate(editingLeave.fromDate)} - ${formatDate(editingLeave.toDate)}` },
                { label: 'Days', value: editingLeave.numberOfDays },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">{label}</span>
                  <span className="text-sm font-medium text-slate-900">{value}</span>
                </div>
              ))}
              {editingLeave.reason && (
                <div className="pt-2 border-t border-slate-200">
                  <span className="text-sm text-slate-500 block mb-1">Reason</span>
                  <p className="text-sm text-slate-700">{editingLeave.reason}</p>
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-medium text-slate-500 block mb-2">Current Status</label>
              <Badge variant={getStatusVariant(editingLeave.status)} className="text-sm px-3 py-1">{editingLeave.status}</Badge>
            </div>

            {editingLeave.status === 'Pending' ? (
              <>
                <div>
                  <label className="text-xs font-medium text-slate-500 block mb-3">Update Status</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { status: 'Pending', icon: Clock, activeClass: 'border-yellow-500 bg-yellow-50', activeText: 'text-yellow-700', activeIcon: 'text-yellow-600' },
                      { status: 'Approved', icon: CheckCircle, activeClass: 'border-green-500 bg-green-50', activeText: 'text-green-700', activeIcon: 'text-green-600' },
                      { status: 'Rejected', icon: XCircle, activeClass: 'border-red-500 bg-red-50', activeText: 'text-red-700', activeIcon: 'text-red-600' },
                    ].map(({ status, icon: Icon, activeClass, activeText, activeIcon }) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setSelectedStatus(status)}
                        className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${selectedStatus === status ? activeClass : 'border-slate-200 hover:border-slate-300'}`}
                      >
                        <Icon size={24} className={selectedStatus === status ? activeIcon : 'text-slate-400'} />
                        <span className={`text-sm mt-2 font-medium ${selectedStatus === status ? activeText : 'text-slate-600'}`}>
                          {status === 'Approved' ? 'Approve' : status === 'Rejected' ? 'Reject' : status}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {selectedStatus === 'Rejected' && (
                  <div>
                    <label className="text-xs font-medium text-slate-500 block mb-2">Rejection Reason <span className="text-red-500">*</span></label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Please provide a reason for rejection..."
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-400 focus:outline-none text-sm resize-none transition-all"
                      rows={3}
                    />
                  </div>
                )}

                {error && <div className="bg-red-50 border border-red-200/60 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>}

                <div className="pt-4 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => { setIsEditOpen(false); setEditingLeave(null); setRejectionReason(''); }}
                    className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                  >Cancel</button>
                  <button
                    onClick={handleUpdateStatus}
                    disabled={isUpdating || selectedStatus === editingLeave.status}
                    className="flex-1 px-4 py-3 bg-slate-900 hover:bg-slate-800 rounded-xl text-sm font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                  >
                    {isUpdating ? 'Updating...' : 'Update Status'}
                  </button>
                </div>
              </>
            ) : (
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-sm text-slate-600">This leave has already been <strong>{editingLeave.status.toLowerCase()}</strong> and cannot be modified.</p>
              </div>
            )}
          </div>
        )}
      </SideDrawer>
    </DashboardLayout>
  );
}

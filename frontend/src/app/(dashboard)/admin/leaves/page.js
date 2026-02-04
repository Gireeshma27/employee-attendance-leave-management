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

export default function LeavesPage() {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  useEffect(() => {
    fetchLeaveRequests();
  }, []);

  const fetchLeaveRequests = async () => {
    try {
      const res = await apiService.leave.getPendingLeaves();
      setLeaveRequests(res?.data?.length ? res.data : dummyLeaves);
    } catch {
      setLeaveRequests(dummyLeaves);
    } finally {
      setLoading(false);
    }
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
      <div className="space-y-8">

        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Leave Management</h1>
            <p className="text-gray-600">System-wide leave tracking</p>
          </div>
          <Button className="bg-blue-600 text-white">Export</Button>
        </div>

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
              <p className="text-3xl font-bold">{leaveRequests.length}</p>
            </CardContent></Card>
          </div>
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

        {!loading && (
          <Card>
            <CardHeader>
              <CardTitle>Leave Requests</CardTitle>
            </CardHeader>

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

'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Plus, Pencil } from 'lucide-react';
import { useState, useEffect } from 'react';
import apiService from '@/lib/api';
import { AddEmployeeModal } from '@/components/modals/AddEmployeeModal';
import { EditEmployeeModal } from '@/components/modals/EditEmployeeModal';

export default function EmployeesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [pagination, setPagination] = useState({
    totalRecords: 0,
    totalPages: 1,
    currentPage: 1,
    limit: 10,
  });

  useEffect(() => {
    setCurrentPage(1);
    fetchEmployees(1);
  }, [searchTerm, roleFilter, statusFilter, rowsPerPage]);

  const fetchEmployees = async (pageNum = currentPage) => {
    try {
      setLoading(true);
      setError(null);
      // Update currentPage state to keep it in sync
      if (pageNum !== currentPage) {
        setCurrentPage(pageNum);
      }
      const filters = {
        page: pageNum,
        limit: rowsPerPage,
      };

      if (searchTerm) filters.search = searchTerm;
      if (roleFilter) filters.role = roleFilter;
      if (statusFilter !== '') {
        filters.isActive = statusFilter === 'active';
      }

      const res = await apiService.user.getAll(filters);
      setEmployees(res.data?.records || res.data || []);
      if (res.data?.pagination) {
        setPagination(res.data.pagination);
      } else {
        // Fallback for non-paginated response
        setPagination({
          totalRecords: (res.data?.records || res.data || []).length,
          totalPages: 1,
          currentPage: 1,
          limit: rowsPerPage,
        });
      }
    } catch (err) {
      console.error('Error fetching employees:', err);
      setError(err.message || 'Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (employee) => {
    setSelectedEmployee(employee);
    setIsEditModalOpen(true);
  };

  const handleAddSuccess = () => {
    setCurrentPage(1);
    fetchEmployees(1);
  };

  const handleEditSuccess = () => {
    fetchEmployees(currentPage);
  };

  const activeCount = employees.filter((emp) => emp.isActive).length;
  const inactiveCount = employees.filter((emp) => !emp.isActive).length;

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6 md:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-gray-900">Employees</h1>
            <p className="text-xs sm:text-sm md:text-base text-gray-600 mt-1">Manage all employees in the system</p>
          </div>
          <Button
            variant="primary"
            size="md"
            className="flex items-center gap-2"
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus size={18} />
            Add Employee
          </Button>
        </div>

        {/* Search & Filters */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                Search
              </label>
              <Input
                placeholder="Name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                Role
              </label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">All Roles</option>
                <option value="ADMIN">Admin</option>
                <option value="MANAGER">Manager</option>
                <option value="EMPLOYEE">Employee</option>
              </select>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setRoleFilter('');
                  setStatusFilter('');
                }}
                className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-4 focus:ring-gray-100 transition-all h-[42px]"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Error State */}
        {
          error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <p className="text-sm md:text-base text-red-700">{error}</p>
              </CardContent>
            </Card>
          )
        }

        {/* Loading State */}
        {
          loading && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <p className="text-gray-600">Loading employees...</p>
                </div>
              </CardContent>
            </Card>
          )
        }

        {/* Summary Cards - Above Table */}
        {
          !loading && employees.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <Card className="hover:shadow-md transition-shadow border-gray-100">
                <CardContent className="pt-6 text-center">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Employees</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2 tracking-tight">
                    {pagination.totalRecords}
                  </p>
                </CardContent>
              </Card>
              <Card className="hover:shadow-md transition-shadow border-gray-100">
                <CardContent className="pt-6 text-center">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Active</p>
                  <p className="text-3xl font-bold text-green-600 mt-2 tracking-tight">
                    {activeCount}
                  </p>
                </CardContent>
              </Card>
              <Card className="hover:shadow-md transition-shadow border-gray-100">
                <CardContent className="pt-6 text-center">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Inactive</p>
                  <p className="text-3xl font-bold text-gray-600 mt-2 tracking-tight">
                    {inactiveCount}
                  </p>
                </CardContent>
              </Card>
            </div>
          )
        }

        {/* Employees Table */}
        {
          !loading && employees.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <CardTitle>Employee Directory</CardTitle>
                  <div className="flex flex-col xs:flex-row items-start xs:items-center gap-2 xs:gap-3 text-xs sm:text-sm">
                    <select
                      value={rowsPerPage}
                      onChange={(e) => setRowsPerPage(parseInt(e.target.value))}
                      className="px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                    >
                      <option value="5">5 per page</option>
                      <option value="10">10 per page</option>
                      <option value="25">25 per page</option>
                      <option value="50">50 per page</option>
                    </select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border border-gray-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50/80 border-b border-gray-200">
                        <tr className="text-gray-500 font-semibold uppercase tracking-wider text-xs">
                          <th className="py-4 px-6 whitespace-nowrap">Name</th>
                          <th className="py-4 px-6 hidden sm:table-cell whitespace-nowrap">Email</th>
                          <th className="py-4 px-6 hidden md:table-cell whitespace-nowrap">Employee ID</th>
                          <th className="py-4 px-6 hidden lg:table-cell whitespace-nowrap">Department</th>
                          <th className="py-4 px-6 whitespace-nowrap">Role</th>
                          <th className="py-4 px-6 whitespace-nowrap">Status</th>
                          <th className="py-4 px-6 hidden lg:table-cell whitespace-nowrap">WFH Used</th>
                          <th className="py-4 px-6 hidden lg:table-cell whitespace-nowrap">WFH Remaining</th>
                          <th className="py-4 px-6 hidden xl:table-cell whitespace-nowrap">Timing Group</th>
                          <th className="py-4 px-6 text-center whitespace-nowrap sticky right-0 bg-gray-50/80 z-10">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {employees.map((emp) => (
                          <tr
                            key={emp._id}
                            className="hover:bg-gray-50/80 transition-colors border-b border-gray-50 last:border-0"
                          >
                            <td className="py-4 px-6 font-medium text-gray-900 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs uppercase">
                                  {emp.name.charAt(0)}
                                </div>
                                {emp.name}
                              </div>
                            </td>
                            <td className="py-4 px-6 text-gray-500 hidden sm:table-cell whitespace-nowrap">
                              {emp.email}
                            </td>
                            <td className="py-4 px-6 text-gray-500 font-mono text-xs hidden md:table-cell whitespace-nowrap">
                              {emp.employeeId || 'N/A'}
                            </td>
                            <td className="py-4 px-6 text-gray-600 hidden lg:table-cell whitespace-nowrap">
                              {emp.department || 'N/A'}
                            </td>
                            <td className="py-4 px-6 text-gray-600 capitalize whitespace-nowrap">
                              <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">
                                {emp.role.toLowerCase()}
                              </Badge>
                            </td>
                            <td className="py-4 px-6 whitespace-nowrap">
                              <Badge
                                variant={emp.isActive ? 'success' : 'secondary'}
                              >
                                {emp.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                            </td>
                            <td className="py-4 px-6 text-gray-600 hidden lg:table-cell whitespace-nowrap">
                              <span className={emp.wfhAllowed ? 'text-blue-600 font-medium' : 'text-gray-400'}>
                                {emp.usedWFHDays || 0} days
                              </span>
                            </td>
                            <td className="py-4 px-6 text-gray-600 hidden lg:table-cell whitespace-nowrap">
                              <span className={emp.wfhAllowed && emp.wfhDaysRemaining > 0 ? 'text-green-600 font-medium' : 'text-gray-400'}>
                                {emp.wfhDaysRemaining || 0} days
                              </span>
                            </td>
                            <td className="py-4 px-6 text-gray-600 hidden xl:table-cell whitespace-nowrap">
                              {emp.timingId ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-medium">
                                  {emp.timingId.teamName} ({emp.timingId.loginTime})
                                </span>
                              ) : emp.timingInfo ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-50 text-gray-600 rounded-md text-xs font-medium">
                                  {emp.timingInfo.teamName} ({emp.timingInfo.loginTime})
                                </span>
                              ) : (
                                <span className="text-gray-400 text-xs">Not assigned</span>
                              )}
                            </td>
                            <td className="py-4 px-6 text-center whitespace-nowrap sticky right-0 bg-white z-10">
                              <div className="flex items-center justify-center">
                                <button
                                  onClick={() => handleEditClick(emp)}
                                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Edit employee"
                                >
                                  <Pencil size={18} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Pagination Controls - Matching Attendance Page Style */}
                <div className="px-5 py-4 border-t border-gray-100 bg-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <p className="text-xs sm:text-sm text-gray-500">Rows per page:</p>
                    <select
                      className="text-xs sm:text-sm bg-transparent border-none focus:ring-0 text-gray-700 font-medium cursor-pointer"
                      value={rowsPerPage}
                      onChange={(e) => {
                        setRowsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => fetchEmployees(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="p-1.5 rounded-md hover:bg-gray-100 disabled:opacity-30 transition-colors"
                    >
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <div className="flex items-center">
                      {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => fetchEmployees(page)}
                          className={`min-w-[32px] h-8 flex items-center justify-center rounded-md text-sm font-medium transition-colors ${currentPage === page
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => fetchEmployees(Math.min(pagination.totalPages, currentPage + 1))}
                      disabled={currentPage === pagination.totalPages}
                      className="p-1.5 rounded-md hover:bg-gray-100 disabled:opacity-30 transition-colors"
                    >
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        }

        {/* Empty State */}
        {
          !loading && employees.length === 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <p className="text-gray-600">No employees found</p>
                </div>
              </CardContent>
            </Card>
          )
        }
      </div >

      {/* Modals */}
      < AddEmployeeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)
        }
        onSuccess={handleAddSuccess}
      />

      <EditEmployeeModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedEmployee(null);
        }}
        employee={selectedEmployee}
        onSuccess={handleEditSuccess}
      />
    </DashboardLayout >
  );
}

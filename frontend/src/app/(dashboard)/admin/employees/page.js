'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Plus, Info } from 'lucide-react';
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

  useEffect(() => {
    fetchEmployees();
  }, [searchTerm, roleFilter, statusFilter]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setError(null);
      const filters = {};

      if (searchTerm) filters.search = searchTerm;
      if (roleFilter) filters.role = roleFilter;
      if (statusFilter !== '') {
        filters.isActive = statusFilter === 'active';
      }

      const res = await apiService.user.getAll(filters);
      setEmployees(res.data || []);
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
    fetchEmployees();
  };

  const handleEditSuccess = () => {
    fetchEmployees();
  };

  const activeCount = employees.filter((emp) => emp.isActive).length;
  const inactiveCount = employees.filter((emp) => !emp.isActive).length;

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6 md:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Employees</h1>
            <p className="text-sm md:text-base text-gray-600 mt-1">Manage all employees in the system</p>
          </div>
          <Button
            variant="primary"
            size="md"
            className="flex items-center justify-center gap-2 w-full sm:w-auto"
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus size={18} />
            Add Employee
          </Button>
        </div>

        {/* Search & Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <Input
              placeholder="Name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role
            </label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="MANAGER">Manager</option>
              <option value="EMPLOYEE">Employee</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
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
              className="w-full px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-sm md:text-base text-red-700">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {loading && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <p className="text-gray-600">Loading employees...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Employees Table */}
        {!loading && employees.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Employee Directory ({employees.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto -mx-4 md:mx-0">
                <table className="w-full text-xs md:text-sm">
                  <thead className="border-b border-gray-200 bg-gray-50">
                    <tr className="text-gray-600">
                      <th className="text-left py-3 px-4">Name</th>
                      <th className="text-left py-3 px-4">Email</th>
                      <th className="text-left py-3 px-4 hidden sm:table-cell">Employee ID</th>
                      <th className="text-left py-3 px-4 hidden md:table-cell">Role</th>
                      <th className="text-left py-3 px-4">Status</th>
                      <th className="text-center py-3 px-4">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((emp) => (
                      <tr
                        key={emp._id}
                        className="border-b border-gray-100 hover:bg-gray-50 text-xs md:text-sm"
                      >
                        <td className="py-4 px-4 font-medium text-gray-900 max-w-xs truncate">
                          {emp.name}
                        </td>
                        <td className="py-4 px-4 text-gray-600 max-w-xs truncate text-xs md:text-sm">
                          {emp.email}
                        </td>
                        <td className="py-4 px-4 text-gray-600 hidden sm:table-cell">
                          {emp.employeeId || 'N/A'}
                        </td>
                        <td className="py-4 px-4 text-gray-600 capitalize hidden md:table-cell">
                          {emp.role}
                        </td>
                        <td className="py-4 px-4">
                          <Badge
                            variant={emp.isActive ? 'success' : 'default'}
                          >
                            {emp.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center justify-center">
                            <button
                              onClick={() => handleEditClick(emp)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Edit employee"
                            >
                              <Info size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!loading && employees.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <p className="text-gray-600">No employees found</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary */}
        {!loading && employees.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-gray-600 text-xs md:text-sm">Total Employees</p>
                <p className="text-2xl md:text-3xl font-bold text-gray-900 mt-2">
                  {employees.length}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-gray-600 text-xs md:text-sm">Active</p>
                <p className="text-2xl md:text-3xl font-bold text-green-600 mt-2">
                  {activeCount}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-gray-600 text-xs md:text-sm">Inactive</p>
                <p className="text-2xl md:text-3xl font-bold text-gray-600 mt-2">
                  {inactiveCount}
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Modals */}
      <AddEmployeeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
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
    </DashboardLayout>
  );
}

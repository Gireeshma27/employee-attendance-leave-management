'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import apiService from '@/lib/api';

export default function EmployeesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiService.user.getAll();
      setEmployees(res.data || []);
    } catch (err) {
      console.error('Error fetching employees:', err);
      setError(err.message || 'Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId) => {
    if (!confirm('Are you sure you want to delete this employee?')) return;
    try {
      await apiService.user.delete(userId);
      setEmployees(employees.filter((emp) => emp._id !== userId));
    } catch (err) {
      console.error('Error deleting employee:', err);
      alert('Failed to delete employee: ' + (err.message || 'Unknown error'));
    }
  };

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeCount = employees.filter((emp) => emp.status !== 'inactive').length;
  const inactiveCount = employees.filter((emp) => emp.status === 'inactive').length;

  return (
    <DashboardLayout role="admin">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Employees</h1>
            <p className="text-gray-600 mt-1">Manage all employees in the system</p>
          </div>
          <Button variant="primary" size="lg" className="flex items-center gap-2">
            <Plus size={20} />
            Add Employee
          </Button>
        </div>

        {/* Search & Filter */}
        <div className="flex gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Error State */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-700">{error}</p>
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
        {!loading && (
          <Card>
            <CardHeader>
              <CardTitle>Employee Directory ({filteredEmployees.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-200 bg-gray-50">
                    <tr className="text-gray-600">
                      <th className="text-left py-3 px-4">Name</th>
                      <th className="text-left py-3 px-4">Email</th>
                      <th className="text-left py-3 px-4">Role</th>
                      <th className="text-left py-3 px-4">Status</th>
                      <th className="text-center py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEmployees.map((emp) => (
                      <tr key={emp._id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4 font-medium text-gray-900">{emp.name}</td>
                        <td className="py-4 px-4 text-gray-600">{emp.email}</td>
                        <td className="py-4 px-4 text-gray-600 capitalize">{emp.role}</td>
                        <td className="py-4 px-4">
                          <Badge
                            variant={emp.status !== 'inactive' ? 'success' : 'default'}
                          >
                            {emp.status || 'Active'}
                          </Badge>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center justify-center gap-2">
                            <button className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                              <Edit2 size={18} />
                            </button>
                            <button
                              className="p-2 text-red-600 hover:bg-red-50 rounded"
                              onClick={() => handleDelete(emp._id)}
                            >
                              <Trash2 size={18} />
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

        {/* Summary */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-gray-600 text-sm">Total Employees</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{employees.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-gray-600 text-sm">Active</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{activeCount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-gray-600 text-sm">Inactive</p>
                <p className="text-3xl font-bold text-gray-600 mt-2">{inactiveCount}</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { useState } from 'react';

export default function EmployeesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [employees, setEmployees] = useState([
    { id: 1, name: 'Alice Johnson', email: 'alice@company.com', department: 'Engineering', designation: 'Senior Developer', status: 'Active' },
    { id: 2, name: 'Bob Smith', email: 'bob@company.com', department: 'Sales', designation: 'Sales Executive', status: 'Active' },
    { id: 3, name: 'Carol Davis', email: 'carol@company.com', department: 'HR', designation: 'HR Manager', status: 'Active' },
    { id: 4, name: 'David Wilson', email: 'david@company.com', department: 'Finance', designation: 'Accountant', status: 'Inactive' },
    { id: 5, name: 'Emma Brown', email: 'emma@company.com', department: 'Marketing', designation: 'Marketing Manager', status: 'Active' },
  ]);

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <select className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>All Departments</option>
            <option>Engineering</option>
            <option>Sales</option>
            <option>HR</option>
            <option>Finance</option>
            <option>Marketing</option>
          </select>
        </div>

        {/* Employees Table */}
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
                    <th className="text-left py-3 px-4">Department</th>
                    <th className="text-left py-3 px-4">Designation</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-center py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map((emp) => (
                    <tr key={emp.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4 font-medium text-gray-900">{emp.name}</td>
                      <td className="py-4 px-4 text-gray-600">{emp.email}</td>
                      <td className="py-4 px-4 text-gray-600">{emp.department}</td>
                      <td className="py-4 px-4 text-gray-600">{emp.designation}</td>
                      <td className="py-4 px-4">
                        <Badge variant={emp.status === 'Active' ? 'success' : 'default'}>
                          {emp.status}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <button className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                            <Edit2 size={18} />
                          </button>
                          <button className="p-2 text-red-600 hover:bg-red-50 rounded">
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

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-gray-600 text-sm">Total Employees</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">156</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-gray-600 text-sm">Active</p>
              <p className="text-3xl font-bold text-green-600 mt-2">152</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-gray-600 text-sm">Inactive</p>
              <p className="text-3xl font-bold text-gray-600 mt-2">4</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

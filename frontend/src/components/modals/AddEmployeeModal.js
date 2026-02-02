'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AlertCircle } from 'lucide-react';
import apiService from '@/lib/api';

export function AddEmployeeModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    employeeId: '',
    role: 'EMPLOYEE',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.employeeId.trim()) {
      newErrors.employeeId = 'Employee ID is required';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError(null);

    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      await apiService.user.create({
        name: formData.name,
        email: formData.email,
        employeeId: formData.employeeId,
        role: formData.role,
        password: formData.password,
      });

      setFormData({
        name: '',
        email: '',
        employeeId: '',
        role: 'EMPLOYEE',
        password: '',
        confirmPassword: '',
      });
      setErrors({});

      onSuccess?.();
      onClose();
    } catch (error) {
      let errorMessage = error?.message || 'Failed to create employee';
      
      // Handle specific error scenarios
      if (error?.message?.includes('already exists')) {
        if (error?.message?.includes('email')) {
          setErrors({ email: 'This email is already registered' });
        } else if (error?.message?.includes('Employee ID')) {
          setErrors({ employeeId: 'This Employee ID is already in use' });
        } else {
          setApiError(errorMessage);
        }
      } else {
        setApiError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      email: '',
      employeeId: '',
      role: 'EMPLOYEE',
      password: '',
      confirmPassword: '',
    });
    setErrors({});
    setApiError(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Employee" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* API Error */}
        {apiError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
            <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
            <p className="text-sm text-red-700">{apiError}</p>
          </div>
        )}

        {/* Form Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Name */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-800">
              Name <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="John Doe"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Email ID */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-800">
              Email ID <span className="text-red-500">*</span>
            </label>
            <Input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="john@company.com"
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          {/* Employee ID */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-800">
              Employee ID <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              name="employeeId"
              value={formData.employeeId}
              onChange={handleChange}
              placeholder="EMP001"
              className={errors.employeeId ? 'border-red-500' : ''}
            />
            {errors.employeeId && (
              <p className="text-sm text-red-600">{errors.employeeId}</p>
            )}
          </div>

          {/* Role */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-800">
              Role <span className="text-red-500">*</span>
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
            >
              <option value="EMPLOYEE">Employee</option>
              <option value="MANAGER">Manager</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-800">
              Password <span className="text-red-500">*</span>
            </label>
            <Input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Min 6 characters"
              className={errors.password ? 'border-red-500' : ''}
            />
            {errors.password && (
              <p className="text-sm text-red-600">{errors.password}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-800">
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <Input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm password"
              className={errors.confirmPassword ? 'border-red-500' : ''}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-red-600">{errors.confirmPassword}</p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            Cancel
          </button>
          <Button
            type="submit"
            variant="primary"
            className="flex-1 py-3"
            disabled={isLoading}
          >
            {isLoading ? 'Adding...' : 'Add Employee'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

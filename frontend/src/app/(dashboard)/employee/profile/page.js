'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Mail, Phone, MapPin, Calendar, Edit2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import apiService from '@/lib/api';

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    designation: '',
    joiningDate: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiService.user.getProfile();
      const userData = res.data || {};
      setFormData({
        name: userData.name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        department: userData.department || '',
        designation: userData.designation || '',
        joiningDate: userData.joiningDate ? new Date(userData.joiningDate).toISOString().split('T')[0] : '',
      });
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      setSuccess(false);
      await apiService.user.updateProfile(formData);
      setSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout role="employee">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
            <p className="text-gray-600 mt-1">Manage your personal information</p>
          </div>
          {!loading && (
            <Button
              variant="primary"
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center gap-2"
              disabled={submitting}
            >
              <Edit2 size={20} />
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </Button>
          )}
        </div>

        {/* Success Message */}
        {success && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <p className="text-green-700">✅ Profile updated successfully!</p>
            </CardContent>
          </Card>
        )}

        {/* Error Message */}
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
            <CardContent className="pt-8">
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading profile...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Profile Card */}
        {!loading && (
          <Card>
            <CardContent className="pt-8">
              <div className="flex items-start gap-6 mb-8">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-4xl font-bold">
                  {formData.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{formData.name}</h2>
                  <p className="text-gray-600">{formData.designation}</p>
                  <p className="text-sm text-gray-500 mt-1">{formData.department}</p>
                </div>
              </div>

              {!isEditing ? (
                // View Mode
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <Mail className="text-blue-600 mt-1 flex-shrink-0" size={20} />
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="font-medium text-gray-900">{formData.email}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <Phone className="text-blue-600 mt-1 flex-shrink-0" size={20} />
                      <div>
                        <p className="text-sm text-gray-600">Phone</p>
                        <p className="font-medium text-gray-900">{formData.phone || 'Not provided'}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <MapPin className="text-blue-600 mt-1 flex-shrink-0" size={20} />
                      <div>
                        <p className="text-sm text-gray-600">Department</p>
                        <p className="font-medium text-gray-900">{formData.department || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {formData.joiningDate && (
                      <div className="flex items-start gap-4">
                        <Calendar className="text-blue-600 mt-1 flex-shrink-0" size={20} />
                        <div>
                          <p className="text-sm text-gray-600">Joining Date</p>
                          <p className="font-medium text-gray-900">
                            {new Date(formData.joiningDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    )}

                    <div>
                      <p className="text-sm text-gray-600">Designation</p>
                      <p className="font-medium text-gray-900">{formData.designation || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
              ) : (
                // Edit Mode
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    label="Full Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />

                  <Input
                    label="Email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    disabled
                  />

                  <Input
                    label="Phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Department"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      disabled
                    />
                    <Input
                      label="Designation"
                      value={formData.designation}
                      onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                      disabled
                    />
                  </div>

                  <div className="flex gap-4 justify-end pt-4">
                    <Button variant="secondary" type="button" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                    <Button variant="primary" type="submit" disabled={submitting}>
                      {submitting ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        )}

        {/* Additional Info */}
        {!loading && (
          <Card>
            <CardHeader>
              <CardTitle>Security</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-600 text-sm">Manage your account security settings</p>
                <Button variant="outline">Change Password</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

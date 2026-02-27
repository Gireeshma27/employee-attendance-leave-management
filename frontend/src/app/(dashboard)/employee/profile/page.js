"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  Edit2,
  Briefcase,
  User,
  Lock,
} from "lucide-react";
import { useState, useEffect } from "react";
import apiService from "@/lib/api";

export default function ProfilePage() {
  const [showEditModal, setShowEditModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordFormData, setPasswordFormData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    department: "",
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
      setProfileData(userData);
      setFormData({
        name: userData.name || "",
        phone: userData.phone || "",
        department: userData.department || "",
      });
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError(err.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      await apiService.user.updateProfile(formData);
      setSuccess(true);
      setShowEditModal(false);
      await fetchProfile(); // Refresh profile data
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Error updating profile:", err);
      setError(err.message || "Failed to update profile");
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = () => {
    setFormData({
      name: profileData?.name || "",
      phone: profileData?.phone || "",
      department: profileData?.department || "",
    });
    setError(null);
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setError(null);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    if (passwordFormData.oldPassword === passwordFormData.newPassword) {
      setError("New password must be different from the current password");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await apiService.user.changePassword({
        oldPassword: passwordFormData.oldPassword,
        newPassword: passwordFormData.newPassword,
      });
      setSuccess(true);
      setShowPasswordModal(false);
      setPasswordFormData({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Error changing password:", err);
      setError(err.message || "Failed to change password");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout role="employee">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">
              Profile
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage your personal information
            </p>
          </div>
          {!loading && (
            <Button
              variant="primary"
              onClick={openEditModal}
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              <Edit2 size={18} />
              Edit Profile
            </Button>
          )}
        </div>

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-3">
            <p className="text-green-700 text-sm">
              Profile updated successfully!
            </p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <Card>
            <CardContent className="pt-8">
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto mb-4"></div>
                <p className="text-slate-500 font-medium">Loading profile...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Profile Card */}
        {!loading && profileData && (
          <Card className="border-slate-200">
            <CardContent className="pt-8">
              {/* Profile Header */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8 pb-8 border-b border-slate-100">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-semibold shadow-lg">
                  {profileData.name?.charAt(0).toUpperCase() || "U"}
                </div>
                <div className="text-center sm:text-left">
                  <h2 className="text-2xl font-semibold text-slate-900">
                    {profileData.name}
                  </h2>
                  <p className="text-slate-500 mt-1">
                    {profileData.role || "Employee"}
                  </p>
                  <p className="text-sm text-slate-400 mt-1">
                    {profileData.employeeId || "-"}
                  </p>
                </div>
              </div>

              {/* Profile Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-5">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Mail className="text-blue-600" size={20} />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">
                        Email
                      </p>
                      <p className="text-slate-900 mt-1">{profileData.email}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Phone className="text-blue-600" size={20} />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">
                        Phone
                      </p>
                      <p className="text-slate-900 mt-1">
                        {profileData.phone || "Not provided"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MapPin className="text-blue-600" size={20} />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">
                        Department
                      </p>
                      <p className="text-slate-900 mt-1">
                        {profileData.department || "Not assigned"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Lock className="text-slate-600" size={20} />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">
                        Security
                      </p>
                      <button
                        onClick={() => {
                          setError(null);
                          setShowPasswordModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-1 flex items-center gap-1"
                      >
                        Change Password
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Briefcase className="text-blue-600" size={20} />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">
                        Role
                      </p>
                      <p className="text-slate-900 mt-1">
                        {profileData.role || "Employee"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <User className="text-blue-600" size={20} />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">
                        Employee ID
                      </p>
                      <p className="text-slate-900 mt-1">
                        {profileData.employeeId || "-"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Calendar className="text-blue-600" size={20} />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">
                        Status
                      </p>
                      <p className="text-slate-900 mt-1">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${profileData.isActive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${profileData.isActive ? "bg-green-500" : "bg-red-500"}`}
                          ></span>
                          {profileData.isActive ? "Active" : "Inactive"}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Edit Profile Modal */}
        <Modal
          isOpen={showEditModal}
          onClose={closeEditModal}
          title="Edit Profile"
        >
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Full Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />

            <Input
              label="Phone Number"
              type="tel"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              placeholder="Enter your phone number"
            />

            <Input
              label="Department"
              value={formData.department}
              onChange={(e) =>
                setFormData({ ...formData, department: e.target.value })
              }
              placeholder="Enter your department"
            />

            <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={closeEditModal}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={submitting}>
                {submitting ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Change Password Modal */}
        <Modal
          isOpen={showPasswordModal}
          onClose={() => setShowPasswordModal(false)}
          title="Change Password"
        >
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
          <form onSubmit={handlePasswordSubmit} className="space-y-5">
            <Input
              label="Current Password"
              type="password"
              value={passwordFormData.oldPassword}
              onChange={(e) =>
                setPasswordFormData({
                  ...passwordFormData,
                  oldPassword: e.target.value,
                })
              }
              required
            />

            <Input
              label="New Password"
              type="password"
              value={passwordFormData.newPassword}
              onChange={(e) =>
                setPasswordFormData({
                  ...passwordFormData,
                  newPassword: e.target.value,
                })
              }
              required
              minLength={6}
            />

            <Input
              label="Confirm New Password"
              type="password"
              value={passwordFormData.confirmPassword}
              onChange={(e) =>
                setPasswordFormData({
                  ...passwordFormData,
                  confirmPassword: e.target.value,
                })
              }
              required
            />

            <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowPasswordModal(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={submitting}>
                {submitting ? "Changing..." : "Change Password"}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
}

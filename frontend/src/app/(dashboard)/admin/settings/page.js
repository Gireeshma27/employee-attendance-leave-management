'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import apiService from '@/lib/api';
import { Settings, Users, Calendar, Home, AlertCircle, CheckCircle2, Save } from 'lucide-react';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState(null);
  const [formData, setFormData] = useState({
    defaultWFHAllowed: false,
    defaultTotalWFHDays: 5,
    defaultCLQuota: 12,
    defaultSLQuota: 8,
    defaultPLQuota: 18,
    defaultRole: 'EMPLOYEE',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  const toast = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiService.settings.get();
      if (res.success && res.data) {
        setSettings(res.data);
        setFormData({
          defaultWFHAllowed: res.data.defaultWFHAllowed ?? false,
          defaultTotalWFHDays: res.data.defaultTotalWFHDays ?? 5,
          defaultCLQuota: res.data.defaultCLQuota ?? 12,
          defaultSLQuota: res.data.defaultSLQuota ?? 8,
          defaultPLQuota: res.data.defaultPLQuota ?? 18,
          defaultRole: res.data.defaultRole ?? 'EMPLOYEE',
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value,
    }));
    setSaved(false);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      const res = await apiService.settings.update(formData);
      if (res.success) {
        setSettings(res.data);
        setSaved(true);
        toast.success('Settings Saved', 'System defaults have been updated successfully.');
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      setError(err.message || 'Failed to save settings');
      toast.error('Save Failed', err.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="admin">
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6 max-w-3xl">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 flex items-center gap-2">
            <Settings size={24} className="text-slate-600" />
            System Settings
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure system-wide defaults applied when creating new employees.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            <AlertCircle size={16} className="flex-shrink-0" />
            {error}
          </div>
        )}

        {saved && (
          <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
            <CheckCircle2 size={16} className="flex-shrink-0" />
            Settings saved successfully.
          </div>
        )}

        {/* WFH Defaults */}
        <Card>
          <CardHeader className="border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="flex items-center gap-2 text-base">
              <Home size={17} className="text-blue-600" />
              Work From Home (WFH) Defaults
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5 space-y-5">
            {/* Default WFH Allowed */}
            <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl">
              <div>
                <p className="text-sm font-medium text-slate-800">Enable WFH by default</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  New employees will have WFH permission enabled automatically.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="defaultWFHAllowed"
                  checked={formData.defaultWFHAllowed}
                  onChange={handleChange}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
              </label>
            </div>

            {/* Default WFH Days */}
            <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl">
              <div>
                <p className="text-sm font-medium text-slate-800">Default WFH Days Quota</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Total WFH days allowed per employee per period.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  name="defaultTotalWFHDays"
                  value={formData.defaultTotalWFHDays}
                  onChange={handleChange}
                  min="0"
                  max="30"
                  className="w-20 px-3 py-2 text-sm text-center font-semibold border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                />
                <span className="text-sm text-slate-500">days</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Leave Quota Defaults */}
        <Card>
          <CardHeader className="border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar size={17} className="text-green-600" />
              Leave Quota Defaults (per year)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5 space-y-4">
            {[
              { key: 'defaultCLQuota', label: 'Casual Leave (CL)', description: 'Default annual casual leave days.', color: 'blue' },
              { key: 'defaultSLQuota', label: 'Sick Leave (SL)', description: 'Default annual sick leave days.', color: 'orange' },
              { key: 'defaultPLQuota', label: 'Paid Leave (PL)', description: 'Default annual paid leave days.', color: 'green' },
            ].map(({ key, label, description, color }) => (
              <div key={key} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-slate-800">{label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{description}</p>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    name={key}
                    value={formData[key]}
                    onChange={handleChange}
                    min="0"
                    max="60"
                    className="w-20 px-3 py-2 text-sm text-center font-semibold border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                  />
                  <span className="text-sm text-slate-500">days</span>
                </div>
              </div>
            ))}

            <p className="text-xs text-slate-400 pt-1">
              * Leave quotas are computed dynamically from approved leaves. These values define the annual maximum per employee.
            </p>
          </CardContent>
        </Card>

        {/* Employee Defaults */}
        <Card>
          <CardHeader className="border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users size={17} className="text-purple-600" />
              New Employee Defaults
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5 space-y-4">
            <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl">
              <div>
                <p className="text-sm font-medium text-slate-800">Default Role</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Role pre-selected when creating a new employee.
                </p>
              </div>
              <select
                name="defaultRole"
                value={formData.defaultRole}
                onChange={handleChange}
                className="px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white"
              >
                <option value="EMPLOYEE">Employee</option>
                <option value="MANAGER">Manager</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end pb-8">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl shadow-sm transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Save size={16} />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}

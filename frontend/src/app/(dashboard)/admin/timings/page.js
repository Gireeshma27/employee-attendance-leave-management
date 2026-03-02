"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Plus, Pencil, Trash2, Clock, MapPin, Users, Building } from "lucide-react";
import { useState, useEffect } from "react";
import apiService from "@/lib/api";
import { AddTimingModal } from "@/components/modals/AddTimingModal";

export default function TimingsPage() {
  const [timings, setTimings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTiming, setEditingTiming] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, timing: null });
  const [locationFilter, setLocationFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const LOCATIONS = ["Mysore", "Bangalore", "Mangalore"];

  useEffect(() => {
    fetchTimings();
  }, [locationFilter]);

  const fetchTimings = async () => {
    try {
      setLoading(true);
      setError(null);
      const filters = {};
      if (locationFilter) filters.location = locationFilter;

      const response = await apiService.timing.getAll(filters);
      if (response.success) {
        setTimings(response.data || []);
      } else {
        throw new Error(response.message || "Failed to fetch timings");
      }
    } catch (err) {
      console.error("Error fetching timings:", err);
      setError(err.message || "Failed to load timings");
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (timing) => {
    setEditingTiming(timing);
    setIsAddModalOpen(true);
  };

  const handleDeleteClick = (timing) => {
    setDeleteConfirm({ isOpen: true, timing });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.timing) return;

    try {
      await apiService.timing.delete(deleteConfirm.timing._id);
      fetchTimings();
      setDeleteConfirm({ isOpen: false, timing: null });
    } catch (err) {
      console.error("Error deleting timing:", err);
      alert("Failed to delete timing: " + err.message);
    }
  };

  const handleAddSuccess = () => {
    fetchTimings();
  };

  const handleModalClose = () => {
    setIsAddModalOpen(false);
    setEditingTiming(null);
  };

  // Filter timings based on search term
  const filteredTimings = timings.filter((timing) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      timing.teamName?.toLowerCase().includes(search) ||
      timing.branch?.toLowerCase().includes(search) ||
      timing.location?.toLowerCase().includes(search) ||
      timing.departments?.some((d) => d.toLowerCase().includes(search))
    );
  });

  // Group timings by location for display
  const timingsByLocation = filteredTimings.reduce((acc, timing) => {
    const loc = timing.location || "Unknown";
    if (!acc[loc]) acc[loc] = [];
    acc[loc].push(timing);
    return acc;
  }, {});

  const totalTimings = timings.length;
  const activeTimings = timings.filter((t) => t.isActive).length;
  const totalDepartmentsCovered = new Set(timings.flatMap((t) => t.departments)).size;

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6 md:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-lg sm:text-2xl md:text-3xl font-semibold text-slate-900">Timings</h1>
            <p className="text-xs sm:text-sm md:text-base text-slate-600 mt-1">
              Manage login/logout schedules for different locations and teams
            </p>
          </div>
          <Button
            variant="primary"
            size="md"
            className="flex items-center gap-2"
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus size={18} />
            Add Timing
          </Button>
        </div>

        {/* Search & Filters */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5 sm:mb-2">
                Search
              </label>
              <input
                type="text"
                placeholder="Team, branch, or department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5 sm:mb-2">
                Location
              </label>
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 bg-white"
              >
                <option value="">All Locations</option>
                {LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end lg:col-span-2 gap-2">
              <button
                onClick={() => {
                  setSearchTerm("");
                  setLocationFilter("");
                }}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 focus:ring-4 focus:ring-slate-100 transition-all h-[42px]"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <Card className="border-red-200/60 bg-red-50">
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
                <div className="w-10 h-10 border-4 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-600">Loading timings...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary Cards */}
        {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <Card className="hover:shadow-md transition-shadow border-slate-100">
              <CardContent className="pt-6 text-center">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Clock size={20} className="text-blue-600" />
                </div>
                <p className="text-xs font-medium text-slate-500 tracking-wider">Total Timings</p>
                <p className="text-3xl font-semibold text-slate-900 mt-2 tracking-tight">{totalTimings}</p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow border-slate-100">
              <CardContent className="pt-6 text-center">
                <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Building size={20} className="text-green-600" />
                </div>
                <p className="text-xs font-medium text-slate-500 tracking-wider">Active Schedules</p>
                <p className="text-3xl font-semibold text-green-600 mt-2 tracking-tight">{activeTimings}</p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow border-slate-100">
              <CardContent className="pt-6 text-center">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Users size={20} className="text-blue-600" />
                </div>
                <p className="text-xs font-medium text-slate-500 tracking-wider">Departments Covered</p>
                <p className="text-3xl font-semibold text-blue-600 mt-2 tracking-tight">{totalDepartmentsCovered}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Timings Table */}
        {!loading && filteredTimings.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <CardTitle>Timing Schedules</CardTitle>
                <span className="text-sm text-slate-500">
                  {filteredTimings.length} {filteredTimings.length === 1 ? "schedule" : "schedules"}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50/80 border-b border-slate-200">
                      <tr className="text-slate-500 font-semibold uppercase tracking-wider text-xs">
                        <th className="py-4 px-6 whitespace-nowrap">Location</th>
                        <th className="py-4 px-6 whitespace-nowrap">Branch</th>
                        <th className="py-4 px-6 whitespace-nowrap">Team Name</th>
                        <th className="py-4 px-6 whitespace-nowrap">Login Time</th>
                        <th className="py-4 px-6 whitespace-nowrap">Logout Time</th>
                        <th className="py-4 px-6 whitespace-nowrap">Departments</th>
                        <th className="py-4 px-6 whitespace-nowrap">Status</th>
                        <th className="py-4 px-6 text-center whitespace-nowrap sticky right-0 bg-slate-50/80 z-10">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredTimings.map((timing) => (
                        <tr
                          key={timing._id}
                          className="hover:bg-slate-50/80 transition-colors border-b border-slate-50 last:border-0"
                        >
                          <td className="py-4 px-6 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <MapPin size={14} className="text-slate-400" />
                              <span className="font-medium text-slate-900">{timing.location}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-slate-600 whitespace-nowrap">{timing.branch}</td>
                          <td className="py-4 px-6 whitespace-nowrap">
                            <span className="font-medium text-slate-900">{timing.teamName}</span>
                          </td>
                          <td className="py-4 px-6 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <Clock size={14} className="text-green-500" />
                              <span className="font-mono text-sm font-medium text-slate-700">{timing.loginTime}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <Clock size={14} className="text-red-500" />
                              <span className="font-mono text-sm font-medium text-slate-700">{timing.logoutTime}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                              {timing.departments?.slice(0, 3).map((dept) => (
                                <Badge key={dept} variant="outline" className="text-xs">
                                  {dept}
                                </Badge>
                              ))}
                              {timing.departments?.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{timing.departments.length - 3}
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-6 whitespace-nowrap">
                            <Badge variant={timing.isActive !== false ? "success" : "secondary"}>
                              {timing.isActive !== false ? "Active" : "Inactive"}
                            </Badge>
                          </td>
                          <td className="py-4 px-6 text-center whitespace-nowrap sticky right-0 bg-white z-10">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleEditClick(timing)}
                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                                title="Edit timing"
                              >
                                <Pencil size={18} />
                              </button>
                              <button
                                onClick={() => handleDeleteClick(timing)}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                                title="Delete timing"
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
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!loading && filteredTimings.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock size={32} className="text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No Timings Found</h3>
                <p className="text-slate-500 mb-6">
                  {searchTerm || locationFilter
                    ? "No timings match your search criteria."
                    : "Get started by adding your first timing schedule."}
                </p>
                {!searchTerm && !locationFilter && (
                  <Button variant="primary" onClick={() => setIsAddModalOpen(true)}>
                    <Plus size={18} className="mr-2" />
                    Add First Timing
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add/Edit Timing Modal */}
      <AddTimingModal
        isOpen={isAddModalOpen}
        onClose={handleModalClose}
        onSuccess={handleAddSuccess}
        editingTiming={editingTiming}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, timing: null })}
        onConfirm={handleDeleteConfirm}
        title="Delete Timing"
        message={`Are you sure you want to delete the timing "${deleteConfirm.timing?.teamName}" at ${deleteConfirm.timing?.location}? This action cannot be undone.`}
        confirmText="Delete"
        confirmVariant="danger"
      />
    </DashboardLayout>
  );
}

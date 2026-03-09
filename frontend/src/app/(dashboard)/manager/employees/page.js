"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Users, Search, MapPin, Clock, Briefcase } from "lucide-react";
import { useState, useEffect } from "react";
import apiService from "@/lib/api";
import { formatHHmm } from "@/utils/formatDate";

const formatTime = (time) => formatHHmm(time);

export default function ManagerEmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [pagination, setPagination] = useState({
    totalRecords: 0,
    totalPages: 1,
    currentPage: 1,
    limit: 10,
  });

  useEffect(() => {
    setCurrentPage(1);
    fetchTeamEmployees(1);
  }, [searchTerm, statusFilter]);

  const fetchTeamEmployees = async (pageNum = currentPage) => {
    try {
      setLoading(true);
      setError(null);

      const filters = {
        page: pageNum,
        limit: rowsPerPage,
      };

      if (searchTerm) filters.search = searchTerm;
      if (statusFilter !== "") filters.isActive = statusFilter === "active";

      // Backend auto-scopes to manager's team when role === MANAGER
      const res = await apiService.user.getAll(filters);
      setEmployees(res.data?.records || res.data || []);
      if (res.data?.pagination) {
        setPagination(res.data.pagination);
      } else {
        const records = res.data?.records || res.data || [];
        setPagination({
          totalRecords: records.length,
          totalPages: 1,
          currentPage: 1,
          limit: rowsPerPage,
        });
      }
    } catch (err) {
      console.error("Error fetching team employees:", err);
      setError(err.message || "Failed to load team members");
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchTeamEmployees(page);
  };

  const activeCount = employees.filter((e) => e.isActive).length;

  return (
    <DashboardLayout role="manager">
      <div className="space-y-6 md:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-lg sm:text-2xl md:text-3xl font-semibold text-slate-900">
              My Team
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-slate-500 mt-1">
              Employees assigned under your management
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-100 rounded-xl">
            <Users size={16} className="text-blue-600" />
            <span className="text-sm font-semibold text-blue-700">
              {pagination.totalRecords} member{pagination.totalRecords !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200/60">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-600 mb-1.5">
                Search
              </label>
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <Input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-600 mb-1.5">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="flex items-end">
              <div className="flex gap-3 text-sm text-slate-500">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
                  {activeCount} Active
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-slate-400 inline-block"></span>
                  {employees.length - activeCount} Inactive
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Employees Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-800">
              Team Members
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <span className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></span>
                <span className="ml-3 text-sm text-slate-500">
                  Loading team members...
                </span>
              </div>
            ) : error ? (
              <div className="py-12 text-center">
                <p className="text-sm text-red-500 font-medium">{error}</p>
                <button
                  onClick={() => fetchTeamEmployees(currentPage)}
                  className="mt-3 text-xs text-blue-600 hover:underline"
                >
                  Try again
                </button>
              </div>
            ) : employees.length === 0 ? (
              <div className="py-16 text-center">
                <Users size={40} className="mx-auto text-slate-200 mb-3" />
                <p className="text-sm font-medium text-slate-500">
                  No team members found
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {searchTerm
                    ? "Try a different search term"
                    : "No employees are currently assigned to you"}
                </p>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/60">
                        <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          Employee ID
                        </th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          Name
                        </th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          Email
                        </th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          Department
                        </th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          Timing
                        </th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          Location
                        </th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {employees.map((emp) => {
                        const timing =
                          emp.timingId || emp.timingInfo;
                        return (
                          <tr
                            key={emp._id}
                            className="hover:bg-slate-50/60 transition-colors"
                          >
                            <td className="px-5 py-3.5">
                              <span className="font-mono text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                                {emp.employeeId || "—"}
                              </span>
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                                  {emp.name?.charAt(0)?.toUpperCase() || "?"}
                                </div>
                                <span className="font-medium text-slate-800">
                                  {emp.name}
                                </span>
                              </div>
                            </td>
                            <td className="px-5 py-3.5 text-slate-600">
                              {emp.email}
                            </td>
                            <td className="px-5 py-3.5">
                              {emp.department ? (
                                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700">
                                  <Briefcase size={12} className="text-slate-400" />
                                  {emp.department}
                                </span>
                              ) : (
                                <span className="text-slate-400 text-xs">—</span>
                              )}
                            </td>
                            <td className="px-5 py-3.5">
                              {timing ? (
                                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                                  <Clock size={12} className="text-blue-400" />
                                  <span>
                                    {formatTime(timing.loginTime)} –{" "}
                                    {formatTime(timing.logoutTime)}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-slate-400 text-xs">—</span>
                              )}
                            </td>
                            <td className="px-5 py-3.5">
                              {emp.location ? (
                                <span className="inline-flex items-center gap-1.5 text-xs text-slate-600">
                                  <MapPin size={12} className="text-slate-400" />
                                  {emp.location}
                                  {emp.branch ? ` · ${emp.branch}` : ""}
                                </span>
                              ) : (
                                <span className="text-slate-400 text-xs">—</span>
                              )}
                            </td>
                            <td className="px-5 py-3.5">
                              <Badge
                                variant={emp.isActive ? "success" : "danger"}
                                className="text-xs"
                              >
                                {emp.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden divide-y divide-slate-100">
                  {employees.map((emp) => {
                    const timing = emp.timingId || emp.timingInfo;
                    return (
                      <div key={emp._id} className="p-4 space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
                              {emp.name?.charAt(0)?.toUpperCase() || "?"}
                            </div>
                            <div>
                              <p className="font-semibold text-sm text-slate-800">
                                {emp.name}
                              </p>
                              <p className="text-xs text-slate-500">
                                {emp.email}
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant={emp.isActive ? "success" : "danger"}
                            className="text-xs flex-shrink-0"
                          >
                            {emp.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>

                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 pl-12">
                          {emp.employeeId && (
                            <span className="font-mono font-semibold text-blue-700">
                              {emp.employeeId}
                            </span>
                          )}
                          {emp.department && (
                            <span className="flex items-center gap-1">
                              <Briefcase size={11} />
                              {emp.department}
                            </span>
                          )}
                          {emp.location && (
                            <span className="flex items-center gap-1">
                              <MapPin size={11} />
                              {emp.location}
                              {emp.branch ? ` · ${emp.branch}` : ""}
                            </span>
                          )}
                          {timing && (
                            <span className="flex items-center gap-1">
                              <Clock size={11} />
                              {formatTime(timing.loginTime)} –{" "}
                              {formatTime(timing.logoutTime)}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
                    <p className="text-xs text-slate-500">
                      Showing {(currentPage - 1) * rowsPerPage + 1}–
                      {Math.min(
                        currentPage * rowsPerPage,
                        pagination.totalRecords
                      )}{" "}
                      of {pagination.totalRecords}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          currentPage > 1 && handlePageChange(currentPage - 1)
                        }
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() =>
                          currentPage < pagination.totalPages &&
                          handlePageChange(currentPage + 1)
                        }
                        disabled={currentPage === pagination.totalPages}
                        className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

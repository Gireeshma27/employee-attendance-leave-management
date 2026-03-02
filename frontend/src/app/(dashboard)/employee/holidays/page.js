"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { CalendarDays, ShieldCheck, Calendar } from "lucide-react";
import { useState, useEffect } from "react";
import apiService from "@/lib/api";

// Fixed public holidays — mirrors backend utility
const FIXED_PUBLIC_HOLIDAYS = [
  { title: "Republic Day", month: 1, day: 26 },
  { title: "Independence Day", month: 8, day: 15 },
  { title: "Gandhi Jayanti", month: 10, day: 2 },
];

const getFixedHolidaysForCurrentYear = () => {
  const year = new Date().getFullYear();
  return FIXED_PUBLIC_HOLIDAYS.map(({ title, month, day }) => {
    const date = new Date(year, month - 1, day);
    return { title, startDate: date.toISOString(), endDate: date.toISOString(), type: "PUBLIC_FIXED" };
  });
};

const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

const getTotalDays = (startDate, endDate) => {
  const diff = Math.round(
    (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24),
  ) + 1;
  return diff;
};

const getTypeBadge = (type) => {
  if (type === "PUBLIC_FIXED") return { variant: "success", label: "Public (Fixed)" };
  if (type === "FESTIVAL") return { variant: "warning", label: "Festival" };
  if (type === "COMPANY") return { variant: "info", label: "Company" };
  return { variant: "default", label: type };
};

const isTodayHoliday = (holidays) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return holidays.find((h) => {
    const start = new Date(h.startDate);
    const end = new Date(h.endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    return today >= start && today <= end;
  }) || null;
};

const getUpcomingHolidays = (holidays, count = 3) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return holidays
    .filter((h) => new Date(h.endDate) >= today)
    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
    .slice(0, count);
};

export default function EmployeeHolidaysPage() {
  const [allHolidays, setAllHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        setLoading(true);
        const response = await apiService.holiday.getAll();
        if (response.success) {
          setAllHolidays(response.data || []);
        } else {
          throw new Error(response.message || "Failed to fetch holidays");
        }
      } catch (err) {
        setError(err.message || "Failed to load holidays");
      } finally {
        setLoading(false);
      }
    };
    fetchHolidays();
  }, []);

  // Merge fixed + DB holidays for display
  const fixedHolidays = getFixedHolidaysForCurrentYear();
  const dbHolidays = allHolidays.filter((h) => h.source === "DB");
  const merged = [...fixedHolidays, ...dbHolidays].sort(
    (a, b) => new Date(a.startDate) - new Date(b.startDate),
  );

  const todayHoliday = isTodayHoliday(merged);
  const upcomingHolidays = getUpcomingHolidays(merged);

  if (loading) {
    return (
      <DashboardLayout role="employee">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-500 font-medium">Loading holidays...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="employee">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">
            Holidays
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            View all public and company holidays for {new Date().getFullYear()}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200/60 text-red-700 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Today Banner */}
        {todayHoliday && (
          <div className="bg-amber-50 border border-amber-200/60 rounded-xl px-5 py-4 flex items-center gap-3">
            <span className="text-2xl">🎉</span>
            <div>
              <p className="font-semibold text-amber-800">Today is a Holiday!</p>
              <p className="text-sm text-amber-700">Today is {todayHoliday.title}</p>
            </div>
          </div>
        )}

        {/* Upcoming Holidays Widget */}
        <Card>
          <CardHeader className="border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                <Calendar size={16} className="text-blue-600" />
              </div>
              <CardTitle className="text-base">Upcoming Holidays</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            {upcomingHolidays.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">
                No upcoming holidays
              </p>
            ) : (
              <div className="space-y-3">
                {upcomingHolidays.map((h, i) => {
                  const badge = getTypeBadge(h.type);
                  const days = getTotalDays(h.startDate, h.endDate);
                  return (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-xl"
                    >
                      <div>
                        <p className="font-medium text-slate-800 text-sm">{h.title}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {formatDate(h.startDate)}
                          {days > 1 && ` – ${formatDate(h.endDate)}`}
                          {days > 1 && ` (${days} days)`}
                        </p>
                      </div>
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Fixed Public Holidays */}
        <Card>
          <CardHeader className="border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                <ShieldCheck size={16} className="text-green-600" />
              </div>
              <CardTitle className="text-base">Fixed Public Holidays</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Holiday</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {fixedHolidays.map((h) => (
                    <tr key={h.title} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 font-medium text-slate-900">{h.title}</td>
                      <td className="py-3 px-4 text-slate-600">{formatDate(h.startDate)}</td>
                      <td className="py-3 px-4"><Badge variant="success">Public (Fixed)</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Festival & Company Holidays */}
        <Card>
          <CardHeader className="border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
                <CalendarDays size={16} className="text-amber-600" />
              </div>
              <CardTitle className="text-base">Festival & Company Holidays</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {dbHolidays.length === 0 ? (
              <div className="text-center py-10">
                <CalendarDays size={36} className="mx-auto text-slate-300 mb-2" />
                <p className="text-sm text-slate-400">No festival holidays announced yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Title</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Start Date</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">End Date</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Days</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {dbHolidays.map((h) => {
                      const badge = getTypeBadge(h.type);
                      const days = getTotalDays(h.startDate, h.endDate);
                      return (
                        <tr key={h._id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3 px-4 font-medium text-slate-900">{h.title}</td>
                          <td className="py-3 px-4 text-slate-600">{formatDate(h.startDate)}</td>
                          <td className="py-3 px-4 text-slate-600">{formatDate(h.endDate)}</td>
                          <td className="py-3 px-4 text-slate-500 text-xs">{days} day{days > 1 ? "s" : ""}</td>
                          <td className="py-3 px-4"><Badge variant={badge.variant}>{badge.label}</Badge></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

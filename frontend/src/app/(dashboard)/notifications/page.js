"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Bell,
  Users,
  Clock,
  Calendar,
  CheckCircle2,
  Trash2,
  Filter,
  Search,
} from "lucide-react";
import apiService from "@/lib/api";
import { useRouter } from "next/navigation";
import { formatDateTime } from "@/utils/formatDate";

const NotificationsPage = () => {
  const router = useRouter();
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiService.notification.getAll();
      if (response.success) {
        setNotifications(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id) => {
    try {
      await apiService.notification.markAsRead(id);
      setNotifications(
        notifications.map((n) => (n._id === id ? { ...n, isRead: true } : n)),
      );
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await apiService.notification.markAllAsRead();
      setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const handleClearAll = async () => {
    if (window.confirm("Are you sure you want to clear all notifications?")) {
      try {
        await apiService.notification.clearAll();
        setNotifications([]);
      } catch (error) {
        console.error("Failed to clear notifications:", error);
      }
    }
  };

  const filteredNotifications = notifications.filter((notification) => {
    const matchesFilter =
      filter === "all" ||
      (filter === "unread" && !notification.isRead) ||
      notification.type.toLowerCase().includes(filter);
    const matchesSearch =
      notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getIcon = (type) => {
    switch (type) {
      case "LEAVE_REQUEST":
        return Users;
      case "LEAVE_RESPONSE":
        return Calendar;
      case "ATTENDANCE_UPDATE":
        return Clock;
      default:
        return Bell;
    }
  };

  const getColor = (type) => {
    switch (type) {
      case "LEAVE_REQUEST":
        return "text-yellow-600 bg-yellow-50";
      case "LEAVE_RESPONSE":
        return "text-green-600 bg-green-50";
      case "ATTENDANCE_UPDATE":
        return "text-blue-600 bg-blue-50";
      default:
        return "text-slate-600 bg-slate-50";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-1">
            Notifications
          </h1>
          <p className="text-slate-500 font-medium tracking-wide">
            View your latest system alerts and activity history
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleMarkAllAsRead}
            disabled={notifications.filter((n) => !n.isRead).length === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all font-semibold text-sm shadow-sm group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircle2
              size={18}
              className="text-slate-400 group-hover:text-blue-500 transition-colors"
            />
            Mark all as read
          </button>
          <button
            onClick={handleClearAll}
            disabled={notifications.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-50 border border-red-100 rounded-xl text-red-600 hover:bg-red-100 transition-all font-semibold text-sm shadow-sm group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2
              size={18}
              className="text-red-400 group-hover:text-red-600 transition-colors"
            />
            Clear all
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Search notifications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all font-medium"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
          {["all", "unread", "system", "attendance", "leave"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                filter === f
                  ? "bg-[#0F172A] text-white shadow-lg shadow-slate-900/20"
                  : "bg-slate-50 text-slate-500 hover:bg-slate-100"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">
              Loading notifications...
            </p>
          </div>
        ) : filteredNotifications.length > 0 ? (
          filteredNotifications.map((notification) => {
            const Icon = getIcon(notification.type);
            const colors = getColor(notification.type);
            return (
              <div
                key={notification._id}
                onClick={() => handleMarkAsRead(notification._id)}
                className={`p-5 rounded-2xl border transition-all duration-200 group cursor-pointer ${
                  !notification.isRead
                    ? "bg-white border-blue-100 shadow-md shadow-blue-500/5 hover:border-blue-200"
                    : "bg-slate-50/50 border-slate-100/80 hover:bg-white hover:border-slate-200 hover:shadow-sm"
                }`}
              >
                <div className="flex gap-5">
                  <div
                    className={`w-12 h-12 rounded-2xl ${colors} flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-110 transition-transform`}
                  >
                    <Icon size={24} strokeWidth={2.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3
                        className={`text-lg font-semibold tracking-tight truncate ${!notification.isRead ? "text-slate-900" : "text-slate-700"}`}
                      >
                        {notification.title}
                      </h3>
                      <span className="text-xs font-semibold text-slate-400 whitespace-nowrap ml-4">
                        {formatDateTime(notification.createdAt)}
                      </span>
                    </div>
                    <p
                      className={`text-sm leading-relaxed ${!notification.isRead ? "text-slate-600 font-medium" : "text-slate-500"}`}
                    >
                      {notification.message}
                    </p>

                    {!notification.isRead && (
                      <div className="flex items-center gap-2 mt-4">
                        <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
                          New message
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-16 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Bell className="text-slate-300" size={40} />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              No notifications found
            </h3>
            <p className="text-slate-500 font-medium">
              Try adjusting your filters or search query
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;

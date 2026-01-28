'use client';

import { useState } from 'react';
import { Home, Clock, Calendar, User, Menu, X, Bell, CheckCircle, XCircle, Coffee, LogOut } from 'lucide-react';
import CheckInOut from '@/components/attendance/CheckInOut';

export default function EmployeeDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");

  // Mock data
  const employeeData = {
    name: "John Doe",
    role: "Software Developer",
    avatar: "JD",
    employeeId: "EMP-2024-001"
  };

  const stats = [
    { label: "Total Present", value: "22", subtext: "This month", icon: CheckCircle, color: "emerald" },
    { label: "Total Absent", value: "2", subtext: "This month", icon: XCircle, color: "red" },
    { label: "Leave Balance", value: "8", subtext: "Days remaining", icon: Coffee, color: "indigo" },
    { label: "Working Hours", value: "176", subtext: "This month", icon: Clock, color: "blue" }
  ];

  const recentAttendance = [
    { date: "Jan 23, 2026", checkIn: "09:15 AM", checkOut: "06:30 PM", status: "Present", hours: "9h 15m" },
    { date: "Jan 22, 2026", checkIn: "09:00 AM", checkOut: "06:00 PM", status: "Present", hours: "9h 00m" },
    { date: "Jan 21, 2026", checkIn: "09:30 AM", checkOut: "06:15 PM", status: "Late", hours: "8h 45m" },
    { date: "Jan 20, 2026", checkIn: "-", checkOut: "-", status: "Weekend", hours: "-" },
    { date: "Jan 19, 2026", checkIn: "-", checkOut: "-", status: "Weekend", hours: "-" }
  ];

  const leaveRequests = [
    { type: "Sick Leave", dates: "Jan 25-26, 2026", status: "Pending", days: "2" },
    { type: "Casual Leave", dates: "Jan 15, 2026", status: "Approved", days: "1" },
    { type: "Privilege Leave", dates: "Dec 28-30, 2025", status: "Approved", days: "3" }
  ];

  const getStatusColor = (status) => {
    switch(status.toLowerCase()) {
      case "present": return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "late": return "bg-amber-100 text-amber-700 border-amber-200";
      case "absent": return "bg-red-100 text-red-700 border-red-200";
      case "weekend": return "bg-slate-100 text-slate-600 border-slate-200";
      case "approved": return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "pending": return "bg-amber-100 text-amber-700 border-amber-200";
      case "rejected": return "bg-red-100 text-red-700 border-red-200";
      default: return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-emerald-50">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-indigo-100 transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="p-6 border-b border-indigo-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-emerald-600 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-emerald-600 bg-clip-text text-transparent">
                AttendEase
              </span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {[
              { id: "dashboard", label: "Dashboard", icon: Home },
              { id: "attendance", label: "My Attendance", icon: Clock },
              { id: "leave", label: "Leave Requests", icon: Calendar },
              { id: "profile", label: "Profile", icon: User }
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                    activeTab === item.id
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-500/30'
                      : 'text-slate-600 hover:bg-indigo-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t border-indigo-100">
            <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-xl">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold">
                {employeeData.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{employeeData.name}</p>
                <p className="text-xs text-slate-500 truncate">{employeeData.role}</p>
              </div>
              <button className="text-slate-400 hover:text-red-600 transition">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Top Bar */}
        <header className="bg-white/80 backdrop-blur-lg border-b border-indigo-100 sticky top-0 z-30">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden text-slate-600 hover:text-indigo-600 transition"
              >
                {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">Good Morning, {employeeData.name}!</h1>
                <p className="text-sm text-slate-600">Friday, January 23, 2026</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button className="relative p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition">
                <Bell className="w-6 h-6" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-6 space-y-6">
          {/* Check In/Out Card */}
          <CheckInOut />

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div 
                  key={index}
                  className="bg-white rounded-2xl p-6 border border-indigo-100 hover:shadow-lg hover:shadow-indigo-100 transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 bg-gradient-to-br from-${stat.color}-500 to-${stat.color}-600 rounded-xl flex items-center justify-center`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold text-slate-800 mb-1">{stat.value}</h3>
                  <p className="text-sm font-semibold text-slate-700">{stat.label}</p>
                  <p className="text-xs text-slate-500 mt-1">{stat.subtext}</p>
                </div>
              );
            })}
          </div>

          {/* Recent Attendance and Leave Requests */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Recent Attendance */}
            <div className="bg-white rounded-2xl p-6 border border-indigo-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-800">Recent Attendance</h2>
                <button className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition">
                  View All
                </button>
              </div>
              <div className="space-y-3">
                {recentAttendance.map((record, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition"
                  >
                    <div>
                      <p className="font-semibold text-slate-800 mb-1">{record.date}</p>
                      <p className="text-sm text-slate-600">{record.checkIn} - {record.checkOut}</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(record.status)} mb-1`}>
                        {record.status}
                      </span>
                      <p className="text-xs text-slate-600 font-medium">{record.hours}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Leave Requests */}
            <div className="bg-white rounded-2xl p-6 border border-indigo-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-800">Leave Requests</h2>
                <button className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white text-sm font-semibold rounded-lg hover:shadow-lg hover:shadow-indigo-500/50 transition-all duration-300">
                  Apply Leave
                </button>
              </div>
              <div className="space-y-3">
                {leaveRequests.map((leave, index) => (
                  <div 
                    key={index}
                    className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-slate-800">{leave.type}</p>
                        <p className="text-sm text-slate-600 mt-1">{leave.dates}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(leave.status)}`}>
                        {leave.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">{leave.days} day(s)</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gradient-to-br from-indigo-600 to-emerald-600 rounded-2xl p-8 text-white">
            <h2 className="text-2xl font-bold mb-2">Need Help?</h2>
            <p className="text-indigo-100 mb-6">Contact HR or check our FAQ for quick assistance</p>
            <div className="flex gap-4">
              <button className="px-6 py-3 bg-white text-indigo-600 font-semibold rounded-xl hover:bg-indigo-50 transition">
                Contact HR
              </button>
              <button className="px-6 py-3 bg-white/20 backdrop-blur-sm text-white font-semibold rounded-xl border border-white/30 hover:bg-white/30 transition">
                View FAQ
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
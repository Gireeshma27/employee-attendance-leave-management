'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Clock,
  Calendar,
  Users,
  LogOut,
  Menu,
  X,
  BarChart3,
} from 'lucide-react';
import { useState } from 'react';

export function DashboardLayout({ children, role = 'employee' }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const getSidebarLinks = () => {
    const commonLinks = [
      { href: `/employee/dashboard`, label: 'Dashboard', icon: LayoutDashboard },
      { href: `/employee/attendance`, label: 'Attendance', icon: Clock },
      { href: `/employee/leave`, label: 'Leave', icon: Calendar },
      { href: `/employee/profile`, label: 'Profile', icon: Users },
    ];

    const managerLinks = [
      { href: `/manager/dashboard`, label: 'Dashboard', icon: LayoutDashboard },
      { href: `/manager/team-attendance`, label: 'Team Attendance', icon: Clock },
      { href: `/manager/leave-approvals`, label: 'Leave Approvals', icon: Calendar },
    ];

    const adminLinks = [
      { href: `/admin/dashboard`, label: 'Dashboard', icon: LayoutDashboard },
      { href: `/admin/employees`, label: 'Employees', icon: Users },
      { href: `/admin/attendance`, label: 'Attendance', icon: Clock },
      { href: `/admin/leaves`, label: 'Leaves', icon: Calendar },
      { href: `/admin/reports`, label: 'Reports', icon: BarChart3 },
    ];

    if (role === 'manager') return managerLinks;
    if (role === 'admin') return adminLinks;
    return commonLinks;
  };

  const links = getSidebarLinks();

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-50">
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 md:hidden z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } fixed md:static md:translate-x-0 left-0 top-0 w-64 h-screen bg-gray-900 text-white transition-transform duration-300 flex flex-col z-40`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-6 py-8 border-b border-gray-800">
          <h1 className="font-bold text-xl">AttendEase</h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-gray-400 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-2">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-colors whitespace-nowrap ${
                pathname === href
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              <Icon size={20} className="flex-shrink-0" />
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 py-6 border-t border-gray-800">
          <button className="flex items-center gap-4 w-full px-4 py-3 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors whitespace-nowrap">
            <LogOut size={20} className="flex-shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col w-full">
        {/* Topbar */}
        <header className="bg-white border-b border-gray-200 px-4 md:px-8 py-4 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-600 hover:text-gray-900"
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <div className="hidden sm:flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">John Doe</p>
              <p className="text-xs text-gray-500">Employee</p>
            </div>
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
              JD
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 w-full">{children}</main>
      </div>
    </div>
  );
}

export function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">AttendEase</h1>
          <p className="text-sm md:text-base text-blue-100">Employee Attendance & Leave Management</p>
        </div>
        {children}
      </div>
    </div>
  );
}

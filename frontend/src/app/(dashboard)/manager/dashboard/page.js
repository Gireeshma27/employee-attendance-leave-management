'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Clock, AlertCircle, Users, TrendingUp } from 'lucide-react';
import { useState, useEffect } from 'react';
import { apiService } from '@/lib/api';

export default function ManagerDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    teamSize: 0,
    presentToday: 0,
    absentToday: 0,
    pendingApprovals: 0,
  });
  const [teamData, setTeamData] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [attendanceRes, leavesRes] = await Promise.all([
        apiService.attendance.getTeamAttendance(),
        apiService.leave.getPendingLeaves(),
      ]);

      const attendance = attendanceRes.data || [];
      const pending = leavesRes.data || [];

      // Extract unique team members from attendance records
      const uniqueTeamMembers = new Map();
      attendance.forEach(record => {
        if (record.userId && !uniqueTeamMembers.has(record.userId._id)) {
          uniqueTeamMembers.set(record.userId._id, record.userId);
        }
      });
      const team = Array.from(uniqueTeamMembers.values());

      // Calculate stats
      const today = new Date().toISOString().split('T')[0];
      const todayAttendance = attendance.filter(a => {
        const attendanceDate = new Date(a.date).toISOString().split('T')[0];
        return attendanceDate === today;
      });

      const presentCount = todayAttendance.filter(a => a.checkIn).length;
      const absentCount = team.length - presentCount;

      setStats({
        teamSize: team.length,
        presentToday: presentCount,
        absentToday: absentCount,
        pendingApprovals: pending.length,
      });

      setTeamData(team.slice(0, 5)); // Show first 5 team members
    } catch (err) {
      console.error('Error fetching dashboard:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="manager">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="manager">
      <div className="space-y-6 md:space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Manager Dashboard</h1>
          <p className="text-xs md:text-sm text-gray-600 mt-1">Team attendance and performance overview</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 md:p-4">
            <p className="text-red-600 text-xs md:text-sm">{error}</p>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <Card>
            <CardContent className="pt-4 md:pt-6">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs md:text-sm text-gray-600">Team Size</p>
                  <p className="text-xl md:text-2xl font-bold text-gray-900 mt-1 md:mt-2">{stats.teamSize}</p>
                </div>
                <Users className="text-blue-600 flex-shrink-0 w-6 h-6 md:w-8 md:h-8" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 md:pt-6">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs md:text-sm text-gray-600">Present Today</p>
                  <p className="text-xl md:text-2xl font-bold text-gray-900 mt-1 md:mt-2">{stats.presentToday}</p>
                </div>
                <Clock className="text-green-600 flex-shrink-0 w-6 h-6 md:w-8 md:h-8" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 md:pt-6">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs md:text-sm text-gray-600">Absent Today</p>
                  <p className="text-xl md:text-2xl font-bold text-gray-900 mt-1 md:mt-2">{stats.absentToday}</p>
                </div>
                <AlertCircle className="text-red-600 flex-shrink-0 w-6 h-6 md:w-8 md:h-8" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 md:pt-6">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs md:text-sm text-gray-600">Pending Approvals</p>
                  <p className="text-xl md:text-2xl font-bold text-gray-900 mt-1 md:mt-2">{stats.pendingApprovals}</p>
                </div>
                <TrendingUp className="text-yellow-600 flex-shrink-0 w-6 h-6 md:w-8 md:h-8" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Team Attendance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-lg">Team Attendance Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto -mx-4 md:mx-0">
              <table className="w-full text-xs md:text-sm">
                <thead className="border-b border-gray-200">
                  <tr className="text-gray-600">
                    <th className="text-left py-2 md:py-3 px-4 md:px-0">Employee</th>
                    <th className="text-left py-2 md:py-3 px-4 md:px-0 hidden sm:table-cell">Check-in</th>
                    <th className="text-left py-2 md:py-3 px-4 md:px-0 hidden md:table-cell">Check-out</th>
                    <th className="text-left py-2 md:py-3 px-4 md:px-0">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {teamData.map((member, idx) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2 md:py-3 px-4 md:px-0 text-gray-900 font-medium">{member.name}</td>
                      <td className="py-2 md:py-3 px-4 md:px-0 text-gray-600 hidden sm:table-cell">-</td>
                      <td className="py-2 md:py-3 px-4 md:px-0 text-gray-600 hidden md:table-cell">-</td>
                      <td className="py-2 md:py-3 px-4 md:px-0">
                        <Badge variant="info">Active</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Team Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-lg">Team Performance (This Month)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 md:space-y-4">
              {teamData.map((emp, idx) => (
                <div key={idx} className="border border-gray-200 rounded-lg p-3 md:p-4">
                  <div className="flex items-center justify-between mb-2 md:mb-3">
                    <h4 className="font-semibold text-xs md:text-sm text-gray-900">{emp.name}</h4>
                    <span className="text-xs md:text-sm text-gray-600">85%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: '85%' }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 md:mt-2">Avg. 8.2h/day</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

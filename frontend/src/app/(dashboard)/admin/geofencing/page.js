"use client";

/**
 * GEOFENCING FEATURE TEMPORARILY DISABLED
 * 
 * This page has been replaced with a placeholder while geofencing
 * is temporarily disabled. The original code is preserved in version control.
 * 
 * To re-enable geofencing:
 * 1. Restore this file from version control (git checkout)
 * 2. Re-enable the sidebar link in DashboardLayout.js
 * 3. Re-enable the office API endpoints in lib/api.js
 * 4. Re-enable the backend office routes in officeroutes.js
 * 5. Remove the isOutOfRange override in employee/attendance/page.js
 */

import { DashboardLayout } from "@/components/layout/DashboardLayout";

// Temporary placeholder page while geofencing is disabled
export default function GeofencingPage() {
  return (
    <DashboardLayout role="admin">
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Geofencing Temporarily Disabled</h2>
          <p className="text-gray-500 max-w-md">
            The geofencing feature is currently under maintenance. 
            Please check back later or contact your administrator.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}

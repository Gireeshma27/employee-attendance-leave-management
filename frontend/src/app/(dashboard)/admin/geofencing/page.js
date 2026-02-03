"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import {
  MapPin,
  Plus,
  Search,
  Edit2,
  Trash2,
  ChevronRight,
  Target,
  Navigation,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import { AddGeofenceModal } from "@/components/modals/AddGeofenceModal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

// Dynamically import the Map component with no SSR
const GeofencingMap = dynamic(() => import("@/components/GeofencingMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-50 flex flex-col items-center justify-center gap-3">
      <Navigation className="text-blue-600 animate-bounce" size={40} />
      <p className="text-sm font-bold text-gray-400">
        Loading interactive map...
      </p>
    </div>
  ),
});

export default function GeofencingPage() {
  const [radius, setRadius] = useState(100);
  const [center, setCenter] = useState([20.5937, 78.9629]); // Default to India center
  const [isLocating, setIsLocating] = useState(false);

  const [mounted, setMounted] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    id: null,
  });

  const [locations, setLocations] = useState([
    {
      id: 1,
      name: "Main Headquarters",
      description: "Primary Hub",
      address: "123 Tech Avenue, Silicon Valley, CA",
      coordinates: "37.7749° N, 122.4194° W",
      coords: [37.7749, -122.4194],
      radius: "100",
      status: "Active",
    },
    {
      id: 2,
      name: "East Coast Branch",
      description: "Satellite Office",
      address: "456 Innovation Dr, New York, NY",
      coordinates: "40.7128° N, 74.0060° W",
      coords: [40.7128, -74.006],
      radius: "150",
      status: "Active",
    },
    {
      id: 3,
      name: "London Workspace",
      description: "European Hub",
      address: "78 Thames St, London, UK",
      coordinates: "51.5074° N, 0.1278° W",
      coords: [51.5074, -0.1278],
      radius: "75",
      status: "Inactive",
    },
  ]);

  // Handle Mounting & Geolocation
  useEffect(() => {
    setMounted(true);
    if ("geolocation" in navigator) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCenter([position.coords.latitude, position.coords.longitude]);
          setIsLocating(false);
        },
        (error) => {
          // Handle geolocation errors gracefully
          const errorMessages = {
            1: "Location permission denied. Using default location.",
            2: "Location unavailable. Using default location.",
            3: "Location request timed out. Using default location.",
          };
          console.warn(
            "Geolocation:",
            errorMessages[error.code] || "Unknown error. Using default location."
          );
          // Keep using default India center coordinates
          setIsLocating(false);
        },
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 300000, // Cache location for 5 minutes
        }
      );
    }
  }, []);

  const handleMapClick = (newCenter) => {
    setCenter(newCenter);
  };

  const handleAddSuccess = (newLoc) => {
    if (selectedLocation) {
      setLocations(
        locations.map((loc) => (loc.id === newLoc.id ? newLoc : loc)),
      );
    } else {
      setLocations([...locations, newLoc]);
    }
    setSelectedLocation(null);
  };

  const handleDelete = () => {
    if (deleteConfirm.id) {
      setLocations(locations.filter((loc) => loc.id !== deleteConfirm.id));
      setDeleteConfirm({ isOpen: false, id: null });
    }
  };

  const handleEditClick = (loc) => {
    setSelectedLocation(loc);
    setIsAddModalOpen(true);
  };

  if (!mounted) {
    return (
      <DashboardLayout role="admin">
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin">
      <div className="max-w-7xl mx-auto space-y-6 md:space-y-8 pb-12 px-2 sm:px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="min-w-0">
            <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
              Geofence and Location Settings
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-1 font-medium">
              Manage office perimeters and attendance boundaries.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border border-gray-100 shadow-sm flex-shrink-0">
            <div
              className={`w-2 h-2 rounded-full animate-pulse ${isLocating ? "bg-orange-500" : "bg-green-500"}`}
            ></div>
            <span className="text-[9px] sm:text-[11px] font-black text-gray-500 uppercase tracking-widest">
              {isLocating ? "Locating..." : "Work Mode"}
            </span>
          </div>
        </div>

        {/* Setup Section */}
        <div className="bg-white border border-gray-100 rounded-[32px] p-4 sm:p-6 md:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-6 md:mb-8">
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-gray-900">
                Office Geofence Setup
              </h2>
              <p className="text-xs sm:text-sm text-gray-400 font-medium mt-1">
                Search for an address and define the allowed attendance radius
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-6 py-2 sm:py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-100 active:scale-95 transition-all w-full sm:w-auto"
            >
              <Plus size={16} className="sm:w-[18px] sm:h-[18px]" />
              Add New Location
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 sm:gap-4 md:gap-6 items-end mb-6 md:mb-8">
            <div className="sm:col-span-3">
              <div className="relative">
                <Search
                  className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <Input
                  placeholder="Search office address, city, or zip code..."
                  className="pl-10 sm:pl-12 py-2 sm:py-3 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white transition-all text-xs sm:text-sm shadow-sm"
                />
              </div>
            </div>
            <div className="bg-white p-2 sm:p-4 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex justify-between items-center mb-2 sm:mb-3">
                <p className="text-[8px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Radius
                </p>
                <p className="text-[9px] sm:text-xs font-bold text-blue-600 bg-blue-50 px-1.5 sm:px-2 py-0.5 rounded-md">
                  {radius}m
                </p>
              </div>
              <input
                type="range"
                min="50"
                max="500"
                step="25"
                value={radius}
                onChange={(e) => setRadius(parseInt(e.target.value))}
                className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none"
              />
              <div className="flex justify-between mt-1 sm:mt-2 text-[8px] sm:text-[9px] font-bold text-gray-300">
                <span>50m</span>
                <span>500m</span>
              </div>
            </div>
          </div>

          {/* Real Map Integration */}
          <div className="relative w-full h-[400px] sm:h-[500px] lg:h-[600px] bg-gray-100 rounded-3xl overflow-hidden border-4 sm:border-8 border-white shadow-xl group">
            <GeofencingMap
              center={center}
              radius={radius}
              locations={locations}
              onCenterChange={handleMapClick}
            />

            {/* Map Branding/Controls Overlay */}
            <div className="absolute top-6 right-6 flex items-center gap-2 z-[40]">
              <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full border border-gray-100 shadow-xl flex items-center gap-2 overflow-hidden">
                <div className="flex items-center gap-2 px-1">
                  <Navigation
                    className="text-blue-600 animate-pulse"
                    size={14}
                  />
                  <span className="text-[10px] font-black text-gray-800 uppercase tracking-tight">
                    Click Map to Set Center
                  </span>
                </div>
              </div>
            </div>

            <div className="absolute bottom-6 left-6 z-[40]">
              <div className="bg-white/95 backdrop-blur-sm p-3 rounded-2xl border border-gray-100 shadow-2xl min-w-[200px]">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-2">
                  Live Coordinates
                </p>
                <p className="text-[11px] font-bold text-gray-800 font-mono tracking-tight leading-none">
                  Lat: {center[0].toFixed(4)}°, Long: {center[1].toFixed(4)}°
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Saved Locations Table */}
        <div className="bg-white border border-gray-100 rounded-[32px] overflow-hidden shadow-sm">
          <div className="p-4 sm:p-6 md:p-8 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h3 className="font-bold text-base sm:text-lg text-gray-900">Saved Locations</h3>
            <span className="text-[10px] sm:text-xs font-bold text-gray-400">
              Showing {locations.length} results
            </span>
          </div>
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full min-w-[640px]">
              <thead className="bg-gray-50/50 text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50">
                <tr>
                  <th className="px-3 sm:px-6 md:px-8 py-3 sm:py-4 md:py-5 text-left">Office Name</th>
                  <th className="px-3 sm:px-6 md:px-8 py-3 sm:py-4 md:py-5 text-left hidden sm:table-cell">Address</th>
                  <th className="px-3 sm:px-6 md:px-8 py-3 sm:py-4 md:py-5 text-left hidden md:table-cell">Coordinates</th>
                  <th className="px-3 sm:px-6 md:px-8 py-3 sm:py-4 md:py-5 text-center">Radius</th>
                  <th className="px-3 sm:px-6 md:px-8 py-3 sm:py-4 md:py-5 text-center">Status</th>
                  <th className="px-3 sm:px-6 md:px-8 py-3 sm:py-4 md:py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {locations.map((loc) => (
                  <tr
                    key={loc.id}
                    className="hover:bg-gray-50/50 transition-colors group"
                  >
                    <td className="px-3 sm:px-6 md:px-8 py-3 sm:py-4 md:py-6 whitespace-nowrap">
                      <div>
                        <p className="text-xs sm:text-sm font-black text-gray-900 tracking-tight">
                          {loc.name}
                        </p>
                        <p className="text-[9px] sm:text-[11px] font-medium text-gray-400 mt-0.5">
                          {loc.description}
                        </p>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 md:px-8 py-3 sm:py-4 md:py-6 max-w-[200px] hidden sm:table-cell">
                      <p className="text-[10px] sm:text-[12px] font-medium text-gray-500 leading-relaxed truncate">
                        {loc.address}
                      </p>
                    </td>
                    <td className="px-3 sm:px-6 md:px-8 py-3 sm:py-4 md:py-6 hidden md:table-cell">
                      <p className="text-[9px] sm:text-[11px] font-mono font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-md inline-block">
                        {loc.coordinates}
                      </p>
                    </td>
                    <td className="px-3 sm:px-6 md:px-8 py-3 sm:py-4 md:py-6 text-center">
                      <span className="bg-blue-50 text-blue-600 text-[9px] sm:text-[11px] font-black px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border border-blue-100 shadow-sm">
                        {loc.radius}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 md:px-8 py-3 sm:py-4 md:py-6 text-center">
                      <Badge
                        variant={
                          loc.status === "Active" ? "success" : "secondary"
                        }
                        className="text-[9px] sm:text-[10px] font-black py-1 px-2 sm:px-3"
                      >
                        {loc.status}
                      </Badge>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2 transition-opacity">
                        <button
                          type="button"
                          onClick={() => handleEditClick(loc)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all active:scale-90"
                          title="Edit Location"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setDeleteConfirm({ isOpen: true, id: loc.id })
                          }
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all active:scale-90"
                          title="Delete Location"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AddGeofenceModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setSelectedLocation(null);
        }}
        onSuccess={handleAddSuccess}
        initialCenter={center}
        initialRadius={radius}
        initialData={selectedLocation}
      />

      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, id: null })}
        onConfirm={handleDelete}
        title="Delete Location"
        message="Are you sure you want to delete this office location? This action cannot be undone."
        confirmText="Delete Now"
        variant="danger"
      />
    </DashboardLayout>
  );
}

"use client";

import { useState, useEffect } from "react";
import { X, MapPin, Target } from "lucide-react";
import { Input } from "@/components/ui/Input";

export function AddGeofenceModal({
  isOpen,
  onClose,
  onSuccess,
  initialCenter,
  initialRadius,
  initialData,
}) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    address: "",
    radius: 100,
    coords: [20.5937, 78.9629],
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        description: initialData.description || "",
        address: initialData.address || "",
        radius: initialData.radius || 100,
        coords: initialData.coords || initialCenter || [20.5937, 78.9629],
      });
    } else {
      setFormData({
        name: "",
        description: "",
        address: "",
        radius: initialRadius || 100,
        coords: initialCenter || [20.5937, 78.9629],
      });
    }
  }, [initialData, initialCenter, initialRadius, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const result = {
      ...formData,
      id: initialData?.id || Date.now(),
      coordinates: `${formData.coords[0].toFixed(4)}° N, ${formData.coords[1].toFixed(4)}° W`,
      status: initialData?.status || "Active",
    };
    onSuccess(result);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              {initialData ? "Edit Location" : "Add New Location"}
            </h2>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest mt-1">
              Geofence Configuration
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-white rounded-full transition-colors border border-transparent hover:border-slate-100 shadow-sm"
          >
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">
                Office Name
              </label>
              <Input
                required
                placeholder="e.g. Headquarters, North Branch"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="rounded-xl border-slate-100 bg-slate-50/50 focus:bg-white"
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">
                Description
              </label>
              <Input
                placeholder="Short description..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="rounded-xl border-slate-100 bg-slate-50/50 focus:bg-white"
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">
                Address
              </label>
              <Input
                icon={MapPin}
                required
                placeholder="Street, City, State..."
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                className="rounded-xl border-slate-100 bg-slate-50/50 focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">
                  Radius (meters)
                </label>
                <Input
                  icon={Target}
                  type="number"
                  required
                  min="50"
                  max="1000"
                  value={formData.radius}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      radius:
                        e.target.value === "" ? "" : parseInt(e.target.value),
                    })
                  }
                  className="rounded-xl border-slate-100 bg-slate-50/50 focus:bg-white"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">
                  Fixed Coordinates
                </label>
                <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5">
                  <p className="text-[11px] font-semibold text-slate-600 font-mono">
                    {formData.coords[0].toFixed(2)},{" "}
                    {formData.coords[1].toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3.5 rounded-2xl font-semibold text-sm text-slate-500 bg-slate-50 hover:bg-slate-100 transition-all border border-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3.5 rounded-2xl font-semibold text-sm text-white bg-blue-600 hover:bg-blue-700 shadow-xl transition-all font-black uppercase tracking-widest"
            >
              {initialData ? "Update" : "Save"} Location
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Clock, MapPin, LogIn, LogOut, Calendar } from "lucide-react";

export default function CheckInOut() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState(null);
  const [workingHours, setWorkingHours] = useState("00:00:00");
  const [location, setLocation] = useState({ lat: null, lng: null, address: "Fetching location..." });

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Calculate working hours
  useEffect(() => {
    if (isCheckedIn && checkInTime) {
      const interval = setInterval(() => {
        const diff = new Date() - checkInTime;
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setWorkingHours(
          `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        );
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isCheckedIn, checkInTime]);

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            address: "Office Location - Main Building"
          });
        },
        (error) => {
          setLocation({
            lat: null,
            lng: null,
            address: "Location access denied"
          });
        }
      );
    }
  }, []);

  const handleCheckIn = () => {
    setIsCheckedIn(true);
    setCheckInTime(new Date());
  };

  const handleCheckOut = () => {
    setIsCheckedIn(false);
    setCheckInTime(null);
    setWorkingHours("00:00:00");
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-gradient-to-br from-white to-indigo-50 rounded-2xl p-8 border border-indigo-100 shadow-lg">
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left Section - Time Display */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-indigo-600" />
              <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Today's Date</h3>
            </div>
            <p className="text-lg text-slate-700 font-medium">{formatDate(currentTime)}</p>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-indigo-600" />
              <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Current Time</h3>
            </div>
            <p className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-emerald-600 bg-clip-text text-transparent">
              {formatTime(currentTime)}
            </p>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-indigo-600" />
              <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Location</h3>
            </div>
            <p className="text-sm text-slate-700 font-medium">{location.address}</p>
            {location.lat && location.lng && (
              <p className="text-xs text-slate-500 mt-1">
                {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
              </p>
            )}
          </div>
        </div>

        {/* Right Section - Check In/Out Actions */}
        <div className="flex flex-col justify-between">
          {/* Status Card */}
          <div className={`p-6 rounded-xl border-2 mb-6 ${
            isCheckedIn 
              ? 'bg-emerald-50 border-emerald-200' 
              : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Status</span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                isCheckedIn 
                  ? 'bg-emerald-500 text-white' 
                  : 'bg-slate-400 text-white'
              }`}>
                {isCheckedIn ? 'Checked In' : 'Not Checked In'}
              </span>
            </div>
            
            {isCheckedIn ? (
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-slate-600 mb-1">Check-in Time</p>
                  <p className="text-lg font-bold text-slate-800">{formatTime(checkInTime)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 mb-1">Working Hours</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-700 bg-clip-text text-transparent">
                    {workingHours}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-slate-600">Click the button below to start your work day</p>
            )}
          </div>

          {/* Action Button */}
          {!isCheckedIn ? (
            <button
              onClick={handleCheckIn}
              className="group relative w-full py-4 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-bold rounded-xl hover:shadow-xl hover:shadow-indigo-500/50 transition-all duration-300 hover:scale-105 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-700 to-indigo-800 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative flex items-center justify-center gap-2">
                <LogIn className="w-5 h-5" />
                <span className="text-lg">Check In Now</span>
              </div>
            </button>
          ) : (
            <button
              onClick={handleCheckOut}
              className="group relative w-full py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-bold rounded-xl hover:shadow-xl hover:shadow-emerald-500/50 transition-all duration-300 hover:scale-105 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-700 to-emerald-800 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative flex items-center justify-center gap-2">
                <LogOut className="w-5 h-5" />
                <span className="text-lg">Check Out</span>
              </div>
            </button>
          )}

          {/* Info Text */}
          <p className="text-xs text-center text-slate-500 mt-4">
            {isCheckedIn 
              ? "Don't forget to check out before leaving"
              : "Your location will be recorded for attendance verification"
            }
          </p>
        </div>
      </div>

      {/* Bottom Info Bar */}
      <div className="mt-6 pt-6 border-t border-indigo-100">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-slate-600 mb-1">Expected Hours</p>
            <p className="text-sm font-bold text-slate-800">9:00:00</p>
          </div>
          <div>
            <p className="text-xs text-slate-600 mb-1">Break Time</p>
            <p className="text-sm font-bold text-slate-800">1:00:00</p>
          </div>
          <div>
            <p className="text-xs text-slate-600 mb-1">Office Entry</p>
            <p className="text-sm font-bold text-slate-800">09:00 AM</p>
          </div>
        </div>
      </div>
    </div>
  );
}
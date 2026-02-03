"use client";

import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons in Leaflet
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Component to handle map view updates
function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

// Component to handle map clicks
function MapClickHandler({ onCenterChange }) {
  useMapEvents({
    click(e) {
      onCenterChange([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

export default function LeafletMap({
  center,
  radius,
  locations,
  onCenterChange,
}) {
  return (
    <MapContainer
      center={center}
      zoom={15}
      className="w-full h-full z-0"
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapUpdater center={center} />
      <MapClickHandler onCenterChange={onCenterChange} />

      {/* Primary Setup Geofence */}
      <Circle
        center={center}
        radius={radius}
        pathOptions={{
          color: "#3b82f6",
          fillColor: "#3b82f6",
          fillOpacity: 0.1,
          dashArray: "5, 10",
        }}
      />

      <Marker position={center} icon={icon}>
        <Popup>
          <div className="p-1">
            <p className="font-bold text-sm">Target Office Center</p>
            <p className="text-xs text-gray-500">Radius: {radius}m</p>
            <p className="text-[10px] text-blue-600 mt-1">
              Click anywhere on map to move
            </p>
          </div>
        </Popup>
      </Marker>

      {/* Saved Locations */}
      {locations.map((loc) => (
        <Circle
          key={loc.id}
          center={loc.coords}
          radius={parseInt(loc.radius)}
          pathOptions={{
            color: loc.status === "Active" ? "#10b981" : "#94a3b8",
            fillColor: loc.status === "Active" ? "#10b981" : "#94a3b8",
            fillOpacity: 0.05,
            weight: 1,
          }}
        />
      ))}

      {locations.map((loc) => (
        <Marker key={`marker-${loc.id}`} position={loc.coords} icon={icon}>
          <Popup>
            <div className="p-1">
              <p className="font-bold text-sm">{loc.name}</p>
              <p className="text-xs text-gray-500">{loc.address}</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

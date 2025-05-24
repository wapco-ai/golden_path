// src/components/map/RouteMap.jsx
import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';


const RouteMap = ({ origin, destination, routeOptions }) => {
  const mapRef = useRef(null);
  const routeLayerRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current) {
      // Initialize map
      mapRef.current = L.map('route-map').setView([36.297, 59.606], 18); // Approximate coordinates for Imam Reza Shrine
      
      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapRef.current);
      
      // Initialize route layer
      routeLayerRef.current = L.layerGroup().addTo(mapRef.current);
    }

    // Clear previous route
    routeLayerRef.current.clearLayers();

    // Add markers for origin and destination
    if (origin && origin.coordinates) {
      L.marker(origin.coordinates, {
        icon: L.divIcon({
          className: 'custom-marker origin-marker',
          html: '🟢'
        })
      }).addTo(routeLayerRef.current);
    }

    if (destination && destination.coordinates) {
      L.marker(destination.coordinates, {
        icon: L.divIcon({
          className: 'custom-marker destination-marker',
          html: '🔴'
        })
      }).addTo(routeLayerRef.current);
    }

    // Here you would normally fetch the route from a routing API
    // For now, we'll just draw a straight line between points
    if (origin?.coordinates && destination?.coordinates) {
      const routeLine = L.polyline(
        [origin.coordinates, destination.coordinates],
        { color: '#3498db', weight: 5 }
      ).addTo(routeLayerRef.current);
      
      // Fit map to route bounds
      mapRef.current.fitBounds(routeLine.getBounds());
    }

  }, [origin, destination, routeOptions]);

  return <div id="route-map" className="route-map-container"></div>;
};

export default RouteMap;
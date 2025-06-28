// src/components/map/RouteMap.jsx
import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const RouteMap = ({ 
  origin, 
  destination, 
  routeOptions, 
  isMapModalOpen,  // New prop for modal state
  userLocation,    // Existing prop from your usage
  routeSteps,      // Existing prop from your usage
  currentStep      // Existing prop from your usage
}) => {
  const mapRef = useRef(null);
  const routeLayerRef = useRef(null);

  // Handle map resize when modal opens/closes
  useEffect(() => {
    if (mapRef.current && isMapModalOpen !== undefined) {
      const timeout = setTimeout(() => {
        mapRef.current.invalidateSize();
        // Recenter map if needed
        if (userLocation && userLocation.length === 2) {
          mapRef.current.setView(userLocation, 18);
        }
      }, 400); // Match animation duration
      
      return () => clearTimeout(timeout);
    }
  }, [isMapModalOpen, userLocation]);

  // Initialize map and route
  useEffect(() => {
    if (!mapRef.current) {
      // Initialize map with userLocation or default center
      const center = userLocation && userLocation.length === 2 
        ? userLocation 
        : [36.297, 59.606]; // Default to Imam Reza Shrine coordinates
      
      mapRef.current = L.map('route-map').setView(center, 18);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapRef.current);
      
      routeLayerRef.current = L.layerGroup().addTo(mapRef.current);
    }

    // Clear previous route
    routeLayerRef.current.clearLayers();

    // Add user location marker
    if (userLocation && userLocation.length === 2) {
      L.marker(userLocation, {
        icon: L.divIcon({
          className: 'custom-marker user-marker',
          html: '📍',
          iconSize: [30, 30]
        })
      }).addTo(routeLayerRef.current);
    }

    // Add route steps if available
    if (routeSteps && routeSteps.length > 0) {
      const routeCoordinates = routeSteps.map(step => step.coordinates);
      const routeLine = L.polyline(routeCoordinates, {
        color: '#1E90FF',
        weight: 5,
        opacity: 0.7,
        dashArray: '5, 5'
      }).addTo(routeLayerRef.current);
      
      // Fit map to route bounds
      mapRef.current.fitBounds(routeLine.getBounds());
      
      // Add current step marker
      if (currentStep >= 0 && currentStep < routeSteps.length) {
        const step = routeSteps[currentStep];
        L.marker(step.coordinates, {
          icon: L.divIcon({
            className: 'current-step-marker',
            html: '🟢',
            iconSize: [25, 25]
          })
        }).addTo(routeLayerRef.current);
      }
    }

  }, [origin, destination, routeOptions, userLocation, routeSteps, currentStep]);

  return <div id="route-map" className="route-map-container"></div>;
};

export default RouteMap;
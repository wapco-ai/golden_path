import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const Routing = ({ userLocation, routeSteps, currentStep, isInfoModalOpen }) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);
  const polylineRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current) return;

    mapInstance.current = L.map(mapRef.current, {
      preferCanvas: true,
    }).setView([36.2880, 59.6157], 18);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(mapInstance.current);

    // Add 3D buildings effect
    const add3DBuildings = () => {
      const shrineArea = L.polygon([
        [36.2878, 59.6155],
        [36.2878, 59.6168],
        [36.2889, 59.6168],
        [36.2889, 59.6155]
      ], {
        color: '#a67c52',
        fillColor: '#d4a76a',
        fillOpacity: 0.8,
        weight: 2
      }).addTo(mapInstance.current);

      shrineArea.bindTooltip("حرم امام رضا (ع)", { permanent: false, direction: 'top' });
    };

    add3DBuildings();

    return () => {
      mapInstance.current.remove();
    };
  }, []);

  useEffect(() => {
    if (!mapInstance.current || !routeSteps || routeSteps.length === 0) return;

    // Clear previous markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add markers for each step
    routeSteps.forEach((step, index) => {
      const marker = L.marker(step.coordinates, {
        icon: L.divIcon({
          className: `custom-marker ${index === currentStep ? 'active' : ''}`,
          html: `<div>${index + 1}</div>`,
          iconSize: [30, 30]
        })
      }).addTo(mapInstance.current);

      if (index === currentStep) {
        marker.bindPopup(step.instruction).openPopup();
        mapInstance.current.setView(step.coordinates, 18);
      }

      markersRef.current.push(marker);
    });

    // Draw route path
    const routePath = routeSteps.map(step => step.coordinates);
    if (polylineRef.current) {
      polylineRef.current.remove();
    }
    polylineRef.current = L.polyline(routePath, {
      color: '#3498db',
      weight: 4,
      opacity: 0.7,
      dashArray: '10, 10'
    }).addTo(mapInstance.current);

  }, [routeSteps, currentStep]);

  useEffect(() => {
    if (!mapInstance.current || !userLocation) return;

    const userMarker = L.marker(userLocation, {
      icon: L.divIcon({
        className: 'user-marker',
        html: '<div>👤</div>',
        iconSize: [30, 30]
      })
    }).addTo(mapInstance.current);

    return () => {
      userMarker.remove();
    };
  }, [userLocation]);

  return <div ref={mapRef} className="route-map" />;
};

export default Routing;
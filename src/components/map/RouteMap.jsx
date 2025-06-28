// src/components/map/RouteMap.jsx
import React from 'react';
import Map, { Marker, Source, Layer } from 'react-map-gl';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import osmStyle from '../../services/osmStyle';

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

<<<<<<< HEAD
  return (
    <div id="route-map" className="route-map-container">
      <Map
        mapLib={maplibregl}
        mapStyle={osmStyle}
        style={{ width: '100%', height: '100%' }}
        initialViewState={{
          latitude: center[0],
          longitude: center[1],
          zoom: 18
        }}
      >
        {origin?.coordinates && (
          <Marker longitude={origin.coordinates[1]} latitude={origin.coordinates[0]} anchor="bottom">
            <div>🟢</div>
          </Marker>
        )}
        {destination?.coordinates && (
          <Marker longitude={destination.coordinates[1]} latitude={destination.coordinates[0]} anchor="bottom">
            <div>🔴</div>
          </Marker>
        )}
        {route && (
          <Source id="route" type="geojson" data={{ type: 'Feature', geometry: { type: 'LineString', coordinates: route } }}>
            <Layer id="route-line" type="line" paint={{ 'line-color': '#3498db', 'line-width': 5 }} />
          </Source>
        )}
      </Map>
    </div>
  );
=======
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
>>>>>>> 7d48437bd10f346b14d0f136093ecabb68b4940f
};

export default RouteMap;

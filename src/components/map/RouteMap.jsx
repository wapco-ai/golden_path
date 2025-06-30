// src/components/map/RouteMap.jsx
import React, { useEffect, useRef, useState } from 'react';
import Map, { Marker } from 'react-map-gl';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import osmStyle from '../../services/osmStyle';
import GeoJsonOverlay from './GeoJsonOverlay';

const RouteMap = ({
  userLocation,
  routeSteps,
  currentStep,
  isInfoModalOpen,
  isMapModalOpen,
  is3DView,
  routeGeo
}) => {
  const mapRef = useRef(null);
  const center = userLocation && userLocation.length === 2
    ? userLocation
    : [36.297, 59.606]; // Default to Imam Reza Shrine coordinates

  // Handle map resize when modal opens/closes
  useEffect(() => {
    if (mapRef.current) {
      const timeout = setTimeout(() => {
        mapRef.current.resize();
        if (userLocation && userLocation.length === 2) {
          mapRef.current.flyTo({
            center: [userLocation[1], userLocation[0]],
            zoom: 18,
            pitch: is3DView ? 60 : 0 // Set pitch based on 3D view state
          });
        }
      }, 400);

      return () => clearTimeout(timeout);
    }
  }, [isMapModalOpen, userLocation, is3DView]);

  // Toggle 3D view effect
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.easeTo({
        pitch: is3DView ? 60 : 0,
        duration: 500
      });
    }
  }, [is3DView]);

  // Zoom to current segment when step changes
  useEffect(() => {
    if (
      mapRef.current &&
      routeGeo &&
      currentStep < routeGeo.geometry.coordinates.length - 1
    ) {
      const start = routeGeo.geometry.coordinates[currentStep];
      const end = routeGeo.geometry.coordinates[currentStep + 1];
      const bounds = new maplibregl.LngLatBounds(
        [start[0], start[1]],
        [start[0], start[1]]
      );
      bounds.extend([end[0], end[1]]);
      mapRef.current.fitBounds(bounds, { padding: 80, duration: 700 });
    }
  }, [currentStep, routeGeo]);

  return (
    <Map
      ref={mapRef}
      mapLib={maplibregl}
      mapStyle={osmStyle}
      initialViewState={{
        longitude: center[1],
        latitude: center[0],
        zoom: 18,
        pitch: 0
      }}
      attributionControl={false}
      terrain={is3DView ? { source: 'terrain', exaggeration: 1.5 } : undefined}
    >
      {/* User location marker */}
      <Marker longitude={userLocation[1]} latitude={userLocation[0]} anchor="bottom">
        <div className="user-marker">📍</div>
      </Marker>

      {/* Current step marker if available */}
      {routeSteps && currentStep < routeSteps.length && routeSteps[currentStep].coordinates && (
        <Marker
          longitude={routeSteps[currentStep].coordinates[1]}
          latitude={routeSteps[currentStep].coordinates[0]}
          anchor="bottom"
        >
          <div className="current-step-marker">🔵</div>
        </Marker>
      )}

      <GeoJsonOverlay />
    </Map>
  );
};

export default RouteMap;
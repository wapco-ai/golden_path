// src/components/map/RouteMap.jsx
import React, { useEffect, useRef, useState } from 'react';
import Map, { Marker, Source, Layer } from 'react-map-gl';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import osmStyle from '../../services/osmStyle';
import GeoJsonOverlay from './GeoJsonOverlay';

import { forwardRef, useImperativeHandle } from 'react';

const RouteMap = forwardRef(({
  userLocation,
  routeSteps,
  currentStep,
  isInfoModalOpen,
  isMapModalOpen,
  is3DView,
  routeGeo,
  alternativeRoutes = [],
  onSelectAlternativeRoute
}, ref) => {
  const mapRef = useRef(null);
  const center = userLocation && userLocation.length === 2
    ? userLocation
    : [36.297, 59.606]; // Default to Imam Reza Shrine coordinates
  const altLayerIds = alternativeRoutes.flatMap((_, idx) => [
    `alt-route-line-${idx}`,
    `alt-route-border-${idx}`
  ]);

  // Custom SVG marker component
  const OriginMarker = () => (
    <svg width="80" height="80" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="soft-shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000000" floodOpacity="0.3" />
        </filter>
      </defs>

      <g filter="url(#soft-shadow)">
        <path 
          d="M 50 10 L 90 60 A 10 10 0 0 1 80 70 L 20 70 A 10 10 0 0 1 10 60 Z" 
          fill="#6B7280" />
          
        <path 
          d="M 50 5 L 90 55 A 10 10 0 0 1 80 65 L 20 65 A 10 10 0 0 1 10 55 Z" 
          fill="#4A90E2" />

        <path 
          d="M 53 30 A 5 5 0 1 1 43 30 A 5 5 0 0 1 53 30 Z M 60 55 L 52 45 L 48 45 L 40 55 L 45 55 L 48 50 L 52 50 L 55 55 Z" 
          fill="white" />
      </g>
    </svg>
  );

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

  // Fit map to the full route when a new route is loaded
  useEffect(() => {
    if (mapRef.current && routeGeo) {
      const coords = routeGeo.geometry?.coordinates || [];
      if (coords.length > 0) {
        const bounds = new maplibregl.LngLatBounds(
          [coords[0][0], coords[0][1]],
          [coords[0][0], coords[0][1]]
        );
        coords.forEach(([lng, lat]) => bounds.extend([lng, lat]));
        mapRef.current.fitBounds(bounds, { padding: 80, duration: 700 });
      }
    }
  }, [routeGeo]);

  // Expose a method to parent components for fitting bounds
  const fitRouteBounds = () => {
    if (mapRef.current && routeGeo) {
      const coords = routeGeo.geometry?.coordinates || [];
      if (coords.length > 0) {
        const bounds = new maplibregl.LngLatBounds(
          [coords[0][0], coords[0][1]],
          [coords[0][0], coords[0][1]]
        );
        coords.forEach(([lng, lat]) => bounds.extend([lng, lat]));
        mapRef.current.fitBounds(bounds, { padding: 80, duration: 700 });
      }
    }
  };

  useImperativeHandle(ref, () => ({ fitRouteBounds }));

  return (
    <Map
      ref={mapRef}
      mapLib={maplibregl}
      mapStyle={osmStyle}
      interactiveLayerIds={altLayerIds}
      onClick={(e) => {
        const feature = e.features && e.features[0];
        if (
          feature &&
          feature.layer &&
          (feature.layer.id.startsWith('alt-route-line-') ||
            feature.layer.id.startsWith('alt-route-border-'))
        ) {
          const idx = parseInt(
            feature.layer.id.replace(/alt-route-(?:line|border)-/, '')
          );
          if (!Number.isNaN(idx) && alternativeRoutes[idx] && onSelectAlternativeRoute) {
            onSelectAlternativeRoute(alternativeRoutes[idx]);
          }
        }
      }}
      
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
        <div className="user-marker">
          <OriginMarker />
        </div>
      </Marker>

      {/* Current step marker if available */}
      {routeSteps && currentStep < routeSteps.length && routeSteps[currentStep].coordinates && (
        <Marker
          longitude={routeSteps[currentStep].coordinates[1]}
          latitude={routeSteps[currentStep].coordinates[0]}
          anchor="bottom"
        >
          <div className="current-step-marker" style={{
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            backgroundColor: '#4A90E2',
            border: '2px solid white',
            boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
          }} />
        </Marker>
      )}

      {routeGeo && (
        <Source id="route" type="geojson" data={routeGeo}>
          <Layer
            id="route-line"
            type="line"
            paint={{
              'line-color': '#4A90E2',
              'line-width': 6,
              'line-dasharray': [1, 2] // Creates dotted pattern
            }}
            layout={{ 'line-cap': 'round', 'line-join': 'round' }}
          />
          <Layer
            id="route-border"
            type="line"
            paint={{
              'line-color': 'white',
              'line-width': 8,
              'line-dasharray': [1, 2] // Creates dotted pattern
            }}
            layout={{ 'line-cap': 'round', 'line-join': 'round' }}
          />
        </Source>
      )}

      {alternativeRoutes.map((alt, idx) => (
        <Source key={idx} id={`alt-route-${idx}`} type="geojson" data={alt.geo}>
          <Layer
            id={`alt-route-border-${idx}`}
            type="line"
            paint={{
              'line-color': 'white',
              'line-width': 8,
              'line-dasharray': [1, 2] // Creates dotted pattern
            }}
            layout={{ 'line-cap': 'round', 'line-join': 'round' }}
          />
          <Layer
            id={`alt-route-line-${idx}`}
            type="line"
            paint={{
              'line-color': '#A0C4FF', // Lighter blue for alternatives
              'line-width': 6,
              'line-dasharray': [1, 2] // Creates dotted pattern
            }}
            layout={{ 'line-cap': 'round', 'line-join': 'round' }}
          />
        </Source>
      ))}

      <GeoJsonOverlay />
    </Map>
  );
};
export default RouteMap;
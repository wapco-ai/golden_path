// src/components/map/RouteMap.jsx
import React, { useEffect, useRef, useState } from 'react';
import Map, { Marker, Source, Layer } from 'react-map-gl';
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
  routeGeo,
  alternativeRoutes = [],
  onSelectAlternativeRoute
}) => {
  const mapRef = useRef(null);
  const center = userLocation && userLocation.length === 2
    ? userLocation
    : [36.297, 59.606]; // Default to Imam Reza Shrine coordinates
  const altLayerIds = alternativeRoutes.map((_, idx) => `alt-route-line-${idx}`);

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

  return (
    <Map
      ref={mapRef}
      mapLib={maplibregl}
      mapStyle={osmStyle}
      interactiveLayerIds={altLayerIds}
      onClick={(e) => {
        const feature = e.features && e.features[0];
        if (feature && feature.layer && feature.layer.id.startsWith('alt-route-line-')) {
          const idx = parseInt(feature.layer.id.replace('alt-route-line-', ''));
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

      {routeGeo && (
        <Source id="route" type="geojson" data={routeGeo}>
          <Layer id="route-line" type="line" paint={{ 'line-color': '#3498db', 'line-width': 4 }} />
        </Source>
      )}

      {alternativeRoutes.map((alt, idx) => (
        <Source key={idx} id={`alt-route-${idx}`} type="geojson" data={alt.geo}>
          <Layer
            id={`alt-route-border-${idx}`}
            type="line"
            paint={{ 'line-color': '#3498db', 'line-width': 6 }}
            layout={{ 'line-cap': 'round', 'line-join': 'round' }}
          />
          <Layer
            id={`alt-route-line-${idx}`}
            type="line"
            paint={{
              'line-color': '#bbdefb',
              'line-width': 4,
              'line-dasharray': [4, 3]
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
// src/components/map/RouteMap.jsx
import React, { useEffect, useRef, useState } from 'react';
import Map, { Marker, Source, Layer } from 'react-map-gl';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import osmStyle from '../../services/osmStyle';
import GeoJsonOverlay from './GeoJsonOverlay';
import advancedDeadReckoningService from '../../services/AdvancedDeadReckoningService';
import ArrowMarker from './ArrowMarker';

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
  onSelectAlternativeRoute,
  showAlternativeRoutes = false
}, ref) => {
  const mapRef = useRef(null);
  const center = userLocation && userLocation.length === 2
    ? userLocation
    : [36.297, 59.606]; // Default to Imam Reza Shrine coordinates

  const [drPosition, setDrPosition] = useState(null);
  const [drGeoPath, setDrGeoPath] = useState([]);
  const [isDrActive, setIsDrActive] = useState(advancedDeadReckoningService.isActive);
  const [heading, setHeading] = useState(0);

  const altLayerIds = !isDrActive
    ? alternativeRoutes.flatMap((_, idx) => [
      `alt-route-line-${idx}`,
      `alt-route-border-${idx}`
    ])
    : [];

  useEffect(() => {
    const remove = advancedDeadReckoningService.addListener(data => {
      setIsDrActive(data.isActive);
      if (data.geoPosition) setDrPosition(data.geoPosition);
      if (data.geoPath) setDrGeoPath(data.geoPath);
      if (data.heading !== undefined && data.heading !== null) {
        setHeading(data.heading);
      }
    });
    return remove;
  }, []);

  // Handle map resize when modal opens/closes
  useEffect(() => {
    if (mapRef.current) {
      const timeout = setTimeout(() => {
        mapRef.current.resize();
        if (userLocation && userLocation.length === 2) {
          mapRef.current.flyTo({
            center: [userLocation[1], userLocation[0]],
            zoom: is3DView ? 17 : 18,
            pitch: is3DView ? 60 : 0
          });
        }
      }, 400);

      return () => clearTimeout(timeout);
    }
  }, [isMapModalOpen, userLocation, is3DView]);

  // Toggle 3D view effect
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setPitch(is3DView ? 60 : 0);
      mapRef.current.easeTo({ zoom: is3DView ? 17 : 18 });
    }
  }, [is3DView]);

  // Restore pitch when the WebGL context resets
  const savedPitchRef = useRef(0);
  useEffect(() => {
    if (mapRef.current) {
      savedPitchRef.current = mapRef.current.getPitch();
    }
  }, [is3DView]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const canvas = map.getCanvas();

    const handleContextLost = e => {
      e.preventDefault();
      savedPitchRef.current = map.getPitch();
    };
    const handleContextRestored = () => {
      map.setPitch(savedPitchRef.current);
    };

    canvas.addEventListener('webglcontextlost', handleContextLost, false);
    canvas.addEventListener('webglcontextrestored', handleContextRestored, false);
    return () => {
      canvas.removeEventListener('webglcontextlost', handleContextLost, false);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored, false);
    };
  }, []);

  // Rotate map based on user heading with smoothing to avoid sudden jumps
  const lastHeading = useRef(null);
  useEffect(() => {
    if (!mapRef.current) return;

    if (lastHeading.current === null) {
      lastHeading.current = heading;
      mapRef.current.setBearing(heading);
      return;
    }

    let diff = heading - lastHeading.current;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;

    lastHeading.current = (lastHeading.current + diff * 0.2 + 360) % 360;
    mapRef.current.easeTo({ bearing: lastHeading.current, duration: 200 });
  }, [heading]);

  // Keep map centered on the user's location
  useEffect(() => {
    if (!mapRef.current) return;
    if (isDrActive && drPosition) {
      mapRef.current.setCenter([drPosition.lng, drPosition.lat]);
    } else if (!isDrActive && userLocation && userLocation.length === 2) {
      mapRef.current.setCenter([userLocation[1], userLocation[0]]);
    }
  }, [drPosition, userLocation, isDrActive]);

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
      const dist = Math.hypot(end[0] - start[0], end[1] - start[1]) * 100000;
      const options = { padding: 80, duration: 700 };
      if (dist < 50) options.maxZoom = 17;
      mapRef.current.fitBounds(bounds, options);
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
        mapRef.current.fitBounds(bounds, { padding: 80, duration: 700, maxZoom: 16 });
      }
    }
  };

  useImperativeHandle(ref, () => ({
    fitRouteBounds,
    getMap: () => mapRef.current
  }));

  const WalkingManMarker = () => (
    <div style={{
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="30"
        height="30"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path d="M13 4m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
        <path d="M7 21l3 -4" />
        <path d="M16 21l-2 -4l-3 -3l1 -6" />
        <path d="M6 12l2 -3l4 -1l3 3l3 1" />
      </svg>
    </div>
  );

  const DestinationPin = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="34"
      height="34"
      viewBox="0 0 24 24"
      fill="#ff0000"
      stroke="white"
      strokeWidth="1"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M18.364 4.636a9 9 0 0 1 .203 12.519l-.203 .21l-4.243 4.242a3 3 0 0 1 -4.097 .135l-.144 -.135l-4.244 -4.243a9 9 0 0 1 12.728 -12.728zm-6.364 3.364a3 3 0 1 0 0 6a3 3 0 0 0 0 -6z" />
    </svg>
  );

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
        zoom: is3DView ? 17 : 18,
        pitch: 0
      }}
      attributionControl={false}
      terrain={is3DView ? { source: 'terrain', exaggeration: 1.5 } : undefined}
    >
      {/* User location marker - now using ArrowMarker with walking man icon */}
      {!isDrActive && (
        <Marker longitude={userLocation[1]} latitude={userLocation[0]} anchor="center">
          <ArrowMarker />
        </Marker>
      )}

      {isDrActive && drPosition && (
        <Marker longitude={drPosition.lng} latitude={drPosition.lat} anchor="center">
          <ArrowMarker />
        </Marker>
      )}

      {isDrActive && drGeoPath.length > 1 && (
        <Source
          id="dr-path"
          type="geojson"
          data={{
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: drGeoPath.map(p => [p.lng, p.lat])
            }
          }}
        >
          <Layer id="dr-line" type="line" paint={{ 'line-color': '#e53935', 'line-width': 3, 'line-opacity': 0.7 }} />
        </Source>
      )}

      {/* Current step marker -  using red destination pin */}
      {routeSteps && routeSteps.length > 0 && (
        <Marker
          longitude={routeSteps[routeSteps.length - 1].coordinates[1]}
          latitude={routeSteps[routeSteps.length - 1].coordinates[0]}
          anchor="bottom"
        >
          <DestinationPin />
        </Marker>
      )}

      {routeGeo && (
        <Source id="route" type="geojson" data={routeGeo}>
          <Layer
            id="route-line"
            type="line"
            paint={{
              'line-color': 'white',
              'line-width': 8
            }}
            layout={{ 'line-cap': 'round', 'line-join': 'round' }}
          />
          <Layer
            id="route-border"
            type="line"
            paint={{
              'line-color': '#0F71EF',
              'line-width': 8,
              'line-dasharray': [0, 2]
            }}
            layout={{ 'line-cap': 'round', 'line-join': 'round' }}
          />
        </Source>
      )}

      {!isDrActive && showAlternativeRoutes &&
        alternativeRoutes.map((alt, idx) => (
          <Source key={idx} id={`alt-route-${idx}`} type="geojson" data={alt.geo}>
            <Layer
              id={`alt-route-border-${idx}`}
              type="line"
              paint={{
                'line-color': '#d5dada',
                'line-width': 8
              }}
              layout={{ 'line-cap': 'round', 'line-join': 'round' }}
            />
            <Layer
              id={`alt-route-line-${idx}`}
              type="line"
              paint={{
                'line-color': 'grey',
                'line-width': 8,
                'line-dasharray': [0, 2]
              }}
              layout={{ 'line-cap': 'round', 'line-join': 'round' }}
            />
          </Source>
        ))}

      <GeoJsonOverlay routeCoords={routeGeo?.geometry?.coordinates} />
    </Map>
  );
});
export default RouteMap;
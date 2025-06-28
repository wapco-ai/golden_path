// src/components/map/RouteMap.jsx
import React, { useEffect, useRef } from 'react';
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
  const center = userLocation && userLocation.length === 2 
        ? userLocation 
        : [36.297, 59.606]; // Default to Imam Reza Shrine coordinates

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

      </Map>
    </div>
  );
};

export default RouteMap;

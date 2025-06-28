// src/components/map/RouteMap.jsx
import React from 'react';
import Map, { Marker, Source, Layer } from 'react-map-gl';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';


const RouteMap = ({ origin, destination, routeOptions }) => {
  const center = origin?.coordinates || [36.297, 59.606];
  const route = origin?.coordinates && destination?.coordinates
    ? [
        [origin.coordinates[1], origin.coordinates[0]],
        [destination.coordinates[1], destination.coordinates[0]]
      ]
    : null;

  return (
    <div id="route-map" className="route-map-container">
      <Map
        mapLib={maplibregl}

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
};

export default RouteMap;

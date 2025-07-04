import React, { useEffect, useState, useCallback } from 'react';
import Map, { Marker, Source, Layer } from 'react-map-gl';
import { useIntl } from 'react-intl';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import osmStyle from '../../services/osmStyle';
import { useLangStore } from '../../store/langStore';
import { buildGeoJsonPath } from '../../utils/geojsonPath.js';

// Colors for different location groups
const groupColors = {
  sahn: '#4caf50',
  eyvan: '#2196f3',
  ravaq: '#9c27b0',
  masjed: '#ff9800',
  madrese: '#3f51b5',
  khadamat: '#607d8b',
  elmi: '#00bcd4',
  cemetery: '#795548',
  other: '#757575'
};

// Icons for different node functions
const functionIcons = {
  door: '🚪',
  connection: '🔗',
  elevator: '🛗',
  escalator: '↕️',
  ramp: '♿',
  stairs: '🪜',
  service: '🚾',
  poi: '⭐',
  qrcode: '🔳',
  other: '📍'
};

// Create a composite icon element based on group and nodeFunction
// Additional size and opacity params allow styling when filters are active
const getCompositeIcon = (group, nodeFunction, size = 35, opacity = 1) => {
  const color = groupColors[group] || '#999';
  const icon = functionIcons[nodeFunction] || '📌';

  return (
    <div
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        opacity,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
      }}
    >
      {icon}
    </div>
  );
};

const MapComponent = ({ setUserLocation, selectedDestination, isSwapped, onMapClick, isSelectingLocation, selectedCategory }) => {
  const intl = useIntl();
  const [viewState, setViewState] = useState({
    latitude: 36.2880,
    longitude: 59.6157,
    zoom: 16
  });
  const [userCoords, setUserCoords] = useState(null);
  const [destCoords, setDestCoords] = useState(null);
  const [selectedCoords, setSelectedCoords] = useState(null);
  const [geoData, setGeoData] = useState(null);
  const [routeCoords, setRouteCoords] = useState(null);
  const language = useLangStore((state) => state.language);

  // Add this handler for view state changes
  const onMove = useCallback((evt) => {
    setViewState(evt.viewState);
  }, []);

  // Update destination marker when selection changes
  useEffect(() => {
    if (selectedDestination && selectedDestination.coordinates) {
      const [lat, lng] = selectedDestination.coordinates;
      setDestCoords({ lat, lng });
    } else {
      setDestCoords(null);
    }
  }, [selectedDestination]);

  useEffect(() => {
    const storedLat = sessionStorage.getItem('qrLat');
    const storedLng = sessionStorage.getItem('qrLng');
    if (storedLat && storedLng) {
      const c = { lat: parseFloat(storedLat), lng: parseFloat(storedLng) };
      setUserCoords(c);
      setUserLocation({
        name: intl.formatMessage({ id: 'mapCurrentLocationName' }),
        coordinates: [c.lat, c.lng]
      });
      setViewState((v) => ({ ...v, latitude: c.lat, longitude: c.lng }));
      return;
    }
    const success = (pos) => {
      const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setUserCoords(c);
      setUserLocation({
        name: intl.formatMessage({ id: 'mapCurrentLocationName' }),
        coordinates: [c.lat, c.lng]
      });
      setViewState((v) => ({ ...v, latitude: c.lat, longitude: c.lng }));
    };
    const err = (e) => {
      console.error('Error getting location', e);
      const fallback = { lat: 36.2880, lng: 59.6157 };
      setUserCoords(fallback);
      setUserLocation({
        name: intl.formatMessage({ id: 'defaultBabRezaName' }),
        coordinates: [fallback.lat, fallback.lng]
      });
    };
    navigator.geolocation.getCurrentPosition(success, err, {
      enableHighAccuracy: false,
      timeout: 10000,
      maximumAge: 60000
    });
    const watchId = navigator.geolocation.watchPosition(success, err, {
      enableHighAccuracy: false,
      maximumAge: 0,
      timeout: 10000
    });
    return () => navigator.geolocation.clearWatch(watchId);
  }, [setUserLocation, intl]);

  useEffect(() => {
    if (isSwapped && userCoords && destCoords) {
      const u = userCoords;
      setUserCoords(destCoords);
      setDestCoords(u);
    }
  }, [isSwapped]);

  useEffect(() => {
    const file = buildGeoJsonPath(language);

    fetch(file)
      .then((res) => res.json())
      .then(setGeoData)
      .catch((err) => console.error('failed to load geojson', err));
  }, [language]);

  const handleClick = (e) => {
    if (isSelectingLocation) {
      const { lng, lat } = e.lngLat;
      const c = { lat, lng };
      setSelectedCoords(c);
      if (onMapClick) onMapClick(c);
    }
  };

  useEffect(() => {
    if (userCoords && destCoords && geoData) {
      const points = geoData.features.filter(
        (f) =>
          f.geometry.type === 'Point' &&
          ['door', 'connection'].includes(f.properties?.nodeFunction)
      );
      const nearest = (coords) => {
        let best = null;
        let dmin = Infinity;
        points.forEach((p) => {
          const [lng, lat] = p.geometry.coordinates;
          const d = Math.hypot(lng - coords.lng, lat - coords.lat);
          if (d < dmin) {
            dmin = d;
            best = { lng, lat };
          }
        });
        return best;
      };
      const start = nearest(userCoords);
      const end = nearest(destCoords);
      const coords = [
        [userCoords.lng, userCoords.lat],
        ...(start ? [[start.lng, start.lat]] : []),
        ...(end ? [[end.lng, end.lat]] : []),
        [destCoords.lng, destCoords.lat]
      ];
      setRouteCoords(coords);
    } else {
      setRouteCoords(null);
    }
  }, [userCoords, destCoords, geoData]);

  const pointFeatures = geoData
    ? geoData.features.filter(f => f.geometry.type === 'Point')
    : [];
  const polygonFeatures = geoData
    ? geoData.features.filter(
        f => f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon'
      )
    : [];

  return (
    <Map
      mapLib={maplibregl}
      mapStyle={osmStyle}
      style={{ width: '100%', height: '100%' }}
      {...viewState}
      onMove={onMove}
      onClick={handleClick}
      interactive={true} // Ensure this is true
    >
      {userCoords && (
        <Marker longitude={userCoords.lng} latitude={userCoords.lat} anchor="center">
          <div style={{ width: 20, height: 20, backgroundColor: 'white', borderRadius: '50%', border: '6px solid #4285F4' }} />
        </Marker>
      )}
      {destCoords && (
        <Marker longitude={destCoords.lng} latitude={destCoords.lat} anchor="bottom">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#F44336">
            <path d="M18.364 4.636a9 9 0 0 1 .203 12.519l-.203 .21l-4.243 4.242a3 3 0 0 1 -4.097 .135l-.144 -.135l-4.244 -4.243a9 9 0 0 1 12.728 -12.728zm-6.364 3.364a3 3 0 1 0 0 6a3 3 0 1 0 0 -6z" />
          </svg>
        </Marker>
      )}
      {selectedCoords && isSelectingLocation && (
        <Marker longitude={selectedCoords.lng} latitude={selectedCoords.lat} anchor="center">
          <div style={{ width: 24, height: 24, backgroundColor: '#1E90FF', borderRadius: '50%', border: '3px solid white' }} />
        </Marker>
      )}
      {routeCoords && (
        <Source id="route" type="geojson" data={{ type: 'Feature', geometry: { type: 'LineString', coordinates: routeCoords } }}>
          <Layer id="route-line" type="line" paint={{ 'line-color': '#4285F4', 'line-width': 4, 'line-opacity': 0.7 }} />
        </Source>
      )}
      {polygonFeatures.length > 0 && (
        <Source id="polygons" type="geojson" data={{ type: 'FeatureCollection', features: polygonFeatures }}>
          <Layer id="polygon-lines" type="line" paint={{ 'line-color': '#333', 'line-width': 2 }} />
        </Source>
      )}
      {pointFeatures.map((feature, idx) => {
        const [lng, lat] = feature.geometry.coordinates;
        const { group, nodeFunction } = feature.properties || {};
        const highlight =
          selectedCategory &&
          feature.properties &&
          feature.properties[selectedCategory.property] === selectedCategory.value;
        const hasFilter = !!selectedCategory;
        const iconSize = hasFilter ? (highlight ? 40 : 25) : 35;
        const iconOpacity = hasFilter ? (highlight ? 1 : 0.4) : 1;
        const key = feature.properties?.uniqueId || idx;
        return (
          <Marker key={key} longitude={lng} latitude={lat} anchor="center">
            <div style={{ position: 'relative' }}>
              {getCompositeIcon(group, nodeFunction, iconSize, iconOpacity)}
              {highlight && (
                <div
                  style={{
                    position: 'absolute',
                    top: -4,
                    left: -4,
                    right: -4,
                    bottom: -4,
                    border: '2px solid #e53935',
                    borderRadius: '50%'
                  }}
                />
              )}
            </div>
          </Marker>
        );
      })}
    </Map>
  );
};

export default MapComponent;

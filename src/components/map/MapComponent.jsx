import React, { useEffect, useState, useCallback } from 'react';
import Map, { Marker, Source, Layer } from 'react-map-gl';
import { useIntl } from 'react-intl';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import osmStyle from '../../services/osmStyle';
import { useLangStore } from '../../store/langStore';
import { buildGeoJsonPath } from '../../utils/geojsonPath.js';

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

const MapComponent = ({ 
  setUserLocation, 
  selectedDestination, 
  onMapClick, 
  isSelectingLocation, 
  selectedCategory,
  userLocation
}) => {
  const intl = useIntl();
  const [viewState, setViewState] = useState({
    latitude: 36.297,
    longitude: 59.6069,
    zoom: 16
  });
  const [userCoords, setUserCoords] = useState(null);
  const [destCoords, setDestCoords] = useState(null);
  const [selectedCoords, setSelectedCoords] = useState(null);
  const [geoData, setGeoData] = useState(null);
  const [routeCoords, setRouteCoords] = useState(null);
  const language = useLangStore((state) => state.language);

  const onMove = useCallback((evt) => {
    setViewState(evt.viewState);
  }, []);

  useEffect(() => {
    const storedLat = sessionStorage.getItem('qrLat');
    const storedLng = sessionStorage.getItem('qrLng');
    
    if (storedLat && storedLng) {
      const coords = { 
        lat: parseFloat(storedLat), 
        lng: parseFloat(storedLng) 
      };
      setUserCoords(coords);
      setViewState(v => ({ ...v, latitude: coords.lat, longitude: coords.lng, zoom: 18 }));
    } else {
      setUserCoords({ lat: 36.297, lng: 59.6069 });
    }
  }, []);

  useEffect(() => {
    if (userLocation?.coordinates) {
      const [lat, lng] = userLocation.coordinates;
      setUserCoords({ lat, lng });
    }
  }, [userLocation]);

  useEffect(() => {
    if (selectedDestination?.coordinates) {
      const [lat, lng] = selectedDestination.coordinates;
      setDestCoords({ lat, lng });
    } else {
      setDestCoords(null);
    }
  }, [selectedDestination]);

  const handleClick = (e) => {
    if (isSelectingLocation) {
      const { lng, lat } = e.lngLat;
      const c = { lat, lng };
      setSelectedCoords(c);

      let closestFeature = null;
      if (geoData) {
        let minDist = Infinity;
        geoData.features.forEach((f) => {
          if (f.geometry.type === 'Point') {
            const [flng, flat] = f.geometry.coordinates;
            const d = Math.hypot(flng - lng, flat - lat);
            if (d < minDist) {
              minDist = d;
              closestFeature = f;
            }
          }
        });
        if (minDist > 0.0005) {
          closestFeature = null;
        }
      }

      if (onMapClick) onMapClick(c, closestFeature);
    }
  };

  useEffect(() => {
    const file = buildGeoJsonPath(language);
    fetch(file)
      .then((res) => res.json())
      .then(setGeoData)
      .catch((err) => console.error('failed to load geojson', err));
  }, [language]);

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
      interactive={true}
    >
      {userCoords && (
        <Marker longitude={userCoords.lng} latitude={userCoords.lat} anchor="center">
          <div className="map-marker-origin">
            <div className="map-marker-origin-inner" />
          </div>
        </Marker>
      )}

      {destCoords && (
        <Marker longitude={destCoords.lng} latitude={destCoords.lat} anchor="center">
          <div className="map-marker-destination">
            <div className="map-marker-destination-inner" />
          </div>
        </Marker>
      )}

      {selectedCoords && isSelectingLocation && (
        <Marker longitude={selectedCoords.lng} latitude={selectedCoords.lat} anchor="center">
          <div className="map-marker-selecting">
            <div className="map-marker-selecting-inner" />
          </div>
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
        const rawId = feature.properties?.uniqueId;
        const key = rawId ? `${rawId}-${idx}` : idx;
        
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

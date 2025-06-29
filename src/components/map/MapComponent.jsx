import React, { useEffect, useState, useCallback } from 'react';
import Map, { Marker, Source, Layer } from 'react-map-gl';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import osmStyle from '../../services/osmStyle';

const MapComponent = ({ setUserLocation, selectedDestination, isSwapped, onMapClick, isSelectingLocation }) => {
  const [viewState, setViewState] = useState({
    latitude: 36.2880,
    longitude: 59.6157,
    zoom: 16
  });
  const [userCoords, setUserCoords] = useState(null);
  const [destCoords, setDestCoords] = useState(null);
  const [selectedCoords, setSelectedCoords] = useState(null);

  // Add this handler for view state changes
  const onMove = useCallback((evt) => {
    setViewState(evt.viewState);
  }, []);

  const updateDestination = (coords) => {
    if (!selectedDestination) return;
    const d = coords
      ? { lat: coords.lat + 0.001, lng: coords.lng + 0.001 }
      : { lat: 36.2880, lng: 59.6157 };
    setDestCoords(d);
  };

  useEffect(() => {
    const success = (pos) => {
      const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setUserCoords(c);
      setUserLocation('موقعیت فعلی شما');
      setViewState(v => ({ ...v, latitude: c.lat, longitude: c.lng }));
      updateDestination(c);
    };
    const err = (e) => {
      console.error('Error getting location', e);
      const fallback = { lat: 36.2880, lng: 59.6157 };
      setUserCoords(fallback);
      setUserLocation('باب الرضا «ع»');
      updateDestination(fallback);
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
  }, [setUserLocation, selectedDestination]);

  useEffect(() => {
    if (isSwapped && userCoords && destCoords) {
      const u = userCoords;
      setUserCoords(destCoords);
      setDestCoords(u);
    }
  }, [isSwapped]);

  const handleClick = (e) => {
    if (isSelectingLocation) {
      const { lng, lat } = e.lngLat;
      const c = { lat, lng };
      setSelectedCoords(c);
      if (onMapClick) onMapClick(c);
    }
  };

  const routeCoords = userCoords && destCoords
    ? [
        [userCoords.lng, userCoords.lat],
        [destCoords.lng, destCoords.lat]
      ]
    : null;

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
    </Map>
  );
};

export default MapComponent;
// src/pages/FinalSearch.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FormattedMessage, useIntl } from 'react-intl';
import Map, { Marker, Source, Layer, Popup } from 'react-map-gl';
import GeoJsonOverlay from '../components/map/GeoJsonOverlay';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import osmStyle from '../services/osmStyle';
import '../styles/FinalSearch.css';
import ModeSelector from '../components/common/ModeSelector';
import { useRouteStore } from '../store/routeStore';
import { useLangStore } from '../store/langStore';
import { buildGeoJsonPath } from '../utils/geojsonPath.js';
import { analyzeRoute } from '../utils/routeAnalysis';
import { toast } from 'react-toastify';

const FinalSearch = () => {
  const [isSwapping, setIsSwapping] = useState(false);
  const [isSwapButton, setSwapButton] = useState(true);
  const mapRef = useRef(null);
  const navigate = useNavigate();
  const intl = useIntl();
  const {
    origin: storedOrigin,
    destination: storedDestination,
    routeGeo: storedRouteGeo,
    routeSteps: storedRouteSteps,
    alternativeRoutes: storedAlternativeRoutes,
    gender: storedGender,
    setOrigin: storeSetOrigin,
    setDestination: storeSetDestination,
    setRouteGeo: storeSetRouteGeo,
    setRouteSteps: storeSetRouteSteps,
    setAlternativeRoutes: storeSetAlternativeRoutes,
    setGender: storeSetGender
  } = useRouteStore();
  const language = useLangStore((state) => state.language);
  const qrLat = sessionStorage.getItem('qrLat');
  const qrLng = sessionStorage.getItem('qrLng');
  const [origin, setOrigin] = useState(
    storedOrigin ||
      (qrLat && qrLng
        ? {
            name: intl.formatMessage({ id: 'mapCurrentLocationName' }),
            coordinates: [parseFloat(qrLat), parseFloat(qrLng)]
          }
        : {
            name: intl.formatMessage({ id: 'defaultBabRezaName' }),
            coordinates: [36.2970, 59.6069]
          })
  );
  const [destination, setDestination] = useState(
    storedDestination || {
      name: intl.formatMessage({ id: 'destSahnEnqelabName' }),
      coordinates: [36.2975, 59.6072]
    }
  );
  const routeGeo = storedRouteGeo;
  useEffect(() => {
    storeSetOrigin(origin);
  }, [origin, storeSetOrigin]);
  useEffect(() => {
    storeSetDestination(destination);
  }, [destination, storeSetDestination]);
  const { transportMode } = useRouteStore();
  const [selectedGender, setSelectedGender] = useState(storedGender || 'male');
  const [routeInfo, setRouteInfo] = useState({ time: '9', distance: '75' });
  const [popupCoord, setPopupCoord] = useState(null);
  const [popupMinutes, setPopupMinutes] = useState(null);
  const [altPopupCoords, setAltPopupCoords] = useState([]);
  const [altPopupMinutes, setAltPopupMinutes] = useState([]);

  const [menuOpen, setMenuOpen] = useState(false);
  const [geoData, setGeoData] = useState(null);

  useEffect(() => {
    storeSetGender(selectedGender);
  }, [selectedGender, storeSetGender]);

  React.useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
  }, []);

  React.useEffect(() => {
    if (transportMode === 'walking') {
      setRouteInfo({ time: '9', distance: '75' });
    } else if (transportMode === 'electric-car') {
      setRouteInfo({ time: '5', distance: '120' });
    } else if (transportMode === 'wheelchair') {
      setRouteInfo({ time: '12', distance: '65' });
    }
  }, [transportMode]);

  // Fallback to current GPS coordinates if origin coords not provided and no QR data
  useEffect(() => {
    if (!origin.coordinates && !(qrLat && qrLng)) {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          setOrigin((o) => ({
            ...o,
            coordinates: [pos.coords.latitude, pos.coords.longitude]
          })),
        (err) => console.error('gps error', err)
      )
    }
  }, [origin.coordinates, qrLat, qrLng])

  useEffect(() => {
    const file = buildGeoJsonPath(language);

    fetch(file)
      .then(res => res.json())
      .then(setGeoData)
      .catch(err => console.error('failed to load geojson', err));
  }, [language]);

  useEffect(() => {
    if (!destination.coordinates) {
      // fallback to a default location if none provided
      setDestination((d) => ({
        ...d,
        coordinates: [36.2975, 59.6072]
      }));
    }
  }, [destination.coordinates]);

  useEffect(() => {
    if (!geoData) return;
    const result = analyzeRoute(origin, destination, geoData, transportMode, selectedGender);
    if (!result) {
      toast.error(intl.formatMessage({ id: 'noRouteFound' }));
      storeSetRouteGeo(null);
      storeSetRouteSteps([]);
      storeSetAlternativeRoutes([]);
      sessionStorage.removeItem('routeGeo');
      sessionStorage.removeItem('routeSteps');
      sessionStorage.removeItem('alternativeRoutes');
      return;
    }
    const { geo, steps, alternatives } = result;
    console.log('analyzeRoute result:', {
      geo,
      steps,
      alternatives
    });
    storeSetRouteGeo(geo);
    storeSetRouteSteps(steps);
    storeSetAlternativeRoutes(alternatives);
    sessionStorage.setItem('routeGeo', JSON.stringify(geo));
    sessionStorage.setItem('routeSteps', JSON.stringify(steps));
    sessionStorage.setItem('alternativeRoutes', JSON.stringify(alternatives));
    sessionStorage.setItem('origin', JSON.stringify(origin));
    sessionStorage.setItem('destination', JSON.stringify(destination));
  }, [geoData, origin, destination, transportMode, selectedGender, storeSetRouteGeo, storeSetRouteSteps, storeSetAlternativeRoutes, intl]);

  const alternativeSummaries = React.useMemo(() => {
    if (!storedAlternativeRoutes) return [];
    return storedAlternativeRoutes.map((alt, idx) => {
      const coords = alt.geo?.geometry?.coordinates || [];
      const dist = coords.slice(1).reduce((acc, c, i) => {
        const prev = coords[i];
        return acc + Math.hypot(c[0] - prev[0], c[1] - prev[1]) * 100000;
      }, 0);
      return {
        id: idx + 1,
        from: alt.from,
        to: alt.to,
        via: alt.via,
        totalTime: `${Math.max(1, Math.round(dist / 60))} ${intl.formatMessage({ id: 'minutesUnit' })}`,
        totalDistance: `${Math.round(dist)} ${intl.formatMessage({ id: 'meters' })}`
      };
    });
  }, [storedAlternativeRoutes, intl]);

  const altLayerIds = React.useMemo(
    () =>
      (storedAlternativeRoutes || []).map((_, idx) => `alt-route-line-${idx}`),
    [storedAlternativeRoutes]
  );

  // Zoom map to route bounds when a new route is loaded
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

  // Determine popup location and total minutes for main route
  useEffect(() => {
    if (!routeGeo) return;
    const coords = routeGeo.geometry?.coordinates || [];
    if (coords.length === 0) return;

    const dist = coords.slice(1).reduce((acc, c, i) => {
      const prev = coords[i];
      return acc + Math.hypot(c[0] - prev[0], c[1] - prev[1]) * 100000;
    }, 0);
    setPopupMinutes(Math.max(1, Math.round(dist / 60)));

    let chosen = null;
    for (let i = 0; i < coords.length; i++) {
      const [lng, lat] = coords[i];
      const conflict = (storedAlternativeRoutes || []).some((alt) =>
        alt.geo.geometry.coordinates.some(
          ([alng, alat]) =>
            Math.abs(alng - lng) < 1e-6 && Math.abs(alat - lat) < 1e-6
        )
      );
      if (!conflict) {
        chosen = [lat, lng];
        break;
      }
    }
    if (!chosen) {
      const mid = Math.floor(coords.length / 2);
      chosen = [coords[mid][1], coords[mid][0]];
    }
    setPopupCoord(chosen);
  }, [routeGeo, storedAlternativeRoutes]);

  // Determine popup locations and minutes for alternative routes
  useEffect(() => {
    if (!storedAlternativeRoutes) {
      setAltPopupCoords([]);
      setAltPopupMinutes([]);
      return;
    }

    const coordsArr = [];
    const minutesArr = [];

    storedAlternativeRoutes.forEach((alt) => {
      const coords = alt.geo?.geometry?.coordinates || [];
      if (coords.length === 0) {
        coordsArr.push(null);
        minutesArr.push(null);
        return;
      }

      const dist = coords.slice(1).reduce((acc, c, i) => {
        const prev = coords[i];
        return acc + Math.hypot(c[0] - prev[0], c[1] - prev[1]) * 100000;
      }, 0);
      minutesArr.push(Math.max(1, Math.round(dist / 60)));

      let chosen = null;
      for (let i = 0; i < coords.length; i++) {
        const [lng, lat] = coords[i];
        const conflict = routeGeo?.geometry?.coordinates?.some(
          ([mlng, mlat]) =>
            Math.abs(mlng - lng) < 1e-6 && Math.abs(mlat - lat) < 1e-6
        );
        if (!conflict) {
          chosen = [lat, lng];
          break;
        }
      }
      if (!chosen) {
        const mid = Math.floor(coords.length / 2);
        chosen = [coords[mid][1], coords[mid][0]];
      }
      coordsArr.push(chosen);
    });

    setAltPopupCoords(coordsArr);
    setAltPopupMinutes(minutesArr);
  }, [storedAlternativeRoutes, routeGeo]);

  const swapLocations = () => {
    setIsSwapping(true); // This will trigger the rotation
    setSwapButton(!isSwapButton);
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  const handleSelectAlternativeRoute = (route) => {
    if (!route?.geo || !route?.steps) {
      console.warn('Selected alternative route is missing geo or steps');
      return;
    }

    const currentRoute = {
      geo: storedRouteGeo,
      steps: storedRouteSteps
    };
    const newAlternatives = storedAlternativeRoutes.filter(alt => alt !== route);

    if (currentRoute.geo && currentRoute.steps) {
      newAlternatives.push(currentRoute);
    }

    storeSetRouteGeo(route.geo);
    storeSetRouteSteps(route.steps);
    storeSetAlternativeRoutes(newAlternatives);
  };

  const getTransportIcon = () => {
    switch (transportMode) {
      case 'walking':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#181717" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M13 4m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
            <path d="M7 21l3 -4" />
            <path d="M16 21l-2 -4l-3 -3l1 -6" />
            <path d="M6 12l2 -3l4 -1l3 3l3 1" />
          </svg>
        );
      case 'electric-car':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#181717">
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M14 5a1 1 0 0 1 .694 .28l.087 .095l3.699 4.625h.52a3 3 0 0 1 2.995 2.824l.005 .176v4a1 1 0 0 1 -1 1h-1.171a3.001 3.001 0 0 1 -5.658 0h-4.342a3.001 3.001 0 0 1 -5.658 0h-1.171a1 1 0 0 1 -1 -1v-6l.007 -.117l.008 -.056l.017 -.078l.012 -.036l.014 -.05l2.014 -5.034a1 1 0 0 1 .928 -.629zm-7 11a1 1 0 1 0 0 2a1 1 0 0 0 0 -2m10 0a1 1 0 1 0 0 2a1 1 0 0 0 0 -2m-6 -9h-5.324l-1.2 3h6.524zm2.52 0h-.52v3h2.92z" />
          </svg>
        );
      case 'wheelchair':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#181717" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M11 5m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
            <path d="M11 7l0 8l4 0l4 5" />
            <path d="M11 11l5 0" />
            <path d="M7 11.5a5 5 0 1 0 6 7.5" />
          </svg>
        );
      default:
        return null;
    }
  };

  const handleNavigate = () => {
    navigate('/rng');
  };

  const handleRouteOverview = () => {
    navigate('/rop');
  };

  const handleSaveDestination = () => {
    setMenuOpen(false);
  };

  const handleShareRoute = () => {
    setMenuOpen(false);
  };

  return (
    <div className="final-search-page" lang={language}>
      {/* Header Section */}
      <div className="header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M5 12l14 0" />
            <path d="M15 16l4 -4" />
            <path d="M15 8l4 4" />
          </svg>
        </button>

        <h1>
          <FormattedMessage id="finalSearchTitle" />
        </h1>

        <div className="menu-container">
          <button className={`menu-btn ${menuOpen ? 'active' : ''}`} onClick={() => setMenuOpen(!menuOpen)}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M5 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
              <path d="M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
              <path d="M19 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
            </svg>
          </button>

          <div className={`menu-dropdown ${menuOpen ? 'open' : ''}`}>
            <button className="menu-item" onClick={handleSaveDestination}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M17.286 21.09q -1.69 .001 -5.288 -2.615q -3.596 2.617 -5.288 2.616q -2.726 0 -.495 -6.8q -9.389 -6.775 2.135 -6.775h.076q 1.785 -5.516 3.574 -5.516q 1.785 0 3.574 5.516h.076q 11.525 0 2.133 6.774q 2.23 6.802 -.497 6.8" />
              </svg>
              <FormattedMessage id="saveDestination" />
            </button>
            <button className="menu-item" onClick={handleShareRoute}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M6 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" />
                <path d="M18 6m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" />
                <path d="M18 18m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" />
                <path d="M8.7 10.7l6.6 -3.4" />
                <path d="M8.7 13.3l6.6 3.4" />
              </svg>
              <FormattedMessage id="shareRoute" />
            </button>
          </div>
        </div>
      </div>

      {/* Map Section */}
      <div className="mpr">
        <Map
          ref={mapRef}
          mapLib={maplibregl}
          mapStyle={osmStyle}
          style={{ width: '100%', height: '100%' }}
          initialViewState={{
            longitude:
              ((origin.coordinates?.[1] ?? 0) + (destination.coordinates?.[1] ?? 0)) /
              2,
            latitude:
              ((origin.coordinates?.[0] ?? 0) + (destination.coordinates?.[0] ?? 0)) /
              2,
            zoom: 18
          }}
          attributionControl={false}
          interactiveLayerIds={altLayerIds}
          onClick={(e) => {
            const feature = e.features && e.features[0];
            if (
              feature &&
              feature.layer &&
              feature.layer.id.startsWith('alt-route-line-')
            ) {
              const idx = parseInt(feature.layer.id.replace('alt-route-line-', ''));
              if (
                !Number.isNaN(idx) &&
                storedAlternativeRoutes[idx]
              ) {
                handleSelectAlternativeRoute(storedAlternativeRoutes[idx]);
              }
            }
          }}
        >
          {origin.coordinates && (
            <Marker
              longitude={origin.coordinates[1]}
              latitude={origin.coordinates[0]}
              anchor="bottom"
            >
              <div className="marker-circle"></div>
            </Marker>
          )}
          {destination.coordinates && (
            <Marker
              longitude={destination.coordinates[1]}
              latitude={destination.coordinates[0]}
              anchor="bottom"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="#F44336">
                <path d="M18.364 4.636a9 9 0 0 1 .203 12.519l-.203 .21l-4.243 4.242a3 3 0 0 1 -4.097 .135l-.144 -.135l-4.244 -4.243a9 9 0 0 1 12.728 -12.728zm-6.364 3.364a3 3 0 1 0 0 6a3 3 0 1 0 0 -6z" />
              </svg>
            </Marker>
          )}

          
          {storedAlternativeRoutes &&
            storedAlternativeRoutes.map((alt, idx) => (
              <React.Fragment key={idx}>
                <Source id={`alt-route-${idx}`} type="geojson" data={alt.geo}>
                  <Layer
                    id={`alt-route-border-${idx}`}
                    type="line"
                    paint={{ 'line-color': '#0f71ef', 'line-width': 10 }}
                    layout={{ 'line-cap': 'round', 'line-join': 'round' }}
                  />
                  <Layer
                    id={`alt-route-line-${idx}`}
                    type="line"
                    paint={{
                      'line-color': '#D5E4F6',
                      'line-width': 8,
                    }}
                    layout={{ 'line-cap': 'round', 'line-join': 'round' }}
                  />
                </Source>
                {altPopupCoords[idx] && altPopupMinutes[idx] !== null && (
                  <Popup
                    className="alt-popup-container"
                    longitude={altPopupCoords[idx][1]}
                    latitude={altPopupCoords[idx][0]}
                    closeButton={false}
                    closeOnClick={false}
                    anchor="bottom"
                  >
                    <div className="time-popup alt-popup">
                      {altPopupMinutes[idx]} {intl.formatMessage({ id: 'minutesUnit' })}
                    </div>
                  </Popup>
                )}
              </React.Fragment>
            ))}
          {routeGeo && (
            <Source id="main-route" type="geojson" data={routeGeo}>
              <Layer id="main-line" type="line" paint={{ 'line-color': '#0f71ef', 'line-width': 10 }} />
            </Source>
          )}
          {popupCoord && popupMinutes !== null && (
            <Popup
              className="main-popup-container"
              longitude={popupCoord[1]}
              latitude={popupCoord[0]}
              closeButton={false}
              closeOnClick={false}
              anchor="bottom"
            >
              <div className="time-popup main-popup">
                {popupMinutes} {intl.formatMessage({ id: 'minutesUnit' })}
              </div>
            </Popup>
          )}
          <GeoJsonOverlay />
        </Map>
      </div>

      {/* Location Inputs Section */}
      <div className="location-section-container">
        <div className="location-icons-container">
          <div className="location-icon origin-icon">
            <div className="n-circle"></div>
          </div>
          <div className="tdots">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#e0e0e0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-dots-vertical"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /><path d="M12 19m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /><path d="M12 5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /></svg>
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#e0e0e0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-dots-vertical"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /><path d="M12 19m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /><path d="M12 5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /></svg>
          </div>
          <div className="location-icon destination-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#F44336">
              <path d="M18.364 4.636a9 9 0 0 1 .203 12.519l-.203 .21l-4.243 4.242a3 3 0 0 1 -4.097 .135l-.144 -.135l-4.244 -4.243a9 9 0 0 1 12.728 -12.728zm-6.364 3.364a3 3 0 1 0 0 6a3 3 0 1 0 0 -6z" />
            </svg>
          </div>
        </div>

        <div className="location-section">
          <div className="location-input origin-input">
            <div className="location-details">
              <div className="location-name">{origin.name}</div>
            </div>
            <div className={`current-location-label ${isSwapButton ? 'visible' : 'hidden'}`}>
              <FormattedMessage id="mapCurrentLocationName" />
            </div>
          </div>

          <div className="swap-container">
            <button className="swap-btn" onClick={swapLocations}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="23"
                height="23"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`swap-icon ${isSwapButton ? '' : 'rotated'}`}
              >
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M3 9l4 -4l4 4m-4 -4v14" />
                <path d="M21 15l-4 4l-4 -4m4 4v-14" />
              </svg>
            </button>
          </div>

          <div className="location-input destination-input">
            <div className="location-details">
              <div className="location-name">{destination.name}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Options Section */}
      <div className="options-section">
        <ModeSelector />

        <div className="options-divider"></div>

        <div className="options-row">
          <button
            className={`gender-btn ${selectedGender === 'male' ? 'active' : ''}`}
            onClick={() => setSelectedGender('male')}
          >
            <div className="gender-circle">
              {selectedGender === 'male' && <div className="gender-circle-fill"></div>}
            </div>
            <FormattedMessage id="routeForMen" />
          </button>

          <button
            className={`gender-btn ${selectedGender === 'female' ? 'active' : ''}`}
            onClick={() => setSelectedGender('female')}
          >
            <div className="gender-circle">
              {selectedGender === 'female' && <div className="gender-circle-fill"></div>}
            </div>
            <FormattedMessage id="routeForWomen" />
          </button>
        </div>
      </div>

      {/* Route Info */}
      <div className="route-info">
        <div className="route-summary">
          <FormattedMessage
            id="routeSummary"
            values={{ origin: origin.name, destination: destination.name }}
          />
        </div>
        <div className="info-details">
          <div className="info-time">
            {getTransportIcon()}
            <span>
              {routeInfo.time} <FormattedMessage id="minutesUnit" />
            </span>
          </div>
          <div className="info-distance">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#181717" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M3 19a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" />
              <path d="M19 7a2 2 0 1 0 0 -4a2 2 0 0 0 0 4z" />
              <path d="M11 19h5.5a3.5 3.5 0 0 0 0 -7h-8a3.5 3.5 0 0 1 0 -7h4.5" />
            </svg>
            <span>
              {routeInfo.distance} <FormattedMessage id="meters" />
            </span>
          </div>
        </div>
      </div>

      <div className="action-gap"></div>

      {/* Action Buttons */}
      <div className="action-buttons2">
        <button className="navigate-btn" onClick={handleNavigate}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#fff">
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M11.092 2.581a1 1 0 0 1 1.754 -.116l.062 .116l8.005 17.365c.198 .566 .05 1.196 -.378 1.615a1.53 1.53 0 0 1 -1.459 .393l-7.077 -2.398l-6.899 2.338a1.535 1.535 0 0 1 -1.52 -.231l-.112 -.1c-.398 -.386 -.556 -.954 -.393 -1.556l.047 -.15l7.97 -17.276z" />
          </svg>
          <FormattedMessage id="startRouting" />
        </button>
        <button className="overview-btn" onClick={handleRouteOverview}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2196F3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M3 19a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" />
            <path d="M19 7a2 2 0 1 0 0 -4a2 2 0 0 0 0 4z" />
            <path d="M11 19h5.5a3.5 3.5 0 0 0 0 -7h-8a3.5 3.5 0 0 1 0 -7h4.5" />
          </svg>
          <FormattedMessage id="routeOverview" />
        </button>
      </div>
    </div>
  );
};

export default FinalSearch;

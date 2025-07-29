import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIntl } from 'react-intl';
import Map, { Marker, Source, Layer, Popup } from 'react-map-gl';
import GeoJsonOverlay from '../components/map/GeoJsonOverlay';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import '../styles/RouteOverview.css';
import osmStyle from '../services/osmStyle';
import { useRouteStore } from '../store/routeStore';
import useLocaleDigits from '../utils/useLocaleDigits';

const RouteOverview = () => {
  const navigate = useNavigate();
  const intl = useIntl();
  const formatDigits = useLocaleDigits();

  const mapRef = useRef(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [directionArrow, setDirectionArrow] = useState('right');
  const [distance, setDistance] = useState('');
  const [time, setTime] = useState('');
  const [popupCoord, setPopupCoord] = useState(null);

  const toRad = deg => (deg * Math.PI) / 180;
  const toDeg = rad => (rad * 180) / Math.PI;
  const bearing = (from, to) => {
    const [lng1, lat1] = from;
    const [lng2, lat2] = to;
    const y = Math.sin(toRad(lng2 - lng1)) * Math.cos(toRad(lat2));
    const x =
      Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
      Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lng2 - lng1));
    return (toDeg(Math.atan2(y, x)) + 360) % 360;
  };

  const computeTurn = (b1, b2) => {
    // Compute turn relative to the user's current heading (b1)
    // Positive diff should mean a left turn and negative diff a right turn
    // so we reverse the subtraction order.
    const diff = ((b1 - b2 + 540) % 360) - 180; // [-180, 180]
    const ad = Math.abs(diff);
    if (ad < 30) return 'up';
    if (ad > 150) return 'down';
    if (ad < 100) return diff > 0 ? 'left' : 'right';
    return diff > 0 ? 'bend-left' : 'bend-right';
  };

  const { routeGeo, routeSteps } = useRouteStore();
  const routeCoordinates = routeGeo?.geometry?.coordinates || [];

  const routeData = useMemo(() => {
    const segments = routeCoordinates.slice(1).map((c, idx) => {
      const step = routeSteps?.[idx];
      const base = step && step.type
        ? intl.formatMessage(
            { id: step.type },
            { name: step.name, title: step.title, num: idx + 1 }
          )
        : step?.instruction
          ? step.instruction
          : intl.formatMessage({ id: 'stepNumber' }, { num: idx + 1 });
      const dist = Math.hypot(
        c[0] - routeCoordinates[idx][0],
        c[1] - routeCoordinates[idx][1]
      ) * 100000;
      const instruction = step?.landmark
        ? `${base}، ${intl.formatMessage({ id: 'landmarkSuffix' }, { name: step.landmark, distance: Math.round(dist) })}`
        : base;
      return {
        id: idx + 1,
        coordinates: [routeCoordinates[idx], c],
        instruction,
        services: step?.services || {},
        distance: dist
      };
    });

    const segmentBearing = coords => bearing(coords[0], coords[coords.length - 1]);
    const angleDiff = (a, b) => {
      const b1 = segmentBearing(a);
      const b2 = segmentBearing(b);
      let diff = Math.abs(b1 - b2);
      if (diff > 180) diff = 360 - diff;
      return diff;
    };

    const merged = [];
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      if (seg.distance >= 20) {
        merged.push({ ...seg });
        continue;
      }

      const prev = merged[merged.length - 1];
      const next = segments[i + 1];
      const diffPrev = prev ? angleDiff(prev.coordinates, seg.coordinates) : Infinity;
      const diffNext = next ? angleDiff(seg.coordinates, next.coordinates) : Infinity;

      if ((diffPrev <= diffNext && prev) || !next) {
        // merge with previous segment
        if (prev) {
          prev.coordinates.push(seg.coordinates[1]);
          prev.distance += seg.distance;
        } else {
          merged.push({ ...seg });
        }
      } else if (next) {
        // merge with next segment
        next.coordinates = [seg.coordinates[0], ...next.coordinates];
        next.distance += seg.distance;
      } else {
        merged.push({ ...seg });
      }
    }

    return merged.map((m, idx) => ({
      id: idx + 1,
      coordinates: m.coordinates,
      instruction: m.instruction,
      services: m.services,
      distance: m.distance
    }));
  }, [routeCoordinates, routeSteps, intl]);

  const [viewState, setViewState] = useState({
    latitude: routeCoordinates[0]?.[1] || 0,
    longitude: routeCoordinates[0]?.[0] || 0,
    zoom: 16
  });

  // Scroll to top on component mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const highlightGeo = useMemo(() => {
    const seg = routeData[currentSlide]?.coordinates;
    return seg ? { type: 'Feature', geometry: { type: 'LineString', coordinates: seg } } : null;
  }, [currentSlide, routeData]);

  useEffect(() => {
    if (routeData[currentSlide]) {
      const segObj = routeData[currentSlide];
      const coords = segObj.coordinates;
      const [lng1, lat1] = coords[0];
      const [lng2, lat2] = coords[coords.length - 1];
      const d = segObj.distance;
      setDistance(
        `${formatDigits(Math.round(d))} ${intl.formatMessage({ id: 'meters' })}`
      );
      setTime(
        `${formatDigits(Math.max(1, Math.round(d / 60)))} ${intl.formatMessage({ id: 'minutesUnit' })}`
      );

      if (currentSlide === routeData.length - 1) {
        setDirectionArrow('arrived');
      } else {
        const nextCoords = routeData[currentSlide + 1].coordinates;
        const b1 = bearing(coords[0], coords[coords.length - 1]);
        const b2 = bearing(nextCoords[0], nextCoords[nextCoords.length - 1]);
        setDirectionArrow(computeTurn(b1, b2));
      }

      const isShort = d < 50;
      setViewState({
        latitude: (lat1 + lat2) / 2,
        longitude: (lng1 + lng2) / 2,
        zoom: isShort ? 17 : 18
      });
      setPopupCoord([(lng1 + lng2) / 2, (lat1 + lat2) / 2]);
      if (mapRef.current) {
        const bounds = new maplibregl.LngLatBounds([lng1, lat1], [lng2, lat2]);
        const options = { padding: 50, duration: 700 };
        if (isShort) options.maxZoom = 17;
        mapRef.current.fitBounds(bounds, options);
      }
    }
  }, [currentSlide, routeData]);

  // Clear popup when no route data is available
  useEffect(() => {
    if (!routeCoordinates || routeCoordinates.length === 0) {
      setPopupCoord(null);
    }
  }, [routeCoordinates]);

  const allGeo = {
    type: 'Feature',
    geometry: { type: 'LineString', coordinates: routeCoordinates }
  };

  const nextSlide = () => {
    if (currentSlide < routeData.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };
  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const getDirectionIcon = () => {
    switch (directionArrow) {
      case 'right':
        return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-arrow-narrow-right"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M5 12l14 0" /><path d="M15 16l4 -4" /><path d="M15 8l4 4" /></svg>;
      case 'left':
        return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-arrow-narrow-left"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M5 12l14 0" /><path d="M5 12l4 4" /><path d="M5 12l4 -4" /></svg>;
      case 'up':
        return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-arrow-narrow-up"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M12 5l0 14" /><path d="M16 9l-4 -4" /><path d="M8 9l4 -4" /></svg>;
      case 'down':
        return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-arrow-narrow-down"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M12 5l0 14" /><path d="M16 15l-4 4" /><path d="M8 15l4 4" /></svg>;
      case 'bend-right':
        return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-arrow-merge-alt-left"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M8 7l4 -4l4 4" /><path d="M18 21v.01" /><path d="M18 18.01v.01" /><path d="M17 15.02v.01" /><path d="M14 13.03v.01" /><path d="M12 3v5.394a6.737 6.737 0 0 1 -3 5.606a6.737 6.737 0 0 0 -3 5.606v1.394" /></svg>;
      case 'bend-left':
        return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-arrow-merge-alt-right"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M16 7l-4 -4l-4 4" /><path d="M6 21v.01" /><path d="M6 18.01v.01" /><path d="M7 15.02v.01" /><path d="M10 13.03v.01" /><path d="M12 3v5.394a6.737 6.737 0 0 0 3 5.606a6.737 6.737 0 0 1 3 5.606v1.394" /></svg>;
      case 'arrived':
        return <svg xmlns="http://www.w3.org/2000/svg" width="35" height="35" viewBox="0 0 24 24" fill="#e74c3c" className="icon icon-tabler icons-tabler-filled icon-tabler-map-pin"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M18.364 4.636a9 9 0 0 1 .203 12.519l-.203 .21l-4.243 4.242a3 3 0 0 1 -4.097 .135l-.144 -.135l-4.244 -4.243a9 9 0 0 1 12.728 -12.728zm-6.364 3.364a3 3 0 1 0 0 6a3 3 0 0 0 0 -6z" /></svg>;
      default:
        return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-arrow-narrow-right"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M5 12l14 0" /><path d="M15 16l4 -4" /><path d="M15 8l4 4" /></svg>;
    }
  };

  const renderServiceIcons = (services = {}) => (
    <div className="step-services">
      {services.wheelchair && (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-wheelchair">
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M11 5m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
          <path d="M11 7l0 8l4 0l4 5" />
          <path d="M11 11l5 0" />
          <path d="M7 11.5a5 5 0 1 0 6 7.5" />
        </svg>
      )}
      {services.electricVan && (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-car">
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M14 5a1 1 0 0 1 .694 .28l.087 .095l3.699 4.625h.52a3 3 0 0 1 2.995 2.824l.005 .176v4a1 1 0 0 1 -1 1h-1.171a3.001 3.001 0 0 1 -5.658 0h-4.342a3.001 3.001 0 0 1 -5.658 0h-1.171a1 1 0 0 1 -1 -1v-6l.007 -.117l.008 -.056l.017 -.078l.012 -.036l.014 -.05l2.014 -5.034a1 1 0 0 1 .928 -.629zm-7 11a1 1 0 1 0 0 2a1 1 0 0 0 0 -2m10 0a1 1 0 1 0 0 2a1 1 0 0 0 0 -2m-6 -9h-5.324l-1.2 3h6.524zm2.52 0h-.52v3h2.92z" />
        </svg>
      )}
      {services.walking && (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-walk">
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M13 4m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
          <path d="M7 21l3 -4" />
          <path d="M16 21l-2 -4l-3 -3l1 -6" />
          <path d="M6 12l2 -3l4 -1l3 3l3 1" />
        </svg>
      )}
    </div>
  );

  return (
    <div className="route-overview-container fade-in">
      <div className="header-container">
        <header className="route-overview-header">
          <button className="route-back-button" onClick={() => navigate(-1)}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-x"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M18 6l-12 12" /><path d="M6 6l12 12" /></svg>
          </button>
          <h1 className="route-header-title">
            {intl.formatMessage({ id: 'routeOverview' })}
          </h1>
          <button className="map-profile-button" onClick={() => navigate('/Profile')}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="9.99984" cy="5" r="3.33333" fill="#1E2023" />
              <ellipse cx="9.99984" cy="14.1667" rx="5.83333" ry="3.33333" fill="#1E2023" />
            </svg>
          </button>
        </header>
        <div className="header-gradient"></div>
      </div>

      <div className="route-map-container">
        <Map
          ref={mapRef}
          mapLib={maplibregl}
          mapStyle={osmStyle}
          initialViewState={viewState}
          attributionControl={false}
          style={{ width: '100%', height: '100%' }}
        >
          <Marker longitude={routeCoordinates[0]?.[0]} latitude={routeCoordinates[0]?.[1]} anchor="bottom">
            <div className="c-circle"></div>
          </Marker>
          <Marker
            longitude={routeCoordinates[routeCoordinates.length - 1]?.[0]}
            latitude={routeCoordinates[routeCoordinates.length - 1]?.[1]}
            anchor="bottom"
          >
            <div className="des-marker">
              <svg xmlns="http://www.w3.org/2000/svg" width="35" height="35" viewBox="0 0 24 24" fill="#e74c3c" className="icon icon-tabler icons-tabler-filled icon-tabler-map-pin"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M18.364 4.636a9 9 0 0 1 .203 12.519l-.203 .21l-4.243 4.242a3 3 0 0 1 -4.097 .135l-.144 -.135l-4.244 -4.243a9 9 0 0 1 12.728 -12.728zm-6.364 3.364a3 3 0 1 0 0 6a3 3 0 0 0 0 -6z" /></svg>
            </div>
          </Marker>
          <Source id="route" type="geojson" data={allGeo}>
            <Layer id="route-line" type="line" paint={{ 'line-color': '#0f71ef', 'line-width': 10 }} />
          </Source>
          {highlightGeo && (
            <Source id="highlight" type="geojson" data={highlightGeo}>
              <Layer id="highlight-line" type="line" paint={{ 'line-color': '#e74c3c', 'line-width': 8 }} />
            </Source>
          )}
          {popupCoord && (
            <Popup
              className="main-popup-container"
              longitude={popupCoord[0]}
              latitude={popupCoord[1]}
              closeButton={false}
              closeOnClick={false}
              anchor="bottom"
            >
              <div className="time-popup main-popup">{time}</div>
            </Popup>
          )}
          <GeoJsonOverlay />
        </Map>
      </div>

      <button className="start-routing-btn" onClick={() => navigate('/rng')}>
        <svg xmlns="http://www.w3.org/2000/svg" width="23" height="23" viewBox="0 0 24 24" fill="currentColor">
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M11.092 2.581a1 1 0 0 1 1.754 -.116l.062 .116l8.005 17.365c.198 .566 .05 1.196 -.378 1.615a1.53 1.53 0 0 1 -1.459 .393l-7.077 -2.398l-6.899 2.338a1.535 1.535 0 0 1 -1.52 -.231l-.112 -.1c-.398 -.386 -.556 -.954 -.393 -1.556l.047 -.15l7.97 -17.276z" />
        </svg>
        {intl.formatMessage({ id: 'startRouting' })}
      </button>

      <div className="route-info-container">
        <div className="route-stats">
          <div className="route-distance">
            <span className="direction-icon">{getDirectionIcon()}</span>
            <span className="distance-value">{distance}</span>
          </div>
          <div className="route-time">
            <span className="time-value">{time}</span>
          </div>
        </div>

        <div className="route-instruction-container">
          <div className="route-instruction">
            <p className="instruction-text">
              {intl.formatMessage({ id: 'stepPrefix' }, { num: currentSlide + 1 })}
              {routeData[currentSlide]?.instruction}
            </p>
            {/* {renderServiceIcons(routeData[currentSlide]?.services)} */}
          </div>

          <div className="carousel-controls">
            <button
              className="carousel-prev"
              onClick={prevSlide}
              disabled={currentSlide === 0}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                <path d="M9 6l6 6l-6 6" stroke="currentColor" strokeWidth="2" fill="none" />
              </svg>
              {intl.formatMessage({ id: 'previous' })}
            </button>

            <div className={`carousel-dots4 ${routeData.length > 10 ? 'has-very-many-dots' :
              routeData.length > 5 ? 'has-many-dots' : ''
              }`}>
              {routeData.map((_, index) => (
                <span
                  key={index}
                  className={`dot4 ${index === currentSlide ? 'active' : ''}`}
                  onClick={() => setCurrentSlide(index)}
                ></span>
              ))}
            </div>

            <button
              className="carousel-next"
              onClick={nextSlide}
              disabled={currentSlide === routeData.length - 1}
            >
              {intl.formatMessage({ id: 'next' })}
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                <path d="M15 6l-6 6l6 6" stroke="currentColor" strokeWidth="2" fill="none" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RouteOverview;
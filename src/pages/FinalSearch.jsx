// src/pages/FinalSearch.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../styles/FinalSearch.css';

const FinalSearch = () => {
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const routeLayer = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);

  // Sample data with adjusted coordinates for proper display
  const [origin, setOrigin] = useState({
    name: 'باب الرضا (ع)',
    coordinates: [36.2970, 59.6069]
  });

  const [destination, setDestination] = useState({
    name: 'صحن انقلاب',
    coordinates: [36.2975, 59.6072]
  });

  const [selectedTransport, setSelectedTransport] = useState('walking');
  const [selectedGender, setSelectedGender] = useState('male');
  const [routeInfo, setRouteInfo] = useState({
    time: '9',
    distance: '75'
  });

  // Calculate route information based on transport type
  useEffect(() => {
    if (selectedTransport === 'walking') {
      setRouteInfo({ time: '9', distance: '75' });
    } else if (selectedTransport === 'electric-car') {
      setRouteInfo({ time: '5', distance: '120' });
    } else if (selectedTransport === 'wheelchair') {
      setRouteInfo({ time: '12', distance: '65' });
    }
  }, [selectedTransport]);

  // Initialize map
  useEffect(() => {
    if (mapRef.current && !mapInstance.current) {
      mapInstance.current = L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView([36.2972, 59.6070], 18);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapInstance.current);

      routeLayer.current = L.layerGroup().addTo(mapInstance.current);
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // Update route when locations change
  useEffect(() => {
    if (!mapInstance.current || !routeLayer.current) return;

    routeLayer.current.clearLayers();

    // Add markers with proper positioning
    if (origin.coordinates) {
      L.marker(origin.coordinates, {
        icon: L.divIcon({
          className: 'custom-marker origin-marker',
          html: '<div class="marker-circle"></div>',
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        })
      }).addTo(routeLayer.current);
    }

    if (destination.coordinates) {
      L.marker(destination.coordinates, {
        icon: L.divIcon({
          className: 'custom-marker destination-marker',
          html: '<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="#F44336"><path d="M18.364 4.636a9 9 0 0 1 .203 12.519l-.203 .21l-4.243 4.242a3 3 0 0 1 -4.097 .135l-.144 -.135l-4.244 -4.243a9 9 0 0 1 12.728 -12.728zm-6.364 3.364a3 3 0 1 0 0 6a3 3 0 1 0 0 -6z"/></svg>',
          iconSize: [36, 36],
          iconAnchor: [12, 24]
        })
      }).addTo(routeLayer.current);
    }

    // Draw route lines (main and alternative)
    if (origin.coordinates && destination.coordinates) {
      // Main route (warm blue)
      const mainRoutePoints = [
        origin.coordinates,
        [36.2971, 59.6070], // intermediate point 1
        [36.2973, 59.6071], // intermediate point 2
        destination.coordinates
      ];

      const mainRouteLine = L.polyline(mainRoutePoints, {
        color: '#2196F3',
        weight: 6,
        opacity: 1
      }).addTo(routeLayer.current);

      // Alternative route (light blue)
      const altRoutePoints = [
        origin.coordinates,
        [36.2970, 59.6070], // intermediate point 1
        [36.2972, 59.6073], // intermediate point 2
        destination.coordinates
      ];

      const altRouteLine = L.polyline(altRoutePoints, {
        color: '#64B5F6',
        weight: 4,
        dashArray: '5, 5',
        opacity: 0.8
      }).addTo(routeLayer.current);

      // Add time label at the middle of the main route
      const mainRouteCenter = mainRouteLine.getBounds().getCenter();
      const timeLabel = L.divIcon({
        className: 'time-label',
        html: `
        <div class="time-marker">
          <div class="time-bubble">${routeInfo.time} دقیقه</div>
        </div>
      `,
        className: 'time-marker-container',
        iconSize: [60, 30],
        iconAnchor: [30, 15]
      });

      L.marker(mainRouteCenter, {
        icon: timeLabel,
        zIndexOffset: 1000,
        interactive: false
      }).addTo(routeLayer.current);

      // Fit bounds to show both routes
      const bounds = L.latLngBounds([origin.coordinates, destination.coordinates])
        .extend(mainRoutePoints[1])
        .extend(mainRoutePoints[2])
        .extend(altRoutePoints[1])
        .extend(altRoutePoints[2]);

      mapInstance.current.fitBounds(bounds.pad(0.2));
    }
  }, [origin, destination, routeInfo.time]);

  const swapLocations = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  const handleNavigate = () => {
    navigate('/navigation', {
      state: {
        origin,
        destination,
        options: {
          transport: selectedTransport,
          gender: selectedGender
        }
      }
    });
  };

  const handleRouteOverview = () => {
    console.log('Route overview clicked');
  };

  const handleSaveDestination = () => {
    console.log('Save destination clicked');
    setMenuOpen(false);
  };

  const handleShareRoute = () => {
    console.log('Share route clicked');
    setMenuOpen(false);
  };

  const getTransportIcon = () => {
    switch (selectedTransport) {
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

  return (
    <div className="final-search-page">
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

        <h1>جزئيات نهايي مسير</h1>

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
              ذخیره مقصد
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
              اشتراک گذاری
            </button>
          </div>
        </div>
      </div>

      {/* Map Section */}
      <div className="mpr" ref={mapRef}></div>

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
            <div className="current-location-label">مکان فعلی شما</div>
          </div>

          <div className="swap-container">
            <button className="swap-btn" onClick={swapLocations}>
              <svg xmlns="http://www.w3.org/2000/svg" width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
        <div className="options-row">
          <button
            className={`transport-btn ${selectedTransport === 'walking' ? 'active' : ''}`}
            onClick={() => setSelectedTransport('walking')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={selectedTransport === 'walking' ? '#2196F3' : '#666'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M13 4m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
              <path d="M7 21l3 -4" />
              <path d="M16 21l-2 -4l-3 -3l1 -6" />
              <path d="M6 12l2 -3l4 -1l3 3l3 1" />
            </svg>
            پیاده
          </button>

          <button
            className={`transport-btn ${selectedTransport === 'electric-car' ? 'active' : ''}`}
            onClick={() => setSelectedTransport('electric-car')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={selectedTransport === 'electric-car' ? '#2196F3' : '#666'}>
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M14 5a1 1 0 0 1 .694 .28l.087 .095l3.699 4.625h.52a3 3 0 0 1 2.995 2.824l.005 .176v4a1 1 0 0 1 -1 1h-1.171a3.001 3.001 0 0 1 -5.658 0h-4.342a3.001 3.001 0 0 1 -5.658 0h-1.171a1 1 0 0 1 -1 -1v-6l.007 -.117l.008 -.056l.017 -.078l.012 -.036l.014 -.05l2.014 -5.034a1 1 0 0 1 .928 -.629zm-7 11a1 1 0 1 0 0 2a1 1 0 0 0 0 -2m10 0a1 1 0 1 0 0 2a1 1 0 0 0 0 -2m-6 -9h-5.324l-1.2 3h6.524zm2.52 0h-.52v3h2.92z" />
            </svg>
            ون برقی
          </button>

          <button
            className={`transport-btn ${selectedTransport === 'wheelchair' ? 'active' : ''}`}
            onClick={() => setSelectedTransport('wheelchair')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={selectedTransport === 'wheelchair' ? '#2196F3' : '#666'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M11 5m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
              <path d="M11 7l0 8l4 0l4 5" />
              <path d="M11 11l5 0" />
              <path d="M7 11.5a5 5 0 1 0 6 7.5" />
            </svg>
            ویلچر
          </button>
        </div>

        <div className="options-divider"></div>

        <div className="options-row">
          <button
            className={`gender-btn ${selectedGender === 'male' ? 'active' : ''}`}
            onClick={() => setSelectedGender('male')}
          >
            <div className="gender-circle">
              {selectedGender === 'male' && <div className="gender-circle-fill"></div>}
            </div>
            مسیر مناسب برادران
          </button>

          <button
            className={`gender-btn ${selectedGender === 'female' ? 'active' : ''}`}
            onClick={() => setSelectedGender('female')}
          >
            <div className="gender-circle">
              {selectedGender === 'female' && <div className="gender-circle-fill"></div>}
            </div>
            مسیر مناسب خواهران
          </button>
        </div>
      </div>

      {/* Route Info */}
      <div className="route-info">
        <div className="route-summary">
          از {origin.name} به {destination.name}
        </div>
        <div className="info-details">
          <div className="info-time">
            {getTransportIcon()}
            <span>{routeInfo.time} دقیقه</span>
          </div>
          <div className="info-distance">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#181717" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M3 19a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" />
              <path d="M19 7a2 2 0 1 0 0 -4a2 2 0 0 0 0 4z" />
              <path d="M11 19h5.5a3.5 3.5 0 0 0 0 -7h-8a3.5 3.5 0 0 1 0 -7h4.5" />
            </svg>
            <span>{routeInfo.distance} متر</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="action-buttons">
        <button className="navigate-btn" onClick={() => navigate('/rng')}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#fff">
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M11.092 2.581a1 1 0 0 1 1.754 -.116l.062 .116l8.005 17.365c.198 .566 .05 1.196 -.378 1.615a1.53 1.53 0 0 1 -1.459 .393l-7.077 -2.398l-6.899 2.338a1.535 1.535 0 0 1 -1.52 -.231l-.112 -.1c-.398 -.386 -.556 -.954 -.393 -1.556l.047 -.15l7.97 -17.276z" />
          </svg>
          مسیریابی
        </button>
        <button className="overview-btn" onClick={() => navigate('/rop')}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2196F3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M3 19a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" />
            <path d="M19 7a2 2 0 1 0 0 -4a2 2 0 0 0 0 4z" />
            <path d="M11 19h5.5a3.5 3.5 0 0 0 0 -7h-8a3.5 3.5 0 0 1 0 -7h4.5" />
          </svg>
          مسیر در یک نگاه
        </button>
      </div>
    </div>
  );
};

export default FinalSearch;
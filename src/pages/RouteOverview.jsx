import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../styles/RouteOverview.css';

const RouteOverview = () => {
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [directionArrow, setDirectionArrow] = useState('right');
  const [distance, setDistance] = useState('580 متر');
  const [time, setTime] = useState('4 دقیقه');

  // Sample route data
  const routeData = [
    {
      id: 1,
      instruction: "در صحن پیامبر اعظم به سمت مرکز صحن و ستون شماره ی بیست آن حرکت کنید.",
      distance: "35 متر",
      time: "1 دقیقه",
      direction: "up",
      coordinates: [[36.2880, 59.6157], [36.2885, 59.6162]]
    },
    {
      id: 2,
      instruction: "از قسمت ستون شماره‌ی 40 صحن پیامبر اعظم به سمت صحن قدس بپیچید و وارد آن شوید.",
      distance: "120 متر",
      time: "5 دقیقه",
      direction: "up",
      coordinates: [[36.2885, 59.6162], [36.2890, 59.6167]]
    },
    {
      id: 3,
      instruction: "در صحن گوهوشاد به سمت چپ حرکت کنید و از آن خارج و به صحن جمهوری وارد شوید.",
      distance: "60 متر",
      time: "2 دقیقه",
      direction: "straight",
      coordinates: [[36.2890, 59.6167], [36.2895, 59.6172]]
    },
    {
      id: 4,
      instruction: "به سمت صحن آزادی ادامه دهید و از درب غربی خارج شوید.",
      distance: "80 متر",
      time: "3 دقیقه",
      direction: "right",
      coordinates: [[36.2895, 59.6172], [36.2900, 59.6177]]
    },
    {
      id: 5,
      instruction: "وارد صحن انتقاب شوید. شما به مقصد خود رسیده اید.",
      distance: "100 متر",
      time: "4 دقیقه",
      direction: "arrived",
      coordinates: [[36.2900, 59.6177], [36.2905, 59.6182]]
    }
  ];

  // Initialize map - runs only once on component mount
  useEffect(() => {
    if (!mapRef.current) {
      mapRef.current = L.map('route-map', {
        zoomControl: false
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapRef.current);

      // Store references to map elements
      const routeCoordinates = routeData.flatMap(segment => segment.coordinates);
      const routePolyline = L.polyline(routeCoordinates, { 
        color: '#3498db', 
        weight: 5 
      }).addTo(mapRef.current);

      // Fit bounds once initially
      mapRef.current.fitBounds(routePolyline.getBounds(), {
        padding: [50, 50]
      });

      // Add permanent markers
      const originIcon = L.divIcon({
        html: '<div class="c-circle"></div>',
        className: '',
      });

      const destinationIcon = L.divIcon({
        html: `<div class="des-marker"><svg xmlns="http://www.w3.org/2000/svg" width="35" height="35" viewBox="0 0 24 24" fill="#e74c3c" class="icon icon-tabler icons-tabler-filled icon-tabler-map-pin"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M18.364 4.636a9 9 0 0 1 .203 12.519l-.203 .21l-4.243 4.242a3 3 0 0 1 -4.097 .135l-.144 -.135l-4.244 -4.243a9 9 0 0 1 12.728 -12.728zm-6.364 3.364a3 3 0 1 0 0 6a3 3 0 0 0 0 -6z" /></svg></div>`,
        className: '',
        iconSize: [35, 35],
        iconAnchor: [24, 24]
      });
      
      L.marker(routeCoordinates[0], { icon: originIcon }).addTo(mapRef.current)
        .bindPopup("مبدأ");
      L.marker(routeCoordinates[routeCoordinates.length - 1], { icon: destinationIcon }).addTo(mapRef.current)
        .bindPopup("مقصد");
    }
  }, []); // Empty dependency array means this runs only once

  // Update route highlights - runs when currentSlide changes
  useEffect(() => {
    if (!mapRef.current || !routeData[currentSlide]) return;

    const segment = routeData[currentSlide].coordinates;
    
    // Clear previous highlights
    if (mapRef.current._highlightLayer) {
      mapRef.current.removeLayer(mapRef.current._highlightLayer);
    }
    if (mapRef.current._timeMarker) {
      mapRef.current.removeLayer(mapRef.current._timeMarker);
    }

    // Add new highlight
    const segmentLayer = L.polyline(segment, { 
      color: '#e74c3c', 
      weight: 8 
    }).addTo(mapRef.current);
    mapRef.current._highlightLayer = segmentLayer;

    // Add time marker
    const progress = 0.6;
    const labelPoint = [
      segment[0][0] + (segment[1][0] - segment[0][0]) * progress + 0.00003,
      segment[0][1] + (segment[1][1] - segment[0][1]) * progress
    ];

    const timeIcon = L.divIcon({
      html: `
        <div class="time-marker">
          <div class="time-bubble">${routeData[currentSlide].time}</div>
        </div>
      `,
      className: 'time-marker-container',
      iconSize: [60, 30],
      iconAnchor: [30, 15]
    });

    const timeMarker = L.marker(labelPoint, { 
      icon: timeIcon 
    }).addTo(mapRef.current);
    mapRef.current._timeMarker = timeMarker;

  }, [currentSlide]);

  // Update distance and time when slide changes
  useEffect(() => {
    if (routeData[currentSlide]) {
      setDistance(routeData[currentSlide].distance);
      setTime(routeData[currentSlide].time);
      setDirectionArrow(routeData[currentSlide].direction);
    }
  }, [currentSlide]);

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
        return <svg xmlns="http://www.w3.org/2000/svg" width="35" height="35" viewBox="0 0 24 24" fill="#e74c3c" className="icon icon-tabler icons-tabler-filled icon-tabler-map-pin"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M18.364 4.636a9 9 0 0 1 .203 12.519l-.203 .21l-4.243 4.242a3 3 0 0 1 -4.097 .135l-.144 -.135l-4.244 -4.243a9 9 0 0 1 12.728 -12.728zm-6.364 3.364a3 3 0 1 0 0 6a3 3 0 0 0 0 -6z" /></svg>;
      default:
        return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-arrow-narrow-right"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M5 12l14 0" /><path d="M15 16l4 -4" /><path d="M15 8l4 4" /></svg>;
    }
  };

  return (
    <div className="route-overview-container fade-in">
      {/* Header with gradient bottom */}
      <div className="header-container">
        <header className="route-overview-header">
          <button className="route-back-button" onClick={() => navigate(-1)}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-x"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M18 6l-12 12" /><path d="M6 6l12 12" /></svg>
          </button>
          <h1 className="route-header-title">مسیر در یک نگاه</h1>
          <button className="map-profile-button" onClick={() => navigate('/Profile')}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="icon icon-tabler icons-tabler-filled icon-tabler-user"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M12 2a5 5 0 1 1 -5 5l.005 -.217a5 5 0 0 1 4.995 -4.783z" /><path d="M14 14a5 5 0 0 1 5 5v1a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-1a5 5 0 0 1 5 -5h4z" /></svg>
          </button>
        </header>
        <div className="header-gradient"></div>
      </div>

      {/* Map Section */}
      <div id="route-map" className="route-map-container"></div>

      {/* Start Routing Button */}
      <button className="start-routing-btn" onClick={() => navigate('/rng')}>
        <svg xmlns="http://www.w3.org/2000/svg" width="23" height="23" viewBox="0 0 24 24" fill="currentColor">
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M11.092 2.581a1 1 0 0 1 1.754 -.116l.062 .116l8.005 17.365c.198 .566 .05 1.196 -.378 1.615a1.53 1.53 0 0 1 -1.459 .393l-7.077 -2.398l-6.899 2.338a1.535 1.535 0 0 1 -1.52 -.231l-.112 -.1c-.398 -.386 -.556 -.954 -.393 -1.556l.047 -.15l7.97 -17.276z" />
        </svg>
        شروع مسیریابی
      </button>

      {/* Route Info Section */}
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
            <p className="instruction-text">{routeData[currentSlide]?.instruction}</p>
          </div>

          <div className="carousel-controls">
            <button className="carousel-prev" onClick={prevSlide} disabled={currentSlide === 0}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                <path d="M9 6l6 6l-6 6" stroke="currentColor" strokeWidth="2" fill="none" />
              </svg>
              قبلی
            </button>

            <div className="carousel-dots">
              {routeData.map((_, index) => (
                <span
                  key={index}
                  className={`dot ${index === currentSlide ? 'active' : ''}`}
                  onClick={() => setCurrentSlide(index)}
                ></span>
              ))}
            </div>

            <button className="carousel-next" onClick={nextSlide} disabled={currentSlide === routeData.length - 1}>
              بعدی
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
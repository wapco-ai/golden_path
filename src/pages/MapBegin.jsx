import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIntl } from 'react-intl';
import MapComponent from '../components/map/MapComponent';
import { groups } from '../components/groupData';
import { useRouteStore } from '../store/routeStore';
import { useLangStore } from '../store/langStore';
import { buildGeoJsonPath } from '../utils/geojsonPath.js';
import { getLocationTitleById } from '../utils/getLocationTitle';
import '../styles/MapBegin.css';

const MapBeginPage = () => {
  const navigate = useNavigate();
  const intl = useIntl();
  const language = useLangStore(state => state.language);
  const [selectedDestination, setSelectedDestination] = useState(null);
  const storedLat = sessionStorage.getItem('qrLat');
  const storedLng = sessionStorage.getItem('qrLng');
  const storedId = sessionStorage.getItem('qrId');
  const initialUserLocation = storedLat && storedLng
    ? {
      name: intl.formatMessage({ id: 'mapCurrentLocationName' }),
      coordinates: [parseFloat(storedLat), parseFloat(storedLng)]
    }
    : {
      name: intl.formatMessage({ id: 'defaultBabRezaName' }),
      coordinates: [36.297, 59.6069]
    };
  const [userLocation, setUserLocation] = useState(initialUserLocation);
  const [isTracking, setIsTracking] = useState(true);
  const [mapSelectedLocation, setMapSelectedLocation] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  useEffect(() => {
    if (storedLat && storedLng && storedId) {
      getLocationTitleById(storedId).then((title) => {
        if (title) {
          setUserLocation({
            name: title,
            coordinates: [parseFloat(storedLat), parseFloat(storedLng)]
          });
        }
      });
    }
  }, [storedLat, storedLng, storedId, language]);

  const setOriginStore = useRouteStore(state => state.setOrigin);
  const setDestinationStore = useRouteStore(state => state.setDestination);

  useEffect(() => {
    if (userLocation?.coordinates && selectedDestination?.coordinates) {
      setOriginStore({
        name: userLocation.name,
        coordinates: userLocation.coordinates
      });
      setDestinationStore({
        name: selectedDestination.name,
        coordinates: selectedDestination.coordinates
      });
      navigate('/location');
    }
  }, [userLocation, selectedDestination, navigate, setOriginStore, setDestinationStore]);

  const handleMapClick = (latlng, feature) => {
    const locName = feature?.properties?.name || intl.formatMessage({ id: 'mapSelectedLocation' });
    const destination = {
      name: locName,
      coordinates: [latlng.lat, latlng.lng]
    };

    setSelectedDestination(destination);
  };

  const handleCategoryClick = (category) => {
    setSelectedCategory((current) =>
      current && current.value === category.value ? null : category
    );
  };

  return (
    <div className="map-routing-page">
      {/* Header */}
      {isMenuOpen && (
        <div
          className="map-menu-overlay"
          onClick={() => setIsMenuOpen(false)}
        />
      )}
      <header className="map-routing-header">
        <button className="map-menu-button" onClick={toggleMenu}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="icon icon-tabler icons-tabler-outline icon-tabler-menu-2"
          >
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M4 6l16 0" />
            <path d="M4 12l16 0" />
            <path d="M4 18l16 0" />
          </svg>
        </button>
        <h1 className="map-header-title">
          {intl.formatMessage({ id: 'mapRoutingTitle' })}
        </h1>
        <button className="map-profile-button" onClick={() => navigate('/Profile')}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="9.99984" cy="5" r="3.33333" fill="#1E2023" />
            <ellipse cx="9.99984" cy="14.1667" rx="5.83333" ry="3.33333" fill="#1E2023" />
          </svg>
        </button>
      </header>

      {/* Categories Scroll */}
      <div className="map-categories-scroll">
        <div className="map-categories-list">
          {groups.map((category) => (
            <div
              key={category.value}
              className={`map-category-item ${selectedCategory && selectedCategory.value === category.value ? 'active' : ''}`}
              onClick={() => handleCategoryClick(category)}
            >
              <div className={`map-category-icon ${category.icon} ${selectedCategory && selectedCategory.value === category.value ? 'active' : ''}`}>
                <div dangerouslySetInnerHTML={{ __html: category.svg }} />
              </div>
              <span className={`map-category-name ${selectedCategory && selectedCategory.value === category.value ? 'active' : ''}`}>
                {intl.formatMessage({ id: category.label })}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Map Container */}
      <div className="map-routing-container">
        <MapComponent
          setUserLocation={setUserLocation}
          selectedDestination={selectedDestination}
          onMapClick={handleMapClick}
          selectedCategory={selectedCategory}
          userLocation={userLocation}
          mapSelectedLocation={mapSelectedLocation}
          isTracking={isTracking}
          onUserMove={() => setIsTracking(false)}
        />
        <button
          className={`map-gps-button ${isTracking ? 'active' : ''}`}
          onClick={() => setIsTracking((t) => !t)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" />
            <path d="M12 12m-8 0a8 8 0 1 0 16 0a8 8 0 1 0 -16 0" />
            <path d="M12 2l0 2" />
            <path d="M12 20l0 2" />
            <path d="M20 12l2 0" />
            <path d="M2 12l2 0" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default MapBeginPage;
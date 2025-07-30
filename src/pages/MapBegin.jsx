import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FormattedMessage, useIntl } from 'react-intl';
import MapComponent from '../components/map/MapComponent';
import { groups } from '../components/groupData';
import { useRouteStore } from '../store/routeStore';
import { useLangStore } from '../store/langStore';
import { buildGeoJsonPath } from '../utils/geojsonPath.js';
import { getLocationTitleById } from '../utils/getLocationTitle';
import { useSearchStore } from '../store/searchStore';
import '../styles/MapBegin.css';

const MapBeginPage = () => {
  const navigate = useNavigate();
  const intl = useIntl();
  const language = useLangStore(state => state.language);
  const [showDestinationModal, setShowDestinationModal] = useState(false);
  const [showOriginModal, setShowOriginModal] = useState(false);
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
  const [searchQuery, setSearchQuery] = useState('');
  const [activeInput, setActiveInput] = useState(null);
  const [isGPSEnabled, setIsGPSEnabled] = useState(false);
  const [isSelectingFromMap, setIsSelectingFromMap] = useState(false);
  const [isTracking, setIsTracking] = useState(true);
  const [mapSelectedLocation, setMapSelectedLocation] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

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
  const recentSearches = useSearchStore(state => state.recentSearches);
  const addSearch = useSearchStore(state => state.addSearch);

  const destinationInputRef = useRef(null);
  const originInputRef = useRef(null);
  const modalRef = useRef(null);
  const searchInputRef = useRef(null);
  const swapButtonRef = useRef(null);

  // Lazy loaded geojson data for destination search
  const [geoData, setGeoData] = useState(null);
  const [geoResults, setGeoResults] = useState([]);

  const getPolygonCenter = (coords) => {
    const pts = [];
    const collect = (c) => {
      if (typeof c[0] === 'number') {
        pts.push(c);
      } else {
        c.forEach(collect);
      }
    };
    collect(coords);
    const lats = pts.map((p) => p[1]);
    const lngs = pts.map((p) => p[0]);
    return [
      (Math.min(...lngs) + Math.max(...lngs)) / 2,
      (Math.min(...lats) + Math.max(...lats)) / 2,
    ];
  };

  const getFeatureCenter = (feature) => {
    if (!feature) return null;
    const { geometry } = feature;
    if (geometry.type === 'Point') return geometry.coordinates;
    if (geometry.type === 'Polygon' || geometry.type === 'MultiPolygon') {
      return getPolygonCenter(geometry.coordinates);
    }
    return null;
  };

  useEffect(() => {
    const returnToFinalSearch = sessionStorage.getItem('returnToFinalSearch');
    const activeInput = sessionStorage.getItem('activeInput');

    if (returnToFinalSearch === 'true') {
      if (activeInput === 'origin') {
        const storedDest = sessionStorage.getItem('currentDestination');
        const storedOrig = sessionStorage.getItem('currentOrigin');
        if (storedDest) {
          try {
            setSelectedDestination(JSON.parse(storedDest));
          } catch (err) {
            console.error('failed to parse currentDestination', err);
          }
        }
        if (storedOrig) {
          try {
            setUserLocation(JSON.parse(storedOrig));
          } catch (err) {
            console.error('failed to parse currentOrigin', err);
          }
        }
        setShowOriginModal(true);
        setActiveInput('origin');
      } else if (activeInput === 'destination') {
        const storedOrig = sessionStorage.getItem('currentOrigin');
        if (storedOrig) {
          try {
            setUserLocation(JSON.parse(storedOrig));
          } catch (err) {
            console.error('failed to parse currentOrigin', err);
          }
        }
        setShowDestinationModal(true);
        setActiveInput('destination');
        // Disable GPS tracking when editing only the destination
        // to avoid overwriting the origin with the current location
        setIsTracking(false);
      }

      // Clear the flags
      sessionStorage.removeItem('returnToFinalSearch');
      sessionStorage.removeItem('activeInput');
    }
  }, []);

  const filteredDestinations = searchQuery
    ? geoResults.map((f) => {
      const center = getFeatureCenter(f);
      return {
        id: f.properties?.uniqueId || f.id,
        name: f.properties?.name || '',
        location: f.properties?.subGroup || '',
        coordinates: center ? [center[1], center[0]] : null
      };
    })
    : recentSearches;

  useEffect(() => {
    if (userLocation?.coordinates &&
      selectedDestination?.coordinates &&
      !showDestinationModal &&
      !showOriginModal &&
      !isSelectingFromMap) {  // Add this condition
      setOriginStore({
        name: userLocation.name,
        coordinates: userLocation.coordinates
      });
      setDestinationStore({
        name: selectedDestination.name,
        coordinates: selectedDestination.coordinates
      });
      navigate('/fs');
    }
  }, [
    userLocation,
    selectedDestination,
    navigate,
    setOriginStore,
    setDestinationStore,
    showDestinationModal,
    showOriginModal,
    isSelectingFromMap  // Add to dependencies
  ]);

  const handleDestinationSelect = (destination) => {
    if (activeInput === 'destination') {
      setSelectedDestination(destination);
      addSearch(destination);
      setShowDestinationModal(false);

      if (location.state?.showDestinationModal) {
        sessionStorage.setItem('updatedDestination', JSON.stringify(destination));
        navigate('/fs');
      }
    } else {
      setUserLocation({ name: destination.name, coordinates: destination.coordinates });
      setShowOriginModal(false);

      if (location.state?.showOriginModal) {
        sessionStorage.setItem('updatedOrigin', JSON.stringify({
          name: destination.name,
          coordinates: destination.coordinates
        }));
        navigate('/fs');
      }
    }
    setSearchQuery('');
  };

  const handleInputChange = (e) => {
    setSearchQuery(e.target.value.toLowerCase());
  };

  useEffect(() => {
    const file = buildGeoJsonPath(language);

    fetch(file)
      .then((res) => res.json())
      .then(setGeoData)
      .catch((err) => console.error('failed to load geojson', err));
  }, [language]);

  useEffect(() => {
    if (geoData && searchQuery) {
      const query = searchQuery.toLowerCase();
      const results = geoData.features.filter((f) => {
        const name = (f.properties?.name || '').toLowerCase();
        const subGroup = (f.properties?.subGroup || '').toLowerCase();
        return name.includes(query) || subGroup.includes(query);
      });
      setGeoResults(results);
    } else {
      setGeoResults([]);
    }
  }, [searchQuery, geoData]);

  const handleSwapLocations = () => {
    // If there's no destination but we have origin, move origin to destination
    if (!selectedDestination && userLocation) {
      const destData = {
        name: userLocation.name,
        location: userLocation.location || userLocation.name,
        coordinates: userLocation.coordinates
      };

      setSelectedDestination(destData);
      sessionStorage.setItem('currentDestination', JSON.stringify(destData));

      // Reset origin to default
      const defaultOrigin = {
        name: intl.formatMessage({ id: 'defaultBabRezaName' }),
        coordinates: [36.297, 59.6069]
      };
      setUserLocation(defaultOrigin);
      sessionStorage.setItem('currentOrigin', JSON.stringify(defaultOrigin));

      // Stop GPS tracking
      setIsTracking(false);
      return;
    }

    // If we have both origin and destination, swap them
    if (userLocation && selectedDestination) {
      // Create new origin from current destination
      const newOrigin = {
        name: selectedDestination.name,
        coordinates: selectedDestination.coordinates,
        location: selectedDestination.location || selectedDestination.name
      };

      // Create new destination from current origin
      const newDestination = {
        name: userLocation.name,
        coordinates: userLocation.coordinates,
        location: userLocation.location || userLocation.name
      };

      // Update state
      setUserLocation(newOrigin);
      setSelectedDestination(newDestination);

      // Update session storage
      sessionStorage.setItem('currentOrigin', JSON.stringify(newOrigin));
      sessionStorage.setItem('currentDestination', JSON.stringify(newDestination));

      // Force map to update by resetting the tracking state
      setIsTracking(false);
      setTimeout(() => setIsTracking(true), 100);
    }

    // Animation for the swap button
    if (swapButtonRef.current) {
      swapButtonRef.current.classList.add('rotate');
      setTimeout(() => {
        if (swapButtonRef.current) {
          swapButtonRef.current.classList.remove('rotate');
        }
      }, 500);
    }
  };

  const handleCategoryClick = (category) => {
    setSelectedCategory((current) =>
      current && current.value === category.value ? null : category
    );
  };

  const handleInputClick = (inputType) => {
    setActiveInput(inputType);
    if (inputType === 'destination') {
      setShowDestinationModal(true);
    } else {
      setShowOriginModal(true);
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          () => setIsGPSEnabled(true),
          () => setIsGPSEnabled(false)
        );
      }
    }
  };

  const handleCurrentLocationSelect = () => {
    if (storedLat && storedLng && storedId) {
      getLocationTitleById(storedId).then((title) => {

        setUserLocation({
          name: title || intl.formatMessage({ id: 'mapCurrentLocationName' }),
          coordinates: [parseFloat(storedLat), parseFloat(storedLng)]
        });
      });
    } else {
      setUserLocation((prev) => ({
        ...prev,
        name: intl.formatMessage({ id: 'mapCurrentLocationName' })
      }));
    }
    setShowOriginModal(false);
  };

  const handleMapSelection = () => {
    setIsSelectingFromMap(true);
    setIsTracking(false);
    setShowDestinationModal(false);
    setShowOriginModal(false);
  };

  const handleMapClick = (latlng, feature) => {
    if (isSelectingFromMap) {
      const locName = feature?.properties?.name || intl.formatMessage({ id: 'mapSelectedLocation' });
      const location = {
        name: locName,
        coordinates: [latlng.lat, latlng.lng],
        type: activeInput
      };

      setMapSelectedLocation(location);

      if (activeInput === 'destination') {
        setSelectedDestination({
          name: locName,
          location: intl.formatMessage({ id: 'mapSelectedLocationFromMap' }),
          coordinates: [latlng.lat, latlng.lng]
        });
      } else {
        setUserLocation({
          name: locName,
          coordinates: [latlng.lat, latlng.lng]
        });
      }
      setIsSelectingFromMap(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const handleCancelMapSelection = () => {
    setIsSelectingFromMap(false);
    if (activeInput === 'destination') {
      setShowDestinationModal(true);
    } else {
      setShowOriginModal(true);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setShowDestinationModal(false);
        setShowOriginModal(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if ((showDestinationModal || showOriginModal) && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showDestinationModal, showOriginModal]);

  const renderSVG = (svgString) => {
    return <div dangerouslySetInnerHTML={{ __html: svgString }} />;
  };

  return (
    <div className="map-routing-page">
      {/* Header */}
      <header className="map-routing-header">
        {isSelectingFromMap ? (
          <button className="map-back-button" onClick={handleCancelMapSelection}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-arrow-narrow-right"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M5 12l14 0" /><path d="M15 16l4 -4" /><path d="M15 8l4 4" /></svg>
          </button>
        ) : (
          <button className="map-menu-button" >
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
        )}
        <h1 className="map-header-title">
          {isSelectingFromMap
            ? intl.formatMessage({ id: 'mapSelectFromMap' })
            : intl.formatMessage({ id: 'mapRoutingTitle' })}
        </h1>
        <button className="map-profile-button" onClick={() => navigate('/Profile')}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="9.99984" cy="5" r="3.33333" fill="#1E2023" />
            <ellipse cx="9.99984" cy="14.1667" rx="5.83333" ry="3.33333" fill="#1E2023" />
          </svg>
        </button>
      </header>

      {/* Categories Scroll - Hidden when selecting from map */}
      {!isSelectingFromMap && (
        <div className="map-categories-scroll">
          <div className="map-categories-list">
            {groups.map((category) => (
              <div
                key={category.value}
                className={`map-category-item ${selectedCategory && selectedCategory.value === category.value
                  ? 'active'
                  : ''
                  }`}
                onClick={() => handleCategoryClick(category)}
              >
                <div className={`map-category-icon ${category.icon}`}>
                  {renderSVG(category.svg)}
                </div>
                <span className="map-category-name">
                  {intl.formatMessage({ id: category.label })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Map Container */}
      <div className={`map-routing-container ${isSelectingFromMap ? 'hide-attribution' : ''}`}>
        <MapComponent
          setUserLocation={setUserLocation}
          selectedDestination={selectedDestination}
          onMapClick={handleMapClick}
          isSelectingLocation={isSelectingFromMap}
          selectedCategory={selectedCategory}
          userLocation={userLocation}
          mapSelectedLocation={mapSelectedLocation}
          isTracking={isTracking}
          onUserMove={() => setIsTracking(false)}
        />
        {!isSelectingFromMap && (
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
        )}
      </div>

      {/* Destination Input - Only shown when modal is NOT open and not selecting from map */}
      {!showDestinationModal && !showOriginModal && !isSelectingFromMap && (
        <>
          <div className="map-destination-input-container" ref={modalRef}>
            <div className="location-icons-container">
              <div className="location-icon origin-icon">
                <div className="n-circle"></div>
              </div>
              <div className="tdots">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#e0e0e0"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="icon icon-tabler icons-tabler-outline icon-tabler-dots-vertical"
                >
                  <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                  <path d="M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
                  <path d="M12 19m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
                  <path d="M12 5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
                </svg>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#e0e0e0"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="icon icon-tabler icons-tabler-outline icon-tabler-dots-vertical"
                >
                  <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                  <path d="M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
                  <path d="M12 19m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
                  <path d="M12 5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
                </svg>
              </div>
              <div className="location-icon destination-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#F44336">
                  <path d="M18.364 4.636a9 9 0 0 1 .203 12.519l-.203 .21l-4.243 4.242a3 3 0 0 1 -4.097 .135l-.144 -.135l-4.244 -4.243a9 9 0 0 1 12.728 -12.728zm-6.364 3.364a3 3 0 1 0 0 6a3 3 0 1 0 0 -6z" />
                </svg>
              </div>
            </div>
            <div className="map-location-inputs-container">
              {/* Fixed divider line */}
              <div className="map-inputs-divider"></div>

              {/* Origin Input */}
              <div className="map-current-location" onClick={() => handleInputClick('origin')}>
                <div className="map-location-text">
                  <span className="map-location-name">
                    {userLocation?.name || intl.formatMessage({ id: 'defaultBabRezaName' })}
                  </span>
                </div>
              </div>

              <button
                className="map-swap-button"
                onClick={handleSwapLocations}
                ref={swapButtonRef}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-arrows-sort">
                  <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                  <path d="M3 9l4 -4l4 4m-4 -4v14" />
                  <path d="M21 15l-4 4l-4 -4m4 4v-14" />
                </svg>
              </button>

              {/* Destination Input */}
              <div className="map-destination-input-wrapper" onClick={() => handleInputClick('destination')}>
                <input
                  type="text"
                  placeholder={intl.formatMessage({ id: 'destinationPlaceholder' })}
                  value={selectedDestination ? selectedDestination.name : ''}
                  readOnly
                />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Destination Modal */}
      {(showDestinationModal || showOriginModal) && (
        <div className={`map-search-modal ${showDestinationModal || showOriginModal ? 'fade-in' : ''}`} ref={modalRef}>
          <div className="map-search-header">
            <form className="map-search-form">
              <button className="map-modal-back-button" onClick={() => activeInput === 'destination' ? setShowDestinationModal(false) : setShowOriginModal(false)}>
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
                  className="icon icon-tabler icons-tabler-outline icon-tabler-arrow-narrow-right"
                >
                  <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                  <path d="M5 12l14 0" />
                  <path d="M15 16l4 -4" />
                  <path d="M15 8l4 4" />
                </svg>
              </button>
              <input
                type="text"
                placeholder={
                  activeInput === 'destination'
                    ? intl.formatMessage({ id: 'destinationSearchPlaceholder' })
                    : intl.formatMessage({ id: 'originSearchPlaceholder' })
                }
                value={searchQuery}
                onChange={handleInputChange}
                autoFocus
                ref={searchInputRef}
              />
              {searchQuery && (
                <button type="button" className="map-clear-search" onClick={handleClearSearch}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                    <path d="M18 6l-12 12" />
                    <path d="M6 6l12 12" />
                  </svg>
                </button>
              )}
            </form>
          </div>

          {!searchQuery && (
            <div className="map-options-section">
              <div className="map-option-item" onClick={handleMapSelection}>
                <div className="map-option-icon">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" clipRule="evenodd" d="M13.4885 1.43864C12.4052 1.29299 10.9817 1.29166 8.99984 1.29166C7.01798 1.29166 5.59447 1.29299 4.51115 1.43864C3.44582 1.58187 2.80355 1.85428 2.32883 2.32899C1.85412 2.80371 1.58171 3.44598 1.43848 4.51131C1.29283 5.59463 1.2915 7.01814 1.2915 9C1.2915 10.9819 1.29283 12.4054 1.43848 13.4887C1.58171 14.554 1.85412 15.1963 2.32883 15.671C2.71852 16.0607 3.22112 16.3141 3.97797 16.4715L16.4714 3.97813C16.3139 3.22128 16.0605 2.71868 15.6708 2.32899C15.1961 1.85428 14.5539 1.58187 13.4885 1.43864ZM16.6559 5.56137L11.5508 10.6665L16.0568 15.1726C16.3023 14.7565 16.4624 14.2232 16.5612 13.4887C16.7068 12.4054 16.7082 10.9819 16.7082 9C16.7082 7.60122 16.7075 6.48057 16.6559 5.56137ZM15.173 16.0566L10.6669 11.5504L5.56121 16.6561C6.48041 16.7077 7.60106 16.7083 8.99984 16.7083C10.9817 16.7083 12.4052 16.707 13.4885 16.5614C14.2234 16.4626 14.7569 16.3023 15.173 16.0566ZM13.6551 0.199786C14.859 0.361652 15.809 0.699436 16.5547 1.44511C17.3004 2.19079 17.6382 3.14081 17.8 4.34475C17.9582 5.52099 17.9582 7.02852 17.9582 8.95219V9.04781C17.9582 10.9715 17.9582 12.479 17.8 13.6552C17.6382 14.8592 17.3004 15.8092 16.5547 16.5549C15.809 17.3006 14.859 17.6383 13.6551 17.8002C12.4788 17.9583 10.9713 17.9583 9.04765 17.9583H8.95203C7.02836 17.9583 5.52083 17.9583 4.34459 17.8002C3.14065 17.6383 2.19063 17.3006 1.44495 16.5549C0.699276 15.8092 0.361493 14.8592 0.199626 13.6552C0.0414851 12.479 0.0414935 10.9715 0.0415041 9.04781V8.95218C0.0414933 7.02852 0.0414847 5.52099 0.199626 4.34475C0.361492 3.14081 0.699276 2.19079 1.44495 1.44511C2.19063 0.699437 3.14065 0.361653 4.34459 0.199786C5.52083 0.0416453 7.02836 0.0416537 8.95202 0.0416643H9.04765C10.9713 0.0416535 12.4788 0.0416449 13.6551 0.199786ZM2.95817 6.29768C2.95817 4.41182 4.58689 2.95825 6.49984 2.95825C8.41279 2.95825 10.0415 4.41182 10.0415 6.29768C10.0415 7.98624 9.00333 9.97915 7.2788 10.7161C6.78335 10.9278 6.21633 10.9278 5.72087 10.7161C3.99634 9.97915 2.95817 7.98624 2.95817 6.29768ZM6.49984 4.20825C5.19113 4.20825 4.20817 5.18526 4.20817 6.29768C4.20817 7.5839 5.0318 9.06229 6.21208 9.56668C6.39379 9.64433 6.60589 9.64433 6.78759 9.56668C7.96788 9.06229 8.7915 7.5839 8.7915 6.29768C8.7915 5.18526 7.80855 4.20825 6.49984 4.20825Z" fill="#0F71EF" />
                    <path d="M7.33317 6.5C7.33317 6.96024 6.96007 7.33333 6.49984 7.33333C6.0396 7.33333 5.6665 6.96024 5.6665 6.5C5.6665 6.03976 6.0396 5.66666 6.49984 5.66666C6.96007 5.66666 7.33317 6.03976 7.33317 6.5Z" fill="#0F71EF" />
                  </svg>

                </div>
                <span className="map-option-text">
                  <FormattedMessage id="chooseFromMap" />
                </span>
              </div>
              {isGPSEnabled && activeInput === 'origin' && (
                <div className="map-option-item" onClick={handleCurrentLocationSelect}>
                  <div className="map-option-icon">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" clipRule="evenodd" d="M13.4885 1.43864C12.4052 1.29299 10.9817 1.29166 8.99984 1.29166C7.01798 1.29166 5.59447 1.29299 4.51115 1.43864C3.44582 1.58187 2.80355 1.85428 2.32883 2.32899C1.85412 2.80371 1.58171 3.44598 1.43848 4.51131C1.29283 5.59463 1.2915 7.01814 1.2915 9C1.2915 10.9819 1.29283 12.4054 1.43848 13.4887C1.58171 14.554 1.85412 15.1963 2.32883 15.671C2.71852 16.0607 3.22112 16.3141 3.97797 16.4715L16.4714 3.97813C16.3139 3.22128 16.0605 2.71868 15.6708 2.32899C15.1961 1.85428 14.5539 1.58187 13.4885 1.43864ZM16.6559 5.56137L11.5508 10.6665L16.0568 15.1726C16.3023 14.7565 16.4624 14.2232 16.5612 13.4887C16.7068 12.4054 16.7082 10.9819 16.7082 9C16.7082 7.60122 16.7075 6.48057 16.6559 5.56137ZM15.173 16.0566L10.6669 11.5504L5.56121 16.6561C6.48041 16.7077 7.60106 16.7083 8.99984 16.7083C10.9817 16.7083 12.4052 16.707 13.4885 16.5614C14.2234 16.4626 14.7569 16.3023 15.173 16.0566ZM13.6551 0.199786C14.859 0.361652 15.809 0.699436 16.5547 1.44511C17.3004 2.19079 17.6382 3.14081 17.8 4.34475C17.9582 5.52099 17.9582 7.02852 17.9582 8.95219V9.04781C17.9582 10.9715 17.9582 12.479 17.8 13.6552C17.6382 14.8592 17.3004 15.8092 16.5547 16.5549C15.809 17.3006 14.859 17.6383 13.6551 17.8002C12.4788 17.9583 10.9713 17.9583 9.04765 17.9583H8.95203C7.02836 17.9583 5.52083 17.9583 4.34459 17.8002C3.14065 17.6383 2.19063 17.3006 1.44495 16.5549C0.699276 15.8092 0.361493 14.8592 0.199626 13.6552C0.0414851 12.479 0.0414935 10.9715 0.0415041 9.04781V8.95218C0.0414933 7.02852 0.0414847 5.52099 0.199626 4.34475C0.361492 3.14081 0.699276 2.19079 1.44495 1.44511C2.19063 0.699437 3.14065 0.361653 4.34459 0.199786C5.52083 0.0416453 7.02836 0.0416537 8.95202 0.0416643H9.04765C10.9713 0.0416535 12.4788 0.0416449 13.6551 0.199786ZM2.95817 6.29768C2.95817 4.41182 4.58689 2.95825 6.49984 2.95825C8.41279 2.95825 10.0415 4.41182 10.0415 6.29768C10.0415 7.98624 9.00333 9.97915 7.2788 10.7161C6.78335 10.9278 6.21633 10.9278 5.72087 10.7161C3.99634 9.97915 2.95817 7.98624 2.95817 6.29768ZM6.49984 4.20825C5.19113 4.20825 4.20817 5.18526 4.20817 6.29768C4.20817 7.5839 5.0318 9.06229 6.21208 9.56668C6.39379 9.64433 6.60589 9.64433 6.78759 9.56668C7.96788 9.06229 8.7915 7.5839 8.7915 6.29768C8.7915 5.18526 7.80855 4.20825 6.49984 4.20825Z" fill="#0F71EF" />
                      <path d="M7.33317 6.5C7.33317 6.96024 6.96007 7.33333 6.49984 7.33333C6.0396 7.33333 5.6665 6.96024 5.6665 6.5C5.6665 6.03976 6.0396 5.66666 6.49984 5.66666C6.96007 5.66666 7.33317 6.03976 7.33317 6.5Z" fill="#0F71EF" />
                    </svg>
                  </div>
                  <span className="map-option-text">
                    {intl.formatMessage({ id: 'mapCurrentLocation' }, { loc: userLocation?.name || '' })}
                  </span>
                </div>
              )}
            </div>
          )}

          {!searchQuery && (
            <>
              <h2 className="map-recent-title">
                {intl.formatMessage({ id: 'mapRecentSearches' })}
              </h2>
              {recentSearches.length === 0 ? (
                <p className="map-no-recent">
                  {intl.formatMessage({ id: 'mapNoRecentSearches' })}
                </p>
              ) : (
                <ul className="map-destination-list">
                  {recentSearches.map((destination) => (
                    <li key={destination.id} onClick={() => handleDestinationSelect(destination)}>
                      <div className="map-recent-icon">
                        <svg width="15" height="15" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" clipRule="evenodd" d="M2.96259 2.95683C5.17657 0.745974 8.77558 0.769482 11.0031 2.997C13.2316 5.22548 13.2541 8.82663 11.0404 11.0404C8.82667 13.2541 5.22552 13.2315 2.99704 11.0031C1.67644 9.68246 1.1311 7.88082 1.36528 6.17239C1.39809 5.933 1.61875 5.76554 1.85814 5.79835C2.09753 5.83117 2.265 6.05183 2.23218 6.29122C2.03386 7.73809 2.49541 9.26398 3.61577 10.3843C5.50841 12.277 8.5555 12.2878 10.4217 10.4216C12.2878 8.55546 12.277 5.50837 10.3844 3.61573C8.49269 1.72405 5.44775 1.71226 3.58132 3.57556L4.01749 3.57775C4.25911 3.57896 4.454 3.77582 4.45279 4.01745C4.45157 4.25907 4.25471 4.45396 4.01309 4.45275L2.52816 4.44529C2.28825 4.44408 2.09406 4.2499 2.09286 4.00999L2.0854 2.52506C2.08418 2.28343 2.27907 2.08657 2.5207 2.08536C2.76232 2.08414 2.95918 2.27904 2.9604 2.52066L2.96259 2.95683ZM7.00002 4.2291C7.24164 4.2291 7.43752 4.42498 7.43752 4.66661V6.81876L8.76773 8.14897C8.93859 8.31983 8.93859 8.59684 8.76773 8.7677C8.59688 8.93855 8.31986 8.93855 8.14901 8.7677L6.56251 7.1812V4.66661C6.56251 4.42498 6.75839 4.2291 7.00002 4.2291Z" fill="#858585" />
                        </svg>

                      </div>
                      <div className="map-destination-info">
                        <span className="map-destination-name">{destination.name}</span>
                        <span className="map-destination-location">{destination.location}</span>
                      </div>
                      <button className="map-recent-option">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-dots-vertical"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /><path d="M12 19m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /><path d="M12 5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /></svg>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          {searchQuery && filteredDestinations.length > 0 && (
            <ul className="map-destination-list">
              {filteredDestinations.map((destination) => (
                <li key={destination.id} onClick={() => handleDestinationSelect(destination)}>
                  <div className="map-recent-icon">
                    <svg width="15" height="15" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" clipRule="evenodd" d="M2.96259 2.95683C5.17657 0.745974 8.77558 0.769482 11.0031 2.997C13.2316 5.22548 13.2541 8.82663 11.0404 11.0404C8.82667 13.2541 5.22552 13.2315 2.99704 11.0031C1.67644 9.68246 1.1311 7.88082 1.36528 6.17239C1.39809 5.933 1.61875 5.76554 1.85814 5.79835C2.09753 5.83117 2.265 6.05183 2.23218 6.29122C2.03386 7.73809 2.49541 9.26398 3.61577 10.3843C5.50841 12.277 8.5555 12.2878 10.4217 10.4216C12.2878 8.55546 12.277 5.50837 10.3844 3.61573C8.49269 1.72405 5.44775 1.71226 3.58132 3.57556L4.01749 3.57775C4.25911 3.57896 4.454 3.77582 4.45279 4.01745C4.45157 4.25907 4.25471 4.45396 4.01309 4.45275L2.52816 4.44529C2.28825 4.44408 2.09406 4.2499 2.09286 4.00999L2.0854 2.52506C2.08418 2.28343 2.27907 2.08657 2.5207 2.08536C2.76232 2.08414 2.95918 2.27904 2.9604 2.52066L2.96259 2.95683ZM7.00002 4.2291C7.24164 4.2291 7.43752 4.42498 7.43752 4.66661V6.81876L8.76773 8.14897C8.93859 8.31983 8.93859 8.59684 8.76773 8.7677C8.59688 8.93855 8.31986 8.93855 8.14901 8.7677L6.56251 7.1812V4.66661C6.56251 4.42498 6.75839 4.2291 7.00002 4.2291Z" fill="#858585" />
                    </svg>

                  </div>
                  <div className="map-destination-info">
                    <span className="map-destination-name">{destination.name}</span>
                    <span className="map-destination-location">{destination.location}</span>
                  </div>
                  <button className="map-recent-option">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-dots-vertical"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /><path d="M12 19m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /><path d="M12 5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /></svg>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default MapBeginPage;
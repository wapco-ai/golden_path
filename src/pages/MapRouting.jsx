import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FormattedMessage, useIntl } from 'react-intl';
import MapComponent from '../components/map/MapComponent';
import { groups } from '../components/groupData';
import { useRouteStore } from '../store/routeStore';
import { useLangStore } from '../store/langStore';
import { useSearchStore } from '../store/searchStore';
import '../styles/MapRouting.css';

const MapRoutingPage = () => {
  const navigate = useNavigate();
  const intl = useIntl();
  const [showDestinationModal, setShowDestinationModal] = useState(false);
  const [showOriginModal, setShowOriginModal] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState(null);
  const storedLat = sessionStorage.getItem('qrLat');
  const storedLng = sessionStorage.getItem('qrLng');
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
  const [mapSelectedLocation, setMapSelectedLocation] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const setOriginStore = useRouteStore(state => state.setOrigin);
  const setDestinationStore = useRouteStore(state => state.setDestination);
  const language = useLangStore(state => state.language);
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


  // Recent searches data from store

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

  // Handle navigation when both origin and destination are selected
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
      navigate('/fs');
    }
  }, [userLocation, selectedDestination, navigate, setOriginStore, setDestinationStore]);

  const handleDestinationSelect = (destination) => {
    if (activeInput === 'destination') {
      setSelectedDestination(destination);
      addSearch(destination);
      setShowDestinationModal(false);
    } else {
      setUserLocation({ name: destination.name, coordinates: destination.coordinates });
      setShowOriginModal(false);
    }
    setSearchQuery('');
  };

  const handleInputChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Lazy load geojson data on first search
  useEffect(() => {
    if (searchQuery && !geoData) {
      const file =
        language === 'fa'
          ? '/data14040404.geojson'
          : `/data14040404_${language}.geojson`;
      fetch(file)
        .then((res) => res.json())
        .then(setGeoData)
        .catch((err) => console.error('failed to load geojson', err));
    }
  }, [searchQuery, geoData, language]);

  // Filter geojson features based on search query
  useEffect(() => {
    if (geoData && searchQuery) {
      const results = geoData.features.filter((f) => {
        const name = f.properties?.name || '';
        const subGroup = f.properties?.subGroup || '';
        return name.includes(searchQuery) || subGroup.includes(searchQuery);
      });
      setGeoResults(results);
    } else {
      setGeoResults([]);
    }
  }, [searchQuery, geoData]);

  const handleSwapLocations = () => {
    // Only swap the values between origin and destination
    const temp = userLocation;
    setUserLocation(
      selectedDestination
        ? { name: selectedDestination.name, coordinates: selectedDestination.coordinates }
        : null
    );
    setSelectedDestination(
      temp ? { name: temp.name, location: temp.name, coordinates: temp.coordinates } : null
    );

    // Add animation to swap button
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
    setUserLocation((prev) => ({
      ...prev,
      name: intl.formatMessage({ id: 'mapCurrentLocationName' })
    }));
    setShowOriginModal(false);
  };

  const handleMapSelection = () => {
    setIsSelectingFromMap(true);
    setShowDestinationModal(false);
    setShowOriginModal(false);
  };

  const handleMapClick = (latlng) => {
    if (isSelectingFromMap) {
      if (activeInput === 'destination') {
        setSelectedDestination({
          name: intl.formatMessage({ id: 'mapSelectedLocation' }),
          location: intl.formatMessage({ id: 'mapSelectedLocationFromMap' }),
          coordinates: [latlng.lat, latlng.lng]
        });
      } else {
        setUserLocation({
          name: intl.formatMessage({ id: 'mapSelectedLocation' }),
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

  // Function to create SVG elements from the SVG strings
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
          <button className="map-back-button" onClick={() => navigate(-1)}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-arrow-narrow-right"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M5 12l14 0" /><path d="M15 16l4 -4" /><path d="M15 8l4 4" /></svg>
          </button>
        )}
        <h1 className="map-header-title">
          {isSelectingFromMap
            ? intl.formatMessage({ id: 'mapSelectFromMap' })
            : intl.formatMessage({ id: 'mapRoutingTitle' })}
        </h1>
        <button className="map-profile-button" onClick={() => navigate('/Profile')}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="icon icon-tabler icons-tabler-filled icon-tabler-user"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M12 2a5 5 0 1 1 -5 5l.005 -.217a5 5 0 0 1 4.995 -4.783z" /><path d="M14 14a5 5 0 0 1 5 5v1a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-1a5 5 0 0 1 5 -5h4z" /></svg>
        </button>
      </header>

      {/* Categories Scroll - Hidden when selecting from map */}
      {!isSelectingFromMap && (
        <div className="map-categories-scroll">
          <div className="map-categories-list">
            {groups.map((category) => (
              <div
                key={category.value}
                className={`map-category-item ${
                  selectedCategory && selectedCategory.value === category.value
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
      <div className="map-routing-container">
        <MapComponent
          setUserLocation={setUserLocation}
          selectedDestination={selectedDestination}
          onMapClick={handleMapClick}
          isSelectingLocation={isSelectingFromMap}
          selectedCategory={selectedCategory}
        />
        <button className="map-gps-button">
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

      {/* Destination Input - Only shown when modal is NOT open and not selecting from map */}
      {!showDestinationModal && !showOriginModal && !isSelectingFromMap && (
        <div className="map-destination-input-container" ref={modalRef}>
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
          <div className="map-location-inputs-container">
            {/* Fixed divider line */}
            <div className="map-inputs-divider"></div>

            {/* Origin Input */}
            <div
              className="map-current-location"
              onClick={() => handleInputClick('origin')}
            >
              <div className="map-location-text">
                {userLocation ? (
                  <>
                    <span className="map-location-name">
                      {userLocation.name}
                    </span>
                    <span className="map-location-label">
                      {intl.formatMessage({ id: 'mapCurrentOriginLabel' })}
                    </span>
                  </>
                ) : (
                  <input
                    type="text"
                    className="map-origin-input"
                    placeholder={intl.formatMessage({ id: 'originPlaceholder' })}
                    readOnly
                  />
                )}
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
            <div
              className="map-destination-input-wrapper"
              onClick={() => handleInputClick('destination')}
            >
              <input
                type="text"
                placeholder={intl.formatMessage({ id: 'destinationPlaceholder' })}
                value={selectedDestination ? selectedDestination.name : ''}
                readOnly
              />
            </div>
          </div>
        </div>
      )}

      {/* Destination Modal */}
      {(showDestinationModal || showOriginModal) && (
        <div className={`map-search-modal ${showDestinationModal || showOriginModal ? 'fade-in' : ''}`} ref={modalRef}>
          <div className="map-search-header">
            <form className="map-search-form">
              <button className="map-modal-back-button" onClick={() => activeInput === 'destination' ? setShowDestinationModal(false) : setShowOriginModal(false)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-arrow-narrow-right"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M5 12l14 0" /><path d="M15 16l4 -4" /><path d="M15 8l4 4" /></svg>
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
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1E90FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-photo-pin"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M15 8h.01" /><path d="M12.5 21h-6.5a3 3 0 0 1 -3 -3v-12a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v5.5" /><path d="M3 16l5 -5c.928 -.893 2.072 -.893 3 0l2.5 2.5" /><path d="M21.121 20.121a3 3 0 1 0 -4.242 0c.418 .419 1.125 1.045 2.121 1.879c1.051 -.89 1.759 -1.516 2.121 -1.879z" /><path d="M19 18v.01" /></svg>
                </div>
                <span className="map-option-text">
                  <FormattedMessage id="chooseFromMap" />
                </span>
              </div>
              {isGPSEnabled && activeInput === 'origin' && (
                <div className="map-option-item" onClick={handleCurrentLocationSelect}>
                  <div className="map-option-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1E90FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-current-location"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" /><path d="M12 12m-8 0a8 8 0 1 0 16 0a8 8 0 1 0 -16 0" /><path d="M12 2l0 2" /><path d="M12 20l0 2" /><path d="M20 12l2 0" /><path d="M2 12l2 0" /></svg>
                  </div>
                  <span className="map-option-text">
                    {intl.formatMessage({ id: 'mapCurrentLocation' }, { loc: userLocation.name })}
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
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-clock-down"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M20.984 12.535a9 9 0 1 0 -8.431 8.448" /><path d="M12 7v5l3 3" /><path d="M19 16v6" /><path d="M22 19l-3 3l-3 -3" /></svg>
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
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-clock-down"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M20.984 12.535a9 9 0 1 0 -8.431 8.448" /><path d="M12 7v5l3 3" /><path d="M19 16v6" /><path d="M22 19l-3 3l-3 -3" /></svg>
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

export default MapRoutingPage;

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FormattedMessage, useIntl } from 'react-intl';
import Mprc from '../components/map/Mprc';
import { groups, subGroups } from '../components/groupData';
import { useRouteStore } from '../store/routeStore';
import { useLangStore } from '../store/langStore';
import { buildGeoJsonPath } from '../utils/geojsonPath.js';
import { getLocationTitleById } from '../utils/getLocationTitle';
import { useSearchStore } from '../store/searchStore';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../styles/MapRouting.css';

const MapRoutingPage = () => {
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
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [showRouteInfoModal, setShowRouteInfoModal] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [selectedSubgroup, setSelectedSubgroup] = useState(null);

  // Separate state for map categories and modal categories
  const [mapSelectedCategory, setMapSelectedCategory] = useState(null);
  const [mapSelectedSubGroups, setMapSelectedSubGroups] = useState([]);
  const [modalSelectedCategory, setModalSelectedCategory] = useState(null);
  const [modalFilteredSubGroups, setModalFilteredSubGroups] = useState([]);

  const [isCategorySelected, setIsCategorySelected] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

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

  const handleCategoryClickInModal = (category) => {
    setModalSelectedCategory(category);

    // Localize the subgroups
    const localized = (subGroups[category.value] || []).map(sg => ({
      ...sg,
      label: getLocalizedSubgroupLabel(geoData, sg.value, sg.label),
      description: getLocalizedSubgroupDescription(
        geoData,
        sg.value,
        intl.formatMessage({ id: sg.description || 'subgroupDefaultDesc' })
      )
    }));

    setModalFilteredSubGroups(localized);
    setSearchQuery('');
    setIsSearching(true);
  };


  // Add this function to clear search and go back to categories
  const handleClearCategorySearch = () => {
    setModalSelectedCategory(null);
    setModalFilteredSubGroups([]);
    setSearchQuery('');
    setIsSearching(false);
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

  const handleBackFromCategory = () => {
    setModalSelectedCategory(null);
    setModalFilteredSubGroups([]);
    setIsCategorySelected(false);
    setSearchQuery('');
  };

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
      !isSelectingFromMap) {
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
    isSelectingFromMap
  ]);


  const handleSubgroupSelect = (subgroup) => {
    const destination = {
      id: subgroup.value,
      name: subgroup.label,
      location: intl.formatMessage({ id: modalSelectedCategory.label }),
      coordinates: null
    };

    handleDestinationSelect(destination);
  };

  const handleSubgroupSelectWithModal = (subgroup) => {
    console.log('Selected subgroup:', subgroup.value, 'Has image:', !!subgroup.img);

    // If subgroup has image, show modal regardless of geoData coordinates
    if (subgroup.img) {
      let coordinates = null;

      // First try to get coordinates from geoData
      if (geoData) {
        const feature = geoData.features.find(
          f => f.properties?.subGroupValue === subgroup.value
        );

        if (feature) {
          const center = getFeatureCenter(feature);
          if (center) {
            coordinates = [center[1], center[0]];
          }
        }
      }

      // If no coordinates from geoData, check if subgroup has its own coordinates
      if (!coordinates && subgroup.coordinates) {
        coordinates = subgroup.coordinates;
      }

      // Show modal with whatever coordinates we have (even if null)
      setSelectedPlace({
        name: subgroup.label,
        coordinates: coordinates, // can be null
        // Add the first image to selectedPlace for the modal if needed
        image: Array.isArray(subgroup.img) ? subgroup.img[0] : subgroup.img
      });
      setSelectedSubgroup(subgroup);
      setShowRouteInfoModal(true);
      setSelectedOption(null);
      return;
    }

    // Fallback only for subgroups without images
    handleSubgroupSelect(subgroup);
  };

  const resetLocationPage = () => {
    setShowRouteInfoModal(false);
    setSelectedOption(null);
  };

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

  // Get subgroup label based on currently loaded geoData
  const getLocalizedSubgroupLabel = (geoData, value, fallback) => {
    if (geoData) {
      const feature = geoData.features.find(
        f => f.properties?.subGroupValue === value
      );
      if (feature?.properties?.subGroup) return feature.properties.subGroup;
    }
    return fallback;
  };

  // Get subgroup description based on currently loaded geoData
  const getLocalizedSubgroupDescription = (geoData, value, fallback) => {
    if (geoData) {
      const feature = geoData.features.find(
        f => f.properties?.subGroupValue === value
      );
      if (feature?.properties?.description) return feature.properties.description;
    }
    return fallback;
  };

  const handleSwapLocations = () => {
    if (!selectedDestination && userLocation) {
      const destData = {
        name: userLocation.name,
        location: userLocation.location || userLocation.name,
        coordinates: userLocation.coordinates
      };

      setSelectedDestination(destData);
      sessionStorage.setItem('currentDestination', JSON.stringify(destData));

      const defaultOrigin = {
        name: intl.formatMessage({ id: 'defaultBabRezaName' }),
        coordinates: [36.297, 59.6069]
      };
      setUserLocation(defaultOrigin);
      sessionStorage.setItem('currentOrigin', JSON.stringify(defaultOrigin));

      setIsTracking(false);
      return;
    }

    if (userLocation && selectedDestination) {
      const newOrigin = {
        name: selectedDestination.name,
        coordinates: selectedDestination.coordinates,
        location: selectedDestination.location || selectedDestination.name
      };

      const newDestination = {
        name: userLocation.name,
        coordinates: userLocation.coordinates,
        location: userLocation.location || userLocation.name
      };

      setUserLocation(newOrigin);
      setSelectedDestination(newDestination);

      sessionStorage.setItem('currentOrigin', JSON.stringify(newOrigin));
      sessionStorage.setItem('currentDestination', JSON.stringify(newDestination));

      setIsTracking(false);
      setTimeout(() => setIsTracking(true), 100);
    }

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
    setMapSelectedCategory((current) => {
      if (current && current.value === category.value) {
        setMapSelectedSubGroups([]);
        return null;
      } else {
        const categorySubGroups = subGroups[category.value] || [];
        const hasSubGroupsWithImages = categorySubGroups.some(sub => sub.img);

        if (hasSubGroupsWithImages) {
          setMapSelectedSubGroups(categorySubGroups);
        } else {
          setMapSelectedSubGroups([]);
        }

        return category;
      }
    });
  };

  const handleSubGroupClick = (subGroup) => {
    console.log('Selected subgroup:', subGroup);
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
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" clipRule="evenodd" d="M11.2244 4.55806C11.4685 4.31398 11.8642 4.31398 12.1083 4.55806L17.1083 9.55806C17.3524 9.80214 17.3524 10.1979 17.1083 10.4419L12.1083 15.4419C11.8642 15.686 11.4685 15.686 11.2244 15.4419C10.9803 15.1979 10.9803 14.8021 11.2244 14.5581L15.1575 10.625H3.33301C2.98783 10.625 2.70801 10.3452 2.70801 10C2.70801 9.65482 2.98783 9.375 3.33301 9.375H15.1575L11.2244 5.44194C10.9803 5.19786 10.9803 4.80214 11.2244 4.55806Z" fill="#1E2023" />
            </svg>
          </button>
        ) : (
          <button className="map-back-button" onClick={() => navigate(-1)}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" clipRule="evenodd" d="M11.2244 4.55806C11.4685 4.31398 11.8642 4.31398 12.1083 4.55806L17.1083 9.55806C17.3524 9.80214 17.3524 10.1979 17.1083 10.4419L12.1083 15.4419C11.8642 15.686 11.4685 15.686 11.2244 15.4419C10.9803 15.1979 10.9803 14.8021 11.2244 14.5581L15.1575 10.625H3.33301C2.98783 10.625 2.70801 10.3452 2.70801 10C2.70801 9.65482 2.98783 9.375 3.33301 9.375H15.1575L11.2244 5.44194C10.9803 5.19786 10.9803 4.80214 11.2244 4.55806Z" fill="#1E2023" />
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
                className={`map-category-item ${mapSelectedCategory && mapSelectedCategory.value === category.value ? 'active' : ''}`}
                onClick={() => handleCategoryClick(category)}
              >
                <div className={`map-category-icon ${category.icon} ${mapSelectedCategory && mapSelectedCategory.value === category.value ? 'active' : ''}`}>
                  <img src={category.png} alt={category.label} width="22" height="22" />
                </div>
                <span className={`map-category-name ${mapSelectedCategory && mapSelectedCategory.value === category.value ? 'active' : ''}`}>
                  {intl.formatMessage({ id: category.label })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Map Container */}
      <div className={`map-routing-container ${isSelectingFromMap ? 'hide-attribution' : ''}`}>
        <Mprc
          setUserLocation={setUserLocation}
          selectedDestination={selectedDestination}
          onMapClick={handleMapClick}
          isSelectingLocation={isSelectingFromMap}
          selectedCategory={mapSelectedCategory}
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

      {/* Subgroups Container - Only shown when a category with image subgroups is selected */}
      {mapSelectedSubGroups.length > 0 && (
        <div className="map-subgroups-container">
          <div className="map-subgroups-scroll">
            {mapSelectedSubGroups.map((subGroup) => (
              subGroup.img && (
                <div key={subGroup.value} className="map-subgroup-card">
                  <div className="map-subgroup-main">
                    <div className="map-subgroup-content">
                      <div className="map-subgroup-top">
                        <div className="subgroup-search-icon">
                          <img src={mapSelectedCategory.png} alt={mapSelectedCategory.label || 'category icon'} width="22" height="22" />
                        </div>
                        <h3 className="map-subgroup-title">{subGroup.label}</h3>
                      </div>
                      <p className="map-subgroup-address">{subGroup.address}</p>
                      <div className="subgroup-rating-section">
                        <div className="subgroup-rating-stars">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <svg
                              key={star}
                              className={star <= Math.round(subGroup.rating) ? 'filled' : ''}
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                            >
                              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                              <path d="M12 17.75l-6.172 3.245l1.179 -6.873l-5 -4.867l6.9 -1l3.086 -6.253l3.086 6.253l6.9 1l-5 4.867l1.179 6.873z" />
                            </svg>
                          ))}
                        </div>
                        <span className="subgroup-views">( {subGroup.views} {intl.formatMessage({ id: 'commentsLabel' })})</span>
                      </div>
                    </div>
                    <div className="map-subgroup-image">
                      <img
                        src={Array.isArray(subGroup.img) ? subGroup.img[0] : subGroup.img}
                        alt={subGroup.label}
                      />
                    </div>
                  </div>
                  <div className="map-subgroup-actions">
                    <button className="map-subgroup-btn route-btn" onClick={() => navigate('/fs')}>
                      <svg width="19" height="16" viewBox="0 0 19 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" clipRule="evenodd" d="M16.2851 14.6752C16.7753 14.2188 16.9902 13.4967 16.6398 12.7983L11.1179 1.7918C10.4769 0.514157 8.52263 0.514157 7.88165 1.7918L2.35977 12.7983C2.00936 13.4967 2.2243 14.2188 2.71445 14.6752C3.20874 15.1354 4.01591 15.348 4.78988 14.9806L4.52496 14.5396L4.78988 14.9806L9.21767 12.8793L8.95274 12.4382L9.21767 12.8793C9.39648 12.7944 9.60309 12.7944 9.7819 12.8793L14.2097 14.9806L14.4746 14.5396L14.2097 14.9806C14.9837 15.348 15.7908 15.1354 16.2851 14.6752ZM14.7395 14.0985L14.4766 14.5364L14.7395 14.0985L10.3118 11.9971C9.80183 11.7551 9.19774 11.7551 8.68781 11.9971L4.26003 14.0985C3.99319 14.2251 3.72448 14.1675 3.52817 13.9847C3.32773 13.798 3.23735 13.5043 3.38724 13.2056L8.90911 2.19909C9.15361 1.71173 9.84595 1.71173 10.0905 2.19909L15.6123 13.2056C15.7622 13.5043 15.6718 13.7981 15.4714 13.9847C15.2751 14.1675 15.0064 14.2251 14.7395 14.0985Z" fill="#0F71EF" />
                      </svg>
                      <FormattedMessage id="navigate" />
                    </button>
                    <button className="map-subgroup-btn save-btn">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6 3.50016C5.72386 3.50016 5.5 3.72402 5.5 4.00016C5.5 4.27631 5.72386 4.50016 6 4.50016H10C10.2761 4.50016 10.5 4.27631 10.5 4.00016C10.5 3.72402 10.2761 3.50016 10 3.50016H6Z" fill="#0F71EF" />
                        <path fillRule="evenodd" clipRule="evenodd" d="M7.96167 0.833496C6.57996 0.833486 5.49144 0.833479 4.64085 0.949076C3.76748 1.06777 3.07073 1.31662 2.52323 1.87005C1.97646 2.42274 1.73128 3.12484 1.6142 4.0051C1.49998 4.86384 1.49999 5.96324 1.5 7.36088V10.7595C1.49999 11.7645 1.49999 12.5603 1.56401 13.1594C1.62727 13.7514 1.76298 14.2855 2.15056 14.6427C2.4615 14.9293 2.85474 15.1099 3.27443 15.1579C3.79941 15.218 4.28959 14.9673 4.77246 14.6253C5.26108 14.2792 5.85384 13.7549 6.60169 13.0934L6.62603 13.0719C6.97274 12.7652 7.20748 12.5583 7.40333 12.4151C7.59261 12.2767 7.70818 12.2267 7.80559 12.207C7.93395 12.1812 8.06605 12.1812 8.19441 12.207C8.29182 12.2267 8.40739 12.2767 8.59667 12.4151C8.79252 12.5583 9.02726 12.7652 9.37397 13.0719L9.39835 13.0935C10.1462 13.7549 10.7389 14.2792 11.2275 14.6253C11.7104 14.9673 12.2006 15.218 12.7256 15.1579C13.1453 15.1099 13.5385 14.9293 13.8494 14.6427C14.237 14.2855 14.3727 13.7514 14.436 13.1594C14.5 12.5603 14.5 11.7645 14.5 10.7595V7.36086C14.5 5.96324 14.5 4.86383 14.3858 4.0051C14.2687 3.12484 14.0235 2.42274 13.4768 1.87005C12.9293 1.31662 12.2325 1.06777 11.3591 0.949076C10.5086 0.833479 9.42004 0.833486 8.03833 0.833496H7.96167ZM3.23413 2.57334C3.56531 2.23857 4.01501 2.04332 4.77552 1.93997C5.55097 1.83458 6.5715 1.8335 8 1.8335C9.4285 1.8335 10.449 1.83458 11.2245 1.93997C11.985 2.04332 12.4347 2.23857 12.7659 2.57334C13.0978 2.90885 13.2919 3.36562 13.3945 4.13695C13.499 4.92211 13.5 5.95498 13.5 7.39851V10.7274C13.5 11.7716 13.4993 12.5136 13.4417 13.0531C13.3826 13.606 13.2736 13.8135 13.1718 13.9074C13.0159 14.051 12.8199 14.1406 12.6119 14.1644C12.4788 14.1797 12.2557 14.1281 11.8056 13.8093C11.3665 13.4983 10.8141 13.0106 10.0365 12.3229L10.019 12.3074C9.6942 12.0201 9.42479 11.7818 9.18693 11.6079C8.93828 11.426 8.68749 11.2863 8.39188 11.2267C8.13318 11.1746 7.86682 11.1746 7.60812 11.2267C7.31251 11.2863 7.06172 11.426 6.81307 11.6079C6.57522 11.7818 6.30581 12.0201 5.98097 12.3074L5.96351 12.3229C5.18592 13.0106 4.63351 13.4983 4.19443 13.8093C3.7443 14.1281 3.52121 14.1797 3.38812 14.1644C3.18012 14.1406 2.98412 14.051 2.82825 13.9074C2.72642 13.8135 2.61743 13.606 2.55835 13.0531C2.50069 12.5136 2.5 11.7716 2.5 10.7274V7.39851C2.5 5.95498 2.50104 4.92211 2.60547 4.13695C2.70806 3.36562 2.90222 2.90885 3.23413 2.57334Z" fill="#0F71EF" />
                      </svg>
                      <FormattedMessage id="savePlace" />
                    </button>
                    <button className="map-subgroup-btn" onClick={() => navigate('/location')}>
                      <svg width="17" height="16" viewBox="0 0 17 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" clipRule="evenodd" d="M7.79691 0.833496H9.20341C10.1151 0.833483 10.85 0.833472 11.428 0.911179C12.0281 0.991856 12.5333 1.16445 12.9346 1.56573C13.1336 1.76471 13.2763 1.98925 13.3795 2.23825C14.0009 2.31608 14.5226 2.48705 14.9346 2.8991C15.3359 3.30038 15.5085 3.80563 15.5891 4.4057C15.6669 4.98368 15.6668 5.71856 15.6668 6.63028V9.37011C15.6668 10.2818 15.6669 11.0167 15.5891 11.5947C15.5085 12.1948 15.3359 12.7 14.9346 13.1013C14.5225 13.5133 14.0009 13.6843 13.3795 13.7622C13.2763 14.0111 13.1336 14.2356 12.9346 14.4346C12.5333 14.8359 12.0281 15.0085 11.428 15.0891C10.85 15.1669 10.1151 15.1668 9.20341 15.1668H7.79692C6.88519 15.1668 6.15031 15.1669 5.57233 15.0891C4.97226 15.0085 4.46701 14.8359 4.06573 14.4346C3.86677 14.2356 3.72403 14.0111 3.62083 13.7622C2.99946 13.6843 2.47778 13.5133 2.06573 13.1013C1.66445 12.7 1.49186 12.1948 1.41118 11.5947C1.33347 11.0167 1.33348 10.2818 1.3335 9.37011V6.63028C1.33348 5.71856 1.33347 4.98368 1.41118 4.4057C1.49186 3.80563 1.66445 3.30038 2.06573 2.8991C2.47777 2.48705 2.99944 2.31608 3.6208 2.23824C3.724 1.98925 3.86675 1.76471 4.06573 1.56573C4.46701 1.16445 4.97226 0.991856 5.57233 0.911179C6.15031 0.833472 6.88519 0.833483 7.79691 0.833496ZM3.38579 3.29381C3.09404 3.36412 2.91217 3.46688 2.77284 3.6062C2.58833 3.79071 2.46803 4.04976 2.40226 4.53894C2.33456 5.04251 2.3335 5.70992 2.3335 6.66686V9.33353C2.3335 10.2905 2.33456 10.9579 2.40226 11.4615C2.46803 11.9506 2.58833 12.2097 2.77284 12.3942C2.91217 12.5335 3.09405 12.6363 3.38579 12.7066C3.33347 12.1658 3.33348 11.5025 3.3335 10.7034V5.29691C3.33348 4.49785 3.33347 3.83462 3.38579 3.29381ZM13.6145 12.7066C13.9063 12.6363 14.0882 12.5335 14.2275 12.3942C14.412 12.2097 14.5323 11.9506 14.5981 11.4615C14.6658 10.9579 14.6668 10.2905 14.6668 9.33353V6.66686C14.6668 5.70992 14.6658 5.04251 14.5981 4.53894C14.5323 4.04976 14.412 3.79071 14.2275 3.6062C14.0882 3.46688 13.9063 3.36412 13.6145 3.29381C13.6669 3.83462 13.6668 4.49785 13.6668 5.29692V10.7034C13.6668 11.5025 13.6669 12.1658 13.6145 12.7066ZM5.70558 1.90226C5.21639 1.96803 4.95735 2.08833 4.77284 2.27284C4.58833 2.45735 4.46803 2.71639 4.40226 3.20558C4.33456 3.70914 4.3335 4.37655 4.3335 5.3335V10.6668C4.3335 11.6238 4.33456 12.2912 4.40226 12.7947C4.46803 13.2839 4.58833 13.543 4.77284 13.7275C4.95735 13.912 5.21639 14.0323 5.70558 14.0981C6.20914 14.1658 6.87655 14.1668 7.8335 14.1668H9.16683C10.1238 14.1668 10.7912 14.1658 11.2947 14.0981C11.7839 14.0323 12.043 13.912 12.2275 13.7275C12.412 13.543 12.5323 13.2839 12.5981 12.7947C12.6658 12.2912 12.6668 11.6238 12.6668 10.6668V5.3335C12.6668 4.37655 12.6658 3.70914 12.5981 3.20558C12.5323 2.71639 12.412 2.45735 12.2275 2.27284C12.043 2.08833 11.7839 1.96803 11.2947 1.90226C10.7912 1.83456 10.1238 1.8335 9.16683 1.8335H7.8335C6.87655 1.8335 6.20914 1.83456 5.70558 1.90226ZM6.00016 6.00016C6.00016 5.72402 6.22402 5.50016 6.50016 5.50016H10.5002C10.7763 5.50016 11.0002 5.72402 11.0002 6.00016C11.0002 6.27631 10.7763 6.50016 10.5002 6.50016H6.50016C6.22402 6.50016 6.00016 6.27631 6.00016 6.00016ZM6.00016 8.66683C6.00016 8.39069 6.22402 8.16683 6.50016 8.16683H10.5002C10.7763 8.16683 11.0002 8.39069 11.0002 8.66683C11.0002 8.94297 10.7763 9.16683 10.5002 9.16683H6.50016C6.22402 9.16683 6.00016 8.94297 6.00016 8.66683ZM6.00016 11.3335C6.00016 11.0574 6.22402 10.8335 6.50016 10.8335H8.50016C8.77631 10.8335 9.00016 11.0574 9.00016 11.3335C9.00016 11.6096 8.77631 11.8335 8.50016 11.8335H6.50016C6.22402 11.8335 6.00016 11.6096 6.00016 11.3335Z" fill="#0F71EF" />
                      </svg>
                      <FormattedMessage id="detailsButton" />
                    </button>
                  </div>
                </div>
              )
            ))}
          </div>
        </div>
      )}

      {/* Destination Input - Only shown when modal is NOT open and not selecting from map and no subgroups are selected */}
      {!showDestinationModal && !showOriginModal && !isSelectingFromMap && mapSelectedSubGroups.length === 0 && (
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
              {/* Conditionally render the back button */}
              {!modalSelectedCategory && (
                <button
                  type="button"
                  className="map-modal-back-button"
                  onClick={() => {
                    activeInput === 'destination' ? setShowDestinationModal(false) : setShowOriginModal(false);
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" clipRule="evenodd" d="M11.2244 4.55806C11.4685 4.31398 11.8642 4.31398 12.1083 4.55806L17.1083 9.55806C17.3524 9.80214 17.3524 10.1979 17.1083 10.4419L12.1083 15.4419C11.8642 15.686 11.4685 15.686 11.2244 15.4419C10.9803 15.1979 10.9803 14.8021 11.2244 14.5581L15.1575 10.625H3.33301C2.98783 10.625 2.70801 10.3452 2.70801 10C2.70801 9.65482 2.98783 9.375 3.33301 9.375H15.1575L11.2244 5.44194C10.9803 5.19786 10.9803 4.80214 11.2244 4.55806Z" fill="#1E2023" />
                  </svg>
                </button>
              )}

              {modalSelectedCategory ? (
                <div className="selected-category-header">
                  <div className="selected-category-icon">
                    <img src={modalSelectedCategory.png} alt={modalSelectedCategory.label || 'category icon'} width="22" height="22" />
                  </div>
                  <span>{intl.formatMessage({ id: modalSelectedCategory.label })}</span>
                </div>
              ) : (
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
              )}

              {(searchQuery || modalSelectedCategory) && (
                <button type="button" className="map-clear-search" onClick={() => {
                  if (modalSelectedCategory) {
                    handleClearCategorySearch();
                  } else {
                    handleClearSearch();
                  }
                }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                    <path d="M18 6l-12 12" />
                    <path d="M6 6l12 12" />
                  </svg>
                </button>
              )}
            </form>

            {!modalSelectedCategory && (
              <div className="map-categories-scroll2">
                <div className="map-categories-list2">
                  {groups.map((category) => (
                    <div
                      key={category.value}
                      className={`map-category-item2 ${modalSelectedCategory && modalSelectedCategory.value === category.value ? 'active' : ''}`}
                      onClick={() => handleCategoryClickInModal(category)}
                    >
                      <div className={`map-category-icon ${category.icon} ${modalSelectedCategory && modalSelectedCategory.value === category.value ? 'active' : ''}`}>
                        <img src={category.png} width="22" height="22" />
                      </div>
                      <span className={`map-category-name ${modalSelectedCategory && modalSelectedCategory.value === category.value ? 'active' : ''}`}>
                        {intl.formatMessage({ id: category.label })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Show subgroups when a category is selected */}
          {modalSelectedCategory && (
            <div className="map-subgroups-search-results">
              <div className="subgroups-container">
                {/* Subgroups with images - 2 column grid */}
                <div className="subgroups-with-images">
                  <div className="subgroups-grid">
                    {modalFilteredSubGroups
                      .filter(subgroup => subgroup.img)
                      .map((subgroup, index) => (
                        <div
                          key={index}
                          className="subgroup-item with-image"
                          onClick={() => handleSubgroupSelectWithModal(subgroup)}
                          style={{
                            backgroundImage: subgroup.img ? `url(${Array.isArray(subgroup.img) ? subgroup.img[0] : subgroup.img})` : 'none',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            backgroundColor: 'rgba(255,255,255,0.7)',
                            backgroundBlendMode: 'lighten'
                          }}
                        >
                          <div className="subgroup-info">
                            <h4>{subgroup.label}</h4>
                            {subgroup.description && <p>{subgroup.description}</p>}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Subgroups without images - default list */}
                <div className="subgroups-without-images">
                  {modalFilteredSubGroups
                    .filter(subgroup => !subgroup.img)
                    .map((subgroup, index) => (
                      <div
                        key={index}
                        className="subgroup-search-item"
                        onClick={() => handleSubgroupSelect(subgroup)}
                      >
                        <div className="subgroup-search-box">
                          <div className="subgroup-search-info">
                            <div className="subgroup-search-icon">
                              <img src={modalSelectedCategory.png} alt={modalSelectedCategory.label || 'category icon'} width="22" height="22" />
                            </div>
                            <span className="subgroup-search-name">{subgroup.label}</span>
                          </div>

                          {subgroup.description && (
                            <span className="subgroup-search-description">{subgroup.description}</span>
                          )}
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>
            </div>
          )}

          {/* Original content when no category is selected */}
          {!modalSelectedCategory && (
            <>
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
            </>
          )}

          {/* Route or Info Modal */}
          {showRouteInfoModal && selectedPlace && (
            <>
              <div className="modal-overlay" onClick={() => setShowRouteInfoModal(false)}></div>
              <div className="route-info-modal">
                <div className="route-info-toggle" onClick={() => setShowRouteInfoModal(false)}>
                  <div className="toggle-handle"></div>
                </div>
                <div className="modal-header">
                  <span className="place-name-title3">{selectedPlace.name}</span>
                  <h3>
                    <FormattedMessage
                      id="routeOrInfoTitle"
                      values={{ placeName: selectedPlace.name }}
                    />
                  </h3>
                </div>

                <div className="route-info-options">
                  <button
                    className={`route-info-option ${selectedOption === 'info' ? 'selected' : ''}`}
                    onClick={() => setSelectedOption('info')}
                  >
                    <div className="option-icon">
                      <svg width="60" height="60" viewBox="0 0 41 41" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" clipRule="evenodd" d="M18.9916 2.58337H22.5078C24.7871 2.58334 26.6243 2.58331 28.0693 2.77758C29.5694 2.97927 30.8326 3.41076 31.8358 4.41396C32.3332 4.91141 32.6901 5.47276 32.9481 6.09525C34.5015 6.28984 35.8057 6.71727 36.8358 7.74738C37.839 8.75057 38.2704 10.0137 38.4721 11.5139C38.6664 12.9588 38.6664 14.796 38.6663 17.0753V23.9249C38.6664 26.2042 38.6664 28.0414 38.4721 29.4864C38.2704 30.9866 37.839 32.2497 36.8358 33.2529C35.8056 34.283 34.5014 34.7104 32.948 34.905C32.69 35.5274 32.3332 36.0887 31.8358 36.5861C30.8326 37.5893 29.5694 38.0208 28.0693 38.2225C26.6243 38.4168 24.7871 38.4167 22.5078 38.4167H18.9916C16.7122 38.4167 14.875 38.4168 13.4301 38.2225C11.9299 38.0208 10.6668 37.5893 9.66359 36.5861C9.16619 36.0887 8.80934 35.5274 8.55135 34.905C6.99792 34.7104 5.69372 34.283 4.66359 33.2529C3.6604 32.2497 3.22891 30.9866 3.02721 29.4864C2.83295 28.0414 2.83297 26.2042 2.83301 23.9249V17.0753C2.83297 14.796 2.83295 12.9588 3.02721 11.5139C3.22891 10.0137 3.6604 8.75057 4.66359 7.74738C5.6937 6.71727 6.99788 6.28984 8.55128 6.09524C8.80927 5.47276 9.16615 4.9114 9.66359 4.41396C10.6668 3.41076 11.9299 2.97927 13.4301 2.77758C14.875 2.58331 16.7122 2.58334 18.9916 2.58337ZM7.96373 8.73416C7.23438 8.90993 6.77968 9.16682 6.43136 9.51515C5.97009 9.97642 5.66934 10.624 5.50492 11.847C5.33566 13.1059 5.33301 14.7744 5.33301 17.1668V23.8335C5.33301 26.2258 5.33566 27.8943 5.50492 29.1533C5.66934 30.3762 5.97009 31.0238 6.43136 31.4851C6.77969 31.8334 7.23439 32.0903 7.96375 32.2661C7.83295 30.914 7.83298 29.2559 7.83301 27.2582V13.7419C7.83298 11.7442 7.83295 10.0862 7.96373 8.73416ZM33.5356 32.2661C34.265 32.0903 34.7197 31.8334 35.068 31.4851C35.5293 31.0238 35.83 30.3762 35.9944 29.1533C36.1637 27.8943 36.1663 26.2258 36.1663 23.8335V17.1668C36.1663 14.7744 36.1637 13.1059 35.9944 11.847C35.83 10.624 35.5293 9.97642 35.068 9.51515C34.7197 9.16682 34.265 8.90993 33.5356 8.73416C33.6664 10.0862 33.6664 11.7443 33.6663 13.7419V27.2582C33.6664 29.2559 33.6664 30.914 33.5356 32.2661ZM13.7632 5.25529C12.5403 5.41971 11.8926 5.72045 11.4314 6.18173C10.9701 6.643 10.6693 7.29062 10.5049 8.51358C10.3357 9.77249 10.333 11.441 10.333 13.8334V27.1667C10.333 29.5591 10.3357 31.2276 10.5049 32.4865C10.6693 33.7095 10.9701 34.3571 11.4314 34.8184C11.8926 35.2796 12.5402 35.5804 13.7632 35.7448C15.0221 35.9141 16.6906 35.9167 19.083 35.9167H22.4163C24.8087 35.9167 26.4772 35.9141 27.7361 35.7448C28.9591 35.5804 29.6067 35.2796 30.068 34.8184C30.5293 34.3571 30.83 33.7095 30.9944 32.4865C31.1637 31.2276 31.1663 29.5591 31.1663 27.1667V13.8334C31.1663 11.441 31.1637 9.77249 30.9944 8.51358C30.83 7.29062 30.5293 6.643 30.068 6.18173C29.6067 5.72045 28.9591 5.41971 27.7361 5.25529C26.4772 5.08603 24.8087 5.08338 22.4163 5.08338H19.083C16.6906 5.08338 15.0221 5.08603 13.7632 5.25529ZM14.4997 15.5C14.4997 14.8097 15.0593 14.25 15.7497 14.25H25.7497C26.44 14.25 26.9997 14.8097 26.9997 15.5C26.9997 16.1904 26.44 16.75 25.7497 16.75H15.7497C15.0593 16.75 14.4997 16.1904 14.4997 15.5ZM14.4997 22.1667C14.4997 21.4764 15.0593 20.9167 15.7497 20.9167H25.7497C26.44 20.9167 26.9997 21.4764 26.9997 22.1667C26.9997 22.8571 26.44 23.4167 25.7497 23.4167H15.7497C15.0593 23.4167 14.4997 22.8571 14.4997 22.1667ZM14.4997 28.8334C14.4997 28.143 15.0593 27.5834 15.7497 27.5834H20.7497C21.44 27.5834 21.9997 28.143 21.9997 28.8334C21.9997 29.5237 21.44 30.0834 20.7497 30.0834H15.7497C15.0593 30.0834 14.4997 29.5237 14.4997 28.8334Z" fill={selectedOption === 'info' ? "#1E90FF" : "#1E2023"} />
                      </svg>
                    </div>
                    <span><FormattedMessage id="culturalInfoOption" /></span>
                  </button>

                  <button
                    className={`route-info-option ${selectedOption === 'route' ? 'selected' : ''}`}
                    onClick={() => setSelectedOption('route')}
                  >
                    <div className="option-icon">
                      <svg width="60" height="60" viewBox="0 0 41 41" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" clipRule="evenodd" d="M29.227 5.37733C27.0604 5.08603 24.2134 5.08337 20.2497 5.08337C16.286 5.08337 13.4389 5.08603 11.2723 5.37733C9.14163 5.66379 7.8571 6.20861 6.90767 7.15804C5.95824 8.10746 5.41342 9.392 5.12696 11.5227C4.83566 13.6893 4.83301 16.5363 4.83301 20.5C4.83301 24.4637 4.83566 27.3108 5.12696 29.4774C5.41342 31.6081 5.95824 32.8926 6.90767 33.842C7.68705 34.6214 8.69224 35.1282 10.2059 35.4431L35.1928 10.4563C34.8778 8.94261 34.3711 7.93741 33.5917 7.15803C32.6423 6.20861 31.3577 5.66379 29.227 5.37733ZM35.5618 13.6228L25.3515 23.8331L34.3636 32.8451C34.8546 32.0131 35.1749 30.9463 35.3724 29.4774C35.6637 27.3108 35.6663 24.4637 35.6663 20.5C35.6663 17.7025 35.665 15.4612 35.5618 13.6228ZM32.5961 34.6132L23.5838 25.6008L13.3724 35.8122C15.2108 35.9154 17.4521 35.9167 20.2497 35.9167C24.2134 35.9167 27.0604 35.9141 29.227 35.6228C30.6967 35.4252 31.7639 35.1046 32.5961 34.6132ZM29.5602 2.89962C31.9681 3.22335 33.8681 3.89892 35.3594 5.39027C36.8508 6.88162 37.5264 8.78166 37.8501 11.1895C38.1664 13.542 38.1664 16.5571 38.1663 20.4044V20.5957C38.1664 24.443 38.1664 27.4581 37.8501 29.8105C37.5264 32.2184 36.8508 34.1185 35.3594 35.6098C33.8681 37.1012 31.9681 37.7767 29.5602 38.1005C27.2077 38.4167 24.1926 38.4167 20.3453 38.4167H20.1541C16.3067 38.4167 13.2917 38.4167 10.9392 38.1005C8.53129 37.7767 6.63125 37.1012 5.1399 35.6098C3.64855 34.1185 2.97299 32.2184 2.64925 29.8105C2.33297 27.4581 2.33299 24.443 2.33301 20.5957V20.4044C2.33299 16.5571 2.33297 13.542 2.64925 11.1896C2.97298 8.78166 3.64855 6.88162 5.1399 5.39027C6.63125 3.89892 8.53129 3.22335 10.9392 2.89962C13.2917 2.58334 16.3067 2.58335 20.154 2.58337H20.3453C24.1926 2.58335 27.2077 2.58334 29.5602 2.89962ZM8.16634 15.0954C8.16634 11.3237 11.4238 8.41654 15.2497 8.41654C19.0756 8.41654 22.333 11.3237 22.333 15.0954C22.333 18.4725 20.2567 22.4583 16.8076 23.9323C15.8167 24.3557 14.6827 24.3557 13.6917 23.9323C10.2427 22.4583 8.16634 18.4725 8.16634 15.0954ZM15.2497 10.9165C12.6323 10.9165 10.6663 12.8706 10.6663 15.0954C10.6663 17.6678 12.3136 20.6246 14.6742 21.6334C15.0376 21.7887 15.4618 21.7887 15.8252 21.6334C18.1858 20.6246 19.833 17.6678 19.833 15.0954C19.833 12.8706 17.8671 10.9165 15.2497 10.9165Z" fill={selectedOption === 'route' ? "#1E90FF" : "#1E2023"} />
                        <path d="M16.9163 15.5C16.9163 16.4205 16.1701 17.1667 15.2497 17.1667C14.3292 17.1667 13.583 16.4205 13.583 15.5C13.583 14.5796 14.3292 13.8334 15.2497 13.8334C16.1701 13.8334 16.9163 14.5796 16.9163 15.5Z" fill={selectedOption === 'route' ? "#1E90FF" : "#1E2023"} />
                      </svg>
                    </div>
                    <span><FormattedMessage id="routeOption" /></span>
                  </button>
                </div>
                <button
                  className="confirm-button"
                  disabled={!selectedOption}
                  onClick={() => {
                    if (selectedOption === 'route') {
                      // Create destination object from the selected subgroup
                      const destination = {
                        id: selectedSubgroup.value,
                        name: selectedSubgroup.label,
                        coordinates: selectedPlace.coordinates,
                        location: intl.formatMessage({ id: modalSelectedCategory.label })
                      };

                      handleDestinationSelect(destination);
                      setShowRouteInfoModal(false);
                    } else if (selectedOption === 'info') {
                      navigate('/location');
                    }
                  }}
                >
                  <FormattedMessage id="confirmContinue" />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default MapRoutingPage;
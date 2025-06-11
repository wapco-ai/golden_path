import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MapComponent from '../components/map/MapComponent';
import '../styles/MapRouting.css';

const MapRoutingPage = () => {
  const navigate = useNavigate();
  const [showDestinationModal, setShowDestinationModal] = useState(false);
  const [showOriginModal, setShowOriginModal] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [userLocation, setUserLocation] = useState('باب الرضا «ع»');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSwapped, setIsSwapped] = useState(false);
  const [activeInput, setActiveInput] = useState(null);
  const [isGPSEnabled, setIsGPSEnabled] = useState(false);
  const destinationInputRef = useRef(null);
  const originInputRef = useRef(null);
  const modalRef = useRef(null);
  const searchInputRef = useRef(null);
  const swapButtonRef = useRef(null);

  // Categories data
  const categories = [
    {
      name: 'محل اسکن‌کد',
      icon: 'qr-code',
      svg: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-object-scan"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M4 8v-2a2 2 0 0 1 2 -2h2" /><path d="M4 16v2a2 2 0 0 0 2 2h2" /><path d="M16 4h2a2 2 0 0 1 2 2v2" /><path d="M16 20h2a2 2 0 0 0 2 -2v-2" /><path d="M8 8m0 2a2 2 0 0 1 2 -2h4a2 2 0 0 1 2 2v4a2 2 0 0 1 -2 2h-4a2 2 0 0 1 -2 -2z" /></svg>
    },
    {
      name: 'چایخانه‌ها',
      icon: 'tea',
      svg: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" class="icon icon-tabler icons-tabler-filled icon-tabler-mug"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M3.903 4.008l.183 -.008h10.828a2.08 2.08 0 0 1 2.086 2.077v.923h1.5c1.917 0 3.5 1.477 3.5 3.333v2.334c0 1.856 -1.583 3.333 -3.5 3.333h-1.663a5.33 5.33 0 0 1 -5.17 4h-4.334c-2.944 0 -5.333 -2.375 -5.333 -5.308v-8.618a2.08 2.08 0 0 1 1.903 -2.066m13.097 9.992h1.5c.843 0 1.5 -.613 1.5 -1.333v-2.334c0 -.72 -.657 -1.333 -1.5 -1.333h-1.5z" /></svg>
    },
    {
      name: 'باب‌های حرم',
      icon: 'door',
      svg: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-door"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M14 12v.01" /><path d="M3 21h18" /><path d="M6 21v-16a2 2 0 0 1 2 -2h8a2 2 0 0 1 2 2v16" /></svg>
    },
    {
      name: 'صحن‌ها',
      icon: 'courtyard',
      svg: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-door"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M14 12v.01" /><path d="M3 21h18" /><path d="M6 21v-16a2 2 0 0 1 2 -2h8a2 2 0 0 1 2 2v16" /></svg>
    },
    {
      name: 'رواق‌ها',
      icon: 'shrine',
      svg: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-door"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M14 12v.01" /><path d="M3 21h18" /><path d="M6 21v-16a2 2 0 0 1 2 -2h8a2 2 0 0 1 2 2v16" /></svg>
    },
    {
      name: 'کفشداری‌ها',
      icon: 'shoe',
      svg: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-flip-flops"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M18 4c2.21 0 4 1.682 4 3.758c0 .078 0 .156 -.008 .234l-.6 9.014c-.11 1.683 -1.596 3 -3.392 3s-3.28 -1.311 -3.392 -3l-.6 -9.014c-.138 -2.071 1.538 -3.855 3.743 -3.985a4.15 4.15 0 0 1 .25 -.007z" /><path d="M14.5 14c1 -3.333 2.167 -5 3.5 -5c1.333 0 2.5 1.667 3.5 5" /><path d="M18 16v1" /><path d="M6 4c2.21 0 4 1.682 4 3.758c0 .078 0 .156 -.008 .234l-.6 9.014c-.11 1.683 -1.596 3 -3.392 3s-3.28 -1.311 -3.392 -3l-.6 -9.014c-.138 -2.071 1.538 -3.855 3.742 -3.985c.084 0 .167 -.007 .25 -.007z" /><path d="M2.5 14c1 -3.333 2.167 -5 3.5 -5c1.333 0 2.5 1.667 3.5 5" /><path d="M6 16v1" /></svg>
    },
    {
      name: 'سرویس بهداشتی',
      icon: 'toilet',
      svg: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-friends"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M7 5m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" /><path d="M5 22v-5l-1 -1v-4a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4l-1 1v5" /><path d="M17 5m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" /><path d="M15 22v-4h-2l2 -6a1 1 0 0 1 1 -1h2a1 1 0 0 1 1 1l2 6h-2v4" /></svg>
    }
  ];

  // Destinations data
  const destinations = [
    { id: 1, name: 'صحن انقلاب', location: 'حرم مطهر امام رضا عليه السلام، صحن انقلاب' },
    { id: 2, name: 'ایوان طلا', location: 'حرم مطهر امام رضا عليه السلام، بین طبرسی و ...' },
    { id: 3, name: 'رواق حضرت معصومه «س»', location: 'حرم مطهر امام رضا عليه السلام، صحن آیت الله ...' },
    { id: 4, name: 'مسجد جامع گوهرشاد', location: 'حرم مطهر امام رضا عليه السلام، صحن گوهرشاد' },
    { id: 5, name: 'صحن پیامبر اعظم', location: 'حرم مطهر امام رضا عليه السلام، صحن پیامبر...' }
  ];

  const filteredDestinations = destinations.filter(dest =>
    dest.name.includes(searchQuery) || dest.location.includes(searchQuery)
  );

  const handleDestinationSelect = (destination) => {
    if (activeInput === 'destination') {
      setSelectedDestination(destination);
      setShowDestinationModal(false);
    } else {
      setUserLocation(destination.name);
      setShowOriginModal(false);
    }
    setSearchQuery('');

    // Check if both origin and destination are selected
    if ((activeInput === 'destination' && userLocation !== 'باب الرضا «ع»') ||
      (activeInput === 'origin' && selectedDestination)) {
      navigate('/fs');
    }
  };

  const handleInputChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSwapLocations = () => {
    // Add rotation animation to swap button
    if (swapButtonRef.current) {
      swapButtonRef.current.classList.add('rotate');
      setTimeout(() => {
        if (swapButtonRef.current) {
          swapButtonRef.current.classList.remove('rotate');
        }
      }, 500);
    }

    setIsSwapped(!isSwapped);
  };

  const handleInputClick = (inputType) => {
    setActiveInput(inputType);
    if (inputType === 'destination') {
      setShowDestinationModal(true);
    } else {
      setShowOriginModal(true);
      // Check if GPS is enabled
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          () => setIsGPSEnabled(true),
          () => setIsGPSEnabled(false)
        );
      }
    }
  };

  const handleCurrentLocationSelect = () => {
    setShowOriginModal(false);
  };

  const handleMapSelection = () => {
    if (activeInput === 'destination') {
      setShowDestinationModal(false);
    } else {
      setShowOriginModal(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
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

  return (
    <div className="map-routing-page">
      {/* Header */}
      <header className="map-routing-header">
        <button className="map-back-button" onClick={() => navigate(-1)}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-arrow-narrow-right"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M5 12l14 0" /><path d="M15 16l4 -4" /><path d="M15 8l4 4" /></svg>
        </button>
        <h1 className="map-header-title">مسیریابی حرم مطهر</h1>
        <button className="map-profile-button" onClick={() => navigate('/Profile')}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="icon icon-tabler icons-tabler-filled icon-tabler-user"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M12 2a5 5 0 1 1 -5 5l.005 -.217a5 5 0 0 1 4.995 -4.783z" /><path d="M14 14a5 5 0 0 1 5 5v1a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-1a5 5 0 0 1 5 -5h4z" /></svg>
        </button>
        <div className="headers-gradient"></div>
      </header>

      {/* Categories Scroll */}
      <div className="map-categories-scroll">
        <div className="map-categories-list">
          {categories.map((category, index) => (
            <div key={index} className="map-category-item">
              <div className={`map-category-icon ${category.icon}`}>
                {category.svg}
              </div>
              <span className="map-category-name">{category.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Map Container */}
      <div className="map-routing-container">
        <MapComponent
          setUserLocation={setUserLocation}
          selectedDestination={selectedDestination}
          isSwapped={isSwapped}
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

      {/* Destination Input - Only shown when modal is NOT open */}
      {!showDestinationModal && !showOriginModal && (
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

            {/* Conditionally render inputs based on swap state */}
            {isSwapped ? (
              <>
                {/* Destination Input (top when swapped) */}
                <div
                  className="map-destination-input-wrapper"
                  onClick={() => handleInputClick('destination')}
                >
                  <input
                    type="text"
                    placeholder="مقصد را انتخاب کنید"
                    value={selectedDestination ? selectedDestination.name : ''}
                    readOnly
                  />
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

                {/* Origin Input (bottom when swapped) */}
                <div
                  className={`map-current-location ${isSwapped ? 'swapped' : ''}`}
                  onClick={() => handleInputClick('origin')}
                >
                  <div className="map-location-text">
                    <span className="map-location-name">
                      {userLocation}
                    </span>
                    <span className="map-location-label">
                      مبداء فعلی شما
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Origin Input (top when not swapped) */}
                <div
                  className={`map-current-location ${isSwapped ? 'swapped' : ''}`}
                  onClick={() => handleInputClick('origin')}
                >
                  <div className="map-location-text">
                    <span className="map-location-name">
                      {userLocation}
                    </span>
                    <span className="map-location-label">
                      مبداء فعلی شما
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

                {/* Destination Input (bottom when not swapped) */}
                <div
                  className="map-destination-input-wrapper"
                  onClick={() => handleInputClick('destination')}
                >
                  <input
                    type="text"
                    placeholder="مقصد را انتخاب کنید"
                    value={selectedDestination ? selectedDestination.name : ''}
                    readOnly
                  />
                </div>
              </>
            )}
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
                placeholder={activeInput === 'destination' ? "جستجوی مقصد" : "جستجوی مبدا"}
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
                <span className="map-option-text">انتخاب از روی نقشه</span>
              </div>
              {isGPSEnabled && activeInput === 'origin' && (
                <div className="map-option-item" onClick={handleCurrentLocationSelect}>
                  <div className="map-option-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1E90FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-current-location"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" /><path d="M12 12m-8 0a8 8 0 1 0 16 0a8 8 0 1 0 -16 0" /><path d="M12 2l0 2" /><path d="M12 20l0 2" /><path d="M20 12l2 0" /><path d="M2 12l2 0" /></svg>
                  </div>
                  <span className="map-option-text">مکان فعلی شما ({userLocation})</span>
                </div>
              )}
            </div>
          )}

          {!searchQuery && (
            <>
              <h2 className="map-recent-title">جستوجوهای اخیر شما</h2>
              <ul className="map-destination-list">
                {destinations.map((destination) => (
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
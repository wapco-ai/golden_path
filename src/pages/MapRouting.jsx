import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MapComponent from '../components/map/MapComponent';
import '../styles/MapRouting.css';

const MapRoutingPage = () => {
  const navigate = useNavigate();
  const [showDestinationModal, setShowDestinationModal] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [userLocation, setUserLocation] = useState('باب الرضا «ع»');
  const [searchQuery, setSearchQuery] = useState('');
  const destinationInputRef = useRef(null);
  const modalRef = useRef(null);
  const searchInputRef = useRef(null);

  // Categories data
  const categories = [
    { 
      name: 'باب‌های حرم',
      icon: 'door',
      svg: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-door"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M14 12v.01" /><path d="M3 21h18" /><path d="M6 21v-16a2 2 0 0 1 2 -2h8a2 2 0 0 1 2 2v16" /></svg>
    },
    {
      name: 'صحن‌ها',
      icon: 'courtyard',
      svg: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-door"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M14 12v.01" /><path d="M3 21h18" /><path d="M6 21v-16a2 2 0 0 1 2 -2h8a2 2 0 0 1 2 2v16" /></svg>
    },
    {
      name: 'رواق‌ها',
      icon: 'shrine',
      svg: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-door"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M14 12v.01" /><path d="M3 21h18" /><path d="M6 21v-16a2 2 0 0 1 2 -2h8a2 2 0 0 1 2 2v16" /></svg>
    },
    {
      name: 'کفشداری‌ها',
      icon: 'shoe',
      svg: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-flip-flops"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M18 4c2.21 0 4 1.682 4 3.758c0 .078 0 .156 -.008 .234l-.6 9.014c-.11 1.683 -1.596 3 -3.392 3s-3.28 -1.311 -3.392 -3l-.6 -9.014c-.138 -2.071 1.538 -3.855 3.743 -3.985a4.15 4.15 0 0 1 .25 -.007z" /><path d="M16 8h1.5c1.38 0 2.5 1.045 2.5 2.333v2.334c0 1.288 -1.12 2.333 -2.5 2.333h-1.5" /><path d="M6 4c2.21 0 4 1.682 4 3.758c0 .078 0 .156 -.008 .234l-.6 9.014c-.11 1.683 -1.596 3 -3.392 3s-3.28 -1.311 -3.392 -3l-.6 -9.014c-.138 -2.071 1.538 -3.855 3.742 -3.985c.084 0 .167 -.007 .25 -.007z" /><path d="M2.5 14c1 -3.333 2.167 -5 3.5 -5c1.333 0 2.5 1.667 3.5 5" /><path d="M13 8l2 0" /><path d="M13 12l2 0" /></svg>
    },
    {
      name: 'محل اسکن‌کد',
      icon: 'qr-code',
      svg: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-object-scan"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M4 8v-2a2 2 0 0 1 2 -2h2" /><path d="M4 16v2a2 2 0 0 0 2 2h2" /><path d="M16 4h2a2 2 0 0 1 2 2v2" /><path d="M16 20h2a2 2 0 0 0 2 -2v-2" /><path d="M8 8m0 2a2 2 0 0 1 2 -2h4a2 2 0 0 1 2 2v4a2 2 0 0 1 -2 2h-4a2 2 0 0 1 -2 -2z" /></svg>
    },
    {
      name: 'چایخانه‌ها',
      icon: 'tea',
      svg: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-mug"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M4.083 5h10.834a1.08 1.08 0 0 1 1.083 1.077v8.615c0 2.38 -1.94 4.308 -4.333 4.308h-4.334c-2.393 0 -4.333 -1.929 -4.333 -4.308v-8.615a1.08 1.08 0 0 1 1.083 -1.077" /><path d="M16 8h2.5c1 0 2.5 1.045 2.5 2.333v2.334c0 1.288 -1.12 2.333 -2.5 2.333h-1.5" /></svg>
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
    setSelectedDestination(destination);
    setShowDestinationModal(false);
    if (destinationInputRef.current) {
      destinationInputRef.current.value = destination.name;
    }
  };

  const handleInputChange = (e) => {
    setSearchQuery(e.target.value);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setShowDestinationModal(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (showDestinationModal && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showDestinationModal]);

  return (
    <div className="map-routing-page">
      {/* Header */}
      <header className="map-routing-header">
        <button className="map-back-button" onClick={() => navigate(-1)}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-arrow-narrow-right"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 12l14 0" /><path d="M15 16l4 -4" /><path d="M15 8l4 4" /></svg>
        </button>
        <h1 className="map-header-title">مسیریابی حرم مطهر</h1>
        <button className="map-profile-button" onClick={() => navigate('/Profile')}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="icon icon-tabler icons-tabler-filled icon-tabler-user"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 2a5 5 0 1 1 -5 5l.005 -.217a5 5 0 0 1 4.995 -4.783z" /><path d="M14 14a5 5 0 0 1 5 5v1a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-1a5 5 0 0 1 5 -5h4z" /></svg>
        </button>
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
        <MapComponent setUserLocation={setUserLocation} selectedDestination={selectedDestination} />
        <button className="map-gps-button">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
            <path d="M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0"/>
            <path d="M12 12m-8 0a8 8 0 1 0 16 0a8 8 0 1 0 -16 0"/>
            <path d="M12 2l0 2"/>
            <path d="M12 20l0 2"/>
            <path d="M20 12l2 0"/>
            <path d="M2 12l2 0"/>
          </svg>
        </button>
      </div>

      {/* Destination Input */}
      <div className={`map-destination-input-container ${showDestinationModal ? 'expanded' : ''}`} ref={modalRef}>
        <div className="map-current-location">
          <div className="map-location-circle"></div>
          <div className="map-location-text">
            <span className="map-location-name">{userLocation}</span>
            <span className="map-location-label">مبداء فعلی شما</span>
          </div>
          {showDestinationModal && (
            <button className="map-modal-back-button" onClick={() => setShowDestinationModal(false)}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                <path d="M15 6l-6 6l6 6"/>
              </svg>
            </button>
          )}
        </div>

        <div className="map-destination-input-wrapper">
          <div className="map-destination-input" onClick={() => setShowDestinationModal(true)}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="icon icon-tabler icons-tabler-filled icon-tabler-map-pin">
              <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
              <path d="M18.364 4.636a9 9 0 0 1 .203 12.519l-.203 .21l-4.243 4.242a3 3 0 0 1 -4.097 .135l-.144 -.135l-4.244 -4.243a9 9 0 0 1 12.728 -12.728zm-6.364 3.364a3 3 0 1 0 0 6a3 3 0 0 0 0 -6z" />
            </svg>
            <input
              type="text"
              placeholder="مقصد را انتخاب کنید"
              ref={destinationInputRef}
              onChange={handleInputChange}
              value={searchQuery}
              className="destination-input"
            />
          </div>
          <button className="map-swap-button">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-arrows-sort">
              <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
              <path d="M3 9l4 -4l4 4m-4 -4v14" />
              <path d="M21 15l-4 4l-4 -4m4 4v-14" />
            </svg>
          </button>
        </div>

        {/* Search Results */}
        {showDestinationModal && (
          <div className="map-search-results">
            <h2 className="map-recent-title">جستوجوهای اخیر شما</h2>
            <ul className="map-destination-list">
              {filteredDestinations.map((destination) => (
                <li key={destination.id} onClick={() => handleDestinationSelect(destination)}>
                  <div className="map-destination-info">
                    <span className="map-destination-name">{destination.name}</span>
                    <span className="map-destination-location">{destination.location}</span>
                  </div>
                  <button className="map-recent-option">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-dots-vertical"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /><path d="M12 19m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /><path d="M12 5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /></svg>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapRoutingPage;
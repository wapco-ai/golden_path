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
    { name: 'چاپخانه‌ها', icon: 'printer' },
    { name: 'باب‌های حرم', icon: 'door' },
    { name: 'محل اسکن کد', icon: 'qr-code' },
    { name: 'کفشداری‌ها', icon: 'shoe' },
    { name: 'رواق‌ها', icon: 'shrine' },
    { name: 'صحن‌ها', icon: 'courtyard' },
    { name: 'چایخانه‌ها', icon: 'tea' },
    { name: 'سرویس بهداشتی', icon: 'toilet' }
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
      <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-arrow-narrow-right"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 12l14 0" /><path d="M15 16l4 -4" /><path d="M15 8l4 4" /></svg>
        </button>
        <h1 className="map-header-title">مسیریابی حرم مطهر</h1>
        <button className="map-profile-button" onClick={() => navigate('/Profile')}>
        <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="currentColor"  class="icon icon-tabler icons-tabler-filled icon-tabler-user"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 2a5 5 0 1 1 -5 5l.005 -.217a5 5 0 0 1 4.995 -4.783z" /><path d="M14 14a5 5 0 0 1 5 5v1a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-1a5 5 0 0 1 5 -5h4z" /></svg>
        </button>
      </header>

      {/* Categories Scroll */}
      <div className="map-categories-scroll">
        <div className="map-categories-list">
          {categories.map((category, index) => (
            <div key={index} className="map-category-item">
              <div className={`map-category-icon ${category.icon}`}>
                <IconComponent name={category.icon} />
              </div>
              <span className="map-category-name">{category.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Map Container */}
      <div className="map-routing-container">
        <MapComponent setUserLocation={setUserLocation} />
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
      <div className="map-destination-input-container">
        <div className="map-current-location">
          <div className="map-location-circle"></div>
          <span className="map-location-name">{userLocation}</span>
          <span className="map-location-label">مکان فعلی شما</span>
        </div>
        <div className="map-destination-input" onClick={() => setShowDestinationModal(true)}>
          <input
            type="text"
            placeholder="مقصد را انتخاب کنید"
            ref={destinationInputRef}
            readOnly
          />
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
            <path d="M15 6l-6 6l6 6"/>
          </svg>
        </div>
      </div>

      {/* Destination Modal */}
      {showDestinationModal && (
        <div className="map-destination-modal-overlay">
          <div className="map-destination-modal" ref={modalRef}>
            <div className="map-modal-header">
              <button className="map-modal-back-button" onClick={() => setShowDestinationModal(false)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                  <path d="M15 6l-6 6l6 6"/>
                </svg>
              </button>
            </div>

            <div className="map-destination-input-container map-modal-input">
              <div className="map-current-location">
                <span className="map-location-label" style={{ color: '#4285F4' }}>مکان فعلی شما</span>
                <span className="map-location-name">{userLocation}</span>
              </div>
              <div className="map-destination-input">
                <input
                  type="text"
                  placeholder="مقصد را انتخاب کنید"
                  ref={searchInputRef}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="map-recent-searches">
              <h4 className="map-recent-title">نتایج جستجو</h4>
              <ul className="map-destination-list">
                {filteredDestinations.map((destination) => (
                  <li key={destination.id} onClick={() => handleDestinationSelect(destination)}>
                    <div className="map-destination-info">
                      <span className="map-destination-name">{destination.name}</span>
                      <span className="map-destination-location">{destination.location}</span>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                      <path d="M15 6l-6 6l6 6"/>
                    </svg>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Icon component
const IconComponent = ({ name }) => {
  switch (name) {
    case 'door':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
          <path d="M14 12v.01"/>
          <path d="M3 21h18"/>
          <path d="M6 21v-16a2 2 0 0 1 2 -2h8a2 2 0 0 1 2 2v16"/>
        </svg>
      );
    case 'qr-code':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
          <rect x="4" y="4" width="6" height="6" rx="1"/>
          <line x1="7" y1="17" x2="7" y2="17.01"/>
          <rect x="14" y="4" width="6" height="6" rx="1"/>
          <line x1="7" y1="7" x2="7" y2="7.01"/>
          <rect x="4" y="14" width="6" height="6" rx="1"/>
          <line x1="17" y1="7" x2="17" y2="7.01"/>
          <line x1="14" y1="14" x2="17" y2="14"/>
          <line x1="20" y1="14" x2="20" y2="14.01"/>
          <line x1="14" y1="14" x2="14" y2="17"/>
          <line x1="14" y1="20" x2="17" y2="20"/>
          <line x1="17" y1="17" x2="20" y2="17"/>
          <line x1="20" y1="17" x2="20" y2="20"/>
        </svg>
      );
    // Add other icons as needed
    default:
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
          <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0"/>
        </svg>
      );
  }
};

export default MapRoutingPage;
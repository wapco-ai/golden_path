import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MapComponent from '../components/map/MapComponent';
import DestinationList from '../components/map/DestinationList';
import '../styles/MapRouting.css';

const MapRouting = () => {
  const navigate = useNavigate();
  const [showDestinationList, setShowDestinationList] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [destination, setDestination] = useState(null);

  // Categories data (you can move this to a separate file if needed)
  const categories = [
    // ... (paste all your categories array here)
  ];

  const handleBack = () => {
    navigate('/location');
  };

  const handleSelectDestination = () => {
    setShowDestinationList(true);
  };

  const handleDestinationSelected = (selectedDestination) => {
    setDestination(selectedDestination);
    setShowDestinationList(false);
    // Here you would also update the map route
  };

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          // Fallback to a default location (e.g., Imam Reza shrine coordinates)
          setCurrentLocation({
            lat: 36.2880,
            lng: 59.6157
          });
        }
      );
    }
  }, []);

  return (
    <div className="map-routing-container">
      {/* Header with back button and profile icon */}
      <div className="fixed-header-icons">
        <button className="back-button" onClick={handleBack}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
            <path d="M9 14l-4 -4l4 -4" />
            <path d="M5 10h11a4 4 0 1 1 0 8h-1" />
          </svg>
        </button>
        <button className="profile-icon" onClick={() => navigate('/Profile')}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
            <path d="M12 2a5 5 0 1 1 -5 5l.005 -.217a5 5 0 0 1 4.995 -4.783z" />
            <path d="M14 14a5 5 0 0 1 5 5v1a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-1a5 5 0 0 1 5 -5h4z" />
          </svg>
        </button>
      </div>

      {/* Categories horizontal scroll */}
      <div className="categories-container">
        <div className="categories-scroll">
          {categories.map((category, index) => (
            <div key={index} className="category-item">
              <div className="category-icon">{category.icon}</div>
              <span className="category-name">{category.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Map Component */}
      {currentLocation && (
        <MapComponent 
          currentLocation={currentLocation} 
          destination={destination}
        />
      )}

      {/* GPS Center Button */}
      <button className="gps-button">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
          <circle cx="12" cy="12" r=".5" fill="currentColor" />
          <path d="M12 12m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" />
          <path d="M12 3l0 2" />
          <path d="M3 12l2 0" />
          <path d="M12 19l0 2" />
          <path d="M19 12l2 0" />
        </svg>
      </button>

      {/* Bottom panel */}
      <div className={`bottom-panel ${showDestinationList ? 'expanded' : ''}`}>
        {!showDestinationList ? (
          <>
            <div className="current-location">
              <span>مکان فعلی شما</span>
              <p>{currentLocation ? "در حال دریافت موقعیت..." : "موقعیت شما"}</p>
            </div>
            <div className="destination-selector" onClick={handleSelectDestination}>
              <span>1- مقصد را انتخاب کنید</span>
            </div>
          </>
        ) : (
          <DestinationList 
            onSelect={handleDestinationSelected}
            onClose={() => setShowDestinationList(false)}
          />
        )}
      </div>
    </div>
  );
};

export default MapRouting;
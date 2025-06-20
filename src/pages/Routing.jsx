import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import RouteMap from '../components/map/RouteMap';
import '../styles/Routing.css';

const RoutingPage = () => {
  const [isMapModalOpen, setIsMapModalOpen] = useState(true);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(true);
  const [routeData, setRouteData] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [userLocation, setUserLocation] = useState([36.2880, 59.6157]);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [showSoundModal, setShowSoundModal] = useState(false);
  const [selectedEmergency, setSelectedEmergency] = useState(null);
  const [selectedSoundOption, setSelectedSoundOption] = useState('روشن');
  const [isRoutingActive, setIsRoutingActive] = useState(false);
  const [isClosingEmergency, setIsClosingEmergency] = useState(false);
  const [isClosingSound, setIsClosingSound] = useState(false);
  const [showAllRoutesView, setShowAllRoutesView] = useState(false);
  const navigate = useNavigate();

  // Calculate total time in minutes from all steps
  const calculateTotalTime = (steps) => {
    if (!steps) return 0;

    let totalMinutes = 0;
    steps.forEach(step => {
      const timeStr = step.time;
      if (timeStr.includes('دقیقه')) {
        totalMinutes += parseInt(timeStr.split(' ')[0]);
      } else if (timeStr.includes('ثانیه')) {
        totalMinutes += Math.ceil(parseInt(timeStr.split(' ')[0]) / 60);
      }
    });

    return totalMinutes;
  };

  // Format total time as "X دقیقه Y ثانیه"
  const formatTotalTime = (totalMinutes) => {
    if (totalMinutes < 1) {
      const seconds = totalMinutes * 60;
      return `${Math.round(seconds)} ثانیه`;
    }
    const minutes = Math.floor(totalMinutes);
    const seconds = Math.round((totalMinutes - minutes) * 60);

    if (seconds > 0) {
      return `${minutes} دقیقه ${seconds} ثانیه`;
    }
    return `${minutes} دقیقه`;
  };

  // Calculate arrival time in HH:MM format with AM/PM indicator
  const calculateArrivalTime = (totalMinutes) => {
    const now = new Date();
    const arrival = new Date(now.getTime() + totalMinutes * 60000);

    let hours = arrival.getHours();
    const minutes = arrival.getMinutes().toString().padStart(2, '0');

    hours = hours % 12;
    hours = hours ? hours : 12;

    return `${hours}:${minutes}`;
  };

  // Load route data from JSON
  useEffect(() => {
    fetch('./data/routeData.json')
      .then(response => response.json())
      .then(data => {
        const steps = data.route.steps;
        const totalMinutes = calculateTotalTime(steps);
        const formattedTotalTime = formatTotalTime(totalMinutes);
        const arrivalTime = calculateArrivalTime(totalMinutes);

        setRouteData({
          ...data.route,
          totalTime: formattedTotalTime,
          arrivalTime: arrivalTime
        });
      })
      .catch(error => console.error('Error loading route data:', error));
  }, []);

  // Update arrival time every minute
  useEffect(() => {
    if (!routeData) return;

    const timer = setInterval(() => {
      const totalMinutes = calculateTotalTime(routeData.steps);
      const arrivalTime = calculateArrivalTime(totalMinutes);

      setRouteData(prev => ({
        ...prev,
        arrivalTime: arrivalTime
      }));
    }, 60000);

    return () => clearInterval(timer);
  }, [routeData]);

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      };

      const success = (position) => {
        setUserLocation([position.coords.latitude, position.coords.longitude]);
      };

      const error = (err) => {
        console.warn(`ERROR(${err.code}): ${err.message}`);
        setUserLocation([36.2880, 59.6157]);
      };

      const watchId = navigator.geolocation.watchPosition(success, error, options);

      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  // Auto-advance steps when routing is active
  useEffect(() => {
    if (!routeData || !isRoutingActive) return;

    const timer = setInterval(() => {
      if (currentStep < routeData.steps.length - 1) {
        setCurrentStep(prev => prev + 1);
      } else {
        setIsRoutingActive(false);
      }
    }, 30000);

    return () => clearInterval(timer);
  }, [currentStep, routeData, isRoutingActive]);

  const toggleMapModal = () => {
    setIsMapModalOpen(!isMapModalOpen);
  };

  const toggleInfoModal = () => {
    setIsInfoModalOpen(!isInfoModalOpen);
  };

  const toggleEmergencyModal = () => {
    if (showEmergencyModal) {
      setIsClosingEmergency(true);
      setTimeout(() => {
        setShowEmergencyModal(false);
        setIsClosingEmergency(false);
      }, 300);
    } else {
      setShowEmergencyModal(true);
      if (showSoundModal) {
        setIsClosingSound(true);
        setTimeout(() => {
          setShowSoundModal(false);
          setIsClosingSound(false);
        }, 300);
      }
    }
  };

  const toggleSoundModal = () => {
    if (showSoundModal) {
      setIsClosingSound(true);
      setTimeout(() => {
        setShowSoundModal(false);
        setIsClosingSound(false);
      }, 300);
    } else {
      setShowSoundModal(true);
      if (showEmergencyModal) {
        setIsClosingEmergency(true);
        setTimeout(() => {
          setShowEmergencyModal(false);
          setIsClosingEmergency(false);
        }, 300);
      }
    }
  };

  const toggleRouting = () => {
    setIsRoutingActive(!isRoutingActive);
    if (!isRoutingActive && currentStep >= routeData?.steps?.length - 1) {
      setCurrentStep(0);
    }
  };

  const handleEmergencySelect = (type) => {
    setSelectedEmergency(type);
  };

  const handleSoundOptionSelect = (option) => {
    setSelectedSoundOption(option);
  };

  const handleAllRoutesClick = () => {
    setShowAllRoutesView(true);
    setIsInfoModalOpen(true); // Ensure info modal is open when showing all routes
  };

  const handleReturnToRoute = () => {
    setShowAllRoutesView(false);
  };

  const renderDirectionArrow = (direction) => {
    switch (direction) {
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
        return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#e74c3c" className="icon icon-tabler icons-tabler-filled icon-tabler-map-pin"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M18.364 4.636a9 9 0 0 1 .203 12.519l-.203 .21l-4.243 4.242a3 3 0 0 1 -4.097 .135l-.144 -.135l-4.244 -4.243a9 9 0 0 1 12.728 -12.728zm-6.364 3.364a3 3 0 1 0 0 6a3 3 0 0 0 0 -6z" /></svg>;
      default:
        return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-arrow-narrow-right"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M5 12l14 0" /><path d="M15 16l4 -4" /><path d="M15 8l4 4" /></svg>;
    }
  };

  if (!routeData) {
    return <div className="loading">در حال بارگذاری...</div>;
  }

  return (
    <div className="routing-page">
      {/* Separate overlay for info modal */}
      {isInfoModalOpen && isMapModalOpen && !showAllRoutesView && (
        <div className="info-modal-overlay" onClick={toggleInfoModal} />
      )}

      {/* Existing overlay for other modals */}
      {(showEmergencyModal || showSoundModal) && (
        <div className="modal-overlay" onClick={() => {
          if (showEmergencyModal) toggleEmergencyModal();
          if (showSoundModal) toggleSoundModal();
        }} />
      )}

      {/* Emergency Modal */}
      {(showEmergencyModal || isClosingEmergency) && (
        <div className={`emergency-modal ${isClosingEmergency ? 'closing' : ''}`}>
          <div className="modal-toggle2 emergency-toggle" onClick={toggleEmergencyModal}>
            <div className="toggle-handle2"></div>
          </div>
          <div className="emergency-modal-content">
            <h3 className="emergency-modal-title">درخواست کمک‌های فوریتی حرم مطهر</h3>
            <p className="emergency-modal-subtitle">
              لطفا نوع درخواست خود را انتخاب کنید و توضیحاتی<br />
              درباره آن بنویسید. در سریع‌ترین زمان ممکن خادمین<br />
              به مکان شما خواهند رسید.
            </p>

            <div className="emergency-options">
              <button
                className={`emergency-option ${selectedEmergency === 'fire' ? 'selected' : ''}`}
                onClick={() => handleEmergencySelect('fire')}
              >
                اعلام حریق
              </button>
              <button
                className={`emergency-option ${selectedEmergency === 'theft' ? 'selected' : ''}`}
                onClick={() => handleEmergencySelect('theft')}
              >
                اعلام سرقت
              </button>
              <button
                className={`emergency-option ${selectedEmergency === 'medical' ? 'selected' : ''}`}
                onClick={() => handleEmergencySelect('medical')}
              >
                درخواست خدمات پزشکی
              </button>
              <button
                className={`emergency-option ${selectedEmergency === 'missing' ? 'selected' : ''}`}
                onClick={() => handleEmergencySelect('missing')}
              >
                اعلام مفقودی
              </button>
            </div>

            <div className="emergency-description">
              <textarea placeholder="توضیحات بیشتر..." className="emergency-textarea" />
            </div>

            <button className="emergency-submit-button">
              تایید و ارسال درخواست
            </button>
          </div>
        </div>
      )}

      {/* Sound Settings Modal */}
      {(showSoundModal || isClosingSound) && (
        <div className={`sound-modal ${isClosingSound ? 'closing' : ''}`}>
          <div className="modal-toggle2 sound-toggle" onClick={toggleSoundModal}>
            <div className="toggle-handle2"></div>
          </div>
          <div className="sound-modal-content">
            <h3 className="sound-modal-title">تنظیمات صدا</h3>
            <div className="sound-options">
              <div className="option-box">
                <button
                  className={`sound-option ${selectedSoundOption === 'روشن' ? 'selected' : ''}`}
                  onClick={() => handleSoundOptionSelect('روشن')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-volume"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M15 8a5 5 0 0 1 0 8" /><path d="M17.7 5a9 9 0 0 1 0 14" /><path d="M6 15h-2a1 1 0 0 1 -1 -1v-4a1 1 0 0 1 1 -1h2l3.5 -4.5a.8 .8 0 0 1 1.5 .5v14a.8 .8 0 0 1 -1.5 .5l-3.5 -4.5" /></svg>
                </button>
                <span className={`option-text ${selectedSoundOption === 'روشن' ? 'selected' : ''}`}>
                  روشن
                </span>
              </div>
              <div className="option-box">
                <button
                  className={`sound-option ${selectedSoundOption === 'فقط هشدار' ? 'selected' : ''}`}
                  onClick={() => handleSoundOptionSelect('فقط هشدار')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-alert-triangle"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M12 9v4" /><path d="M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636 -2.87l-8.106 -13.536a1.914 1.914 0 0 0 -3.274 0z" /><path d="M12 16h.01" /></svg>
                </button>
                <span className={`option-text ${selectedSoundOption === 'فقط هشدار' ? 'selected' : ''}`}>
                  فقط هشدار
                </span>
              </div>
              <div className="option-box">
                <button
                  className={`sound-option ${selectedSoundOption === 'خاموش' ? 'selected' : ''}`}
                  onClick={() => handleSoundOptionSelect('خاموش')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-volume-off"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M15 8a5 5 0 0 1 1.912 4.934m-1.377 2.602a5 5 0 0 1 -.535 .464" /><path d="M17.7 5a9 9 0 0 1 2.362 11.086m-1.676 2.299a9 9 0 0 1 -.686 .615" /><path d="M9.069 5.054l.431 -.554a.8 .8 0 0 1 1.5 .5v2m0 4v8a.8 .8 0 0 1 -1.5 .5l-3.5 -4.5h-2a1 1 0 0 1 -1 -1v-4a1 1 0 0 1 1 -1h2l1.294 -1.664" /><path d="M3 3l18 18" /></svg>
                </button>
                <span className={`option-text ${selectedSoundOption === 'خاموش' ? 'selected' : ''}`}>
                  خاموش
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Guide Text Layer */}
      <div className="guide-text-layer">
        {routeData.steps.map((step, index) => (
          <div
            key={step.id}
            className={`guide-step ${index === currentStep ? 'active' : ''}`}
            style={{
              display: index < currentStep ? 'none' : 'block',
              order: index === currentStep ? -1 : index
            }}
          >
            <div className="step-header">
              <div className="step-distance-container">
                <span className="direction-icon">
                  {renderDirectionArrow(step.direction)}
                </span>
                <span className="step-distance">{step.distance}</span>
              </div>
              <span className="step-time">{step.time}</span>
            </div>
            <p className="step-instruction">{step.instruction}</p>
            {index < routeData.steps.length - 1 && <hr className="step-divider" />}
          </div>
        ))}
      </div>

      {/* Map Modal with faded line when closed */}
      <div className={`map-modal ${isMapModalOpen ? 'open' : 'closed'}`}>
        <div className="modal-toggle map-toggle" onClick={toggleMapModal}>
          <div className="toggle-handle"></div>
        </div>

        {isMapModalOpen && (
          <div className={`map-container ${isMapModalOpen ? 'open' : 'closed'} ${isInfoModalOpen ? 'dark-overlay' : ''}`}>
            <RouteMap
              userLocation={userLocation}
              routeSteps={routeData.steps}
              currentStep={currentStep}
              isInfoModalOpen={isInfoModalOpen}
            />

            {/* Emergency Button */}
          </div>
        )}
        <button className="emergency-button" onClick={toggleEmergencyModal}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="icon icon-tabler icons-tabler-filled icon-tabler-alert-triangle"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M12 1.67c.955 0 1.845 .467 2.39 1.247l.105 .16l8.114 13.548a2.914 2.914 0 0 1 -2.307 4.363l-.195 .008h-16.225a2.914 2.914 0 0 1 -2.582 -4.2l.099 -.185l8.11 -13.538a2.914 2.914 0 0 1 2.491 -1.403zm.01 13.33l-.127 .007a1 1 0 0 0 0 1.986l.117 .007l.127 -.007a1 1 0 0 0 0 -1.986l-.117 -.007zm-.01 -7a1 1 0 0 0 -.993 .883l-.007 .117v4l.007 .117a1 1 0 0 0 1.986 0l.007 -.117v-4l-.007 -.117a1 1 0 0 0 -.993 -.883z" /></svg>
          <span>فوریت‌های حرم</span>
        </button>

        {/* Info Modal - Only visible when map modal is open */}
        <div className={`info-modal-wrapper ${isMapModalOpen ? 'visible' : 'hidden'}`}>
          {showAllRoutesView ? (
            <div className={`map-container ${isMapModalOpen ? 'open' : 'closed'} ${isInfoModalOpen ? 'dark-overlay' : ''}`}>
              <div className="all-routes-content">
                <div className="all-routes-header">
                  <div className="all-routes-info">
                    <span>زمان رسیدن</span>
                    <span className="all-routes-arrival-time">{routeData.arrivalTime}</span>
                  </div>
                  <div className="all-routes-details">
                    <div className="all-routes-item">
                      <div className="all-routes-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-walk"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M13 4m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /><path d="M7 21l3 -4" /><path d="M16 21l-2 -4l-3 -3l1 -6" /><path d="M6 12l2 -3l4 -1l3 3l3 1" /></svg>
                      </div>
                      <div className="all-routes-text">
                        <span className="all-routes-value">{routeData.totalTime}</span>
                      </div>
                    </div>
                    <div className="all-routes-item">
                      <div className="all-routes-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-route"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M3 19a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" /><path d="M19 7a2 2 0 1 0 0 -4a2 2 0 0 0 0 4z" /><path d="M11 19h5.5a3.5 3.5 0 0 0 0 -7h-8a3.5 3.5 0 0 1 0 -7h4.5" /></svg>
                      </div>
                      <div className="all-routes-text">
                        <span className="all-routes-value">{routeData.totalDistance}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <button className="return-to-route-button2" onClick={handleReturnToRoute}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                    <path d="M11.092 2.581a1 1 0 0 1 1.754 -.116l.062 .116l8.005 17.365c.198 .566 .05 1.196 -.378 1.615a1.53 1.53 0 0 1 -1.459 .393l-7.077 -2.398l-6.899 2.338a1.535 1.535 0 0 1 -1.52 -.231l-.112 -.1c-.398 -.386 -.556 -.954 -.393 -1.556l.047 -.15l7.97 -17.276z" />
                  </svg>
                  <span className="return-to-route-text">برگرد به مسیر</span>
                </button>
              </div>
            </div>
          ) : (
            <div className={`info-modal ${isInfoModalOpen ? 'open' : 'closed'}`}>
              <div className="modal-toggle info-toggle" onClick={toggleInfoModal}>
                <div className="toggle-handle"></div>
              </div>

              <div className="info-content">
                <div className="info-header">
                  <button className="close-button" onClick={toggleInfoModal}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-x"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M18 6l-12 12" /><path d="M6 6l12 12" /></svg>
                  </button>
                  <div className="info-title">
                    <div className="info-stat">
                      <span>زمان رسیدن</span>
                      <span className="arrival-time">{routeData.arrivalTime}</span>
                    </div>
                    <div className="info-details">
                      <div className="info-item">
                        <div className="info-icon">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-walk"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M13 4m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /><path d="M7 21l3 -4" /><path d="M16 21l-2 -4l-3 -3l1 -6" /><path d="M6 12l2 -3l4 -1l3 3l3 1" /></svg>
                        </div>
                        <div className="info-text">
                          <span className="info-value">{routeData.totalTime}</span>
                        </div>
                      </div>

                      <div className="info-item">
                        <div className="info-icon">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-route"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M3 19a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" /><path d="M19 7a2 2 0 1 0 0 -4a2 2 0 0 0 0 4z" /><path d="M11 19h5.5a3.5 3.5 0 0 0 0 -7h-8a3.5 3.5 0 0 1 0 -7h4.5" /></svg>
                        </div>
                        <div className="info-text">
                          <span className="info-value">{routeData.totalDistance}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button className="sound-button" onClick={toggleSoundModal}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-volume"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M15 8a5 5 0 0 1 0 8" /><path d="M17.7 5a9 9 0 0 1 0 14" /><path d="M6 15h-2a1 1 0 0 1 -1 -1v-4a1 1 0 0 1 1 -1h2l3.5 -4.5a.8 .8 0 0 1 1.5 .5v14a.8 .8 0 0 1 -1.5 .5l-3.5 -4.5" /></svg>
                  </button>
                </div>
              </div>

              {isInfoModalOpen && (
                <>
                  <div className="route-buttons">
                    <button className="route-button" onClick={() => navigate('/rop')}>
                      <div className="button-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-route"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M3 19a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" /><path d="M19 7a2 2 0 1 0 0 -4a2 2 0 0 0 0 4z" /><path d="M11 19h5.5a3.5 3.5 0 0 0 0 -7h-8a3.5 3.5 0 0 1 0 -7h4.5" /></svg>
                      </div>
                      <span>مسیر در یک نگاه</span>
                    </button>
                    <span className="sdivider"></span>
                    <button className="route-button" onClick={handleAllRoutesClick}>
                      <div className="button-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="grey" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-map"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M3 7l6 -3l6 3l6 -3v13l-6 3l-6 -3l-6 3v-13" /><path d="M9 4v13" /><path d="M15 7v13" /></svg>
                      </div>
                      <span>همه مسیر</span>
                    </button>
                    <span className="sdivider"></span>
                    <button className="route-button">
                      <div className="button-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-route-alt-left"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M8 3h-5v5" /><path d="M16 3h5v5" /><path d="M3 3l7.536 7.536a5 5 0 0 1 1.464 3.534v6.93" /><path d="M18 6.01v-.01" /><path d="M16 8.02v-.01" /><path d="M14 10v.01" /></svg>
                      </div>
                      <span>سایر مسیرها</span>
                    </button>
                  </div>
                </>
              )}

              <div className="bottom-controls">
                <button
                  className={`start-routing-button ${isRoutingActive ? 'stop-routing' : ''}`}
                  onClick={toggleRouting}
                >
                  {isRoutingActive ? 'پایان و بستن سفر' : 'شروع مسیریابی'}
                </button>

                <div className="pc-container">
                  <button className="expand-button" onClick={toggleInfoModal}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-chevron-compact-down"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M4 11l8 3l8 -3" /></svg>
                  </button>
                  <button className="profile-button" onClick={() => navigate('/Profile')}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="icon icon-tabler icons-tabler-filled icon-tabler-user"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M12 2a5 5 0 1 1 -5 5l.005 -.217a5 5 0 0 1 4.995 -4.783z" /><path d="M14 14a5 5 0 0 1 5 5v1a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-1a5 5 0 0 1 5 -5h4z" /></svg>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Return to Route Button */}
      {!isMapModalOpen && (
        <button className="return-to-route-button" onClick={toggleMapModal}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M11.092 2.581a1 1 0 0 1 1.754 -.116l.062 .116l8.005 17.365c.198 .566 .05 1.196 -.378 1.615a1.53 1.53 0 0 1 -1.459 .393l-7.077 -2.398l-6.899 2.338a1.535 1.535 0 0 1 -1.52 -.231l-.112 -.1c-.398 -.386 -.556 -.954 -.393 -1.556l.047 -.15l7.97 -17.276z" />
          </svg>
          <span className="return-to-route-text">برگرد به مسیر</span>
        </button>
      )}
    </div>
  );
};

export default RoutingPage;
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FormattedMessage, useIntl } from 'react-intl';
import RouteMap from '../components/map/RouteMap';
import '../styles/Routing.css';
import { useRouteStore } from '../store/routeStore';
import { useLangStore } from '../store/langStore';
import { buildGeoJsonPath } from '../utils/geojsonPath.js';
import { analyzeRoute } from '../utils/routeAnalysis';
import { toast } from 'react-toastify';

const RoutingPage = () => {
  const intl = useIntl();
  const [isMapModalOpen, setIsMapModalOpen] = useState(true);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(true);
  const [routeData, setRouteData] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const storedLat = sessionStorage.getItem('qrLat');
  const storedLng = sessionStorage.getItem('qrLng');
  const [userLocation, setUserLocation] = useState(
    storedLat && storedLng
      ? [parseFloat(storedLat), parseFloat(storedLng)]
      : [36.2880, 59.6157]
  );
  const [prevInfoModalState, setPrevInfoModalState] = useState(true);
  const [wasInfoModalOpenBeforeSound, setWasInfoModalOpenBeforeSound] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [showSoundModal, setShowSoundModal] = useState(false);
  const [selectedEmergency, setSelectedEmergency] = useState(null);
  const [selectedSoundOption, setSelectedSoundOption] = useState('on');
  const [isRoutingActive, setIsRoutingActive] = useState(false);
  const [isClosingEmergency, setIsClosingEmergency] = useState(false);
  const [isClosingSound, setIsClosingSound] = useState(false);
  const [showAllRoutesView, setShowAllRoutesView] = useState(false);
  const [showAlternativeRoutes, setShowAlternativeRoutes] = useState(false);
  const [was3DViewBeforeRouteView, setWas3DViewBeforeRouteView] = useState(false);
  const [is3DView, setIs3DView] = useState(false);
  const navigate = useNavigate();
  const {
    origin,
    destination,
    routeSteps,
    routeGeo,
    alternativeRoutes,
    transportMode,
    gender,
    setOrigin,
    setDestination,
    setRouteGeo,
    setRouteSteps,
    setAlternativeRoutes
  } = useRouteStore();
  const language = useLangStore(state => state.language);

  // If QR coordinates are provided and stored route does not match, rebuild the route
  useEffect(() => {
    if (!storedLat || !storedLng) return;
    const lat = parseFloat(storedLat);
    const lng = parseFloat(storedLng);
    const originChanged =
      !origin ||
      origin.coordinates?.[0] !== lat ||
      origin.coordinates?.[1] !== lng;

    if (!routeSteps.length || originChanged) {
      const newOrigin = {
        name: intl.formatMessage({ id: 'mapCurrentLocationName' }),
        coordinates: [lat, lng]
      };
      const newDestination =
        destination || {
          name: intl.formatMessage({ id: 'destSahnEnqelabName' }),
          coordinates: [36.2975, 59.6072]
        };

      const file = buildGeoJsonPath(language);
      fetch(file)
        .then((res) => res.json())
        .then((geoData) => {
          const result = analyzeRoute(
            newOrigin,
            newDestination,
            geoData,
            'walking',
            gender
          );
          if (!result) {
            toast.error(intl.formatMessage({ id: 'noRouteFound' }));
            setRouteGeo(null);
            setRouteSteps([]);
            setAlternativeRoutes([]);
            return;
          }
          const { geo, steps, alternatives } = result;
          setOrigin(newOrigin);
          setDestination(newDestination);
          setRouteGeo(geo);
          setRouteSteps(steps);
          setAlternativeRoutes(alternatives);
        })
        .catch((err) => console.error('failed to build route from QR', err));
    }
  }, [storedLat, storedLng, origin, destination, routeSteps.length, language, intl, gender, setOrigin, setDestination, setRouteGeo, setRouteSteps, setAlternativeRoutes]);

  useEffect(() => {
    if (!origin || !destination) return;
    const file = buildGeoJsonPath(language);
    fetch(file)
      .then(res => res.json())
      .then(geoData => {
        const result = analyzeRoute(
          origin,
          destination,
          geoData,
          transportMode,
          gender
        );
        if (!result) {
          toast.error(intl.formatMessage({ id: 'noRouteFound' }));
          setRouteGeo(null);
          setRouteSteps([]);
          setAlternativeRoutes([]);
          return;
        }
        const { geo, steps, alternatives } = result;
        setRouteGeo(geo);
        setRouteSteps(steps);
        setAlternativeRoutes(alternatives);
      })
      .catch(err => console.error('failed to rebuild route', err));
  }, [transportMode, gender, origin, destination, language, intl, setRouteGeo, setRouteSteps, setAlternativeRoutes]);

  // Calculate total time in minutes from all steps
  const calculateTotalTime = (steps) => {
    if (!steps) return 0;

    let totalMinutes = 0;
    steps.forEach(step => {
      const timeStr = step.time;
      if (timeStr.includes(intl.formatMessage({ id: 'minutesUnit' }))) {
        totalMinutes += parseInt(timeStr.split(' ')[0]);
      } else if (timeStr.includes(intl.formatMessage({ id: 'secondsUnit' }))) {
        totalMinutes += Math.ceil(parseInt(timeStr.split(' ')[0]) / 60);
      }
    });

    return totalMinutes;
  };

  // Format total time as "X <minutes> Y <seconds>"
  const formatTotalTime = (totalMinutes) => {
    if (totalMinutes < 1) {
      const seconds = totalMinutes * 60;
      return `${Math.round(seconds)} ${intl.formatMessage({ id: 'secondsUnit' })}`;
    }
    const minutes = Math.floor(totalMinutes);
    const seconds = Math.round((totalMinutes - minutes) * 60);

    if (seconds > 0) {
      return `${minutes} ${intl.formatMessage({ id: 'minutesUnit' })} ${seconds} ${intl.formatMessage({ id: 'secondsUnit' })}`;
    }
    return `${minutes} ${intl.formatMessage({ id: 'minutesUnit' })}`;
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

  // Load route data from JSON for initial display when no analyzed route exists
  useEffect(() => {
    if (routeSteps.length) return;
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
  }, [routeSteps.length]);

  // Build route data from stored steps
  useEffect(() => {
    if (!routeSteps || routeSteps.length === 0 || !routeGeo) return;
    const steps = routeSteps.map((s, idx) => {
      let distance = 0;
      if (idx > 0) {
        const [lng1, lat1] = routeGeo.geometry.coordinates[idx - 1];
        const [lng2, lat2] = routeGeo.geometry.coordinates[idx];
        distance = Math.hypot(lng2 - lng1, lat2 - lat1) * 100000;
      }
      const instruction = s.type
        ? intl.formatMessage(
          { id: s.type },
          { name: s.name, title: s.title, num: idx + 1 }
        )
        : s.instruction || '';
      return {
        id: idx + 1,
        instruction,
        distance: `${Math.round(distance)} ${intl.formatMessage({ id: 'meters' })}`,
        time: `${Math.max(1, Math.round(distance / 60))} ${intl.formatMessage({ id: 'minutesUnit' })}`,
        coordinates: s.coordinates,
        services: s.services || {}
      };
    });
    const totalMinutes = calculateTotalTime(steps);
    const formattedTotalTime = formatTotalTime(totalMinutes);
    const arrivalTime = calculateArrivalTime(totalMinutes);
    const totalDistance = steps.reduce((acc, st) => acc + parseInt(st.distance), 0);

    const alternativesData = (alternativeRoutes || []).map((alt, ridx) => {
      const altSteps = alt.steps.map((st, i) => {
        let dist = 0;
        if (i > 0) {
          const [lng1, lat1] = alt.geo.geometry.coordinates[i - 1];
          const [lng2, lat2] = alt.geo.geometry.coordinates[i];
          dist = Math.hypot(lng2 - lng1, lat2 - lat1) * 100000;
        }
        const instruction = st.type
          ? intl.formatMessage(
            { id: st.type },
            { name: st.name, title: st.title, num: i + 1 }
          )
          : st.instruction || '';
        return {
          id: i + 1,
          instruction,
          distance: `${Math.round(dist)} ${intl.formatMessage({ id: 'meters' })}`,
          time: `${Math.max(1, Math.round(dist / 60))} ${intl.formatMessage({ id: 'minutesUnit' })}`,
          coordinates: st.coordinates
        };
      });
      const minutes = calculateTotalTime(altSteps);
      const distTot = altSteps.reduce((acc, st) => acc + parseInt(st.distance), 0);
      return {
        id: ridx + 1,
        steps: altSteps,
        geo: alt.geo,
        totalTime: formatTotalTime(minutes),
        totalDistance: `${distTot} ${intl.formatMessage({ id: 'meters' })}`,
        from: alt.from,
        to: alt.to,
        via: alt.via

      };
    });

    setRouteData({
      steps,
      totalTime: formattedTotalTime,
      arrivalTime,
      totalDistance: `${totalDistance} ${intl.formatMessage({ id: 'meters' })}`,
      alternativeRoutes: alternativesData
    });
  }, [routeSteps, routeGeo, alternativeRoutes]);

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

  // Get user's current location only if no QR coordinates provided
  useEffect(() => {
    if (!storedLat || !storedLng) {
      if (navigator.geolocation) {
        const options = {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }

        const success = (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude])
        }

        const error = (err) => {
          console.warn(`ERROR(${err.code}): ${err.message}`)
          setUserLocation([36.2880, 59.6157])
        }

        const watchId = navigator.geolocation.watchPosition(success, error, options)

        return () => navigator.geolocation.clearWatch(watchId)
      }
    }
  }, [storedLat, storedLng])

  // Auto-advance steps when routing is active
  useEffect(() => {
    if (!routeData || !isRoutingActive) return;

    const timer = setInterval(() => {
      if (currentStep < routeData.steps.length - 1) {
        setCurrentStep(prev => prev + 1);
      } else {
        setIsRoutingActive(false);
        setIs3DView(false); // Return to 2D when routing completes
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
        // Restore info modal to its previous state
        setIsInfoModalOpen(prevInfoModalState);
      }, 300);
    } else {
      // Store current info modal state before opening sound modal
      setPrevInfoModalState(isInfoModalOpen);
      setShowSoundModal(true);
      // Close info modal when opening sound modal
      setIsInfoModalOpen(false);

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
    const newRoutingState = !isRoutingActive;
    setIsRoutingActive(newRoutingState);

    if (newRoutingState && currentStep >= routeData?.steps?.length - 1) {
      setCurrentStep(0);
    }

    // Only change 3D view if not in all routes or alternative routes view
    if (!showAllRoutesView && !showAlternativeRoutes) {
      setIs3DView(newRoutingState);
    }
  };

  const handleEmergencySelect = (type) => {
    setSelectedEmergency(type);
  };

  const handleSoundOptionSelect = (option) => {
    setSelectedSoundOption(option);
  };

  const handleAllRoutesClick = () => {
    setWas3DViewBeforeRouteView(is3DView); // Remember current 3D state
    setIs3DView(false); // Force 2D view
    setShowAllRoutesView(true);
    setIsInfoModalOpen(true);
  };

  const handleReturnToRoute = () => {
    setIs3DView(was3DViewBeforeRouteView); // Restore previous 3D state
    setShowAllRoutesView(false);
  };

  const handleShowAlternativeRoutes = () => {
    setWas3DViewBeforeRouteView(is3DView); // Remember current 3D state
    setIs3DView(false); // Force 2D view
    setShowAlternativeRoutes(true);
    setIsInfoModalOpen(true);
  };

  const handleReturnFromAlternativeRoutes = () => {
    setIs3DView(was3DViewBeforeRouteView); // Restore previous 3D state
    setShowAlternativeRoutes(false);
  };

  const handleSelectAlternativeRoute = (route) => {
    if (!route?.geo || !route?.steps) {
      console.warn('Selected alternative route is missing geo or steps');
      return;
    }

    const currentRoute = { geo: routeGeo, steps: routeSteps };
    const newAlternatives = alternativeRoutes.filter(alt => alt !== route);

    if (currentRoute.geo && currentRoute.steps) {
      newAlternatives.push(currentRoute);
    }

    setRouteGeo(route.geo);
    setRouteSteps(route.steps);
    setAlternativeRoutes(newAlternatives);
    setCurrentStep(0);
    setIsRoutingActive(false);
    setShowAlternativeRoutes(false);
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
    return (
      <div className="loading">
        <FormattedMessage id="loading" />
      </div>
    );
  }

  return (
    <div className="routing-page">
      {/* Separate overlay for info modal */}
      {isInfoModalOpen && isMapModalOpen && !showAllRoutesView && !showAlternativeRoutes && (
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
            <h3 className="emergency-modal-title">
              <FormattedMessage id="emergencyTitle" />
            </h3>
            <p className="emergency-modal-subtitle">
              <FormattedMessage id="emergencySubtitle" />
            </p>

            <div className="emergency-options">
              <button
                className={`emergency-option ${selectedEmergency === 'fire' ? 'selected' : ''}`}
                onClick={() => handleEmergencySelect('fire')}
              >
                <FormattedMessage id="emergencyFire" />
              </button>
              <button
                className={`emergency-option ${selectedEmergency === 'theft' ? 'selected' : ''}`}
                onClick={() => handleEmergencySelect('theft')}
              >
                <FormattedMessage id="emergencyTheft" />
              </button>
              <button
                className={`emergency-option ${selectedEmergency === 'medical' ? 'selected' : ''}`}
                onClick={() => handleEmergencySelect('medical')}
              >
                <FormattedMessage id="emergencyMedical" />
              </button>
              <button
                className={`emergency-option ${selectedEmergency === 'missing' ? 'selected' : ''}`}
                onClick={() => handleEmergencySelect('missing')}
              >
                <FormattedMessage id="emergencyMissing" />
              </button>
            </div>

            <div className="emergency-description">
              <textarea
                placeholder={intl.formatMessage({ id: 'emergencyPlaceholder' })}
                className="emergency-textarea"
              />
            </div>

            <button className="emergency-submit-button">
              <FormattedMessage id="emergencySubmit" />
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
            <h3 className="sound-modal-title">
              <FormattedMessage id="soundSettingsTitle" />
            </h3>
            <div className="sound-options">
              <div className="option-box">
                <button
                  className={`sound-option ${selectedSoundOption === 'on' ? 'selected' : ''}`}
                  onClick={() => handleSoundOptionSelect('on')}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="34"
                    height="34"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="icon icon-tabler icons-tabler-outline icon-tabler-volume"
                  >
                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                    <path d="M15 8a5 5 0 0 1 0 8" />
                    <path d="M17.7 5a9 9 0 0 1 0 14" />
                    <path d="M6 15h-2a1 1 0 0 1 -1 -1v-4a1 1 0 0 1 1 -1h2l3.5 -4.5a.8 .8 0 0 1 1.5 .5v14a.8 .8 0 0 1 -1.5 .5l-3.5 -4.5" />
                  </svg>
                </button>
                <span className={`option-text ${selectedSoundOption === 'on' ? 'selected' : ''}`}>
                  <FormattedMessage id="soundOptionOn" />
                </span>
              </div>
              <div className="option-box">
                <button
                  className={`sound-option ${selectedSoundOption === 'alertOnly' ? 'selected' : ''}`}
                  onClick={() => handleSoundOptionSelect('alertOnly')}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="34"
                    height="34"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="icon icon-tabler icons-tabler-outline icon-tabler-alert-triangle"
                  >
                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                    <path d="M12 9v4" />
                    <path d="M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636 -2.87l-8.106 -13.536a1.914 1.914 0 0 0 -3.274 0z" />
                    <path d="M12 16h.01" />
                  </svg>
                </button>
                <span className={`option-text ${selectedSoundOption === 'alertOnly' ? 'selected' : ''}`}>
                  <FormattedMessage id="soundOptionAlertOnly" />
                </span>
              </div>
              <div className="option-box">
                <button
                  className={`sound-option ${selectedSoundOption === 'off' ? 'selected' : ''}`}
                  onClick={() => handleSoundOptionSelect('off')}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="34"
                    height="34"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="icon icon-tabler icons-tabler-outline icon-tabler-volume-off"
                  >
                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                    <path d="M15 8a5 5 0 0 1 1.912 4.934m-1.377 2.602a5 5 0 0 1 -.535 .464" />
                    <path d="M17.7 5a9 9 0 0 1 2.362 11.086m-1.676 2.299a9 9 0 0 1 -.686 .615" />
                    <path d="M9.069 5.054l.431 -.554a.8 .8 0 0 1 1.5 .5v2m0 4v8a.8 .8 0 0 1 -1.5 .5l-3.5 -4.5h-2a1 1 0 0 1 -1 -1v-4a1 1 0 0 1 1 -1h2l1.294 -1.664" />
                    <path d="M3 3l18 18" />
                  </svg>
                </button>
                <span className={`option-text ${selectedSoundOption === 'off' ? 'selected' : ''}`}>
                  <FormattedMessage id="soundOptionOff" />
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
            {step.services && (
              <div className="step-services">
                {step.services.wheelchair && (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-wheelchair">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                    <path d="M11 5m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
                    <path d="M11 7l0 8l4 0l4 5" />
                    <path d="M11 11l5 0" />
                    <path d="M7 11.5a5 5 0 1 0 6 7.5" />
                  </svg>
                )}
                {step.services.electricVan && (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-car">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                    <path d="M14 5a1 1 0 0 1 .694 .28l.087 .095l3.699 4.625h.52a3 3 0 0 1 2.995 2.824l.005 .176v4a1 1 0 0 1 -1 1h-1.171a3.001 3.001 0 0 1 -5.658 0h-4.342a3.001 3.001 0 0 1 -5.658 0h-1.171a1 1 0 0 1 -1 -1v-6l.007 -.117l.008 -.056l.017 -.078l.012 -.036l.014 -.05l2.014 -5.034a1 1 0 0 1 .928 -.629zm-7 11a1 1 0 1 0 0 2a1 1 0 0 0 0 -2m10 0a1 1 0 1 0 0 2a1 1 0 0 0 0 -2m-6 -9h-5.324l-1.2 3h6.524zm2.52 0h-.52v3h2.92z" />
                  </svg>
                )}
                {step.services.walking && (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-walk">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                    <path d="M13 4m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
                    <path d="M7 21l3 -4" />
                    <path d="M16 21l-2 -4l-3 -3l1 -6" />
                    <path d="M6 12l2 -3l4 -1l3 3l3 1" />
                  </svg>
                )}
              </div>
            )}
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
          <div className={`map-container ${isMapModalOpen ? 'open' : 'closed'} ${isInfoModalOpen ? 'dark-overlay' : ''} ${showAllRoutesView ? 'No-dark-overlay' : ''} ${isInfoModalOpen ? 'dark-overlay' : ''} ${showAlternativeRoutes ? 'No-dark-overlay' : ''}`}>
            <RouteMap
              userLocation={userLocation}
              routeSteps={routeData.steps}
              currentStep={currentStep}
              isInfoModalOpen={isInfoModalOpen}
              isMapModalOpen={isMapModalOpen}
              is3DView={is3DView}
              routeGeo={routeGeo}
              alternativeRoutes={routeData.alternativeRoutes}
              onSelectAlternativeRoute={handleSelectAlternativeRoute}
            />
          </div>
        )}

        {/* Emergency Button */}
        <button className="emergency-button" onClick={toggleEmergencyModal}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="icon icon-tabler icons-tabler-filled icon-tabler-alert-triangle"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M12 1.67c.955 0 1.845 .467 2.39 1.247l.105 .16l8.114 13.548a2.914 2.914 0 0 1 -2.307 4.363l-.195 .008h-16.225a2.914 2.914 0 0 1 -2.582 -4.2l.099 -.185l8.11 -13.538a2.914 2.914 0 0 1 2.491 -1.403zm.01 13.33l-.127 .007a1 1 0 0 0 0 1.986l.117 .007l.127 -.007a1 1 0 0 0 0 -1.986l-.117 -.007zm-.01 -7a1 1 0 0 0 -.993 .883l-.007 .117v4l.007 .117a1 1 0 0 0 1.986 0l.007 -.117v-4l-.007 -.117a1 1 0 0 0 -.993 -.883z" /></svg>
          <span><FormattedMessage id="emergencyButtonLabel" /></span>
        </button>

        {/* Info Modal - Only visible when map modal is open */}
        <div className={`info-modal-wrapper ${isMapModalOpen ? 'visible' : 'hidden'}`}>
          {showAllRoutesView ? (
            <div className="all-routes-view">
              <div className="all-routes-content">
                <div className="all-routes-header">
                  <div className="all-routes-info">
                    <span><FormattedMessage id="arrivalTime" /></span>
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
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                    <path d="M11.092 2.581a1 1 0 0 1 1.754 -.116l.062 .116l8.005 17.365c.198 .566 .05 1.196 -.378 1.615a1.53 1.53 0 0 1 -1.459 .393l-7.077 -2.398l-6.899 2.338a1.535 1.535 0 0 1 -1.52 -.231l-.112 -.1c-.398 -.386 -.556 -.954 -.393 -1.556l.047 -.15l7.97 -17.276z" />
                  </svg>
                  <span className="return-to-route-text">
                    <FormattedMessage id="returnToRoute" />
                  </span>
                </button>
              </div>
            </div>
          ) : showAlternativeRoutes ? (
            <div className="alternative-routes-view">
              <button className="return-to-route-button5" onClick={handleReturnFromAlternativeRoutes}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                  <path d="M11.092 2.581a1 1 0 0 1 1.754 -.116l.062 .116l8.005 17.365c.198 .566 .05 1.196 -.378 1.615a1.53 1.53 0 0 1 -1.459 .393l-7.077 -2.398l-6.899 2.338a1.535 1.535 0 0 1 -1.52 -.231l-.112 -.1c-.398 -.386 -.556 -.954 -.393 -1.556l.047 -.15l7.97 -17.276z" />
                </svg>
                <span className="return-to-route-text">
                  <FormattedMessage id="returnToRoute" />
                </span>
              </button>

              <div className="alternative-routes-container">
                {routeData.alternativeRoutes.map(route => (
                  <div
                    key={route.id}
                    className="alternative-route-card"
                    onClick={() => handleSelectAlternativeRoute(route)}
                  >
                    <div className="route-title">
                      <span><FormattedMessage id="from" /> {route.from}</span>
                      <span ><FormattedMessage id="to" /> {route.to}</span>
                    </div>

                    <div className="route-via">
                      {Array.isArray(route.via) ? route.via.join(" – ") : ''}
                    </div>

                    <div className="route-stats">
                      <div className="route-stat">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-walk">
                          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                          <path d="M13 4m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
                          <path d="M7 21l3 -4" />
                          <path d="M16 21l-2 -4l-3 -3l1 -6" />
                          <path d="M6 12l2 -3l4 -1l3 3l3 1" />
                        </svg>
                        <span>{route.totalTime}</span>
                      </div>

                      <div className="route-stat">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-route">
                          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                          <path d="M3 19a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" />
                          <path d="M19 7a2 2 0 1 0 0 -4a2 2 0 0 0 0 4z" />
                          <path d="M11 19h5.5a3.5 3.5 0 0 0 0 -7h-8a3.5 3.5 0 0 1 0 -7h4.5" />
                        </svg>
                        <span>{route.totalDistance}</span>
                      </div>
                    </div>

                    <button className="start-route-button7">
                      <svg className="rbt" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                        <path d="M11.092 2.581a1 1 0 0 1 1.754 -.116l.062 .116l8.005 17.365c.198 .566 .05 1.196 -.378 1.615a1.53 1.53 0 0 1 -1.459 .393l-7.077 -2.398l-6.899 2.338a1.535 1.535 0 0 1 -1.52 -.231l-.112 -.1c-.398 -.386 -.556 -.954 -.393 -1.556l.047 -.15l7.97 -17.276z" />
                      </svg>
                      <FormattedMessage id="startRouting" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className={`info-modal ${isInfoModalOpen ? 'open' : 'closed'}`}>
              <div className="info-content">
                <div className="modal-toggle3 info-toggle" onClick={toggleInfoModal}>
                  <div className="toggle-handle3"></div>
                </div>
                <div className="info-header">
                  <button className="close-button" onClick={toggleInfoModal}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-x"><path stroke="none" ></path><path d="M18 6l-12 12" />
                      <path d="M6 6l12 12" /></svg>
                  </button>
                  <div className="info-title">
                    <div className="info-stat">
                      <span><FormattedMessage id="arrivalTime" /></span>
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

                  <button
                    className="sound-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      toggleSoundModal();
                    }}
                    style={{
                      position: 'relative',
                      zIndex: 1000 // Ensure it's above other elements
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-volume">
                      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                      <path d="M15 8a5 5 0 0 1 0 8" />
                      <path d="M17.7 5a9 9 0 0 1 0 14" />
                      <path d="M6 15h-2a1 1 0 0 1 -1 -1v-4a1 1 0 0 1 1 -1h2l3.5 -4.5a.8 .8 0 0 1 1.5 .5v14a.8 .8 0 0 1 -1.5 .5l-3.5 -4.5" />
                    </svg>
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
                      <span><FormattedMessage id="routeOverview" /></span>
                    </button>
                    <span className="sdivider"></span>
                    <button className="route-button" onClick={handleAllRoutesClick}>
                      <div className="button-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="grey" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-map"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M3 7l6 -3l6 3l6 -3v13l-6 3l-6 -3l-6 3v-13" /><path d="M9 4v13" /><path d="M15 7v13" /></svg>
                      </div>
                      <span><FormattedMessage id="allRoutes" /></span>
                    </button>
                    <span className="sdivider"></span>
                    <button className="route-button" onClick={handleShowAlternativeRoutes}>
                      <div className="button-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-route-alt-left"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M8 3h-5v5" /><path d="M16 3h5v5" /><path d="M3 3l7.536 7.536a5 5 0 0 1 1.464 3.534v6.93" /><path d="M18 6.01v-.01" /><path d="M16 8.02v-.01" /><path d="M14 10v.01" /></svg>
                      </div>
                      <span><FormattedMessage id="otherRoutes" /></span>
                    </button>
                  </div>
                </>
              )}

              <div className="bottom-controls">
                <button
                  className={`start-routing-button ${isRoutingActive ? 'stop-routing' : ''}`}
                  onClick={toggleRouting}
                >
                  {isRoutingActive ? (
                    <FormattedMessage id="stopRouting" />
                  ) : (
                    <FormattedMessage id="startRouting" />
                  )}
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

        {/* Return to Route Button */}
        {
          !isMapModalOpen && (
            <button className="return-to-route-button" onClick={toggleMapModal}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M11.092 2.581a1 1 0 0 1 1.754 -.116l.062 .116l8.005 17.365c.198 .566 .05 1.196 -.378 1.615a1.53 1.53 0 0 1 -1.459 .393l-7.077 -2.398l-6.899 2.338a1.535 1.535 0 0 1 -1.52 -.231l-.112 -.1c-.398 -.386 -.556 -.954 -.393 -1.556l.047 -.15l7.97 -17.276z" />
              </svg>
              <span className="return-to-route-text">
                <FormattedMessage id="returnToRoute" />
              </span>
            </button>
          )
        }
      </div>
    </div>
  );
};

export default RoutingPage;
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FormattedMessage, useIntl } from 'react-intl';
import RouteMap from '../components/map/RouteMap';
import DeadReckoningControls from '../components/map/DeadReckoningControls';
import advancedDeadReckoningService from '../services/AdvancedDeadReckoningService';
import '../styles/Routing.css';
import { useRouteStore } from '../store/routeStore';
import { useLangStore } from '../store/langStore';
import { buildGeoJsonPath } from '../utils/geojsonPath.js';
import { analyzeRoute } from '../utils/routeAnalysis';
import useLocaleDigits from '../utils/useLocaleDigits';
import { toast } from 'react-toastify';

const RoutingPage = () => {
  const intl = useIntl();
  const formatDigits = useLocaleDigits();
  const routeMapRef = useRef(null);
  const [isMapModalOpen, setIsMapModalOpen] = useState(true);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(true);
  const [routeData, setRouteData] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const storedLat = sessionStorage.getItem('qrLat');
  const storedLng = sessionStorage.getItem('qrLng');
  const storedRouteSahns = sessionStorage.getItem('routeSahns')
    ? JSON.parse(sessionStorage.getItem('routeSahns'))
    : [];
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
  const [emergencyDescription, setEmergencyDescription] = useState('');
  const [selectedSoundOption, setSelectedSoundOption] = useState('on');
  const [isRoutingActive, setIsRoutingActive] = useState(false);
  const [isClosingEmergency, setIsClosingEmergency] = useState(false);
  const [isClosingSound, setIsClosingSound] = useState(false);
  const [showAllRoutesView, setShowAllRoutesView] = useState(false);
  const [showAlternativeRoutes, setShowAlternativeRoutes] = useState(false);
  const [was3DViewBeforeRouteView, setWas3DViewBeforeRouteView] = useState(false);
  const [showGpsOffline, setShowGpsOffline] = useState(false);
  const [is3DView, setIs3DView] = useState(false);
  const [drPosition, setDrPosition] = useState(null);
  const [drGeoPath, setDrGeoPath] = useState([]);
  const [isDrActive, setIsDrActive] = useState(advancedDeadReckoningService.isActive);
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

  useEffect(() => {
    const remove = advancedDeadReckoningService.addListener(data => {
      setIsDrActive(data.isActive);
      if (data.geoPosition) setDrPosition(data.geoPosition);
      if (data.geoPath) setDrGeoPath(data.geoPath);
    });
    return remove;
  }, []);

  useEffect(() => {
    if (isDrActive) {
      setShowAlternativeRoutes(false);
    }
  }, [isDrActive]);

  useEffect(() => {
    const sessGeo = sessionStorage.getItem('routeGeo');
    const sessSteps = sessionStorage.getItem('routeSteps');
    const sessAlts = sessionStorage.getItem('alternativeRoutes');
    const sessOrigin = sessionStorage.getItem('origin');
    const sessDestination = sessionStorage.getItem('destination');
    if (sessGeo && sessSteps) {
      setRouteGeo(JSON.parse(sessGeo));
      setRouteSteps(JSON.parse(sessSteps));
      let alts = sessAlts ? JSON.parse(sessAlts) : [];
      const originObj = sessOrigin ? JSON.parse(sessOrigin) : origin;
      const destObj = sessDestination ? JSON.parse(sessDestination) : destination;
      alts = alts.map(a => ({
        ...a,
        from: a.from || originObj?.name || '',
        to: a.to || destObj?.name || ''
      }));
      setAlternativeRoutes(alts);
      if (sessOrigin) setOrigin(JSON.parse(sessOrigin));
      if (sessDestination) setDestination(JSON.parse(sessDestination));
    }
  }, [setRouteGeo, setRouteSteps, setAlternativeRoutes, setOrigin, setDestination]);

  // If QR coordinates are provided and stored route does not match, rebuild the route
  useEffect(() => {
    if (!storedLat || !storedLng) return;
    const lat = parseFloat(storedLat);
    const lng = parseFloat(storedLng);
    const sessGeo = sessionStorage.getItem('routeGeo');
    const sessSteps = sessionStorage.getItem('routeSteps');
    if (sessGeo && sessSteps && !routeSteps.length) {
      // wait for session data to load via the first effect
      return;
    }

    const originChanged =
      !origin ||
      origin.coordinates?.[0] !== lat ||
      origin.coordinates?.[1] !== lng;


    if (sessGeo && sessSteps && !originChanged) {
      // Session data already provides the route; the first effect will
      // load it into state so skip rebuilding here
      return;
    }

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
          const { geo, steps, alternatives, sahns } = result;
          setOrigin(newOrigin);
          setDestination(newDestination);
          setRouteGeo(geo);
          setRouteSteps(steps);
          setAlternativeRoutes(alternatives);
          sessionStorage.setItem('routeSahns', JSON.stringify(sahns));
        })
        .catch((err) => console.error('failed to build route from QR', err));
    }
  }, [storedLat, storedLng, origin, destination, routeSteps.length, language, intl, gender, setOrigin, setDestination, setRouteGeo, setRouteSteps, setAlternativeRoutes]);

  useEffect(() => {
    const sessGeo = sessionStorage.getItem('routeGeo');
    const sessSteps = sessionStorage.getItem('routeSteps');
    if (sessGeo && sessSteps && (!routeGeo || !routeSteps.length)) {
      // session data will populate state via the first effect
      return;
    }

    if (!origin || !destination) return;
    if (routeGeo && routeSteps.length) return;
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
        const { geo, steps, alternatives, sahns } = result;
        setRouteGeo(geo);
        setRouteSteps(steps);
        setAlternativeRoutes(alternatives);
        sessionStorage.setItem('routeSahns', JSON.stringify(sahns));
      })
      .catch(err => console.error('failed to rebuild route', err));
  }, [transportMode, gender, origin, destination, language, intl, routeGeo, routeSteps.length, setRouteGeo, setRouteSteps, setAlternativeRoutes]);

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

  // If no steps available but route geometry exists (e.g. when navigating
  // directly from the search page), compute summary info from stored summary
  // or from the geometry so the displayed values match the final search page.
  useEffect(() => {
    if (!routeGeo || routeSteps.length) return;

    let minutes;
    let dist;
    let storedMode;

    try {
      const stored = sessionStorage.getItem('routeSummaryData');
      if (stored) {
        const parsed = JSON.parse(stored);
        minutes = parseInt(parsed.time, 10);
        dist = parseInt(parsed.distance, 10);
        storedMode = parsed.mode;

      }
    } catch (err) {
      console.warn('failed to read stored route summary', err);
    }

    if (!minutes || !dist) {
      const coords = routeGeo.geometry.coordinates || [];
      if (coords.length === 0) return;
      dist = coords.slice(1).reduce((acc, c, i) => {
        const prev = coords[i];
        return acc + Math.hypot(c[0] - prev[0], c[1] - prev[1]) * 100000;
      }, 0);
      minutes = Math.max(1, Math.round(dist / 60));
    }

    setRouteData(prev => ({
      steps: [],
      totalTime: formatTotalTime(minutes),
      arrivalTime: calculateArrivalTime(minutes),
      totalDistance: `${Math.round(dist)} ${intl.formatMessage({ id: 'meters' })}`,
      alternativeRoutes: [],
      mode: storedMode || transportMode,
      ...prev,
    }));
  }, [routeGeo, routeSteps.length, transportMode, intl]);

  const handleEmergencySubmit = () => {
    if (!selectedEmergency) {
      toast.error(intl.formatMessage({ id: 'emergencySelectType' }));
      return;
    }

    if (!emergencyDescription.trim()) {
      toast.error(intl.formatMessage({ id: 'emergencyEnterDetails' }));
      return;
    }
    const emergencyData = {
      type: selectedEmergency,
      description: emergencyDescription,
      location: userLocation,
      timestamp: new Date().toISOString()
    };

    console.log('Emergency data:', emergencyData); // For debugging

    // Simulate API call
    setTimeout(() => {
      toast.success(intl.formatMessage({ id: 'emergencySubmissionSuccess' }));
      setSelectedEmergency(null);
      setEmergencyDescription('');
      toggleEmergencyModal();
    }, 1000);
  };
  useEffect(() => {
    const checkGpsStatus = () => {
      if (!navigator.geolocation) {
        setShowGpsOffline(true);
        return;
      }

      navigator.permissions?.query({ name: 'geolocation' }).then(permissionStatus => {
        // Only show if info modal is closed
        setShowGpsOffline(permissionStatus.state === 'denied' && !isInfoModalOpen);

        const handleChange = () => {
          setShowGpsOffline(permissionStatus.state === 'denied' && !isInfoModalOpen);
        };

        permissionStatus.addEventListener('change', handleChange);
        return () => permissionStatus.removeEventListener('change', handleChange);
      }).catch(() => {
        setShowGpsOffline(false);
      });
    };

    checkGpsStatus();
  }, [isInfoModalOpen]);

  useEffect(() => {
    // When info modal state changes, update GPS offline notification visibility
    if (navigator.geolocation) {
      navigator.permissions?.query({ name: 'geolocation' }).then(permissionStatus => {
        setShowGpsOffline(permissionStatus.state === 'denied' && !isInfoModalOpen);
      });
    }
  }, [isInfoModalOpen]);

  useEffect(() => {
    // When info modal state changes, update GPS offline notification visibility
    if (navigator.geolocation) {
      navigator.permissions?.query({ name: 'geolocation' }).then(permissionStatus => {
        setShowGpsOffline(permissionStatus.state === 'denied' && !isInfoModalOpen);
      });
    }
  }, [isInfoModalOpen]);

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

  const toRad = (deg) => (deg * Math.PI) / 180;
  const toDeg = (rad) => (rad * 180) / Math.PI;
  const bearing = (from, to) => {
    const [lng1, lat1] = from;
    const [lng2, lat2] = to;
    const y = Math.sin(toRad(lng2 - lng1)) * Math.cos(toRad(lat2));
    const x =
      Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
      Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lng2 - lng1));
    return (toDeg(Math.atan2(y, x)) + 360) % 360;
  };

  const computeTurn = (b1, b2) => {
    const diff = ((b1 - b2 + 540) % 360) - 180;
    const ad = Math.abs(diff);
    if (ad < 30) return 'up';
    if (ad > 150) return 'down';
    if (ad < 100) return diff > 0 ? 'left' : 'right';
    return diff > 0 ? 'bend-left' : 'bend-right';
  };

  // Load route data from JSON for initial display when no analyzed route exists
  useEffect(() => {
    if (routeSteps.length || routeGeo) return;
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
  }, [routeSteps.length, routeGeo]);

  // Build route data from stored steps
  useEffect(() => {
    if (!routeSteps || routeSteps.length === 0 || !routeGeo) return;
    const coords = routeGeo.geometry.coordinates;
    const steps = routeSteps.map((s, idx) => {
      let distance = 0;
      if (idx > 0) {
        const [lng1, lat1] = coords[idx - 1];
        const [lng2, lat2] = coords[idx];
        distance = Math.hypot(lng2 - lng1, lat2 - lat1) * 100000;
      }
      const base = s.type
        ? intl.formatMessage(
          { id: s.type },
          { name: s.name, title: s.title, num: idx + 1 }
        )
        : s.instruction || '';
      const instruction = s.landmark
        ? `${base}، ${intl.formatMessage({ id: 'landmarkSuffix' }, { name: s.landmark, distance: Math.round(distance) })}`
        : base;
      let direction = 'arrived';
      if (idx < coords.length - 2) {
        const b1 = bearing(coords[idx], coords[idx + 1]);
        const b2 = bearing(coords[idx + 1], coords[idx + 2]);
        direction = computeTurn(b1, b2);
      }
      return {
        id: idx + 1,
        instruction,
        distance: `${Math.round(distance)} ${intl.formatMessage({ id: 'meters' })}`,
        time: `${Math.max(1, Math.round(distance / 60))} ${intl.formatMessage({ id: 'minutesUnit' })}`,
        coordinates: s.coordinates,
        services: s.services || {},
        direction
      };
    });
    // Use summary from session storage if available to ensure consistency with
    // the FinalSearch page calculations
    let summaryMinutes;
    let summaryDistance;
    let summaryMode;

    try {
      const stored = sessionStorage.getItem('routeSummaryData');
      if (stored) {
        const parsed = JSON.parse(stored);
        summaryMinutes = parseInt(parsed.time, 10);
        summaryDistance = parseInt(parsed.distance, 10);
        summaryMode = parsed.mode;

      }
    } catch (err) {
      console.warn('failed to read stored route summary', err);
    }

    const totalMinutes = summaryMinutes || calculateTotalTime(steps);
    const totalDistance = summaryDistance ||
      steps.reduce((acc, st) => acc + parseInt(st.distance), 0);
    const formattedTotalTime = formatTotalTime(totalMinutes);
    const arrivalTime = calculateArrivalTime(totalMinutes);

    const alternativesData = (alternativeRoutes || []).map((alt, ridx) => {
      const altCoords = alt.geo.geometry.coordinates;
      const altSteps = alt.steps.map((st, i) => {
        let dist = 0;
        if (i > 0) {
          const [lng1, lat1] = altCoords[i - 1];
          const [lng2, lat2] = altCoords[i];
          dist = Math.hypot(lng2 - lng1, lat2 - lat1) * 100000;
        }
        const base = st.type
          ? intl.formatMessage(
            { id: st.type },
            { name: st.name, title: st.title, num: i + 1 }
          )
          : st.instruction || '';
        const instruction = st.landmark
          ? `${base}، ${intl.formatMessage({ id: 'landmarkSuffix' }, { name: st.landmark, distance: Math.round(dist) })}`
          : base;
        let direction = 'arrived';
        if (i < altCoords.length - 2) {
          const b1 = bearing(altCoords[i], altCoords[i + 1]);
          const b2 = bearing(altCoords[i + 1], altCoords[i + 2]);
          direction = computeTurn(b1, b2);
        }
        return {
          id: i + 1,
          instruction,
          distance: `${Math.round(dist)} ${intl.formatMessage({ id: 'meters' })}`,
          time: `${Math.max(1, Math.round(dist / 60))} ${intl.formatMessage({ id: 'minutesUnit' })}`,
          coordinates: st.coordinates,
          direction
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
        via: alt.sahns || []

      };
    });

    setRouteData({
      steps,
      totalTime: formattedTotalTime,
      arrivalTime,
      totalDistance: `${totalDistance} ${intl.formatMessage({ id: 'meters' })}`,
      alternativeRoutes: alternativesData,
      mode: summaryMode || transportMode
    });

    try {
      sessionStorage.setItem(
        'routeSummaryData',
        JSON.stringify({
          time: totalMinutes.toString(),
          distance: totalDistance.toString(),
          mode: transportMode
        })
      );
    } catch (err) {
      console.warn('failed to persist route summary', err);
    }
  }, [routeSteps, routeGeo, alternativeRoutes, transportMode]);


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
          if (sessionStorage.getItem('qrLat') && sessionStorage.getItem('qrLng')) {
            return;
          }
          setUserLocation([position.coords.latitude, position.coords.longitude])
          advancedDeadReckoningService.processGpsData(
            { lat: position.coords.latitude, lng: position.coords.longitude },
            position.coords.accuracy
          )
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
      // Clear form when closing modal without submission
      setSelectedEmergency(null);
      setEmergencyDescription('');
      setIsClosingEmergency(true);
      setTimeout(() => {
        setShowEmergencyModal(false);
        setIsClosingEmergency(false);
      }, 300);
    } else {
      // Opening modal - keep existing behavior
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

    if (newRoutingState) {
      const [lat, lng] = userLocation;
      advancedDeadReckoningService.start({ lat, lng });
    } else {
      advancedDeadReckoningService.stop();
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
    if (routeMapRef.current && routeMapRef.current.fitRouteBounds) {
      routeMapRef.current.fitRouteBounds();
    }
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

    const currentRoute = {
      geo: routeGeo,
      steps: routeSteps,
      from: origin?.name || '',
      to: destination?.name || '',
      via: route.via || [],
      sahns: storedRouteSahns
    };
    const newAlternatives = alternativeRoutes.filter(
      (alt) => alt.geo !== route.geo
    );

    if (currentRoute.geo && currentRoute.steps) {
      newAlternatives.push(currentRoute);
    }

    setRouteGeo(route.geo);
    setRouteSteps(route.steps);
    setAlternativeRoutes(newAlternatives);
    sessionStorage.setItem('routeGeo', JSON.stringify(route.geo));
    sessionStorage.setItem('routeSteps', JSON.stringify(route.steps));
    sessionStorage.setItem('alternativeRoutes', JSON.stringify(newAlternatives));
    sessionStorage.setItem('routeSahns', JSON.stringify(route.via || []));
    setCurrentStep(0);
    setIsRoutingActive(false);
    setShowAlternativeRoutes(false);
  };

  const getTransportIcon = (mode) => {
    switch (mode) {
      case 'walking':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-walk"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M13 4m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"/><path d="M7 21l3 -4"/><path d="M16 21l-2 -4l-3 -3l1 -6"/><path d="M6 12l2 -3l4 -1l3 3l3 1"/></svg>
        );
      case 'electric-car':
        return (
          <svg width="24" height="24" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" clipRule="evenodd" d="M12.5 2.5C8.72876 2.5 6.84315 2.5 5.67157 3.67157C4.60848 4.73467 4.51004 6.3857 4.50093 9.5H3.5C2.94772 9.5 2.5 9.94772 2.5 10.5V11.5C2.5 11.8148 2.64819 12.1111 2.9 12.3L4.5 13.5C4.50911 16.6143 4.60848 18.2653 5.67157 19.3284C5.91375 19.5706 6.18645 19.7627 6.5 19.9151V21.4999C6.5 22.0522 6.94772 22.4999 7.5 22.4999H9C9.55228 22.4999 10 22.0522 10 21.4999V20.4815C10.7271 20.5 11.5542 20.5 12.5 20.5C13.4458 20.5 14.2729 20.5 15 20.4815V21.4999C15 22.0522 15.4477 22.4999 16 22.4999H17.5C18.0523 22.4999 18.5 22.0522 18.5 21.4999V19.9151C18.8136 19.7627 19.0862 19.5706 19.3284 19.3284C20.3915 18.2653 20.4909 16.6143 20.5 13.5L22.1 12.3C22.3518 12.1111 22.5 11.8148 22.5 11.5V10.5C22.5 9.94772 22.0523 9.5 21.5 9.5H20.4991C20.49 6.3857 20.3915 4.73467 19.3284 3.67157C18.1569 2.5 16.2712 2.5 12.5 2.5ZM6 10C6 11.4142 6 12.1213 6.43934 12.5607C6.87868 13 7.58579 13 9 13H12.5H16C17.4142 13 18.1213 13 18.5607 12.5607C19 12.1213 19 11.4142 19 10V7.5C19 6.08579 19 5.37868 18.5607 4.93934C18.1213 4.5 17.4142 4.5 16 4.5H12.5H9C7.58579 4.5 6.87868 4.5 6.43934 4.93934C6 5.37868 6 6.08579 6 7.5V10ZM6.75 16.5C6.75 16.0858 7.08579 15.75 7.5 15.75H9C9.41421 15.75 9.75 16.0858 9.75 16.5C9.75 16.9142 9.41421 17.25 9 17.25H7.5C7.08579 17.25 6.75 16.9142 6.75 16.5ZM18.25 16.5C18.25 16.0858 17.9142 15.75 17.5 15.75H16C15.5858 15.75 15.25 16.0858 15.25 16.5C15.25 16.9142 15.5858 17.25 16 17.25H17.5C17.9142 17.25 18.25 16.9142 18.25 16.5Z" fill="#1E2023"/></svg>
        );
      case 'wheelchair':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-wheelchair"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M11 5m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"/><path d="M11 7l0 8l4 0l4 5"/><path d="M11 11l5 0"/><path d="M7 11.5a5 5 0 1 0 6 7.5"/></svg>
        );
      default:
        return null;
    }
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
        <div
          className="info-modal-overlay"
          onClick={(e) => {
            // Only close if clicking on the overlay itself, not children
            if (e.target === e.currentTarget) {
              toggleInfoModal();
            }
          }}
        />
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
                value={emergencyDescription}
                onChange={(e) => setEmergencyDescription(e.target.value)}
              />
            </div>

            <button
              className="emergency-submit-button"
              onClick={handleEmergencySubmit}
            >
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
        <div className="guide-steps-container">
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
      </div>
      {/* Map Modal with faded line when closed */}
      <div className={`map-modal ${isMapModalOpen ? 'open' : 'closed'}`}>
        <div className="modal-toggle map-toggle" onClick={toggleMapModal}>
          <div className="toggle-handle"></div>
        </div>

        <div
          className={`map-container ${isMapModalOpen ? 'open' : 'closed'} ${!showAllRoutesView && !showAlternativeRoutes && isInfoModalOpen
            ? 'dark-overlay'
            : 'No-dark-overlay'
            }`}
          onClick={() => {
            if (isMapModalOpen && isInfoModalOpen) {
              toggleInfoModal();
            }
          }}
        >
          <RouteMap
            ref={routeMapRef}
            userLocation={userLocation}
            routeSteps={routeData.steps}
            currentStep={currentStep}
            isInfoModalOpen={isInfoModalOpen}
            isMapModalOpen={isMapModalOpen}
            is3DView={is3DView}
            routeGeo={routeGeo}
            alternativeRoutes={isDrActive ? [] : routeData.alternativeRoutes}
            onSelectAlternativeRoute={handleSelectAlternativeRoute}
          />
          {/* <DeadReckoningControls
            currentLocation={{ coords: { lat: userLocation[0], lng: userLocation[1] } }}
          /> */}
        </div>

        {/* Emergency Button */}
        <button className="emergency-button" onClick={toggleEmergencyModal}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="icon icon-tabler icons-tabler-filled icon-tabler-alert-triangle"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M12 1.67c.955 0 1.845 .467 2.39 1.247l.105 .16l8.114 13.548a2.914 2.914 0 0 1 -2.307 4.363l-.195 .008h-16.225a2.914 2.914 0 0 1 -2.582 -4.2l.099 -.185l8.11 -13.538a2.914 2.914 0 0 1 2.491 -1.403zm.01 13.33l-.127 .007a1 1 0 0 0 0 1.986l.117 .007l.127 -.007a1 1 0 0 0 0 -1.986l-.117 -.007zm-.01 -7a1 1 0 0 0 -.993 .883l-.007 .117v4l.007 .117a1 1 0 0 0 1.986 0l.007 -.117v-4l-.007 -.117a1 1 0 0 0 -.993 -.883z" /></svg>
          <span><FormattedMessage id="emergencyButtonLabel" /></span>
        </button>

        {/* {showGpsOffline && (
          <div className={`gps-offline-notification ${isInfoModalOpen ? 'hidden' : ''}`}>
            <div className="gps-offline-content">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="icon icon-tabler icons-tabler-filled icon-tabler-alert-circle">
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M12 2c5.523 0 10 4.477 10 10a10 10 0 0 1 -19.995 .324l-.005 -.324l.004 -.28c.148 -5.393 4.566 -9.72 9.996 -9.72zm.01 13l-.127 .007a1 1 0 0 0 0 1.986l.117 .007l.127 -.007a1 1 0 0 0 0 -1.986l-.117 -.007zm-.01 -8a1 1 0 0 0 -.993 .883l-.007 .117v4l.007 .117a1 1 0 0 0 1.986 0l.007 -.117v-4l-.007 -.117a1 1 0 0 0 -.993 -.883z" />
              </svg>
              <div className="gps-offline-text">
                <div className="gps-offline-message">
                  <FormattedMessage id="gpsOfflineMessage" />
                </div>
              </div>
            </div>
          </div>
        )} */}

        {/* Info Modal - Only visible when map modal is open */}
        <div className={`info-modal-wrapper ${isMapModalOpen ? 'visible' : 'hidden'}`}>
          {showAllRoutesView ? (
            <div className="all-routes-view">
              <div className="all-routes-content">
                <div className="all-routes-header">
                  <div className="all-routes-info">
                    <span><FormattedMessage id="arrivalTime" /></span>
                    <span className="all-routes-arrival-time">{formatDigits(routeData.arrivalTime)}</span>
                  </div>
                  <div className="all-routes-details">
                    <div className="all-routes-item">
                      <div className="all-routes-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-walk"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M13 4m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /><path d="M7 21l3 -4" /><path d="M16 21l-2 -4l-3 -3l1 -6" /><path d="M6 12l2 -3l4 -1l3 3l3 1" /></svg>
                      </div>
                      <div className="all-routes-text">
                        <span className="all-routes-value">{formatDigits(routeData.totalTime)}</span>
                      </div>
                    </div>
                    <div className="all-routes-item">
                      <div className="all-routes-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-route"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M3 19a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" /><path d="M19 7a2 2 0 1 0 0 -4a2 2 0 0 0 0 4z" /><path d="M11 19h5.5a3.5 3.5 0 0 0 0 -7h-8a3.5 3.5 0 0 1 0 -7h4.5" /></svg>
                      </div>
                      <div className="all-routes-text">
                        <span className="all-routes-value">{formatDigits(routeData.totalDistance)}</span>
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
          ) : showAlternativeRoutes && !isDrActive ? (
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
                      {Array.isArray(route.via) ? route.via.join(' – ') : ''}
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
                        <span>{formatDigits(route.totalTime)}</span>
                      </div>

                      <div className="route-stat">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-route">
                          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                          <path d="M3 19a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" />
                          <path d="M19 7a2 2 0 1 0 0 -4a2 2 0 0 0 0 4z" />
                          <path d="M11 19h5.5a3.5 3.5 0 0 0 0 -7h-8a3.5 3.5 0 0 1 0 -7h4.5" />
                        </svg>
                        <span>{formatDigits(route.totalDistance)}</span>
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
                  <button className="close-button" onClick={() => navigate(-1)}>
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
                  <div className="info-title">
                    <div className="info-stat">
                      <span><FormattedMessage id="arrivalTime" /></span>
                      <span className="arrival-time">{formatDigits(routeData.arrivalTime)}</span>
                    </div>
                    <div className="info-details">
                      <div className="info-item">
                        <div className="info-icon">
                          {getTransportIcon(routeData.mode || transportMode)}
                        </div>
                        <div className="info-text">
                          <span className="info-value">{formatDigits(routeData.totalTime)}</span>
                        </div>
                      </div>

                      <div className="info-item">
                        <div className="info-icon">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-route"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M3 19a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" /><path d="M19 7a2 2 0 1 0 0 -4a2 2 0 0 0 0 4z" /><path d="M11 19h5.5a3.5 3.5 0 0 0 0 -7h-8a3.5 3.5 0 0 1 0 -7h4.5" /></svg>
                        </div>
                        <div className="info-text">
                          <span className="info-value">{formatDigits(routeData.totalDistance)}</span>
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
                    {!isDrActive && routeData.alternativeRoutes.length > 0 && (
                      <>
                        <span className="sdivider"></span>
                        <button className="route-button" onClick={handleShowAlternativeRoutes}>
                          <div className="button-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-route-alt-left"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M8 3h-5v5" /><path d="M16 3h5v5" /><path d="M3 3l7.536 7.536a5 5 0 0 1 1.464 3.534v6.93" /><path d="M18 6.01v-.01" /><path d="M16 8.02v-.01" /><path d="M14 10v.01" /></svg>
                          </div>
                          <span><FormattedMessage id="otherRoutes" /></span>
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}

              <div className="bottom-controls">
                <button
                  className={`start-routing-button ${isRoutingActive ? 'stop-routing' : ''}`}
                  onClick={() => {
                    toggleRouting();
                    if (!isRoutingActive) {
                      toggleInfoModal(); // Call only when not active
                    }
                  }}
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
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="9.99984" cy="5" r="3.33333" fill="#1E2023" />
                      <ellipse cx="9.99984" cy="14.1667" rx="5.83333" ry="3.33333" fill="#1E2023" />
                    </svg>
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
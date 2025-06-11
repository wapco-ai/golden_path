import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const MapComponent = ({ setUserLocation, selectedDestination, isSwapped }) => {
  const mapRef = useRef(null);
  const userMarkerRef = useRef(null);
  const destinationMarkerRef = useRef(null);
  const polylineRef = useRef(null);

  useEffect(() => {
    // Initialize the map
    const mapContainer = document.createElement('div');
    mapContainer.id = 'map-container';
    mapContainer.style.width = '100%';
    mapContainer.style.height = '100%';
    
    const mapParent = document.querySelector('.map-routing-container');
    mapParent.appendChild(mapContainer);

    const map = L.map(mapContainer, {
      attributionControl: false,
      zoomControl: false
    }).setView([36.2880, 59.6157], 16);
    mapRef.current = map;
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    // Hide leaflet watermark
    const style = document.createElement('style');
    style.innerHTML = '.leaflet-control-attribution { display: none !important; }';
    document.head.appendChild(style);

    // Custom marker icons
    const userIcon = L.divIcon({
      html: `
        <div style="
          width: 20px;
          height: 20px;
          background-color: white;
          border-radius: 50%;
          border: 6px solid #4285F4;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="
            width: 8px;
            height: 8px;
            background-color: white;
            border-radius: 50%;
          "></div>
        </div>
      `,
      className: '',
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });

    const destinationIcon = L.divIcon({
      html: `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#F44336">
          <path d="M18.364 4.636a9 9 0 0 1 .203 12.519l-.203 .21l-4.243 4.242a3 3 0 0 1 -4.097 .135l-.144 -.135l-4.244 -4.243a9 9 0 0 1 12.728 -12.728zm-6.364 3.364a3 3 0 1 0 0 6a3 3 0 1 0 0 -6z" />
        </svg>
      `,
      className: '',
      iconSize: [24, 24],
      iconAnchor: [12, 24]
    });

    // Request user location without high accuracy (to avoid Google APIs)
    const handleLocationSuccess = (position) => {
      const { latitude, longitude } = position.coords;
      setUserLocation('موقعیت فعلی شما');
      
      // Remove previous marker if exists
      if (userMarkerRef.current) {
        map.removeLayer(userMarkerRef.current);
      }
      
      // Add new marker
      userMarkerRef.current = L.marker([latitude, longitude], {
        icon: userIcon
      }).addTo(map).bindPopup('موقعیت فعلی شما');
      
      // Center map
      map.setView([latitude, longitude], 16);

      // If we have a destination, draw the route
      if (selectedDestination) {
        updateDestinationMarker();
      }
    };

    const handleLocationError = (error) => {
      console.error('Error getting location:', error);
      // Default to Imam Reza shrine
      if (userMarkerRef.current) {
        map.removeLayer(userMarkerRef.current);
      }
      userMarkerRef.current = L.marker([36.2880, 59.6157], {
        icon: userIcon
      }).addTo(map)
        .bindPopup('حرم مطهر امام رضا (ع)');
      setUserLocation('باب الرضا «ع»');
    };

    const getLocation = () => {
      if (navigator.geolocation) {
        // Use standard accuracy to avoid Google API calls
        navigator.geolocation.getCurrentPosition(
          handleLocationSuccess,
          handleLocationError,
          {
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 60000
          }
        );
      } else {
        // Fallback if geolocation not supported
        userMarkerRef.current = L.marker([36.2880, 59.6157], {
          icon: userIcon
        }).addTo(map)
          .bindPopup('حرم مطهر امام رضا (ع)');
        setUserLocation('باب الرضا «ع»');
      }
    };

    // Initial location fetch
    getLocation();

    // Set up watch position for updates
    const watchId = navigator.geolocation.watchPosition(
      handleLocationSuccess,
      handleLocationError,
      {
        enableHighAccuracy: false,
        maximumAge: 0,
        timeout: 10000
      }
    );

    const updateDestinationMarker = () => {
      if (!selectedDestination || !mapRef.current) return;

      // For demo purposes, we'll use a fixed location offset from user position
      let destCoords;
      if (userMarkerRef.current) {
        const userLatLng = userMarkerRef.current.getLatLng();
        destCoords = [userLatLng.lat + 0.001, userLatLng.lng + 0.001];
      } else {
        destCoords = [36.2880, 59.6157];
      }
      
      if (destinationMarkerRef.current) {
        mapRef.current.removeLayer(destinationMarkerRef.current);
      }
      
      destinationMarkerRef.current = L.marker(destCoords, {
        icon: destinationIcon
      }).addTo(mapRef.current)
        .bindPopup(selectedDestination.name);
      
      // Draw route between user location and destination
      if (polylineRef.current) {
        mapRef.current.removeLayer(polylineRef.current);
      }
      
      if (userMarkerRef.current) {
        const userLatLng = userMarkerRef.current.getLatLng();
        polylineRef.current = L.polyline([userLatLng, destCoords], {
          color: '#4285F4',
          weight: 4,
          opacity: 0.7
        }).addTo(mapRef.current);
        
        // Fit bounds to show both markers
        mapRef.current.fitBounds([userLatLng, destCoords], {
          padding: [50, 50]
        });
      }
    };

    // Handle map click for destination selection
    const handleMapClick = (e) => {
      if (!selectedDestination) {
        // Here you can add logic to handle destination selection from map
        console.log('Map clicked at:', e.latlng);
      }
    };

    map.on('click', handleMapClick);

    return () => {
      navigator.geolocation.clearWatch(watchId);
      map.off('click', handleMapClick);
      map.remove();
      document.head.removeChild(style);
      mapParent.removeChild(mapContainer);
    };
  }, [setUserLocation]);

  // Update destination marker when selectedDestination changes or when swapped
  useEffect(() => {
    if (mapRef.current) {
      updateDestinationMarker();
      
      // If swapped, swap the markers visually
      if (isSwapped && userMarkerRef.current && destinationMarkerRef.current) {
        const userLatLng = userMarkerRef.current.getLatLng();
        const destLatLng = destinationMarkerRef.current.getLatLng();
        
        // Swap positions
        userMarkerRef.current.setLatLng(destLatLng);
        destinationMarkerRef.current.setLatLng(userLatLng);
        
        // Update polyline
        if (polylineRef.current) {
          polylineRef.current.setLatLngs([destLatLng, userLatLng]);
        }
      }
    }
  }, [selectedDestination, isSwapped]);

  // Function to update destination marker (defined inside useEffect to use refs)
  const updateDestinationMarker = () => {
    if (!selectedDestination || !mapRef.current) return;

    // For demo purposes, we'll use a fixed location offset from user position
    let destCoords;
    if (userMarkerRef.current) {
      const userLatLng = userMarkerRef.current.getLatLng();
      destCoords = [userLatLng.lat + 0.001, userLatLng.lng + 0.001];
    } else {
      destCoords = [36.2880, 59.6157];
    }
    
    if (destinationMarkerRef.current) {
      mapRef.current.removeLayer(destinationMarkerRef.current);
    }
    
    destinationMarkerRef.current = L.marker(destCoords, {
      icon: L.divIcon({
        html: `
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#F44336">
            <path d="M18.364 4.636a9 9 0 0 1 .203 12.519l-.203 .21l-4.243 4.242a3 3 0 0 1 -4.097 .135l-.144 -.135l-4.244 -4.243a9 9 0 0 1 12.728 -12.728zm-6.364 3.364a3 3 0 1 0 0 6a3 3 0 1 0 0 -6z" />
          </svg>
        `,
        className: '',
        iconSize: [24, 24],
        iconAnchor: [12, 24]
      })
    }).addTo(mapRef.current)
      .bindPopup(selectedDestination.name);
    
    // Draw route between user location and destination
    if (polylineRef.current) {
      mapRef.current.removeLayer(polylineRef.current);
    }
    
    if (userMarkerRef.current) {
      const userLatLng = userMarkerRef.current.getLatLng();
      polylineRef.current = L.polyline([userLatLng, destCoords], {
        color: '#4285F4',
        weight: 4,
        opacity: 0.7
      }).addTo(mapRef.current);
      
      // Fit bounds to show both markers
      mapRef.current.fitBounds([userLatLng, destCoords], {
        padding: [50, 50]
      });
    }
  };

  return null;
};

export default MapComponent;
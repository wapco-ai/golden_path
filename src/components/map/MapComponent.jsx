import React, { useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const MapComponent = ({ setUserLocation }) => {
  useEffect(() => {
    // Initialize the map
    const mapContainer = document.createElement('div');
    mapContainer.id = 'map-container';
    mapContainer.style.width = '100%';
    mapContainer.style.height = '100%';
    
    const mapParent = document.querySelector('.map-routing-container');
    mapParent.appendChild(mapContainer);

    const map = L.map(mapContainer, {
      attributionControl: false
    }).setView([36.2880, 59.6157], 16);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    // Hide leaflet watermark
    const style = document.createElement('style');
    style.innerHTML = '.leaflet-control-attribution { display: none !important; }';
    document.head.appendChild(style);

    // Request user location
    const handleLocationSuccess = (position) => {
      const { latitude, longitude } = position.coords;
      setUserLocation('موقعیت فعلی شما');
      
      // Add marker
      L.marker([latitude, longitude], {
        icon: L.divIcon({
          html: `<div class="user-location-marker"></div>`,
          className: '',
          iconSize: [20, 20]
        })
      }).addTo(map).bindPopup('موقعیت فعلی شما');
      
      // Center map
      map.setView([latitude, longitude], 16);
    };

    const handleLocationError = (error) => {
      console.error('Error getting location:', error);
      // Default to Imam Reza shrine
      L.marker([36.2880, 59.6157]).addTo(map)
        .bindPopup('حرم مطهر امام رضا (ع)');
      setUserLocation('باب الرضا «ع»');
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        handleLocationSuccess,
        handleLocationError,
        {
          enableHighAccuracy: true,
          timeout: 10000
        }
      );
    } else {
      // Fallback if geolocation not supported
      L.marker([36.2880, 59.6157]).addTo(map)
        .bindPopup('حرم مطهر امام رضا (ع)');
      setUserLocation('باب الرضا «ع»');
    }

    return () => {
      map.remove();
      document.head.removeChild(style);
      mapParent.removeChild(mapContainer);
    };
  }, [setUserLocation]);

  return null;
};

export default MapComponent;
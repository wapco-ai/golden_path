import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const MapComponent = ({ currentLocation, destination }) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);
  const routeLayerRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize map
    mapInstance.current = L.map(mapRef.current).setView(
      [currentLocation.lat, currentLocation.lng], 
      18
    );

    // Add tile layer (you might want to use a different tile provider)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(mapInstance.current);

    // Add current location marker
    const currentLocationMarker = L.marker([currentLocation.lat, currentLocation.lng], {
      icon: L.divIcon({
        className: 'current-location-marker',
        html: '<div class="pulse-marker"></div>',
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      })
    }).addTo(mapInstance.current);
    markersRef.current.push(currentLocationMarker);

    return () => {
      mapInstance.current.remove();
    };
  }, [currentLocation]);

  useEffect(() => {
    if (!destination || !mapInstance.current) return;

    // Clear previous markers and route
    markersRef.current.forEach(marker => mapInstance.current.removeLayer(marker));
    markersRef.current = [];
    
    if (routeLayerRef.current) {
      mapInstance.current.removeLayer(routeLayerRef.current);
    }

    // Add destination marker (you'll need proper coordinates for the destination)
    const destMarker = L.marker([destination.lat, destination.lng], {
      icon: L.divIcon({
        className: 'destination-marker',
        html: '<div class="destination-icon"></div>',
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      })
    }).addTo(mapInstance.current);
    markersRef.current.push(destMarker);

    // Here you would add routing logic
    // For now, just draw a straight line (replace with actual routing)
    routeLayerRef.current = L.polyline(
      [[currentLocation.lat, currentLocation.lng], [destination.lat, destination.lng]],
      { color: '#4a90e2', weight: 5 }
    ).addTo(mapInstance.current);

    // Fit map to show both points
    mapInstance.current.fitBounds([
      [currentLocation.lat, currentLocation.lng],
      [destination.lat, destination.lng]
    ]);

  }, [destination, currentLocation]);

  return <div ref={mapRef} className="map-container" />;
};

export default MapComponent;
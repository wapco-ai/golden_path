import React, { useEffect, useRef } from 'react';  
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap } from 'react-leaflet';  
import L from 'leaflet';  
import 'leaflet/dist/leaflet.css';  
import { useGPSStore } from '../../store/gpsStore';  

// برای رفع مشکل آیکون‌های Leaflet در React  
import icon from 'leaflet/dist/images/marker-icon.png';  
import iconShadow from 'leaflet/dist/images/marker-shadow.png';  

const DefaultIcon = L.icon({  
  iconUrl: icon,  
  shadowUrl: iconShadow,  
  iconSize: [25, 41],  
  iconAnchor: [12, 41]  
});  

L.Marker.prototype.options.icon = DefaultIcon;  

// کامپوننت برای به‌روزرسانی مرکز نقشه بر اساس موقعیت  
const SetViewOnLocation = ({ position }) => {  
  const map = useMap();  
  
  useEffect(() => {  
    if (position && position.coords) {  
      map.setView([position.coords.lat, position.coords.lng], 16);  
    }  
  }, [position, map]);  
  
  return null;  
};  

const MapView = ({ height = '70vh', trackUser = true }) => {  
  const mapRef = useRef(null);  
  const { currentLocation, locationHistory, savedLocations, qrCodeLocations } = useGPSStore();  
  
  // تبدیل تاریخچه موقعیت به آرایه نقاط برای Polyline  
  const pathPoints = locationHistory.map(loc => [loc.coords.lat, loc.coords.lng]);  
  
  return (  
    <MapContainer   
      center={[35.6892, 51.3890]} // تهران  
      zoom={13}   
      style={{ height, width: '100%' }}  
      ref={mapRef}  
    >  
      <TileLayer  
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"  
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'  
      />  
      
      {/* نمایش موقعیت فعلی */}  
      {currentLocation && currentLocation.coords && (  
        <>  
          <Marker position={[currentLocation.coords.lat, currentLocation.coords.lng]}>  
            <Popup>  
              موقعیت فعلی شما  
              <br />  
              دقت: {currentLocation.coords.accuracy.toFixed(2)} متر  
            </Popup>  
          </Marker>  
          
          {/* دایره دقت */}  
          <Circle   
            center={[currentLocation.coords.lat, currentLocation.coords.lng]}  
            radius={currentLocation.coords.accuracy}  
            color="blue"  
            fillColor="blue"  
            fillOpacity={0.1}  
          />  
        </>  
      )}  
      
      {/* نمایش مسیر طی شده */}  
      {pathPoints.length > 1 && (  
        <Polyline positions={pathPoints} color="blue" />  
      )}  
      
      {/* نمایش مکان‌های ذخیره شده */}  
      {savedLocations.map(loc => (  
        <Marker   
          key={loc.id}  
          position={[loc.coords.lat, loc.coords.lng]}  
          icon={L.divIcon({  
            className: 'custom-saved-marker',  
            html: `<div style="background-color: #4CAF50; width: 12px; height: 12px; border-radius: 50%;"></div>`,  
            iconSize: [12, 12],  
            iconAnchor: [6, 6]  
          })}  
        >  
          <Popup>{loc.name || 'مکان ذخیره شده'}</Popup>  
        </Marker>  
      ))}  
      
      {/* نمایش مکان‌های QR Code */}  
      {qrCodeLocations.map(qrLoc => (  
        <Marker   
          key={qrLoc.id}  
          position={[qrLoc.location.coords.lat, qrLoc.location.coords.lng]}  
          icon={L.divIcon({  
            className: 'custom-qr-marker',  
            html: `<div style="background-color: #9C27B0; width: 12px; height: 12px; border-radius: 50%;"></div>`,  
            iconSize: [12, 12],  
            iconAnchor: [6, 6]  
          })}  
        >  
          <Popup>  
            <div>  
              <strong>QR Code اسکن شده</strong>  
              <p>{qrLoc.qrData}</p>  
              <small>{new Date(qrLoc.scannedAt).toLocaleString('fa-IR')}</small>  
            </div>  
          </Popup>  
        </Marker>  
      ))}  
      
      {/* به‌روزرسانی نمای نقشه */}  
      {trackUser && currentLocation && (  
        <SetViewOnLocation position={currentLocation} />  
      )}  
    </MapContainer>  
  );  
};  

export default MapView;  
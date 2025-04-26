import React, { useEffect, useRef, useState } from 'react';  
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap } from 'react-leaflet';  
import L from 'leaflet';  
import 'leaflet/dist/leaflet.css';  

// برای حل مشکل آیکون‌های Leaflet در React  
import markerIcon from 'leaflet/dist/images/marker-icon.png';  
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';  
import markerShadow from 'leaflet/dist/images/marker-shadow.png';  

// تنظیم آیکون‌های پیش‌فرض Leaflet  
delete L.Icon.Default.prototype._getIconUrl;  
L.Icon.Default.mergeOptions({  
  iconUrl: markerIcon,  
  iconRetinaUrl: markerIcon2x,  
  shadowUrl: markerShadow,  
});  

// آیکون موقعیت فعلی با رنگ آبی  
const currentLocationIcon = new L.Icon({  
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzAwODVmZiIgd2lkdGg9IjI0cHgiIGhlaWdodD0iMjRweCI+PHBhdGggZD0iTTAgMGgyNHYyNEgweiIgZmlsbD0ibm9uZSIvPjxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjgiLz48L3N2Zz4=',  
  iconSize: [24, 24],  
  iconAnchor: [12, 12],  
  popupAnchor: [0, -12],  
});  

// کامپوننت برای به‌روزرسانی خودکار مرکز نقشه با تغییر موقعیت  
const AutoCenterMap = ({ position, follow }) => {  
  const map = useMap();  
  
  useEffect(() => {  
    if (position && position.coords && follow) {  
      map.setView([position.coords.lat, position.coords.lng], map.getZoom());  
    }  
  }, [position, follow, map]);  
  
  return null;  
};  

// کامپوننت اصلی نقشه  
const MapView = ({   
  currentLocation,   
  locationHistory = [],   
  savedLocations = [],   
  height = '70vh',   
  followUser = true,  
  initialZoom = 15,  
  onMapClick  
}) => {  
  const [map, setMap] = useState(null);  
  const [isFollowing, setIsFollowing] = useState(followUser);  
  
  // تبدیل آرایه موقعیت‌ها به فرمت مناسب برای Polyline  
  const pathPoints = locationHistory  
    .filter(loc => loc?.coords?.lat && loc?.coords?.lng)  
    .map(loc => [loc.coords.lat, loc.coords.lng]);  
  
  // تغییر وضعیت تعقیب کاربر  
  const toggleFollow = () => {  
    setIsFollowing(prev => !prev);  
    if (!isFollowing && currentLocation?.coords) {  
      map?.setView([currentLocation.coords.lat, currentLocation.coords.lng], map?.getZoom() || initialZoom);  
    }  
  };  
  
  // محاسبه مرکز اولیه نقشه  
  const getInitialCenter = () => {  
    if (currentLocation?.coords) {  
      return [currentLocation.coords.lat, currentLocation.coords.lng];  
    }  
    if (locationHistory.length > 0 && locationHistory[0]?.coords) {  
      return [locationHistory[0].coords.lat, locationHistory[0].coords.lng];  
    }  
    // مرکز پیش‌فرض - تهران  
    return [35.6892, 51.3890];  
  };  
  
  return (  
    <div className="map-container" style={{ position: 'relative' }}>  
      <MapContainer   
        center={getInitialCenter()}   
        zoom={initialZoom}   
        style={{ height, width: '100%', zIndex: 1 }}  
        whenCreated={setMap}  
        onClick={onMapClick}  
      >  
        <TileLayer  
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'  
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"  
        />  
        
        {/* نمایش موقعیت فعلی کاربر */}  
        {currentLocation?.coords && (  
          <>  
            <Marker   
              position={[currentLocation.coords.lat, currentLocation.coords.lng]}  
              icon={currentLocationIcon}  
            >  
              <Popup>  
                <div>  
                  <h3>موقعیت فعلی شما</h3>  
                  <p>طول جغرافیایی: {currentLocation.coords.lng.toFixed(6)}</p>  
                  <p>عرض جغرافیایی: {currentLocation.coords.lat.toFixed(6)}</p>  
                  <p>دقت: {currentLocation.coords.accuracy.toFixed(2)} متر</p>  
                  {currentLocation.coords.altitude && (  
                    <p>ارتفاع: {currentLocation.coords.altitude.toFixed(2)} متر</p>  
                  )}  
                  {currentLocation.coords.heading && (  
                    <p>جهت: {currentLocation.coords.heading.toFixed(2)}°</p>  
                  )}  
                  {currentLocation.coords.speed && (  
                    <p>سرعت: {(currentLocation.coords.speed * 3.6).toFixed(2)} کیلومتر بر ساعت</p>  
                  )}  
                </div>  
              </Popup>  
            </Marker>  
            
            {/* دایره نشان‌دهنده دقت موقعیت */}  
            <Circle   
              center={[currentLocation.coords.lat, currentLocation.coords.lng]}  
              radius={currentLocation.coords.accuracy}  
              color="#0085ff"  
              fillColor="#0085ff"  
              fillOpacity={0.1}  
            />  
          </>  
        )}  
        
        {/* مسیر طی شده */}  
        {pathPoints.length > 1 && (  
          <Polyline   
            positions={pathPoints}   
            color="#0085ff"   
            weight={3}   
            opacity={0.7}   
          />  
        )}  
        
        {/* نقاط ذخیره شده */}  
        {savedLocations.map((location, index) => (  
          <Marker   
            key={location.id || index}  
            position={[location.coords.lat, location.coords.lng]}  
          >  
            <Popup>  
              <div>  
                <h3>{location.name || 'مکان ذخیره شده'}</h3>  
                <p>طول جغرافیایی: {location.coords.lng.toFixed(6)}</p>  
                <p>عرض جغرافیایی: {location.coords.lat.toFixed(6)}</p>  
                {location.timestamp && (  
                  <p>زمان ذخیره: {new Date(location.timestamp).toLocaleString('fa-IR')}</p>  
                )}  
              </div>  
            </Popup>  
          </Marker>  
        ))}  
        
        {/* تنظیم خودکار مرکز نقشه بر اساس موقعیت کاربر */}  
        <AutoCenterMap position={currentLocation} follow={isFollowing} />  
      </MapContainer>  
      
      {/* دکمه تعقیب موقعیت کاربر */}  
      <div   
        className="map-control-button location-follow-button"   
        style={{  
          position: 'absolute',  
          bottom: '20px',  
          right: '10px',  
          zIndex: 2,  
          backgroundColor: isFollowing ? '#0085ff' : 'white',  
          color: isFollowing ? 'white' : '#333',  
          padding: '8px',  
          borderRadius: '4px',  
          boxShadow: '0 1px 5px rgba(0,0,0,0.4)',  
          cursor: 'pointer',  
          display: 'flex',  
          alignItems: 'center',  
          justifyContent: 'center',  
          width: '40px',  
          height: '40px'  
        }}  
        onClick={toggleFollow}  
        title={isFollowing ? 'توقف تعقیب موقعیت' : 'تعقیب موقعیت'}  
      >  
        {/* آیکون تعقیب موقعیت */}  
        <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none">  
          <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" />  
          <circle cx="12" cy="10" r="3" />  
        </svg>  
      </div>  
      
      {/* دکمه بازگشت به موقعیت فعلی */}  
      <div   
        className="map-control-button center-location-button"   
        style={{  
          position: 'absolute',  
          bottom: '70px',  
          right: '10px',  
          zIndex: 2,  
          backgroundColor: 'white',  
          color: '#333',  
          padding: '8px',  
          borderRadius: '4px',  
          boxShadow: '0 1px 5px rgba(0,0,0,0.4)',  
          cursor: 'pointer',  
          display: 'flex',  
          alignItems: 'center',  
          justifyContent: 'center',  
          width: '40px',  
          height: '40px'  
        }}  
        onClick={() => {  
          if (currentLocation?.coords && map) {  
            map.setView(  
              [currentLocation.coords.lat, currentLocation.coords.lng],   
              map.getZoom()  
            );  
          }  
        }}  
        title="مرکز به موقعیت فعلی"  
      >  
        {/* آیکون مرکز به موقعیت فعلی */}  
        <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none">  
          <circle cx="12" cy="12" r="10" />  
          <circle cx="12" cy="12" r="3" />  
        </svg>  
      </div>  
    </div>  
  );  
};  

export default MapView;  
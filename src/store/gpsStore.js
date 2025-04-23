import { create } from 'zustand';  
import { persist } from 'zustand/middleware';  

export const useGPSStore = create(  
  persist(  
    (set, get) => ({  
      currentLocation: null,  
      locationHistory: [],  
      savedLocations: [],  
      qrCodeLocations: [],  
      isTracking: false,  
      routeInfo: null,  
      
      // به‌روزرسانی موقعیت فعلی  
      updateCurrentLocation: (location) => set({ currentLocation: location }),  
      
      // افزودن موقعیت به تاریخچه  
      addLocationToHistory: (location) => set(state => ({  
        locationHistory: [...state.locationHistory, { ...location, id: Date.now() }]  
      })),  
      
      // ذخیره موقعیت  
      saveLocation: (location, name) => set(state => ({  
        savedLocations: [...state.savedLocations, {   
          ...location,   
          id: Date.now(),   
          name: name || `مکان ${state.savedLocations.length + 1}`   
        }]  
      })),  
      
      // ذخیره موقعیت QR Code  
      addQRCodeLocation: (qrData, location) => set(state => ({  
        qrCodeLocations: [...state.qrCodeLocations, {  
          id: Date.now(),  
          qrData,  
          location,  
          scannedAt: new Date().toISOString()  
        }]  
      })),  
      
      // شروع/توقف ردیابی  
      toggleTracking: () => set(state => ({ isTracking: !state.isTracking })),  
      
      // تنظیم اطلاعات مسیر  
      setRouteInfo: (routeInfo) => set({ routeInfo }),  
      
      // پاک‌کردن تاریخچه موقعیت  
      clearLocationHistory: () => set({ locationHistory: [] }),  
      
      // حذف یک موقعیت ذخیره‌شده  
      deleteSavedLocation: (id) => set(state => ({  
        savedLocations: state.savedLocations.filter(loc => loc.id !== id)  
      })),  
    }),  
    {  
      name: 'gps-storage',  
      version: 1,  
    }  
  )  
);  
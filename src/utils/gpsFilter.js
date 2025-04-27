// src/utils/gpsFilter.js  
// فاصله هاوِرساین بین دو نقطه جغرافیایی (به متر)  
const calculateDistance = (lat1, lon1, lat2, lon2) => {  
  const R = 6371e3; // شعاع زمین به متر  
  const φ1 = lat1 * Math.PI / 180;  
  const φ2 = lat2 * Math.PI / 180;  
  const Δφ = (lat2 - lat1) * Math.PI / 180;  
  const Δλ = (lon2 - lon1) * Math.PI / 180;  

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +  
          Math.cos(φ1) * Math.cos(φ2) *  
          Math.sin(Δλ / 2) * Math.sin(Δλ / 2);  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));  
  return R * c;  
};  

export const isValidGPSReading = (current, previous) => {  
  if (!previous || !current) return true;  
  
  // بررسی وجود مختصات معتبر  
  if (!previous.coords || !current.coords ||  
      !previous.coords.lat || !previous.coords.lng ||  
      !current.coords.lat || !current.coords.lng) {  
    console.log('مختصات ناقص یا نامعتبر');  
    return true; // فرض بر معتبر بودن در صورت نامشخص بودن  
  }  
  
  // محاسبه فاصله بین دو نقطه  
  const distance = calculateDistance(  
    previous.coords.lat, previous.coords.lng,  
    current.coords.lat, current.coords.lng  
  );  
  
  // محاسبه زمان (اگر زمان نامعتبر باشد، فرض بر معتبر بودن داده)  
  if (!previous.timestamp || !current.timestamp) return true;  
  
  const timeDiff = (current.timestamp - previous.timestamp) / 1000;  
  if (timeDiff <= 0) return true; // زمان نامعتبر است  
  
  // سرعت (متر بر ثانیه)  
  const speed = distance / timeDiff;  
  
  console.log(`فاصله: ${distance.toFixed(2)}m, زمان: ${timeDiff.toFixed(2)}s, سرعت: ${speed.toFixed(2)}m/s`);  
  
  // اگر سرعت بیش از 5 متر بر ثانیه باشد، غیر معقول است  
  if (speed > 5) {  
    console.log('سرعت غیرمعقول - داده فیلتر شد');  
    return false;  
  }  
  
  // اگر فاصله بیش از 50 متر باشد و زمان کمتر از 5 ثانیه  
  if (distance > 50 && timeDiff < 5) {  
    console.log('پرش موقعیت - داده فیلتر شد');  
    return false;  
  }  
  
  return true;  
};  

// صدور تابع محاسبه فاصله برای استفاده در جاهای دیگر  
export { calculateDistance };  
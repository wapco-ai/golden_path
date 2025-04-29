// src/services/LogStorageService.js  
export class LogStorageService {  
  static DB_NAME = 'gps_tracker_db';  
  static GPS_LOGS_STORE = 'gps_logs';  
  static TRACK_LOGS_STORE = 'track_logs';  
  
  static async initDB() {  
    return new Promise((resolve, reject) => {  
      const request = indexedDB.open(this.DB_NAME, 1);  
      
      request.onupgradeneeded = (event) => {  
        const db = event.target.result;  
        
        // ایجاد فروشگاه برای لاگ‌های GPS  
        if (!db.objectStoreNames.contains(this.GPS_LOGS_STORE)) {  
          const gpsStore = db.createObjectStore(this.GPS_LOGS_STORE, { keyPath: 'id', autoIncrement: true });  
          gpsStore.createIndex('timestamp', 'timestamp', { unique: false });  
        }  
        
        // ایجاد فروشگاه برای لاگ‌های مسیر  
        if (!db.objectStoreNames.contains(this.TRACK_LOGS_STORE)) {  
          const trackStore = db.createObjectStore(this.TRACK_LOGS_STORE, { keyPath: 'id', autoIncrement: true });  
          trackStore.createIndex('startTime', 'startTime', { unique: false });  
        }  
      };  
      
      request.onsuccess = (event) => {  
        resolve(event.target.result);  
      };  
      
      request.onerror = (event) => {  
        console.error('خطا در باز کردن دیتابیس:', event.target.error);  
        reject(event.target.error);  
      };  
    });  
  }  
  
  static async saveGPSLog(location, isNoisy = false) {  
    try {  
      const db = await this.initDB();  
      return new Promise((resolve, reject) => {  
        const transaction = db.transaction([this.GPS_LOGS_STORE], 'readwrite');  
        const store = transaction.objectStore(this.GPS_LOGS_STORE);  
        
        const log = {  
          coords: location.coords,  
          timestamp: location.timestamp || Date.now(),  
          isNoisy,  
          deviceInfo: {  
            userAgent: navigator.userAgent,  
            platform: navigator.platform,  
            language: navigator.language,  
            connection: navigator.connection ? {  
              type: navigator.connection.type,  
              effectiveType: navigator.connection.effectiveType,  
              downlink: navigator.connection.downlink,  
              rtt: navigator.connection.rtt  
            } : null  
          },  
          logTime: new Date().toISOString()  
        };  
        
        const request = store.add(log);  
        
        request.onsuccess = () => {  
          resolve(request.result);  
        };  
        
        request.onerror = (event) => {  
          console.error('خطا در ذخیره لاگ GPS:', event.target.error);  
          reject(event.target.error);  
        };  
      });  
    } catch (err) {  
      console.error('خطا در ذخیره لاگ GPS:', err);  
      // فول‌بک به localStorage اگر IndexedDB کار نکرد  
      this.saveGPSLogToLocalStorage(location, isNoisy);  
    }  
  }  
  
  static saveGPSLogToLocalStorage(location, isNoisy = false) {  
    try {  
      const logs = JSON.parse(localStorage.getItem('gps_logs') || '[]');  
      logs.push({  
        coords: location.coords,  
        timestamp: location.timestamp || Date.now(),  
        isNoisy,  
        deviceInfo: {  
          userAgent: navigator.userAgent  
        },  
        logTime: new Date().toISOString()  
      });  
      
      // محدود کردن تعداد لاگ‌ها برای جلوگیری از پر شدن حافظه  
      if (logs.length > 10000) {  
        logs.splice(0, logs.length - 10000);  
      }  
      
      localStorage.setItem('gps_logs', JSON.stringify(logs));  
    } catch (err) {  
      console.error('خطا در ذخیره لاگ در localStorage:', err);  
    }  
  }  
  
  static async saveTrackLog(trackPoints, startTime, endTime, metadata = {}) {  
    try {  
      const db = await this.initDB();  
      return new Promise((resolve, reject) => {  
        const transaction = db.transaction([this.TRACK_LOGS_STORE], 'readwrite');  
        const store = transaction.objectStore(this.TRACK_LOGS_STORE);  
        
        const trackLog = {  
          points: trackPoints,  
          startTime,  
          endTime,  
          duration: endTime - startTime,  
          pointCount: trackPoints.length,  
          metadata: {  
            ...metadata,  
            deviceInfo: {  
              userAgent: navigator.userAgent,  
              platform: navigator.platform  
            }  
          },  
          createdAt: new Date().toISOString()  
        };  
        
        const request = store.add(trackLog);  
        
        request.onsuccess = () => {  
          resolve(request.result);  
        };  
        
        request.onerror = (event) => {  
          console.error('خطا در ذخیره لاگ مسیر:', event.target.error);  
          reject(event.target.error);  
        };  
      });  
    } catch (err) {  
      console.error('خطا در ذخیره لاگ مسیر:', err);  
      // فول‌بک به localStorage  
      this.saveTrackLogToLocalStorage(trackPoints, startTime, endTime, metadata);  
    }  
  }  
  
  static saveTrackLogToLocalStorage(trackPoints, startTime, endTime, metadata = {}) {  
    try {  
      const tracks = JSON.parse(localStorage.getItem('track_logs') || '[]');  
      tracks.push({  
        points: trackPoints,  
        startTime,  
        endTime,  
        duration: endTime - startTime,  
        pointCount: trackPoints.length,  
        metadata,  
        createdAt: new Date().toISOString()  
      });  
      
      // محدود کردن تعداد مسیرها  
      if (tracks.length > 100) {  
        tracks.splice(0, tracks.length - 100);  
      }  
      
      localStorage.setItem('track_logs', JSON.stringify(tracks));  
    } catch (err) {  
      console.error('خطا در ذخیره مسیر در localStorage:', err);  
    }  
  }  
  
  static async getGPSLogs(limit = 1000, offset = 0) {  
    try {  
      const db = await this.initDB();  
      return new Promise((resolve, reject) => {  
        const transaction = db.transaction([this.GPS_LOGS_STORE], 'readonly');  
        const store = transaction.objectStore(this.GPS_LOGS_STORE);  
        const index = store.index('timestamp');  
        
        const logs = [];  
        let cursorRequest = index.openCursor(null, 'prev'); // از جدیدترین به قدیمی‌ترین  
        let count = 0;  
        
        cursorRequest.onsuccess = (event) => {  
          const cursor = event.target.result;  
          if (cursor && count < offset + limit) {  
            if (count >= offset) {  
              logs.push(cursor.value);  
            }  
            count++;  
            cursor.continue();  
          } else {  
            resolve(logs);  
          }  
        };  
        
        cursorRequest.onerror = (event) => {  
          console.error('خطا در بازیابی لاگ‌های GPS:', event.target.error);  
          reject(event.target.error);  
        };  
      });  
    } catch (err) {  
      console.error('خطا در بازیابی لاگ‌های GPS:', err);  
      // فول‌بک به localStorage  
      const logs = JSON.parse(localStorage.getItem('gps_logs') || '[]');  
      return logs.slice(-Math.min(limit, logs.length));  
    }  
  }  
  
  static async getTrackLogs() {  
    try {  
      const db = await this.initDB();  
      return new Promise((resolve, reject) => {  
        const transaction = db.transaction([this.TRACK_LOGS_STORE], 'readonly');  
        const store = transaction.objectStore(this.TRACK_LOGS_STORE);  
        const index = store.index('startTime');  
        
        const request = index.getAll();  
        
        request.onsuccess = () => {  
          resolve(request.result);  
        };  
        
        request.onerror = (event) => {  
          console.error('خطا در بازیابی لاگ‌های مسیر:', event.target.error);  
          reject(event.target.error);  
        };  
      });  
    } catch (err) {  
      console.error('خطا در بازیابی لاگ‌های مسیر:', err);  
      // فول‌بک به localStorage  
      return JSON.parse(localStorage.getItem('track_logs') || '[]');  
    }  
  }  
  
  static async clearGPSLogs() {  
    try {  
      const db = await this.initDB();  
      return new Promise((resolve, reject) => {  
        const transaction = db.transaction([this.GPS_LOGS_STORE], 'readwrite');  
        const store = transaction.objectStore(this.GPS_LOGS_STORE);  
        
        const request = store.clear();  
        
        request.onsuccess = () => {  
          resolve(true);  
        };  
        
        request.onerror = (event) => {  
          console.error('خطا در پاک کردن لاگ‌های GPS:', event.target.error);  
          reject(event.target.error);  
        };  
      });  
    } catch (err) {  
      console.error('خطا در پاک کردن لاگ‌های GPS:', err);  
      localStorage.removeItem('gps_logs');  
      return true;  
    }  
  }  
  
  static async clearTrackLogs() {  
    try {  
      const db = await this.initDB();  
      return new Promise((resolve, reject) => {  
        const transaction = db.transaction([this.TRACK_LOGS_STORE], 'readwrite');  
        const store = transaction.objectStore(this.TRACK_LOGS_STORE);  
        
        const request = store.clear();  
        
        request.onsuccess = () => {  
          resolve(true);  
        };  
        
        request.onerror = (event) => {  
          console.error('خطا در پاک کردن لاگ‌های مسیر:', event.target.error);  
          reject(event.target.error);  
        };  
      });  
    } catch (err) {  
      console.error('خطا در پاک کردن لاگ‌های مسیر:', err);  
      localStorage.removeItem('track_logs');  
      return true;  
    }  
  }  
  
  static async exportGPSLogsAsJSON() {  
    const logs = await this.getGPSLogs(100000); // حداکثر 100،000 لاگ  
    return JSON.stringify(logs, null, 2);  
  }  
  
  static async exportGPSLogsAsCSV() {  
    const logs = await this.getGPSLogs(100000);  
    
    if (logs.length === 0) {  
      return 'هیچ لاگی یافت نشد';  
    }  
    
    // ایجاد هدرهای CSV  
    let csv = 'timestamp,latitude,longitude,accuracy,altitude,heading,speed,isNoisy\n';  
    
    // اضافه کردن داده‌ها  
    logs.forEach(log => {  
      const timestamp = new Date(log.timestamp).toISOString();  
      const lat = log.coords.lat || '';  
      const lng = log.coords.lng || '';  
      const accuracy = log.coords.accuracy || '';  
      const altitude = log.coords.altitude || '';  
      const heading = log.coords.heading || '';  
      const speed = log.coords.speed || '';  
      const isNoisy = log.isNoisy ? 'true' : 'false';  
      
      csv += `${timestamp},${lat},${lng},${accuracy},${altitude},${heading},${speed},${isNoisy}\n`;  
    });  
    
    return csv;  
  }  
  
  static async exportTrackLogsAsGeoJSON() {  
    const tracks = await this.getTrackLogs();  
    
    const geoJSON = {  
      type: 'FeatureCollection',  
      features: []  
    };  
    
    tracks.forEach(track => {  
      const coordinates = track.points.map(point => [point.coords.lng, point.coords.lat]);  
      
      geoJSON.features.push({  
        type: 'Feature',  
        geometry: {  
          type: 'LineString',  
          coordinates  
        },  
        properties: {  
          startTime: track.startTime,  
          endTime: track.endTime,  
          duration: track.duration,  
          pointCount: track.pointCount,  
          createdAt: track.createdAt  
        }  
      });  
    });  
    
    return JSON.stringify(geoJSON, null, 2);  
  }  
  
    // تعداد لاگ‌های ذخیره شده  
  static async getLogCounts() {  
    try {  
      const db = await this.initDB();  
      
      const gpsCountPromise = new Promise((resolve, reject) => {  
        const transaction = db.transaction([this.GPS_LOGS_STORE], 'readonly');  
        const store = transaction.objectStore(this.GPS_LOGS_STORE);  
        const countRequest = store.count();  
        
        countRequest.onsuccess = () => {  
          resolve(countRequest.result);  
        };  
        
        countRequest.onerror = (event) => {  
          reject(event.target.error);  
        };  
      });  
      
      const trackCountPromise = new Promise((resolve, reject) => {  
        const transaction = db.transaction([this.TRACK_LOGS_STORE], 'readonly');  
        const store = transaction.objectStore(this.TRACK_LOGS_STORE);  
        const countRequest = store.count();  
        
        countRequest.onsuccess = () => {  
          resolve(countRequest.result);  
        };  
        
        countRequest.onerror = (event) => {  
          reject(event.target.error);  
        };  
      });  
      
      const [gpsCount, trackCount] = await Promise.all([gpsCountPromise, trackCountPromise]);  
      
      return {  
        gpsLogs: gpsCount,  
        trackLogs: trackCount  
      };  
    } catch (err) {  
      console.error('خطا در دریافت تعداد لاگ‌ها:', err);  
      
      // فول‌بک به localStorage  
      const gpsLogs = JSON.parse(localStorage.getItem('gps_logs') || '[]');  
      const trackLogs = JSON.parse(localStorage.getItem('track_logs') || '[]');  
      
      return {  
        gpsLogs: gpsLogs.length,  
        trackLogs: trackLogs.length  
      };  
    }  
  }  
  
  // تخمین حجم داده‌های ذخیره شده (به بایت)  
  static async estimateStorageSize() {  
    try {  
      // نمونه‌برداری از 10 لاگ آخر برای تخمین میانگین سایز  
      const logs = await this.getGPSLogs(10);  
      const tracks = await this.getTrackLogs();  
      tracks.splice(10); // فقط 10 مورد آخر  
      
      const logsJson = JSON.stringify(logs);  
      const tracksJson = JSON.stringify(tracks);  
      
      const avgLogSize = logs.length > 0 ? logsJson.length / logs.length : 0;  
      const avgTrackSize = tracks.length > 0 ? tracksJson.length / tracks.length : 0;  
      
      const counts = await this.getLogCounts();  
      
      return {  
        gpsLogsSize: Math.round(avgLogSize * counts.gpsLogs),  
        trackLogsSize: Math.round(avgTrackSize * counts.trackLogs),  
        totalSize: Math.round(avgLogSize * counts.gpsLogs + avgTrackSize * counts.trackLogs)  
      };  
    } catch (err) {  
      console.error('خطا در تخمین حجم دیتابیس:', err);  
      return {  
        gpsLogsSize: 0,  
        trackLogsSize: 0,  
        totalSize: 0  
      };  
    }  
  }    
  
  // دانلود فایل  
  static downloadFile(content, filename, mimeType) {  
    const blob = new Blob([content], { type: mimeType });  
    const url = URL.createObjectURL(blob);  
    const a = document.createElement('a');  
    a.href = url;  
    a.download = filename;  
    document.body.appendChild(a);  
    a.click();  
    document.body.removeChild(a);  
    URL.revokeObjectURL(url);  
  }  
}  
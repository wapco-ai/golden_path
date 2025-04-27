// src/services/DeadReckoningService.js  

class DeadReckoningService {  
    constructor() {  
      this.isActive = false;  
      this.isCalibrating = false;  
      this.path = [];  
      this.currentPosition = { x: 0, y: 0 };  
      this.heading = 0;  
      this.strideLength = 0.75;  
      this.stepCount = 0;  
      
      this.gyroBias = { x: 0, y: 0, z: 0 };  
      this.calibrationSamples = 0;  
      this.calibrationMaxSamples = 100;  
      
      this.accBuffer = [];  
      this.accThreshold = 1.2;  
      this.lastStepTime = 0;  
      this.minStepInterval = 300;  
      
      this.timestamps = [];  
      this.listeners = [];  
      
      this.referencePosition = null;  
    }  
  
    toggle(initialLatLng = null) {  
      this.isActive = !this.isActive;  
      
      if (this.isActive) {  
        if (initialLatLng) {  
          this.referencePosition = initialLatLng;  
          this.currentPosition = { x: 0, y: 0 };  
        }  
        
        this.isCalibrating = true;  
        this.calibrationSamples = 0;  
        this.gyroBias = { x: 0, y: 0, z: 0 };  
        
        this.path = [{ ...this.currentPosition }];  
        this.timestamps = [Date.now()];  
        
        this._notify('started');  
      } else {  
        this._notify('stopped');  
      }  
      
      return this.isActive;  
    }  
  
    processImuData(accelerometer, gyroscope, timestamp) {  
      if (!this.isActive) return;  
      
      // کالیبراسیون ژیروسکوپ  
      if (this.isCalibrating) {  
        if (this.calibrationSamples < this.calibrationMaxSamples) {  
          this.gyroBias.x += gyroscope.x / this.calibrationMaxSamples;  
          this.gyroBias.y += gyroscope.y / this.calibrationMaxSamples;  
          this.gyroBias.z += gyroscope.z / this.calibrationMaxSamples;  
          this.calibrationSamples++;  
          
          if (this.calibrationSamples >= this.calibrationMaxSamples) {  
            this.isCalibrating = false;  
            console.log('Calibration complete. Gyro bias:', this.gyroBias);  
            this._notify('calibrationComplete');  
          }  
        }  
        return;  
      }  
      
      // محاسبه فاصله زمانی  
      const dt = this.timestamps.length > 0   
        ? (timestamp - this.timestamps[this.timestamps.length - 1]) / 1000   
        : 0.01;  
      
      // به‌روزرسانی heading با استفاده از ژیروسکوپ  
      const correctedGyroZ = gyroscope.z - this.gyroBias.z;  
      this.heading += correctedGyroZ * dt;  
      
      // تشخیص گام  
      const stepDetected = this._detectStep(accelerometer, timestamp);  
      
      if (stepDetected) {  
        // محاسبه تغییر موقعیت  
        const dx = this.strideLength * Math.cos(this.heading);  
        const dy = this.strideLength * Math.sin(this.heading);  
        
        // به‌روزرسانی موقعیت  
        this.currentPosition.x += dx;  
        this.currentPosition.y += dy;  
        this.stepCount++;  
        
        // اضافه کردن به مسیر  
        this.path.push({ ...this.currentPosition });  
        this.timestamps.push(timestamp);  
        
        this._notify('positionUpdated');  
      }  
    }  
  
    _detectStep(accelerometer, timestamp) {  
      const accMagnitude = Math.sqrt(  
        accelerometer.x * accelerometer.x +   
        accelerometer.y * accelerometer.y +   
        accelerometer.z * accelerometer.z  
      );  
      
      this.accBuffer.push(accMagnitude);  
      if (this.accBuffer.length > 10) {  
        this.accBuffer.shift();  
      }  
      
      const accAvg = this.accBuffer.reduce((sum, val) => sum + val, 0) / this.accBuffer.length;  
      
      if (accMagnitude > accAvg + this.accThreshold &&   
          timestamp - this.lastStepTime > this.minStepInterval) {  
        this.lastStepTime = timestamp;  
        return true;  
      }  
      
      return false;  
    }  
  
    getGeoPath() {  
      if (!this.referencePosition) return [];  
      
      // تبدیل مسیر به مختصات جغرافیایی  
      return this.path.map(point => this._toLatLng(point));  
    }  
  
    _toLatLng(point) {  
      if (!this.referencePosition) return null;  
      
      // تقریب: هر متر در عرض جغرافیایی تقریباً 0.000009 درجه است  
      const latFactor = 0.000009;  
      // تقریب: هر متر در طول جغرافیایی تقریباً 0.000009 * cos(lat) درجه است  
      const lngFactor = 0.000009 * Math.cos(this.referencePosition.lat * Math.PI / 180);  
      
      return {  
        lat: this.referencePosition.lat + point.y * latFactor,  
        lng: this.referencePosition.lng + point.x * lngFactor  
      };  
    }  
  
    setStrideLength(length) {  
      this.strideLength = length;  
    }  
  
    reset() {  
      this.currentPosition = { x: 0, y: 0 };  
      this.heading = 0;  
      this.stepCount = 0;  
      this.path = [{ ...this.currentPosition }];  
      this.timestamps = [Date.now()];  
      
      this._notify('reset');  
    }  
  
    exportLog() {  
      const data = [];  
      
      for (let i = 0; i < this.path.length; i++) {  
        const point = this.path[i];  
        const timestamp = this.timestamps[i];  
        const geoPoint = this._toLatLng(point);  
        
        data.push({  
          timestamp,  
          x: point.x,  
          y: point.y,  
          lat: geoPoint ? geoPoint.lat : null,  
          lng: geoPoint ? geoPoint.lng : null  
        });  
      }  
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });  
      const url = URL.createObjectURL(blob);  
      
      const a = document.createElement('a');  
      const filename = `dead_reckoning_log_${new Date().toISOString().replace(/:/g, '-')}.json`;  
      a.href = url;  
      a.download = filename;  
      a.click();  
      
      URL.revokeObjectURL(url);  
      
      return { filename, data };  
    }  
  
    addListener(callback) {  
      this.listeners.push(callback);  
      return () => {  
        this.listeners = this.listeners.filter(cb => cb !== callback);  
      };  
    }  
  
    _notify(event) {  
      this.listeners.forEach(callback => {  
        callback({  
          event,  
          path: this.path,  
          geoPath: this.getGeoPath(),  
          stepCount: this.stepCount,  
          isActive: this.isActive,  
          isCalibrating: this.isCalibrating  
        });  
      });  
    }  
  }  
  
  // ایجاد یک نمونه واحد  
  const deadReckoningService = new DeadReckoningService();  
  export default deadReckoningService;  
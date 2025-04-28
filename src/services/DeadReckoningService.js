// src/services/DeadReckoningService.js  

// تابع برای محاسبه انحراف مغناطیسی بر اساس موقعیت جغرافیایی  
function getMagneticDeclination(latitude, longitude) {  
    // این یک مدل ساده‌سازی شده است. برای دقت بیشتر از API یا کتابخانه‌های تخصصی استفاده کنید  
    // مثال: https://www.ngdc.noaa.gov/geomag/calculators/magcalc.shtml  
    
    // مقدار میانگین برای تهران حدود 4.5 درجه شرقی است (2023)  
    return 4.5 * Math.PI / 180; // تبدیل به رادیان  
  }  
  
  class DeadReckoningService {  
    constructor() {  
      this.isActive = false;  
      this.isCalibrating = false;  
      this.calibrationSamples = 0;  
      this.calibrationMaxSamples = 200; // تعداد نمونه برای کالیبراسیون  
      this.gyroBias = { x: 0, y: 0, z: 0 }; // خطای ژیروسکوپ  
      
      this.stepCount = 0;  
      this.strideLength = 0.75; // طول گام پیش‌فرض (متر)  
      
      this.referencePosition = null; // نقطه مرجع GPS (LatLng)  
      this.currentPosition = { x: 0, y: 0 }; // موقعیت نسبی (متر از نقطه مرجع)  
      this.path = []; // مسیر طی شده (نقاط نسبی)  
      this.geoPath = []; // مسیر طی شده (LatLng)  
      
      this.timestamps = []; // زمان‌بندی برای محاسبه dt  
      
      // ویژگی‌های مربوط به Sensor Fusion  
      this.filteredHeading = 0; // جهت فیلتر شده (رادیان)  
      this.lastFilterTimestamp = 0;  
      this.alpha = 0.98; // ضریب فیلتر مکمل (وزن ژیروسکوپ)  
      this.magneticDeclination = 0; // انحراف مغناطیسی در رادیان  
      
      // تشخیص گام  
      this.stepDetectorThreshold = 1.2; // آستانه تشخیص گام (بزرگی شتاب)  
      this.lastPeakTimestamp = 0;  
      this.peakDetectionThreshold = 0.1; // حداقل فاصله زمانی بین گام‌ها (ثانیه)  
      
      this.listeners = [];  
    }  
  
    // متد برای اضافه کردن listener  
    addListener(listener) {  
      this.listeners.push(listener);  
      // بازگرداندن تابعی برای حذف listener  
      return () => {  
        this.listeners = this.listeners.filter(l => l !== listener);  
      };  
    }  
  
    // متد برای اطلاع‌رسانی به listeners  
    _notify(type, data = {}) {  
      const eventData = {  
        isActive: this.isActive,  
        isCalibrating: this.isCalibrating,  
        stepCount: this.stepCount,  
        currentPosition: this.currentPosition,  
        path: this.path,  
        geoPath: this.geoPath,  
        filteredHeading: this.filteredHeading, // ارسال جهت فیلتر شده  
        type,  
        ...data  
      };  
      this.listeners.forEach(listener => listener(eventData));  
    }  
  
    // شروع یا توقف ردیابی  
    toggle(initialLatLng = null) {  
      this.isActive = !this.isActive;  
      
      if (this.isActive) {  
        console.log('Dead Reckoning started.');  
        this.reset(); // بازنشانی در شروع  
  
        if (initialLatLng) {  
          this.referencePosition = initialLatLng;  
          
          // محاسبه انحراف مغناطیسی برای موقعیت فعلی  
          this.magneticDeclination = getMagneticDeclination(  
            initialLatLng.lat,  
            initialLatLng.lng  
          );  
          console.log('Magnetic Declination:', this.magneticDeclination * 180 / Math.PI, 'degrees');  
        } else {  
          console.warn('No initial GPS position provided. Dead Reckoning will be relative.');  
        }  
        
        // شروع کالیبراسیون ژیروسکوپ  
        this.isCalibrating = true;  
        this.calibrationSamples = 0;  
        this.gyroBias = { x: 0, y: 0, z: 0 };  
        this._notify('start');  
      } else {  
        console.log('Dead Reckoning stopped.');  
        this.isCalibrating = false;  
        this._notify('stop');  
      }  
      
      return this.isActive;  
    }  
  
    // بازنشانی سیستم Dead Reckoning  
    reset() {  
      console.log('Dead Reckoning reset.');  
      this.stepCount = 0;  
      this.currentPosition = { x: 0, y: 0 };  
      this.path = [];  
      this.geoPath = [];  
      this.timestamps = [];  
      this.filteredHeading = 0;  
      this.lastFilterTimestamp = 0;  
      this.lastPeakTimestamp = 0;  
      this.gyroBias = { x: 0, y: 0, z: 0 };  
      this.isCalibrating = false;  
      this.calibrationSamples = 0;  
      this._notify('reset');  
    }  
  
    // تنظیم طول گام  
    setStrideLength(length) {  
      this.strideLength = length;  
      console.log('Stride length set to:', this.strideLength);  
    }  
  
    // پردازش داده‌های IMU (شتاب‌سنج، ژیروسکوپ، جهت)  
    processImuData(acceleration, rotationRate, orientation, timestamp) {  
      if (!this.isActive) return;  
  
      // محاسبه فاصله زمانی (به ثانیه)  
      const now = timestamp;  
      const dt = this.lastFilterTimestamp === 0 ? 0 : (now - this.lastFilterTimestamp) / 1000;  
      this.lastFilterTimestamp = now;  
  
      // کالیبراسیون ژیروسکوپ  
      if (this.isCalibrating) {  
        if (this.calibrationSamples < this.calibrationMaxSamples) {  
          this.gyroBias.x += rotationRate.x / this.calibrationMaxSamples;  
          this.gyroBias.y += rotationRate.y / this.calibrationMaxSamples;  
          this.gyroBias.z += rotationRate.z / this.calibrationMaxSamples;  
          this.calibrationSamples++;  
          
          if (this.calibrationSamples >= this.calibrationMaxSamples) {  
            this.isCalibrating = false;  
            console.log('Calibration complete. Gyro bias:', this.gyroBias);  
            this._notify('calibrationComplete');  
          }  
        }  
        return; // تا پایان کالیبراسیون پردازش را ادامه نده  
      }  
  
      // استفاده از Complementary Filter برای ترکیب داده‌های ژیروسکوپ و جهت (قطب‌نما)  
      // ژیروسکوپ: rotationRate.z (چرخش حول محور Z - Yaw)  
      // قطب‌نما: orientation.alpha (جهت نسبت به شمال مغناطیسی)  
      
      // به‌روزرسانی جهت با ژیروسکوپ  
      const correctedGyroZ = rotationRate.z - this.gyroBias.z;  
      this.filteredHeading += correctedGyroZ * dt; // در رادیان  
      
      // نرمال‌سازی جهت ژیروسکوپ بین 0 تا 2π  
      this.filteredHeading = this.filteredHeading % (2 * Math.PI);  
      if (this.filteredHeading < 0) this.filteredHeading += (2 * Math.PI);  
  
      // جهت از قطب‌نما (orientation.alpha به درجه است)  
      let magneticHeading = orientation.alpha * Math.PI / 180; // تبدیل به رادیان  
  
      // تصحیح انحراف مغناطیسی (اگر نقطه مرجع GPS وجود داشته باشد)  
      if (this.referencePosition) {  
         magneticHeading -= this.magneticDeclination;  
         
         // نرمال‌سازی بعد از تصحیح  
         magneticHeading = magneticHeading % (2 * Math.PI);  
         if (magneticHeading < 0) magneticHeading += (2 * Math.PI);  
      }  
  
  
      // اعمال Complementary Filter  
      // این بخش نیاز به تنظیم دقیق پارامتر alpha دارد و ممکن است نیاز به تنظیم افست داشته باشد  
      // به دلیل اینکه جهت ژیروسکوپ یک مقدار نسبی است  
      
      // روش ساده Complementary Filter برای جهت:  
      // استفاده از اختلاف جهت قطب‌نما و جهت فعلی ژیروسکوپ برای تصحیح  
      let headingError = magneticHeading - this.filteredHeading;  
  
      // نرمال‌سازی خطا بین -π و π  
      if (headingError > Math.PI) headingError -= 2 * Math.PI;  
      if (headingError < -Math.PI) headingError += 2 * Math.PI;  
      
      // تصحیح جهت فیلتر شده با استفاده از خطا  
      this.filteredHeading += (1 - this.alpha) * headingError;  
  
      // نرمال‌سازی نهایی جهت فیلتر شده  
      this.filteredHeading = this.filteredHeading % (2 * Math.PI);  
      if (this.filteredHeading < 0) this.filteredHeading += (2 * Math.PI);  
      
      // تشخیص گام  
      const stepDetected = this._detectStep(acceleration, now); // استفاده از شتاب بدون گرانش  
  
      if (stepDetected) {  
        // محاسبه تغییر موقعیت بر اساس طول گام و جهت فیلتر شده  
        // جهت 0 رادیان به سمت شمال جغرافیایی است (با تصحیح انحراف مغناطیسی)  
        // محور X به سمت شرق و محور Y به سمت شمال است در سیستم مختصات محلی  
        
        // dx و dy در سیستم مختصات محلی (محور Y به سمت شمال است)  
        const dx = this.strideLength * Math.sin(this.filteredHeading);  
        const dy = this.strideLength * Math.cos(this.filteredHeading);  
        
        // به‌روزرسانی موقعیت نسبی  
        this.currentPosition.x += dx;  
        this.currentPosition.y += dy;  
        this.stepCount++;  
        
        // اضافه کردن به مسیر (نقطه نسبی)  
        this.path.push({ ...this.currentPosition });  
        this.timestamps.push(now);  
  
        // تبدیل نقطه نسبی به LatLng (نیاز به نقطه مرجع GPS)  
        if (this.referencePosition) {  
           const newGeoPoint = this._calculateNewLatLng(  
              this.referencePosition.lat,   
              this.referencePosition.lng,   
              this.currentPosition.x,   
              this.currentPosition.y  
           );  
           this.geoPath.push(newGeoPoint);  
        }  
        
        this._notify('positionUpdated');  
      }  
      
      // اطلاع‌رسانی مداوم برای به‌روزرسانی جهت در UI  
      this._notify('imuDataProcessed');  
    }  
  
    // تابع ساده برای تشخیص گام (با استفاده از آستانه روی بزرگی شتاب)  
    _detectStep(acceleration, timestamp) {  
      const magnitude = Math.sqrt(  
        acceleration.x * acceleration.x +   
        acceleration.y * acceleration.y +   
        acceleration.z * acceleration.z  
      );  
      
      const timeSinceLastPeak = (timestamp - this.lastPeakTimestamp) / 1000;  
  
      if (magnitude > this.stepDetectorThreshold && timeSinceLastPeak > this.peakDetectionThreshold) {  
        this.lastPeakTimestamp = timestamp;  
        return true;  
      }  
      
      return false;  
    }  
  
    // تابع برای تبدیل موقعیت نسبی (متر) به LatLng  
    _calculateNewLatLng(startLat, startLng, dx, dy) {  
      // شعاع زمین در متر  
      const earthRadius = 6378137;   
  
      // تبدیل dx و dy به تغییرات در درجه طول و عرض جغرافیایی  
      const deltaLat = dy / earthRadius; // تغییر در رادیان عرض جغرافیایی  
      const deltaLng = dx / (earthRadius * Math.cos(startLat * Math.PI / 180)); // تغییر در رادیان طول جغرافیایی  
  
      // محاسبه LatLng جدید (در رادیان)  
      const newLatRad = startLat * Math.PI / 180 + deltaLat;  
      const newLngRad = startLng * Math.PI / 180 + deltaLng;  
  
      // تبدیل به درجه و بازگرداندن  
      return {  
        lat: newLatRad * 180 / Math.PI,  
        lng: newLngRad * 180 / Math.PI  
      };  
    }  
  
    // خروجی گرفتن از مسیر به صورت JSON  
    exportLog() {  
      const logData = {  
        startTime: new Date(this.timestamps[0] || Date.now()).toISOString(),  
        endTime: new Date(this.timestamps[this.timestamps.length - 1] || Date.now()).toISOString(),  
        stepCount: this.stepCount,  
        strideLength: this.strideLength,  
        referencePosition: this.referencePosition,  
        path: this.path, // مسیر نسبی  
        geoPath: this.geoPath // مسیر جغرافیایی  
      };  
      
      const jsonString = JSON.stringify(logData, null, 2);  
      const blob = new Blob([jsonString], { type: 'application/json' });  
      const url = URL.createObjectURL(blob);  
      const a = document.createElement('a');  
      a.href = url;  
      a.download = `dead_reckoning_log_${new Date().toISOString()}.json`;  
      document.body.appendChild(a);  
      a.click();  
      document.body.removeChild(a);  
      URL.revokeObjectURL(url);  
    }  
  }  
  
  // ایجاد یک نمونه واحد  
  const deadReckoningService = new DeadReckoningService();  
  export default deadReckoningService;  
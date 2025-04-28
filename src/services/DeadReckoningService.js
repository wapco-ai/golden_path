// src/services/DeadReckoningService.js  

// تابع برای محاسبه انحراف مغناطیسی بر اساس موقعیت جغرافیایی  
function getMagneticDeclination(latitude, longitude) {  
    // این یک مدل ساده‌سازی شده است. برای دقت بیشتر از API یا کتابخانه‌های تخصصی استفاده کنید  
    // برای مثال، می‌توانید از یک سرویس API خارجی یا یک کتابخانه محاسبه استفاده کنید.  
    // اینجا فقط یک مقدار ثابت برای مثال استفاده می‌شود.  
    return 4.5 * Math.PI / 180; // مقدار تقریبی برای تهران  
  }  
  
  // تابع برای تبدیل مختصات جغرافیایی (Lat/Lng) به مختصات محلی (x, y در متر)  
  function geodeticToLocal(lat, lng, refLat, refLng) {  
    const earthRadius = 6378137; // شعاع زمین در متر  
  
    const deltaLng = (lng - refLng) * Math.PI / 180;  
    const deltaLat = (lat - refLat) * Math.PI / 180;  
  
    const x = earthRadius * deltaLng * Math.cos(refLat * Math.PI / 180);  
    const y = earthRadius * deltaLat;  
  
    return { x, y };  
  }  
  
  // تابع برای تبدیل مختصات محلی (x, y در متر) به مختصات جغرافیایی (Lat/Lng)  
  function localToGeodetic(x, y, refLat, refLng) {  
    const earthRadius = 6378137; // شعاع زمین در متر  
  
    const deltaLat = y / earthRadius;  
    const deltaLng = x / (earthRadius * Math.cos(refLat * Math.PI / 180));  
  
    const newLat = refLat + deltaLat * 180 / Math.PI;  
    const newLng = refLng + deltaLng * 180 / Math.PI;  
  
    return { lat: newLat, lng: newLng };  
  }  
  
  
  class DeadReckoningService {  
    constructor() {  
      this.isActive = false;  
      this.isCalibrating = false;  
      this.calibrationSamples = 0;  
      this.calibrationMaxSamples = 300; // تعداد نمونه بیشتر برای کالیبراسیون دقیق‌تر  
      this.gyroBias = { x: 0, y: 0, z: 0 }; // خطای ژیروسکوپ (رادیان بر ثانیه)  
      this.accelerometerBias = { x: 0, y: 0, z: 0 }; // خطای شتاب‌سنج (متر بر ثانیه مربع)  
      
      this.stepCount = 0;  
      this.strideLength = 0.75; // طول گام پیش‌فرض (متر)  
      
      this.referencePosition = null; // نقطه مرجع GPS (LatLng)  
      // حالت سیستم: [موقعیت X, موقعیت Y, جهت (Heading)] در سیستم مختصات محلی  
      this.state = [0, 0, 0];   
      this.path = []; // مسیر طی شده (نقاط نسبی)  
      this.geoPath = []; // مسیر طی شده (LatLng)  
      
      this.lastImuTimestamp = 0;  
      
      // پارامترهای Sensor Fusion (Complementary Filter پیشرفته)  
      // این پارامترها نیاز به تنظیم دقیق دارند  
      this.gyroWeight = 0.98; // وزن ژیروسکوپ برای جهت  
      this.magnetometerWeight = 1 - this.gyroWeight; // وزن قطب‌نما برای جهت  
      this.gpsWeight = 0.5; // وزن تصحیح GPS  
      
      this.magneticDeclination = 0; // انحراف مغناطیسی در رادیان  
      
      // تشخیص گام (روش پیشرفته‌تر - مثال ساده)  
      this.accelerometerBuffer = []; // بافر برای داده‌های شتاب‌سنج  
      this.bufferSize = 100; // اندازه بافر  
      this.lastStepTimestamp = 0;  
      this.minStepInterval = 0.3; // حداقل زمان بین دو گام (ثانیه)  
      this.peakThreshold = 2.0; // آستانه برای تشخیص قله در شتاب  
  
      this.listeners = [];  
    }  
  
    // متد برای اضافه کردن listener  
    addListener(listener) {  
      this.listeners.push(listener);  
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
        // تبدیل state به فرمت قابل فهم برای UI  
        currentPosition: { x: this.state[0], y: this.state[1] },  
        path: this.path,  
        geoPath: this.geoPath,  
        filteredHeading: this.state[2], // جهت فیلتر شده (رادیان)  
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
          
          // محاسبه انحراف مغناطیسی  
          this.magneticDeclination = getMagneticDeclination(  
            initialLatLng.lat,  
            initialLatLng.lng  
          );  
          console.log('Magnetic Declination:', this.magneticDeclination * 180 / Math.PI, 'degrees');  
        } else {  
          console.warn('No initial GPS position provided. Dead Reckoning will be relative.');  
        }  
        
        // شروع کالیبراسیون سنسورها  
        this.isCalibrating = true;  
        this.calibrationSamples = 0;  
        this.gyroBias = { x: 0, y: 0, z: 0 };  
        this.accelerometerBias = { x: 0, y: 0, z: 0 };  
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
      this.state = [0, 0, 0]; // [x, y, heading]  
      this.path = [];  
      this.geoPath = [];  
      this.lastImuTimestamp = 0;  
      this.lastStepTimestamp = 0;  
      this.accelerometerBuffer = [];  
      this.gyroBias = { x: 0, y: 0, z: 0 };  
      this.accelerometerBias = { x: 0, y: 0, z: 0 };  
      this.isCalibrating = false;  
      this.calibrationSamples = 0;  
      this._notify('reset');  
    }  
  
    // تنظیم طول گام  
    setStrideLength(length) {  
      this.strideLength = length;  
      console.log('Stride length set to:', this.strideLength);  
    }  
  
    // پردازش داده‌های IMU و انجام Sensor Fusion  
    processImuData(acceleration, rotationRate, orientation, timestamp) {  
      if (!this.isActive) return;  
  
      // محاسبه فاصله زمانی (به ثانیه)  
      const now = timestamp;  
      const dt = this.lastImuTimestamp === 0 ? 0 : (now - this.lastImuTimestamp) / 1000;  
      this.lastImuTimestamp = now;  
  
      // کالیبراسیون سنسورها  
      if (this.isCalibrating) {  
        if (this.calibrationSamples < this.calibrationMaxSamples) {  
          this.gyroBias.x += rotationRate.x / this.calibrationMaxSamples;  
          this.gyroBias.y += rotationRate.y / this.calibrationMaxSamples;  
          this.gyroBias.z += rotationRate.z / this.calibrationMaxSamples;  
          this.accelerometerBias.x += acceleration.x / this.calibrationMaxSamples;  
          this.accelerometerBias.y += acceleration.y / this.calibrationMaxSamples;  
          this.accelerometerBias.z += acceleration.z / this.calibrationMaxSamples;  
          this.calibrationSamples++;  
          
          if (this.calibrationSamples >= this.calibrationMaxSamples) {  
            this.isCalibrating = false;  
            console.log('Calibration complete. Gyro bias:', this.gyroBias, 'Accelerometer bias:', this.accelerometerBias);  
            this._notify('calibrationComplete');  
          }  
        }  
        return;   
      }  
  
      // --- بخش پیش‌بینی حالت (Prediction) ---  
      // استفاده از داده‌های ژیروسکوپ برای پیش‌بینی تغییر در جهت (Yaw)  
      const correctedGyroZ = rotationRate.z - this.gyroBias.z;  
      // به‌روزرسانی جهت با ژیروسکوپ  
      this.state[2] += correctedGyroZ * dt;   
  
      // نرمال‌سازی جهت بین 0 تا 2π  
      this.state[2] = this.state[2] % (2 * Math.PI);  
      if (this.state[2] < 0) this.state[2] += (2 * Math.PI);  
  
  
      // --- بخش به‌روزرسانی حالت (Update) ---  
      // استفاده از داده‌های جهت (قطب‌نما) برای تصحیح جهت  
      // orientation.alpha به درجه است و 0 شمال مغناطیسی است  
      let magneticHeading = orientation.alpha * Math.PI / 180; // تبدیل به رادیان  
  
      // تصحیح انحراف مغناطیسی  
      if (this.referencePosition) {  
         magneticHeading -= this.magneticDeclination;  
         magneticHeading = magneticHeading % (2 * Math.PI);  
         if (magneticHeading < 0) magneticHeading += (2 * Math.PI);  
      }  
  
      // اعمال Complementary Filter برای جهت  
      let headingError = magneticHeading - this.state[2];  
  
      // نرمال‌سازی خطا بین -π و π  
      if (headingError > Math.PI) headingError -= 2 * Math.PI;  
      if (headingError < -Math.PI) headingError += 2 * Math.PI;  
      
      // تصحیح جهت با وزن قطب‌نما  
      this.state[2] += this.magnetometerWeight * headingError;  
  
      // نرمال‌سازی نهایی جهت فیلتر شده  
      this.state[2] = this.state[2] % (2 * Math.PI);  
      if (this.state[2] < 0) this.state[2] += (2 * Math.PI);  
  
  
      // --- تشخیص گام پیشرفته‌تر (مثال ساده) ---  
      // اضافه کردن بزرگی شتاب (بدون گرانش) به بافر  
      const accelerationMagnitude = Math.sqrt(  
          acceleration.x * acceleration.x +   
          acceleration.y * acceleration.y +   
          acceleration.z * acceleration.z  
      );  
      this.accelerometerBuffer.push(accelerationMagnitude);  
      if (this.accelerometerBuffer.length > this.bufferSize) {  
          this.accelerometerBuffer.shift(); // حذف قدیمی‌ترین داده  
      }  
  
      // تشخیص قله در بافر برای تشخیص گام  
      const timeSinceLastStep = (now - this.lastStepTimestamp) / 1000;  
      let stepDetected = false;  
  
      if (this.accelerometerBuffer.length > 1 && timeSinceLastStep > this.minStepInterval) {  
          const lastValue = this.accelerometerBuffer[this.accelerometerBuffer.length - 1];  
          const previousValue = this.accelerometerBuffer[this.accelerometerBuffer.length - 2];  
          
          // تشخیص قله (نقطه فعلی بالاتر از نقطه قبلی و بالاتر از آستانه)  
          if (lastValue > previousValue && lastValue > this.peakThreshold) {  
              stepDetected = true;  
              this.lastStepTimestamp = now;  
          }  
      }  
  
  
      // --- به‌روزرسانی موقعیت با گام‌ها ---  
      if (stepDetected) {  
        // محاسبه تغییر موقعیت بر اساس طول گام و جهت فیلتر شده  
        // جهت 0 رادیان به سمت شمال جغرافیایی است (با تصحیح انحراف مغناطیسی)  
        // محور X به سمت شرق و محور Y به سمت شمال است در سیستم مختصات محلی  
        
        const dx = this.strideLength * Math.sin(this.state[2]); // تغییر در محور x  
        const dy = this.strideLength * Math.cos(this.state[2]); // تغییر در محور y  
        
        // به‌روزرسانی موقعیت نسبی در state  
        this.state[0] += dx;  
        this.state[1] += dy;  
        this.stepCount++;  
        
        // اضافه کردن به مسیر (نقطه نسبی)  
        this.path.push({ x: this.state[0], y: this.state[1] });  
  
        // تبدیل نقطه نسبی به LatLng (نیاز به نقطه مرجع GPS)  
        if (this.referencePosition) {  
           const newGeoPoint = localToGeodetic(  
              this.state[0],   
              this.state[1],   
              this.referencePosition.lat,   
              this.referencePosition.lng  
           );  
           this.geoPath.push(newGeoPoint);  
        }  
      }  
      
      // اطلاع‌رسانی مداوم برای به‌روزرسانی UI  
      this._notify('imuDataProcessed');  
    }  
  
    // متد برای تصحیح حالت با داده‌های GPS  
    correctWithGps(gpsLocation) {  
        if (!this.isActive || !this.referencePosition || !gpsLocation?.coords) return;  
  
        const gpsLat = gpsLocation.coords.lat;  
        const gpsLng = gpsLocation.coords.lng;  
  
        // تبدیل موقعیت GPS به مختصات محلی  
        const gpsLocal = geodeticToLocal(  
            gpsLat,   
            gpsLng,   
            this.referencePosition.lat,   
            this.referencePosition.lng  
        );  
  
        // محاسبه خطا بین موقعیت Dead Reckoning و GPS  
        const positionErrorX = gpsLocal.x - this.state[0];  
        const positionErrorY = gpsLocal.y - this.state[1];  
  
        // اعمال تصحیح با وزن GPS  
        this.state[0] += this.gpsWeight * positionErrorX;  
        this.state[1] += this.gpsWeight * positionErrorY;  
  
        // همچنین می‌توانید جهت را بر اساس تغییرات اخیر GPS تخمین زده و تصحیح کنید،  
        // اما این بخش پیچیده‌تر است و نیاز به تاریخچه موقعیت GPS دارد.  
        // برای سادگی در این مثال، فقط موقعیت را تصحیح می‌کنیم.  
  
        console.log(`Corrected with GPS. Error: (${positionErrorX.toFixed(2)}, ${positionErrorY.toFixed(2)}) meters`);  
        this._notify('gpsCorrected');  
    }  
  
  
    // خروجی گرفتن از مسیر به صورت JSON  
    exportLog() {  
      const logData = {  
        startTime: this.lastImuTimestamp > 0 ? new Date(this.lastImuTimestamp - this.lastFilterTimestamp * 1000).toISOString() : null,  
        endTime: this.lastImuTimestamp > 0 ? new Date(this.lastImuTimestamp).toISOString() : null,  
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
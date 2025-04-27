// src/services/DeadReckoningService.js  
class DeadReckoningService {  
    constructor() {  
      this.isInitialized = false;  
      this.isRunning = false;  
      this.stepCount = 0;  
      this.direction = 0; // جهت حرکت به درجه (0 تا 359)  
      this.path = []; // مسیر Dead Reckoning  
      this.lastStep = null;  
      this.startPosition = null;  
      this.currentPosition = null;  
      this.stepLength = 0.75; // طول متوسط هر قدم (متر)  
      this.calibrationFactor = 1.0; // ضریب کالیبراسیون  
      this.stepDetector = null;  
      this.orientationSensor = null;  
      this.onStepDetected = this.onStepDetected.bind(this);  
      this.onOrientationChange = this.onOrientationChange.bind(this);  
      this.onNewPositionCallback = null;  
      
      // چرخه بررسی هر 100 میلی‌ثانیه  
      this.updateInterval = null;  
    }  
  
    async initialize(currentPosition) {  
      if (!window.DeviceMotionEvent || !window.DeviceOrientationEvent) {  
        throw new Error('سنسورهای حرکتی روی این دستگاه پشتیبانی نمی‌شوند.');  
      }  
  
      try {  
        // درخواست دسترسی به سنسورها در iOS و دستگاه‌های جدید  
        if (typeof DeviceMotionEvent.requestPermission === 'function') {  
          const motionPermission = await DeviceMotionEvent.requestPermission();  
          const orientationPermission = await DeviceOrientationEvent.requestPermission();  
          
          if (motionPermission !== 'granted' || orientationPermission !== 'granted') {  
            throw new Error('دسترسی به سنسورها داده نشد.');  
          }  
        }  
        
        this.startPosition = currentPosition;  
        this.currentPosition = { ...currentPosition };  
        this.isInitialized = true;  
        
        // محاسبه ضریب کالیبراسیون از طریق تنظیمات ذخیره شده یا مقدار پیش‌فرض  
        this.loadCalibration();  
        
        return true;  
      } catch (error) {  
        console.error('خطا در راه‌اندازی Dead Reckoning:', error);  
        throw error;  
      }  
    }  
  
    loadCalibration() {  
      // خواندن ضریب کالیبراسیون از localStorage  
      const savedCalibration = localStorage.getItem('stepCalibration');  
      if (savedCalibration) {  
        const calibData = JSON.parse(savedCalibration);  
        this.stepLength = calibData.stepLength || 0.75;  
        this.calibrationFactor = calibData.calibrationFactor || 1.0;  
      }  
    }  
  
    saveCalibration() {  
      // ذخیره ضریب کالیبراسیون در localStorage  
      const calibData = {  
        stepLength: this.stepLength,  
        calibrationFactor: this.calibrationFactor  
      };  
      localStorage.setItem('stepCalibration', JSON.stringify(calibData));  
    }  
  
    start(onNewPositionCallback) {  
      if (!this.isInitialized) {  
        throw new Error('سیستم Dead Reckoning هنوز راه‌اندازی نشده است.');  
      }  
      
      if (this.isRunning) {  
        return;  
      }  
      
      this.onNewPositionCallback = onNewPositionCallback;  
      this.stepCount = 0;  
      this.path = [];  
      this.isRunning = true;  
      
      // افزودن نقطه شروع به مسیر  
      this.path.push({  
        coords: { ...this.currentPosition.coords },  
        timestamp: Date.now(),  
        source: 'initial'  
      });  
      
      // راه‌اندازی سنسور تشخیص قدم  
      window.addEventListener('devicemotion', this.onStepDetected);  
      
      // راه‌اندازی سنسور جهت‌یابی  
      window.addEventListener('deviceorientation', this.onOrientationChange);  
      
      // شروع چرخه به‌روز‌رسانی  
      this.updateInterval = setInterval(() => {  
        // به‌روز‌رسانی مسیر در زمان‌های مشخص حتی اگر قدمی تشخیص داده نشده باشد  
        this.updatePath();  
      }, 100);  
    }  
  
    stop() {  
      if (!this.isRunning) {  
        return;  
      }  
      
      this.isRunning = false;  
      
      // توقف گوش دادن به سنسورها  
      window.removeEventListener('devicemotion', this.onStepDetected);  
      window.removeEventListener('deviceorientation', this.onOrientationChange);  
      
      // توقف چرخه به‌روز‌رسانی  
      if (this.updateInterval) {  
        clearInterval(this.updateInterval);  
        this.updateInterval = null;  
      }  
    }  
  
    reset() {  
      this.stop();  
      this.stepCount = 0;  
      this.path = [];  
      this.lastStep = null;  
      this.direction = 0;  
      this.isRunning = false;  
      this.isInitialized = false;  
    }  
  
    calibrate(actualDistance, stepCount) {  
      if (stepCount <= 0 || actualDistance <= 0) {  
        return false;  
      }  
      
      // محاسبه طول متوسط هر قدم بر اساس مسافت واقعی و تعداد قدم‌ها  
      this.stepLength = actualDistance / stepCount;  
      
      // به‌روز‌رسانی ضریب کالیبراسیون  
      this.saveCalibration();  
      
      return true;  
    }  
  
    // تشخیص قدم با استفاده از داده‌های شتاب‌سنج  
    onStepDetected(event) {  
      if (!this.isRunning) return;  
      
      const { acceleration } = event;  
      if (!acceleration || !acceleration.x) return;  
      
      // الگوریتم تشخیص قدم با استفاده از تغییرات شتاب  
      const accelMagnitude = Math.sqrt(  
        Math.pow(acceleration.x, 2) +   
        Math.pow(acceleration.y, 2) +   
        Math.pow(acceleration.z, 2)  
      );  
      
      const now = Date.now();  
      
      // آستانه تشخیص قدم  
      const STEP_THRESHOLD = 10; // مقدار این آستانه باید بر اساس تست تنظیم شود  
      const MIN_STEP_INTERVAL = 250; // حداقل زمان بین دو قدم (میلی‌ثانیه)  
      
      if (!this.lastStep) {  
        this.lastStep = {  
          timestamp: now,  
          magnitude: accelMagnitude  
        };  
        return;  
      }  
      
      // بررسی اگر تغییر شتاب بیشتر از آستانه است و زمان کافی از قدم قبلی گذشته  
      if (Math.abs(accelMagnitude - this.lastStep.magnitude) > STEP_THRESHOLD &&  
          now - this.lastStep.timestamp > MIN_STEP_INTERVAL) {  
        
        // یک قدم تشخیص داده شد  
        this.stepCount++;  
        this.lastStep = {  
          timestamp: now,  
          magnitude: accelMagnitude  
        };  
        
        // محاسبه موقعیت جدید بر اساس جهت و طول قدم  
        this.calculateNewPosition();  
      }  
    }  
  
    // دریافت جهت حرکت از سنسور جهت‌یابی  
    onOrientationChange(event) {  
      if (!this.isRunning) return;  
      
      // استفاده از compassHeading یا alpha  
      let newDirection;  
      
      if (event.webkitCompassHeading) {  
        // Safari در iOS  
        newDirection = event.webkitCompassHeading;  
      } else {  
        // سایر مرورگرها  
        newDirection = 360 - event.alpha;  
      }  
      
      // اعمال فیلتر برای کاهش نویز  
      this.direction = this.applyDirectionFilter(newDirection);  
    }  
  
    // فیلتر ساده برای نرم‌سازی تغییرات جهت  
    applyDirectionFilter(newDirection) {  
      const FILTER_FACTOR = 0.2; // ضریب فیلتر (0 تا 1)  
      return this.direction * (1 - FILTER_FACTOR) + newDirection * FILTER_FACTOR;  
    }  
  
    // محاسبه موقعیت جدید بر اساس قدم و جهت  
    calculateNewPosition() {  
      if (!this.currentPosition || !this.isRunning) return;  
      
      // تبدیل جهت به رادیان  
      const directionRad = (this.direction * Math.PI) / 180;  
      
      // محاسبه میزان تغییر طول و عرض جغرافیایی  
      const stepLengthWithCalibration = this.stepLength * this.calibrationFactor;  
      
      // تقریب تغییر طول و عرض جغرافیایی (تبدیل متر به درجه)  
      // این تبدیل در نزدیکی خط استوا دقیق‌تر است و در عرض‌های جغرافیایی بالاتر باید اصلاح شود  
      const lat = this.currentPosition.coords.lat;  
      const lng = this.currentPosition.coords.lng;  
      
      // تقریب برای تبدیل متر به درجه (بستگی به عرض جغرافیایی دارد)  
      const metersPerDegreeLat = 111320; // متوسط متر در هر درجه عرض جغرافیایی  
      const metersPerDegreeLng = 111320 * Math.cos(lat * (Math.PI / 180)); // متوسط متر در هر درجه طول جغرافیایی در این عرض  
      
      // محاسبه تغییرات بر اساس جهت حرکت  
      const latChange = (stepLengthWithCalibration * Math.cos(directionRad)) / metersPerDegreeLat;  
      const lngChange = (stepLengthWithCalibration * Math.sin(directionRad)) / metersPerDegreeLng;  
      
      // محاسبه موقعیت جدید  
      const newLat = lat + latChange;  
      const newLng = lng + lngChange;  
      
      // به‌روزرسانی موقعیت فعلی  
      this.currentPosition = {  
        coords: {  
          lat: newLat,  
          lng: newLng,  
          accuracy: this.currentPosition.coords.accuracy + 1, // افزایش عدم دقت با هر قدم  
          altitude: this.currentPosition.coords.altitude,  
          heading: this.direction,  
          speed: stepLengthWithCalibration / 0.6 // تخمین سرعت (فرض می‌کنیم هر قدم 0.6 ثانیه طول می‌کشد)  
        },  
        timestamp: Date.now(),  
        id: Date.now(),  
        source: 'dead-reckoning'  
      };  
      
      // افزودن به مسیر  
      this.path.push({ ...this.currentPosition });  
      
      // فراخوانی کالبک با موقعیت جدید  
      if (this.onNewPositionCallback) {  
        this.onNewPositionCallback(this.currentPosition);  
      }  
    }  
  
    // به‌روزرسانی مسیر حتی بدون تشخیص قدم جدید  
    updatePath() {  
      if (!this.isRunning || !this.currentPosition) {  
        return;  
      }  
      
      // فراخوانی کالبک برای به‌روزرسانی UI حتی بدون تغییر موقعیت  
      if (this.onNewPositionCallback) {  
        this.onNewPositionCallback(this.currentPosition);  
      }  
    }  
  
    // دریافت مسیر کامل Dead Reckoning  
    getPath() {  
      return [...this.path];  
    }  
  
    // دریافت تعداد قدم‌ها  
    getStepCount() {  
      return this.stepCount;  
    }  
  
    // محاسبه مسافت طی شده (متر)  
    getDistance() {  
      return this.stepCount * this.stepLength * this.calibrationFactor;  
    }  
  }  
  
  // ساخت نمونه منحصر به فرد از سرویس  
  const deadReckoningService = new DeadReckoningService();  
  export default deadReckoningService;  
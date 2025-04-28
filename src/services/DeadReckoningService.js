// src/services/DeadReckoningService.js  
// تابع برای محاسبه انحراف مغناطیسی بر اساس موقعیت جغرافیایی  
function getMagneticDeclination(latitude, longitude) {  
    // این یک مدل ساده‌سازی شده است. برای دقت بیشتر از API یا کتابخانه‌های تخصصی استفاده کنید  
    // مثال: https://www.ngdc.noaa.gov/geomag/calculators/magcalc.shtml  
    
    // مقدار میانگین برای تهران حدود 4.5 درجه شرقی است (2023)  
    // یعنی قطب‌نمای مغناطیسی 4.5 درجه به شرق قطب جغرافیایی اشاره می‌کند  
    return 4.5 * Math.PI / 180; // تبدیل به رادیان  
  } 
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

        // پارامترهای فیلتر مکمل  
        this.alpha = 0.98; // ضریب ترکیب (بیشتر به ژیروسکوپ اعتماد می‌کند)  

        // مقادیر لازم برای فیلتر  
        this.lastTimestamp = 0;
        this.headingFromGyro = 0;
        this.headingFromMagnetometer = 0;
    }

    toggle(initialLatLng = null) {
        this.isActive = !this.isActive;

        if (this.isActive) {
            if (initialLatLng) {
                this.referencePosition = initialLatLng;

                // محاسبه انحراف مغناطیسی برای موقعیت فعلی  
                this.magneticDeclination = getMagneticDeclination(
                    initialLatLng.lat,
                    initialLatLng.lng
                );

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

    // محاسبه جهت با استفاده از فیلتر مکمل  
    computeHeadingWithComplementaryFilter(gyroData, heading, timestamp) {
        // اگر اولین فراخوانی است، مقداردهی اولیه  
        if (this.lastTimestamp === 0) {
            this.headingFromGyro = heading;
            this.headingFromMagnetometer = heading;
            this.lastTimestamp = timestamp;
            return heading;
        }

        // محاسبه فاصله زمانی (به ثانیه)  
        const dt = (timestamp - this.lastTimestamp) / 1000;
        this.lastTimestamp = timestamp;

        // به‌روزرسانی جهت با ژیروسکوپ  
        // gyroData.z چرخش حول محور عمودی است (برای تلفن در حالت عمودی)  
        const correctedGyroZ = gyroData.z - this.gyroBias.z;

        // در اینجا ما فرض می‌کنیم که gyroData به رادیان بر ثانیه است  
        this.headingFromGyro += correctedGyroZ * dt;

        // نرمال‌سازی بین 0 تا 2π  
        this.headingFromGyro = this.headingFromGyro % (2 * Math.PI);
        if (this.headingFromGyro < 0) this.headingFromGyro += (2 * Math.PI);

        // جهت از مگنتومتر (قطب‌نما) - تبدیل از درجه به رادیان  
        this.headingFromMagnetometer = heading * Math.PI / 180;

        // ترکیب دو مقدار با فیلتر مکمل  
        // ژیروسکوپ برای تغییرات کوتاه‌مدت دقیق است  
        // مگنتومتر برای جهت‌یابی بلندمدت دقیق است  
        const filteredHeading = this.alpha * this.headingFromGyro + (1 - this.alpha) * this.headingFromMagnetometer;

        // تصحیح انحراف مغناطیسی  
        let correctedHeading = filteredHeading;
        if (this.magneticDeclination) {
            correctedHeading -= this.magneticDeclination;

            // نرمال‌سازی  
            if (correctedHeading < 0) correctedHeading += (2 * Math.PI);
            if (correctedHeading >= (2 * Math.PI)) correctedHeading -= (2 * Math.PI);
        }

        return correctedHeading;

        // return filteredHeading;
    }

    processImuData(accelerometer, gyroscope, timestamp, compassHeading) {
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

        this.heading = this.computeHeadingWithComplementaryFilter(
            gyroscope,
            compassHeading, // جهت قطب‌نما از useIMUSensors  
            timestamp
        );

        // محاسبه فاصله زمانی  
        // محاسبه فاصله زمانی  
        const dt = this.timestamps.length > 0
            ? (timestamp - this.timestamps[this.timestamps.length - 1]) / 1000
            : 0.01;

        // به‌روزرسانی heading با استفاده از ژیروسکوپ  
        // در اینجا از gyroscope.z برای چرخش افقی استفاده می‌کنیم  
        // و از gyroscope.x برای تغییر heading در صفحه افقی  
        // نکته: وابسته به جهت‌گیری دستگاه  

        // استفاده از gyroscope.alpha برای چرخش حول محور عمودی (تغییر جهت افقی)  
        const correctedGyroX = gyroscope.x - this.gyroBias.x;

        // اصلاح جهت: استفاده از gyroscope.x که به چرخش حول محور عرضی مربوط است  
        // برای تلفن‌های هوشمند که در حالت عمودی نگه داشته می‌شوند،  
        // این محور به تغییر heading در صفحه افقی مربوط می‌شود  
        this.heading += correctedGyroX * dt;

        // نرمال‌سازی heading بین 0 تا 2π  
        this.heading = this.heading % (2 * Math.PI);
        if (this.heading < 0) this.heading += (2 * Math.PI);

        // تشخیص گام  
        const stepDetected = this._detectStep(accelerometer, timestamp);

        if (stepDetected) {
            // جهت شمال به سمت بالای صفحه است (0 رادیان)  
            // محاسبه تغییر موقعیت - با توجه به این که جهت جلو باید سمت بالای گوشی باشد  
            // همانطور که شما درخواست کرده‌اید  
            const dx = this.strideLength * Math.sin(this.heading); // تغییر در محور x  
            const dy = -this.strideLength * Math.cos(this.heading); // تغییر در محور y (منفی برای حرکت به سمت بالا)  

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
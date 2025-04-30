// src/services/AdvancedDeadReckoningService.js  
import { KalmanFilter } from './KalmanFilter';
import { LowPassFilter } from '../utils/LowPassFilter';
import { HighPassFilter } from '../utils/HighPassFilter';
import { PeakDetector } from '../utils/PeakDetector';

/**  
 * سرویس Dead Reckoning پیشرفته با Sensor Fusion  
 * ترکیب داده‌های سنسورهای IMU (شتاب‌سنج، ژیروسکوپ، مگنتومتر) و GPS  
 * با استفاده از Extended Kalman Filter  
 */
class AdvancedDeadReckoningService {
    // متد کمکی تبدیل رادیان به درجه  
    _toDegrees(rad) {
        return rad * 180 / Math.PI;
    }

    constructor() {
        // وضعیت سرویس  
        this.isActive = false;
        this.isCalibrating = false;
        this.calibrationStart = 0;
        this.calibrationDuration = 2000; // زمان کالیبراسیون به میلی‌ثانیه (2 ثانیه)  

        // فیلترها برای پردازش داده‌های سنسور  
        this.accelerometerLowPassFilter = new LowPassFilter(0.1); // آلفا کوچک‌تر = فیلترینگ قوی‌تر  
        this.gyroscopeLowPassFilter = new LowPassFilter(0.2);
        this.orientationLowPassFilter = new LowPassFilter(0.1);
        this.accelerometerHighPassFilter = new HighPassFilter(0.8); // آلفا بزرگ‌تر = فیلترینگ قوی‌تر  

        // تشخیص گام (Peak Detector)  
        this.peakDetector = new PeakDetector({
            threshold: 0.8,       // آستانه تشخیص پیک  
            minPeakDistance: 300, // حداقل فاصله زمانی بین پیک‌ها (میلی‌ثانیه)  
            windowSize: 10        // تعداد نمونه‌هایی که برای تشخیص پیک بررسی می‌شوند  
        });

        // مقادیر کالیبراسیون  
        this.accelerometerBias = { x: 0, y: 0, z: 0 };
        this.gyroscopeBias = { alpha: 0, beta: 0, gamma: 0 };
        this.magneticDeclination = 0; // انحراف مغناطیسی (بر حسب رادیان)  

        // موقعیت و مسیر  
        this.referencePosition = null; // نقطه مرجع GPS برای تبدیل مختصات نسبی به مطلق  
        this.currentPosition = { x: 0, y: 0, theta: 0 }; // موقعیت نسبی (متر) و جهت (رادیان)  
        this.path = []; // مسیر نسبی (x, y در متر)  
        this.geoPath = []; // مسیر جغرافیایی (lat, lng)  

        // شمارش گام و طول گام  
        this.stepCount = 0;
        this.strideLength = 0.75; // طول گام پیش‌فرض (متر)  

        // فیلتر کالمن برای Sensor Fusion  
        this.kalmanFilter = new KalmanFilter({
            stateSize: 6,         // [x, y, theta, v, w, stride]  
            measurementSize: 3,   // [x_gps, y_gps, heading]  
            controlSize: 2,       // [a_norm, omega]  
        });

        // متغیرهای زمانی  
        this.lastUpdateTime = 0;
        this.lastStepTime = 0;

        // ذخیره آخرین مقادیر سنسورها  
        this.lastAccelerometer = null;
        this.lastGyroscope = null;
        this.lastOrientation = null;
        this.lastGps = null;

        // متغیرهای کمکی  
        this._initialHeading = null; // جهت اولیه  
        this._accelNormHistory = []; // تاریخچه نُرم شتاب برای تشخیص گام  
        this._listeners = [];        // لیستنرها برای اطلاع‌رسانی تغییرات  

        // لاگ برای تحلیل و دیباگ  
        this._log = {
            timestamp: [],
            sensor: [],
            data: [],
            result: []
        };
    }

    /**  
     * فعال/غیرفعال کردن سرویس  
     * @param {Object} initialLatLng موقعیت GPS اولیه برای استفاده به عنوان نقطه مرجع  
     * @returns {boolean} وضعیت جدید (فعال یا غیرفعال)  
     */
    toggle(initialLatLng = null) {
        // وضعیت قبلی  
        const wasActive = this.isActive;
        // تغییر وضعیت  
        this.isActive = !wasActive;

        if (this.isActive) {
            // استارت سرویس  
            console.log('Starting Advanced Dead Reckoning Service');

            // ابتدا کالیبراسیون را فعال کنید  
            this.isCalibrating = true;
            this.calibrationStart = Date.now();

            // پاکسازی مقادیر قبلی  
            this.path = [];
            this.geoPath = [];
            this.stepCount = 0;
            this._accelNormHistory = [];
            this.lastUpdateTime = Date.now();
            this.lastStepTime = 0;

            // مقداردهی اولیه فیلتر کالمن  
            this.kalmanFilter.initialize({
                x: 0,
                y: 0,
                theta: this._initialHeading || 0,
                v: 0,
                w: 0,
                stride: this.strideLength,
                timestamp: Date.now()
            });

            // اگر موقعیت اولیه ارسال شده است، از آن استفاده کنید  
            if (initialLatLng &&
                initialLatLng.lat !== undefined &&
                initialLatLng.lng !== undefined &&
                !isNaN(initialLatLng.lat) &&
                !isNaN(initialLatLng.lng)) {

                console.log('Setting initial reference position:', initialLatLng);

                this.referencePosition = {
                    lat: initialLatLng.lat,
                    lng: initialLatLng.lng,
                    accuracy: initialLatLng.accuracy || 5.0,
                    timestamp: Date.now()
                };

                // ثبت نقطه اول در مسیر نسبی و جغرافیایی  
                this.path.push({ x: 0, y: 0, timestamp: Date.now() });
                this.geoPath.push({
                    lat: initialLatLng.lat,
                    lng: initialLatLng.lng,
                    timestamp: Date.now()
                });

                this.currentPosition = { x: 0, y: 0, theta: this._initialHeading || 0 };

                // اطلاع‌رسانی به لیستنرها  
                this._notify({
                    type: 'serviceStateChanged',
                    isActive: this.isActive,
                    isCalibrating: this.isCalibrating,
                    stepCount: this.stepCount,
                    kalmanState: this.kalmanFilter.getState(),
                    path: this.path,
                    geoPath: this.geoPath,
                    position: this.currentPosition,
                    geoPosition: {
                        lat: initialLatLng.lat,
                        lng: initialLatLng.lng,
                        heading: this._toDegrees(this.kalmanFilter.getState().theta)
                    }
                });
            } else {
                console.warn('No valid initial position provided. GPS will be used when available.');

                // اطلاع‌رسانی به لیستنرها بدون داده موقعیت  
                this._notify({
                    type: 'serviceStateChanged',
                    isActive: this.isActive,
                    isCalibrating: this.isCalibrating,
                    stepCount: this.stepCount,
                    kalmanState: this.kalmanFilter.getState(),
                    path: this.path,
                    geoPath: this.geoPath
                });
            }
        } else {
            // توقف سرویس  
            console.log('Stopping Advanced Dead Reckoning Service');

            // اطلاع‌رسانی به لیستنرها  
            this._notify({
                type: 'serviceStateChanged',
                isActive: this.isActive,
                isCalibrating: false,
                kalmanState: this.kalmanFilter.getState(),
                path: this.path,
                geoPath: this.geoPath
            });
        }

        return this.isActive;
    }
    /**  
     * بازنشانی سرویس و پاکسازی داده‌ها  
     */
    reset() {
        if (!this.isActive) return;

        console.log('Resetting Advanced Dead Reckoning Service');

        // پاکسازی مسیر و داده‌ها  
        this.path = [];
        this.geoPath = [];
        this.stepCount = 0;
        this._accelNormHistory = [];

        // مقداردهی مجدد موقعیت نسبی  
        this.currentPosition = { x: 0, y: 0, theta: 0 };

        // اگر موقعیت مرجع وجود دارد، اولین نقطه مسیر را دوباره ثبت کنید  
        if (this.referencePosition) {
            this.path.push({ x: 0, y: 0, timestamp: Date.now() });
            this.geoPath.push({
                lat: this.referencePosition.lat,
                lng: this.referencePosition.lng,
                timestamp: Date.now()
            });
        }

        // مقداردهی مجدد فیلتر کالمن  
        this.kalmanFilter.initialize({
            x: 0,
            y: 0,
            theta: this._initialHeading || 0,
            v: 0,
            w: 0,
            stride: this.strideLength,
            timestamp: Date.now()
        });

        // اطلاع‌رسانی به لیستنرها  
        this._notify({
            type: 'serviceReset',
            stepCount: this.stepCount,
            kalmanState: this.kalmanFilter.getState(),
            path: this.path,
            geoPath: this.geoPath
        });
    }

    /**  
     * تنظیم طول گام  
     * @param {number} strideLength طول گام جدید (متر)  
     */
    setStrideLength(strideLength) {
        if (strideLength > 0) {
            this.strideLength = strideLength;

            // در صورت فعال بودن، طول گام را در فیلتر کالمن نیز به‌روز کنید  
            if (this.isActive) {
                this.kalmanFilter.setStrideLength(strideLength);
            }

            // اطلاع‌رسانی به لیستنرها  
            this._notify({
                type: 'strideLengthChanged',
                strideLength: this.strideLength
            });
        }
    }

    /**  
     * پردازش داده‌های شتاب‌سنج  
     */
    processAccelerometerData(data, timestamp = Date.now()) {
        if (!this.isActive || !data) return;

        // بررسی معتبر بودن داده‌ها  
        if (data.x === undefined || data.y === undefined || data.z === undefined ||
            isNaN(data.x) || isNaN(data.y) || isNaN(data.z)) {
            console.warn('داده‌های نامعتبر شتاب‌سنج:', data);
            return;
        }

        // لاگ کردن داده‌ها  
        this._logSensorData('accelerometer', data, timestamp);

        // تنظیم محور‌ها براساس جهت نگهداری گوشی  
        // در اینجا فرض می‌کنیم که کاربر گوشی را عمودی (portrait) نگه می‌دارد  
        let ax = 0, ay = 0, az = 0;

        // بررسی نوع داده‌های شتاب‌سنج (با جاذبه یا بدون جاذبه)  
        if (data.includesGravity) {
            // داده شامل جاذبه است (accelerationIncludingGravity)  
            // در حالت portrait: x = راست/چپ, y = بالا/پایین, z = جلو/عقب  
            ax = data.x;
            ay = data.y;
            az = data.z;

            // اگر فیلتر پایین‌گذر فعال نیست، آن را فعال کنید  
            if (!this._lowPassFilter) {
                this._lowPassFilter = new LowPassFilter(0.1);
            }

            // حذف تقریبی جاذبه با فیلتر پایین‌گذر  
            const gravity = this._lowPassFilter.filter([ax, ay, az]);
            ax -= gravity[0];
            ay -= gravity[1];
            az -= gravity[2];
        } else {
            // داده بدون جاذبه (acceleration)  
            ax = data.x;
            ay = data.y;
            az = data.z;
        }

        // اگر فیلتر بالاگذر فعال نیست، آن را فعال کنید  
        if (!this._highPassFilter) {
            this._highPassFilter = new HighPassFilter(0.8);
        }

        // اعمال فیلتر بالاگذر برای حذف نویز و drift کم‌فرکانس  
        const filteredAcc = this._highPassFilter.filter([ax, ay, az]);
        ax = filteredAcc[0];
        ay = filteredAcc[1];
        az = filteredAcc[2];

        // محاسبه سیگنال نُرم شتاب  
        const accelNorm = Math.sqrt(ax * ax + ay * ay + az * az);

        // محافظت در برابر مقادیر نامعتبر  
        if (isNaN(accelNorm)) {
            console.warn('مقدار نامعتبر در نُرم شتاب:', { ax, ay, az, accelNorm });
            return;
        }

        // افزودن به تاریخچه نُرم شتاب  
        this._accelNormHistory.push({ value: accelNorm, timestamp });

        // حفظ فقط آخرین N نمونه شتاب  
        const historyWindow = 50; // حفظ 50 نمونه آخر  
        if (this._accelNormHistory.length > historyWindow) {
            this._accelNormHistory = this._accelNormHistory.slice(-historyWindow);
        }

        // آستانه‌های تشخیص گام  
        const minPeakHeight = 1.05;  // حداقل ارتفاع قله  
        const minTimeBetweenSteps = 200; // حداقل زمان بین گام‌ها (میلی‌ثانیه)  
        alert(this._accelNormHistory.length)
        // فقط در صورتی که کالیبراسیون تمام شده است  
        if (!this.isCalibrating && this._accelNormHistory.length >= 10) {
            // بررسی برای تشخیص قله  
            if (this._isPeak(this._accelNormHistory, minPeakHeight)) {
                const currentTime = timestamp;
                // بررسی فاصله زمانی از آخرین گام  
                if (currentTime - this.lastStepTime > minTimeBetweenSteps) {
                    // یک گام جدید شناسایی شد  
                    this.stepCount++;
                    this.lastStepTime = currentTime;

                    // به‌روزرسانی فیلتر کالمن با ورودی تشخیص گام  
                    const dt = (currentTime - this.lastUpdateTime) / 1000.0;
                    this.lastUpdateTime = currentTime;

                    // ورودی کنترل: a_norm = 1 نشان‌دهنده تشخیص یک گام است  
                    const controlInput = {
                        a_norm: 1,
                        omega: this.lastGyroscope
                            ? this.lastGyroscope.alphaRad    // رادیان/ثانیه  
                            : 0
                    };

                    // پیش‌بینی فیلتر کالمن  
                    this.kalmanFilter.predict(controlInput, currentTime);

                    // به‌روزرسانی موقعیت فعلی از فیلتر کالمن  
                    const kalmanState = this.kalmanFilter.getState();

                    // محافظت در برابر مقادیر نامعتبر  
                    if (isNaN(kalmanState.x) || isNaN(kalmanState.y) || isNaN(kalmanState.theta)) {
                        console.warn('مقادیر نامعتبر در وضعیت کالمن:', kalmanState);
                        return;
                    }

                    // ثبت موقعیت نسبی جدید  
                    this.currentPosition = {
                        x: kalmanState.x,
                        y: kalmanState.y,
                        theta: kalmanState.theta
                    };

                    // تبدیل موقعیت نسبی به مختصات جغرافیایی  
                    if (this.referencePosition) {
                        const currentGeoPosition = this._calculateNewLatLng(
                            this.referencePosition.lat,
                            this.referencePosition.lng,
                            this.currentPosition.x,
                            this.currentPosition.y
                        );

                        // محافظت در برابر مقادیر نامعتبر  
                        if (isNaN(currentGeoPosition.lat) || isNaN(currentGeoPosition.lng)) {
                            console.warn('مقادیر نامعتبر در موقعیت جغرافیایی:', currentGeoPosition);
                            return;
                        }

                        // افزودن نقطه به مسیر  
                        this.path.push({
                            x: this.currentPosition.x,
                            y: this.currentPosition.y,
                            timestamp: currentTime
                        });

                        this.geoPath.push({
                            lat: currentGeoPosition.lat,
                            lng: currentGeoPosition.lng,
                            timestamp: currentTime
                        });

                        // لاگ کردن اطلاعات گام  
                        console.log(`[Step ${this.stepCount}] Pos: (${this.currentPosition.x.toFixed(2)}, ${this.currentPosition.y.toFixed(2)}) GeoPos: (${currentGeoPosition.lat.toFixed(6)}, ${currentGeoPosition.lng.toFixed(6)})`);

                        // اطلاع‌رسانی به لیستنرها  
                        this._notify({
                            type: 'step',
                            stepCount: this.stepCount,
                            position: {
                                x: this.currentPosition.x,
                                y: this.currentPosition.y,
                                theta: this.currentPosition.theta
                            },
                            geoPosition: {
                                lat: currentGeoPosition.lat,
                                lng: currentGeoPosition.lng,
                                heading: this._toDegrees(this.currentPosition.theta)
                            },
                            kalmanState: this.kalmanFilter.getState(),
                            path: this.path,
                            geoPath: this.geoPath
                        });
                    }
                }
            }
        } else if (this.isCalibrating) {
            // در حالت کالیبراسیون داده‌ها را جمع‌آوری می‌کنیم  
            const calibrationTime = 2000; // زمان کالیبراسیون (میلی‌ثانیه)  

            if (Date.now() - this.calibrationStart > calibrationTime) {
                // کالیبراسیون کامل شد  
                this.isCalibrating = false;
                console.log('Calibration complete');

                // اطلاع‌رسانی به لیستنرها  
                this._notify({
                    type: 'calibrationComplete',
                    isCalibrating: false,
                    path: this.path,
                    geoPath: this.geoPath
                });
            }
        }
    }

    /**  
     * بررسی وجود قله در داده‌های شتاب  
     * @param {Array} history تاریخچه داده‌های نُرم شتاب  
     * @param {number} threshold آستانه ارتفاع قله  
     * @returns {boolean} آیا نقطه انتهایی یک قله است  
     */
    _isPeak(history, threshold) {
        if (history.length < 3) return false;

        // بررسی 3 نمونه آخر  
        const last = history[history.length - 1].value;
        const previous = history[history.length - 2].value;
        const beforePrevious = history[history.length - 3].value;

        // شرایط قله:  
        // 1. نقطه میانی باید از دو طرف بزرگتر باشد  
        // 2. نقطه میانی باید از آستانه بزرگتر باشد  
        return (previous > last && previous > beforePrevious && previous > threshold);
    }

    /**  
     * پردازش داده‌های ژیروسکوپ  
     * @param {Object} gyroscope داده‌های ژیروسکوپ {alpha, beta, gamma, timestamp}  
     * @param {number} timestamp زمان دریافت داده  
     */
    processGyroscopeData(gyroscope, timestamp = Date.now()) {
        if (!this.isActive) return;

        // لاگ داده‌های ورودی  
        this._logSensorData('gyroscope', gyroscope, timestamp);

        // فیلتر داده‌های ژیروسکوپ  
        const filteredGyro = this._filterGyroscopeData(gyroscope);

        // پردازش داده‌های سنسور برای به‌روزرسانی موقعیت  
        this._processSensorData({
            type: 'gyroscope',
            data: filteredGyro,
            timestamp: timestamp
        });

        // ذخیره آخرین داده‌های ژیروسکوپ  
        this.lastGyroscope = {
            ...filteredGyro,
            timestamp: timestamp
        };
    }

    /**  
     * پردازش داده‌های جهت (مگنتومتر)  
     * @param {Object} orientation داده‌های جهت {alpha, beta, gamma, timestamp}  
     * @param {number} timestamp زمان دریافت داده  
     */
    processOrientationData(orientation, timestamp = Date.now()) {
        if (!this.isActive) return;

        // لاگ داده‌های ورودی  
        this._logSensorData('orientation', orientation, timestamp);

        // فیلتر داده‌های جهت  
        const filteredOrientation = this._filterOrientationData(orientation);

        // تبدیل alpha از درجه به رادیان (0-360 به 0-2π)  
        const heading = (filteredOrientation.alpha * Math.PI) / 180;

        // ذخیره جهت اولیه اگر تنظیم نشده است  
        if (this._initialHeading === null && orientation.absolute) {
            this._initialHeading = heading;

            // تنظیم جهت اولیه در فیلتر کالمن اگر تازه مقداردهی شده است  
            if (this.kalmanFilter) {
                const state = this.kalmanFilter.getState();
                state.theta = heading;
                this.kalmanFilter.initialize(state);
            }
        }

        // پردازش داده‌های سنسور برای به‌روزرسانی موقعیت  
        this._processSensorData({
            type: 'orientation',
            data: {
                ...filteredOrientation,
                heading: heading
            },
            timestamp: timestamp
        });

        // ذخیره آخرین داده‌های جهت  
        this.lastOrientation = {
            ...filteredOrientation,
            heading: heading,
            timestamp: timestamp
        };
    }

    /**  
     * پردازش داده‌های GPS  
     * @param {Object} position موقعیت GPS {lat, lng}  
     * @param {number} accuracy دقت موقعیت (متر)  
     * @param {number} timestamp زمان دریافت داده  
     */
    processGpsData(position, accuracy = 5.0, timestamp = Date.now()) {
        if (!this.isActive) return;

        // لاگ داده‌های ورودی  
        this._logSensorData('gps', { ...position, accuracy }, timestamp);

        // اگر موقعیت مرجع تنظیم نشده است، آن را تنظیم کنید  
        if (!this.referencePosition) {
            console.log('Setting reference position from GPS:', position);

            this.referencePosition = {
                lat: position.lat,
                lng: position.lng,
                accuracy: accuracy,
                timestamp: timestamp
            };

            // ثبت نقطه اول در مسیر نسبی و جغرافیایی  
            this.path.push({ x: 0, y: 0, timestamp: timestamp });
            this.geoPath.push({ lat: position.lat, lng: position.lng, timestamp: timestamp });

            // مقداردهی مجدد موقعیت نسبی  
            this.currentPosition = { x: 0, y: 0, theta: this.currentPosition.theta };

            // اگر کالیبراسیون فعال است، آن را حفظ کنید  
            if (this.isCalibrating) {
                // تنظیم مجدد فیلتر کالمن با موقعیت اولیه  
                this.kalmanFilter.initialize({
                    x: 0,
                    y: 0,
                    theta: this._initialHeading || 0,
                    v: 0,
                    w: 0,
                    stride: this.strideLength,
                    timestamp: timestamp
                });
            }

            // اطلاع‌رسانی به لیستنرها  
            this._notify({
                type: 'referencePositionSet',
                referencePosition: this.referencePosition,
                kalmanState: this.kalmanFilter.getState(),
                path: this.path,
                geoPath: this.geoPath
            });

            return;
        }

        // تبدیل موقعیت GPS جدید به مختصات نسبی از نقطه مرجع  
        const relativePosition = this._calculateRelativePositionFromLatLng(
            this.referencePosition.lat,
            this.referencePosition.lng,
            position.lat,
            position.lng
        );

        // به‌روزرسانی فیلتر کالمن با اندازه‌گیری GPS جدید  
        this.kalmanFilter.update(
            {
                x_gps: relativePosition.x,
                y_gps: relativePosition.y,
                heading: this.lastOrientation ? this.lastOrientation.heading : undefined
            },
            {
                gps_accuracy: accuracy,
                heading_accuracy: this.lastOrientation ? 0.1 : undefined
            }
        );

        // گرفتن وضعیت به‌روز شده از فیلتر کالمن  
        const kalmanState = this.kalmanFilter.getState();

        // به‌روزرسانی موقعیت نسبی فعلی  
        this.currentPosition = {
            x: kalmanState.x,
            y: kalmanState.y,
            theta: kalmanState.theta
        };

        // تبدیل موقعیت نسبی فعلی به مختصات جغرافیایی  
        const currentGeoPosition = this._calculateNewLatLng(
            this.referencePosition.lat,
            this.referencePosition.lng,
            this.currentPosition.x,
            this.currentPosition.y
        );

        // افزودن به مسیر اگر فاصله کافی از آخرین نقطه دارد  
        if (this.path.length === 0 || this._calculateDistance(
            this.path[this.path.length - 1].x,
            this.path[this.path.length - 1].y,
            this.currentPosition.x,
            this.currentPosition.y
        ) > 0.5) { // حداقل 0.5 متر فاصله برای ثبت نقطه جدید در مسیر  
            this.path.push({
                x: this.currentPosition.x,
                y: this.currentPosition.y,
                timestamp: timestamp
            });

            this.geoPath.push({
                lat: currentGeoPosition.lat,
                lng: currentGeoPosition.lng,
                timestamp: timestamp
            });
        }

        // ذخیره آخرین داده‌های GPS  
        this.lastGps = {
            ...position,
            accuracy: accuracy,
            timestamp: timestamp
        };

        // اطلاع‌رسانی به لیستنرها  
        this._notify({
            type: 'positionUpdated',
            currentPosition: this.currentPosition,
            geoPosition: currentGeoPosition,
            kalmanState: kalmanState,
            path: this.path,
            geoPath: this.geoPath,
            source: 'gps'
        });
    }

    /**  
     * افزودن لیستنر برای دریافت تغییرات  
     * @param {Function} callback تابع اطلاع‌رسانی  
     * @returns {Function} تابع حذف لیستنر  
     */
    addListener(callback) {
        if (typeof callback === 'function') {
            this._listeners.push(callback);

            // ارسال وضعیت فعلی به لیستنر جدید  
            callback({
                type: 'initialState',
                isActive: this.isActive,
                isCalibrating: this.isCalibrating,
                stepCount: this.stepCount,
                strideLength: this.strideLength,
                kalmanState: this.kalmanFilter.getState(),
                path: this.path,
                geoPath: this.geoPath,
                referencePosition: this.referencePosition
            });

            // برگرداندن تابع حذف لیستنر  
            return () => {
                this._listeners = this._listeners.filter(listener => listener !== callback);
            };
        }

        return () => { }; // تابع خالی اگر callback معتبر نیست  
    }

    /**  
     * خروجی گرفتن از لاگ‌های ثبت شده  
     * @returns {Object} خروجی لاگ‌های ثبت شده  
     */
    exportLog() {
        const log = {
            timestamp: new Date().toISOString(),
            data: {
                sensorLog: this._log,
                path: this.path,
                geoPath: this.geoPath,
                stepCount: this.stepCount,
                strideLength: this.strideLength
            }
        };

        // ساخت یک بلاب برای دانلود  
        const blob = new Blob([JSON.stringify(log, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        // ایجاد لینک دانلود و کلیک خودکار  
        const a = document.createElement('a');
        a.href = url;
        a.download = `dead-reckoning-log-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        console.log('Log exported:', log);
        return log;
    }

    /**  
* تبدیل موقعیت نسبی به مختصات جغرافیایی  
* @param {number} refLat عرض جغرافیایی نقطه مرجع  
* @param {number} refLng طول جغرافیایی نقطه مرجع  
* @param {number} x موقعیت نسبی x (متر)  
* @param {number} y موقعیت نسبی y (متر)  
* @returns {Object} مختصات جغرافیایی {lat, lng}  
*/
    _calculateNewLatLng(refLat, refLng, x, y) {
        // اطمینان از معتبر بودن مقادیر ورودی  
        if (isNaN(refLat) || isNaN(refLng) || isNaN(x) || isNaN(y)) {
            console.error('Invalid inputs in _calculateNewLatLng:', { refLat, refLng, x, y });
            return { lat: refLat || 0, lng: refLng || 0 }; // برگرداندن مقدار پیش‌فرض  
        }

        // شعاع زمین (متر)  
        const R = 6378137;

        // تبدیل درجه به رادیان  
        const lat1 = refLat * Math.PI / 180;
        const lng1 = refLng * Math.PI / 180;

        // محاسبه تغییر عرض و طول جغرافیایی  
        const dlat = y / R;
        const dlng = x / (R * Math.cos(lat1));

        // تبدیل رادیان به درجه و محاسبه مختصات جدید  
        const newLat = refLat + (dlat * 180 / Math.PI);
        const newLng = refLng + (dlng * 180 / Math.PI);

        // بررسی معتبر بودن نتایج  
        if (isNaN(newLat) || isNaN(newLng)) {
            console.error('Invalid result in _calculateNewLatLng:', { newLat, newLng, inputs: { refLat, refLng, x, y } });
            return { lat: refLat, lng: refLng }; // برگرداندن نقطه مرجع  
        }

        return { lat: newLat, lng: newLng };
    }

    /**  
     * تبدیل مختصات جغرافیایی به موقعیت نسبی  
     * @param {number} refLat عرض جغرافیایی نقطه مرجع  
     * @param {number} refLng طول جغرافیایی نقطه مرجع  
     * @param {number} lat عرض جغرافیایی نقطه جدید  
     * @param {number} lng طول جغرافیایی نقطه جدید  
     * @returns {Object} موقعیت نسبی {x, y} (متر)  
     */
    _calculateRelativePositionFromLatLng(refLat, refLng, lat, lng) {
        // شعاع زمین (متر)  
        const R = 6378137;

        // تبدیل درجه به رادیان  
        const lat1 = refLat * Math.PI / 180;
        const lng1 = refLng * Math.PI / 180;
        const lat2 = lat * Math.PI / 180;
        const lng2 = lng * Math.PI / 180;

        // محاسبه تغییر عرض و طول جغرافیایی  
        const dlat = lat2 - lat1;
        const dlng = lng2 - lng1;

        // محاسبه فاصله  
        const y = dlat * R;
        const x = dlng * R * Math.cos(lat1);

        return { x, y };
    }

    /**  
       /**  
 * محاسبه فاصله اقلیدسی بین دو نقطه  
 * @param {number} x1 مختصات x نقطه اول  
 * @param {number} y1 مختصات y نقطه اول  
 * @param {number} x2 مختصات x نقطه دوم  
 * @param {number} y2 مختصات y نقطه دوم  
 * @returns {number} فاصله (متر)  
 */
    _calculateDistance(x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    }

    /**  
     * فیلتر کردن داده‌های شتاب‌سنج  
     * @param {Object} accelerometer داده‌های شتاب‌سنج  
     * @returns {Object} داده‌های فیلتر شده  
     */
    _filterAccelerometerData(accelerometer) {
        // استفاده از فیلتر پایین‌گذر برای حذف نویز  
        const filteredX = this.accelerometerLowPassFilter.filter(accelerometer.x, 'x');
        const filteredY = this.accelerometerLowPassFilter.filter(accelerometer.y, 'y');
        const filteredZ = this.accelerometerLowPassFilter.filter(accelerometer.z, 'z');

        // اگر در حال کالیبراسیون هستیم، بایاس شتاب‌سنج را به‌روز کنید  
        if (this.isCalibrating) {
            const weight = 0.1; // وزن به‌روزرسانی بایاس (0 تا 1)  
            this.accelerometerBias.x = (1 - weight) * this.accelerometerBias.x + weight * filteredX;
            this.accelerometerBias.y = (1 - weight) * this.accelerometerBias.y + weight * filteredY;
            this.accelerometerBias.z = (1 - weight) * this.accelerometerBias.z + weight * filteredZ;
        }

        // حذف بایاس از داده‌های فیلتر شده  
        const correctedX = filteredX - this.accelerometerBias.x;
        const correctedY = filteredY - this.accelerometerBias.y;
        const correctedZ = filteredZ - this.accelerometerBias.z;

        // اگر شتاب شامل جاذبه است (accelerationIncludingGravity)، مقدار شتاب جاذبه را حذف کنید  
        if (accelerometer.includesGravity) {
            // استفاده از فیلتر بالاگذر برای حذف تقریبی شتاب جاذبه  
            const highPassX = this.accelerometerHighPassFilter.filter(correctedX, 'x');
            const highPassY = this.accelerometerHighPassFilter.filter(correctedY, 'y');
            const highPassZ = this.accelerometerHighPassFilter.filter(correctedZ, 'z');

            return {
                x: highPassX,
                y: highPassY,
                z: highPassZ
            };
        }

        return {
            x: correctedX,
            y: correctedY,
            z: correctedZ
        };
    }

    /**  
     * فیلتر کردن داده‌های ژیروسکوپ  
     * @param {Object} gyroscope داده‌های ژیروسکوپ  
     * @returns {Object} داده‌های فیلتر شده  
     */
    _filterGyroscopeData(gyroscope) {
        // استفاده از فیلتر پایین‌گذر برای حذف نویز  
        const filteredAlpha = this.gyroscopeLowPassFilter.filter(gyroscope.alpha, 'alpha');
        const filteredBeta = this.gyroscopeLowPassFilter.filter(gyroscope.beta, 'beta');
        const filteredGamma = this.gyroscopeLowPassFilter.filter(gyroscope.gamma, 'gamma');

        // اگر در حال کالیبراسیون هستیم، بایاس ژیروسکوپ را به‌روز کنید  
        if (this.isCalibrating) {
            const weight = 0.1; // وزن به‌روزرسانی بایاس (0 تا 1)  
            this.gyroscopeBias.alpha = (1 - weight) * this.gyroscopeBias.alpha + weight * filteredAlpha;
            this.gyroscopeBias.beta = (1 - weight) * this.gyroscopeBias.beta + weight * filteredBeta;
            this.gyroscopeBias.gamma = (1 - weight) * this.gyroscopeBias.gamma + weight * filteredGamma;
        }

        // حذف بایاس از داده‌های فیلتر شده  
        const correctedAlpha = filteredAlpha - this.gyroscopeBias.alpha;
        const correctedBeta = filteredBeta - this.gyroscopeBias.beta;
        const correctedGamma = filteredGamma - this.gyroscopeBias.gamma;

        // تبدیل از درجه به رادیان  
        const alphaDeg = correctedAlpha;
        const betaDeg = correctedBeta;
        const gammaDeg = correctedGamma;

        // سرعت‌های زاویه‌ای (رادیان بر ثانیه)  
        const alphaRad = (alphaDeg * Math.PI) / 180;
        const betaRad = (betaDeg * Math.PI) / 180;
        const gammaRad = (gammaDeg * Math.PI) / 180;

        return {
            alpha: alphaDeg,
            beta: betaDeg,
            gamma: gammaDeg,
            alphaRad: alphaRad,
            betaRad: betaRad,
            gammaRad: gammaRad
        };
    }

    /**  
     * فیلتر کردن داده‌های جهت  
     * @param {Object} orientation داده‌های جهت  
     * @returns {Object} داده‌های فیلتر شده  
     */
    _filterOrientationData(orientation) {
        // استفاده از فیلتر پایین‌گذر برای حذف نویز  
        const filteredAlpha = this.orientationLowPassFilter.filter(orientation.alpha, 'alpha');
        const filteredBeta = this.orientationLowPassFilter.filter(orientation.beta, 'beta');
        const filteredGamma = this.orientationLowPassFilter.filter(orientation.gamma, 'gamma');

        return {
            alpha: filteredAlpha,
            beta: filteredBeta,
            gamma: filteredGamma,
            absolute: orientation.absolute
        };
    }

    /**  
     * تشخیص گام با استفاده از الگوریتم تشخیص پیک  
     * @param {number} accelNorm نُرم شتاب  
     * @param {number} timestamp زمان دریافت داده  
     * @returns {boolean} آیا گام تشخیص داده شده است  
     */
    _detectStep(accelNorm, timestamp) {
        // اگر کالیبراسیون فعال است، گام تشخیص داده نشود  
        if (this.isCalibrating) return false;

        // لاگ برای دیباگ  
        console.log("Accel Norm:", accelNorm);

        // تشخیص پیک با استفاده از کلاس PeakDetector  
        const peakDetected = this.peakDetector.addSample(accelNorm, timestamp);

        if (peakDetected) {
            // محاسبه فاصله زمانی از آخرین گام  
            const timeSinceLastStep = timestamp - this.lastStepTime;

            // بررسی شرایط مناسب برای تشخیص گام:  
            // 1. حداقل 250 میلی‌ثانیه از آخرین گام گذشته باشد (حداکثر 4 گام در ثانیه)  
            // 2. بزرگی شتاب بزرگتر از آستانه باشد  
            if (timeSinceLastStep > 10 && accelNorm > 0.8) {  // کاهش آستانه از 1.2 به 0.8  
                this.stepCount++;
                this.lastStepTime = timestamp;

                // اطلاع‌رسانی به لیستنرها  
                this._notify({
                    type: 'stepDetected',
                    stepCount: this.stepCount,
                    timestamp: timestamp
                });

                return true;
            }
        }

        return false;
    }

    /**  
     * پردازش داده‌های سنسور و به‌روزرسانی موقعیت  
     * @param {Object} data داده‌های پردازش شده  
     */
    _processSensorData(data) {
        // در ابتدا بررسی کنید آیا کالیبراسیون به اتمام رسیده است  
        if (this.isCalibrating) {
            const now = Date.now();
            if (now - this.calibrationStart > this.calibrationDuration) {
                console.log('Calibration complete. Biases:', {
                    accelerometer: this.accelerometerBias,
                    gyroscope: this.gyroscopeBias
                });

                this.isCalibrating = false;

                // اطلاع‌رسانی به لیستنرها  
                this._notify({
                    type: 'calibrationComplete',
                    isCalibrating: false,
                    accelerometerBias: this.accelerometerBias,
                    gyroscopeBias: this.gyroscopeBias
                });
            }
            return; // در طول کالیبراسیون، موقعیت به‌روز نشود  
        }

        // محاسبه فاصله زمانی از آخرین به‌روزرسانی  
        const now = data.timestamp;
        const dt = (now - this.lastUpdateTime) / 1000; // تبدیل به ثانیه  

        // اگر اولین داده است یا dt منفی است، فقط زمان را به‌روز کنید  
        if (this.lastUpdateTime === 0 || dt <= 0) {
            this.lastUpdateTime = now;
            return;
        }

        // آماده‌سازی ورودی‌های کنترل برای فیلتر کالمن  
        let controlInputs = { a_norm: 0, omega: 0 };

        // بروزرسانی سرعت زاویه‌ای از ژیروسکوپ  
        if (data.type === 'gyroscope') {
            // در اینجا ما از سرعت زاویه‌ای حول محور z (alpha) استفاده می‌کنیم  
            controlInputs.omega = data.data.alphaRad || 0;
        }

        // بروزرسانی فعالیت/گام از شتاب‌سنج  
        if (data.type === 'accelerometer' && data.stepDetected) {
            controlInputs.a_norm = 1; // گام تشخیص داده شده  
        }

        // پیش‌بینی موقعیت با فیلتر کالمن  
        this.kalmanFilter.predict(controlInputs, now);

        // به‌روزرسانی موقعیت نسبی فعلی از فیلتر کالمن  
        const kalmanState = this.kalmanFilter.getState();
        this.currentPosition = {
            x: kalmanState.x,
            y: kalmanState.y,
            theta: kalmanState.theta
        };

        // اگر نقطه مرجع تنظیم شده است، موقعیت جغرافیایی فعلی را محاسبه کنید  
        let currentGeoPosition = null;
        if (this.referencePosition) {
            currentGeoPosition = this._calculateNewLatLng(
                this.referencePosition.lat,
                this.referencePosition.lng,
                this.currentPosition.x,
                this.currentPosition.y
            );

            // افزودن به مسیر اگر فاصله کافی از آخرین نقطه دارد  
            // افزودن به مسیر اگر فاصله کافی از آخرین نقطه دارد  
            if (this.path.length === 0 || (
                this._calculateDistance(
                    this.path[this.path.length - 1].x,
                    this.path[this.path.length - 1].y,
                    this.currentPosition.x,
                    this.currentPosition.y
                ) > 0.1 && // کاهش از 0.5 به 0.1 متر  
                now - this.path[this.path.length - 1].timestamp > 100 // کاهش از 500 به 100 میلی‌ثانیه  
            )) {
                this.path.push({
                    x: this.currentPosition.x,
                    y: this.currentPosition.y,
                    timestamp: now
                });

                this.geoPath.push({
                    lat: currentGeoPosition.lat,
                    lng: currentGeoPosition.lng,
                    timestamp: now
                });
            }
        }

        // به‌روزرسانی زمان آخرین پردازش  
        this.lastUpdateTime = now;

        // اطلاع‌رسانی به لیستنرها (فقط اگر تغییر قابل توجهی رخ داده باشد یا اندازه‌گیری ورودی داشته باشیم)  
        // اطلاع‌رسانی به لیستنرها با فرکانس بیشتر  
        if (data.type === 'accelerometer') { // حذف شرط data.stepDetected  
            this._notify({
                type: 'positionUpdated',
                currentPosition: this.currentPosition,
                geoPosition: currentGeoPosition,
                kalmanState: kalmanState,
                path: this.path,
                geoPath: this.geoPath,
                source: 'imu'
            });
        } else if (data.type === 'orientation') {
            this._notify({
                type: 'orientationUpdated',
                currentPosition: this.currentPosition,
                geoPosition: currentGeoPosition,
                kalmanState: kalmanState,
                source: 'imu'
            });
        }
    }

    /**  
       /**  
     * اطلاع‌رسانی به لیستنرها  
     * @param {Object} data داده‌های اطلاع‌رسانی  
     * @private  
     */
    _notify(data) {
        // افزودن isActive و isCalibrating به همه اطلاع‌رسانی‌ها  
        const eventData = {
            ...data,
            isActive: this.isActive,
            isCalibrating: this.isCalibrating
        };

        // صدا زدن همه لیستنرها  
        this._listeners.forEach(listener => {
            try {
                listener(eventData);
            } catch (error) {
                console.error('Error in Dead Reckoning listener:', error);
            }
        });
    }

    /**  
     * ثبت داده‌های سنسور در لاگ  
     * @param {string} sensorType نوع سنسور  
     * @param {Object} data داده‌های سنسور  
     * @param {number} timestamp زمان دریافت داده  
     * @private  
     */
    _logSensorData(sensorType, data, timestamp) {
        // محدود کردن حجم لاگ برای جلوگیری از مصرف زیاد حافظه  
        const maxLogSize = 1000; // حداکثر تعداد رکوردها در لاگ  

        if (this._log.timestamp.length >= maxLogSize) {
            // حذف قدیمی‌ترین رکوردها  
            this._log.timestamp.shift();
            this._log.sensor.shift();
            this._log.data.shift();
            this._log.result.shift();
        }

        // افزودن رکورد جدید  
        this._log.timestamp.push(timestamp);
        this._log.sensor.push(sensorType);
        this._log.data.push(JSON.parse(JSON.stringify(data))); // کلون کردن داده برای جلوگیری از تغییرات بعدی  

        // ثبت نتایج (موقعیت فعلی، وضعیت کالمن و غیره)  
        const result = {
            position: this.currentPosition ? { ...this.currentPosition } : null,
            kalmanState: this.kalmanFilter ? this.kalmanFilter.getState() : null,
            stepCount: this.stepCount
        };
        this._log.result.push(result);
    }
}

// ایجاد سینگلتون  
const advancedDeadReckoningService = new AdvancedDeadReckoningService();
export default advancedDeadReckoningService;  
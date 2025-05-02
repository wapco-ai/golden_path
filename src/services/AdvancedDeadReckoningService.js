// src/services/AdvancedDeadReckoningService.js  
import { KalmanFilter } from './KalmanFilter';
import { LowPassFilter } from '../utils/LowPassFilter';
import { HighPassFilter } from '../utils/HighPassFilter';
import { PeakDetector } from '../utils/PeakDetector';
import { GyroscopeHeadingProcessor } from '../utils/GyroscopeHeadingProcessor';


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
        this.gyroscopeHeadingProcessor = new GyroscopeHeadingProcessor();

        this.gyroscopeHeadingProcessor.setCoefficients({
            portrait: {
                alpha: -5.0,  // Increase sensitivity significantly  
                beta: 1.0,
                gamma: 1.0
            },
            landscape: {
                alpha: -1.0,
                beta: -5.0,
                gamma: 1.0
            }
        });

        console.log('Gyroscope heading processor initialized');


        // تشخیص گام (Peak Detector)  
        this.peakDetector = new PeakDetector({
            threshold: 0.4,       // آستانه تشخیص پیک  
            minPeakDistance: 250, // حداقل فاصله زمانی بین پیک‌ها (میلی‌ثانیه)  
            // windowSize: 10        // تعداد نمونه‌هایی که برای تشخیص پیک بررسی می‌شوند  
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
    /**  
 * پردازش داده‌های شتاب‌سنج (IMU)  
 * @param {Object} data  {x, y, z, includesGravity}  
 * @param {number} [timestamp=Date.now()]  
 */
    processAccelerometerData(data, timestamp = Date.now()) {


        /* ───── ۱) پیش‌شرط‌ها ───── */
        if (!this.isActive || !data) return;

        if (['x', 'y', 'z'].some(k => data[k] === undefined || isNaN(data[k]))) {
            console.warn('داده‌های نامعتبر شتاب‌سنج:', data);
            return;
        }

        /* ───── ۲) لاگ خام برای دیباگ ───── */
        this._logSensorData('accelerometer_raw', data, timestamp);

        /* ───── ۳) فیلتر و حذف بایاس ───── */
        const filtered = this._filterAccelerometerData(data);   // متد موجود در فایل  
        /* ───── ۴) محاسبه نُرم شتاب ───── */
        const accelNorm = Math.sqrt(
            filtered.x * filtered.x +
            filtered.y * filtered.y +
            filtered.z * filtered.z
        );

        if (!isFinite(accelNorm)) {
            console.warn('accelNorm غیرمعتبر:', accelNorm);
            return;
        }

        /* ───── ۵) تشخیص گام ───── */
        const stepDetected = this._detectStep(accelNorm, timestamp);

        /* ───── ۶) ارسال به موتور سنسور‌فیوژن ───── */
        this._processSensorData({
            type: 'accelerometer',
            data: { accelNorm },
            stepDetected,
            timestamp
        });

        /* ───── ۷) ذخیره آخرین شتاب ───── */
        this.lastAccelerometer = {
            ...filtered,
            accelNorm,
            timestamp
        };
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
    // اصلاح تابع processGyroscopeData  
    // تابع processGyroscopeData را به صورت زیر اصلاح کنید  
    processGyroscopeData(gyroscope, timestamp = Date.now()) {
        if (!this.isActive) return;

        // بررسی اعتبار داده‌های ورودی  
        if (!gyroscope || ['alpha', 'beta', 'gamma'].some(k => gyroscope[k] === undefined || isNaN(gyroscope[k]))) {
            console.warn('داده‌های نامعتبر ژیروسکوپ:', gyroscope);
            return;
        }

        // لاگ داده‌های ورودی (خام)  
        console.log('Raw gyroscope data:', gyroscope);
        this._logSensorData('gyroscope', gyroscope, timestamp);

        // فیلتر داده‌های ژیروسکوپ  
        const filteredGyro = this._filterGyroscopeData(gyroscope);
        console.log('Filtered gyroscope data:', filteredGyro);

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

        // اضافه کردن تصحیح‌کننده جهت - هر 5 ثانیه  
        const timeSinceLastCorrection = timestamp - (this._lastOrientationCorrection || 0);
        if (orientation.absolute && timeSinceLastCorrection > 5000) {
            // تصحیح جهت با استفاده از قطب‌نما  
            this.kalmanFilter.update(
                { heading: heading },
                { heading_accuracy: 0.1 }
            );
            this._lastOrientationCorrection = timestamp;
            console.log('Orientation correction applied:', heading * 180 / Math.PI);
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

        console.log('proceccGpsData  >> currentGeoPosition: ' + currentGeoPosition)

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

        // اضافه کردن لاگ برای دیباگ  
        console.log('Gyroscope filtered:', {
            alpha: alphaDeg,
            beta: betaDeg,
            gamma: gammaDeg,
            alphaRad: alphaRad,
            betaRad: betaRad,
            gammaRad: gammaRad
        });

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
    /**  
     * تشخیص گام با PeakDetector  
     * @param {number} accelNorm  نُرم شتاب فیلترشده  
     * @param {number} timestamp  زمان نمونه (ms)  
     * @returns {boolean}  آیا گام رخ داده است؟  
     */
    // تابع _detectStep را در فایل سرویس Dead Reckoning اصلاح کنید  
    _detectStep(accelNorm, timestamp) {
        // کاهش آستانه تشخیص  
        if (accelNorm > 0.8 && timestamp - this.lastStepTime > 300) {
            this.stepCount++;
            this.lastStepTime = timestamp;

            // اطمینان از اطلاع‌رسانی صحیح به لیستنرها  
            this._notify({
                type: 'stepDetected',
                stepCount: this.stepCount,
                timestamp: timestamp
            });

            return true;
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

        if (data.type === 'gyroscope') {
            // استفاده از پردازنده جهت ژیروسکوپ برای محاسبه سرعت زاویه‌ای موثر  
            const effectiveOmega = this.gyroscopeHeadingProcessor.processGyroscopeData(
                data.data,
                now
            );

            // افزایش حساسیت با یک ضریب بزرگتر  
            const omegaMultiplier = 15.0;
            controlInputs.omega = effectiveOmega * omegaMultiplier;

            console.log('Gyro data processed:',
                'raw:', { alpha: data.data.alpha, beta: data.data.beta, gamma: data.data.gamma },
                'effective omega:', effectiveOmega,
                'applied omega:', controlInputs.omega
            );
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
            if (this.path.length === 0 || (
                this._calculateDistance(
                    this.path[this.path.length - 1].x,
                    this.path[this.path.length - 1].y,
                    this.currentPosition.x,
                    this.currentPosition.y
                ) > 0.1 && // کاهش از 0.5 به 0.1 متر  
                now - this.path[this.path.length - 1].timestamp > 200 // کاهش از 500 به 200 میلی‌ثانیه  
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
 * تست چرخش برای دیباگ هدینگ  
 * @param {number} degrees زاویه جدید به درجه  
 */
    forceRotation(degrees) {
        if (!this.isActive || !this.kalmanFilter) return;

        console.log('Forcing rotation to', degrees, 'degrees');

        // تبدیل درجه به رادیان  
        const radians = (degrees * Math.PI) / 180;

        // دریافت وضعیت فعلی  
        const state = this.kalmanFilter.getState();
        const oldTheta = state.theta;

        // تنظیم theta جدید  
        state.theta = radians;

        // مقداردهی مجدد فیلتر با وضعیت جدید  
        this.kalmanFilter.initialize(state);

        console.log('Rotation changed from',
            (oldTheta * 180 / Math.PI).toFixed(2), '°',
            'to', degrees.toFixed(2), '°');

        // اطلاع‌رسانی به شنوندگان  
        this._notify({
            type: 'orientationUpdated',
            currentPosition: this.currentPosition,
            kalmanState: this.kalmanFilter.getState(),
            source: 'manual'
        });
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

    // Add this method to AdvancedDeadReckoningService.js  
    forceRotation(degrees) {
        if (!this.isActive || !this.kalmanFilter) return;

        // Convert degrees to radians  
        const radians = (degrees * Math.PI) / 180;

        // Get current state  
        const state = this.kalmanFilter.getState();

        // Set new theta  
        state.theta = radians;

        // Initialize filter with new state  
        this.kalmanFilter.initialize(state);

        console.log('Forced rotation to:', degrees, 'degrees');

        // Notify listeners  
        this._notify({
            type: 'orientationUpdated',
            currentPosition: this.currentPosition,
            kalmanState: state,
            source: 'manual'
        });
    }
}

// ایجاد سینگلتون  
const advancedDeadReckoningService = new AdvancedDeadReckoningService();
export default advancedDeadReckoningService;  
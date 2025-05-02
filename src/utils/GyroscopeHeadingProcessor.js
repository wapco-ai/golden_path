/**  
 * کلاس پردازش جهت با استفاده از ژیروسکوپ  
 * این کلاس داده‌های ژیروسکوپ را برای محاسبه تغییرات جهت پردازش می‌کند  
 */
export class GyroscopeHeadingProcessor {
    constructor() {
        // Initial settings  
        this.lastTimestamp = 0;
        this.currentHeading = 0; // radians  
        this.isInitialized = false;

        // Coefficients for device orientations - INCREASED SIGNIFICANTLY  
        this.coefficients = {
            portrait: {
                alpha: -5.0,  // -1.0 → -5.0  
                beta: 1.0,    // 0.2 → 1.0  
                gamma: 1.0    // 0.2 → 1.0  
            },
            landscape: {
                alpha: -1.0,  // -0.2 → -1.0  
                beta: -5.0,   // -1.0 → -5.0  
                gamma: 1.0    // 0.2 → 1.0  
            }
        };

        this.deviceOrientation = 'portrait';
    }

    /**  
 * پردازش داده‌های ژیروسکوپ و محاسبه سرعت زاویه‌ای موثر  
 * @param {Object} gyroData داده‌های ژیروسکوپ {alpha, beta, gamma}  
 * @param {number} timestamp زمان دریافت داده  
 * @returns {number} سرعت زاویه‌ای موثر (رادیان بر ثانیه)  
 */
    processGyroscopeData(gyroData, timestamp = Date.now()) {
        // مرحله 1: فیلتر کردن داده‌های ژیروسکوپ  
        const filteredData = this._filterGyroscopeData(gyroData);

        // مرحله 2: تبدیل درجه به رادیان (اگر قبلاً در _filterGyroscopeData انجام نشده است)  
        if (!filteredData.alphaRad) {
            filteredData.alphaRad = (filteredData.alpha * Math.PI) / 180;
            filteredData.betaRad = (filteredData.beta * Math.PI) / 180;
            filteredData.gammaRad = (filteredData.gamma * Math.PI) / 180;
        }

        // مرحله 3: تعیین ضرایب بر اساس جهت‌گیری دستگاه  
        const coeffs = this.coefficients[this.deviceOrientation];

        // مرحله 4: محاسبه سرعت زاویه‌ای موثر با ترکیب محورها  
        // ضرایب باید برای تنظیم حساسیت هر محور تغییر کنند  
        const effectiveOmega =
            coeffs.alpha * filteredData.alphaRad +
            coeffs.beta * filteredData.betaRad +
            coeffs.gamma * filteredData.gammaRad;

        // افزودن لاگ تشخیصی مهم  
        console.log('Gyro heading processor: Calculating effective omega', {
            alphaRad: filteredData.alphaRad.toFixed(4),
            betaRad: filteredData.betaRad.toFixed(4),
            gammaRad: filteredData.gammaRad.toFixed(4),
            coeffs: coeffs,
            effectiveOmega: effectiveOmega.toFixed(6),
            deviceOrientation: this.deviceOrientation
        });

        // افزایش حساسیت  
        const sensitivityMultiplier = 5.0;
        const scaledOmega = effectiveOmega * sensitivityMultiplier;

        console.log('Effective omega calculated:', scaledOmega.toFixed(6), 'rad/s');

        return scaledOmega;
    }

    /**  
     * تنظیم ضرایب تاثیر محورها  
     * @param {Object} coefficients ضرایب جدید  
     */
    setCoefficients(coefficients) {
        if (coefficients.portrait) {
            this.coefficients.portrait = { ...this.coefficients.portrait, ...coefficients.portrait };
        }
        if (coefficients.landscape) {
            this.coefficients.landscape = { ...this.coefficients.landscape, ...coefficients.landscape };
        }
    }

    /**  
     * بازنشانی پردازنده  
     */
    reset() {
        this.lastTimestamp = 0;
        this.currentHeading = 0;
        this.isInitialized = false;
    }
}  
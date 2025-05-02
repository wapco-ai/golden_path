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
     * محاسبه تغییر جهت با استفاده از داده‌های ژیروسکوپ  
     * @param {Object} gyroData داده‌های ژیروسکوپ {alpha, beta, gamma, alphaRad, betaRad, gammaRad}  
     * @param {number} timestamp زمان فعلی (میلی‌ثانیه)  
     * @returns {number} سرعت زاویه‌ای موثر (رادیان بر ثانیه)  
     */
    processGyroscopeData(gyroData, timestamp) {
        // بررسی داده‌های ورودی  
        if (!gyroData || !timestamp) return 0;

        // اولین داده را ثبت کنید  
        if (!this.isInitialized) {
            this.lastTimestamp = timestamp;
            this.isInitialized = true;
            return 0;
        }

        // محاسبه اختلاف زمانی (به ثانیه)  
        const dt = Math.min(Math.max(0, (timestamp - this.lastTimestamp) / 1000.0), 0.2);
        if (dt < 0.001) return 0; // مقدار بسیار کوچک را نادیده بگیرید  

        // تشخیص حالت دستگاه براساس زاویه گاما  
        // اگر گاما بزرگتر از 45 درجه است، دستگاه در حالت افقی (landscape) است  
        this.deviceOrientation = Math.abs(gyroData.gamma || 0) > 45 ? 'landscape' : 'portrait';

        // انتخاب ضرایب مناسب بر اساس حالت دستگاه  
        const coef = this.coefficients[this.deviceOrientation];

        // محاسبه سرعت زاویه‌ای موثر  
        const effectiveOmega =
            (gyroData.alphaRad * coef.alpha) +
            (gyroData.betaRad * coef.beta) +
            (gyroData.gammaRad * coef.gamma);

        // به‌روزرسانی زمان آخرین پردازش  
        this.lastTimestamp = timestamp;

        console.log('Gyro heading processor:', {
            orientation: this.deviceOrientation,
            effectiveOmega: effectiveOmega,
            dt: dt
        });

        return effectiveOmega;
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
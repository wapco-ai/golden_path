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
    // Add/modify in GyroscopeHeadingProcessor.js
    processGyroscope(gyroData, timestamp) {
        if (!this.isInitialized) {
            this.lastTimestamp = timestamp;
            this.isInitialized = true;
            return this.currentHeading;
        }

        // Calculate time delta in seconds
        const dt = (timestamp - this.lastTimestamp) / 1000;
        if (dt <= 0) return this.currentHeading;

        // Use appropriate coefficients based on device orientation
        const coeff = this.coefficients[this.deviceOrientation];

        // Integrate angular velocity to get heading change
        // The key change is here - make sure rotation is properly accumulated
        const rotationRateAlpha = gyroData.alpha * coeff.alpha;
        const rotationRateBeta = gyroData.beta * coeff.beta;
        const rotationRateGamma = gyroData.gamma * coeff.gamma;

        // Calculate effective angular velocity (this is critical for proper heading)
        let effectiveAngularVelocity;

        if (this.deviceOrientation === 'portrait') {
            // In portrait mode, alpha is most important for horizontal rotation
            effectiveAngularVelocity = rotationRateAlpha;
        } else {
            // In landscape, beta contributes more to horizontal rotation
            effectiveAngularVelocity = rotationRateBeta;
        }

        // Convert from degrees/s to radians/s and integrate
        const headingChange = (effectiveAngularVelocity * Math.PI / 180) * dt;

        // Update heading (in radians)
        this.currentHeading = (this.currentHeading + headingChange) % (2 * Math.PI);
        if (this.currentHeading < 0) this.currentHeading += 2 * Math.PI;

        // Store timestamp for next calculation
        this.lastTimestamp = timestamp;

        // Log heading changes for debugging
        console.log('Heading updated:', this._toDegrees(this.currentHeading).toFixed(1) + '°',
            'from gyro input:', effectiveAngularVelocity.toFixed(2));

        return this.currentHeading;
    }

    _toDegrees(radians) {
        return radians * 180 / Math.PI;
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
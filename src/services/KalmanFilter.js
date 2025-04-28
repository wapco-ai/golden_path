// src/services/KalmanFilter.js  
/**  
 * فیلتر کالمن توسعه‌یافته (Extended Kalman Filter) برای ترکیب داده‌های سنسور  
 *   
 * مدل وضعیت:  
 * x = [x, y, θ, v, ω, stride]  
 *   
 * - x, y: موقعیت نسبی در صفحه افقی (متر)  
 * - θ: جهت (رادیان)  
 * - v: سرعت خطی (متر بر ثانیه)  
 * - ω: سرعت زاویه‌ای (رادیان بر ثانیه)  
 * - stride: طول گام (متر)  
 *   
 * مدل اندازه‌گیری:  
 * z = [x_gps, y_gps, heading]  
 *   
 * مدل کنترل:  
 * u = [a_norm, omega]  
 *   
 * - a_norm: نُرم شتاب (برای تشخیص گام)  
 * - omega: سرعت زاویه‌ای از ژیروسکوپ  
 */
export class KalmanFilter {
    /**  
     * @param {Object} options تنظیمات فیلتر کالمن  
     * @param {number} options.stateSize ابعاد بردار وضعیت  
     * @param {number} options.measurementSize ابعاد بردار اندازه‌گیری  
     * @param {number} options.controlSize ابعاد بردار کنترل  
     */
    constructor(options = {}) {
        // ابعاد مدل  
        this.stateSize = options.stateSize || 6;
        this.measurementSize = options.measurementSize || 3;
        this.controlSize = options.controlSize || 2;

        // بردار وضعیت [x, y, θ, v, ω, stride]  
        this.x = new Array(this.stateSize).fill(0);

        // ماتریس کوواریانس وضعیت (ابتدا با مقادیر بزرگ مقداردهی می‌شود)  
        this.P = new Array(this.stateSize * this.stateSize).fill(0);
        for (let i = 0; i < this.stateSize; i++) {
            this.P[i * this.stateSize + i] = i < 3 ? 10.0 : 1.0; // عدم قطعیت اولیه بیشتر برای موقعیت و جهت  
        }

        // ماتریس نویز فرآیند (Q)  
        this.Q = new Array(this.stateSize * this.stateSize).fill(0);
        for (let i = 0; i < this.stateSize; i++) {
            // تنظیم نویز فرآیند برای هر متغیر وضعیت  
            const value = i === 0 || i === 1 ? 0.1 : // موقعیت x, y  
                i === 2 ? 0.02 : // جهت θ  
                    i === 3 ? 0.5 : // سرعت v  
                        i === 4 ? 0.1 : // سرعت زاویه‌ای ω  
                            0.01; // طول گام stride  
            this.Q[i * this.stateSize + i] = value;
        }

        // ماتریس نویز اندازه‌گیری (R)  
        this.R = new Array(this.measurementSize * this.measurementSize).fill(0);
        this.R[0] = 25.0; // نویز x_gps  
        this.R[this.measurementSize + 1] = 25.0; // نویز y_gps  
        this.R[2 * this.measurementSize + 2] = 0.1; // نویز heading  

        // زمان آخرین به‌روزرسانی  
        this.lastUpdateTime = 0;

        // ثابت‌های مدل  
        this.timeDecay = 0.95; // ضریب میرایی زمانی برای سرعت و سرعت زاویه‌ای  
    }

    /**  
     * مقداردهی اولیه فیلتر کالمن  
     * @param {Object} initialState وضعیت اولیه  
     */
    initialize(initialState) {
        // مقداردهی بردار وضعیت  
        this.x[0] = initialState.x !== undefined ? initialState.x : 0; // x  
        this.x[1] = initialState.y !== undefined ? initialState.y : 0; // y  
        this.x[2] = initialState.theta !== undefined ? initialState.theta : 0; // θ  
        this.x[3] = initialState.v !== undefined ? initialState.v : 0; // v  
        this.x[4] = initialState.w !== undefined ? initialState.w : 0; // ω  
        this.x[5] = initialState.stride !== undefined ? initialState.stride : 0.75; // stride  

        // به‌روزرسانی زمان  
        this.lastUpdateTime = initialState.timestamp || Date.now();

        // می‌توانید ماتریس کوواریانس را نیز مقداردهی کنید اگر نیاز دارید  
        if (initialState.covariance) {
            this.P = [...initialState.covariance];
        }
    }

    /**  
     * تنظیم طول گام  
     * @param {number} strideLength طول گام جدید (متر)  
     */
    setStrideLength(strideLength) {
        if (strideLength > 0) {
            this.x[5] = strideLength;
        }
    }

    /**  
     * مرحله پیش‌بینی فیلتر کالمن  
     * @param {Object} u بردار کنترل [a_norm, omega]  
     * @param {number} timestamp زمان فعلی  
     */
    predict(u = { a_norm: 0, omega: 0 }, timestamp = Date.now()) {
        // محاسبه فاصله زمانی  
        const dt = (timestamp - this.lastUpdateTime) / 1000; // تبدیل به ثانیه  

        // اگر dt منفی یا خیلی بزرگ است، فقط زمان را به‌روز کنید  
        if (dt <= 0 || dt > 1.0) {
            this.lastUpdateTime = timestamp;
            return;
        }

        // استخراج وضعیت فعلی  
        const [x, y, theta, v, omega, stride] = this.x;

        // پیش‌بینی وضعیت جدید با مدل ریاضی سیستم  

        // 1. به‌روزرسانی سرعت‌های زاویه‌ای با ورودی ژیروسکوپ و میرایی  
        const newOmega = u.omega !== undefined ? u.omega : omega * this.timeDecay;

        // 2. به‌روزرسانی جهت با استفاده از سرعت زاویه‌ای  
        const newTheta = (theta + newOmega * dt) % (2 * Math.PI);

        // 3. به‌روزرسانی سرعت خطی  
        // اگر گام تشخیص داده شده است (a_norm > 0)، سرعت را به‌روز کنید  
        const stepDetected = u.a_norm > 0;
        const newV = stepDetected ? stride / 0.5 : v * this.timeDecay; // فرض می‌کنیم هر گام حدود 0.5 ثانیه طول می‌کشد  

        // 4. به‌روزرسانی موقعیت با استفاده از سرعت و جهت  
        const dx = newV * dt * Math.sin(newTheta); // تغییر در x (شرق-غرب)  
        const dy = newV * dt * Math.cos(newTheta); // تغییر در y (شمال-جنوب)  
        const newX = x + dx;
        const newY = y + dy;

        // 5. به‌روزرسانی طول گام (بدون تغییر در این مدل ساده)  
        const newStride = stride;

        // به‌روزرسانی بردار وضعیت  
        this.x[0] = newX;
        this.x[1] = newY;
        this.x[2] = newTheta;
        this.x[3] = newV;
        this.x[4] = newOmega;
        this.x[5] = newStride;

        // محاسبه ماتریس ژاکوبین برای مدل غیرخطی (مشتق جزئی از هر متغیر وضعیت نسبت به همه متغیرهای وضعیت)  
        const F = new Array(this.stateSize * this.stateSize).fill(0);

        // ماتریس هویت با اضافه کردن مشتقات غیرصفر  
        for (let i = 0; i < this.stateSize; i++) {
            F[i * this.stateSize + i] = 1.0; // عناصر قطری = 1  
        }

        // مشتقات غیرقطری  
        F[0 * this.stateSize + 2] = newV * dt * Math.cos(newTheta); // ∂x/∂θ  
        F[0 * this.stateSize + 3] = dt * Math.sin(newTheta); // ∂x/∂v  
        F[1 * this.stateSize + 2] = -newV * dt * Math.sin(newTheta); // ∂y/∂θ  
        F[1 * this.stateSize + 3] = dt * Math.cos(newTheta); // ∂y/∂v  
        F[3 * this.stateSize + 5] = stepDetected ? 1.0 / 0.5 : 0; // ∂v/∂stride (اگر گام تشخیص داده شده باشد)  

        // به‌روزرسانی ماتریس کوواریانس: P = F·P·F^T + Q  
        const FP = this._multiplyMatrices(F, this.P, this.stateSize);
        const newP = this._multiplyMatrices(FP, this._transposeMatrix(F, this.stateSize), this.stateSize);

        // افزودن ماتریس نویز فرآیند  
        for (let i = 0; i < this.stateSize; i++) {
            for (let j = 0; j < this.stateSize; j++) {
                const idx = i * this.stateSize + j;
                newP[idx] += this.Q[idx];
            }
        }

        this.P = newP;
        this.lastUpdateTime = timestamp;
    }

    /**  
     * مرحله به‌روزرسانی (اصلاح) فیلتر کالمن با داده‌های اندازه‌گیری  
     * @param {Object} z بردار اندازه‌گیری [x_gps, y_gps, heading]  
     * @param {Object} uncertainties عدم قطعیت‌های اندازه‌گیری  
     */
    update(z, uncertainties = {}) {
        // بررسی کنید که آیا اندازه‌گیری‌های معتبر وجود دارند  
        const hasPosition = z.x_gps !== undefined && z.y_gps !== undefined;
        const hasHeading = z.heading !== undefined;

        // اگر هیچ اندازه‌گیری معتبری وجود ندارد، خارج شوید  
        if (!hasPosition && !hasHeading) {
            return;
        }

        // تنظیم ماتریس نویز اندازه‌گیری بر اساس عدم قطعیت‌های ارائه شده  
        if (hasPosition && uncertainties.gps_accuracy !== undefined) {
            const gpsVariance = Math.pow(uncertainties.gps_accuracy, 2);
            this.R[0] = gpsVariance;
            this.R[this.measurementSize + 1] = gpsVariance;
        }

        if (hasHeading && uncertainties.heading_accuracy !== undefined) {
            this.R[2 * this.measurementSize + 2] = Math.pow(uncertainties.heading_accuracy, 2);
        }

        // ماتریس H (ماتریس اندازه‌گیری) - ارتباط بین وضعیت و اندازه‌گیری‌ها  
        // در این مورد ساده، فقط مؤلفه‌های مستقیم را اندازه‌گیری می‌کنیم  
        const H = new Array(this.measurementSize * this.stateSize).fill(0);

        // ماتریس اندازه‌گیری را فقط برای اندازه‌گیری‌های موجود تنظیم کنید  
        if (hasPosition) {
            H[0 * this.stateSize + 0] = 1.0; // x_gps = x  
            H[1 * this.stateSize + 1] = 1.0; // y_gps = y  
        }

        if (hasHeading) {
            H[2 * this.stateSize + 2] = 1.0; // heading = θ  
        }

        // بردار اندازه‌گیری را با مقادیر موجود ایجاد کنید  
        const measurement = new Array(this.measurementSize).fill(0);
        if (hasPosition) {
            measurement[0] = z.x_gps;
            measurement[1] = z.y_gps;
        }
        if (hasHeading) {
            measurement[2] = z.heading;
        }

        // پیش‌بینی اندازه‌گیری: z_pred = H·x  
        const z_pred = this._multiplyMatrixVector(H, this.x, this.measurementSize, this.stateSize);

        // محاسبه خطای بین اندازه‌گیری واقعی و پیش‌بینی شده  
        const y = new Array(this.measurementSize).fill(0);
        for (let i = 0; i < this.measurementSize; i++) {
            if ((i < 2 && hasPosition) || (i === 2 && hasHeading)) {
                y[i] = measurement[i] - z_pred[i];
            }

            // اصلاح خطای جهت (برای زاویه‌ها)  
            if (i === 2 && hasHeading) {
                // نرمال‌سازی خطا بین -π تا π  
                while (y[i] > Math.PI) y[i] -= 2 * Math.PI;
                while (y[i] < -Math.PI) y[i] += 2 * Math.PI;
            }
        }

        // محاسبه ماتریس کوواریانس خطای اندازه‌گیری: S = H·P·H^T + R  
        const HP = this._multiplyMatrices(H, this.P, this.measurementSize, this.stateSize, this.stateSize);
        const S = this._multiplyMatrices(HP, this._transposeMatrix(H, this.stateSize, this.measurementSize), this.measurementSize);

        // افزودن نویز اندازه‌گیری  
        for (let i = 0; i < this.measurementSize; i++) {
            for (let j = 0; j < this.measurementSize; j++) {
                const idx = i * this.measurementSize + j;
                S[idx] += this.R[idx];
            }
        }

        // محاسبه بهره کالمن: K = P·H^T·S^(-1)  
        const PHt = this._multiplyMatrices(this.P, this._transposeMatrix(H, this.stateSize, this.measurementSize), this.stateSize, this.stateSize, this.measurementSize);
        const S_inv = this._invertMatrix(S, this.measurementSize);
        const K = this._multiplyMatrices(PHt, S_inv, this.stateSize, this.measurementSize, this.measurementSize);

        // به‌روزرسانی بردار وضعیت: x = x + K·y  
        const Ky = this._multiplyMatrixVector(K, y, this.stateSize, this.measurementSize);
        for (let i = 0; i < this.stateSize; i++) {
            this.x[i] += Ky[i];
        }

        // نرمال‌سازی جهت (بین 0 تا 2π)  
        this.x[2] = ((this.x[2] % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);

        // به‌روزرسانی ماتریس کوواریانس: P = (I - K·H)·P  
        const I_KH = this._subtractMatrices(
            this._identityMatrix(this.stateSize),
            this._multiplyMatrices(K, H, this.stateSize, this.measurementSize, this.stateSize),
            this.stateSize
        );
        this.P = this._multiplyMatrices(I_KH, this.P, this.stateSize);
    }

    /**  
     * دریافت وضعیت فعلی فیلتر کالمن  
     * @returns {Object} وضعیت فعلی {x, y, theta, v, w, stride}  
     */
    getState() {
        return {
            x: this.x[0],
            y: this.x[1],
            theta: this.x[2],
            v: this.x[3],
            w: this.x[4],
            stride: this.x[5],
            covariance: [...this.P],
            timestamp: this.lastUpdateTime
        };
    }

    /**  
     * ضرب دو ماتریس  
     * @param {Array} A ماتریس اول  
     * @param {Array} B ماتریس دوم  
     * @param {number} rows_A تعداد سطرهای A  
     * @param {number} cols_A تعداد ستون‌های A (و سطرهای B)  
     * @param {number} cols_B تعداد ستون‌های B  
     * @returns {Array} ماتریس نتیجه C = A·B  
     */
    _multiplyMatrices(A, B, rows_A, cols_A, cols_B) {
        // اگر ابعاد مشخص نشده‌اند، مقادیر پیش‌فرض را استفاده کنید  
        rows_A = rows_A || this.stateSize;
        cols_A = cols_A || this.stateSize;
        cols_B = cols_B || this.stateSize;

        const C = new Array(rows_A * cols_B).fill(0);

        for (let i = 0; i < rows_A; i++) {
            for (let j = 0; j < cols_B; j++) {
                for (let k = 0; k < cols_A; k++) {
                    C[i * cols_B + j] += A[i * cols_A + k] * B[k * cols_B + j];
                }
            }
        }

        return C;
    }

    /**  
     * ضرب ماتریس در بردار  
     * @param {Array} A ماتریس  
     * @param {Array} v بردار  
     * @param {number} rows تعداد سطرهای A  
     * @param {number} cols تعداد ستون‌های A (و طول v)  
     * @returns {Array} بردار نتیجه Av  
     */
    _multiplyMatrixVector(A, v, rows, cols) {
        // اگر ابعاد مشخص نشده‌اند، مقادیر پیش‌فرض را استفاده کنید  
        rows = rows || this.stateSize;
        cols = cols || this.stateSize;

        const result = new Array(rows).fill(0);

        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                result[i] += A[i * cols + j] * v[j];
            }
        }

        return result;
    }

    /**  
     * محاسبه ترانهاده ماتریس  
     * @param {Array} A ماتریس ورودی  
     * @param {number} rows تعداد سطرهای A  
     * @param {number} cols تعداد ستون‌های A  
     * @returns {Array} ترانهاده A  
     */
    _transposeMatrix(A, rows, cols) {
        // اگر ابعاد مشخص نشده‌اند، مقادیر پیش‌فرض را استفاده کنید  
        rows = rows || this.stateSize;
        cols = cols || this.stateSize;

        const AT = new Array(cols * rows).fill(0);

        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                AT[j * rows + i] = A[i * cols + j];
            }
        }

        return AT;
    }

    /**  
     * ایجاد ماتریس همانی  
     * @param {number} size ابعاد ماتریس  
     * @returns {Array} ماتریس همانی  
     */
    _identityMatrix(size) {
        const I = new Array(size * size).fill(0);

        for (let i = 0; i < size; i++) {
            I[i * size + i] = 1;
        }

        return I;
    }

    /**  
     * تفریق دو ماتریس  
     * @param {Array} A ماتریس اول  
     * @param {Array} B ماتریس دوم  
     * @param {number} size ابعاد ماتریس‌ها  
     * @returns {Array} ماتریس نتیجه A - B  
     */
    _subtractMatrices(A, B, size) {
        const C = new Array(size * size).fill(0);

        for (let i = 0; i < size * size; i++) {
            C[i] = A[i] - B[i];
        }

        return C;
    }

    /**  
     * وارون ماتریس (فقط برای ماتریس‌های 3x3 یا کوچکتر)  
     * @param {Array} A ماتریس ورودی  
     * @param {number} size ابعاد ماتریس  
     * @returns {Array} وارون ماتریس A  
     */
    _invertMatrix(A, size) {
        if (size === 1) {
            // وارون ماتریس 1x1  
            return [1 / A[0]];
        } else if (size === 2) {
            // وارون ماتریس 2x2  
            const det = A[0] * A[3] - A[1] * A[2];

            if (Math.abs(det) < 1e-10) {
                // ماتریس وارون‌پذیر نیست، یک ماتریس با مقادیر کوچک برگردان  
                return [1e-6, 0, 0, 1e-6];
            }

            const invDet = 1 / det;
            return [
                A[3] * invDet, -A[1] * invDet,
                -A[2] * invDet, A[0] * invDet
            ];
        } else if (size === 3) {
            // وارون ماتریس 3x3  
            const a = A[0], b = A[1], c = A[2];
            const d = A[3], e = A[4], f = A[5];
            const g = A[6], h = A[7], i = A[8];

            const det = a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);

            if (Math.abs(det) < 1e-10) {
                // ماتریس وارون‌پذیر نیست، ماتریس با مقادیر کوچک برگردان  
                return [
                    1e-6, 0, 0,
                    0, 1e-6, 0,
                    0, 0, 1e-6
                ];
            }

            const invDet = 1 / det;

            return [
                (e * i - f * h) * invDet, (c * h - b * i) * invDet, (b * f - c * e) * invDet,
                (f * g - d * i) * invDet, (a * i - c * g) * invDet, (c * d - a * f) * invDet,
                (d * h - e * g) * invDet, (b * g - a * h) * invDet, (a * e - b * d) * invDet
            ];
        } else {
            // برای ماتریس‌های بزرگتر از یک روش دیگری استفاده کنید  
            // یا خطا برگردانید  
            console.error('Matrix inversion not implemented for size > 3');
            return this._identityMatrix(size);
        }
    }
}  
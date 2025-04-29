/**  
 * پیاده‌سازی Extended Kalman Filter برای تخمین موقعیت با ترکیب سنسورها  
 */  
export class KalmanFilter {  
    constructor(options = {}) {  
      // تنظیمات ابعاد فیلتر کالمن  
      this.stateSize = options.stateSize || 6;       // [x, y, theta, v, w, stride]  
      this.measurementSize = options.measurementSize || 3; // [x_gps, y_gps, heading]  
      this.controlSize = options.controlSize || 2;   // [a_norm, omega]  
      
      // بردار وضعیت - مقادیر پیش‌فرض  
      this.x = new Array(this.stateSize).fill(0);  
      
      // ماتریس کوواریانس وضعیت - شروع با مقادیر بزرگ در قطر اصلی  
      this.P = new Array(this.stateSize * this.stateSize).fill(0);  
      for (let i = 0; i < this.stateSize; i++) {  
        this.P[i * this.stateSize + i] = i < 2 ? 50.0 : 1.0; // عدم قطعیت بیشتر برای موقعیت اولیه  
      }  
      
      // ماتریس نویز فرآیند (Q) - میزان عدم قطعیت در مدل سیستم  
      this.Q = new Array(this.stateSize * this.stateSize).fill(0);  
      for (let i = 0; i < this.stateSize; i++) {  
        this.Q[i * this.stateSize + i] = 0.01; // مقادیر کوچکتر = اعتماد بیشتر به مدل  
      }  
      // عدم قطعیت بیشتر برای موقعیت و جهت  
      this.Q[0 * this.stateSize + 0] = 0.1;  // x  
      this.Q[1 * this.stateSize + 1] = 0.1;  // y  
      this.Q[2 * this.stateSize + 2] = 0.1;  // theta  
      
      // ماتریس نویز اندازه‌گیری (R) - میزان عدم قطعیت در داده‌های حسگر  
      this.R = new Array(this.measurementSize * this.measurementSize).fill(0);  
      this.R[0 * this.measurementSize + 0] = 5.0;  // x_gps (متر مربع)  
      this.R[1 * this.measurementSize + 1] = 5.0;  // y_gps (متر مربع)  
      this.R[2 * this.measurementSize + 2] = 0.1;  // heading (رادیان مربع)  
      
      // ضریب میرایی برای کاهش سرعت و چرخش در صورت نبود ورودی  
      this.timeDecay = 0.95; // 5% کاهش در هر گام زمانی  
      
      // متغیرهای داخلی  
      this.lastUpdateTime = 0;  
    }  
    
    /**  
     * مقداردهی اولیه فیلتر با وضعیت اولیه  
     * @param {Object} initialState وضعیت اولیه {x, y, theta, v, w, stride, timestamp}  
     */  
    initialize(initialState) {  
      // محافظت در برابر مقادیر نامعتبر  
      initialState = initialState || {};  
      
      // تنظیم وضعیت اولیه  
      this.x[0] = this._validateNumber(initialState.x, 0);  
      this.x[1] = this._validateNumber(initialState.y, 0);  
      this.x[2] = this._validateNumber(initialState.theta, 0);  
      this.x[3] = this._validateNumber(initialState.v, 0);  
      this.x[4] = this._validateNumber(initialState.w, 0);  
      this.x[5] = this._validateNumber(initialState.stride, 0.75);  
      
      // تنظیم زمان آخرین به‌روزرسانی  
      this.lastUpdateTime = initialState.timestamp || Date.now();  
      
      // بازنشانی ماتریس P (عدم قطعیت اولیه)  
      this.P = new Array(this.stateSize * this.stateSize).fill(0);  
      for (let i = 0; i < this.stateSize; i++) {  
        this.P[i * this.stateSize + i] = i < 2 ? 50.0 : 1.0;  
      }  
      
      console.log("Kalman filter initialized:", this.getState());  
    }  
    
    /**  
     * تنظیم طول گام (استراید)  
     * @param {number} strideLength طول گام (متر)  
     */  
    setStrideLength(strideLength) {  
      if (strideLength > 0) {  
        this.x[5] = strideLength;  
      }  
    }  
    
    /**  
     * مرحله پیش‌بینی فیلتر کالمن با استفاده از مدل سیستم  
     * @param {Object} u بردار ورودی کنترل {a_norm, omega}  
     * @param {number} timestamp زمان فعلی (میلی‌ثانیه)  
     */  
    predict(u = {}, timestamp = Date.now()) {  
      // محاسبه گام زمانی (به ثانیه)  
      const dt = Math.min(Math.max(0, (timestamp - this.lastUpdateTime) / 1000.0), 0.2);  
      
      // اگر گام زمانی خیلی کوچک است، از پیش‌بینی صرف‌نظر کنید یا زمان کوچکتر از 0.01 ثانیه است، فقط زمان را به‌روز کنید  
      if (dt < 0.01) {  
        this.lastUpdateTime = timestamp;  
        return;  
      }  
      
      // اگر ورودی کنترل وجود ندارد، با مقادیر پیش‌فرض کار کنید  
      const a_norm = u.a_norm || 0;  // تشخیص گام (0 یا 1)  
      const omega = u.omega || 0;    // سرعت زاویه‌ای (رادیان بر ثانیه)  
      
      // قابلیت ردیابی: اطمینان از عدم وجود مقادیر NaN  
      if (isNaN(a_norm) || isNaN(omega)) {  
        console.warn('مقادیر نامعتبر در ورودی کنترل فیلتر کالمن:', u);  
        this.lastUpdateTime = timestamp;  
        return;  
      }  
      
      // اعمال ضریب میرایی اگر ورودی شتاب وجود ندارد  
      // موقعیت v = سرعت خطی  
      let velocity = this.x[3];  
      if (a_norm <= 0) {  
        velocity *= this.timeDecay; // کاهش سرعت اگر گامی تشخیص داده نشده  
      } else {  
        // تشخیص گام - محاسبه سرعت با استفاده از طول گام  
        const strideLength = this.x[5];  
        velocity = strideLength / 0.5; // فرض: طول گام در 0.5 ثانیه پیموده می‌شود  
      }  
      
      // سرعت زاویه‌ای w  
      let angularVelocity = omega;  
      if (Math.abs(omega) < 0.001) {  
        // اگر ورودی چرخش نزدیک به صفر است، از مقدار فعلی با میرایی استفاده کنید  
        angularVelocity = this.x[4] * this.timeDecay;  
      }  
      
      // به‌روزرسانی بردار وضعیت (x) با استفاده از مدل حرکت غیرهولونومیک  
      // x_k+1 = x_k + v * dt * cos(theta)  
      // y_k+1 = y_k + v * dt * sin(theta)  
      // theta_k+1 = theta_k + w * dt  
      // v_k+1 = v (یا با میرایی)  
      // w_k+1 = w (یا با میرایی)  
      const theta = this._normalizeDegree(this.x[2]);  
      
      // به‌روزرسانی موقعیت  
      this.x[0] += velocity * dt * Math.cos(theta);  // x  
      this.x[1] += velocity * dt * Math.sin(theta);  // y  
      this.x[2] = this._normalizeDegree(theta + angularVelocity * dt);  // theta  
      this.x[3] = velocity;  // v  
      this.x[4] = angularVelocity;  // w  
      
      // به‌روزرسانی ماتریس P با استفاده از ژاکوبین تقریبی مدل سیستم  
      // برای سادگی، فقط Q را به P اضافه می‌کنیم  
      // P = F*P*F' + Q (در اینجا ساده‌سازی شده است)  
      for (let i = 0; i < this.stateSize; i++) {  
        for (let j = 0; j < this.stateSize; j++) {  
          this.P[i * this.stateSize + j] += this.Q[i * this.stateSize + j] * dt;  
        }  
      }  
      
      // یک افزایش کوچک در عدم قطعیت موقعیت و جهت با گذشت زمان  
      this.P[0 * this.stateSize + 0] += dt * velocity * 0.1; // افزایش عدم قطعیت در x  
      this.P[1 * this.stateSize + 1] += dt * velocity * 0.1; // افزایش عدم قطعیت در y  
      this.P[2 * this.stateSize + 2] += dt * Math.abs(angularVelocity) * 0.1; // افزایش عدم قطعیت در theta  
      
      // به‌روزرسانی زمان آخرین پیش‌بینی  
      this.lastUpdateTime = timestamp;  
    }  
    
    /**  
     * مرحله به‌روزرسانی فیلتر کالمن با استفاده از اندازه‌گیری‌ها  
     * @param {Object} z بردار اندازه‌گیری {x_gps, y_gps, heading}  
     * @param {Object} uncertainties عدم قطعیت‌های اندازه‌گیری {gps_accuracy, heading_accuracy}  
     */  
    update(z = {}, uncertainties = {}) {  
      // اگر هیچ داده اندازه‌گیری وجود ندارد، کاری انجام ندهید  
      if (Object.keys(z).length === 0) {  
        return;  
      }  
      
      // اطمینان از معتبر بودن مقادیر اندازه‌گیری  
      if ((z.x_gps !== undefined && isNaN(z.x_gps)) ||   
          (z.y_gps !== undefined && isNaN(z.y_gps)) ||   
          (z.heading !== undefined && isNaN(z.heading))) {  
        console.warn('مقادیر نامعتبر در اندازه‌گیری:', z);  
        return;  
      }  
      
      // تنظیم ماتریس نویز اندازه‌گیری (R) بر اساس دقت GPS  
      if (uncertainties.gps_accuracy !== undefined && !isNaN(uncertainties.gps_accuracy)) {  
        // مقدار بزرگتر دقت = نویز بیشتر = اعتماد کمتر به GPS  
        const gpsVariance = Math.pow(Math.max(1.0, uncertainties.gps_accuracy), 2);  
        this.R[0 * this.measurementSize + 0] = gpsVariance;  
        this.R[1 * this.measurementSize + 1] = gpsVariance;  
      }  
      
      if (uncertainties.heading_accuracy !== undefined && !isNaN(uncertainties.heading_accuracy)) {  
        this.R[2 * this.measurementSize + 2] = uncertainties.heading_accuracy;  
      }  
      
      // ساخت بردار اندازه‌گیری و ماتریس H (ژاکوبین اندازه‌گیری)  
      const measurement = [0, 0, 0]; // مقادیر پیش‌فرض  
      const H = new Array(this.measurementSize * this.stateSize).fill(0);  
      
      // بردار نوآوری (تفاوت بین اندازه‌گیری و پیش‌بینی)  
      const innovation = new Array(this.measurementSize).fill(0);  
      
      // بررسی موقعیت GPS  
      if (z.x_gps !== undefined && z.y_gps !== undefined) {  
        measurement[0] = z.x_gps;  
        measurement[1] = z.y_gps;  
        
        // ماتریس H برای GPS (ارتباط مستقیم با x و y)  
        H[0 * this.stateSize + 0] = 1; // H[0,0] = 1 (مشاهده x)  
        H[1 * this.stateSize + 1] = 1; // H[1,1] = 1 (مشاهده y)  
        
        // محاسبه نوآوری  
        innovation[0] = z.x_gps - this.x[0];  
        innovation[1] = z.y_gps - this.x[1];  
      }  
      
    // بررسی جهت (مگنتومتر/قطب‌نما)  
    if (z.heading !== undefined) {  
        measurement[2] = this._normalizeDegree(z.heading);  
        
        // ماتریس H برای جهت (ارتباط مستقیم با theta)  
        H[2 * this.stateSize + 2] = 1; // H[2,2] = 1 (مشاهده theta)  
        
        // محاسبه نوآوری با توجه به طبیعت دایره‌ای زاویه  
        let headingDiff = z.heading - this.x[2];  
        // نرمال‌سازی تفاوت به محدوده [-pi, pi]  
        while (headingDiff > Math.PI) headingDiff -= 2 * Math.PI;  
        while (headingDiff < -Math.PI) headingDiff += 2 * Math.PI;  
        innovation[2] = headingDiff;  
      }  
      
      // محاسبه S = H*P*H' + R (ماتریس کوواریانس نوآوری)  
      const S = new Array(this.measurementSize * this.measurementSize).fill(0);  
      for (let i = 0; i < this.measurementSize; i++) {  
        for (let j = 0; j < this.measurementSize; j++) {  
          // مقدار اولیه از R  
          S[i * this.measurementSize + j] = this.R[i * this.measurementSize + j];  
          
          // اضافه کردن H*P*H'  
          for (let k = 0; k < this.stateSize; k++) {  
            for (let l = 0; l < this.stateSize; l++) {  
              S[i * this.measurementSize + j] += H[i * this.stateSize + k] *   
                                              this.P[k * this.stateSize + l] *   
                                              H[j * this.stateSize + l];  
            }  
          }  
        }  
      }  
      
      // محاسبه K = P*H'*S^(-1) (بهره کالمن)  
      // برای سادگی، محاسبه S^(-1) را به صورت عناصر قطری انجام می‌دهیم  
      const K = new Array(this.stateSize * this.measurementSize).fill(0);  
      for (let i = 0; i < this.stateSize; i++) {  
        for (let j = 0; j < this.measurementSize; j++) {  
          for (let k = 0; k < this.stateSize; k++) {  
            // در این ساده‌سازی، فقط عناصر قطری S را در نظر می‌گیریم  
            if (S[j * this.measurementSize + j] > 0.0001) {  
              K[i * this.measurementSize + j] += this.P[i * this.stateSize + k] *   
                                              H[j * this.stateSize + k] /   
                                              S[j * this.measurementSize + j];  
            }  
          }  
        }  
      }  
      
      // به‌روزرسانی بردار وضعیت: x = x + K*innovation  
      for (let i = 0; i < this.stateSize; i++) {  
        for (let j = 0; j < this.measurementSize; j++) {  
          this.x[i] += K[i * this.measurementSize + j] * innovation[j];  
        }  
      }  
      
      // نرمال‌سازی زاویه theta به محدوده [0, 2*pi]  
      this.x[2] = this._normalizeDegree(this.x[2]);  
      
      // به‌روزرسانی ماتریس کوواریانس: P = (I - K*H)*P  
      const newP = new Array(this.stateSize * this.stateSize).fill(0);  
      for (let i = 0; i < this.stateSize; i++) {  
        for (let j = 0; j < this.stateSize; j++) {  
          // ابتدا I (ماتریس همانی)  
          newP[i * this.stateSize + j] = (i === j) ? 1 : 0;  
          
          // سپس کم کردن K*H  
          for (let k = 0; k < this.measurementSize; k++) {  
            newP[i * this.stateSize + j] -= K[i * this.measurementSize + k] *   
                                         H[k * this.stateSize + j];  
          }  
        }  
      }  
      
      // P = newP * P  
      const tempP = [...this.P];  
      for (let i = 0; i < this.stateSize; i++) {  
        for (let j = 0; j < this.stateSize; j++) {  
          this.P[i * this.stateSize + j] = 0;  
          for (let k = 0; k < this.stateSize; k++) {  
            this.P[i * this.stateSize + j] += newP[i * this.stateSize + k] *   
                                           tempP[k * this.stateSize + j];  
          }  
        }  
      }  
    }  
    
    /**  
     * دریافت وضعیت فعلی فیلتر کالمن  
     * @returns {Object} وضعیت فعلی {x, y, theta, v, w, stride, timestamp}  
     */  
    getState() {  
      // اطمینان از معتبر بودن همه مقادیر  
      return {  
        x: this._validateNumber(this.x[0], 0),  
        y: this._validateNumber(this.x[1], 0),  
        theta: this._validateNumber(this.x[2], 0),  
        v: this._validateNumber(this.x[3], 0),  
        w: this._validateNumber(this.x[4], 0),  
        stride: this._validateNumber(this.x[5], 0.75),  
        timestamp: this.lastUpdateTime  
      };  
    }  
    
    /**  
     * نرمال‌سازی زاویه به محدوده [0, 2*pi]  
     * @param {number} angle زاویه (رادیان)  
     * @returns {number} زاویه نرمال‌شده  
     */  
    _normalizeDegree(angle) {  
      if (isNaN(angle)) return 0;  
      
      // نرمال‌سازی به محدوده [0, 2*pi]  
      while (angle < 0) angle += 2 * Math.PI;  
      while (angle >= 2 * Math.PI) angle -= 2 * Math.PI;  
      
      return angle;  
    }  
    
    /**  
     * تضمین یک مقدار عددی معتبر  
     * @param {number} value مقدار ورودی  
     * @param {number} defaultValue مقدار پیش‌فرض در صورت نامعتبر بودن  
     * @returns {number} مقدار معتبر  
     */  
    _validateNumber(value, defaultValue = 0) {  
      return (value !== undefined && !isNaN(value)) ? value : defaultValue;  
    }  
  }  
  
  export default KalmanFilter;  
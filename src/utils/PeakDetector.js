// src/services/utils/PeakDetector.js  
/**  
 * کلاس تشخیص پیک برای تشخیص قله‌ها در سیگنال  
 * مفید برای تشخیص گام و حرکات تکراری  
 */  
export class PeakDetector {  
    /**  
     * @param {Object} options تنظیمات  
     * @param {number} options.threshold آستانه تشخیص پیک  
     * @param {number} options.minPeakDistance حداقل فاصله زمانی بین پیک‌ها (میلی‌ثانیه)  
     * @param {number} options.windowSize تعداد نمونه‌هایی که برای تشخیص پیک بررسی می‌شوند  
     */  
    constructor(options = {}) {  
      this.threshold = options.threshold || 0.7;  
      this.minPeakDistance = options.minPeakDistance || 200;  
      this.windowSize = options.windowSize || 10;  
      
      this.samples = [];  
      this.lastPeakTime = 0;  
    }  
    
    /**  
     * افزودن یک نمونه جدید و بررسی تشخیص پیک  
     * @param {number} value مقدار نمونه  
     * @param {number} timestamp زمان نمونه (میلی‌ثانیه)  
     * @returns {boolean} آیا پیک تشخیص داده شده است  
     */  
    addSample(value, timestamp) {  
      // افزودن نمونه جدید  
      this.samples.push({ value, timestamp });  
      
      // حفظ فقط چند نمونه آخر  
      if (this.samples.length > this.windowSize * 2) {  
        this.samples.shift();  
      }  
      
      // نیاز به حداقل چند نمونه برای تشخیص پیک  
      if (this.samples.length < this.windowSize) {  
        return false;  
      }  
      
      // بررسی فاصله زمانی از آخرین پیک  
      if (timestamp - this.lastPeakTime < this.minPeakDistance) {  
        return false;  
      }  
      
      // بررسی اینکه آیا نمونه‌های میانی بزرگتر از آستانه هستند و پیک محسوب می‌شوند  
      const midIndex = Math.floor(this.samples.length / 2);  
      const midSample = this.samples[midIndex];  
      
      // شرایط تشخیص پیک:  
      // 1. مقدار باید بزرگتر از آستانه باشد  
      if (midSample.value < this.threshold) {  
        return false;  
      }  
      
      // 2. مقدار باید بزرگتر از همه نمونه‌های قبلی باشد  
      for (let i = 0; i < midIndex; i++) {  
        if (this.samples[i].value >= midSample.value) {  
          return false;  
        }  
      }  
      
      // 3. مقدار باید بزرگتر از همه نمونه‌های بعدی باشد  
      for (let i = midIndex + 1; i < this.samples.length; i++) {  
        if (this.samples[i].value >= midSample.value) {  
          return false;  
        }  
      }  
      
      // پیک تشخیص داده شد  
      this.lastPeakTime = timestamp;  
      return true;  
    }  
    
    /**  
     * بازنشانی تشخیص‌گر پیک  
     */  
    reset() {  
      this.samples = [];  
      this.lastPeakTime = 0;  
    }  
  }  
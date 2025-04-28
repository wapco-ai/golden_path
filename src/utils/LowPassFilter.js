// src/services/utils/LowPassFilter.js  
/**  
 * فیلتر پایین‌گذر برای حذف نویز فرکانس بالا  
 */  
export class LowPassFilter {  
    /**  
     * @param {number} alpha ضریب فیلتر (0-1). مقادیر کوچکتر فیلترینگ بیشتری اعمال می‌کنند.  
     */  
    constructor(alpha = 0.1) {  
      this.alpha = alpha;  
      this.lastValues = {};  
    }  
    
    /**  
     * فیلتر کردن یک مقدار  
     * @param {number} value مقدار جدید  
     * @param {string} key کلید برای ذخیره مقدار آخر (برای کانال‌های مختلف)  
     * @returns {number} مقدار فیلتر شده  
     */  
    filter(value, key = 'default') {  
      // اگر اولین مقدار است، آن را به عنوان مقدار آخر ذخیره کنید  
      if (this.lastValues[key] === undefined) {  
        this.lastValues[key] = value;  
        return value;  
      }  
      
      // اعمال فیلتر: y[n] = α·x[n] + (1-α)·y[n-1]  
      const filteredValue = this.alpha * value + (1 - this.alpha) * this.lastValues[key];  
      this.lastValues[key] = filteredValue;  
      
      return filteredValue;  
    }  
    
    /**  
     * بازنشانی فیلتر  
     */  
    reset() {  
      this.lastValues = {};  
    }  
  }  
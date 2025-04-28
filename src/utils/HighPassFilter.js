// src/services/utils/HighPassFilter.js  
/**  
 * فیلتر بالاگذر برای حذف تغییرات آهسته (مانند شتاب جاذبه)  
 */  
export class HighPassFilter {  
    /**  
     * @param {number} alpha ضریب فیلتر (0-1). مقادیر بزرگتر فیلترینگ بیشتری اعمال می‌کنند.  
     */  
    constructor(alpha = 0.8) {  
      this.alpha = alpha;  
      this.lastValues = {};  
      this.lastFilteredValues = {};  
    }  
    
    /**  
     * فیلتر کردن یک مقدار  
     * @param {number} value مقدار جدید  
     * @param {string} key کلید برای ذخیره مقادیر آخر (برای کانال‌های مختلف)  
     * @returns {number} مقدار فیلتر شده  
     */  
    filter(value, key = 'default') {  
      // اگر اولین مقدار است، آن را به عنوان مقدار آخر ذخیره کنید  
      if (this.lastValues[key] === undefined) {  
        this.lastValues[key] = value;  
        this.lastFilteredValues[key] = 0;  
        return 0;  
      }  
      
      // اعمال فیلتر بالاگذر: y[n] = α·(y[n-1] + x[n] - x[n-1])  
      const filteredValue = this.alpha * (  
        this.lastFilteredValues[key] + value - this.lastValues[key]  
      );  
      
      // به‌روزرسانی مقادیر آخر  
      this.lastValues[key] = value;  
      this.lastFilteredValues[key] = filteredValue;  
      
      return filteredValue;  
    }  
    
    /**  
     * بازنشانی فیلتر  
     */  
    reset() {  
      this.lastValues = {};  
      this.lastFilteredValues = {};  
    }  
  }  
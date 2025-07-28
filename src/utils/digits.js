export const toPersianDigits = (str) => {
  // Handle null/undefined/empty cases
  if (str == null) return '';
  
  // Convert to string if it isn't already
  const stringValue = String(str);
  
  // Perform the replacement
  return stringValue.replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
};

export const toLocaleDigits = (value, language) => {

  if (value == null) return '';
  
  const str = String(value);
  
  return language === 'en' ? str : toPersianDigits(str);
};
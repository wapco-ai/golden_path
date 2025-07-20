export const toPersianDigits = (str) => str.replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);

export const toLocaleDigits = (value, language) => {
  const str = String(value);
  return language === 'en' ? str : toPersianDigits(str);
};

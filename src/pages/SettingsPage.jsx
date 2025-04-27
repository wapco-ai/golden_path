// src/pages/SettingsPage.jsx  
import React, { useState, useEffect } from 'react';  
import { Link } from 'react-router-dom';  
import { LogStorageService } from '../services/LogStorageService';  
import './SettingsPage.css';  

const SettingsPage = () => {  
  const [logCounts, setLogCounts] = useState({ gpsLogs: 0, trackLogs: 0 });  
  const [storageSize, setStorageSize] = useState({ gpsLogsSize: 0, trackLogsSize: 0, totalSize: 0 });  
  const [isLoading, setIsLoading] = useState(true);  
  const [isExporting, setIsExporting] = useState(false);  
  const [message, setMessage] = useState('');  
  
  // دریافت آمار لاگ‌ها  
  useEffect(() => {  
    async function fetchLogStats() {  
      try {  
        setIsLoading(true);  
        const counts = await LogStorageService.getLogCounts();  
        const size = await LogStorageService.estimateStorageSize();  
        
        setLogCounts(counts);  
        setStorageSize(size);  
        setIsLoading(false);  
      } catch (error) {  
        console.error('خطا در دریافت آمار لاگ‌ها:', error);  
        setMessage('خطا در دریافت آمار لاگ‌ها');  
        setIsLoading(false);  
      }  
    }  
    
    fetchLogStats();  
  }, []);  
  
  // تبدیل بایت به نمایش انسانی  
  const formatSize = (bytes) => {  
    if (bytes === 0) return '0 بایت';  
    
    const k = 1024;  
    const sizes = ['بایت', 'کیلوبایت', 'مگابایت', 'گیگابایت'];  
    const i = Math.floor(Math.log(bytes) / Math.log(k));  
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];  
  };  
  
  // خروجی‌گیری لاگ‌های GPS به صورت JSON  
  const exportGPSLogsAsJSON = async () => {  
    try {  
      setIsExporting(true);  
      setMessage('در حال خروجی‌گیری از لاگ‌های GPS...');  
      
      const json = await LogStorageService.exportGPSLogsAsJSON();  
      LogStorageService.downloadFile(json, `gps_logs_${new Date().toISOString()}.json`, 'application/json');  
      
      setMessage('خروجی‌گیری با موفقیت انجام شد');  
      setIsExporting(false);  
    } catch (error) {  
      console.error('خطا در خروجی‌گیری لاگ‌های GPS:', error);  
      setMessage('خطا در خروجی‌گیری لاگ‌های GPS');  
      setIsExporting(false);  
    }  
  };  
  
  // خروجی‌گیری لاگ‌های GPS به صورت CSV  
  const exportGPSLogsAsCSV = async () => {  
    try {  
      setIsExporting(true);  
      setMessage('در حال خروجی‌گیری از لاگ‌های GPS...');  
      
      const csv = await LogStorageService.exportGPSLogsAsCSV();  
      LogStorageService.downloadFile(csv, `gps_logs_${new Date().toISOString()}.csv`, 'text/csv');  
      
      setMessage('خروجی‌گیری با موفقیت انجام شد');  
      setIsExporting(false);  
    } catch (error) {  
      console.error('خطا در خروجی‌گیری لاگ‌های GPS:', error);  
      setMessage('خطا در خروجی‌گیری لاگ‌های GPS');  
      setIsExporting(false);  
    }  
  };  
  
  // خروجی‌گیری مسیرها به صورت GeoJSON  
  const exportTracksAsGeoJSON = async () => {  
    try {  
      setIsExporting(true);  
      setMessage('در حال خروجی‌گیری از مسیرها...');  
      
      const geoJSON = await LogStorageService.exportTrackLogsAsGeoJSON();  
      LogStorageService.downloadFile(geoJSON, `tracks_${new Date().toISOString()}.geojson`, 'application/geo+json');  
      
      setMessage('خروجی‌گیری با موفقیت انجام شد');  
      setIsExporting(false);  
    } catch (error) {  
      console.error('خطا در خروجی‌گیری مسیرها:', error);  
      setMessage('خطا در خروجی‌گیری مسیرها');  
      setIsExporting(false);  
    }  
  };  
  
  // پاک کردن لاگ‌های GPS  
  const clearGPSLogs = async () => {  
    try {  
      if (window.confirm('آیا مطمئن هستید که می‌خواهید همه لاگ‌های GPS را پاک کنید؟ این عمل غیرقابل بازگشت است.')) {  
        setIsLoading(true);  
        setMessage('در حال پاک کردن لاگ‌های GPS...');  
        
        await LogStorageService.clearGPSLogs();  
        
        // به‌روزرسانی آمار  
        const counts = await LogStorageService.getLogCounts();  
        const size = await LogStorageService.estimateStorageSize();  
        
        setLogCounts(counts);  
        setStorageSize(size);  
        setMessage('لاگ‌های GPS با موفقیت پاک شدند');  
        setIsLoading(false);  
      }  
    } catch (error) {  
      console.error('خطا در پاک کردن لاگ‌های GPS:', error);  
      setMessage('خطا در پاک کردن لاگ‌های GPS');  
      setIsLoading(false);  
    }  
  };  
  
  // پاک کردن لاگ‌های مسیر  
  const clearTrackLogs = async () => {  
    try {  
      if (window.confirm('آیا مطمئن هستید که می‌خواهید همه لاگ‌های مسیر را پاک کنید؟ این عمل غیرقابل بازگشت است.')) {  
        setIsLoading(true);  
        setMessage('در حال پاک کردن لاگ‌های مسیر...');  
        
        await LogStorageService.clearTrackLogs();  
        
        // به‌روزرسانی آمار  
        const counts = await LogStorageService.getLogCounts();  
        const size = await LogStorageService.estimateStorageSize();  
        
        setLogCounts(counts);  
        setStorageSize(size);  
        setMessage('لاگ‌های مسیر با موفقیت پاک شدند');  
        setIsLoading(false);  
      }  
    } catch (error) {  
      console.error('خطا در پاک کردن لاگ‌های مسیر:', error);  
      setMessage('خطا در پاک کردن لاگ‌های مسیر');  
      setIsLoading(false);  
    }  
  };  
  
  return (  
    <div className="settings-page">  
      <div className="settings-header">  
        <Link to="/" className="back-button">  
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none">  
            <path d="M19 12H5M12 19l-7-7 7-7"/>  
          </svg>  
          <span>بازگشت</span>  
        </Link>  
        <h1>تنظیمات</h1>  
      </div>  
      
      <div className="settings-content">  
        <section className="setting-section logs-section">  
          <h2>مدیریت لاگ‌ها</h2>  
          
          {isLoading ? (  
            <div className="loading">در حال بارگذاری آمار لاگ‌ها...</div>  
          ) : (  
            <div className="logs-stats">  
              <div className="stat-item">  
                <span>تعداد لاگ‌های GPS:</span>  
                <span className="stat-value">{logCounts.gpsLogs.toLocaleString('fa-IR')}</span>  
              </div>  
              <div className="stat-item">  
                <span>تعداد مسیرهای ذخیره شده:</span>  
                <span className="stat-value">{logCounts.trackLogs.toLocaleString('fa-IR')}</span>  
              </div>  
              <div className="stat-item">  
                <span>حجم تقریبی لاگ‌های GPS:</span>  
                <span className="stat-value">{formatSize(storageSize.gpsLogsSize)}</span>  
              </div>  
              <div className="stat-item">  
                <span>حجم تقریبی مسیرها:</span>  
                <span className="stat-value">{formatSize(storageSize.trackLogsSize)}</span>  
              </div>  
              <div className="stat-item total-size">  
                <span>حجم کل:</span>  
                <span className="stat-value">{formatSize(storageSize.totalSize)}</span>  
              </div>  
            </div>  
          )}  
          
          <div className="export-section">  
            <h3>خروجی‌گیری از لاگ‌ها</h3>  
            <div className="button-group">  
              <button   
                className="export-button"  
                onClick={exportGPSLogsAsJSON}  
                disabled={isExporting || logCounts.gpsLogs === 0}  
              >  
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">  
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"></path>  
                </svg>  
                خروجی JSON لاگ‌های GPS  
              </button>  
              
              <button  
                className="export-button"  
                onClick={exportGPSLogsAsCSV}  
                disabled={isExporting || logCounts.gpsLogs === 0}  
              >  
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">  
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"></path>  
                </svg>  
                خروجی CSV لاگ‌های GPS  
              </button>  
              
              <button  
                className="export-button"  
                onClick={exportTracksAsGeoJSON}  
                disabled={isExporting || logCounts.trackLogs === 0}  
              >  
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">  
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"></path>  
                </svg>  
                خروجی GeoJSON مسیرها  
              </button>  
            </div>  
          </div>  
          
          <div className="clear-section">  
            <h3>پاک کردن لاگ‌ها</h3>  
            <div className="button-group">  
              <button  
                className="clear-button danger"  
                onClick={clearGPSLogs}  
                disabled={isLoading || logCounts.gpsLogs === 0}  
              >  
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">  
                  <polyline points="3 6 5 6 21 6"></polyline>  
                  <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>  
                </svg>  
                پاک کردن لاگ‌های GPS  
              </button>  
              
              <button  
                className="clear-button danger"  
                onClick={clearTrackLogs}  
                disabled={isLoading || logCounts.trackLogs === 0}  
              >  
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">  
                  <polyline points="3 6 5 6 21 6"></polyline>  
                  <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>  
                </svg>  
                پاک کردن مسیرها  
              </button>  
            </div>  
          </div>  
          
          {message && (  
            <div className={`message ${message.includes('خطا') ? 'error' : 'success'}`}>  
              {message}  
            </div>  
          )}  
        </section>  
        
        <section className="setting-section about-section">  
          <h2>درباره برنامه</h2>  
          <p>  
            این برنامه برای ردیابی موقعیت GPS و تشخیص اختلال در سیگنال طراحی شده است.  
            کلیه داده‌ها به صورت محلی در دستگاه شما ذخیره می‌شوند و هیچ اطلاعاتی به سرور ارسال نمی‌شود.  
          </p>  
          <p>  
            نسخه: 1.0.0  
          </p>  
        </section>  
      </div>  
    </div>  
  );  
};  

//export default SettingsPage; 
export { SettingsPage };  
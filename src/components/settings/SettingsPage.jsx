// src/components/settings/SettingsPage.jsx  
import React, { useState, useEffect } from 'react';  
import { Link } from 'react-router-dom';  
import { LogStorageService } from '../../services/LogStorageService';  
import './Settings.css';  

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
  
  // تبدیل ب
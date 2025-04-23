import React, { useState } from 'react';  
import QRScanner from '../components/map/QRScanner';  
import { useGPSStore } from '../store/gpsStore';  
import { useNavigate } from 'react-router-dom';  

const QRScanPage = () => {  
  const [isScanning, setIsScanning] = useState(true);  
  const [scanResult, setScanResult] = useState(null);  
  const [scanError, setScanError] = useState(null);  
  
  const { addQRCodeLocation } = useGPSStore();  
  const navigate = useNavigate();  
  
  const handleScanSuccess = (result) => {  
    setIsScanning(false);  
    setScanResult(result);  
    
    // ذخیره اطلاعات QR code در store  
    addQRCodeLocation(result.qrData, result.location);  
  };  
  
  const handleScanError = (error) => {  
    setScanError(`خطا در اسکن: ${error.message || 'خطای ناشناخته'}`);  
    setIsScanning(false);  
  };  
  
  const startNewScan = () => {  
    setScanError(null);  
    setScanResult(null);  
    setIsScanning(true);  
  };  
  
  const navigateToLocation = () => {  
    // انتقال به صفحه نقشه با موقعیت اسکن شده  
    navigate('/map', { state: { qrLocationId: scanResult?.id } });  
  };  
  
  return (  
    <div className="qr-scan-page">  
      <h2>اسکن QR Code</h2>  
      
      {scanError && (  
        <div className="error-container">  
          <p className="error-message">{scanError}</p>  
          <button onClick={startNewScan}>تلاش مجدد</button>  
        </div>  
      )}  
      
      {isScanning ? (  
        <div className="scanner-container">  
          <p className="scan-instruction">  
            QR Code را مقابل دوربین قرار دهید  
          </p>  
          <QRScanner   
            onSuccess={handleScanSuccess}  
            onError={handleScanError}  
          />  
        </div>  
      ) : scanResult && (  
        <div className="scan-result-container">  
          <h3>QR Code با موفقیت اسکن شد</h3>  
          <div className="result-data">  
            <p className="qr-data">{scanResult.qrData}</p>  
            {scanResult.location && (  
              <div className="location-data">  
                <p>موقعیت اسکن:</p>  
                <p>عرض جغرافیایی: {scanResult.location.coords.lat.toFixed(6)}</p>  
                <p>طول جغرافیایی: {scanResult.location.coords.lng.toFixed(6)}</p>  
              </div>  
            )}  
            <p className="scan-time">  
              زمان اسکن: {new Date(scanResult.timestamp).toLocaleString('fa-IR')}  
            </p>  
          </div>  
          
          <div className="action-buttons">  
            <button onClick={navigateToLocation}>  
              نمایش روی نقشه  
            </button>  
            <button onClick={startNewScan}>  
              اسکن دوباره  
            </button>  
          </div>  
        </div>  
      )}  
    </div>  
  );  
};  

export default QRScanPage;  
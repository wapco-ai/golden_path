import React, { useState } from 'react';  
import { QrScanner } from '@yudiel/react-qr-scanner';  
import { useGPSStore } from '../../store/gpsStore';  
import useGPS from '../../hooks/useGPS';  

const QRScanner = ({ onSuccess, onError }) => {  
  const [isScanning, setIsScanning] = useState(true);  
  const [scanResult, setScanResult] = useState(null);  
  const { currentLocation } = useGPSStore();  
  const { getCurrentPosition } = useGPS({ watchPosition: false });  
  
  const handleScan = async (data) => {  
    if (data && isScanning) {  
      setIsScanning(false);  
      setScanResult(data);  
      
      try {  
        await getCurrentPosition();  
      } catch (err) {  
        console.error('Error getting current position during QR scan', err);  
      }  
      
      if (onSuccess) {  
        onSuccess({   
          qrData: data,   
          location: currentLocation,  
          timestamp: new Date().toISOString()  
        });  
      }  
    }  
  };  
  
  const handleError = (err) => {  
    console.error('QR Scanner Error:', err);  
    if (onError) {  
      onError(err);  
    }  
  };  
  
  const resetScanner = () => {  
    setIsScanning(true);  
    setScanResult(null);  
  };  
  
  return (  
    <div className="qr-scanner">  
      {isScanning ? (  
        <QrScanner  
          onDecode={(result) => handleScan(result)}  
          onError={handleError}  
          constraints={{ facingMode: 'environment' }}  
        />  
      ) : (  
        <div className="scan-result">  
          <h3>QR Code اسکن شد</h3>  
          <p>{scanResult}</p>  
          <button onClick={resetScanner}>اسکن دوباره</button>  
        </div>  
      )}  
    </div>  
  );  
};  

export default QRScanner;  
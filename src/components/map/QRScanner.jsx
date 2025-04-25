import React, { useState, useEffect } from 'react';  
// import { QrReader } from '@yudiel/react-qr-scanner'; // خط قبلی را کامنت کنید  
import * as QrScannerStuff from '@yudiel/react-qr-scanner'; // همه چیز را وارد کنید  
import { useGPSStore } from '../../store/gpsStore';  
import useGPS from '../../hooks/useGPS';  

const QRScanner = ({ onSuccess, onError }) => {  
  useEffect(() => {  
    console.log("QrScannerStuff:", QrScannerStuff); // ببینیم چه چیزهایی داخلش هست  
  }, []);  

  return <div>Testing QR Scanner Import... Check console (F12).</div>;  
};  

export default QRScanner;  
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import { QrScanner } from '@yudiel/react-qr-scanner';
import { useGPSStore } from '../store/gpsStore.js';

const QRScan = () => {
  const [result, setResult] = useState('');
  const navigate = useNavigate();
  const updateCurrentLocation = useGPSStore(state => state.updateCurrentLocation);
  const addQRCodeLocation = useGPSStore(state => state.addQRCodeLocation);

  const handleDecode = (text) => {
    setResult(text);
    try {
      const url = new URL(text);
      const lat = url.searchParams.get('lat');
      const lng = url.searchParams.get('lng');
      const id = url.searchParams.get('id');
      if (lat && lng) {
        sessionStorage.setItem('qrLat', lat);
        sessionStorage.setItem('qrLng', lng);
        if (id) sessionStorage.setItem('qrId', id);
        const loc = { lat: parseFloat(lat), lng: parseFloat(lng) };
        updateCurrentLocation({ coords: loc, timestamp: Date.now() });
        addQRCodeLocation(text, loc);
        navigate('/mpr');
      }
    } catch (e) {
      console.error('invalid qr data', e);
    }
  };

  return (
    <div className="qr-scan-page">
      <h2><FormattedMessage id="qrScan" /></h2>
      <div className="scanner-container">
        <QrScanner
          onDecode={handleDecode}
          onError={(err) => console.error(err?.message)}
        />
      </div>
      {result && (
        <div className="scan-result-container">
          <div className="qr-data">{result}</div>
        </div>
      )}
    </div>
  );
};

export default QRScan;

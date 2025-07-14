import React from 'react';

const ArrowMarker = () => (
  <svg width="80" height="80" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="soft-shadow" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000000" floodOpacity="0.3" />
      </filter>
    </defs>
    <g filter="url(#soft-shadow)">
      <path d="M 50 10 L 90 60 A 10 10 0 0 1 80 70 L 20 70 A 10 10 0 0 1 10 60 Z" fill="#6B7280" />
      <path d="M 50 5 L 90 55 A 10 10 0 0 1 80 65 L 20 65 A 10 10 0 0 1 10 55 Z" fill="#4A90E2" />
      <path d="M 53 30 A 5 5 0 1 1 43 30 A 5 5 0 0 1 53 30 Z M 60 55 L 52 45 L 48 45 L 40 55 L 45 55 L 48 50 L 52 50 L 55 55 Z" fill="white" />
    </g>
  </svg>
);

export default ArrowMarker;

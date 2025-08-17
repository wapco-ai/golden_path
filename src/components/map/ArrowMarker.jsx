import React from 'react';

const ArrowMarker = () => (
  <svg width="80" height="80" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="soft-shadow" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000000" floodOpacity="0.3" />
      </filter>
    </defs>
    <g filter="url(#soft-shadow)">
      <path d="M 50 5 L 90 55 A 10 10 0 0 1 80 70 L 20 70 A 10 10 0 0 1 10 55 Z" fill="#6B7280" />
      <path d="M 50 0 L 90 50 A 10 10 0 0 1 80 65 L 20 65 A 10 10 0 0 1 10 50 Z" fill="#4A90E2" />
    </g>
  </svg>
);

export default ArrowMarker;

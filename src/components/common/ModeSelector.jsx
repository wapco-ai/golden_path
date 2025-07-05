import React from 'react';
import { FormattedMessage } from 'react-intl';
import { useRouteStore } from '../../store/routeStore';
import '../../styles/ModeSelector.css';

const ModeSelector = ({ className = '' }) => {
  const transportMode = useRouteStore(state => state.transportMode);
  const setTransportMode = useRouteStore(state => state.setTransportMode);

  return (
    <div className={`mode-options ${className}`}>
      <button
        className={`transport-btn ${transportMode === 'walking' ? 'active' : ''}`}
        onClick={() => setTransportMode('walking')}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={transportMode === 'walking' ? '#2196F3' : '#666'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M13 4m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
          <path d="M7 21l3 -4" />
          <path d="M16 21l-2 -4l-3 -3l1 -6" />
          <path d="M6 12l2 -3l4 -1l3 3l3 1" />
        </svg>
        <FormattedMessage id="transportWalk" />
      </button>
      <button
        className={`transport-btn ${transportMode === 'electric-car' ? 'active' : ''}`}
        onClick={() => setTransportMode('electric-car')}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={transportMode === 'electric-car' ? '#2196F3' : '#666'}>
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M14 5a1 1 0 0 1 .694 .28l.087 .095l3.699 4.625h.52a3 3 0 0 1 2.995 2.824l.005 .176v4a1 1 0 0 1 -1 1h-1.171a3.001 3.001 0 0 1 -5.658 0h-4.342a3.001 3.001 0 0 1 -5.658 0h-1.171a1 1 0 0 1 -1 -1v-6l.007 -.117l.008 -.056l.017 -.078l.012 -.036l.014 -.05l2.014 -5.034a1 1 0 0 1 .928 -.629zm-7 11a1 1 0 1 0 0 2a1 1 0 0 0 0 -2m10 0a1 1 0 1 0 0 2a1 1 0 0 0 0 -2m-6 -9h-5.324l-1.2 3h6.524zm2.52 0h-.52v3h2.92z" />
        </svg>
        <FormattedMessage id="transportCar" />
      </button>
      <button
        className={`transport-btn ${transportMode === 'wheelchair' ? 'active' : ''}`}
        onClick={() => setTransportMode('wheelchair')}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={transportMode === 'wheelchair' ? '#2196F3' : '#666'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M11 5m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
          <path d="M11 7l0 8l4 0l4 5" />
          <path d="M11 11l5 0" />
          <path d="M7 11.5a5 5 0 1 0 6 7.5" />
        </svg>
        <FormattedMessage id="transportWheelchair" />
      </button>
    </div>
  );
};

export default ModeSelector;

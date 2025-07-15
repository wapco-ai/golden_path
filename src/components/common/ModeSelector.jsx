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
        <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 25 25" fill={transportMode === 'electric-car' ? '#2196F3' : '#1E2023'}>
          <path fillRule="evenodd" clipRule="evenodd"
            d="M12.5 2.5C8.72876 2.5 6.84315 2.5 5.67157 3.67157C4.60848 4.73467 4.51004 6.3857 4.50093 9.5H3.5C2.94772 9.5 2.5 9.94772 2.5 10.5V11.5C2.5 11.8148 2.64819 12.1111 2.9 12.3L4.5 13.5C4.50911 16.6143 4.60848 18.2653 5.67157 19.3284C5.91375 19.5706 6.18645 19.7627 6.5 19.9151V21.4999C6.5 22.0522 6.94772 22.4999 7.5 22.4999H9C9.55228 22.4999 10 22.0522 10 21.4999V20.4815C10.7271 20.5 11.5542 20.5 12.5 20.5C13.4458 20.5 14.2729 20.5 15 20.4815V21.4999C15 22.0522 15.4477 22.4999 16 22.4999H17.5C18.0523 22.4999 18.5 22.0522 18.5 21.4999V19.9151C18.8136 19.7627 19.0862 19.5706 19.3284 19.3284C20.3915 18.2653 20.4909 16.6143 20.5 13.5L22.1 12.3C22.3518 12.1111 22.5 11.8148 22.5 11.5V10.5C22.5 9.94772 22.0523 9.5 21.5 9.5H20.4991C20.49 6.3857 20.3915 4.73467 19.3284 3.67157C18.1569 2.5 16.2712 2.5 12.5 2.5ZM6 10C6 11.4142 6 12.1213 6.43934 12.5607C6.87868 13 7.58579 13 9 13H12.5H16C17.4142 13 18.1213 13 18.5607 12.5607C19 12.1213 19 11.4142 19 10V7.5C19 6.08579 19 5.37868 18.5607 4.93934C18.1213 4.5 17.4142 4.5 16 4.5H12.5H9C7.58579 4.5 6.87868 4.5 6.43934 4.93934C6 5.37868 6 6.08579 6 7.5V10ZM6.75 16.5C6.75 16.0858 7.08579 15.75 7.5 15.75H9C9.41421 15.75 9.75 16.0858 9.75 16.5C9.75 16.9142 9.41421 17.25 9 17.25H7.5C7.08579 17.25 6.75 16.9142 6.75 16.5ZM18.25 16.5C18.25 16.0858 17.9142 15.75 17.5 15.75H16C15.5858 15.75 15.25 16.0858 15.25 16.5C15.25 16.9142 15.5858 17.25 16 17.25H17.5C17.9142 17.25 18.25 16.9142 18.25 16.5Z"
            fill={transportMode === 'electric-car' ? '#2196F3' : '#1E2023'} />
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

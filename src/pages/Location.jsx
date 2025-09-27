import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation as useReactLocation } from 'react-router-dom';
import axios from 'axios';
import '../styles/Location.css';
import { groups, subGroups } from '../components/groupData';
import { FormattedMessage, useIntl } from 'react-intl';
import localizeLocationData from '../utils/localizeLocationData.js';
import { useRouteStore } from '../store/routeStore';
import { useLangStore } from '../store/langStore';
import { useSearchStore } from '../store/searchStore';
import useLocaleDigits from '../utils/useLocaleDigits';
import { buildGeoJsonPath } from '../utils/geojsonPath.js';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Import video files
import v1 from '../assets/videos/vid1.mp4';
import v2 from '../assets/videos/vid2.mp4';

// Import PDF file
import pdf1 from '../assets/pdfs/pdf1.pdf';

// File mapping for offline access
const fileMap = {
  // Videos
  'v1': v1,
  'v2': v2,

  // PDFs
  'pdf1': pdf1,
};

// Helper function to get file URL
const getFileUrl = (fileKey) => {
  return fileMap[fileKey] || '';
};

// Helper function to get thumbnail URL
const getThumbnailUrl = (thumbnailKey) => {
  return fileMap[thumbnailKey] || '/images/default-thumbnail.jpg';
};

// Map subgroup labels to their values for easier lookup
const labelToValueMap = Object.values(subGroups).flat().reduce((acc, sg) => {
  acc[sg.label] = sg.value;
  return acc;
}, {});

// Get subgroup label based on currently loaded geoData
const getLocalizedSubgroupLabel = (geoData, value, fallback) => {
  if (geoData) {
    const feature = geoData.features.find(
      f => f.properties?.subGroupValue === value
    );
    if (feature?.properties?.subGroup) return feature.properties.subGroup;
  }
  return fallback;
};

// Get subgroup description based on currently loaded geoData
const getLocalizedSubgroupDescription = (geoData, value, fallback) => {
  if (geoData) {
    const feature = geoData.features.find(
      f => f.properties?.subGroupValue === value
    );
    if (feature?.properties?.description) return feature.properties.description;
  }
  return fallback;
};

const Location = () => {
  const navigate = useNavigate();
  const currentLocation = useReactLocation();

  const getSearchParams = () => {
    let search = currentLocation.search || window.location.search;
    if (!search && window.location.hash.includes('?')) {
      search = window.location.hash.split('?')[1];
      if (search) search = '?' + search;
    }
    if (search && search.includes('&amp;')) {
      search = search.replace(/&amp;/g, '&');
    }
    return new URLSearchParams(search);
  };

  const locationId = getSearchParams().get('id');
  const intl = useIntl();
  const formatDigits = useLocaleDigits();
  const [activeSlide, setActiveSlide] = useState(0);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([]);
  const [showFullAbout, setShowFullAbout] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [views, setViews] = useState(0);
  const [overallRating, setOverallRating] = useState(0);
  const [locationData, setLocationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [isQrCodeEntry, setIsQrCodeEntry] = useState(false);
  const [initialQrLocation, setInitialQrLocation] = useState(null);
  const [currentUserLocation, setCurrentUserLocation] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [isVideoFullscreen, setIsVideoFullscreen] = useState(false);

  const carouselRef = useRef(null);
  const aboutContentRef = useRef(null);
  const [geoData, setGeoData] = useState(null);
  const setDestinationStore = useRouteStore(state => state.setDestination);
  const language = useLangStore(state => state.language);

  useEffect(() => {
    // Only check for QR code specific keys
    const qrLat = sessionStorage.getItem('qrLat');
    const qrLng = sessionStorage.getItem('qrLng');
    const qrId = sessionStorage.getItem('qrId');

    // Make sure we have a proper QR code entry (not just map selection)
    const hasQrCoordinates = !!(qrLat && qrLng);
    const hasQrId = !!qrId;

    // Consider it a QR code entry only if we have both coordinates and ID
    setIsQrCodeEntry(hasQrCoordinates && hasQrId);
  }, []);

  const handleSaveDestination = () => {
    // Implement save destination logic
    toast.success(intl.formatMessage({ id: 'destinationSaved' }));
  };

  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    const isRTL = document.documentElement.dir === 'rtl';

    if (touchStart - touchEnd > 50) {
      // Swipe left (or right in RTL)
      if (isRTL) {
        handleSlideChange((activeSlide - 1 + locationData.images.length) % locationData.images.length);
      } else {
        handleSlideChange((activeSlide + 1) % locationData.images.length);
      }
    }

    if (touchStart - touchEnd < -50) {
      // Swipe right (or left in RTL)
      if (isRTL) {
        handleSlideChange((activeSlide + 1) % locationData.images.length);
      } else {
        handleSlideChange((activeSlide - 1 + locationData.images.length) % locationData.images.length);
      }
    }
  };

  // Initialize carousel position
  useEffect(() => {
    if (carouselRef.current && locationData) {
      const isRTL = document.documentElement.dir === 'rtl';
      const translateValue = isRTL ? `${activeSlide * 100}%` : `-${activeSlide * 100}%`;
      carouselRef.current.style.transform = `translateX(${translateValue})`;
    }
  }, [locationData, activeSlide]);

  const handleSlideChange = (index) => {
    if (index === activeSlide) return;
    setActiveSlide(index);
  };

  // Auto-advance carousel (optional)
  useEffect(() => {
    if (!locationData?.images) return;

    const interval = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % locationData.images.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [locationData]);

  const toggleAbout = () => {
    if (!showFullAbout && aboutContentRef.current) {
      aboutContentRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }
    setShowFullAbout(!showFullAbout);
  };

  const handleCommentClick = () => {
    setShowCommentModal(true);
    document.body.style.overflow = 'hidden';
  };

  const closeCommentModal = () => {
    setShowCommentModal(false);
    document.body.style.overflow = 'auto';
  };

  const handleRatingClick = (ratingValue) => {
    setRating(ratingValue);
  };

  const handleRatingHover = (ratingValue) => {
    setHoverRating(ratingValue);
  };

  const handleRatingLeave = () => {
    setHoverRating(0);
  };

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (comment.trim()) {
      const newComment = {
        author: intl.formatMessage({ id: 'defaultCommentAuthor' }),
        text: comment,
        date: ['fa', 'ur', 'ar'].includes(language)
          ? new Date().toLocaleDateString('fa-IR')
          : new Date().toLocaleDateString(),
        rating: rating || 0
      };

      setComments(prev => [newComment, ...prev]);
      setComment('');
      setViews(prev => prev + 1);
      setRating(0);
      setHoverRating(0);
      setShowCommentModal(false);
      document.body.style.overflow = 'auto';
      calculateAverageRating();
    }
  };

  useEffect(() => {
    const qrLat = sessionStorage.getItem('qrLat');
    const qrLng = sessionStorage.getItem('qrLng');
    const qrId = sessionStorage.getItem('qrId');

    const hasQrCoordinates = !!(qrLat && qrLng);
    const hasQrId = !!qrId;

    setIsQrCodeEntry(hasQrCoordinates && hasQrId);

    // Set initial QR location if available
    if (hasQrCoordinates && hasQrId) {
      setInitialQrLocation({
        lat: parseFloat(qrLat),
        lng: parseFloat(qrLng),
        id: qrId
      });
    }

    // Get current user location from session storage
    const currentLat = sessionStorage.getItem('mapSelectedLat') || sessionStorage.getItem('qrLat');
    const currentLng = sessionStorage.getItem('mapSelectedLng') || sessionStorage.getItem('qrLng');
    const currentId = sessionStorage.getItem('mapSelectedId') || sessionStorage.getItem('qrId');

    if (currentLat && currentLng) {
      setCurrentUserLocation({
        lat: parseFloat(currentLat),
        lng: parseFloat(currentLng),
        id: currentId
      });
    }
  }, []);

  // Function to check if current location matches initial QR location
  const isAtInitialLocation = () => {
    if (!initialQrLocation || !currentUserLocation) return false;

    // Simple comparison - you might want to add a tolerance for floating point coordinates
    return (
      initialQrLocation.lat === currentUserLocation.lat &&
      initialQrLocation.lng === currentUserLocation.lng &&
      initialQrLocation.id === currentUserLocation.id
    );
  };

  const calculateAverageRating = () => {
    if (comments.length === 0) {
      setOverallRating(0);
      return;
    }
    const average = comments.reduce((sum, comment) => sum + (comment.rating || 0), 0) / comments.length;
    setOverallRating(average);
  };

  // Video and PDF handlers
  const handleVideoClick = (videoContent) => {
    const videoUrl = getFileUrl(videoContent.fileKey);
    if (!videoUrl) {
      toast.error(intl.formatMessage({ id: 'videoLoadError' }));
      return;
    }

    // Create a temporary video element to check if it's playable
    const tempVideo = document.createElement('video');
    tempVideo.src = videoUrl;

    tempVideo.oncanplay = () => {
      setSelectedVideo({
        ...videoContent,
        mediaUrl: videoUrl
      });
      document.body.style.overflow = 'hidden';
    };

    tempVideo.onerror = () => {
      toast.error(intl.formatMessage({ id: 'videoLoadError' }));
    };

    tempVideo.load();
  };

  const handleVideoClose = () => {
    setSelectedVideo(null);
    setIsVideoFullscreen(false);
    document.body.style.overflow = 'auto';
  };

  const handleFullscreenToggle = () => {
    setIsVideoFullscreen(!isVideoFullscreen);
  };

  const handlePdfClick = async (pdfContent) => {
    const pdfUrl = getFileUrl(pdfContent.fileKey);
    if (!pdfUrl) {
      return;
    }

    try {
      // For PDFs, we'll open them in the same tab since they're bundled
      window.open(pdfUrl, '_blank');
    } catch (error) {
      console.error('Error opening PDF:', error);
    }
  };

  // Load geojson data
  useEffect(() => {
    const file = buildGeoJsonPath(language);
    fetch(file)
      .then(res => res.json())
      .then(setGeoData)
      .catch(err => console.error('failed to load geojson', err));
  }, [language]);

  useEffect(() => {
    const fetchLocationData = async () => {
      try {
        const response = await axios.get(`./data/locationData.json`);
        let data = response.data;
        if (Array.isArray(data)) {
          data = data.find(loc => loc.id === locationId) || data[0];
        }
        data = localizeLocationData(data, language);
        setLocationData(data);
        setComments(data.comments || []);
        setViews(data.views || 0);
        setOverallRating(data.averageRating || 0);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchLocationData();
  }, [locationId, language]);

  useEffect(() => {
    calculateAverageRating();
  }, [comments]);

  if (loading)
    return <div className="loading">{intl.formatMessage({ id: 'loading' })}</div>;
  if (error)
    return (
      <div className="error">
        {intl.formatMessage({ id: 'fetchError' }, { error })}
      </div>
    );
  if (!locationData)
    return <div className="no-data">{intl.formatMessage({ id: 'noDataFound' })}</div>;

  return (
    <div className="location-page">
      {/* Updated Carousel */}
      <div className="carousel-wrapper">
        <div className="fixed-header-icons">
          <button className="back-btn6" onClick={() => navigate(-1)}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" clipRule="evenodd" d="M11.2244 4.55806C11.4685 4.31398 11.8642 4.31398 12.1083 4.55806L17.1083 9.55806C17.3524 9.80214 17.3524 10.1979 17.1083 10.4419L12.1083 15.4419C11.8642 15.686 11.4685 15.686 11.2244 15.4419C10.9803 15.1979 10.9803 14.8021 11.2244 14.5581L15.1575 10.625H3.33301C2.98783 10.625 2.70801 10.3452 2.70801 10C2.70801 9.65482 2.98783 9.375 3.33301 9.375H15.1575L11.2244 5.44194C10.9803 5.19786 10.9803 4.80214 11.2244 4.55806Z" fill="black" />
            </svg>
          </button>
          <button className="profile-icon" onClick={() => navigate('/Profile')}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="9.99984" cy="5" r="3.33333" fill="#1E2023" />
              <ellipse cx="9.99984" cy="14.1667" rx="5.83333" ry="3.33333" fill="#1E2023" />
            </svg>
          </button>
        </div>
        <div className="carousel-container">
          <div
            className="carousel"
            ref={carouselRef}
            style={{ transform: `translateX(-${activeSlide * 100}%)` }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {locationData.images?.map((image, index) => (
              <div key={index} className="carousel-slide">
                <img
                  src={image}
                  alt={intl.formatMessage(
                    { id: 'imageAlt' },
                    { title: locationData.title, n: index + 1 }
                  )}
                  loading={index > 0 ? "lazy" : "eager"}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            ))}
          </div>
          <div className="carousel-fade"></div>
        </div>
        <div className="carousel-dots">
          {locationData.images?.map((_, index) => (
            <button
              key={index}
              className={`dot ${index === activeSlide ? 'active' : ''}`}
              onClick={() => handleSlideChange(index)}
              aria-label={intl.formatMessage({ id: 'goToSlide' }, { n: index + 1 })}
            ></button>
          ))}
        </div>
      </div>

      {/* Location Info Section */}
      <section className="location-info2">
        <div className="you-are-here">
          <div className="line left-line"></div>
          <div className="circle"></div>
          <span>
            {isQrCodeEntry ? (
              <FormattedMessage
                id="youAreHere"
              />
            ) : (
              <FormattedMessage
                id="youAreHereQr"
                values={{ placeName: locationData.title }}
              />
            )}
          </span>
          <div className="line right-line"></div>
        </div>
        <h1>{locationData.title}</h1>
        <h2>{locationData.location}</h2>

        <div className="location-meta">
          <div className="opening-hours-badge">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-clock"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0" /><path d="M12 7v5l3 3" /></svg>
            <span>{locationData.openingHours}</span>
          </div>
          <div className="views-rating">
            <span className="rating">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M12 17.75l-6.172 3.245l1.179 -6.873l-5 -4.867l6.9 -1l3.086 -6.253l3.086 6.253l6.9 1l-5 4.867l1.179 6.873z" />
              </svg>
              {formatDigits(overallRating.toFixed(1))}
            </span>
            <span className="views">({formatDigits(views)} {intl.formatMessage({ id: 'commentsLabel' })})</span>
          </div>
        </div>

        <div className="about-location" ref={aboutContentRef}>
          <h3>
            <FormattedMessage id="aboutLocation" values={{ title: locationData.title }} />
          </h3>
          <div className={`about-content ${showFullAbout ? 'expanded' : ''}`}>
            <p>
              {showFullAbout ? locationData.about.full : locationData.about.short}
              {!showFullAbout && (
                <button className="read-more" onClick={toggleAbout}>
                  <FormattedMessage id="readMore" />
                </button>
              )}
            </p>
            {showFullAbout && (
              <div className="close-button-container">
                <button className="read-more close-button" onClick={toggleAbout}>
                  <FormattedMessage id="close" />
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Audio/Video/Text Content Section */}
      {locationData.contents && locationData.contents.length > 0 && (
        <section className="content-section">
          <h3>
            <FormattedMessage id="audioTextContent" values={{ title: locationData.title }} />
          </h3>
          <div className="content-list">
            {locationData.contents.map((content) => (
              <div key={content.id} className="content-item">
                <div className="content-media">
                  {content.type === 'audio' && (
                    <div className="audio-thumbnail" style={{ backgroundImage: `url(${content.thumbnail})` }}>
                      <div className="play-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"></circle>
                          <polygon points="10 8 16 12 10 16 10 8"></polygon>
                        </svg>
                      </div>
                    </div>
                  )}
                  {content.type === 'video' && (
                    <div className="video-thumbnail-container">
                      <button
                        className="video-thumbnail-link"
                        onClick={() => handleVideoClick(content)}
                      >
                        <div
                          className="video-thumbnail"
                          style={{ backgroundImage: `url(${content.thumbnail})` }}
                        >
                          <div className="play-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10"></circle>
                              <polygon points="10 8 16 12 10 16 10 8"></polygon>
                            </svg>
                          </div>
                        </div>
                      </button>
                    </div>
                  )}
                  {content.type === 'pdf' && (
                    <div className="pdf-thumbnail" onClick={() => handlePdfClick(content)}>
                      {content.thumbnail ? (
                        <img src={content.thumbnail} alt="PDF thumbnail" />
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                          <polyline points="14 2 14 8 20 8"></polyline>
                          <path d="M10 11H8v2h2v-2z"></path>
                          <path d="M16 11h-2v2h2v-2z"></path>
                          <path d="M14 11h-2v2h2v-2z"></path>
                        </svg>
                      )}
                    </div>
                  )}
                </div>
                <div className="content-info">
                  <h4>{content.title[language]}</h4>
                  <p>{content.description[language]}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Comments Section */}
      <section className="comments-section">
        <div className="comments-header">
          <h3>
            <FormattedMessage id="commentsTitle" values={{ count: comments.length }} />
          </h3>
          <button className="view-all-btn">
            <FormattedMessage id="viewAll" />
            <svg xmlns="http://www.w3.org/2000/svg" width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M15 6l-6 6l6 6" />
            </svg>
          </button>
        </div>

        <div className="comment-input-wrapper" onClick={handleCommentClick}>
          <div className="comment-input-header">
            <svg width="20" height="20" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" clipRule="evenodd" d="M7.99992 1.83337C4.59416 1.83337 1.83325 4.59428 1.83325 8.00004C1.83325 8.98741 2.06494 9.91924 2.47645 10.7454C2.64161 11.077 2.70521 11.4736 2.60101 11.863L2.20394 13.347C2.13101 13.6196 2.38036 13.8689 2.65291 13.796L4.13694 13.399C4.5264 13.2947 4.92292 13.3583 5.25452 13.5235C6.08072 13.935 7.01255 14.1667 7.99992 14.1667C11.4057 14.1667 14.1666 11.4058 14.1666 8.00004C14.1666 4.59428 11.4057 1.83337 7.99992 1.83337ZM0.833252 8.00004C0.833252 4.042 4.04188 0.833374 7.99992 0.833374C11.958 0.833374 15.1666 4.042 15.1666 8.00004C15.1666 11.9581 11.958 15.1667 7.99992 15.1667C6.85438 15.1667 5.77027 14.8976 4.80868 14.4186C4.66519 14.3472 4.51868 14.332 4.39541 14.365L2.91139 14.762C1.8955 15.0339 0.966101 14.1045 1.23792 13.0886L1.63499 11.6045C1.66797 11.4813 1.65281 11.3348 1.58134 11.1913C1.10239 10.2297 0.833252 9.14558 0.833252 8.00004ZM4.83325 7.00004C4.83325 6.7239 5.05711 6.50004 5.33325 6.50004H10.6666C10.9427 6.50004 11.1666 6.7239 11.1666 7.00004C11.1666 7.27618 10.9427 7.50004 10.6666 7.50004H5.33325C5.05711 7.50004 4.83325 7.27618 4.83325 7.00004ZM4.83325 9.33337C4.83325 9.05723 5.05711 8.83337 5.33325 8.83337H8.99992C9.27606 8.83337 9.49992 9.05723 9.49992 9.33337C9.49992 9.60952 9.27606 9.83337 8.99992 9.83337H5.33325C5.05711 9.83337 4.83325 9.60952 4.83325 9.33337Z" fill="#1E2023" />
            </svg>

            <h4>
              <FormattedMessage id="commentPromptTitle" />
            </h4>
          </div>
          <p className="comment-instruction">
            <FormattedMessage id="commentPromptInstruction" />
          </p>
          <div className="comment-input-container">
            <input
              type="text"
              placeholder={intl.formatMessage({ id: 'commentPlaceholder' })}
              readOnly
            />
            <button type="button" className="send-comment">
              <svg width="17" height="18" viewBox="0 0 17 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9.39464 15.0728L5.34893 13.05C1.81466 11.2829 0.0475295 10.3993 0.0475289 9.00008C0.047529 7.60087 1.81466 6.7173 5.34892 4.95017L9.39463 2.92732C12.2471 1.50107 13.6734 0.787951 14.5002 1.00685C15.2868 1.21509 15.9011 1.82943 16.1094 2.61602C16.3283 3.44287 15.6152 4.86911 14.1889 7.72161C14.0122 8.07512 13.6508 8.31029 13.2555 8.31213L6.79714 8.34219C6.4338 8.34388 6.14063 8.6398 6.14232 9.00314C6.14401 9.36648 6.43993 9.65966 6.80327 9.65797L13.1574 9.62839C13.593 9.62637 13.9941 9.88892 14.1889 10.2786C15.6152 13.131 16.3283 14.5573 16.1094 15.3841C15.9011 16.1707 15.2868 16.7851 14.5002 16.9933C13.6734 17.2122 12.2471 16.4991 9.39464 15.0728Z" fill="#1E2023" />
              </svg>
            </button>
          </div>
        </div>

        <div className="comment-list-horizontal">
          {comments.map((item, index) => (
            <div key={index} className="comment-item">
              <div className="comment-header">
                <div className="comment-author-section">
                  <div className="profile-avatar2" />
                  <span className="comment-author">{item.author}</span>
                </div>
                <span className="comment-date">{item.date}</span>
              </div>
              <div className="comment-text">{item.text}</div>
              <div className="comment-rating-section">
                <div className="rating-stars">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      className={star <= item.rating ? 'filled' : ''}
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                      <path d="M12 17.75l-6.172 3.245l1.179 -6.873l-5 -4.867l6.9 -1l3.086 -6.253l3.086 6.253l6.9 1l-5 4.867l1.179 6.873z" />
                    </svg>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Comment Modal */}
      {showCommentModal && (
        <>
          <div className="modal-overlay" onClick={closeCommentModal}></div>
          <div className="comment-modal">
            <div className="modal-header">
              <h3>
                <FormattedMessage id="commentModalTitle" />
              </h3>
              <button className="close-modal" onClick={closeCommentModal}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                  <path d="M18 6l-12 12" />
                  <path d="M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="modal-content">
              <p className="modal-instruction">
                <FormattedMessage id="commentModalInstruction" />
              </p>

              <div className="rating-section">
                <p>
                  <FormattedMessage id="ratingPrompt" />
                </p>
                <div className="stars">
                  {[5, 4, 3, 2, 1].map((star) => (
                    <span
                      key={star}
                      onMouseEnter={() => handleRatingHover(star)}
                      onMouseLeave={handleRatingLeave}
                      onClick={() => handleRatingClick(star)}
                    >
                      <svg
                        className={`star-icon ${star <= (hoverRating || rating) ? 'filled' : ''}`}
                        xmlns="http://www.w3.org/2000/svg"
                        width="32"
                        height="32"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                        <path d="M12 17.75l-6.172 3.245l1.179 -6.873l-5 -4.867l6.9 -1l3.086 -6.253l3.086 6.253l6.9 1l-5 4.867l1.179 6.873z" />
                      </svg>
                    </span>
                  ))}
                </div>
              </div>

              <div className="modal-comment-input">
                <textarea
                  placeholder={intl.formatMessage({ id: 'commentPlaceholder' })}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                ></textarea>
              </div>

              <button className="submit-comment" onClick={handleCommentSubmit}>
                <FormattedMessage id="submitComment" />
              </button>
            </div>
          </div>
        </>
      )}
      {isQrCodeEntry && (
        <div className="fixed-bottom-button-container">
          <button
            className="fixed-bottom-button"
            onClick={() => navigate('/mpr')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#FFFFFF">
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M11.092 2.581a1 1 0 0 1 1.754 -.116l.062 .116l8.005 17.365c.198 .566 .05 1.196 -.378 1.615a1.53 1.53 0 0 1 -1.459 .393l-7.077 -2.398l-6.899 2.338a1.535 1.535 0 0 1 -1.52 -.231l-.112 -.1c-.398 -.386 -.556 -.954 -.393 -1.556l.047 -.15l7.97 -17.276z" />
            </svg>
            <FormattedMessage
              id={isAtInitialLocation() ? "navigateFromMpr" : "navigateToMpr"}
            />
          </button>
        </div>
      )}

      {/* Video Modal */}
      {selectedVideo && (
        <>
          <div className="video-modal-overlay" onClick={handleVideoClose}></div>
          <div className={`video-modal ${isVideoFullscreen ? 'fullscreen' : ''}`}>
            {/* <div className="video-modal-header">
              <h4>{selectedVideo.title[language]}</h4>
              <div className="video-controls">
                <button className="fullscreen-btn" onClick={handleFullscreenToggle}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {isVideoFullscreen ? (
                      <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
                    ) : (
                      <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                    )}
                  </svg>
                </button>
                <button className="close-video-modal" onClick={handleVideoClose}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                    <path d="M18 6l-12 12" />
                    <path d="M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div> */}
            <div className="video-container">
              <video
                controls
                autoPlay
                className="video-player"
                controlsList="nodownload"
                onEnded={() => {
                  // Optional: Auto-close when video ends
                  // handleVideoClose();
                }}
              >
                <source src={selectedVideo.mediaUrl} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </>
      )}

      {isQrCodeEntry && (
        <div className="fixed-bottom-button-container">
          <button
            className="fixed-bottom-button"
            onClick={() => navigate('/mpr')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#FFFFFF">
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M11.092 2.581a1 1 0 0 1 1.754 -.116l.062 .116l8.005 17.365c.198 .566 .05 1.196 -.378 1.615a1.53 1.53 0 0 1 -1.459 .393l-7.077 -2.398l-6.899 2.338a1.535 1.535 0 0 1 -1.52 -.231l-.112 -.1c-.398 -.386 -.556 -.954 -.393 -1.556l.047 -.15l7.97 -17.276z" />
            </svg>
            <FormattedMessage
              id={isAtInitialLocation() ? "navigateFromMpr" : "navigateToMpr"}
            />
          </button>
        </div>
      )}
    </div>
  );
};

export default Location;
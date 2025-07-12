import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/Location.css';
import { groups, subGroups } from '../components/groupData';
import { FormattedMessage, useIntl } from 'react-intl';
import { useRouteStore } from '../store/routeStore';
import { useLangStore } from '../store/langStore';
import { useSearchStore } from '../store/searchStore';
import { buildGeoJsonPath } from '../utils/geojsonPath.js';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Map subgroup labels to their values for easier lookup
const labelToValueMap = Object.values(subGroups).flat().reduce((acc, sg) => {
  acc[sg.label] = sg.value;
  return acc;
}, {});

const Location = () => {
  const navigate = useNavigate();
  const intl = useIntl();
  const [activeSlide, setActiveSlide] = useState(0);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchClose, setSearchClose] = useState(false);
  const [showFullAbout, setShowFullAbout] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [views, setViews] = useState(0);
  const [overallRating, setOverallRating] = useState(0);
  const [locationData, setLocationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRouting, setShowRouting] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [activeTab, setActiveTab] = useState('mostVisited');
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isSearchModalClosing, setIsSearchModalClosing] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [filteredSubGroups, setFilteredSubGroups] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const carouselRef = useRef(null);
  const aboutContentRef = useRef(null);
  const commentsListRef = useRef(null);
  const searchInputRef = useRef(null);
  const [routingData, setRoutingData] = useState(null);
  const [geoData, setGeoData] = useState(null);
  const setDestinationStore = useRouteStore(state => state.setDestination);
  const language = useLangStore(state => state.language);
  const recentSearches = useSearchStore(state => state.recentSearches);
  const addSearch = useSearchStore(state => state.addSearch);

  // Split groups into initial (first 9) and additional (rest)
  const initialCategories = groups.slice(0, 9);
  const additionalCategories = groups.slice(9);

  // Fetch routingData.json from public folder
  useEffect(() => {
    fetch(`./data/routing-data.json`)
      .then(res => res.json())
      .then(data => setRoutingData(data))
      .catch(err => console.error('Failed to load routing-data.json', err));
  }, []);

  // Load geojson data for searching place coordinates
  useEffect(() => {
    const file = buildGeoJsonPath(language);
    fetch(file)
      .then(res => res.json())
      .then(setGeoData)
      .catch(err => console.error('failed to load geojson', err));
  }, [language]);

  const getPolygonCenter = (coords) => {
    const pts = [];
    const collect = (c) => {
      if (typeof c[0] === 'number') {
        pts.push(c);
      } else {
        c.forEach(collect);
      }
    };
    collect(coords);
    const lats = pts.map((p) => p[1]);
    const lngs = pts.map((p) => p[0]);
    return [
      (Math.min(...lngs) + Math.max(...lngs)) / 2,
      (Math.min(...lats) + Math.max(...lats)) / 2,
    ];
  };

  const getFeatureCenter = (feature) => {
    if (!feature) return null;
    const { geometry } = feature;
    if (geometry.type === 'Point') return geometry.coordinates;
    if (geometry.type === 'Polygon' || geometry.type === 'MultiPolygon') {
      return getPolygonCenter(geometry.coordinates);
    }
    return null;
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
    if (isTransitioning || index === activeSlide) return;

    setIsTransitioning(true);
    setActiveSlide(index);

    setTimeout(() => {
      setIsTransitioning(false);
    }, 500);
  };

  const [currentSearchIcon, setCurrentSearchIcon] = useState(
    `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 0 0 -14 0" />
      <path d="M21 21l-6 -6" />
    </svg>`
  );

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
        date: new Date().toLocaleDateString('fa-IR'),
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

  const calculateAverageRating = () => {
    if (comments.length === 0) {
      setOverallRating(0);
      return;
    }
    const average = comments.reduce((sum, comment) => sum + (comment.rating || 0), 0) / comments.length;
    setOverallRating(average);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    console.log('Searching for:', searchQuery);
  };

  const handleSearchToggle = () => {
    setShowRouting(!showRouting);
    setSearchClose(!searchClose);
  };

  const handlePlaceClick = (placeTitle, groupValue) => {
    console.log('Place clicked:', placeTitle);
    if (!geoData) return;
    let feature = geoData.features.find(
      f =>
        f.properties?.name === placeTitle ||
        f.properties?.subGroup === placeTitle ||
        f.properties?.subGroupValue === labelToValueMap[placeTitle]
    );
    if (!feature && groupValue) {
      feature = geoData.features.find(f => f.properties?.group === groupValue);
    }
    if (feature) {
      const center = getFeatureCenter(feature);
      if (center) {
        setDestinationStore({ name: placeTitle, coordinates: [center[1], center[0]] });
        setShowSearchModal(false);
        document.body.style.overflow = 'auto';
        navigate('/fs');
        return;
      }
    }

    toast.error(intl.formatMessage({ id: 'noDataFound' }));
  };

  const handleSearchFocus = () => {
    setIsSearchFocused(true);
    setShowSearchModal(true);
    document.body.style.overflow = 'hidden';
  };

  const handleSearchBlur = () => {
    setIsSearchFocused(false);
  };

  const closeSearchModal = (e) => {
    if (e) {
      e.stopPropagation();
    }

    if (searchQuery.trim() !== '') {
      setSearchQuery('');
      setSearchResults([]);
      setIsSearching(false);
      setSelectedCategory(null);
      setFilteredSubGroups([]);

      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 0);
    } else {
      setIsSearchModalClosing(true);
      setTimeout(() => {
        setShowSearchModal(false);
        setIsSearchModalClosing(false);
        document.body.style.overflow = 'auto';
        setSearchQuery('');
        setSearchResults([]);
        setIsSearching(false);
        setSelectedCategory(null);
        setFilteredSubGroups([]);
        // Reset the search icon to default
        setCurrentSearchIcon(
          `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 0 0 -14 0" />
            <path d="M21 21l-6 -6" />
          </svg>`
        );
      }, 300);
    }
  };
  const handleSearchChange = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);

    if (query.length > 0) {
      setIsSearching(true);
      // Reset to search icon when typing
      setCurrentSearchIcon(
        `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 0 0 -14 0" />
          <path d="M21 21l-6 -6" />
        </svg>`
      );

      const results = [];
      Object.entries(subGroups).forEach(([groupValue, subgroups]) => {
        subgroups.forEach(subgroup => {
          if (
            subgroup.label.toLowerCase().includes(query) ||
            (subgroup.description && subgroup.description.toLowerCase().includes(query))
          ) {
            results.push({
              type: 'subgroup',
              ...subgroup,
              groupValue
            });
          }
        });
      });
      setSearchResults(results);
      setSelectedCategory(null);
    } else {
      setIsSearching(false);
      setSearchResults([]);
    }
  };
  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
    setFilteredSubGroups(subGroups[category.value] || []);
    setShowSearchModal(true);
    setSearchQuery('');
    setCurrentSearchIcon(category.svg); // Set the icon to the category's icon
    document.body.style.overflow = 'hidden';
  };

  useEffect(() => {
    const fetchLocationData = async () => {
      try {
        const response = await axios.get(`./data/locationData.json`);
        setLocationData(response.data);
        setComments(response.data.comments || []);
        setViews(response.data.views || 0);
        setOverallRating(response.data.averageRating || 0);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchLocationData();
  }, []);

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
          <button className="menu-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M5 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
              <path d="M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
              <path d="M19 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
            </svg>
          </button>
          <button className="profile-icon" onClick={() => navigate('/Profile')}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M12 2a5 5 0 1 1 -5 5l.005 -.217a5 5 0 0 1 4.995 -4.783z" />
              <path d="M14 14a5 5 0 0 1 5 5v1a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-1a5 5 0 0 1 5 -5h4z" />
            </svg>
          </button>
        </div>
        <div className="carousel-container">
          <div
            className="carousel"
            ref={carouselRef}
            style={{ transform: `translateX(-${activeSlide * 100}%)` }}
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
            <FormattedMessage id="youAreHere" />
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
              {overallRating.toFixed(1)}
            </span>
            <span className="views">({views} {intl.formatMessage({ id: 'commentsLabel' })})</span>
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

      {/* Events Section */}
      <section className="events-section">
        <h3>
          <FormattedMessage id="audioTextContent" values={{ title: locationData.title }} />
        </h3>
        <div className="events-list">
          {locationData.events?.map(event => (
            <div key={event.id} className="event-item">
              <h4>{event.title}</h4>
              <span className="event-date">{event.date}</span>
              <p>{event.description}</p>
            </div>
          ))}
        </div>
      </section>

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
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-bubble-text"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M7 10h10" /><path d="M9 14h5" /><path d="M12.4 3a5.34 5.34 0 0 1 4.906 3.239a5.333 5.333 0 0 1 -1.195 10.6a4.26 4.26 0 0 1 -5.28 1.863l-3.831 2.298v-3.134a2.668 2.668 0 0 1 -1.795 -3.773a4.8 4.8 0 0 1 2.908 -8.933a5.33 5.33 0 0 1 4.287 -2.16" /></svg>
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
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-send-2">
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M19.302 4.034l-16.302 7.966l16.302 7.966a.503 .503 0 0 0 .546 -.124a.555 .555 0 0 0 .12 -.568l-2.468 -7.274l2.468 -7.274a.555 .555 0 0 0 -.12 -.568a.503 .503 0 0 0 -.546 -.124z" />
                <path d="M17.5 12h-14.5" />
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

      {/* Search Bar with Integrated Routing */}
      <div className={`search-bar-container ${showRouting ? 'expanded' : ''}`}>
        <div className="search-bar-toggle" onClick={handleSearchToggle}>
          <div className="toggle-handle"></div>
        </div>

        <form className="search-bar" onSubmit={handleSearchSubmit}>
          <button type="submit" className="search-icon">
            <div dangerouslySetInnerHTML={{ __html: currentSearchIcon }} />
          </button>

          <input
            type="text"
            placeholder={intl.formatMessage({ id: 'searchPlaceholder' })}
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={handleSearchFocus}
            onBlur={handleSearchBlur}
            ref={searchInputRef}
          />

          {!isSearchFocused ? (
            <button type="button" className="map-button" onClick={() => navigate('/mpr')}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="icon icon-tabler icons-tabler-map-pin">
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M18.364 4.636a9 9 0 0 1 .203 12.519l-.203 .21l-4.243 4.242a3 3 0 0 1 -4.097 .135l-.144 -.135l-4.244 -4.243a9 9 0 0 1 12.728 -12.728zm-6.364 3.364a3 3 0 1 0 0 6a3 3 0 0 0 0 -6z" />
              </svg>
              <span><FormattedMessage id="map" /></span>
            </button>
          ) : (
            <button
              type="button"
              className="close-search-button"
              onClick={(e) => {
                e.stopPropagation();
                closeSearchModal(e);
              }}
              aria-label={
                searchQuery.trim() === ''
                  ? intl.formatMessage({ id: 'closeSearch' })
                  : intl.formatMessage({ id: 'clearSearch' })
              }
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-x">
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M18 6l-12 12" />
                <path d="M6 6l12 12" />
              </svg>
            </button>
          )}
        </form>

        {/* Integrated Routing Content */}
        {showRouting && routingData && (
          <div className="integrated-routing-content">
            {/* Categories Section */}
            <div className="routing-categories-section">
              <h2 className="routing-section-title">
                <FormattedMessage id="searchSuggestions" />
              </h2>
              <div className={`routing-categories-grid ${showAllCategories ? 'expanded' : ''}`}>
                {initialCategories.map((category, index) => (
                  <div
                    key={index}
                    className="routing-category-item"
                    onClick={() => handleCategoryClick(category)}
                  >
                    <div className="category-icon" dangerouslySetInnerHTML={{ __html: category.svg }} />
                    <span>{intl.formatMessage({ id: category.label })}</span>
                  </div>
                ))}
                {showAllCategories && additionalCategories.map((category, index) => (
                  <div
                    key={index + initialCategories.length}
                    className="routing-category-item"
                    onClick={() => handleCategoryClick(category)}
                  >
                    <div className="category-icon" dangerouslySetInnerHTML={{ __html: category.svg }} />
                    <span>{intl.formatMessage({ id: category.label })}</span>
                  </div>
                ))}
              </div>
              <button
                className="routing-show-more-btn"
                onClick={() => setShowAllCategories(!showAllCategories)}
              >
                {showAllCategories
                  ? intl.formatMessage({ id: 'showLess' })
                  : intl.formatMessage({ id: 'showMore' })}
                <svg
                  className={`show-more-icon ${showAllCategories ? 'expanded' : ''}`}
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                  <path d="M15 6l-6 6l6 6" />
                </svg>
              </button>
            </div>

            {/* Shrine Events Section - Horizontal Scroll */}
            <div className="shrine-events-section">
              <div className="shrine-events-header">
                <h2 className="shrine-events-title">
                  <FormattedMessage id="shrineEventsTitle" />
                </h2>
                <button className="view-all-events">
                  <FormattedMessage id="viewAll" />
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                    <path d="M15 6l-6 6l6 6" />
                  </svg>
                </button>
              </div>
              <div className="shrine-events-list">
                {routingData.places.shrineEvents?.map((event, index) => (
                  <div key={index} className="shrine-event-item">
                    <div
                      className="place-image-placeholder"
                      style={{ backgroundImage: `url(${event.image})` }}
                    ></div>
                    <div className="place-info">
                      <h3 className="place-title">{event.title}</h3>
                      <p className="place-description">{event.description}</p>
                      <div className="place-info2">
                        <span className="place-address">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="black"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="icon icon-tabler icons-tabler-outline icon-tabler-door"
                          >
                            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                            <path d="M14 12v.01" />
                            <path d="M3 21h18" />
                            <path d="M6 21v-16a2 2 0 0 1 2 -2h8a2 2 0 0 1 2 2v16" />
                          </svg>
                          {event.location}
                        </span>
                        <div className="place-meta">
                          <span className="shrine-event-time">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                              <path d="M17 3.34a10 10 0 1 1 -14.995 8.984l-.005 -.324l.005 -.324a10 10 0 0 1 14.995 -8.336zm-5 2.66a1 1 0 0 0 -.993 .883l-.007 .117v5l.009 .131a1 1 0 0 0 .197 .477l.087 .1l3 3l.094 .082a1 1 0 0 0 1.226 0l.094 -.083l.083 -.094a1 1 0 0 0 0 -1.226l-.083 -.094l-2.707 -2.708v-4.585l-.007 -.117a1 1 0 0 0 -.993 -.883z" />
                            </svg>
                            {event.time}
                          </span>
                        </div>
                      </div>

                      <div className="place-actions">
                        <button className="place-action-btn" onClick={() => navigate('/fs')}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                            <path d="M11.092 2.581a1 1 0 0 1 1.754 -.116l.062 .116l8.005 17.365c.198 .566 .05 1.196 -.378 1.615a1.53 1.53 0 0 1 -1.459 .393l-7.077 -2.398l-6.899 2.338a1.535 1.535 0 0 1 -1.52 -.231l-.112 -.1c-.398 -.386 -.556 -.954 -.393 -1.556l.047 -.15l7.97 -17.276z" />
                          </svg>
                          <FormattedMessage id="navigate" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Places Section with Tabs */}
            <div className="routing-places-section">
              <div className="routing-tabs">
                <button
                  className={`routing-tab ${activeTab === 'mostVisited' ? 'active' : ''}`}
                  onClick={() => setActiveTab('mostVisited')}
                >
                  <FormattedMessage id="mostVisited" />
                </button>
                <button
                  className={`routing-tab ${activeTab === 'closest' ? 'active' : ''}`}
                  onClick={() => setActiveTab('closest')}
                >
                  <FormattedMessage id="nearMe" />
                </button>
              </div>

              <div className="routing-places-content">
                {activeTab === 'mostVisited' && (
                  <>
                    {routingData.places.mostVisited.map((place, index) => (
                      <div key={index} className="routing-place-card">
                        <div
                          className="place-image-placeholder"
                          style={{ backgroundImage: `url(${place.image})` }}
                          onClick={() => handlePlaceClick(place.title)}
                        ></div>
                        <div className="place-info">
                          <h4 className="place-title">{place.title}</h4>
                          <div className="place-meta">
                            <div className="place-address">{place.address}</div>
                            <span className="place-meta-separator">|</span>
                            <span>{place.distance}</span>
                            <span className="place-meta-separator">|</span>
                            <span>{place.time}</span>
                          </div>
                          <div className="place-rating-section">
                            <div className="place-rating-stars">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <svg
                                  key={star}
                                  className={star <= Math.round(place.rating) ? 'filled' : ''}
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
                            <span className="place-views">({place.views} {intl.formatMessage({ id: 'commentsLabel' })})</span>
                          </div>
                          <p className="place-description">{place.description}</p>
                          <button className="read-more-btn">
                            <FormattedMessage id="readMore" />
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                              <path d="M15 6l-6 6l6 6" />
                            </svg>
                          </button>
                          <div className="place-actions">
                            <button className="place-action-btn2" onClick={() => navigate('/fs')}>
                              <svg
                                className="action-icon"
                                xmlns="http://www.w3.org/2000/svg"
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                <path d="M12 18.5l7.265 2.463c.196 .077 .42 .032 .57 -.116a.548 .548 0 0 0 .134 -.572l-7.969 -17.275l-7.97 17.275c-.07 .2 -.017 .424 .135 .572c.15 .148 .374 .193 .57 .116l7.265 -2.463" />
                              </svg>
                              <FormattedMessage id="navigate" />
                            </button>
                            <button className="place-action-btn2">
                              <svg
                                className="action-icon"
                                xmlns="http://www.w3.org/2000/svg"
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                <path d="M3 4m0 2a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v0a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2z" />
                                <path d="M5 8v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-10" />
                                <path d="M10 12l4 0" />
                              </svg>
                              <FormattedMessage id="save" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {activeTab === 'closest' && (
                  <>
                    {routingData.places.nearest.map((place, index) => (
                      <div key={index} className="routing-place-card">
                        <div
                          className="place-image-placeholder"
                          style={{ backgroundImage: `url(${place.image})` }}
                          onClick={() => handlePlaceClick(place.title)}
                        ></div>
                        <div className="place-info">
                          <h4 className="place-title">{place.title}</h4>
                          <div className="place-address">{place.address}</div>
                          <div className="place-meta">
                            <span>{place.distance}</span>
                            <span className="place-meta-separator">|</span>
                            <span>{place.time}</span>
                          </div>
                          <p className="place-description">{place.description}</p>
                          <button className="read-more-btn">
                            <FormattedMessage id="readMore" />
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                              <path d="M15 6l-6 6l6 6" />
                            </svg>
                          </button>
                          <div className="place-actions">
                            <button className="place-action-btn" onClick={() => navigate('/fs')}>
                              <svg
                                className="action-icon"
                                xmlns="http://www.w3.org/2000/svg"
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                <path d="M12 18.5l7.265 2.463c.196 .077 .42 .032 .57 -.116a.548 .548 0 0 0 .134 -.572l-7.969 -17.275l-7.97 17.275c-.07 .2 -.017 .424 .135 .572c.15 .148 .374 .193 .57 .116l7.265 -2.463" />
                              </svg>
                              <FormattedMessage id="navigate" />
                            </button>
                            <button className="place-action-btn">
                              <svg
                                className="action-icon"
                                xmlns="http://www.w3.org/2000/svg"
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                <path d="M3 4m0 2a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v0a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2z" />
                                <path d="M5 8v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-10" />
                                <path d="M10 12l4 0" />
                              </svg>
                              <FormattedMessage id="save" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Search Modal */}
      {showSearchModal && (
        <>
          <div
            className={`search-modal-overlay ${isSearchModalClosing ? 'fade-out' : 'fade-in'}`}
            onClick={closeSearchModal}
          ></div>
          <div className={`search-modal ${isSearchModalClosing ? 'fade-out' : 'fade-in'}`}>
            <div className="search-modal-header">
              <form className="search-bar expanded-search" onSubmit={handleSearchSubmit}>
                <button type="submit" className="search-icon">
                  <div dangerouslySetInnerHTML={{ __html: currentSearchIcon }} />
                </button>

                <input
                  type="text"
                  placeholder={intl.formatMessage({ id: 'searchPlaceholder' })}
                  value={searchQuery}
                  onChange={handleSearchChange}
                  autoFocus
                  ref={searchInputRef}
                  className="expanded-search-input"
                />

                <button
                  type="button"
                  className="close-search-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    closeSearchModal(e);
                  }}
                  aria-label={
                    searchQuery.trim() === ''
                      ? intl.formatMessage({ id: 'closeSearch' })
                      : intl.formatMessage({ id: 'clearSearch' })
                  }
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-x">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                    <path d="M18 6l-12 12" />
                    <path d="M6 6l12 12" />
                  </svg>
                </button>
              </form>
            </div>
            <div className="search-modal-content">
              {isSearching ? (
                <div className="search-results-container">
                  {searchResults.length > 0 ? (
                    <div className="subgroups-without-images">
                      {searchResults.map((item, index) => {
                        const group = groups.find(g => g.value === item.groupValue);
                        return (
                          <div
                            key={index}
                            className="subgroup-item-no-image"
                            onClick={() => handlePlaceClick(item.label, item.groupValue)}
                          >
                            <div className="subgroup-icon" dangerouslySetInnerHTML={{ __html: group?.svg || '' }} />
                            <div className="subgroup-text">
                              <h4>{item.label}</h4>
                              {item.description && <p>{item.description}</p>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="no-results">
                      <p>
                        <FormattedMessage
                          id="noResultsFound"
                          values={{ query: searchQuery }}
                        />
                      </p>
                    </div>
                  )}
                </div>
              ) : selectedCategory ? (
                <div className="subgroups-container">
                  {/* Split subgroups into those with images and without */}
                  <div className="subgroups-with-images">
                    <div className="subgroups-grid">
                      {subGroups[selectedCategory.value]
                        .filter(subgroup => subgroup.img)
                        .map((subgroup, index) => (
                          <div
                            key={index}
                            className="subgroup-item with-image"
                            onClick={() => handlePlaceClick(subgroup.label, selectedCategory.value)}
                            style={{
                              backgroundImage: subgroup.img ? `url(${subgroup.img})` : 'none',
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                              backgroundColor: 'rgba(255,255,255,0.7)',
                              backgroundBlendMode: 'lighten'
                            }}
                          >
                            <div className="subgroup-info">
                              <h4>{subgroup.label}</h4>
                              {subgroup.description && <p>{subgroup.description}</p>}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  <div className="subgroups-without-images">
                    {subGroups[selectedCategory.value]
                      .filter(subgroup => !subgroup.img)
                      .map((subgroup, index) => (
                        <div
                          key={index}
                          className="subgroup-item-no-image"
                          onClick={() => handlePlaceClick(subgroup.label, selectedCategory.value)}
                        >
                          <div className="subgroup-icon" dangerouslySetInnerHTML={{ __html: subgroup.svg }} />
                          <div className="subgroup-text">
                            <h4>{subgroup.label}</h4>
                            {subgroup.description && <p>{subgroup.description}</p>}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ) : (
                <>
                  {recentSearches.length > 0 ? (
                    <>
                      <h2 className="location-recent-title">
                        {intl.formatMessage({ id: 'mapRecentSearches' })}
                      </h2>
                      <ul className="location-destination-list">
                        {recentSearches.map((item) => (
                          <li key={item.id} onClick={() => handlePlaceClick(item)}>
                            <div className="location-recent-icon">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="15"
                                height="15"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="icon icon-tabler icons-tabler-outline icon-tabler-clock-down"
                              >
                                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                <path d="M20.984 12.535a9 9 0 1 0 -8.431 8.448" />
                                <path d="M12 7v5l3 3" />
                                <path d="M19 16v6" />
                                <path d="M22 19l-3 3l-3 -3" />
                              </svg>
                            </div>
                            <div className="location-destination-info">
                              <span className="location-destination-name">{item.name}</span>
                              <span className="location-destination-location">{item.location}</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : (
                    <p className="location-no-recent">
                      {intl.formatMessage({ id: 'mapNoRecentSearches' })}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Location;
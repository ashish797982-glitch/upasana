
import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  ArrowUpRight,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CinemaLightbox({
  activeItem,
  catalog = [],
  onClose,
  onNavigate,
  onSelectIndex,
  onReserve,
}) {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(
    Boolean(document.fullscreenElement)
  );

  const filmstripRef = useRef(null);

  const currentIndex = catalog.findIndex(
    (item) =>
      item.src === activeItem?.src ||
      (item.id && item.id === activeItem?.id)
  );

  const total = catalog.length;

  // Reset zoom when the selected image changes.
  useEffect(() => {
    setZoomLevel(1);
  }, [activeItem?.src]);

  // Keep the active thumbnail visible without queued smooth scrolling.
  useEffect(() => {
    if (!activeItem || !filmstripRef.current || currentIndex < 0) {
      return;
    }

    const thumbnail = filmstripRef.current.children[currentIndex];

    if (thumbnail) {
      thumbnail.scrollIntoView({
        behavior: 'auto',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [currentIndex, activeItem]);

  // Track the actual browser fullscreen state.
  useEffect(() => {
    const syncFullscreen = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener('fullscreenchange', syncFullscreen);

    return () => {
      document.removeEventListener('fullscreenchange', syncFullscreen);
    };
  }, []);

  // Keyboard controls while the lightbox is open.
  useEffect(() => {
    if (!activeItem) return;

    const handleKeyDown = (event) => {
      // Do not intercept keys when typing in a form field.
      const target = event.target;
      const isTyping =
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));

      if (isTyping) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        onClose?.();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        onNavigate?.(1);
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        onNavigate?.(-1);
      } else if (event.key === '+' || event.key === '=') {
        setZoomLevel((zoom) => Math.min(2.8, zoom + 0.6));
      } else if (event.key === '-') {
        setZoomLevel((zoom) => Math.max(1, zoom - 0.6));
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeItem, onClose, onNavigate]);

  const toggleZoom = () => {
    setZoomLevel((zoom) => {
      if (zoom === 1) return 1.8;
      if (zoom === 1.8) return 2.6;
      return 1;
    });
  };

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error('Unable to toggle fullscreen:', error);
    }
  };

  if (!activeItem) return null;

  const navigate = (step) => {
    if (typeof onNavigate === 'function' && total > 0) {
      onNavigate(step);
    }
  };

  return (
    <AnimatePresence>
      {activeItem && (
        <motion.div
          className="cinema-lb-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={`Cinema View: ${activeItem.title || 'Portfolio image'}`}
          data-lenis-prevent
        >
          <motion.div
            className="cinema-lb-modal"
            initial={{ scale: 0.96, y: 15 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.96, y: 15 }}
            transition={{
              duration: 0.3,
              ease: [0.16, 1, 0.3, 1],
            }}
            onClick={(event) => event.stopPropagation()}
          >
            {/* Top toolbar */}
            <div className="cinema-lb-toolbar">
              <div className="cinema-lb-meta">
                <span className="cinema-lb-pill">
                  <Sparkles size={11} color="var(--gold-light)" />
                  {activeItem.cat
                    ? activeItem.cat.toUpperCase()
                    : 'PORTFOLIO ATELIER'}
                </span>

                <h3 className="cinema-lb-title">
                  {activeItem.title || 'Exclusive Portfolio Look'}
                </h3>

                <span className="cinema-lb-counter">
                  {currentIndex >= 0
                    ? `LOOK ${currentIndex + 1} OF ${total}`
                    : 'EXCLUSIVE MASTERPIECE'}
                </span>
              </div>

              <div className="cinema-lb-actions">
                {/* Zoom */}
                <div className="cinema-lb-zoom-group">
                  <button
                    type="button"
                    className="cinema-lb-btn"
                    onClick={toggleZoom}
                    title="Toggle Zoom"
                    aria-label="Toggle image zoom"
                  >
                    {zoomLevel > 1 ? (
                      <ZoomOut size={15} />
                    ) : (
                      <ZoomIn size={15} />
                    )}
                    <span>{zoomLevel.toFixed(1)}x</span>
                  </button>
                </div>

                {/* Fullscreen */}
                <button
                  type="button"
                  className="cinema-lb-btn"
                  onClick={toggleFullscreen}
                  title="Toggle Fullscreen"
                  aria-label="Toggle fullscreen"
                >
                  {isFullscreen ? (
                    <Minimize2 size={15} />
                  ) : (
                    <Maximize2 size={15} />
                  )}
                </button>

                {/* Reserve */}
                <button
                  type="button"
                  className="cinema-lb-cta"
                  onClick={() => {
                    const title = activeItem.title;
                    onClose?.();
                    onReserve?.(title);
                  }}
                >
                  <span>RESERVE THIS LOOK</span>
                  <ArrowUpRight size={13} />
                </button>

                {/* Close */}
                <button
                  type="button"
                  className="cinema-lb-btn cinema-lb-close"
                  onClick={onClose}
                  aria-label="Close Lightbox"
                  title="Close (Esc)"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Large image viewport */}
            <div className="cinema-lb-viewport">
              {total > 1 && (
                <button
                  type="button"
                  className="cinema-lb-nav cinema-lb-nav-prev"
                  onClick={() => navigate(-1)}
                  aria-label="Previous Look"
                  title="Previous Look (Left Arrow)"
                >
                  <ChevronLeft size={30} />
                </button>
              )}

              <div
                className="cinema-lb-canvas"
                style={{
                  cursor: zoomLevel > 1 ? 'zoom-out' : 'zoom-in',
                  overflow: 'auto',
                }}
                onClick={toggleZoom}
              >
                <motion.img
                  key={activeItem.src}
                  src={activeItem.src}
                  alt={activeItem.title || 'Portfolio image'}
                  draggable={false}
                  initial={{ opacity: 0.4, scale: 0.98 }}
                  animate={{ opacity: 1, scale: zoomLevel }}
                  transition={{
                    duration: 0.28,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="cinema-lb-img"
                  onError={(event) => {
                    event.currentTarget.alt = 'Image could not be loaded';
                  }}
                />
              </div>

              {total > 1 && (
                <button
                  type="button"
                  className="cinema-lb-nav cinema-lb-nav-next"
                  onClick={() => navigate(1)}
                  aria-label="Next Look"
                  title="Next Look (Right Arrow)"
                >
                  <ChevronRight size={30} />
                </button>
              )}
            </div>

            {/* Description and thumbnail rail */}
            <div className="cinema-lb-footer">
              {activeItem.d && (
                <div className="cinema-lb-desc-strip">
                  <p>{activeItem.d}</p>

                  {Array.isArray(activeItem.tags) &&
                    activeItem.tags.length > 0 && (
                      <div className="cinema-lb-tag-row">
                        {activeItem.tags.map((tag) => (
                          <span key={tag} className="cinema-lb-tag">
                            <CheckCircle2
                              size={10}
                              color="var(--gold)"
                            />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                </div>
              )}

              <div
                className="cinema-lb-filmstrip"
                ref={filmstripRef}
                role="tablist"
                aria-label="Portfolio image thumbnails"
              >
                {catalog.map((item, index) => {
                  const isActive =
                    item.src === activeItem.src ||
                    (item.id && item.id === activeItem.id);

                  return (
                    <button
                      type="button"
                      key={item.id || item.src || index}
                      role="tab"
                      aria-selected={isActive}
                      className={`cinema-lb-thumb ${
                        isActive ? 'active' : ''
                      }`}
                      onClick={() => onSelectIndex?.(index)}
                      title={item.title || `Look ${index + 1}`}
                      aria-label={`View ${item.title || `Look ${index + 1}`}`}
                    >
                      <img
                        src={item.src}
                        alt={item.title || `Look ${index + 1}`}
                        loading="lazy"
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

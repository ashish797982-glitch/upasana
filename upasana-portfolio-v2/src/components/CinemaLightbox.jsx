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
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CinemaLightbox({ 
  activeItem, 
  catalog, 
  onClose, 
  onNavigate, 
  onSelectIndex,
  onReserve 
}) {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const filmstripRef = useRef(null);

  useEffect(() => {
    setZoomLevel(1);
  }, [activeItem]);

  const currentIndex = catalog.findIndex(i => i.src === activeItem?.src || i.id === activeItem?.id);
  const total = catalog.length;

  // Auto-scroll active thumbnail into view in filmstrip
  useEffect(() => {
    if (filmstripRef.current && currentIndex !== -1) {
      const activeThumb = filmstripRef.current.children[currentIndex];
      if (activeThumb) {
        activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [currentIndex]);

  // Keyboard navigation & escape listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!activeItem) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onNavigate(1);
      if (e.key === 'ArrowLeft') onNavigate(-1);
      if (e.key === '+' || e.key === '=') setZoomLevel(z => Math.min(2.8, z + 0.6));
      if (e.key === '-') setZoomLevel(z => Math.max(1, z - 0.6));
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeItem, onNavigate, onClose]);

  if (!activeItem) return null;

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div 
        className="cinema-lb-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-label={`Cinema View: ${activeItem.title}`}
        data-lenis-prevent
      >
        <motion.div 
          className="cinema-lb-modal"
          initial={{ scale: 0.94, y: 15 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.94, y: 15 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Cinema Toolbar */}
          <div className="cinema-lb-toolbar">
            <div className="cinema-lb-meta">
              <span className="cinema-lb-pill">
                <Sparkles size={11} color="var(--gold-light)" />
                {activeItem.cat ? activeItem.cat.toUpperCase() : 'PORTFOLIO ATELIER'}
              </span>
              <h3 className="cinema-lb-title">{activeItem.title}</h3>
              <span className="cinema-lb-counter">
                {currentIndex !== -1 ? `LOOK ${currentIndex + 1} OF ${total}` : 'EXCLUSIVE MASTERPIECE'}
              </span>
            </div>

            <div className="cinema-lb-actions">
              {/* Zoom Controller */}
              <div className="cinema-lb-zoom-group">
                <button 
                  className="cinema-lb-btn"
                  onClick={() => setZoomLevel(z => (z === 1 ? 1.8 : z === 1.8 ? 2.6 : 1))}
                  title="Toggle Zoom (1x / 1.8x / 2.6x)"
                  aria-label="Toggle Zoom"
                >
                  {zoomLevel > 1 ? <ZoomOut size={15} /> : <ZoomIn size={15} />}
                  <span>{zoomLevel}x</span>
                </button>
              </div>

              {/* Fullscreen Button */}
              <button 
                className="cinema-lb-btn"
                onClick={toggleFullscreen}
                title="Toggle Fullscreen"
                aria-label="Toggle Fullscreen"
              >
                {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
              </button>

              {/* Reserve Look CTA */}
              <button 
                className="cinema-lb-cta"
                onClick={() => {
                  onClose();
                  if (onReserve) onReserve(activeItem.title);
                }}
              >
                <span>RESERVE THIS LOOK</span>
                <ArrowUpRight size={13} />
              </button>

              {/* Close Button */}
              <button 
                className="cinema-lb-btn cinema-lb-close"
                onClick={onClose}
                aria-label="Close Lightbox (Esc)"
                title="Close (Esc)"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Main Large-Format Cinema Viewport */}
          <div className="cinema-lb-viewport">
            <button 
              className="cinema-lb-nav cinema-lb-nav-prev"
              onClick={() => onNavigate(-1)}
              aria-label="Previous Look (Left Arrow)"
              title="Previous Look (Left Arrow)"
            >
              <ChevronLeft size={30} />
            </button>

            <div 
              className="cinema-lb-canvas"
              style={{ cursor: zoomLevel > 1 ? 'grab' : 'zoom-in' }}
              onClick={() => setZoomLevel(z => (z === 1 ? 1.8 : 1))}
            >
              <motion.img 
                key={activeItem.src}
                src={activeItem.src} 
                alt={activeItem.title}
                initial={{ opacity: 0.5, scale: 0.98 }}
                animate={{ opacity: 1, scale: zoomLevel }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                className="cinema-lb-img"
              />
            </div>

            <button 
              className="cinema-lb-nav cinema-lb-nav-next"
              onClick={() => onNavigate(1)}
              aria-label="Next Look (Right Arrow)"
              title="Next Look (Right Arrow)"
            >
              <ChevronRight size={30} />
            </button>
          </div>

          {/* Bottom Narrative Specs & Full 67-Look Thumbnail Scrubber Rail */}
          <div className="cinema-lb-footer">
            {activeItem.d && (
              <div className="cinema-lb-desc-strip">
                <p>{activeItem.d}</p>
                {activeItem.tags && (
                  <div className="cinema-lb-tag-row">
                    {activeItem.tags.map(t => (
                      <span key={t} className="cinema-lb-tag">
                        <CheckCircle2 size={10} color="var(--gold)" /> {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Thumbnail Navigation Strip */}
            <div className="cinema-lb-filmstrip" ref={filmstripRef} role="tablist" aria-label="Thumbnail Jump Rail">
              {catalog.map((item, idx) => {
                const isActive = idx === currentIndex;
                return (
                  <button
                    key={item.id || item.src}
                    role="tab"
                    aria-selected={isActive}
                    className={`cinema-lb-thumb ${isActive ? 'active' : ''}`}
                    onClick={() => onSelectIndex(idx)}
                    title={item.title}
                  >
                    <img src={item.src} alt={item.title} loading="lazy" />
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

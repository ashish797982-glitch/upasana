import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  RotateCcw, 
  RotateCw, 
  ChevronLeft, 
  ChevronRight, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Search, 
  Eye, 
  ArrowUpRight,
  X,
  ZoomIn,
  ZoomOut,
  MoveHorizontal
} from 'lucide-react';

import clientData from '../clientCatalog.json';

const CATEGORIES = [
  'All Looks',
  'Bridal Couture',
  'Royal Reception',
  'Editorial Glamour',
  'Traditional & Draping',
  'Eye Architecture & SFX',
  'Precision Nails & Detail'
];

export default function RollingGallery({ onSelectLook }) {
  const [selectedCat, setSelectedCat] = useState('All Looks');
  const [searchQuery, setSearchQuery] = useState('');
  const [direction, setDirection] = useState(1);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [tilt, setTilt] = useState({ x: -2, y: 0, z: 0 });
  const [activeModalLook, setActiveModalLook] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  const [currentAngle, setCurrentAngle] = useState(0);
  const angleRef = useRef(0);
  const velocityRef = useRef(0);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const lastXRef = useRef(0);
  const stageRef = useRef(null);
  const audioCtxRef = useRef(null);
  const lastTickCardRef = useRef(-1);

  // TRUE MEDIUM SIZE: compact, ergonomic, fits comfortably in viewport
  const [cardWidth, setCardWidth] = useState(135);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setCardWidth(95);
      } else if (window.innerWidth < 1024) {
        setCardWidth(115);
      } else {
        setCardWidth(135);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const cardHeight = Math.round(cardWidth * 1.42);

  const filteredImages = useMemo(() => {
    return clientData.filter((item) => {
      const matchCat = selectedCat === 'All Looks' || item.cat === selectedCat;
      const matchSearch = searchQuery === '' || 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.cat.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.file.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [selectedCat, searchQuery]);

  const totalCards = filteredImages.length;
  const anglePerCard = totalCards > 0 ? 360 / totalCards : 0;

  // Medium cylinder radius
  const radius = useMemo(() => {
    if (totalCards <= 1) return 320;
    const rad = (cardWidth / 2) / Math.tan(Math.PI / totalCards);
    return Math.max(340, Math.min(1300, Math.round(rad) + 10));
  }, [totalCards, cardWidth]);

  // Audio tick via Web Audio API
  const playTickSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtxRef.current = new AudioContext();
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(840, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(420, ctx.currentTime + 0.035);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.035);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.035);
    } catch (e) {}
  }, [soundEnabled]);

  // Continuous slow, smooth rolling animation:
  // - Obeys its own rolling axis in slow smooth motion (~0.09 deg/frame)
  // - Any visitor can roll/swipe with fingers or mouse cursor
  // - When released, smoothly blends back into its own rolling axis with zero stops
  useEffect(() => {
    let animId;
    const baseSpeed = 0.09 * direction; // Slow, luxurious, continuous pace

    const loop = (stamp) => {
      // Dynamic organic wave along rolling axis for rich 3D life
      const waveX = -2 + Math.sin(stamp * 0.0006) * 1.5;
      const waveZ = Math.cos(stamp * 0.0004) * 1.2;

      if (isDraggingRef.current) {
        // Visitor is actively swiping with finger or dragging with mouse
      } else {
        if (Math.abs(velocityRef.current) > 0.01) {
          // Smooth momentum decay transitioning into autonomous rolling axis
          angleRef.current += velocityRef.current;
          velocityRef.current = velocityRef.current * 0.95 + baseSpeed * 0.05;
        } else {
          // Obeys continuous rolling axis in full slow smooth motion
          angleRef.current += baseSpeed;
        }
      }

      setTilt((prev) => ({
        x: waveX + (prev.userX || 0),
        y: prev.userY || 0,
        z: waveZ
      }));

      // Audio tick trigger
      if (totalCards > 0 && anglePerCard > 0) {
        const normAngle = ((-angleRef.current % 360) + 360) % 360;
        const currentCardIdx = Math.round(normAngle / anglePerCard) % totalCards;
        if (currentCardIdx !== lastTickCardRef.current) {
          lastTickCardRef.current = currentCardIdx;
          playTickSound();
        }
      }

      setCurrentAngle(angleRef.current);
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [direction, totalCards, anglePerCard, playTickSound]);

  // Touch and mouse drag handlers for effortless swiping
  const handlePointerDown = (e) => {
    isDraggingRef.current = true;
    startXRef.current = e.clientX;
    lastXRef.current = e.clientX;
    velocityRef.current = 0;
  };

  const handlePointerMove = (e) => {
    if (!isDraggingRef.current) {
      if (stageRef.current) {
        const rect = stageRef.current.getBoundingClientRect();
        const offsetX = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
        const offsetY = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
        setTilt((t) => ({ ...t, userX: -offsetY * 2, userY: offsetX * 2 }));
      }
      return;
    }
    const currentX = e.clientX;
    const deltaX = currentX - lastXRef.current;
    lastXRef.current = currentX;

    const sensitivity = 0.38; // Direct, instantaneous finger & cursor response
    angleRef.current += deltaX * sensitivity;
    velocityRef.current = deltaX * sensitivity * 0.88;
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  // Wheel tilt / scroll
  const handleWheel = (e) => {
    e.preventDefault();
    const wheelStep = (e.deltaY || e.deltaX) * 0.08;
    angleRef.current -= wheelStep;
    velocityRef.current = -wheelStep * 0.22;
  };

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (activeModalLook) return;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      stepRotate(1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      stepRotate(-1);
    }
  };

  const stepRotate = (dir) => {
    if (totalCards <= 0) return;
    velocityRef.current = dir * anglePerCard * 0.2;
  };

  const handleCardClick = (item, index) => {
    const cardAngle = index * anglePerCard;
    angleRef.current = -cardAngle;
    setCurrentAngle(-cardAngle);
    velocityRef.current = 0;
    setActiveModalLook(item);
    setZoomLevel(1);
  };

  const handleModalNext = (e) => {
    e?.stopPropagation();
    if (!activeModalLook) return;
    const currentIdx = filteredImages.findIndex((it) => it.id === activeModalLook.id);
    const nextIdx = (currentIdx + 1) % filteredImages.length;
    setActiveModalLook(filteredImages[nextIdx]);
    setZoomLevel(1);
  };

  const handleModalPrev = (e) => {
    e?.stopPropagation();
    if (!activeModalLook) return;
    const currentIdx = filteredImages.findIndex((it) => it.id === activeModalLook.id);
    const prevIdx = (currentIdx - 1 + filteredImages.length) % filteredImages.length;
    setActiveModalLook(filteredImages[prevIdx]);
    setZoomLevel(1);
  };

  useEffect(() => {
    const handleModalKeys = (e) => {
      if (!activeModalLook) return;
      if (e.key === 'Escape') setActiveModalLook(null);
      if (e.key === 'ArrowRight') handleModalNext();
      if (e.key === 'ArrowLeft') handleModalPrev();
    };
    window.addEventListener('keydown', handleModalKeys);
    return () => window.removeEventListener('keydown', handleModalKeys);
  }, [activeModalLook, filteredImages]);

  return (
    <section 
      className="rolling-gallery-section"
      id="all-looks"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-label="All Looks 3D Rolling Circular Showcase"
      role="region"
      aria-roledescription="carousel"
    >
      {/* COMPACT SECTION HEADER */}
      <div className="rg-header">
        <div className="rg-title-block">
          <div className="rg-badge-pill">
            <Sparkles size={12} color="var(--gold-light)" />
            <span>ALL LOOKS ARCHIVE • 59 MASTERPIECES IN 3D MOTION</span>
          </div>
          <h2 className="rg-heading">
            <span className="s">All Signature Looks.</span>{' '}
            <span className="g">Rolling 3D Motion.</span>
          </h2>
          <p className="rg-subtitle">
            All 59 authentic client looks rolling in slow, continuous smooth motion. Swipe with your fingers or mouse cursor to roll freely in any direction.
          </p>
        </div>

        {/* CONTROLS (NO PAUSE BUTTON) */}
        <div className="rg-controls-deck">
          <div className="rg-control-group" aria-label="Circular Rolling Controls">
            <button 
              className="rg-icon-btn" 
              onClick={() => stepRotate(1)}
              aria-label="Roll previous look"
              title="Roll Previous (Left Arrow)"
            >
              <ChevronLeft size={15} />
            </button>

            <button 
              className="rg-icon-btn" 
              onClick={() => stepRotate(-1)}
              aria-label="Roll next look"
              title="Roll Next (Right Arrow)"
            >
              <ChevronRight size={15} />
            </button>

            <button 
              className="rg-icon-btn" 
              onClick={() => setDirection((d) => -d)}
              aria-label="Reverse rolling direction"
              title="Reverse Direction"
            >
              {direction === 1 ? <RotateCw size={14} /> : <RotateCcw size={14} />}
            </button>

            <button 
              className={'rg-icon-btn ' + (soundEnabled ? 'active' : '')}
              onClick={() => setSoundEnabled(!soundEnabled)}
              aria-label={soundEnabled ? 'Disable haptic sound' : 'Enable haptic sound'}
              title={soundEnabled ? 'Sound Enabled' : 'Sound Muted'}
            >
              {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
            </button>
          </div>
        </div>
      </div>

      {/* CATEGORY FILTER PILLS & SEARCH */}
      <div className="rg-filter-bar">
        <div className="rg-pills-row" role="tablist" aria-label="Filter Looks By Discipline">
          {CATEGORIES.map((cat) => {
            const count = cat === 'All Looks' 
              ? clientData.length 
              : clientData.filter((i) => i.cat === cat).length;
            const isSelected = selectedCat === cat;
            return (
              <button
                key={cat}
                role="tab"
                aria-selected={isSelected}
                className={'rg-filter-pill ' + (isSelected ? 'active' : '')}
                onClick={() => setSelectedCat(cat)}
              >
                <span>{cat}</span>
                <span className="rg-pill-count">{count}</span>
              </button>
            );
          })}
        </div>

        <div className="rg-search-box">
          <Search size={13} color="var(--muted)" />
          <input 
            type="text" 
            placeholder="Search all 59 looks..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search looks by keyword"
          />
          {searchQuery && (
            <button className="rg-search-clear" onClick={() => setSearchQuery('')} aria-label="Clear search">
              ×
            </button>
          )}
        </div>
      </div>

      {/* 3D CIRCULAR ROLLING STAGE (AUTHENTIC MEDIUM SIZE) */}
      <div 
        className="rg-stage-wrapper"
        ref={stageRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
      >
        <div className="rg-spotlight-top" />
        <div className="rg-spotlight-bottom" />
        
        <div 
          className="rg-pedestal-ring" 
          style={{ 
            width: '600px', 
            height: '600px' 
          }} 
        />

        <div 
          className="rg-cylinder-stage"
          style={{
            perspective: '1000px'
          }}
        >
          {/* CRITICAL 3D FIX: translateZ(-radius - 35px) pushes the ring back so the front card sits at Z=0 (natural medium scale 1.0) instead of expanding into viewer's face */}
          <div 
            className="rg-cylinder-ring"
            style={{
              width: cardWidth + 'px',
              height: cardHeight + 'px',
              transform: 'translateZ(-' + (radius + 35) + 'px) rotateX(' + tilt.x + 'deg) rotateZ(' + tilt.z + 'deg) rotateY(' + currentAngle + 'deg)',
              transition: isDraggingRef.current ? 'none' : 'transform 0.05s ease-out'
            }}
          >
            {filteredImages.map((item, index) => {
              const baseAngle = index * anglePerCard;
              const relAngle = ((baseAngle + currentAngle) % 360 + 540) % 360 - 180;
              const rad = (relAngle * Math.PI) / 180;
              const cosA = Math.cos(rad);
              const isFront = cosA > 0;
              const isCenter = Math.abs(relAngle) < 12;

              // Only render cards that face forward or side for pristine 120fps performance
              if (cosA < -0.1) return null;

              const opacity = cosA > 0.1 ? 0.55 + cosA * 0.45 : Math.max(0.12, 0.55 + cosA * 0.45);
              const scale = isCenter ? 1.05 : 1;

              return (
                <div
                  key={item.id}
                  className={'rg-cylinder-card ' + (isCenter ? 'is-center ' : '') + (isFront ? 'is-front ' : 'is-back ')}
                  style={{
                    width: cardWidth + 'px',
                    height: cardHeight + 'px',
                    transform: 'rotateY(' + baseAngle + 'deg) translateZ(' + radius + 'px) scale(' + scale + ')',
                    opacity: opacity,
                    filter: !isFront ? 'blur(1.2px) brightness(0.68)' : isCenter ? 'brightness(1.08)' : 'none'
                  }}
                  onClick={() => handleCardClick(item, index)}
                  role="button"
                  tabIndex={0}
                  aria-label={'Look ' + (index + 1) + ' of ' + totalCards + ': ' + item.title + ', ' + item.cat + '. Click to inspect.'}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleCardClick(item, index);
                    }
                  }}
                >
                  <div className="rg-card-inner">
                    <img 
                      src={'/images/clients/' + item.file} 
                      alt={item.alt}
                      loading={index < 12 ? 'eager' : 'lazy'}
                      draggable={false}
                    />
                    <div className="rg-card-glass-glow" />
                    
                    <div className="rg-card-overlay">
                      <div className="rg-card-num">
                        #{String(index + 1).padStart(2, '0')} // {item.cat}
                      </div>
                      <h4 className="rg-card-title">{item.title}</h4>
                      <div className="rg-card-inspect-hint">
                        <Eye size={10} /> <span>CINEMA VIEW</span>
                      </div>
                    </div>

                    <div className="rg-card-border" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rg-drag-hint">
          <MoveHorizontal size={12} color="var(--gold)" />
          <span>SWIPE FINGERS OR DRAG CURSOR TO ROLL • CLICK TO ENLARGE</span>
        </div>
      </div>

      {/* ACCESSIBLE LIGHTBOX MODAL */}
      {activeModalLook && (
        <div 
          className="rg-lightbox-backdrop"
          onClick={() => setActiveModalLook(null)}
          role="dialog"
          aria-modal="true"
          aria-label={'Cinema View: ' + activeModalLook.title}
        >
          <div 
            className="rg-lightbox-body"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="rg-lb-toolbar">
              <div className="rg-lb-info">
                <span className="rg-lb-pill">{activeModalLook.cat.toUpperCase()}</span>
                <h3 className="rg-lb-title">{activeModalLook.title}</h3>
                <span className="rg-lb-count">
                  LOOK {filteredImages.findIndex(i => i.id === activeModalLook.id) + 1} OF {filteredImages.length}
                </span>
              </div>

              <div className="rg-lb-actions">
                <button 
                  className="rg-lb-btn"
                  onClick={() => setZoomLevel((z) => (z === 1 ? 1.75 : z === 1.75 ? 2.5 : 1))}
                  title="Toggle Zoom Level (1x / 1.75x / 2.5x)"
                  aria-label="Toggle Zoom"
                >
                  {zoomLevel > 1 ? <ZoomOut size={15} /> : <ZoomIn size={15} />}
                  <span>{zoomLevel}x</span>
                </button>

                <a 
                  className="rg-lb-cta"
                  href="#contact"
                  onClick={() => {
                    setActiveModalLook(null);
                    if (onSelectLook) onSelectLook(activeModalLook.title);
                  }}
                >
                  <span>RESERVE THIS LOOK</span>
                  <ArrowUpRight size={13} />
                </a>

                <button 
                  className="rg-lb-btn rg-lb-close"
                  onClick={() => setActiveModalLook(null)}
                  aria-label="Close lightbox (Esc)"
                  title="Close (Esc)"
                >
                  <X size={17} />
                </button>
              </div>
            </div>

            <div className="rg-lb-viewport">
              <button 
                className="rg-lb-nav rg-lb-nav-prev"
                onClick={handleModalPrev}
                aria-label="Previous client look (Left Arrow)"
                title="Previous Look (Left Arrow)"
              >
                <ChevronLeft size={26} />
              </button>

              <div 
                className="rg-lb-img-container"
                style={{
                  cursor: zoomLevel > 1 ? 'grab' : 'zoom-in'
                }}
                onClick={() => setZoomLevel((z) => (z === 1 ? 1.75 : 1))}
              >
                <img 
                  src={'/images/clients/' + activeModalLook.file} 
                  alt={activeModalLook.alt}
                  style={{
                    transform: 'scale(' + zoomLevel + ')',
                    transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                />
              </div>

              <button 
                className="rg-lb-nav rg-lb-nav-next"
                onClick={handleModalNext}
                aria-label="Next client look (Right Arrow)"
                title="Next Look (Right Arrow)"
              >
                <ChevronRight size={26} />
              </button>
            </div>

            <div className="rg-lb-filmstrip-wrap">
              <div className="rg-lb-filmstrip" role="tablist" aria-label="Thumbnail Strip">
                {filteredImages.map((thumb) => {
                  const isActive = thumb.id === activeModalLook.id;
                  return (
                    <button
                      key={thumb.id}
                      role="tab"
                      aria-selected={isActive}
                      className={'rg-film-thumb ' + (isActive ? 'active' : '')}
                      onClick={() => {
                        setActiveModalLook(thumb);
                        setZoomLevel(1);
                      }}
                      title={thumb.title}
                    >
                      <img src={'/images/clients/' + thumb.file} alt={thumb.title} loading="lazy" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

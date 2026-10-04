import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  RotateCw, 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Grid, 
  CircleDot, 
  Search, 
  Eye, 
  ArrowUpRight,
  X,
  ZoomIn,
  ZoomOut,
  Compass
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
  const [viewMode, setViewMode] = useState('circle'); // circle | grid
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [direction, setDirection] = useState(1);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [tilt, setTilt] = useState({ x: -2, y: 0 });
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

  const [cardWidth, setCardWidth] = useState(210);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setCardWidth(155);
      } else if (window.innerWidth < 1024) {
        setCardWidth(185);
      } else {
        setCardWidth(220);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  const radius = useMemo(() => {
    if (totalCards <= 1) return 400;
    const rad = (cardWidth / 2) / Math.tan(Math.PI / totalCards);
    return Math.max(460, Math.min(2200, Math.round(rad) + 20));
  }, [totalCards, cardWidth]);

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
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } catch (e) {}
  }, [soundEnabled]);

  useEffect(() => {
    let animId;
    let lastStamp = performance.now();

    const loop = (stamp) => {
      const dt = Math.min((stamp - lastStamp) / 1000, 0.1);
      lastStamp = stamp;

      if (!isDraggingRef.current) {
        if (Math.abs(velocityRef.current) > 0.02) {
          angleRef.current += velocityRef.current;
          velocityRef.current *= 0.94;
        } else if (isPlaying) {
          const baseStep = 0.22 * speed * direction;
          angleRef.current += baseStep;
        }
      }

      if (totalCards > 0 && anglePerCard > 0) {
        const normAngle = (( -angleRef.current % 360) + 360) % 360;
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
  }, [isPlaying, speed, direction, totalCards, anglePerCard, playTickSound]);

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
        setTilt({ x: -offsetY * 4 - 2, y: offsetX * 4 });
      }
      return;
    }
    const currentX = e.clientX;
    const deltaX = currentX - lastXRef.current;
    lastXRef.current = currentX;

    const sensitivity = 0.32;
    angleRef.current += deltaX * sensitivity;
    velocityRef.current = deltaX * sensitivity * 0.8;
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e) => {
    if (viewMode !== 'circle') return;
    e.preventDefault();
    const wheelStep = (e.deltaY || e.deltaX) * 0.12;
    angleRef.current -= wheelStep;
    velocityRef.current = -wheelStep * 0.3;
  };

  const handleKeyDown = (e) => {
    if (activeModalLook) return;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      stepRotate(1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      stepRotate(-1);
    } else if (e.key === ' ') {
      e.preventDefault();
      setIsPlaying((p) => !p);
    }
  };

  const stepRotate = (dir) => {
    if (totalCards <= 0) return;
    velocityRef.current = dir * anglePerCard * 0.18;
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
      id="client-showcase"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-label="3D Rolling Circular Client Portfolio"
      role="region"
      aria-roledescription="carousel"
    >
      <div className="rg-header">
        <div className="rg-title-block">
          <div className="rg-badge-pill">
            <Sparkles size={13} color="var(--gold-light)" />
            <span>360° CINEMATIC CLIENT SHOWCASE // 59 MASTERPIECES</span>
          </div>
          <h2 className="rg-heading">
            <span className="s">Authentic Artistry.</span>
            <br />
            <span className="g">Rolling Circular Motion.</span>
          </h2>
          <p className="rg-subtitle">
            Explore Upasana Kumari&apos;s definitive catalog of real bridal transformations, editorial runway, and masterclass looks rolling in high-precision 3D cylindrical animation. Drag to spin, hover to focus, or select any look for 4K cinema inspection.
          </p>
        </div>

        <div className="rg-controls-deck">
          <div className="rg-control-group" role="radiogroup" aria-label="Gallery View Mode">
            <button 
              className={'rg-btn ' + (viewMode === 'circle' ? 'active' : '')}
              onClick={() => setViewMode('circle')}
              aria-label="3D Circular Rolling Animation Mode"
              title="3D Circular Rolling Ring"
            >
              <CircleDot size={14} /> <span>3D Circle Roll</span>
            </button>
            <button 
              className={'rg-btn ' + (viewMode === 'grid' ? 'active' : '')}
              onClick={() => setViewMode('grid')}
              aria-label="Accessible Grid View"
              title="Complete 59-Image Grid"
            >
              <Grid size={14} /> <span>All 59 Grid</span>
            </button>
          </div>

          {viewMode === 'circle' && (
            <div className="rg-control-group" aria-label="Animation Controls">
              <button 
                className="rg-icon-btn" 
                onClick={() => stepRotate(1)}
                aria-label="Rotate previous look"
                title="Rotate Previous (Left Arrow)"
              >
                <ChevronLeft size={16} />
              </button>

              <button 
                className={'rg-icon-btn ' + (isPlaying ? 'active' : '')}
                onClick={() => setIsPlaying(!isPlaying)}
                aria-label={isPlaying ? 'Pause circular rolling animation' : 'Play circular rolling animation'}
                title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
              >
                {isPlaying ? <Pause size={15} /> : <Play size={15} />}
              </button>

              <button 
                className="rg-icon-btn" 
                onClick={() => stepRotate(-1)}
                aria-label="Rotate next look"
                title="Rotate Next (Right Arrow)"
              >
                <ChevronRight size={16} />
              </button>

              <button 
                className="rg-icon-btn" 
                onClick={() => setDirection((d) => -d)}
                aria-label="Reverse rotation direction"
                title="Reverse Direction"
              >
                {direction === 1 ? <RotateCw size={15} /> : <RotateCcw size={15} />}
              </button>

              <button 
                className={'rg-icon-btn ' + (soundEnabled ? 'active' : '')}
                onClick={() => setSoundEnabled(!soundEnabled)}
                aria-label={soundEnabled ? 'Disable haptic audio tick' : 'Enable haptic audio tick'}
                title={soundEnabled ? 'Sound Enabled' : 'Sound Muted'}
              >
                {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
              </button>

              <div className="rg-speed-selector">
                {[0.5, 1, 2].map((s) => (
                  <button 
                    key={s}
                    className={'rg-speed-chip ' + (speed === s ? 'active' : '')}
                    onClick={() => setSpeed(s)}
                    aria-label={'Speed ' + s + 'x'}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="rg-filter-bar">
        <div className="rg-pills-row" role="tablist" aria-label="Filter By Artistry Discipline">
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
          <Search size={14} color="var(--muted)" />
          <input 
            type="text" 
            placeholder="Search 59 looks (e.g. Kundan, Velvet, SFX)..." 
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

      {viewMode === 'circle' && (
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
              width: Math.min(radius * 1.85, 1400) + 'px', 
              height: Math.min(radius * 1.85, 1400) + 'px' 
            }} 
          />

          <div 
            className="rg-cylinder-stage"
            style={{
              perspective: Math.max(1200, radius * 1.4) + 'px'
            }}
          >
            <div 
              className="rg-cylinder-ring"
              style={{
                transform: 'rotateX(' + tilt.x + 'deg) rotateY(' + currentAngle + 'deg)',
                transition: isDraggingRef.current ? 'none' : 'transform 0.08s ease-out'
              }}
            >
              {filteredImages.map((item, index) => {
                const baseAngle = index * anglePerCard;
                const relAngle = ((baseAngle + currentAngle) % 360 + 540) % 360 - 180;
                const rad = (relAngle * Math.PI) / 180;
                const cosA = Math.cos(rad);
                const isFront = cosA > 0;
                const isCenter = Math.abs(relAngle) < 14;

                const opacity = cosA > 0.1 ? 0.45 + cosA * 0.55 : Math.max(0.12, 0.45 + cosA * 0.45);
                const scale = isCenter ? 1.08 : 1;

                return (
                  <div
                    key={item.id}
                    className={'rg-cylinder-card ' + (isCenter ? 'is-center ' : '') + (isFront ? 'is-front ' : 'is-back ')}
                    style={{
                      width: cardWidth + 'px',
                      transform: 'rotateY(' + baseAngle + 'deg) translateZ(' + radius + 'px) scale(' + scale + ')',
                      opacity: opacity,
                      filter: !isFront ? 'blur(1.5px) brightness(0.6)' : isCenter ? 'brightness(1.1)' : 'none'
                    }}
                    onClick={() => handleCardClick(item, index)}
                    role="button"
                    tabIndex={0}
                    aria-label={'Look ' + (index + 1) + ' of ' + totalCards + ': ' + item.title + ', ' + item.cat + '. Click to enlarge look.'}
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
                          <Eye size={12} /> <span>CINEMA VIEW</span>
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
            <Compass size={13} color="var(--gold)" />
            <span>DRAG OR SWIPE TO ROLL CIRCLE • SCROLL TO TILT • CLICK LOOK TO INSPECT</span>
          </div>
        </div>
      )}

      {viewMode === 'grid' && (
        <div className="rg-grid-container" role="region" aria-label="Complete 59 Looks Grid">
          <div className="rg-grid-header">
            <span className="lbl">// ARCHIVE CATALOG</span>
            <span style={{ color: 'var(--muted)', fontSize: 13 }}>
              Showing {filteredImages.length} Curated Looks
            </span>
          </div>

          <div className="rg-grid">
            {filteredImages.map((item, idx) => (
              <div 
                key={item.id}
                className="rg-grid-card"
                onClick={() => {
                  setActiveModalLook(item);
                  setZoomLevel(1);
                }}
                role="button"
                tabIndex={0}
                aria-label={item.title + ' - ' + item.cat}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setActiveModalLook(item);
                    setZoomLevel(1);
                  }
                }}
              >
                <div className="rg-grid-img-wrap">
                  <img 
                    src={'/images/clients/' + item.file} 
                    alt={item.alt} 
                    loading="lazy" 
                  />
                  <div className="rg-grid-overlay">
                    <span className="rg-grid-badge">#{String(idx + 1).padStart(2, '0')}</span>
                    <div>
                      <div className="rg-grid-cat">{item.cat}</div>
                      <div className="rg-grid-title">{item.title}</div>
                    </div>
                    <div className="rg-grid-expand"><Maximize2 size={14} /></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
                  {zoomLevel > 1 ? <ZoomOut size={16} /> : <ZoomIn size={16} />}
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
                  <ArrowUpRight size={14} />
                </a>

                <button 
                  className="rg-lb-btn rg-lb-close"
                  onClick={() => setActiveModalLook(null)}
                  aria-label="Close lightbox (Esc)"
                  title="Close (Esc)"
                >
                  <X size={18} />
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
                <ChevronLeft size={28} />
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
                <ChevronRight size={28} />
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

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

export default function RollingGallery({ onOpenLightbox }) {
  const [selectedCat, setSelectedCat] = useState('All Looks');
  const [searchQuery, setSearchQuery] = useState('');
  const [direction, setDirection] = useState(1);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [tilt, setTilt] = useState({ x: -2.2, y: 0, z: 0 });

  const [currentAngle, setCurrentAngle] = useState(0);
  const angleRef = useRef(0);
  const velocityRef = useRef(0);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const lastXRef = useRef(0);
  const stageRef = useRef(null);
  const audioCtxRef = useRef(null);
  const lastTickCardRef = useRef(-1);
  const railRef = useRef(null);

  // SIGHTLY BIGGER MEDIUM SIZE: 195px x 280px (Desktop), clear, rich, prominent
  const [cardWidth, setCardWidth] = useState(195);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setCardWidth(130);
      } else if (window.innerWidth < 1024) {
        setCardWidth(160);
      } else {
        setCardWidth(195);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const cardHeight = Math.round(cardWidth * 1.44);

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
    if (totalCards <= 1) return 420;
    const rad = (cardWidth / 2) / Math.tan(Math.PI / totalCards);
    return Math.max(440, Math.min(1700, Math.round(rad) + 12));
  }, [totalCards, cardWidth]);

  // Current centered look index in real-time
  const centeredIdx = useMemo(() => {
    if (totalCards <= 0 || anglePerCard <= 0) return 0;
    const normAngle = ((-currentAngle % 360) + 360) % 360;
    return Math.round(normAngle / anglePerCard) % totalCards;
  }, [currentAngle, anglePerCard, totalCards]);

  useEffect(() => {
    if (railRef.current) {
      const activeEl = railRef.current.children[centeredIdx];
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [centeredIdx]);

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
      osc.frequency.setValueAtTime(860, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(430, ctx.currentTime + 0.038);
      gain.gain.setValueAtTime(0.045, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.038);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.038);
    } catch (e) {}
  }, [soundEnabled]);

  // Continuous slow, smooth rolling animation with organic 3D wave
  useEffect(() => {
    let animId;
    const baseSpeed = 0.088 * direction;

    const loop = (stamp) => {
      const waveX = -2.2 + Math.sin(stamp * 0.0006) * 1.6;
      const waveZ = Math.cos(stamp * 0.0004) * 1.3;

      if (!isDraggingRef.current) {
        if (Math.abs(velocityRef.current) > 0.01) {
          angleRef.current += velocityRef.current;
          velocityRef.current = velocityRef.current * 0.95 + baseSpeed * 0.05;
        } else {
          angleRef.current += baseSpeed;
        }
      }

      setTilt((prev) => ({
        x: waveX + (prev.userX || 0),
        y: prev.userY || 0,
        z: waveZ
      }));

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
        setTilt((t) => ({ ...t, userX: -offsetY * 2.2, userY: offsetX * 2.2 }));
      }
      return;
    }
    const currentX = e.clientX;
    const deltaX = currentX - lastXRef.current;
    lastXRef.current = currentX;

    const sensitivity = 0.38;
    angleRef.current += deltaX * sensitivity;
    velocityRef.current = deltaX * sensitivity * 0.88;
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

    // Wheel scroll: only rotates on horizontal delta or shift+wheel, letting normal vertical scroll pass to page
  const handleWheel = (e) => {
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY) || e.shiftKey) {
      const step = (e.deltaX || e.deltaY) * 0.08;
      angleRef.current -= step;
      velocityRef.current = -step * 0.22;
    }
  };

  const handleKeyDown = (e) => {
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
    velocityRef.current = dir * anglePerCard * 0.22;
  };

  const rotateToLook = (index) => {
    const cardAngle = index * anglePerCard;
    angleRef.current = -cardAngle;
    setCurrentAngle(-cardAngle);
    velocityRef.current = 0;
  };

  const handleCardClick = (item, index) => {
    rotateToLook(index);
    if (onOpenLightbox) {
      onOpenLightbox({
        id: item.id,
        src: '/images/clients/' + item.file,
        title: item.title,
        cat: item.cat
      });
    }
  };

  const currentLook = filteredImages[centeredIdx];

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
      <div className="rg-header">
        <div className="rg-title-block">
          <div className="rg-badge-pill">
            <Sparkles size={13} color="var(--gold-light)" />
            <span>ALL LOOKS ARCHIVE • 59 MASTERPIECES IN 3D MOTION</span>
          </div>
          <h2 className="rg-heading">
            <span className="s">All Signature Looks.</span>{' '}
            <span className="g">Rolling 3D Motion.</span>
          </h2>
          <p className="rg-subtitle">
            All 59 authentic client looks rolling in slow, continuous smooth motion. Anyone can swipe with fingers, drag with cursor, or click the side navigation arrows and thumbnails below to inspect in high-definition cinema view.
          </p>
        </div>

        <div className="rg-controls-deck">
          <div className="rg-control-group" aria-label="Circular Rolling Controls">
            <button 
              className="rg-icon-btn" 
              onClick={() => stepRotate(1)}
              aria-label="Roll previous look"
              title="Roll Previous (Left Arrow)"
            >
              <ChevronLeft size={16} />
            </button>

            <button 
              className="rg-icon-btn" 
              onClick={() => stepRotate(-1)}
              aria-label="Roll next look"
              title="Roll Next (Right Arrow)"
            >
              <ChevronRight size={16} />
            </button>

            <button 
              className="rg-icon-btn" 
              onClick={() => setDirection((d) => -d)}
              aria-label="Reverse rolling direction"
              title="Reverse Direction"
            >
              {direction === 1 ? <RotateCw size={15} /> : <RotateCcw size={15} />}
            </button>

            <button 
              className={'rg-icon-btn ' + (soundEnabled ? 'active' : '')}
              onClick={() => setSoundEnabled(!soundEnabled)}
              aria-label={soundEnabled ? 'Disable haptic sound' : 'Enable haptic sound'}
              title={soundEnabled ? 'Sound Enabled' : 'Sound Muted'}
            >
              {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
            </button>
          </div>
        </div>
      </div>

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
          <Search size={14} color="var(--muted)" />
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
        
        <button 
          className="rg-stage-nav rg-stage-nav-prev" 
          onClick={(e) => { e.stopPropagation(); stepRotate(1); }}
          aria-label="Previous Look"
          title="Previous Look (Left Arrow)"
        >
          <ChevronLeft size={24} />
        </button>

        <button 
          className="rg-stage-nav rg-stage-nav-next" 
          onClick={(e) => { e.stopPropagation(); stepRotate(-1); }}
          aria-label="Next Look"
          title="Next Look (Right Arrow)"
        >
          <ChevronRight size={24} />
        </button>

        <div className="rg-pedestal-outer" />
        <div className="rg-pedestal-ring" />

        <div 
          className="rg-cylinder-stage"
          style={{
            perspective: '1100px'
          }}
        >
          <div 
            className="rg-cylinder-ring"
            style={{
              width: cardWidth + 'px',
              height: cardHeight + 'px',
              transform: 'translateZ(-' + (radius + 42) + 'px) rotateX(' + tilt.x + 'deg) rotateZ(' + tilt.z + 'deg) rotateY(' + currentAngle + 'deg)',
              transition: isDraggingRef.current ? 'none' : 'transform 0.05s ease-out'
            }}
          >
            {filteredImages.map((item, index) => {
              const baseAngle = index * anglePerCard;
              const relAngle = ((baseAngle + currentAngle) % 360 + 540) % 360 - 180;
              const rad = (relAngle * Math.PI) / 180;
              const cosA = Math.cos(rad);
              const isFront = cosA > 0;
              const isCenter = Math.abs(relAngle) < 14;

              if (cosA < -0.15) return null;

              const opacity = cosA > 0.1 ? 0.6 + cosA * 0.4 : Math.max(0.12, 0.6 + cosA * 0.4);
              const scale = isCenter ? 1.07 : 1;

              return (
                <div
                  key={item.id}
                  className={'rg-cylinder-card ' + (isCenter ? 'is-center ' : '') + (isFront ? 'is-front ' : 'is-back ')}
                  style={{
                    width: cardWidth + 'px',
                    height: cardHeight + 'px',
                    transform: 'rotateY(' + baseAngle + 'deg) translateZ(' + radius + 'px) scale(' + scale + ')',
                    opacity: opacity,
                    filter: !isFront ? 'blur(1.4px) brightness(0.66)' : isCenter ? 'brightness(1.1)' : 'none'
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
                    <div className="rg-card-shimmer-sweep" />
                    
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
          <MoveHorizontal size={13} color="var(--gold)" />
          <span>SWIPE FINGERS OR DRAG CURSOR TO ROLL • CLICK TO ENLARGE</span>
        </div>
      </div>

      <div className="rg-bottom-rail">
        <div className="rg-rail-header">
          <div className="rg-active-indicator">
            <span className="live-dot" />
            <span>
              LOOK {centeredIdx + 1} OF {totalCards} {currentLook ? '— ' + currentLook.title.toUpperCase() : ''}
            </span>
          </div>
          <span style={{ fontSize: 10, letterSpacing: '0.14em' }}>
            CLICK ANY LOOK BELOW TO GLIDE DIRECTLY TO IT
          </span>
        </div>

        <div className="rg-rail-strip" ref={railRef} role="tablist" aria-label="Quick jump look strip">
          {filteredImages.map((thumb, idx) => {
            const isActive = idx === centeredIdx;
            return (
              <button
                key={thumb.id}
                role="tab"
                aria-selected={isActive}
                className={'rg-rail-thumb ' + (isActive ? 'active' : '')}
                onClick={() => rotateToLook(idx)}
                title={thumb.title}
              >
                <img src={'/images/clients/' + thumb.file} alt={thumb.title} loading="lazy" />
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

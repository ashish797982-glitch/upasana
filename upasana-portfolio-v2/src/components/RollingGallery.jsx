
import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from 'react';

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
  MoveHorizontal,
  Play,
  Pause,
} from 'lucide-react';

import clientData from '../clientCatalog.json';

const CATEGORIES = [
  'All Looks',
  'Bridal Couture',
  'Royal Reception',
  'Editorial Glamour',
  'Traditional & Draping',
  'Eye Architecture & SFX',
  'Precision Nails & Detail',
];

const CARD_WIDTH = 346;
const CARD_HEIGHT = 524;
const RADIUS = 1150;
const ANGLE_STEP = 18.5;
const MOMENTUM_DECAY = 0.94;
const DRAG_SENSITIVITY = 0.28;

export default function RollingGallery({ onOpenLightbox }) {
  const [selectedCat, setSelectedCat] = useState('All Looks');
  const [searchQuery, setSearchQuery] = useState('');
  const [direction, setDirection] = useState(1);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [currentAngle, setCurrentAngle] = useState(0);

  const [bgImage, setBgImage] = useState('');
  const [prevBgImage, setPrevBgImage] = useState('');
  const [bgFading, setBgFading] = useState(false);

  const angleRef = useRef(0);
  const velocityRef = useRef(0);
  const isDraggingRef = useRef(false);
  const isHoveredRef = useRef(false);
  const hasMovedRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const lastXRef = useRef(0);
  const activePointerRef = useRef(null);

  const stageRef = useRef(null);
  const railRef = useRef(null);
  const audioCtxRef = useRef(null);
  const lastTickCardRef = useRef(-1);
  const animationFrameRef = useRef(null);
  const bgTimerRef = useRef(null);

  // Mutable animation settings: changing these does not restart RAF.
  const playingRef = useRef(isPlaying);
  const directionRef = useRef(direction);
  const speedRef = useRef(speedMultiplier);
  const soundEnabledRef = useRef(soundEnabled);
  const onOpenLightboxRef = useRef(onOpenLightbox);

  playingRef.current = isPlaying;
  directionRef.current = direction;
  speedRef.current = speedMultiplier;
  soundEnabledRef.current = soundEnabled;
  onOpenLightboxRef.current = onOpenLightbox;

  const filteredImages = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return clientData.filter((item) => {
      const matchesCategory =
        selectedCat === 'All Looks' || item.cat === selectedCat;

      const matchesSearch =
        !query ||
        (item.title || '').toLowerCase().includes(query) ||
        (item.cat || '').toLowerCase().includes(query) ||
        (item.file || '').toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [selectedCat, searchQuery]);

  const totalCards = filteredImages.length;
  const totalSpan = totalCards > 0 ? totalCards * ANGLE_STEP : 360;

  // Keep current data available to the animation loop.
  const galleryDataRef = useRef({ totalCards, totalSpan });
  galleryDataRef.current = { totalCards, totalSpan };

  const normalizedIndex = useCallback(
    (angle) => {
      if (totalCards === 0) return 0;

      const normalized =
        ((-angle % totalSpan) + totalSpan) % totalSpan;

      return Math.round(normalized / ANGLE_STEP) % totalCards;
    },
    [totalCards, totalSpan]
  );

  const centeredIdx = normalizedIndex(currentAngle);
  const currentLook = filteredImages[centeredIdx];

  // Keep the cinematic background synchronized with the active look.
  useEffect(() => {
    if (!currentLook?.file) {
      setBgImage('');
      setPrevBgImage('');
      setBgFading(false);
      return;
    }

    const nextImage = `/images/clients/${currentLook.file}`;

    setBgImage((previousImage) => {
      if (previousImage === nextImage) return previousImage;

      setPrevBgImage(previousImage);
      setBgFading(true);

      if (bgTimerRef.current) {
        clearTimeout(bgTimerRef.current);
      }

      bgTimerRef.current = setTimeout(() => {
        setBgFading(false);
        setPrevBgImage('');
        bgTimerRef.current = null;
      }, 700);

      return nextImage;
    });
  }, [currentLook?.file]);

  // IMPORTANT:
  // Do not call scrollIntoView() when the active card changes.
  // That can scroll the entire document instead of just the thumbnail rail.
  //
  // The thumbnail rail is intentionally left under user control.

  const playTickSound = useCallback(() => {
    if (!soundEnabledRef.current) return;

    try {
      const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;

      if (!AudioContextClass) return;

      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContextClass();
      }

      const ctx = audioCtxRef.current;

      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(860, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(
        430,
        ctx.currentTime + 0.038
      );

      gain.gain.setValueAtTime(0.035, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + 0.038
      );

      oscillator.connect(gain);
      gain.connect(ctx.destination);

      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.04);
    } catch {
      // Audio is optional. A blocked audio context must not break the gallery.
    }
  }, []);

  // One animation loop for the component's lifetime.
  // Paused galleries no longer trigger needless React updates every frame.
  useEffect(() => {
    let previousTimestamp = 0;

    const loop = (timestamp) => {
      const elapsed = previousTimestamp
        ? Math.min((timestamp - previousTimestamp) / 16.667, 2)
        : 1;

      previousTimestamp = timestamp;

      const { totalCards: count, totalSpan: span } =
        galleryDataRef.current;

      const wasDragging = isDraggingRef.current;
      const previousAngle = angleRef.current;

      if (!wasDragging) {
        if (Math.abs(velocityRef.current) > 0.005) {
          angleRef.current += velocityRef.current * elapsed;
          velocityRef.current *= Math.pow(MOMENTUM_DECAY, elapsed);

          if (Math.abs(velocityRef.current) < 0.005) {
            velocityRef.current = 0;
          }
        } else if (playingRef.current) {
          const hoverFactor = isHoveredRef.current ? 0.25 : 1;

          angleRef.current +=
            0.062 *
            directionRef.current *
            speedRef.current *
            hoverFactor *
            elapsed;
        }
      }

      // Sound triggers only when the active card changes.
      if (count > 0 && span > 0) {
        const normalized =
          ((-angleRef.current % span) + span) % span;

        const activeIndex =
          Math.round(normalized / ANGLE_STEP) % count;

        if (activeIndex !== lastTickCardRef.current) {
          lastTickCardRef.current = activeIndex;
          playTickSound();
        }
      } else {
        lastTickCardRef.current = -1;
      }

      // Avoid React state updates when the angle hasn't changed.
      if (Math.abs(angleRef.current - previousAngle) > 0.0001) {
        setCurrentAngle(angleRef.current);
      }

      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      animationFrameRef.current = null;
      previousTimestamp = 0;
    };
  }, [playTickSound]);

  // Clean up timers and audio resources on unmount.
  useEffect(() => {
    return () => {
      if (bgTimerRef.current) {
        clearTimeout(bgTimerRef.current);
      }

      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
    };
  }, []);

  const stepRotate = useCallback(
    (dir) => {
      if (totalCards <= 0) return;

      const currentStep = Math.round(-angleRef.current / ANGLE_STEP);
      const targetStep = currentStep - dir;
      const targetAngle = -(targetStep * ANGLE_STEP);

      velocityRef.current = (targetAngle - angleRef.current) * 0.18;
    },
    [totalCards]
  );

  const rotateToLook = useCallback(
    (index) => {
      if (totalCards <= 0) return;

      const targetNormAngle = index * ANGLE_STEP;

      const currentNorm =
        ((-angleRef.current % totalSpan) + totalSpan) % totalSpan;

      let diff = targetNormAngle - currentNorm;

      if (diff > totalSpan / 2) diff -= totalSpan;
      if (diff < -totalSpan / 2) diff += totalSpan;

      const targetAngle = angleRef.current - diff;

      velocityRef.current = (targetAngle - angleRef.current) * 0.22;
    },
    [totalCards, totalSpan]
  );

  const handlePointerDown = (event) => {
    if (!event.isPrimary || event.button !== 0) return;

    isDraggingRef.current = true;
    hasMovedRef.current = false;
    activePointerRef.current = event.pointerId;

    dragStartRef.current = {
      x: event.clientX,
      y: event.clientY,
    };

    lastXRef.current = event.clientX;
    velocityRef.current = 0;

    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Pointer capture may be unavailable in some browser states.
    }
  };

  const handlePointerMove = (event) => {
    if (
      !isDraggingRef.current ||
      activePointerRef.current !== event.pointerId
    ) {
      return;
    }

    const deltaX = event.clientX - lastXRef.current;
    lastXRef.current = event.clientX;

    const totalDragX = event.clientX - dragStartRef.current.x;
    const totalDragY = event.clientY - dragStartRef.current.y;

    if (Math.abs(totalDragX) > 6 || Math.abs(totalDragY) > 6) {
      hasMovedRef.current = true;
    }

    if (hasMovedRef.current) {
      angleRef.current += deltaX * DRAG_SENSITIVITY;
      velocityRef.current = deltaX * DRAG_SENSITIVITY * 0.85;
    }
  };

  const finishPointer = (event) => {
    if (activePointerRef.current !== event.pointerId) return;

    isDraggingRef.current = false;
    activePointerRef.current = null;

    try {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    } catch {
      // The pointer may already have been released.
    }
  };

  const handleWheel = (event) => {
    // Preserve ordinary vertical page scrolling.
    // Only horizontal gestures rotate the gallery.
    const isHorizontalGesture =
      Math.abs(event.deltaX) > Math.abs(event.deltaY) ||
      event.shiftKey;

    if (!isHorizontalGesture) return;

    if (event.cancelable) {
      event.preventDefault();
    }

    const delta = event.shiftKey ? event.deltaY : event.deltaX;
    const step = delta * 0.08;

    angleRef.current -= step;
    velocityRef.current = -step * 0.2;
  };

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      stepRotate(1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      stepRotate(-1);
    } else if (
      event.key === ' ' &&
      event.target === event.currentTarget
    ) {
      event.preventDefault();
      setIsPlaying((playing) => !playing);
    }
  };

  const handleCardClick = (event, item) => {
    event.stopPropagation();

    if (hasMovedRef.current) return;

    if (onOpenLightboxRef.current) {
      onOpenLightboxRef.current({
        id: item.id,
        src: `/images/clients/${item.file}`,
        title: item.title,
        cat: item.cat,
      });
    }
  };

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
      <div className="rg-cinematic-backdrop" aria-hidden="true">
        {prevBgImage && (
          <div
            className="rg-backdrop-layer rg-backdrop-prev"
            style={{ backgroundImage: `url(${prevBgImage})` }}
          />
        )}

        {bgImage && (
          <div
            className={`rg-backdrop-layer rg-backdrop-curr ${
              bgFading ? 'is-fading' : ''
            }`}
            style={{ backgroundImage: `url(${bgImage})` }}
          />
        )}

        <div className="rg-backdrop-vignette" />
        <div className="rg-backdrop-glow-center" />
        <div className="rg-backdrop-anamorphic-beam" />
        <div className="rg-backdrop-dust" />
      </div>

      <div className="rg-header">
        <div className="rg-title-block">
          <div className="rg-badge-pill">
            <Sparkles size={13} color="var(--gold-light)" />
            <span>
              ALL LOOKS ARCHIVE • {clientData.length} MASTERPIECES
            </span>
          </div>

          <h2 className="rg-heading">
            <span className="s">All Signature Looks.</span>{' '}
            <span className="g">Rolling 3D Motion.</span>
          </h2>

          <p className="rg-subtitle">
            Explore the complete collection of client looks in continuous
            3D motion. Select any picture to open the high-definition view.
          </p>
        </div>

        <div className="rg-controls-deck">
          <div
            className="rg-control-group"
            aria-label="Circular Rolling Controls"
          >
            <button
              type="button"
              className={`rg-icon-btn ${isPlaying ? 'active' : ''}`}
              onClick={() => setIsPlaying((playing) => !playing)}
              aria-label={isPlaying ? 'Pause rolling' : 'Resume rolling'}
              title={isPlaying ? 'Pause Rolling (Space)' : 'Play Rolling (Space)'}
            >
              {isPlaying ? <Pause size={15} /> : <Play size={15} />}
            </button>

            <button
              type="button"
              className="rg-icon-btn"
              onClick={() => stepRotate(1)}
              aria-label="Roll previous look"
              title="Roll Previous (Left Arrow)"
            >
              <ChevronLeft size={16} />
            </button>

            <button
              type="button"
              className="rg-icon-btn"
              onClick={() => stepRotate(-1)}
              aria-label="Roll next look"
              title="Roll Next (Right Arrow)"
            >
              <ChevronRight size={16} />
            </button>

            <button
              type="button"
              className="rg-icon-btn"
              onClick={() => setDirection((value) => -value)}
              aria-label="Reverse rolling direction"
              title="Reverse Direction"
            >
              {direction === 1 ? (
                <RotateCw size={15} />
              ) : (
                <RotateCcw size={15} />
              )}
            </button>

            <div className="rg-speed-selector" aria-label="Speed selector">
              {[
                { label: '0.6x', val: 0.6, title: 'Cinematic' },
                { label: '1.0x', val: 1, title: 'Normal' },
                { label: '1.6x', val: 1.6, title: 'Fast' },
              ].map((speed) => (
                <button
                  type="button"
                  key={speed.label}
                  className={`rg-speed-chip ${
                    speedMultiplier === speed.val ? 'active' : ''
                  }`}
                  onClick={() => setSpeedMultiplier(speed.val)}
                  title={speed.title}
                  aria-pressed={speedMultiplier === speed.val}
                >
                  {speed.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              className={`rg-icon-btn ${soundEnabled ? 'active' : ''}`}
              onClick={() => setSoundEnabled((enabled) => !enabled)}
              aria-label={soundEnabled ? 'Disable sound' : 'Enable sound'}
              title={soundEnabled ? 'Sound Enabled' : 'Sound Muted'}
            >
              {soundEnabled ? (
                <Volume2 size={15} />
              ) : (
                <VolumeX size={15} />
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="rg-filter-bar">
        <div
          className="rg-pills-row"
          role="tablist"
          aria-label="Filter Looks By Discipline"
        >
          {CATEGORIES.map((category) => {
            const count =
              category === 'All Looks'
                ? clientData.length
                : clientData.filter((item) => item.cat === category).length;

            const selected = selectedCat === category;

            return (
              <button
                type="button"
                key={category}
                role="tab"
                aria-selected={selected}
                className={`rg-filter-pill ${selected ? 'active' : ''}`}
                onClick={() => setSelectedCat(category)}
              >
                <span>{category}</span>
                <span className="rg-pill-count">{count}</span>
              </button>
            );
          })}
        </div>

        <div className="rg-search-box">
          <Search size={14} color="var(--muted)" />

          <input
            type="text"
            placeholder="Search looks..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            aria-label="Search looks by keyword"
          />

          {searchQuery && (
            <button
              type="button"
              className="rg-search-clear"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {totalCards === 0 ? (
        <div className="rg-empty-state" role="status">
          No looks match your search. Try another keyword or category.
        </div>
      ) : (
        <>
          <div
            className="rg-stage-wrapper"
            ref={stageRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={finishPointer}
            onPointerCancel={finishPointer}
            onWheel={handleWheel}
            onMouseEnter={() => {
              isHoveredRef.current = true;
            }}
            onMouseLeave={() => {
              isHoveredRef.current = false;
            }}
          >
            <div className="rg-spotlight-top" />
            <div className="rg-spotlight-bottom" />

            <button
              type="button"
              className="rg-stage-nav rg-stage-nav-prev"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                stepRotate(1);
              }}
              aria-label="Previous Look"
              title="Previous Look"
            >
              <ChevronLeft size={24} />
            </button>

            <button
              type="button"
              className="rg-stage-nav rg-stage-nav-next"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                stepRotate(-1);
              }}
              aria-label="Next Look"
              title="Next Look"
            >
              <ChevronRight size={24} />
            </button>

            <div className="rg-pedestal-ring" />
            <div className="rg-pedestal-inner-ring" />

            <div
              className="rg-cylinder-stage"
              style={{ perspective: '1400px' }}
            >
              <div
                className="rg-cylinder-ring"
                style={{
                  width: `${CARD_WIDTH}px`,
                  height: `${CARD_HEIGHT}px`,
                  transform: `translateZ(-${RADIUS}px)`,
                  transition: 'none',
                }}
              >
                {filteredImages.map((item, index) => {
                  const baseAngle = index * ANGLE_STEP;

                  let relativeAngle =
                    ((baseAngle + currentAngle) % totalSpan + totalSpan) %
                    totalSpan;

                  if (relativeAngle > totalSpan / 2) {
                    relativeAngle -= totalSpan;
                  }

                  // Render only cards on the visible arc.
                  if (Math.abs(relativeAngle) > 78) return null;

                  const radians = (relativeAngle * Math.PI) / 180;
                  const cosine = Math.cos(radians);
                  const isCenter = Math.abs(relativeAngle) < 9.25;

                  const scale = isCenter
                    ? 1.05
                    : Math.max(0.8, 1 - (1 - cosine) * 0.35);

                  const opacity = Math.max(0.25, cosine * 1.25);

                  const blur = isCenter
                    ? 0
                    : Math.min(2.5, (1 - cosine) * 4).toFixed(1);

                  const brightness = isCenter
                    ? 1.08
                    : (0.72 + cosine * 0.28).toFixed(2);

                  const zIndex = isCenter ? 60 : Math.round(cosine * 40);

                  return (
                    <div
                      key={item.id}
                      className={`rg-cylinder-card ${
                        isCenter ? 'is-center' : ''
                      }`}
                      style={{
                        width: `${CARD_WIDTH}px`,
                        height: `${CARD_HEIGHT}px`,
                        transform: `rotateY(${relativeAngle}deg) translateZ(${RADIUS}px) scale(${scale})`,
                        opacity,
                        filter: `blur(${blur}px) brightness(${brightness})`,
                        zIndex,
                      }}
                      onClick={(event) => handleCardClick(event, item)}
                      role="button"
                      tabIndex={0}
                      aria-label={`Look ${index + 1} of ${totalCards}: ${item.title}. Open large view.`}
                      onKeyDown={(event) => {
                        if (
                          event.key === 'Enter' ||
                          event.key === ' '
                        ) {
                          event.preventDefault();
                          handleCardClick(event, item);
                        }
                      }}
                    >
                      <div className="rg-card-inner">
                        <img
                          src={`/images/clients/${item.file}`}
                          alt={item.alt || item.title}
                          loading={index < 12 ? 'eager' : 'lazy'}
                          decoding="async"
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
                            <Eye size={12} />
                            <span>CLICK FOR LARGE VIEW</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rg-drag-hint">
              <MoveHorizontal size={13} color="var(--gold)" />
              <span>DRAG TO ROLL • CLICK ANY PICTURE FOR LARGE VIEW</span>
            </div>
          </div>

          <div className="rg-bottom-rail">
            <div className="rg-rail-header">
              <div className="rg-active-indicator">
                <span className="live-dot" />
                <span>
                  LOOK {centeredIdx + 1} OF {totalCards}
                  {currentLook
                    ? ` — ${currentLook.title.toUpperCase()}`
                    : ''}
                </span>
              </div>

              <span style={{ fontSize: 10, letterSpacing: '0.14em' }}>
                SELECT A THUMBNAIL TO NAVIGATE
              </span>
            </div>

            <div
              className="rg-rail-strip"
              ref={railRef}
              role="tablist"
              aria-label="Quick jump look strip"
            >
              {filteredImages.map((thumbnail, index) => {
                const active = index === centeredIdx;

                return (
                  <button
                    type="button"
                    key={thumbnail.id}
                    role="tab"
                    aria-selected={active}
                    className={`rg-rail-thumb ${active ? 'active' : ''}`}
                    onClick={() => rotateToLook(index)}
                    title={`Look ${index + 1}: ${thumbnail.title}`}
                  >
                    <img
                      src={`/images/clients/${thumbnail.file}`}
                      alt={thumbnail.title}
                      loading="lazy"
                      decoding="async"
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </section>
  );
}

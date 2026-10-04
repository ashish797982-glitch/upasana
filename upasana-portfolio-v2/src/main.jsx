import React, { useEffect, useRef, useState, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Sparkles, 
  Eye, 
  X, 
  Send, 
  Compass, 
  CheckCircle2, 
  Heart,
  Instagram,
  Mail,
  Phone,
  Play,
  Pause,
  Award,
  Trophy
} from 'lucide-react';
import './styles.css';
import RollingGallery from './components/RollingGallery';

gsap.registerPlugin(ScrollTrigger);

/* ==========================================================================
   PORTFOLIO DATA & CONTENT
   ========================================================================== */
const NAME = 'Upasana Kumari';
const NAV = ['About', 'Work', 'All Looks', 'Skills', 'Journey', 'Contact'];

const STATS = [
  { val: '150+', label: 'Looks Curated', detail: 'Bridal & High Fashion' },
  { val: '5+', label: 'Years Artistry', detail: 'UK International Certified' },
  { val: '100%', label: 'Bespoke Design', detail: 'Tailored Feature Analysis' },
  { val: '24K', label: 'Golden Standard', detail: 'Camera-Ready Precision' }
];

const WORKS = [
  { 
    n: '01', 
    cat: 'Bridal Couture', 
    t: 'Royal Velvet Bridal Couture', 
    img: '/images/clients/img235.jpg', 
    d: 'Ultra-HD bridal beauty calibrated with luminous glass skin, bespoke contouring, and heritage velvet lehenga draping.', 
    tags: ['HD Glass Base', 'Cut-Crease Eye', 'Heritage Kundan', '16h Longevity'], 
    spec: [
      ['Occasion', 'Royal Wedding & Reception'],
      ['Skin Protocol', 'Dewy HD Radiance'],
      ['Draping', 'Velvet Dupatta & Choker'],
      ['Finish', 'Waterproof 8K Ready']
    ] 
  },
  { 
    n: '02', 
    cat: 'Creative & SFX', 
    t: 'Mythic Dryad & Serpent SFX', 
    img: '/images/clients/img210.jpg', 
    d: 'Award-winning avant-garde fantasy transformation featuring hand-sculpted serpent crowns, reptilian scale body paint, and theatrical textures.', 
    tags: ['Sculpted Headpiece', 'Reptilian Scales', 'Body Paint', 'UK International Award'], 
    spec: [
      ['Medium', 'Silicone & Body Pigment'],
      ['Genre', 'Fantasy / Mythic SFX'],
      ['Accreditation', 'UK International Certified'],
      ['Aesthetic', 'Theatrical Sculpture']
    ] 
  },
  { 
    n: '03', 
    cat: 'Precision Details', 
    t: 'Haute Marble & Swirl Gel Nails', 
    img: '/images/clients/img225.jpg', 
    d: 'Miniature fine art on fingertips featuring hand-painted marble swirls, gold glitter ribbons, and mirror-gloss gel architecture.', 
    tags: ['Marble Veining', 'Gold Glitter Ribbons', 'Gel Topography', 'Russian Manicure'], 
    spec: [
      ['Craft', 'Sculpted Gel & Overlay'],
      ['Finish', 'Mirror Gloss & Glitter'],
      ['Detail', 'Micro-Brush Artwork'],
      ['Longevity', '4-Week Chip-Resistant']
    ] 
  },
  { 
    n: '04', 
    cat: 'Editorial Bridal', 
    t: 'Editorial Magenta Glamour', 
    img: '/images/clients/img196.jpg', 
    d: 'Rich jewel-toned magenta bridal aesthetic balancing shimmering cut-crease smokey eyes with emerald jewelry and regal poise.', 
    tags: ['Smokey Cut-Crease', 'Emerald Accents', 'Matte Lips', 'Editorial Pose'], 
    spec: [
      ['Setting', 'Studio Lighting & Flash'],
      ['Focus', 'Sultry Eyes & Contours'],
      ['Draping', 'Royal Zari Dupatta'],
      ['Longevity', 'High-Flash Proof']
    ] 
  },
];

const LOOKBOOK_IMAGES = [
  { src: '/images/clients/img235.jpg', title: 'Royal Velvet Bridal', cat: 'Bridal Couture' },
  { src: '/images/clients/img210.jpg', title: 'Mythic Serpent SFX Sculpture', cat: 'Creative SFX' },
  { src: '/images/clients/img196.jpg', title: 'Magenta Editorial Glamour', cat: 'Editorial Bridal' },
  { src: '/images/clients/img176.jpg', title: 'Heritage Bengali Bride', cat: 'Traditional Bridal' },
  { src: '/images/clients/img225.jpg', title: 'Marble & Gold Gel Nails', cat: 'Nail Architecture' },
  { src: '/images/clients/img185.jpg', title: 'Crimson Zardozi Lehenga', cat: 'Bridal Couture' },
  { src: '/images/clients/img177.jpg', title: 'Sindoor Ceremony Radiance', cat: 'Traditional Draping' },
  { src: '/images/upasana.jpg', title: 'Upasana Kumari (London Award)', cat: 'Atelier Master' },
];

const SKILLS = [
  { 
    k: '01 / Signature', 
    t: 'Bridal Haute Couture', 
    d: 'Long-wear, photographic-ready luxury bridal beauty engineered for 4K video, tears of joy, and multi-day ceremonies.', 
    tags: ['HD Airbrush Base', 'Waterproof Setting', 'Eye Architecture', 'Contour Sculpting'], 
    hi: true 
  },
  { 
    k: '02 / Conceptual', 
    t: 'SFX & Fantasy Artistry', 
    d: 'Concept-driven transformations utilizing bespoke prosthetics, body painting, bloodwork, and sculptural prop crafting.', 
    tags: ['Prosthetic Blending', 'Body Murals', 'Character Design', 'Theatrical FX'] 
  },
  { 
    k: '03 / Fine Art', 
    t: 'Precision Nail Artistry', 
    d: 'Micro hand-painted nail designs, sculpted extensions, gel overlays, and bespoke crystal embellishments.', 
    tags: ['Micro Detailing', 'Russian Manicure', 'Chrome & Jewels', 'Sculpted Gel'] 
  },
  { 
    k: '04 / Finishing', 
    t: 'Haute Hair & Dupatta Draping', 
    d: 'Harmonious holistic finishing—from sculptural textured hair up-dos to heritage royal saree and dupatta draping.', 
    tags: ['Heritage Draping', 'Jewelry Pinning', 'Couture Up-Dos', 'Veil Anchoring'] 
  },
];

const JOURNEY = [
  {
    period: '2025 — Present',
    role: 'Principal Makeup & SFX Artist',
    loc: 'Atelier Upasana Kumari',
    desc: 'Leading bespoke bridal commissions, high-fashion editorial campaigns, and conceptual creative transformations for distinguished private clients and creative agencies.'
  },
  {
    period: '2023 — 2025',
    role: 'UK International London Beauty School',
    loc: 'Award Winner & Master Certification',
    desc: 'Honored with the prestigious UK International London Beauty School award for outstanding technical artistry, prosthetic SFX mastery, HD bridal airbrushing, and international editorial standards.'
  },
  {
    period: '2020 — 2023',
    role: 'Editorial Collaborations & Runway',
    loc: 'Fashion, Studio & Private Clients',
    desc: 'Delivered transformative beauty looks for runway models, commercial lookbooks, portfolio collaborations, and prestigious bridal party engagements.'
  }
];

const SERVICES = ['Bridal Haute Couture', 'Editorial & Fashion', 'Creative / SFX', 'Precision Nails', 'Masterclass'];

/* ==========================================================================
   ANIMATION CONSTANTS & REUSABLE UTILITIES
   ========================================================================== */
const easeExpo = [0.16, 1, 0.3, 1];
const easeSmooth = [0.25, 1, 0.5, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 40, filter: 'blur(8px)' },
  show: { 
    opacity: 1, 
    y: 0, 
    filter: 'blur(0px)', 
    transition: { duration: 0.9, ease: easeExpo } 
  }
};

const R = (delay = 0) => ({
  variants: fadeUp,
  initial: 'hidden',
  whileInView: 'show',
  viewport: { once: true, amount: 0.25 },
  transition: { delay, duration: 0.9, ease: easeExpo }
});

/* ==========================================================================
   CUSTOM DUAL CURSOR COMPONENT
   ========================================================================== */
function Cursor() {
  const [pos, setPos] = useState({ x: -400, y: -400 });
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const handleMove = (e) => setPos({ x: e.clientX, y: e.clientY });
    const handleOver = (e) => {
      const target = e.target;
      if (target.closest('a, button, .card, .bc, .lookbook-thumb, input, textarea')) {
        setHovered(true);
      } else {
        setHovered(false);
      }
    };

    window.addEventListener('mousemove', handleMove, { passive: true });
    window.addEventListener('mouseover', handleOver, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseover', handleOver);
    };
  }, []);

  return (
    <>
      <div 
        className="cur-dot" 
        style={{ 
          transform: `translate3d(${pos.x}px, ${pos.y}px, 0) scale(${hovered ? 2 : 1})` 
        }} 
      />
      <div 
        className="cur" 
        style={{ 
          transform: `translate3d(${pos.x}px, ${pos.y}px, 0) scale(${hovered ? 1.3 : 1})` 
        }} 
      />
    </>
  );
}

/* ==========================================================================
   3D STACKED WORK CARD COMPONENT
   ========================================================================== */
function WorkCard({ w, i, total, prog, onSelectImage }) {
  const start = i / total;
  const end = (i + 1) / total;
  const scale = useTransform(prog, [start, end], [1, 0.94]);
  const opacity = useTransform(prog, [start, end], [1, 0.65]);
  const y = useTransform(prog, [start, end], [0, -10]);

  return (
    <div className="stack-item" style={{ top: 110 + i * 22 }}>
      <motion.div 
        className="card" 
        style={{ 
          scale, 
          opacity: i === total - 1 ? 1 : opacity,
          y
        }}
        whileHover={{ y: -6, transition: { duration: 0.3 } }}
      >
        <div>
          <span className="lbl">{w.n} // {w.cat}</span>
          <h3 className="g">{w.t}</h3>
          <p>{w.d}</p>
          <div className="tags">
            {w.tags.map((t) => <span key={t}>{t}</span>)}
          </div>
          <a className="btn btn-solid" href="#contact">
            BOOK THIS LOOK <ArrowUpRight size={14} />
          </a>
        </div>
        <div className="spec">
          <div className="img-container" onClick={() => onSelectImage(w.img, w.t)}>
            <img className="img" src={w.img} alt={w.t} loading="lazy" />
            <div className="img-overlay-btn">
              <span><Eye size={16} style={{ display: 'inline', marginRight: 6 }} /> VIEW HIGH-RES</span>
            </div>
          </div>
          <div className="lbl" style={{ marginBottom: 12 }}>// Specifications</div>
          {w.spec.map(([a, b]) => (
            <div className="row" key={a}>
              <i>{a.toUpperCase()}</i>
              <span>{b}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

/* ==========================================================================
   INTERACTIVE SPOTLIGHT BENTO CARD
   ========================================================================== */
function BentoCard({ s, i }) {
  const cardRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    cardRef.current.style.setProperty('--mouse-x', `${x}px`);
    cardRef.current.style.setProperty('--mouse-y', `${y}px`);
  };

  return (
    <motion.div 
      ref={cardRef}
      onMouseMove={handleMouseMove}
      className={`bc ${s.hi ? 'hi' : ''}`} 
      {...R(i * 0.09)} 
      whileHover={{ y: -6 }}
    >
      <div className="bc-header">
        <span className="lbl">{s.k}</span>
        {s.hi && <span style={{ color: 'var(--gold)', fontSize: 13 }}><Sparkles size={14} /></span>}
      </div>
      <h3 className="s">{s.t}</h3>
      <p>{s.d}</p>
      <div className="tags">
        {s.tags.map((t) => <span key={t}>{t}</span>)}
      </div>
    </motion.div>
  );
}

/* ==========================================================================
   MAIN CINEMATIC APPLICATION
   ========================================================================== */

function CinematicDust() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const particles = Array.from({ length: 48 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 0.8,
      speedY: Math.random() * 0.35 + 0.12,
      speedX: (Math.random() - 0.5) * 0.2,
      opacity: Math.random() * 0.5 + 0.2,
      pulse: Math.random() * Math.PI
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      particles.forEach((p) => {
        p.y -= p.speedY;
        p.x += p.speedX;
        p.pulse += 0.02;
        if (p.y < -10) p.y = height + 10;
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        const currentOpacity = p.opacity * (0.6 + 0.4 * Math.sin(p.pulse));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(217, 169, 58, ' + currentOpacity + ')';
        ctx.shadowBlur = 8;
        ctx.shadowColor = 'rgba(217, 169, 58, 0.4)';
        ctx.fill();
      });
      animId = requestAnimationFrame(render);
    };

    render();
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return <canvas ref={canvasRef} className="cinematic-dust" aria-hidden="true" />;
}

function App() {
  const [scrolled, setScrolled] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const [selectedService, setSelectedService] = useState('Bridal Haute Couture');
  const [formSubmitted, setFormSubmitted] = useState(false);
  
  const videoRef = useRef(null);
  const workRef = useRef(null);
  const tlRef = useRef(null);
  const heroRef = useRef(null);

  // Scroll Progress Springs
  const { scrollYProgress } = useScroll();
  const bar = useSpring(scrollYProgress, { stiffness: 140, damping: 32 });

  const { scrollYProgress: wp } = useScroll({ 
    target: workRef, 
    offset: ['start 0.2', 'end end'] 
  });
  
  const { scrollYProgress: tp } = useScroll({ 
    target: tlRef, 
    offset: ['start 0.7', 'end 0.6'] 
  });
  const fill = useSpring(tp, { stiffness: 100, damping: 28 });

  // Hero Video Parallax Scroll Transform
  const { scrollY } = useScroll();
  const videoY = useTransform(scrollY, [0, 800], [0, 100]);
  const watermarkY = useTransform(scrollY, [0, 800], [0, -70]);
  const textY = useTransform(scrollY, [0, 800], [0, 45]);

  // Navbar scroll listener
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // GSAP Cinematic Entrance Animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Smooth subtle floating sway on the watermark
      gsap.to('.hero-watermark', {
        x: 15,
        duration: 8,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
      });

      // Ambient light pulse
      gsap.to('.hero .cone', {
        opacity: 0.85,
        duration: 4,
        repeat: -1,
        yoyo: true,
        ease: 'power1.inOut'
      });
    }, heroRef);

    return () => ctx.revert();
  }, []);

  
  const heroLines = [
    { text: 'I CREATE', style: 's' },
    { text: 'BEAUTY.', style: 'g' },
    { text: 'YOU FEEL', style: 's' },
    { text: 'UNFORGETTABLE.', style: 'g' }
  ];

  return (
    <>
      {/* Film Grain Subtle Depth Overlay */}
      <div className="film-grain" />

      {/* Top Gold Scroll Indicator */}
      <motion.div 
        className="bar" 
        style={{ scaleX: bar, transformOrigin: '0 50%', width: '100%' }} 
      />

      {/* Cinematic Custom Cursor */}
      <Cursor />
      <CinematicDust />

      {/* Luxury Navigation Header */}
      <nav className={scrolled ? 'sc' : ''}>
        <div className="nav-brand">
          <a className="logo" href="#top">
            {NAME.split(' ')[0].toUpperCase()}
            <span className="logo-pill">ATELIER</span>
          </a>
        </div>
        <ul>
          {NAV.map((n) => (
            <li key={n}>
              <a href={`#${n.toLowerCase()}`}>{n.toUpperCase()}</a>
            </li>
          ))}
        </ul>
        <a className="nav-cta" href="#contact">
          BOOK ATELIER <ArrowUpRight size={13} />
        </a>
      </nav>

      {/* ==========================================================================
          HERO SECTION — CINEMATIC LUXURY REDESIGN (PHASE 2 & PHASE 3)
          ========================================================================== */}
      <header className="hero" id="top" ref={heroRef}>
        {/* Background Spatial Watermark Behind Model */}
        <motion.div 
          className="hero-watermark" 
          style={{ y: watermarkY }}
        >
          UPASANA
        </motion.div>

        {/* Ambient Volumetric Lighting Beam & Golden Haze */}
        <div className="cone" />
        <div className="haze" />

        {/* Golden Backlight Aura Behind Walking Model */}
        <div className="model-aura" />

        {/* Live Editorial Motion Reel (Continuous Playback) */}
        <div className="video-tag">
          <span className="live-dot" />
          <span>EDITORIAL MOTION // 4K CINEMA</span>
        </div>

        {/* Foreground Editorial Hero Content */}
        <motion.div className="hero-t" style={{ y: textY }}>
          {/* Status Badge */}
          <motion.div 
            className="hero-pill-status"
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: easeExpo }}
          >
            <span className="pulse-beacon" />
            <span>GLOBAL COMMISSIONS · CALENDAR 2025–2026</span>
          </motion.div>

          <motion.div 
            className="lbl" 
            initial={{ opacity: 0, x: -20 }} 
            animate={{ opacity: 1, x: 0 }} 
            transition={{ delay: 0.2, duration: 0.8, ease: easeExpo }}
          >
            {NAME.toUpperCase()} · HAUTE BEAUTY
          </motion.div>

          {/* Staggered Monumental Editorial Typography */}
          <h1>
            {heroLines.map((line, i) => (
              <span className="line-wrap" key={line.text}>
                <motion.span 
                  style={{ display: 'block' }} 
                  className={line.style} 
                  initial={{ y: '120%' }} 
                  animate={{ y: 0 }} 
                  transition={{ duration: 1.1, delay: 0.3 + i * 0.12, ease: easeExpo }}
                >
                  {line.text}
                </motion.span>
              </span>
            ))}
          </h1>

          <div className="role-wrapper">
            <motion.div 
              className="role" 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              transition={{ delay: 0.95, duration: 0.8 }}
            >
              ROYAL BRIDAL COUTURE
            </motion.div>
            <span className="role-divider">/</span>
            <motion.div 
              className="role" 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              transition={{ delay: 1.05, duration: 0.8 }}
            >
              EDITORIAL SFX ARTISTRY
            </motion.div>
            <span className="role-divider">/</span>
            <motion.div 
              className="role" 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              transition={{ delay: 1.15, duration: 0.8 }}
            >
              HAUTE NAIL ARCHITECTURE
            </motion.div>
          </div>

          <motion.div 
            className="editorial-quote"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.25, duration: 0.8, ease: easeExpo }}
          >
            "Where classical bridal opulence meets the fearless edge of high-fashion editorial."
          </motion.div>

          <motion.p 
            className="sub" 
            initial={{ opacity: 0, y: 16 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 1.35, duration: 0.8, ease: easeExpo }}
          >
            Bespoke artistry engineered around bone structure, ceremony ambiance, and cinematic camera optics. Transforming presence into an unforgettable visual statement.
          </motion.p>

          <motion.div 
            className="btns" 
            initial={{ opacity: 0, y: 18 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 1.45, duration: 0.8, ease: easeExpo }}
          >
            <a className="btn btn-solid" href="#work">
              EXPLORE THE PORTFOLIO <ArrowDownRight size={14} />
            </a>
            <a className="btn" href="#contact">
              INQUIRE ABOUT DATES <ArrowUpRight size={14} />
            </a>
          </motion.div>
        </motion.div>

        {/* Hero Walking Model Video (Dominant Editorial Presence) */}
        <motion.div 
          className="model" 
          style={{ y: videoY }} 
          initial={{ opacity: 0, scale: 0.92 }} 
          animate={{ opacity: 1, scale: 1 }} 
          transition={{ duration: 1.5, delay: 0.35, ease: easeExpo }}
        >
          <video 
            ref={videoRef}
            src="/video/walk.mp4" 
            autoPlay 
            muted 
            loop 
            playsInline 
            preload="auto"
          />
        </motion.div>

        {/* High-Fashion Handwritten Signature */}
        <div className="sig">{NAME.split(' ')[0]}</div>

        {/* Rotating Circular Monogram Badge */}
        <a className="badge" href="#about" title="Explore Upasana Kumari">
          <div className="badge-inner">UK</div>
        </a>
      </header>

      {/* ==========================================================================
          SECTION 01: ABOUT ME — MAGAZINE EDITORIAL SPREAD
          ========================================================================== */}
      <section className="sec about" id="about">
        <div>
          <motion.span className="lbl" {...R(0)}>01 / Philosophy & Artistry</motion.span>
          <motion.h2 {...R(0.1)}>
            <span className="s">I don't just apply pigment.</span>
            <br />
            <span className="g">I sculpt an aura.</span>
          </motion.h2>

          <motion.div className="about-quote" {...R(0.15)}>
            "Makeup is never a mask to conceal behind; it is a high-precision lens that radiates your most commanding, unforgettable essence."
          </motion.div>

          <motion.p {...R(0.2)}>
            I am <b>{NAME}</b>, an award-winning bridal couture, editorial SFX, and precision beauty artist certified by the prestigious <b>UK International London Beauty School</b>. With rigorous discipline in cosmetic chemistry, facial ergonomics, and studio optics, every stroke is calibrated to look breathtaking both in intimate presence and under 8K high-definition cinema lenses.
          </motion.p>
          <motion.p {...R(0.25)}>
            Whether curating royal multi-day traditional weddings, crafting fantasy prosthetic sculptures for conceptual shoots, or tailoring bespoke glass-skin aesthetics, my craft is defined by an obsession with enduring elegance, structural balance, and uncompromising detail.
          </motion.p>

          <motion.div className="stats" {...R(0.3)}>
            {STATS.map((s) => (
              <div key={s.label}>
                <strong className="g">{s.val}</strong>
                <small>{s.label.toUpperCase()}</small>
                <div style={{ fontSize: 10, color: 'var(--muted-dark)', marginTop: 4 }}>{s.detail}</div>
              </div>
            ))}
          </motion.div>
        </div>

        <motion.div 
          className="frame" 
          initial={{ opacity: 0, x: 60 }} 
          whileInView={{ opacity: 1, x: 0 }} 
          viewport={{ once: true, amount: 0.3 }} 
          transition={{ duration: 1.1, ease: easeExpo }}
        >
          <div 
            className="frame-inner"
            onClick={() => setLightbox({ src: '/images/upasana.jpg', title: 'Upasana Kumari — UK International London Beauty School Award Winner' })}
            style={{ cursor: 'pointer' }}
          >
            <div className="frame-award-pill">
              <Trophy size={13} color="var(--gold-light)" />
              <span>AWARD WINNER · UK INTERNATIONAL</span>
            </div>
            <img 
              src="/images/upasana.jpg" 
              alt={`${NAME} — UK International London Beauty School Award Winner`}
              style={{ objectPosition: 'center 12%' }}
            />
            <div className="frame-caption">
              <span>UPASANA KUMARI</span>
              <span>LONDON BEAUTY SCHOOL // AWARD WINNER</span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ==========================================================================
          SECTION 02: FEATURED WORK — 3D STACKED CINEMATIC CARDS
          ========================================================================== */}
      <section className="sec" id="work" ref={workRef}>
        <div className="wh">
          <div>
            <motion.span className="lbl" {...R(0)}>02 / Curated Portfolio</motion.span>
            <motion.h2 {...R(0.1)}>
              <span className="s">Selected works.</span>
              <br />
              <span className="g">Crafted with intent.</span>
            </motion.h2>
          </div>
          <motion.p {...R(0.15)}>
            Scroll down to unpack each discipline. Each creation is an architectural harmony of skin, light, texture, and individual narrative.
          </motion.p>
        </div>

        {WORKS.map((w, i) => (
          <WorkCard 
            key={w.n} 
            w={w} 
            i={i} 
            total={WORKS.length} 
            prog={wp} 
            onSelectImage={(img, title) => setLightbox({ src: img, title })}
          />
        ))}

        </section>

      {/* ==========================================================================
          SECTION 02-B: 360° CINEMATIC ROLLING CIRCULAR CLIENT SHOWCASE (59 MASTERPIECES)
          ========================================================================== */}
      <RollingGallery onSelectLook={(lookTitle) => setSelectedService('Bridal Haute Couture: ' + lookTitle)} />


      {/* ==========================================================================
          SECTION 03: SKILLS MATRIX — INTERACTIVE SPOTLIGHT BENTO
          ========================================================================== */}
      <section className="sec sh" id="skills">
        <motion.span className="lbl" {...R(0)}>03 / Technical Mastery</motion.span>
        <motion.h2 {...R(0.1)}>
          <span className="s">Artistry disciplines.</span>
          <br />
          <span className="g">Precision applied.</span>
        </motion.h2>
        
        <div className="bento">
          {SKILLS.map((s, i) => (
            <BentoCard key={s.t} s={s} i={i} />
          ))}
        </div>
      </section>

      {/* ==========================================================================
          SECTION 04: JOURNEY — ILLUMINATED GOLDEN THREAD TIMELINE
          ========================================================================== */}
      <section className="sec xh" id="journey">
        <motion.span className="lbl" {...R(0)}>04 / Trajectory & Milestones</motion.span>
        <motion.h2 {...R(0.1)}>
          <span className="s">Evolution &</span>
          <br />
          <span className="g">Creative Milestones.</span>
        </motion.h2>

        <div className="tl" ref={tlRef}>
          <div className="rail" />
          <motion.div 
            className="fill" 
            style={{ height: '100%', scaleY: fill }} 
          />
          {JOURNEY.map((item, idx) => (
            <motion.div className="ti" key={item.role} {...R(idx * 0.12)}>
              <span className="lbl">{item.period} // {item.loc}</span>
              <h3 className="s">{item.role}</h3>
              <p>{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ==========================================================================
          SECTION 05: CONTACT ATELIER — BOOKING & INQUIRY
          ========================================================================== */}
      <section className="sec ct" id="contact">
        <div>
          <motion.span className="lbl" {...R(0)}>05 / Atelier Reservations</motion.span>
          <motion.h2 {...R(0.1)}>
            <span className="s">Initiate the</span>
            <br />
            <span className="g">Conversation.</span>
          </motion.h2>
          <motion.p style={{ color: '#bbb8ac', maxWidth: 440, fontSize: 16 }} {...R(0.15)}>
            Dates for prime wedding seasons and editorial campaigns book up to 10 months in advance. Share your celebration date and vision below.
          </motion.p>

          <motion.div className="contact-perks" {...R(0.2)}>
            <div className="contact-perk-item">
              <CheckCircle2 size={16} color="var(--gold)" />
              <span>BESPOKE BRIDAL CONSULTATION & DIGITAL MOODBOARDS</span>
            </div>
            <div className="contact-perk-item">
              <CheckCircle2 size={16} color="var(--gold)" />
              <span>DESTINATION WEDDINGS & INTERNATIONAL TRAVEL READY</span>
            </div>
            <div className="contact-perk-item">
              <CheckCircle2 size={16} color="var(--gold)" />
              <span>PREMIUM LUXURY PRODUCT KITS (ARMANI, DIOR, CHARLOTTE TILBURY)</span>
            </div>
          </motion.div>
        </div>

        <motion.form 
          {...R(0.25)} 
          onSubmit={(e) => {
            e.preventDefault();
            setFormSubmitted(true);
          }}
        >
          {formSubmitted ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ color: 'var(--gold)', marginBottom: 16 }}>
                <CheckCircle2 size={48} style={{ margin: '0 auto' }} />
              </div>
              <h3 className="g" style={{ fontSize: 28, marginBottom: 12 }}>INQUIRY RECEIVED</h3>
              <p style={{ color: 'var(--muted)', fontSize: 14 }}>
                Thank you for reaching out. Upasana’s atelier concierge will review your date and get back to you within 24 hours.
              </p>
              <button 
                className="btn btn-solid" 
                type="button" 
                onClick={() => setFormSubmitted(false)}
                style={{ marginTop: 20 }}
              >
                SEND ANOTHER NOTE
              </button>
            </div>
          ) : (
            <>
              <div className="service-selector">
                <label>// SELECT ARTISTRY SERVICE</label>
                <div className="service-chips">
                  {SERVICES.map((s) => (
                    <button
                      type="button"
                      key={s}
                      className={`service-chip ${selectedService === s ? 'active' : ''}`}
                      onClick={() => setSelectedService(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <label>
                // FULL NAME
                <input name="name" placeholder="Your name or agency" required />
              </label>
              
              <label>
                // EMAIL ADDRESS
                <input name="email" type="email" placeholder="you@domain.com" required />
              </label>

              <label>
                // CELEBRATION DATE & CITY / VENUE
                <input name="event_details" placeholder="e.g. November 18, 2025 · New Delhi / Destination" required />
              </label>
              
              <label>
                // VISION & NOTES
                <textarea 
                  name="message" 
                  rows="4" 
                  placeholder={`Tell me about your occasion, outfits, aesthetic preferences for ${selectedService}...`} 
                />
              </label>
              
              <button 
                className="btn btn-solid" 
                type="submit" 
                style={{ justifyContent: 'center', padding: 18 }}
              >
                REQUEST RESERVATION <Send size={14} />
              </button>
            </>
          )}
        </motion.form>
      </section>

      {/* ==========================================================================
          LIGHTBOX MODAL FOR FULL-RESOLUTION LOOKBOOK INSPECTION
          ========================================================================== */}
      <AnimatePresence>
        {lightbox && (
          <motion.div 
            className="lightbox-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightbox(null)}
          >
            <motion.div 
              className="lightbox-content"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                className="lightbox-close" 
                onClick={() => setLightbox(null)}
              >
                <X size={18} /> CLOSE (ESC)
              </button>
              <img src={lightbox.src} alt={lightbox.title} />
              <div className="lightbox-caption">
                {lightbox.title.toUpperCase()} // UPASANA KUMARI ATELIER
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==========================================================================
          LUXURY FOOTER
          ========================================================================== */}
      <footer>
        <div className="footer-socials">
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" title="Instagram">
            <Instagram size={18} />
          </a>
          <a href="mailto:upasana@example.com" title="Email Inquiries">
            <Mail size={18} />
          </a>
          <a href="tel:+919876543210" title="Direct Atelier Line">
            <Phone size={18} />
          </a>
        </div>
        <div>
          © {new Date().getFullYear()} {NAME.toUpperCase()} — HAUTE BEAUTY & CINEMATIC EDITORIAL
        </div>
        <div style={{ fontSize: 9, color: 'var(--muted-dark)' }}>
          ALL RIGHTS RESERVED · CRAFTED FOR UNFORGETTABLE PRESENCE
        </div>
      </footer>
    </>
  );
}

createRoot(document.getElementById('root')).render(<App />);

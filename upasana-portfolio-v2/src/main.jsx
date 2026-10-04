import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import './styles.css';

/* ===== EDIT YOUR CONTENT HERE (placeholders — replace with your real details) ===== */
const NAME = 'Upasana Kumari';
const NAV = ['About', 'Work', 'Skills', 'Journey', 'Contact'];
const STATS = [['100+', 'Looks Created'], ['5+', 'Years Artistry'], ['4', 'Specialities'], ['∞', 'Attention to Detail']];
const WORKS = [
  { n: '01', cat: 'Bridal', t: 'Bridal Artistry', img: '/images/portfolio-24.jpg', d: 'Timeless, personal bridal looks designed around your features, outfit and story.', tags: ['HD Base', 'Eye Design', 'Hair Styling', 'Draping'], spec: [['Service', 'Bridal Makeup'], ['Style', 'Traditional / Modern'], ['Finish', 'Camera-ready']] },
  { n: '02', cat: 'Creative / SFX', t: 'Character & SFX', img: '/images/portfolio-38.jpg', d: 'Fantasy and character transformations built with sculpted props, body paint and detail.', tags: ['Body Paint', 'Prosthetics', 'Props', 'Editorial'], spec: [['Service', 'Creative Makeup'], ['Style', 'Fantasy / Editorial'], ['Finish', 'Sculptural']] },
  { n: '03', cat: 'Nails', t: 'Nail Art & Details', img: '/images/portfolio-53.jpg', d: 'Precision nail design where colour, texture and finish come together.', tags: ['Gel', 'Hand-painted', 'Extensions'], spec: [['Service', 'Nail Art'], ['Style', 'Minimal / Statement'], ['Finish', 'Gloss']] },
];
const SKILLS = [
  { k: 'Bridal', t: 'Bridal Makeup', d: 'Long-wear, photograph-ready looks for every ceremony.', tags: ['HD', 'Airbrush', 'Traditional'], hi: true },
  { k: 'Creative', t: 'SFX & Editorial', d: 'Concept-driven character work and fantasy looks.', tags: ['Body Paint', 'Props'] },
  { k: 'Details', t: 'Nail Art', d: 'Fine hand-painted and gel design.', tags: ['Gel', 'Art'] },
  { k: 'Styling', t: 'Hair & Draping', d: 'Complete finishing — hair, dupatta and jewellery set.', tags: ['Hair', 'Draping', 'Jewellery'] },
];
const JOURNEY = [
  ['2025 — Present', 'Freelance Makeup Artist', 'Bridal, editorial and creative commissions.'],
  ['Year', 'Professional Training', 'Add your academy / certification here.'],
  ['Year', 'First Client Work', 'Add a milestone or achievement here.'],
];
/* ================================================================================ */

const ease = [0.22, 1, 0.36, 1];
const rev = { hidden: { opacity: 0, y: 50, filter: 'blur(10px)' }, show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.9, ease } } };
const R = (p) => ({ variants: rev, initial: 'hidden', whileInView: 'show', viewport: { once: true, amount: 0.3 }, ...p });

function Cursor() {
  const [p, setP] = useState({ x: -400, y: -400 });
  useEffect(() => { const f = (e) => setP({ x: e.clientX, y: e.clientY }); window.addEventListener('mousemove', f); return () => window.removeEventListener('mousemove', f); }, []);
  return <div className="cur" style={{ transform: `translate(${p.x}px,${p.y}px)`, transition: 'transform .25s ease-out' }} />;
}

function WorkCard({ w, i, total, prog }) {
  // each card scales down + dims as later cards stack over it
  const start = i / total, end = (i + 1) / total;
  const scale = useTransform(prog, [start, end], [1, 0.92]);
  const op = useTransform(prog, [start, end], [1, 0.55]);
  return (
    <div className="stack-item" style={{ top: 110 + i * 22 }}>
      <motion.div className="card" style={{ scale, opacity: i === total - 1 ? 1 : op }}>
        <div>
          <span className="lbl">{w.n} // {w.cat}</span>
          <h3 className="g">{w.t}</h3>
          <p>{w.d}</p>
          <div className="tags">{w.tags.map((t) => <span key={t}>{t}</span>)}</div>
          <a className="btn" href="#contact">BOOK THIS STYLE <ArrowUpRight size={14} /></a>
        </div>
        <div className="spec">
          <img className="img" src={w.img} alt={w.t} loading="lazy" />
          <div className="lbl" style={{ marginBottom: 12 }}>// Specifications</div>
          {w.spec.map(([a, b]) => <div className="row" key={a}><i>{a.toUpperCase()}</i><span>{b}</span></div>)}
        </div>
      </motion.div>
    </div>
  );
}

function App() {
  const [sc, setSc] = useState(false);
  const { scrollYProgress } = useScroll();
  const bar = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });
  const workRef = useRef(null), tlRef = useRef(null);
  const { scrollYProgress: wp } = useScroll({ target: workRef, offset: ['start 0.2', 'end end'] });
  const { scrollYProgress: tp } = useScroll({ target: tlRef, offset: ['start 0.7', 'end 0.6'] });
  const fill = useSpring(tp, { stiffness: 90, damping: 25 });
  const { scrollY } = useScroll();
  const modelY = useTransform(scrollY, [0, 700], [0, 90]);
  useEffect(() => { const f = () => setSc(window.scrollY > 40); window.addEventListener('scroll', f, { passive: true }); return () => window.removeEventListener('scroll', f); }, []);

  const lines = [['I CREATE', 's'], ['BEAUTY.', 'g'], ['YOU FEEL', 's'], ['UNFORGETTABLE.', 'g']];
  return (<>
    <motion.div className="bar" style={{ scaleX: bar, transformOrigin: '0 50%', width: '100%' }} />
    <Cursor />
    <nav className={sc ? 'sc' : ''}>
      <a className="logo" href="#top">{NAME.split(' ')[0].toUpperCase()}.</a>
      <ul>{NAV.map((n) => <li key={n}><a href={`#${n.toLowerCase()}`}>{n.toUpperCase()}</a></li>)}</ul>
    </nav>

    <header className="hero" id="top">
      <div className="cone" /><div className="haze" />
      <div className="hero-t">
        <motion.div className="lbl" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1, duration: 0.7 }}>{NAME.toUpperCase()}.</motion.div>
        <h1>{lines.map(([t, c], i) => <span key={t}><motion.span style={{ display: 'block' }} className={c} initial={{ y: '115%' }} animate={{ y: 0 }} transition={{ duration: 0.95, delay: 0.25 + i * 0.13, ease }}>{t}</motion.span></span>)}</h1>
        <motion.div className="role" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>BRIDAL ARTIST · CREATIVE MAKEUP · NAIL ART</motion.div>
        <motion.p className="sub" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1, duration: 0.7 }}>Artistry that celebrates your individuality — from bridal elegance to bold creative transformations.</motion.p>
        <motion.div className="btns" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.3, duration: 0.7 }}>
          <a className="btn" href="#work">EXPLORE MY WORK <ArrowDownRight size={14} /></a>
          <a className="btn" href="#contact">LET'S CONNECT <ArrowUpRight size={14} /></a>
        </motion.div>
      </div>
      <motion.div className="model" style={{ y: modelY }} initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.4, delay: 0.4, ease }}>
        <video src="/video/walk.mp4" autoPlay muted loop playsInline />
      </motion.div>
      <div className="sig">{NAME.split(' ')[0]}</div>
      <div className="badge">UK</div>
    </header>

    <section className="sec about" id="about">
      <div>
        <motion.span className="lbl" {...R()}>01 / About me</motion.span>
        <motion.h2 {...R()}><span className="s">I don't just do makeup.</span><br /><span className="g">I create a feeling.</span></motion.h2>
        <motion.p {...R()}>I'm <b>{NAME}</b>, a makeup artist specialising in bridal, creative and detail-driven beauty. Replace this paragraph with your own story — where you trained, what you love, and how you work with clients.</motion.p>
        <motion.div className="stats" {...R()}>{STATS.map(([a, b]) => <div key={b}><strong className="g">{a}</strong><small>{b.toUpperCase()}</small></div>)}</motion.div>
      </div>
      <motion.div className="frame" initial={{ opacity: 0, x: 60 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 1, ease }}>
        <img src="/images/portfolio-07.jpg" alt={NAME} />
      </motion.div>
    </section>

    <section className="sec" id="work" ref={workRef}>
      <div className="wh">
        <div><motion.span className="lbl" {...R()}>02 / Featured work</motion.span>
          <motion.h2 {...R()}><span className="s">Selected works.</span><br /><span className="g">Crafted with intent.</span></motion.h2></div>
        <motion.p {...R()}>Scroll down to unfold each speciality. Every look is built around the person wearing it.</motion.p>
      </div>
      {WORKS.map((w, i) => <WorkCard key={w.n} w={w} i={i} total={WORKS.length} prog={wp} />)}
    </section>

    <section className="sec sh" id="skills">
      <motion.span className="lbl" {...R()}>03 / Skill matrix</motion.span>
      <motion.h2 {...R()}><span className="s">Artistry mastery.</span><br /><span className="g">Precision applied.</span></motion.h2>
      <div className="bento">{SKILLS.map((s, i) => (
        <motion.div key={s.t} className={`bc ${s.hi ? 'hi' : ''}`} {...R()} transition={{ delay: i * 0.08 }} whileHover={{ y: -6 }}>
          <span className="lbl">{s.k}</span><h3 className="s">{s.t}</h3><p>{s.d}</p>
          <div className="tags">{s.tags.map((t) => <span key={t}>{t}</span>)}</div>
        </motion.div>))}</div>
    </section>

    <section className="sec xh" id="journey">
      <motion.span className="lbl" {...R()}>04 / Experience</motion.span>
      <motion.h2 {...R()}><span className="s">Journey &</span><br /><span className="g">Milestones.</span></motion.h2>
      <div className="tl" ref={tlRef}>
        <div className="rail" /><motion.div className="fill" style={{ height: '100%', scaleY: fill }} />
        {JOURNEY.map(([d, t, p]) => <motion.div className="ti" key={t} {...R()}><span className="lbl">{d}</span><h3 className="s">{t}</h3><p>{p}</p></motion.div>)}
      </div>
    </section>

    <section className="sec ct" id="contact">
      <div>
        <motion.span className="lbl" {...R()}>05 / Contact</motion.span>
        <motion.h2 {...R()}><span className="s">Start the</span><br /><span className="g">conversation.</span></motion.h2>
        <motion.p style={{ color: '#9a9aa6', maxWidth: 380 }} {...R()}>Have a date, a vision or an idea? Tell me about it and let's bring it to life.</motion.p>
      </div>
      <motion.form {...R()} action="mailto:hello@example.com" method="post" encType="text/plain">
        <label>// NAME<input name="name" placeholder="Your name" required /></label>
        <label>// EMAIL<input name="email" type="email" placeholder="you@email.com" required /></label>
        <label>// MESSAGE<textarea name="message" rows="4" placeholder="Tell me about your occasion" /></label>
        <button className="btn" type="submit" style={{ cursor: 'pointer', color: 'inherit', justifyContent: 'center' }}>SEND MESSAGE <ArrowUpRight size={14} /></button>
      </motion.form>
    </section>
    <footer>© {new Date().getFullYear()} {NAME.toUpperCase()} — ART IN EVERY DETAIL</footer>
  </>);
}
createRoot(document.getElementById('root')).render(<App />);

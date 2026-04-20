/**
 * LandingPage — Redesigned
 * Split-screen: interactive stadium map (left) + login form (right)
 * Role is determined from credentials stored in the database.
 */
import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Mail, Eye, EyeOff, Zap, AlertCircle, MapPin, Users, Shield, ChevronRight } from 'lucide-react';
import { auth as authApi } from '../api/apiService';
import useStore from '../store/useStore';

/* ─── Animated stadium SVG zones ─── */
const STADIUM_ZONES = [
  // Outer shell
  { id: 'stand-n', label: 'North Stand', path: 'M 160 30 Q 250 5, 340 30 L 320 80 Q 250 60, 180 80 Z', color: '#00D4FF', people: 8420 },
  { id: 'stand-s', label: 'South Stand', path: 'M 160 370 Q 250 395, 340 370 L 320 320 Q 250 340, 180 320 Z', color: '#FF6B35', people: 7835 },
  { id: 'stand-e', label: 'East Stand', path: 'M 370 60 Q 395 150, 395 200 Q 395 250, 370 340 L 330 310 Q 350 250, 350 200 Q 350 150, 330 90 Z', color: '#7C4DFF', people: 6200 },
  { id: 'stand-w', label: 'West Stand', path: 'M 130 60 Q 105 150, 105 200 Q 105 250, 130 340 L 170 310 Q 150 250, 150 200 Q 150 150, 170 90 Z', color: '#00E676', people: 5980 },
  // Corner blocks
  { id: 'corner-nw', label: 'VIP Lounge', path: 'M 130 60 L 160 30 L 180 80 L 170 90 Z', color: '#FFD600', people: 820 },
  { id: 'corner-ne', label: 'Media Box', path: 'M 370 60 L 340 30 L 320 80 L 330 90 Z', color: '#FF1744', people: 340 },
  { id: 'corner-sw', label: 'Gate C Entry', path: 'M 130 340 L 160 370 L 180 320 L 170 310 Z', color: '#00BCD4', people: 1200 },
  { id: 'corner-se', label: 'Fan Zone', path: 'M 370 340 L 340 370 L 320 320 L 330 310 Z', color: '#E040FB', people: 1560 },
];

const HOTSPOTS = [
  { x: 140, y: 140, label: 'Food Court A', density: 78, type: 'food' },
  { x: 360, y: 140, label: 'Merch Store', density: 45, type: 'merch' },
  { x: 140, y: 260, label: 'Medical Post', density: 12, type: 'medical' },
  { x: 360, y: 260, label: 'Restrooms E', density: 62, type: 'restroom' },
  { x: 250, y: 40, label: 'Gate A (North)', density: 85, type: 'gate' },
  { x: 250, y: 360, label: 'Gate C (South)', density: 55, type: 'gate' },
];

function getDensityColor(d) {
  if (d < 30) return '#00E676';
  if (d < 60) return '#FFD600';
  if (d < 80) return '#FF6B35';
  return '#FF1744';
}

/* ─── Interactive Stadium Map ─── */
function StadiumMap() {
  const [hoveredZone, setHoveredZone] = useState(null);
  const [tick, setTick] = useState(0);
  const [hotspotDensities, setHotspotDensities] = useState(
    HOTSPOTS.map(h => h.density)
  );

  // Simulate live density changes
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);
      setHotspotDensities(prev =>
        prev.map(d => Math.max(5, Math.min(98, d + Math.floor((Math.random() - 0.45) * 8))))
      );
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: 500, margin: '0 auto' }}>
      {/* Live badge */}
  

      <svg viewBox="0 0 500 400" style={{ width: '100%', filter: 'drop-shadow(0 0 40px rgba(0,212,255,0.15))' }}>
        <defs>
          <radialGradient id="field-gradient" cx="50%" cy="50%">
            <stop offset="0%" stopColor="#1a5c2a" />
            <stop offset="100%" stopColor="#0d3318" />
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {STADIUM_ZONES.map(z => (
            <linearGradient key={`grad-${z.id}`} id={`grad-${z.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={z.color} stopOpacity="0.35" />
              <stop offset="100%" stopColor={z.color} stopOpacity="0.12" />
            </linearGradient>
          ))}
        </defs>

        {/* Background */}
        <rect x="0" y="0" width="500" height="400" rx="20" fill="#0F223F" />

        {/* Outer stadium ring */}
        <ellipse cx="250" cy="200" rx="185" ry="175" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
        <ellipse cx="250" cy="200" rx="165" ry="155" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />

        {/* Stadium zones */}
        {STADIUM_ZONES.map(zone => (
          <g key={zone.id}>
            <motion.path
              d={zone.path}
              fill={hoveredZone === zone.id ? `${zone.color}50` : `url(#grad-${zone.id})`}
              stroke={zone.color}
              strokeWidth={hoveredZone === zone.id ? 2 : 1}
              strokeOpacity={hoveredZone === zone.id ? 0.9 : 0.4}
              style={{ cursor: 'pointer', transition: 'all 0.3s' }}
              onMouseEnter={() => setHoveredZone(zone.id)}
              onMouseLeave={() => setHoveredZone(null)}
              animate={{ fillOpacity: hoveredZone === zone.id ? 1 : 0.7 }}
            />
          </g>
        ))}

        {/* Playing field */}
        <rect x="185" y="100" width="130" height="200" rx="8" fill="url(#field-gradient)" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
        {/* Field markings */}
        <line x1="185" y1="200" x2="315" y2="200" stroke="rgba(255,255,255,0.35)" strokeWidth="0.8" />
        <circle cx="250" cy="200" r="25" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="0.8" />
        <circle cx="250" cy="200" r="2" fill="rgba(255,255,255,0.5)" />
        <rect x="210" y="100" width="80" height="30" rx="2" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.6" />
        <rect x="210" y="270" width="80" height="30" rx="2" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.6" />

        {/* Hotspot markers with pulsing */}
        {HOTSPOTS.map((h, i) => {
          const d = hotspotDensities[i];
          const color = getDensityColor(d);
          return (
            <g key={h.label}>
              {/* Pulse ring */}
              <motion.circle
                cx={h.x} cy={h.y} r={8}
                fill="none" stroke={color} strokeWidth={1}
                animate={{ r: [8, 14], opacity: [0.6, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
              />
              {/* Inner dot */}
              <circle cx={h.x} cy={h.y} r={5} fill={color} opacity={0.9} filter="url(#glow)" />
              {/* Label */}
              <text x={h.x} y={h.y - 12} textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="7" fontWeight="600" fontFamily="Inter, sans-serif">
                {h.label}
              </text>
              {/* Density value */}
              <text x={h.x} y={h.y + 18} textAnchor="middle" fill={color} fontSize="8" fontWeight="700" fontFamily="monospace">
                {d}%
              </text>
            </g>
          );
        })}

        {/* Crowd count */}
        <text x="250" y="195" textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize="8" fontFamily="Inter, sans-serif">
          Total Crowd
        </text>
        <text x="250" y="212" textAnchor="middle" fill="white" fontSize="14" fontWeight="800" fontFamily="Outfit, sans-serif">
          {(32355 + tick * 12).toLocaleString()}
        </text>
      </svg>

      {/* Hovered zone tooltip */}
      <AnimatePresence>
        {hoveredZone && (() => {
          const zone = STADIUM_ZONES.find(z => z.id === hoveredZone);
          return (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              style={{
                position: 'absolute', bottom: -10, left: '50%', transform: 'translateX(-50%)',
                background: 'rgba(20,27,45,0.95)', border: `1px solid ${zone.color}40`,
                borderRadius: 12, padding: '8px 16px',
                display: 'flex', alignItems: 'center', gap: 10, backdropFilter: 'blur(10px)',
                boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 20px ${zone.color}15`,
              }}
            >
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: zone.color }} />
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'white' }}>{zone.label}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{zone.people.toLocaleString()} people</div>
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}

/* ─── Particle Background ─── */
function ParticleCanvas() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w = canvas.width = window.innerWidth;
    let h = canvas.height = window.innerHeight;

    const particles = Array.from({ length: 40 }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
      size: Math.random() * 1.5 + 0.5,
      color: Math.random() > 0.6 ? '#00D4FF' : Math.random() > 0.5 ? '#FF6B35' : '#7C4DFF',
      opacity: Math.random() * 0.3 + 0.05,
    }));

    let frame;
    function animate() {
      ctx.clearRect(0, 0, w, h);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color + Math.round(p.opacity * 255).toString(16).padStart(2, '0');
        ctx.fill();
      });
      particles.forEach((p, i) => {
        particles.slice(i + 1).forEach(q => {
          const d = Math.hypot(p.x - q.x, p.y - q.y);
          if (d < 120) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(0,212,255,${(1 - d / 120) * 0.06})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        });
      });
      frame = requestAnimationFrame(animate);
    }
    animate();

    const onResize = () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; };
    window.addEventListener('resize', onResize);
    return () => { cancelAnimationFrame(frame); window.removeEventListener('resize', onResize); };
  }, []);
  return <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} />;
}

/* ─── Main Landing Page ─── */
export default function LandingPage() {
  const { setUserRole, setCurrentPage, activeStadiumId } = useStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const firstPageByRole = {
    attendee: 'book_tickets',
    staff: 'staff',
    organizer: 'organizer',
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await authApi.login(email, password);
      const role = data.user.role;
      setUserRole(role);
      setCurrentPage(firstPageByRole[role]);
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
  };

  return (
    <div style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden', background: 'var(--gradient-hero)' }}>
      <ParticleCanvas />

      {/* Top Nav Bar */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '14px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        backdropFilter: 'blur(20px)', background: 'rgba(10,14,26,0.75)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #00D4FF, #7C4DFF)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 18, color: '#000',
            boxShadow: '0 0 20px rgba(0,212,255,0.4)',
          }}>V</div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.15rem', letterSpacing: '-0.02em' }}>VenueIQ</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '4px 12px', borderRadius: 20,
            background: 'rgba(0,230,118,0.08)', border: '1px solid rgba(0,230,118,0.25)',
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00E676' }} />
            <span style={{ fontSize: '0.72rem', color: '#00E676', fontWeight: 600 }}>System Online</span>
          </div>
        </div>
      </nav>

      {/* Main Split Layout */}
      <div style={{
        position: 'relative', zIndex: 1, minHeight: '100vh',
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        alignItems: 'center', padding: '80px 48px 40px',
        gap: 40,
      }}>

        {/* ─── LEFT: Stadium Map + Info ─── */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}
        >
          <motion.div variants={itemVariants} style={{ textAlign: 'center' }}>
            <h1 style={{
              fontSize: 'clamp(2rem, 4vw, 3.2rem)', fontWeight: 900,
              letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: 12,
            }}>
              Smart{' '}
              <span style={{
                background: 'linear-gradient(135deg, #00D4FF, #7C4DFF)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>
                Stadium
              </span>{' '}
              Management
            </h1>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', maxWidth: 440, margin: '0 auto', lineHeight: 1.7 }}>
              Real-time crowd intelligence, heatmaps, and AI-powered operations for next-gen venue experiences.
            </p>
          </motion.div>

          {/* Stadium Map */}
          <motion.div variants={itemVariants} style={{ width: '100%', maxWidth: 520 }}>
            <StadiumMap />
          </motion.div>

          {/* Quick stats below map */}
          <motion.div variants={itemVariants} style={{
            display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap',
          }}>
            {[
              { icon: MapPin, label: '4 Stadiums', color: '#00D4FF' },
              { icon: Users, label: 'Live Tracking', color: '#00E676' },
              { icon: Shield, label: 'Secure Access', color: '#7C4DFF' },
            ].map(({ icon: Icon, label, color }) => (
              <div key={label} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '6px 14px', borderRadius: 20,
                background: `${color}10`, border: `1px solid ${color}25`,
              }}>
                <Icon size={13} color={color} />
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color }}>{label}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* ─── RIGHT: Login Form ─── */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
          style={{ display: 'flex', justifyContent: 'center' }}
        >
          <div style={{
            width: '100%', maxWidth: 420,
            background: 'rgba(20,27,45,0.6)',
            backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)',
            border: '1px solid rgba(0,212,255,0.12)',
            borderRadius: 28, padding: '40px 36px',
            boxShadow: '0 25px 80px rgba(0,0,0,0.5), 0 0 60px rgba(0,212,255,0.06)',
          }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{
                width: 56, height: 56, borderRadius: 16, margin: '0 auto 16px',
                background: 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(124,77,255,0.15))',
                border: '1px solid rgba(0,212,255,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Lock size={24} color="#00D4FF" />
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 6, letterSpacing: '-0.02em' }}>
                VenueIQ
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Sign in to book and access details
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Email */}
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: 7, fontWeight: 600, letterSpacing: '0.03em' }}>EMAIL ADDRESS</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    id="login-email"
                    type="email"
                    className="input"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    style={{ paddingLeft: 40, height: 46, borderRadius: 12, fontSize: '0.9rem' }}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: 7, fontWeight: 600, letterSpacing: '0.03em' }}>PASSWORD</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    id="login-password"
                    type={showPass ? 'text' : 'password'}
                    className="input"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    style={{ paddingLeft: 40, paddingRight: 44, height: 46, borderRadius: 12, fontSize: '0.9rem' }}
                  />
                  <button type="button" onClick={() => setShowPass(s => !s)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '10px 14px', background: 'rgba(255,23,68,0.1)',
                      border: '1px solid rgba(255,23,68,0.3)', borderRadius: 10,
                      fontSize: '0.82rem', color: 'var(--color-red)',
                    }}>
                    <AlertCircle size={14} />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit Button */}
              <motion.button
                id="login-submit-btn"
                type="submit"
                whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(0,212,255,0.3)' }}
                whileTap={{ scale: 0.97 }}
                disabled={loading}
                style={{
                  width: '100%', padding: '14px', borderRadius: 14, marginTop: 4,
                  background: loading ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg, #00D4FF, #7C4DFF)',
                  color: '#000', border: 'none', fontWeight: 700, fontSize: '0.95rem',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'all 0.2s',
                }}
              >
                {loading ? (
                  <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Signing in...</>
                ) : (
                  <>Sign In <ChevronRight size={16} /></>
                )}
              </motion.button>
            </form>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '22px 0' }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>OR</span>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
            </div>

            {/* Quick Demo Credentials */}
            <div style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 16, padding: '16px', marginBottom: 16,
            }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Quick Login
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  { label: 'Attendee', email: 'attendee@demo.com', emoji: '🎫', color: '#00D4FF' },
                  { label: 'Staff', email: 'staff@chinnaswamy.com', emoji: '👮', color: '#FF6B35' },
                  { label: 'Organizer', email: 'organizer@chinnaswamy.com', emoji: '📊', color: '#7C4DFF' },
                ].map(cred => (
                  <motion.button
                    key={cred.label}
                    type="button"
                    whileHover={{ scale: 1.01, borderColor: `${cred.color}60` }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { setEmail(cred.email); setPassword('demo1234'); setError(''); }}
                    style={{
                      width: '100%', padding: '9px 12px', borderRadius: 10,
                      background: `${cred.color}08`,
                      border: `1px solid ${cred.color}20`,
                      color: 'var(--text-secondary)', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 10,
                      fontSize: '0.82rem', fontWeight: 500, transition: 'all 0.2s',
                    }}
                  >
                    <span>{cred.emoji}</span>
                    <span style={{ flex: 1, textAlign: 'left' }}>{cred.label}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{cred.email}</span>
                  </motion.button>
                ))}
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 8, textAlign: 'center' }}>
                Password for all: <span style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>demo1234</span>
              </div>
            </div>

            {/* Register link */}
            <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Don't have an account?{' '}
              <span
                onClick={() => setCurrentPage('register')}
                style={{ color: 'var(--color-electric-blue)', cursor: 'pointer', fontWeight: 600 }}
              >
                Create Account
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bottom subtle gradient line */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, height: 2,
        background: 'linear-gradient(90deg, transparent, #00D4FF, #7C4DFF, #FF6B35, transparent)',
        opacity: 0.4, zIndex: 10,
      }} />
    </div>
  );
}

/**
 * LoginPage — calls POST /api/auth/login
 * Shows email/password form; on success sets JWT + role in store
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Mail, Eye, EyeOff, Zap, ArrowLeft, AlertCircle } from 'lucide-react';
import { auth as authApi } from '../api/apiService';
import useStore from '../store/useStore';

const ROLE_META = {
  attendee:  { emoji: '🎫', color: '#00D4FF', desc: 'Access venue map, queues & schedule' },
  staff:     { emoji: '👮', color: '#FF6B35', desc: 'Manage crowd, incidents & staff dispatch' },
  organizer: { emoji: '📊', color: '#7C4DFF', desc: 'Analytics, revenue & AI predictions' },
};

const DEMO_CREDS = {
  attendee:  { email: 'attendee@demo.com',                    password: 'demo1234' },
  staff:     { email: 'staff_mc@gmail.com',                   password: 'demo1234' },
  organizer: { email: 'organiser_mc@gmail.com',               password: 'demo1234' },
};

export default function LoginPage({ role = 'attendee', onBack, onNavigateRegister }) {
  const { setUserRole, setCurrentPage, setCurrentUser, activeStadiumId } = useStore();
  const meta = ROLE_META[role];

  const [email, setEmail]       = useState(DEMO_CREDS[role]?.email || '');
  const [password, setPassword] = useState(DEMO_CREDS[role]?.password || '');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const firstPageByRole = {
    attendee:  'book_tickets',
    staff:     'staff',
    organizer: 'organizer',
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await authApi.login(email, password);
      console.log('[LOGIN] User object:', data.user);
      console.log('[LOGIN] Stadium_id:', data.user.stadium_id);
      setCurrentUser(data.user); // Store full user with stadium_id
      setUserRole(data.user.role);
      // Save stadium_id to localStorage for staff/organizers (for API filtering)
      if ((data.user.role === 'staff' || data.user.role === 'organizer') && data.user.stadium_id) {
        localStorage.setItem('venueiq_stadium', data.user.stadium_id);
        console.log('[LOGIN] Saved to localStorage:', data.user.stadium_id);
      } else {
        localStorage.removeItem('venueiq_stadium'); // Attendees see all stadiums
      }
      setCurrentPage(firstPageByRole[data.user.role]);
    } catch (err) {
      setError(err.message || 'Login failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setEmail(DEMO_CREDS[role].email);
    setPassword(DEMO_CREDS[role].password);
    setError('');
    setLoading(true);
    try {
      const data = await authApi.login(DEMO_CREDS[role].email, DEMO_CREDS[role].password);
      setCurrentUser(data.user); // Store full user with stadium_id
      setUserRole(data.user.role);
      // Save stadium_id to localStorage for staff/organizers (for API filtering)
      if ((data.user.role === 'staff' || data.user.role === 'organizer') && data.user.stadium_id) {
        localStorage.setItem('venueiq_stadium', data.user.stadium_id);
      } else {
        localStorage.removeItem('venueiq_stadium'); // Attendees see all stadiums
      }
      setCurrentPage(firstPageByRole[data.user.role]);
    } catch (err) {
      // Backend offline — fall through to demo mode
      setUserRole(role);
      setCurrentPage(firstPageByRole[role]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--gradient-hero)', padding: 24,
      }}
    >
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Back */}
        <button onClick={onBack}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', marginBottom: 24, fontSize: '0.85rem' }}>
          <ArrowLeft size={15} /> Back to role selection
        </button>

        {/* Card */}
        <div style={{
          background: 'var(--color-bg-card)', border: '1px solid var(--border-card)',
          borderRadius: 24, padding: '32px 28px', boxShadow: 'var(--shadow-xl)',
        }}>
          {/* Logo + role badge */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{
              width: 60, height: 60, borderRadius: 16, margin: '0 auto 14px',
              background: `${meta.color}20`, border: `2px solid ${meta.color}40`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
            }}>{meta.emoji}</div>
            <h2 style={{ fontSize: '1.4rem', marginBottom: 6 }}>Sign in to VenueIQ</h2>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{meta.desc}</div>
            <div style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, background: `${meta.color}15`, border: `1px solid ${meta.color}30` }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: meta.color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{role} access</span>
            </div>
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Email */}
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  id="login-email"
                  type="email"
                  className="input"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  style={{ paddingLeft: 36 }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  id="login-password"
                  type={showPass ? 'text' : 'password'}
                  className="input"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{ paddingLeft: 36, paddingRight: 40 }}
                />
                <button type="button" onClick={() => setShowPass(s => !s)}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: 'rgba(255,23,68,0.1)', border: '1px solid rgba(255,23,68,0.3)', borderRadius: 10, fontSize: '0.82rem', color: 'var(--color-red)' }}>
                  <AlertCircle size={14} />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <motion.button
              id="login-submit-btn"
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              disabled={loading}
              style={{
                width: '100%', padding: '12px', borderRadius: 12,
                background: loading ? 'rgba(255,255,255,0.08)' : `linear-gradient(135deg, ${meta.color}, ${meta.color}CC)`,
                color: role === 'attendee' ? '#000' : '#fff', border: 'none',
                fontWeight: 700, fontSize: '0.95rem', cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s',
              }}
            >
              {loading ? <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Signing in...</> : `Sign in as ${role.charAt(0).toUpperCase() + role.slice(1)}`}
            </motion.button>

            {/* Demo one-click */}
            <button type="button" onClick={handleDemoLogin}
              style={{ width: '100%', padding: '10px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Zap size={14} />
              One-click Demo Login
            </button>
          </form>

          <div style={{ marginTop: 24, fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center' }}>
            Don't have an account?{' '}
            <span 
              onClick={onNavigateRegister} 
              style={{ color: 'var(--color-electric-blue)', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline' }}
            >
              Create Account
            </span>
          </div>

          {/* Demo creds hint */}
          <div style={{ marginTop: 20, padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5, textAlign: 'center' }}>
            Demo: <span style={{ color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{DEMO_CREDS[role]?.email}</span> / <span style={{ fontFamily: 'monospace' }}>demo1234</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

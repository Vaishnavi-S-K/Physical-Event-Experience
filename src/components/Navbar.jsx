import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Map, Users, Bell, LogOut, Menu, X,
  Activity, Zap, Shield, Settings, BarChart3, AlertTriangle,
  Ticket, ChevronDown, Radio, BookOpen, QrCode, Zap as TrendingUp
} from 'lucide-react';
import useStore from '../store/useStore';

const roleConfig = {
  attendee: {
    label: 'Attendee',
    color: '#00D4FF',
    icon: '🎫',
    nav: [
      { id: 'book_tickets', label: 'Book Tickets', icon: Ticket },
      { id: 'my_bookings', label: 'My Bookings', icon: BookOpen },
    ],
  },
  staff: {
    label: 'Staff',
    color: '#FF6B35',
    icon: '👮',
    nav: [
      { id: 'staff-dashboard', label: 'Live Overview', icon: Radio },
      { id: 'crowd-monitoring', label: 'Crowd Monitor', icon: TrendingUp },
      { id: 'incidents', label: 'Incident Board', icon: AlertTriangle },
      { id: 'dispatch', label: 'Staff Dispatch', icon: Users },
    ],
  },
  organizer: {
    label: 'Organizer',
    color: '#7C4DFF',
    icon: '📊',
    nav: [
      { id: 'organizer-dashboard', label: 'Analytics Hub', icon: BarChart3 },
      { id: 'crowd-monitoring', label: 'Crowd Monitor', icon: TrendingUp },
      { id: 'predictions', label: 'AI Predictions', icon: Zap },
      { id: 'operations', label: 'Operations', icon: Shield },
    ],
  },
};

export default function Navbar() {
  const { userRole, setUserRole, setCurrentPage, currentPage, notifications, unreadCount, markAllRead, activeMobileMenu, setActiveMobileMenu, setCurrentUser } = useStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  if (!userRole) return null;
  const config = roleConfig[userRole];

  const handleNavClick = (id) => {
    setCurrentPage(id);
    setActiveMobileMenu(false);
  };

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {activeMobileMenu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 199, backdropFilter: 'blur(4px)' }}
            onClick={() => setActiveMobileMenu(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        className={`sidebar ${activeMobileMenu ? 'open' : ''}`}
        initial={false}
      >
        {/* Logo */}
        <div style={{ padding: '24px 20px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: 'linear-gradient(135deg, #00D4FF, #7C4DFF)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-display)',
              color: '#000', boxShadow: '0 0 20px rgba(0,212,255,0.3)',
            }}>V</div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.02em' }}>VenueIQ</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Event Platform</div>
            </div>
          </div>

          {/* Role Badge */}
          <div
            style={{
              marginTop: 12,
              padding: '6px 12px',
              borderRadius: 'var(--radius-full)',
              background: `${config.color}18`,
              border: `1px solid ${config.color}40`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16 }}>{config.icon}</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: config.color, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{config.label}</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 4, overflowY: 'auto' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '4px 8px 8px' }}>Navigation</div>
          {config.nav.map(item => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <motion.button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.97 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 10,
                  background: isActive ? `${config.color}18` : 'transparent',
                  border: `1px solid ${isActive ? config.color + '40' : 'transparent'}`,
                  color: isActive ? config.color : 'var(--text-secondary)',
                  cursor: 'pointer', transition: 'all 0.2s',
                  fontSize: '0.9rem', fontWeight: 500,
                }}
              >
                <Icon size={17} />
                {item.label}
                {isActive && (
                  <div style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: config.color }} />
                )}
              </motion.button>
            );
          })}
        </nav>

        {/* Live Status */}
        <div style={{ padding: '12px 16px', margin: '0 12px 12px', background: 'rgba(0,230,118,0.06)', border: '1px solid rgba(0,230,118,0.2)', borderRadius: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div className="live-dot" />
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-green)', letterSpacing: '0.08em' }}>LIVE EVENT</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Champions League Final</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>Grand Arena • 65,000 cap.</div>
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', padding: '12px 16px' }}>
          <button
            onClick={() => {
              setUserRole(null);
              setCurrentUser(null);
              localStorage.removeItem('venueiq_stadium');
              localStorage.removeItem('venueiq_currentUser');
              localStorage.removeItem('venueiq_token');
              setCurrentPage('landing');
              console.log('[LOGOUT] Cleared user and localStorage');
            }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.85rem', padding: '6px 4px', width: '100%', transition: 'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--color-red)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            <LogOut size={16} />
            Exit Platform
          </button>
        </div>
      </motion.aside>

      {/* Top Bar (mobile) */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: 56,
        background: 'var(--color-bg-secondary)', borderBottom: '1px solid var(--border-subtle)',
        display: 'none', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px', zIndex: 199,
        '@media (max-width: 768px)': { display: 'flex' },
      }} className="mobile-topbar">
        <button onClick={() => setActiveMobileMenu(!activeMobileMenu)}
          style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', padding: 4 }}>
          {activeMobileMenu ? <X size={22} /> : <Menu size={22} />}
        </button>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1rem' }}>VenueIQ</div>
        <button onClick={() => { setShowNotifications(!showNotifications); markAllRead(); }}
          style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', padding: 4, position: 'relative' }}>
          <Bell size={20} />
          {unreadCount > 0 && (
            <span style={{ position: 'absolute', top: 0, right: 0, width: 16, height: 16, background: 'var(--color-red)', borderRadius: '50%', fontSize: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Notification Bell (Desktop top-right — inject via CSS) */}
      <div style={{
        position: 'fixed', top: 20, right: 24, zIndex: 300,
      }}>
        <div style={{ position: 'relative' }}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { setShowNotifications(!showNotifications); if (!showNotifications) markAllRead(); }}
            style={{
              width: 42, height: 42, borderRadius: 12,
              background: 'var(--color-bg-card)', border: '1px solid var(--border-subtle)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', position: 'relative',
            }}
          >
            <Bell size={18} color="var(--text-secondary)" />
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                style={{
                  position: 'absolute', top: -4, right: -4,
                  width: 18, height: 18, borderRadius: '50%',
                  background: 'var(--color-red)', fontSize: '0.65rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, color: '#fff',
                }}
              >{unreadCount}</motion.span>
            )}
          </motion.button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                style={{
                  position: 'absolute', top: '100%', right: 0, marginTop: 8,
                  width: 340, background: 'var(--color-bg-card)',
                  border: '1px solid var(--border-card)', borderRadius: 16,
                  boxShadow: 'var(--shadow-xl)', overflow: 'hidden',
                }}
              >
                <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Notifications</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-electric-blue)', cursor: 'pointer' }}>Mark all read</span>
                </div>
                <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                  {notifications.slice(0, 8).map(n => (
                    <div key={n.id} style={{
                      padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)',
                      background: n.read ? 'transparent' : 'rgba(0,212,255,0.03)',
                    }}>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                        <span style={{ fontSize: 16 }}>
                          {n.type === 'warning' ? '⚠️' : n.type === 'success' ? '✅' : n.type === 'danger' ? '🚨' : 'ℹ️'}
                        </span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>{n.message}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 3 }}>{n.time}</div>
                        </div>
                        {!n.read && <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--color-electric-blue)', marginTop: 3, flexShrink: 0 }} />}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .mobile-topbar { display: flex !important; }
          .main-content { padding-top: 70px !important; }
        }
      `}</style>
    </>
  );
}

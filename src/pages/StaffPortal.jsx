import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, Users, AlertTriangle, Activity, MapPin, Clock, Shield, Zap } from 'lucide-react';
import VenueMap from '../components/VenueMap';
import IncidentBoard from '../components/IncidentBoard';
import useStore from '../store/useStore';
import { event as eventApi, zones as zonesApi } from '../api/apiService';

function StaffCard({ member }) {
  const statusColors = {
    active: 'var(--color-green)',
    responding: 'var(--color-orange)',
    break: 'var(--text-muted)',
  };
  const color = statusColors[member.status] || 'var(--text-muted)';

  return (
    <motion.div
      layout
      className="card"
      style={{ padding: '12px 14px' }}
      whileHover={{ y: -2 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          background: `${color}18`, border: `2px solid ${color}40`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
        }}>{member.avatar || '👮'}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{member.name}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
            <MapPin size={10} />
            {member.location}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: 20, background: `${color}15`, color, border: `1px solid ${color}30`, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, marginBottom: 4 }}>
            {member.status}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{member.role}</div>
        </div>
      </div>
    </motion.div>
  );
}

function ZoneSummaryRow({ zone, density }) {
  const getDensityColor = (d) => d < 30 ? 'var(--color-green)' : d < 55 ? 'var(--color-yellow)' : d < 75 ? 'var(--color-orange)' : 'var(--color-red)';
  const getLabel = (d) => d < 30 ? 'Clear' : d < 55 ? 'Moderate' : d < 75 ? 'High' : 'Critical';
  const color = getDensityColor(density);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border-subtle)' }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
      <span style={{ flex: 1, fontSize: '0.87rem' }}>{zone.name}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 80, height: 5, background: 'rgba(255,255,255,0.08)', borderRadius: 3 }}>
          <div style={{ width: `${density}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 1s ease' }} />
        </div>
        <span style={{ fontSize: '0.82rem', fontWeight: 700, color, minWidth: 35, textAlign: 'right' }}>{Math.round(density)}%</span>
        <span style={{ fontSize: '0.7rem', padding: '2px 7px', borderRadius: 20, background: `${color}15`, color, border: `1px solid ${color}30`, minWidth: 64, textAlign: 'center' }}>{getLabel(density)}</span>
      </div>
    </div>
  );
}

export default function StaffPortal() {
  const [activeTab, setActiveTab] = useState('overview');
  const { staff: storeStaff, incidents, zoneDensities, totalAttendees, activeIncidents, eventPhase, setEventPhase, currentUser } = useStore();
  const EVENT_PHASES = ['Pre-Game', 'Kick-Off', 'First Half', 'Half-Time', 'Second Half', 'Full-Time', 'Post-Game'];

  // Staff can only see their assigned stadium
  // Use currentUser.stadium_id first, then fallback to localStorage
  const stadiumId = currentUser?.stadium_id || localStorage.getItem('venueiq_stadium');
  console.log('[StaffPortal] currentUser:', currentUser);
  console.log('[StaffPortal] Resolved stadiumId:', stadiumId);

  // Use live backend staff list; fall back to Zustand
  const [staff, setStaff] = useState(storeStaff || []);
  const [zones, setZones] = useState([]);

  const fetchData = useCallback(async () => {
    if (!stadiumId) return; // Don't fetch if no stadium assigned
    
    try {
      const [_staff, _zones] = await Promise.all([
        eventApi.getStaff().catch(() => []),
        zonesApi.getAll().catch(() => [])
      ]);
      if (_staff?.length) setStaff(_staff);
      if (_zones?.length) setZones(_zones);
    } catch { /* offline — keep local */ }
  }, [stadiumId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handlePhaseChange = async (newPhase) => {
    setEventPhase(newPhase);  // update local store immediately
    try { await eventApi.updateState({ current_phase: newPhase }); } catch { /* offline */ }
  };

  const criticalZones = zones.filter(z => (zoneDensities[z.id] || 0) > 75 && z.type !== 'field');
  const activeStaff = staff.filter(s => s.status === 'active').length;

  return (
    <div>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: 'linear-gradient(135deg, rgba(255,107,53,0.12) 0%, rgba(255,23,68,0.06) 100%)',
          border: '1px solid rgba(255,107,53,0.25)', borderRadius: 16,
          padding: '20px 24px', marginBottom: 24,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Shield size={18} color="var(--color-orange)" />
            <span style={{ fontSize: '0.8rem', color: 'var(--color-orange)', fontWeight: 700, letterSpacing: '0.1em' }}>STAFF OPERATIONS CENTER</span>
          </div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: 2 }}>Live Operations View</h2>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Real-time crowd monitoring, incident management, and staff coordination.</p>
        </div>

        {/* Event Phase Control */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>CURRENT PHASE</span>
          <select
            value={eventPhase}
            onChange={e => handlePhaseChange(e.target.value)}
            style={{
              background: 'rgba(255,107,53,0.12)', border: '1px solid rgba(255,107,53,0.3)',
              borderRadius: 10, padding: '8px 12px', color: 'var(--color-orange)',
              fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
            }}
          >
            {EVENT_PHASES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Attendees', value: totalAttendees.toLocaleString(), icon: Users, color: 'var(--color-electric-blue)' },
          { label: 'Active Incidents', value: activeIncidents, icon: AlertTriangle, color: activeIncidents > 2 ? 'var(--color-red)' : 'var(--color-orange)' },
          { label: 'Critical Zones', value: criticalZones.length, icon: Zap, color: criticalZones.length > 0 ? 'var(--color-red)' : 'var(--color-green)' },
          { label: 'Staff On Duty', value: activeStaff, icon: Shield, color: 'var(--color-green)' },
        ].map(({ label, value, icon: Icon, color }) => (
          <motion.div key={label} className="stat-card" whileHover={{ y: -2 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={17} color={color} />
              </div>
              <div className="live-dot" />
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color, fontFamily: 'var(--font-display)', marginBottom: 4 }}>{value}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{label}</div>
          </motion.div>
        ))}
      </div>

      {/* Critical Zones Alert */}
      <AnimatePresence>
        {criticalZones.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              background: 'rgba(255,23,68,0.08)', border: '1px solid rgba(255,23,68,0.3)',
              borderRadius: 14, padding: '14px 16px', marginBottom: 20,
              display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap',
            }}
          >
            <AlertTriangle size={20} color="var(--color-red)" />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: 'var(--color-red)', marginBottom: 4 }}>⚠️ Critical Zone Alert</div>
              <div style={{ fontSize: '0.83rem', color: 'var(--text-secondary)' }}>
                {criticalZones.map(z => z.name).join(' · ')} — density exceeds 75%.
              </div>
            </div>
            <div className="animate-blink" style={{ color: 'var(--color-red)', fontSize: '0.75rem', fontWeight: 700 }}>IMMEDIATE ACTION REQUIRED</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div style={{ marginBottom: 20 }}>
        <div className="tab-nav">
          {[['overview', '📊 Overview'], ['heatmap', '🗺️ Live Heatmap'], ['incidents', '🚨 Incidents'], ['staff', '👥 Staff']].map(([k, l]) => (
            <button key={k} className={`tab-btn ${activeTab === k ? 'active' : ''}`} onClick={() => setActiveTab(k)}>{l}</button>
          ))}
        </div>
      </div>

      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Left: zone summary */}
          <div className="card">
            <h4 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Activity size={16} color="var(--color-electric-blue)" />
              Zone Density Monitor
            </h4>
            {zones.filter(z => z.type !== 'field').map(zone => (
              <ZoneSummaryRow key={zone.id} zone={zone} density={zoneDensities[zone.id] || 30} />
            ))}
          </div>

          {/* Right: map preview */}
          <div>
            <div style={{ marginBottom: 12 }}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Radio size={16} color="var(--color-orange)" />
                Live Venue Map
              </h4>
            </div>
            <VenueMap zones={zones} stadiumId={stadiumId} showHeatmap={true} showLabels={true} interactive={true} height={420} />
          </div>
        </div>
      )}

      {activeTab === 'heatmap' && (
        <div>
          <VenueMap zones={zones} stadiumId={stadiumId} showHeatmap={true} showLabels={true} interactive={true} height={580} />
        </div>
      )}

      {activeTab === 'incidents' && <IncidentBoard />}

      {activeTab === 'staff' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3>Staff Roster</h3>
            <div style={{ display: 'flex', gap: 8 }}>
              <span className="badge badge-success">● {staff.filter(s => s.status === 'active').length} Active</span>
              <span className="badge badge-warning">● {staff.filter(s => s.status === 'responding').length} Responding</span>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {staff.map(member => <StaffCard key={member.id} member={member} />)}
          </div>
        </div>
      )}
    </div>
  );
}

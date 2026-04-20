import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Plus, CheckCircle, Clock, User, Radio, ChevronDown, RefreshCw } from 'lucide-react';
import { incidents as incidentsApi } from '../api/apiService';

const SEVERITY_CONFIG = {
  high:   { color: 'var(--color-red)',    bg: 'var(--color-red-glow)',    label: 'HIGH',   icon: '🔴' },
  medium: { color: 'var(--color-orange)', bg: 'var(--color-orange-glow)', label: 'MEDIUM', icon: '🟠' },
  low:    { color: 'var(--color-yellow)', bg: 'rgba(255,214,0,0.15)',     label: 'LOW',    icon: '🟡' },
};
const STATUS_CONFIG = {
  active:     { color: 'var(--color-red)',    label: 'Active',     icon: Radio },
  responding: { color: 'var(--color-orange)', label: 'Responding', icon: Clock },
  pending:    { color: 'var(--color-yellow)', label: 'Pending',    icon: AlertTriangle },
  resolved:   { color: 'var(--color-green)',  label: 'Resolved',   icon: CheckCircle },
};
const TYPE_ICONS = { crowd:'👥', medical:'🏥', security:'🛡️', maintenance:'🔧', fire:'🔥', other:'⚠️' };

function IncidentCard({ incident, onResolve, onUpdate }) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading]   = useState(false);
  const sev = SEVERITY_CONFIG[incident.severity] || SEVERITY_CONFIG.low;
  const status = STATUS_CONFIG[incident.status] || STATUS_CONFIG.pending;

  const timeStr = incident.created_at
    ? new Date(incident.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    : incident.time || '';

  const handleAction = async (updates) => {
    setLoading(true);
    try { await onUpdate(incident.id, updates); } finally { setLoading(false); }
  };

  return (
    <motion.div layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, height: 0 }}
      style={{
        background: 'var(--color-bg-card)', border: '1px solid',
        borderColor: incident.status === 'resolved' ? 'var(--border-subtle)' : `${sev.color}30`,
        borderRadius: 14, padding: 16, opacity: incident.status === 'resolved' ? 0.6 : 1, transition: 'all 0.3s',
      }}
    >
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, background: sev.bg, border: `1px solid ${sev.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
          {TYPE_ICONS[incident.type] || '⚠️'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: sev.bg, color: sev.color, border: `1px solid ${sev.color}40`, letterSpacing: '0.08em' }}>{sev.label}</span>
                <span style={{ fontSize: '0.65rem', fontWeight: 600, padding: '2px 7px', borderRadius: 20, background: `${status.color}18`, color: status.color, border: `1px solid ${status.color}40` }}>
                  {incident.status.toUpperCase()}
                </span>
              </div>
              <p style={{ color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: 500, lineHeight: 1.4, margin: 0 }}>{incident.message}</p>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', flexShrink: 0 }}>{timeStr}</span>
          </div>

          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            {incident.zone_id && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                <span>📍</span><span>{incident.zone_name || incident.zone_id}</span>
              </div>
            )}
            {incident.assigned_to && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                <User size={12} /><span>{incident.assigned_to}</span>
              </div>
            )}
          </div>

          {incident.status !== 'resolved' && (
            <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {incident.status === 'pending' && (
                <button disabled={loading} onClick={() => handleAction({ status: 'responding' })}
                  style={{ padding: '6px 14px', borderRadius: 8, background: 'var(--color-orange-glow)', border: '1px solid rgba(255,107,53,0.4)', color: 'var(--color-orange)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
                  Respond
                </button>
              )}
              {incident.status === 'active' && (
                <button disabled={loading} onClick={() => handleAction({ status: 'responding' })}
                  style={{ padding: '6px 14px', borderRadius: 8, background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.3)', color: 'var(--color-electric-blue)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
                  Start Responding
                </button>
              )}
              <button disabled={loading} onClick={() => handleAction({ status: 'resolved' })}
                style={{ padding: '6px 14px', borderRadius: 8, background: 'var(--color-green-glow)', border: '1px solid rgba(0,230,118,0.4)', color: 'var(--color-green)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
                {loading ? '...' : '✓ Resolve'}
              </button>
              <button onClick={() => setExpanded(!expanded)}
                style={{ padding: '6px 10px', borderRadius: 8, background: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                Details <ChevronDown size={13} style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
              </button>
            </div>
          )}

          <AnimatePresence>
            {expanded && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                style={{ overflow: 'hidden', marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[
                    { label: 'Incident ID', value: incident.id.slice(0, 8).toUpperCase() },
                    { label: 'Type', value: incident.type.charAt(0).toUpperCase() + incident.type.slice(1) },
                    { label: 'Zone', value: incident.zone_name || incident.zone_id || 'Unknown' },
                    { label: 'Assigned To', value: incident.assigned_to || 'Unassigned' },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '8px 10px' }}>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: 2 }}>{label}</div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 500 }}>{value}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Escalate to:</span>
                  {['Security HQ', 'Medical Team', 'Operations'].map(team => (
                    <button key={team} onClick={() => handleAction({ assigned_to: team })}
                      style={{ padding: '4px 10px', borderRadius: 20, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', fontSize: '0.72rem', cursor: 'pointer' }}>
                      {team}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

function NewIncidentModal({ onClose, onSubmit }) {
  const [form, setForm]   = useState({ type: 'crowd', severity: 'medium', zone_id: 'gate-a', message: '', assigned_to: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.message) return;
    setLoading(true);
    try { await onSubmit(form); onClose(); } catch (e) { alert(e.message); } finally { setLoading(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(8px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
        style={{ background: 'var(--color-bg-card)', borderRadius: 20, padding: 24, width: '100%', maxWidth: 480, border: '1px solid var(--border-card)' }}>
        <h3 style={{ marginBottom: 20 }}>🚨 Report Incident</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Type</label>
              <select className="input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                {Object.keys(TYPE_ICONS).map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Severity</label>
              <select className="input" value={form.severity} onChange={e => setForm({ ...form, severity: e.target.value })}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Zone</label>
            <select className="input" value={form.zone_id} onChange={e => setForm({ ...form, zone_id: e.target.value })}>
              {['gate-a','gate-b','gate-c','gate-d','food-1','food-2','food-3','restroom-1','restroom-2','restroom-3','restroom-4','medical','merch','vip'].map(z => (
                <option key={z} value={z}>{z}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Description</label>
            <textarea className="input" rows={3} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="Describe the incident..." style={{ resize: 'vertical', minHeight: 80 }} />
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Assign to (optional)</label>
            <input className="input" value={form.assigned_to} onChange={e => setForm({ ...form, assigned_to: e.target.value })} placeholder="Team or person name" />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button onClick={onClose} className="btn btn-ghost" style={{ flex: 1 }}>Cancel</button>
          <button className="btn btn-danger" style={{ flex: 2, opacity: loading ? 0.7 : 1 }} onClick={handleSubmit} disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Incident Report'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function IncidentBoard() {
  const [incidents, setIncidents] = useState([]);
  const [filter, setFilter]       = useState('active');
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading]     = useState(true);
  const [stats, setStats]         = useState({ total: 0, active: 0, pending: 0, resolved: 0 });

  const fetchIncidents = useCallback(async () => {
    try {
      const [data, s] = await Promise.all([incidentsApi.getAll(), incidentsApi.getStats()]);
      setIncidents(data);
      setStats(s);
    } catch {
      // Backend offline — keep existing data
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchIncidents(); }, [fetchIncidents]);
  useEffect(() => {
    const t = setInterval(fetchIncidents, 8000);
    return () => clearInterval(t);
  }, [fetchIncidents]);

  const handleCreate = async (formData) => {
    const created = await incidentsApi.create(formData);
    setIncidents(prev => [created, ...prev]);
    setStats(s => ({ ...s, total: s.total + 1, active: s.active + 1 }));
  };

  const handleUpdate = async (id, updates) => {
    const updated = await incidentsApi.update(id, updates);
    setIncidents(prev => prev.map(i => i.id === id ? updated : i));
    // Recompute stats
    const freshStats = await incidentsApi.getStats().catch(() => stats);
    setStats(freshStats);
  };

  const filtered = incidents.filter(i => {
    if (filter === 'active')   return i.status === 'active' || i.status === 'responding';
    if (filter === 'pending')  return i.status === 'pending';
    if (filter === 'resolved') return i.status === 'resolved';
    return true;
  });

  const counts = {
    active:   incidents.filter(i => ['active','responding'].includes(i.status)).length,
    pending:  incidents.filter(i => i.status === 'pending').length,
    resolved: incidents.filter(i => i.status === 'resolved').length,
    all:      incidents.length,
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', marginBottom: 4 }}>Incident Board</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Real-time incident tracking — data from backend</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={fetchIncidents} style={{ background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '8px 12px', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.8rem' }}>
            <RefreshCw size={13} /> Refresh
          </button>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setShowModal(true)} className="btn btn-danger">
            <Plus size={16} /> Report Incident
          </motion.button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Active', value: counts.active, color: 'var(--color-red)' },
          { label: 'Pending', value: counts.pending, color: 'var(--color-yellow)' },
          { label: 'Resolved', value: counts.resolved, color: 'var(--color-green)' },
          { label: 'Total', value: counts.all, color: 'var(--color-electric-blue)' },
        ].map(({ label, value, color }) => (
          <div key={label} className="stat-card" style={{ padding: '12px 14px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color, fontFamily: 'var(--font-display)' }}>{value}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 16 }}>
        <div className="tab-nav">
          {[['active', 'Active'], ['pending', 'Pending'], ['resolved', 'Resolved'], ['all', 'All']].map(([k, l]) => (
            <button key={k} className={`tab-btn ${filter === k ? 'active' : ''}`} onClick={() => setFilter(k)}>
              {l} {counts[k] > 0 && `(${counts[k]})`}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0', color: 'var(--text-muted)', gap: 10 }}>
          <div className="spinner" /> Loading incidents from backend...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <AnimatePresence mode="popLayout">
            {filtered.map(incident => (
              <IncidentCard key={incident.id} incident={incident} onResolve={(id) => handleUpdate(id, { status: 'resolved' })} onUpdate={handleUpdate} />
            ))}
          </AnimatePresence>
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>✅</div>
              <div style={{ fontWeight: 600 }}>No {filter} incidents</div>
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {showModal && <NewIncidentModal onClose={() => setShowModal(false)} onSubmit={handleCreate} />}
      </AnimatePresence>
    </div>
  );
}

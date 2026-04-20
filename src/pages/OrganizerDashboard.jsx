import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, DollarSign, Users, Zap, Activity } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell
} from 'recharts';
import CrowdPredictions from '../components/CrowdPredictions';
import VenueMap from '../components/VenueMap';
import useStore from '../store/useStore';
import StadiumFetcher from '../components/StadiumFetcher';
import { event as eventApi } from '../api/apiService';

const TOOLTIP_STYLE = {
  contentStyle: { background: 'var(--color-bg-card)', border: '1px solid var(--border-card)', borderRadius: 10, color: 'var(--text-primary)', fontSize: 12 },
  labelStyle: { color: 'var(--text-secondary)' },
};

const PIE_COLORS = ['#00D4FF', '#FF6B35', '#7C4DFF', '#00E676', '#FFD600'];

const SATISFACTION_DATA = [
  { category: 'Navigation', score: 82 },
  { category: 'Queue Mgmt', score: 74 },
  { category: 'Concessions', score: 68 },
  { category: 'Facilities', score: 79 },
  { category: 'Overall', score: 76 },
];

const REVENUE_BREAKDOWN = [
  { name: 'Food & Beverage', value: 128000 },
  { name: 'Merchandise', value: 55000 },
  { name: 'Premium Seats', value: 20000 },
  { name: 'Parking', value: 12000 },
  { name: 'Other', value: 8000 },
];

function KPICard({ title, value, subValue, icon: Icon, color, trend, detail }) {
  return (
    <motion.div className="stat-card" whileHover={{ y: -3 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={20} color={color} />
        </div>
        {trend && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: trend > 0 ? 'var(--color-green)' : 'var(--color-red)', background: trend > 0 ? 'rgba(0,230,118,0.1)' : 'rgba(255,23,68,0.1)', padding: '3px 8px', borderRadius: 20 }}>
            <TrendingUp size={11} style={{ transform: trend < 0 ? 'scaleY(-1)' : 'none' }} />
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div style={{ fontSize: '1.8rem', fontWeight: 800, color, fontFamily: 'var(--font-display)', marginBottom: 4 }}>{value}</div>
      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: 3 }}>{title}</div>
      {subValue && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{subValue}</div>}
      {detail && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6 }}>{detail}</div>}
    </motion.div>
  );
}

export default function OrganizerDashboard() {
  const [activeTab, setActiveTab] = useState('analytics');
  const { revenueData: storeRevenue, crowdFlowHistory: storeFlow, totalAttendees, avgWaitTime, currentUser } = useStore();

  // Staff/Organizers can only see their assigned stadium
  // Use currentUser.stadium_id first, then fallback to localStorage
  const stadiumId = currentUser?.stadium_id || localStorage.getItem('venueiq_stadium');

  const [revenueData, setRevenueData]   = useState(storeRevenue || []);
  const [crowdFlowHistory, setCrowdFlow] = useState(storeFlow || []);
  const [eventState, setEventState]     = useState(null);
  const [zones, setZones]               = useState([]);

  useEffect(() => {
    if (!stadiumId) return; // Don't fetch if no stadium assigned
    
    import('../api/apiService').then(({ event: eventApi, zones: zonesApi }) => {
      // Fetch analytics from real backend for this stadium only
      Promise.all([
        eventApi.analytics.revenue().catch(() => null),
        eventApi.analytics.crowdFlow().catch(() => null),
        eventApi.getState().catch(() => null),
        zonesApi.getAll().catch(() => [])
      ]).then(([revenue, flow, state, zns]) => {
        if (revenue) setRevenueData(revenue);
        if (flow)    setCrowdFlow(flow);
        if (state)   setEventState(state);
        if (zns)     setZones(zns);
      });
    });
  }, [stadiumId]);

  const totalRevenue = REVENUE_BREAKDOWN.reduce((s, v) => s + v.value, 0);
  const liveAttendees = eventState?.total_attendees || totalAttendees;


  return (
    <div>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: 'linear-gradient(135deg, rgba(124,77,255,0.12) 0%, rgba(0,212,255,0.08) 100%)',
          border: '1px solid rgba(124,77,255,0.25)', borderRadius: 16,
          padding: '20px 24px', marginBottom: 24,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <BarChart3 size={18} color="var(--color-purple)" />
            <span style={{ fontSize: '0.8rem', color: 'var(--color-purple)', fontWeight: 700, letterSpacing: '0.1em' }}>ORGANIZER ANALYTICS HUB</span>
          </div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: 2 }}>{eventState?.name || 'Champions League Final'}</h2>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Real-time event performance & revenue tracking</p>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center', padding: '10px 20px', background: 'rgba(255,255,255,0.05)', borderRadius: 12, border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 3 }}>TOTAL REVENUE</div>
            <div style={{ fontWeight: 800, color: 'var(--color-green)', fontSize: '1.1rem' }}>£{(totalRevenue / 1000).toFixed(0)}K</div>
          </div>
          <div style={{ textAlign: 'center', padding: '10px 20px', background: 'rgba(255,255,255,0.05)', borderRadius: 12, border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 3 }}>ATTENDANCE</div>
            <div style={{ fontWeight: 800, color: 'var(--color-electric-blue)', fontSize: '1.1rem' }}>{liveAttendees.toLocaleString()}</div>
          </div>
        </div>
      </motion.div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        <KPICard title="Total Revenue" value={`£${(totalRevenue / 1000).toFixed(0)}K`} subValue="Today's event" icon={DollarSign} color="var(--color-green)" trend={18} />
        <KPICard title="Avg. Wait Time" value={`${avgWaitTime}m`} subValue="Across all queues" icon={Activity} color="var(--color-electric-blue)" trend={-22} />
        <KPICard title="Attendee Satisfaction" value="76%" subValue="Based on live feedback" icon={Users} color="var(--color-purple)" trend={5} />
        <KPICard title="AI Accuracy" value="89%" subValue="Prediction confidence" icon={Zap} color="var(--color-orange)" trend={3} />
      </div>

      {/* Tabs */}
      <div style={{ marginBottom: 20 }}>
        <div className="tab-nav">
          {[
            ['analytics', '📈 Revenue & Flow'], 
            ['predictions', '🧠 AI Predictions'], 
            ['map', '🗺️ Venue Overview'], 
            ['approvals', '👥 Staff Approvals'],
            ['stadiums', '🏟️ Stadiums'],
            ['satisfaction', '⭐ Satisfaction']
          ].map(([k, l]) => (
            <button key={k} className={`tab-btn ${activeTab === k ? 'active' : ''}`} onClick={() => setActiveTab(k)}>{l}</button>
          ))}
        </div>
      </div>

      {activeTab === 'analytics' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Crowd Flow */}
          <div className="card">
            <h4 style={{ marginBottom: 4 }}>Crowd Flow Timeline</h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 16 }}>Attendees entering vs. exiting throughout the event</p>
            <div style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={crowdFlowHistory}>
                  <defs>
                    <linearGradient id="attendeeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00D4FF" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#00D4FF" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="exitGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF6B35" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#FF6B35" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="time" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                  <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                  <Tooltip {...TOOLTIP_STYLE} />
                  <Legend wrapperStyle={{ paddingTop: 12, fontSize: 12 }} />
                  <Area type="monotone" dataKey="attendees" name="Entering" stroke="#00D4FF" fill="url(#attendeeGrad)" strokeWidth={2} />
                  <Area type="monotone" dataKey="exiting" name="Exiting" stroke="#FF6B35" fill="url(#exitGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Revenue Charts */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
            <div className="card">
              <h4 style={{ marginBottom: 4 }}>Revenue Over Time</h4>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 16 }}>Cumulative revenue by category</p>
              <div style={{ height: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="time" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                    <YAxis tickFormatter={v => `£${(v/1000).toFixed(0)}K`} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                    <Tooltip {...TOOLTIP_STYLE} formatter={(v) => [`£${v.toLocaleString()}`, '']} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="concessions" name="Concessions" fill="#00D4FF" radius={[4,4,0,0]} />
                    <Bar dataKey="merchandise" name="Merchandise" fill="#FF6B35" radius={[4,4,0,0]} />
                    <Bar dataKey="tickets" name="Premium" fill="#7C4DFF" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="card">
              <h4 style={{ marginBottom: 4 }}>Revenue Split</h4>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 12 }}>By category</p>
              <div style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={REVENUE_BREAKDOWN} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                      {REVENUE_BREAKDOWN.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip {...TOOLTIP_STYLE} formatter={(v) => [`£${v.toLocaleString()}`, '']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {REVENUE_BREAKDOWN.map((item, i) => (
                  <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: PIE_COLORS[i] }} />
                      <span style={{ color: 'var(--text-secondary)' }}>{item.name}</span>
                    </div>
                    <span style={{ fontWeight: 600 }}>£{(item.value / 1000).toFixed(0)}K</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'predictions' && <CrowdPredictions />}

      {activeTab === 'map' && (
        <div>
          <div style={{ marginBottom: 14 }}>
            <h3>Venue Overview</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Live crowd density across all zones</p>
          </div>
          <VenueMap zones={zones} stadiumId={stadiumId} showHeatmap={true} showLabels={true} interactive={true} height={580} />
        </div>
      )}

      {activeTab === 'approvals' && <OrganizerApprovals />}
{activeTab === 'stadiums' && <StadiumFetcher />}

      {activeTab === 'satisfaction' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card">
            <h4 style={{ marginBottom: 4 }}>Attendee Satisfaction Scores</h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 16 }}>Real-time sentiment aggregated from app feedback</p>
            <div style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={SATISFACTION_DATA} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                  <YAxis dataKey="category" type="category" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} width={90} />
                  <Tooltip {...TOOLTIP_STYLE} />
                  <Bar dataKey="score" name="Score" fill="url(#blueGrad)" radius={[0,4,4,0]}>
                    {SATISFACTION_DATA.map((entry, i) => (
                      <Cell key={i} fill={entry.score >= 80 ? '#00E676' : entry.score >= 70 ? '#00D4FF' : '#FF6B35'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
            {[
              { label: '⭐ App Rating', value: '4.6/5', color: 'var(--color-yellow)', sub: 'From 2,841 reviews' },
              { label: '🔁 Return Intent', value: '84%', color: 'var(--color-green)', sub: 'Would attend again' },
              { label: '📢 Recommend', value: '79%', color: 'var(--color-electric-blue)', sub: 'NPS Score: +54' },
              { label: '📱 App Usage', value: '61%', color: 'var(--color-purple)', sub: 'Of all attendees' },
            ].map(({ label, value, color, sub }) => (
              <motion.div key={label} className="card" whileHover={{ y: -2 }}>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color, fontFamily: 'var(--font-display)', marginBottom: 6 }}>{value}</div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 3 }}>{label}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{sub}</div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-component for Organizers to approve staff
export function OrganizerApprovals() {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPending = () => {
    import('../api/apiService').then(({ auth }) => {
      auth.getPendingStaff().then(res => {
        setPending(res);
        setLoading(false);
      }).catch(() => setLoading(false));
    });
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const approveStaff = (id) => {
    import('../api/apiService').then(({ auth }) => {
      auth.approveStaff(id).then(() => {
        alert('Staff approved successfully.');
        fetchPending();
      });
    });
  };

  if (loading) return <div style={{ padding: 20 }}>Loading pending staff...</div>;

  return (
    <div className="card">
      <h3 style={{ marginBottom: 16 }}>Pending Staff Registrations</h3>
      {pending.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>No staff members waiting for approval.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              <th style={{ padding: '12px 0', color: 'var(--text-muted)', fontWeight: 600 }}>Name</th>
              <th style={{ padding: '12px 0', color: 'var(--text-muted)', fontWeight: 600 }}>Email</th>
              <th style={{ padding: '12px 0', color: 'var(--text-muted)', fontWeight: 600 }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {pending.map(p => (
              <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '12px 0' }}>{p.name}</td>
                <td style={{ padding: '12px 0', color: 'var(--text-secondary)' }}>{p.email}</td>
                <td style={{ padding: '12px 0' }}>
                  <button onClick={() => approveStaff(p.id)} style={{ padding: '6px 12px', background: 'rgba(0, 230, 118, 0.2)', border: '1px solid var(--color-green)', color: 'var(--color-green)', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
                    Approve Access
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

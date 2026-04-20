import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Clock, Users, Navigation, Bell, ChevronRight, Activity, Ticket, BookOpen, Calendar, ArrowRight, CreditCard, CheckCircle, QrCode, TrendingUp, AlertCircle } from 'lucide-react';
import VenueMap from '../components/VenueMap';
import QueueManager from '../components/QueueManager';
import useStore from '../store/useStore';
import { gates as gatesApi, crowdPredictions as predictionsApi } from '../api/apiService';

const DEFAULT_SCHEDULE = [
  { event_time: '19:00', label: 'Gates Open',           status: 'done',     icon: '🚪' },
  { event_time: '20:00', label: 'Pre-Match Show',        status: 'done',     icon: '🎤' },
  { event_time: '20:45', label: 'Kick Off',              status: 'active',   icon: '⚽' },
  { event_time: '21:30', label: 'Half Time',             status: 'upcoming', icon: '⏸️' },
  { event_time: '22:15', label: 'Full Time',             status: 'upcoming', icon: '🏆' },
  { event_time: '22:30', label: 'Post-Match Ceremony',   status: 'upcoming', icon: '🎊' },
  { event_time: '23:00', label: 'Staggered Exit Opens',  status: 'upcoming', icon: '🚪' },
];

// Real stadium data from Google Maps
const STADIUM_DATA = {
  s1: {
    name: 'M. Chinnaswamy Stadium',
    city: 'Bengaluru, India',
    capacity: 40000,
    gates: [
      { id: 's1-gate-0', name: 'Gate North', position: 'North Wing', entry_direction: 'entry' },
      { id: 's1-gate-1', name: 'Gate East', position: 'East Wing', entry_direction: 'entry' },
      { id: 's1-gate-2', name: 'Gate South', position: 'South Wing', entry_direction: 'entry' },
      { id: 's1-gate-3', name: 'Gate West', position: 'West Wing', entry_direction: 'entry' },
    ],
    foodCourts: [
      { id: 'fc1', name: 'Food Court Alpha', nearest_gate: 's1-gate-0', zone: 'North Food Court', items: ['Biryani', 'Pizza', 'Samosa'] },
      { id: 'fc2', name: 'Food Court Beta', nearest_gate: 's1-gate-1', zone: 'East Food Court', items: ['Noodles', 'Dosa', 'Juice'] },
      { id: 'fc3', name: 'Food Court Gamma', nearest_gate: 's1-gate-2', zone: 'South Food Court', items: ['Burger', 'Fries', 'Tandoor'] },
      { id: 'fc4', name: 'VIP Lounge', nearest_gate: 's1-gate-3', zone: 'West Premium', items: ['Steak', 'Wine', 'Desserts'] },
    ],
  },
  s3: {
    name: 'Wankhede Stadium',
    city: 'Mumbai, India',
    capacity: 33108,
    gates: [
      { id: 's3-gate-0', name: 'Gate A', position: 'Main Entry', entry_direction: 'entry' },
      { id: 's3-gate-1', name: 'Gate B', position: 'Side Entry', entry_direction: 'entry' },
      { id: 's3-gate-2', name: 'Gate C', position: 'VIP Entry', entry_direction: 'entry' },
    ],
    foodCourts: [
      { id: 'fc5', name: 'Mumbai Eats', nearest_gate: 's3-gate-0', zone: 'Main Food Zone', items: ['Vada Pav', 'Pav Bhaji', 'Cutting Chai'] },
      { id: 'fc6', name: 'Premium Dining', nearest_gate: 's3-gate-2', zone: 'VIP Zone', items: ['Multi-cuisine', 'Bar Service'] },
    ],
  },
};

function CrowdManagementPanel({ stadiumId, eventId }) {
  const [selectedGate, setSelectedGate] = useState(null);
  const [gateTraffic, setGateTraffic] = useState({});
  const [foodCourtCrowds, setFoodCourtCrowds] = useState({});
  const [predictions, setPredictions] = useState([]);
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const stadium = STADIUM_DATA[stadiumId] || STADIUM_DATA.s1;

  useEffect(() => {
    const fetchCrowdData = async () => {
      try {
        const trafficRes = await gatesApi.getTraffic({ stadium_id: stadiumId, event_id: eventId, minutes: 5 });
        if (trafficRes.gate_traffic) {
          const traffic = {};
          trafficRes.gate_traffic.forEach(g => {
            traffic[g.gate_id] = g.total_entries;
          });
          setGateTraffic(traffic);
        }

        const predRes = await predictionsApi.getLatest({ stadium_id: stadiumId, event_id: eventId });
        if (predRes.predicted_zones) {
          setPredictions(predRes.predicted_zones);
          const crowds = {};
          stadium.foodCourts.forEach(fc => {
            crowds[fc.id] = Math.floor(Math.random() * 100 + 30);
          });
          setFoodCourtCrowds(crowds);
        }
      } catch (err) {
        console.error('Error fetching crowd data:', err);
      }
    };

    fetchCrowdData();
    const interval = setInterval(fetchCrowdData, 10000);
    return () => clearInterval(interval);
  }, [stadiumId, eventId]);

  const handleQRScan = async () => {
    setLoading(true);
    try {
      const response = await gatesApi.scan({
        stadium_id: stadiumId,
        event_id: eventId,
        gate_id: selectedGate || stadium.gates[0].id,
        entry_count: 1,
        entry_direction: 'entry',
        device_type: 'mobile',
      });

      setScanResult({
        success: true,
        message: 'Entry logged! Welcome! ✓',
        predictions: response.predictions || [],
      });
      setTimeout(() => setScanResult(null), 3000);
    } catch (err) {
      setScanResult({
        success: false,
        message: err.message || 'Scan failed',
      });
    } finally {
      setLoading(false);
    }
  };

  const nearbyFoodCourts = selectedGate
    ? stadium.foodCourts.filter(fc => fc.nearest_gate === selectedGate)
    : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Gates Section */}
      <div className="card">
        <h3 style={{ marginBottom: 16 }}>🚪 Choose Your Entry Gate</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12, marginBottom: 16 }}>
          {stadium.gates.map(gate => (
            <button
              key={gate.id}
              onClick={() => setSelectedGate(selectedGate === gate.id ? null : gate.id)}
              style={{
                padding: '14px 12px',
                borderRadius: 10,
                background: selectedGate === gate.id ? 'rgba(0,212,255,0.12)' : 'rgba(255,255,255,0.03)',
                border: `2px solid ${selectedGate === gate.id ? '#00d4ff' : 'var(--border-subtle)'}`,
                color: 'var(--text-primary)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                textAlign: 'left',
              }}
            >
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{gate.name}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>{gate.position}</div>
              {gateTraffic[gate.id] !== undefined && (
                <div style={{ fontSize: '0.75rem', color: 'var(--color-electric-blue)', marginTop: 6, fontWeight: 600 }}>
                  {gateTraffic[gate.id]} entries today
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Food Courts for Selected Gate */}
      {selectedGate && nearbyFoodCourts.length > 0 && (
        <div className="card" style={{ background: 'rgba(255,107,53,0.08)', border: '1px solid rgba(255,107,53,0.2)' }}>
          <h3 style={{ marginBottom: 12, color: '#ff6b35' }}>🍽️ Nearby Food Courts</h3>
          <div style={{ display: 'grid', gap: 12 }}>
            {nearbyFoodCourts.map(fc => (
              <div key={fc.id} style={{ padding: 12, background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 6 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{fc.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{fc.zone}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <Users size={14} />
                    <strong>{foodCourtCrowds[fc.id] || 0}</strong>
                  </div>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>📍 {fc.items.join(' • ')}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* QR Scanner */}
      <div className="card" style={{ background: 'rgba(124,77,255,0.08)', border: '1px solid rgba(124,77,255,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <QrCode size={20} style={{ color: '#7c4dff' }} />
          <h3 style={{ color: '#7c4dff' }}>Entry QR Scan</h3>
        </div>
        {selectedGate && (
          <div style={{ padding: 10, marginBottom: 12, background: 'rgba(0,212,255,0.1)', borderRadius: 6, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            ✓ Gate selected: <strong>{stadium.gates.find(g => g.id === selectedGate)?.name}</strong>
          </div>
        )}
        <button
          onClick={handleQRScan}
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px 16px',
            background: 'linear-gradient(135deg, #7c4dff, #667eea)',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? 'Scanning...' : 'Simulate Entry Scan'}
        </button>
        {scanResult && (
          <div style={{ marginTop: 12, padding: 12, background: scanResult.success ? 'rgba(0,212,118,0.1)' : 'rgba(255,107,53,0.1)', border: `1px solid ${scanResult.success ? 'rgba(0,212,118,0.3)' : 'rgba(255,107,53,0.3)'}`, borderRadius: 6, color: scanResult.success ? '#00d47f' : '#ff6b35', fontSize: '0.85rem' }}>
            {scanResult.message}
            {scanResult.predictions?.length > 0 && (
              <div style={{ marginTop: 8, fontSize: '0.75rem', opacity: 0.8 }}>
                ⚠️ Note: {scanResult.predictions[0]?.recommended_action}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Zone Predictions */}
      {predictions.length > 0 && (
        <div className="card">
          <h3 style={{ marginBottom: 12 }}>📊 Zone Status</h3>
          <div style={{ display: 'grid', gap: 10 }}>
            {predictions.slice(0, 2).map((pred, idx) => (
              <div key={idx} style={{ padding: 12, background: `rgba(${pred.alert_level === 'critical' ? '255,107,53' : '0,212,118'}, 0.1)`, borderRadius: 8, border: `1px solid rgba(${pred.alert_level === 'critical' ? '255,107,53' : '0,212,118'}, 0.3)` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ fontWeight: 600 }}>{pred.zone_name}</div>
                  <div style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: 4, background: pred.alert_level === 'critical' ? 'rgba(255,107,53,0.2)' : 'rgba(0,212,118,0.2)', color: pred.alert_level === 'critical' ? '#ff6b35' : '#00d47f' }}>
                    {pred.alert_level.toUpperCase()}
                  </div>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  ~{pred.predicted_crowd_influx} people • {pred.predicted_arrival_time_minutes} min
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function LiveStatsBar({ stadiumId, eventId }) {
  const [stats, setStats] = useState({
    liveAttendees: 0,
    avgWaitTime: 0,
    activeAlerts: 0,
    openGates: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const trafficRes = await gatesApi.getTraffic({ stadium_id: stadiumId, event_id: eventId, minutes: 5 });
        const predRes = await predictionsApi.getLatest({ stadium_id: stadiumId, event_id: eventId });

        let totalEntries = 0;
        let openGateCount = 0;

        if (trafficRes.gate_traffic) {
          trafficRes.gate_traffic.forEach(g => {
            totalEntries += g.total_entries;
          });
          openGateCount = trafficRes.gate_traffic.length;
        }

        const alerts = predRes.predicted_zones ? predRes.predicted_zones.filter(z => z.alert_level === 'critical').length : 0;

        setStats({
          liveAttendees: totalEntries,
          avgWaitTime: Math.floor(Math.random() * 15) + 5,
          activeAlerts: alerts,
          openGates: openGateCount,
        });
      } catch (err) {
        console.error('Error fetching stats:', err);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, [stadiumId, eventId]);

  const statCards = [
    { label: 'Live Attendees', value: stats.liveAttendees.toLocaleString(), icon: Users, color: '#00d4ff' },
    { label: 'Avg Wait Time', value: `${stats.avgWaitTime} min`, icon: Clock, color: '#ff6b35' },
    { label: 'Crowd Alerts', value: stats.activeAlerts, icon: AlertCircle, color: stats.activeAlerts > 0 ? '#e74c3c' : '#00d47f' },
    { label: 'Open Gates', value: stats.openGates, icon: MapPin, color: '#00d47f' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14, marginBottom: 24 }}>
      {statCards.map(({ label, value, icon: Icon, color }) => (
        <motion.div key={label} className="stat-card" whileHover={{ y: -2 }} style={{ cursor: 'pointer' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon size={17} color={color} />
            </div>
            {stats.openGates > 0 && label === 'Live Attendees' && <div className="live-dot" />}
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, fontFamily: 'var(--font-display)', color, marginBottom: 4 }}>{value}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{label}</div>
        </motion.div>
      ))}
    </div>
  );
}

export default function AttendeeDashboard() {
  const { eventPhase, setStatsFromServer, activeStadiumId, activeBooking, currentPage, setCurrentPage } = useStore();
  const [schedule, setSchedule] = useState(DEFAULT_SCHEDULE);
  const [zones, setZones] = useState([]);

  // Right sidebar event navigation should only be shown if there's an active booking.
  const hasBooking = !!activeStadiumId && !!activeBooking;
  const EVENT_TABS = ['my_event_experience', 'map', 'queues', 'schedule']; // Match Navbar IDs
  const isViewingEvent = EVENT_TABS.includes(currentPage);

  // Default to my_event_experience if no page is selected
  const displayPage = !currentPage || currentPage === 'experience' ? 'my_event_experience' : currentPage;

  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  useEffect(() => {
    if (activeStadiumId) {
      import('../api/apiService').then(({ event: eventApi, zones: zonesApi }) => {
        Promise.all([
          eventApi.getSchedule().catch(() => null),
          eventApi.getState().catch(() => null),
          zonesApi.getAll().catch(() => []),
          // NEW: Fetch accurate booking-based fill rate
          fetch(`http://localhost:4000/api/stats/fill-rate/${activeStadiumId}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('venueiq_token')}` }
          }).then(r => r.ok ? r.json() : null).catch(() => null)
        ]).then(([sched, state, zns, fillStats]) => {
          if (sched) setSchedule(sched);
          if (zns) setZones(zns);
          if (state && setStatsFromServer) {
            setStatsFromServer({
              totalAttendees: fillStats ? fillStats.total_booked : state.total_attendees,
              avgWaitTime: 14,
              activeIncidents: state.active_incidents,
              openGates: state.open_gates,
              phase: state.current_phase,
              fillRate: fillStats ? fillStats.fill_rate : 0
            });
          }
        });
      });
    }
  }, [activeStadiumId]);

  return (
    <div style={{ paddingBottom: 60 }}>
      {/* Welcome Banner - Only show when interacting with right sidebar features */}
      <AnimatePresence mode="wait">
        {isViewingEvent && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              background: 'linear-gradient(135deg, rgba(0,212,255,0.12) 0%, rgba(124,77,255,0.08) 100%)',
              border: '1px solid rgba(0,212,255,0.2)',
              borderRadius: 16, padding: '20px 24px', marginBottom: 24,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, overflow: 'hidden'
            }}
          >
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-electric-blue)', fontWeight: 600, letterSpacing: '0.08em', marginBottom: 4 }}>
                🏆 {schedule[0]?.name || activeBooking?.event?.name || 'EVENT ACTIVE'}
              </div>
              <h2 style={{ fontSize: '1.5rem', marginBottom: 4 }}>
                Welcome to {activeBooking?.stadium?.name || (zones.length > 0 ? zones[0].stadium_id === 's1' ? 'M. Chinnaswamy Stadium' : zones[0].stadium_id === 's2' ? 'Sree Kanteerava Stadium' : 'the Stadium' : 'the Venue')}
              </h2>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Your personalized event experience is live and updating in real-time.</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <div style={{ textAlign: 'center', padding: '10px 20px', background: 'rgba(255,255,255,0.05)', borderRadius: 12, border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 4 }}>EVENT PHASE</div>
                <div style={{ fontWeight: 700, color: 'var(--color-electric-blue)', fontSize: '0.95rem' }}>{eventPhase || 'LIVE'}</div>
              </div>
              <div style={{ padding: '10px 16px', background: 'rgba(255,107,53,0.1)', borderRadius: 12, border: '1px solid rgba(255,107,53,0.3)', width: 180 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>SEAT</div>
                  <div style={{ fontWeight: 700, color: 'var(--color-orange)', fontSize: '0.9rem' }}>{activeBooking?.section || 'M-Upper'}</div>
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.3 }}>
                  📍 <strong>Direction:</strong> {activeBooking?.section === 'M-Upper' ? 'Enter through North Gate, proceed to Level 2 via escalator.' : 'Refer to smart navigation.'}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: 'flex', gap: 24, marginTop: isViewingEvent ? 0 : 24 }}>
        
        {/* === MAIN CONTENT AREA (Center) === */}
        <div style={{ flex: 1, minWidth: 0, paddingRight: 4 }}>
          <AnimatePresence mode="wait">
            {currentPage === 'book_tickets' && (
              <motion.div key="book" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <BookTickets onGoToBookings={() => setCurrentPage('my_bookings')} />
              </motion.div>
            )}
            
            {currentPage === 'my_bookings' && (
              <motion.div key="mybook" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <MyBookings onAccessDashboard={() => setCurrentPage('my_event_experience')} />
              </motion.div>
            )}

            {(displayPage === 'my_event_experience') && (
              <motion.div key="exp" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <div>
                    <h3>My Event Experience</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Real-time crowd updates and smart navigation.</p>
                  </div>
                </div>
                <LiveStatsBar stadiumId={activeStadiumId || 's1'} eventId={activeBooking?.event_id || 'e-s1-0'} />
                <CrowdManagementPanel stadiumId={activeStadiumId || 's1'} eventId={activeBooking?.event_id || 'e-s1-0'} />
              </motion.div>
            )}

            {currentPage === 'map' && (
              <motion.div key="map" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <div>
                    <h3>Venue Map</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Stadium overview and live heatmap</p>
                  </div>
                </div>
                <VenueMap zones={zones} stadiumId={activeStadiumId} />
              </motion.div>
            )}

            {currentPage === 'queues' && (
              <motion.div key="queue" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                 <QueueManager />
              </motion.div>
            )}

            {currentPage === 'schedule' && (
              <motion.div key="sched" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <div className="card">
                  <h3 style={{ marginBottom: 20 }}>Event Schedule</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                     {schedule.map((ev, i) => (
                        <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'center', padding: 12, background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px solid var(--border-subtle)' }}>
                          <span style={{ fontSize: '1.5rem' }}>{ev.icon}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, color: ev.status === 'active' ? 'var(--color-electric-blue)' : 'inherit' }}>{ev.label || ev.event_time}</div>
                            {ev.status && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: 4 }}>{ev.status.toUpperCase()}</div>}
                          </div>
                          <div style={{ fontWeight: 700, color: 'var(--color-electric-blue)', background: 'rgba(0,212,255,0.1)', padding: '4px 8px', borderRadius: 6 }}>{ev.event_time || new Date(ev.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                        </div>
                     ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* === RIGHT SIDEBAR MENU (Other Side - Only visible if booked) === */}
        <AnimatePresence>
          {hasBooking && (
            <motion.div 
              initial={{ opacity: 0, x: 20, width: 0 }} 
              animate={{ opacity: 1, x: 0, width: 220 }} 
              exit={{ opacity: 0, x: 20, width: 0 }}
              style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8, overflow: 'hidden' }}
            >
              <div style={{ width: 220 }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4, paddingLeft: 4 }}>
                  Live Event Nav
                </div>
                {[
                  { id: 'my_event_experience', label: 'My Experience', icon: Activity },
                  { id: 'map', label: 'Venue Map', icon: MapPin },
                  { id: 'queues', label: 'Queue Manager', icon: Users },
                  { id: 'schedule', label: 'Event Schedule', icon: Clock },
                ].map(item => (
                  <button
                     key={item.id}
                     onClick={() => setCurrentPage(item.id)}
                     style={{
                       display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 12, marginBottom: 8,
                       background: currentPage === item.id ? 'rgba(124, 77, 255, 0.1)' : 'rgba(255,255,255,0.03)',
                       border: `1px solid ${currentPage === item.id ? 'rgba(124, 77, 255, 0.3)' : 'var(--border-subtle)'}`,
                       color: currentPage === item.id ? '#c4b5fd' : 'var(--text-secondary)',
                       fontWeight: currentPage === item.id ? 700 : 500,
                       textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s', width: '100%'
                     }}
                  >
                     <item.icon size={18} />
                     {item.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* FEEDBACK MODAL */}
      <AnimatePresence>
        {showFeedbackModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowFeedbackModal(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }} />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} 
              style={{ position: 'relative', width: '100%', maxWidth: 400, background: 'var(--color-bg-primary)', border: '1px solid var(--border-subtle)', borderRadius: 20, padding: 30, boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
              <h3 style={{ marginBottom: 10 }}>Calibrate Sensors</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 24 }}>How long did you actually wait in the current queue?</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
                {[5, 10, 15, 20, 30, 45].map(mins => (
                  <button key={mins} onClick={async () => {
                    await fetch('http://localhost:4000/api/feedback/wait-time', {
                      method: 'POST',
                      headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('venueiq_token')}`
                      },
                      body: JSON.stringify({
                        stadium_id: activeStadiumId,
                        zone_id: zones[0]?.id || 'z1',
                        reported_wait_time: mins,
                        actual_wait_time_estimate: 14,
                        event_phase: eventPhase
                      })
                    });
                    setShowFeedbackModal(false);
                    alert("Thank you! Model calibrated successfully.");
                  }} style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', borderRadius: 12, color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 600 }}>
                    {mins}m
                  </button>
                ))}
              </div>
              <button onClick={() => setShowFeedbackModal(false)} style={{ width: '100%', padding: '12px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 12, color: 'var(--text-muted)' }}>Cancel</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Sub-components
function BookTickets({ onGoToBookings }) {
  const [stadiums, setStadiums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStadium, setSelectedStadium] = useState(null);
  const [checkoutStep, setCheckoutStep] = useState(0); 
  
  const { setActiveStadiumId, setActiveBooking } = useStore();

  useEffect(() => {
    import('../api/apiService').then(({ stadiums: stadiumsApi }) => {
      stadiumsApi.getAll()
        .then(data => { setStadiums(data); setLoading(false); })
        .catch((e) => { console.error(e); setLoading(false); });
    });
  }, []);

  const handleSelect = (stadium) => {
    setSelectedStadium(stadium);
    setCheckoutStep(1);
  };

  const handleBook = () => setCheckoutStep(2);

  const handlePayment = async () => {
    try {
      const { auth, bookings: bookingsApi } = await import('../api/apiService');
      const user = await auth.me(); // Retrieve the actual logged in user
      const eventDetails = selectedStadium.next_event;
      
      const res = await bookingsApi.create({
        stadium_id: selectedStadium.id,
        event_id: eventDetails?.id || 'ev_123',
        section: 'M-Upper',
        tickets: 1,
        email: user.email,
        name: user.name || 'Fan'
      });

      setActiveStadiumId(selectedStadium.id);
      setActiveBooking(res.booking);
      setCheckoutStep(3);
    } catch (e) {
      alert("Booking failed: " + e.message);
      setCheckoutStep(1);
    }
  };

  if (loading) {
    return <div style={{ display: 'flex', height: '300px', justifyContent: 'center', alignItems: 'center' }}><div className="spinner" /></div>;
  }

  return (
    <div>
      {checkoutStep === 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h3 style={{ fontSize: '1.8rem', marginBottom: 6 }}>Stadiums & Events</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: '0.95rem' }}>Select a venue to book tickets.</p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
            {stadiums.map(st => (
              <div key={st.id} className="card" onClick={() => handleSelect(st)} style={{ cursor: 'pointer', transition: 'all 0.2s', border: '1px solid var(--border-subtle)' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-electric-blue)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
              >
                <div style={{ fontSize: '3rem', marginBottom: 16 }}>{st.image}</div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: 6 }}>{st.name}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 16 }}>
                  <MapPin size={14} /> {st.city} • {st.capacity.toLocaleString()} seats
                </div>
                {st.next_event ? (
                  <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: 10 }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-electric-blue)', fontWeight: 700, marginBottom: 4 }}>UPCOMING EVENT</div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', lineHeight: 1.3, marginBottom: 6 }}>{st.next_event.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      <Calendar size={12} /> {new Date(st.next_event.date).toLocaleDateString()}
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, color: 'var(--text-muted)' }}>No upcoming events</div>
                )}
                <div style={{ marginTop: 20, color: 'var(--color-electric-blue)', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.9rem', fontWeight: 600 }}>
                  Book Tickets <ArrowRight size={14} />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {checkoutStep > 0 && selectedStadium && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <button onClick={() => setCheckoutStep(0)} style={{ marginBottom: 20, background: 'transparent', color: 'var(--text-muted)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}>
             ← Back to Stadiums
          </button>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            
            {/* Event Summary */}
            <div style={{ flex: '1 1 250px' }}>
              <div className="card" style={{ background: 'var(--color-bg-secondary)', border: 'none' }}>
                <div style={{ fontSize: '3rem', marginBottom: 10 }}>{selectedStadium.image}</div>
                <h3 style={{ marginBottom: 10 }}>{selectedStadium.name}</h3>
                <div style={{ display: 'flex', gap: 8, color: 'var(--text-muted)', marginBottom: 20, fontSize: '0.85rem' }}><MapPin size={14} /> {selectedStadium.city}</div>
                <div className="divider" />
                <h4 style={{ color: 'var(--color-electric-blue)', marginBottom: 8, fontSize: '0.85rem' }}>Match Details</h4>
                <div style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 10, lineHeight: 1.3 }}>{selectedStadium.next_event?.name || 'Open Day'}</div>
                <div style={{ display: 'flex', gap: 10, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                   <Clock size={14}/> {new Date(selectedStadium.next_event?.date || Date.now()).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Checkout Area */}
            <div style={{ flex: '2 1 350px' }}>
              {checkoutStep === 1 && (
                <div className="card">
                  <h3 style={{ marginBottom: 20 }}>Select Seating</h3>
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: 30, borderRadius: 12, textAlign: 'center', border: '1px dashed var(--border-subtle)', marginBottom: 20 }}>
                     <div style={{ fontSize: '2rem', marginBottom: 10 }}>🏟️</div>
                     <div style={{ color: 'var(--text-secondary)' }}>Interactive Seat Map</div>
                     <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>(Standard Admission - Section M Upper)</div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)', marginBottom: 20 }}>
                    <span style={{ fontSize: '1.1rem' }}>Total</span>
                    <span style={{ fontSize: '1.4rem', fontWeight: 700 }}>₹1,200</span>
                  </div>
                  <button className="btn-danger" style={{ width: '100%', padding: '14px', borderRadius: '10px', fontSize: '1.05rem', fontWeight: 700 }} onClick={handleBook}>Proceed to Payment</button>
                </div>
              )}

              {checkoutStep === 2 && (
                <div className="card">
                  <h3 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}><CreditCard size={18} /> Payment Gateway</h3>
                  <img src="https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo-vector.svg" alt="UPI" style={{ height: 24, marginBottom: 20, opacity: 0.8 }} />
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 6 }}>UPI ID</label>
                    <input className="input" placeholder="username@bank" defaultValue="demo@okicici" style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', color: 'white' }} />
                  </div>
                  <button className="btn-danger" style={{ width: '100%', padding: '14px', borderRadius: '10px', fontSize: '1.05rem', fontWeight: 700 }} onClick={handlePayment}>Pay ₹1,200 securely</button>
                </div>
              )}

              {checkoutStep === 3 && (
                <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <CheckCircle size={60} color="var(--color-green)" style={{ margin: '0 auto 20px' }} />
                  <h3 style={{ marginBottom: 10, fontSize: '1.6rem' }}>Booking Confirmed!</h3>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: 30, fontSize: '0.95rem' }}>Your digital ticket is ready.</p>
                  <button className="btn-primary" style={{ padding: '12px 24px', borderRadius: '8px', fontWeight: 700 }} onClick={onGoToBookings}>
                    View My Bookings
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function MyBookings({ onAccessDashboard }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const { setActiveStadiumId, setActiveBooking } = useStore();

  useEffect(() => {
    import('../api/apiService').then(({ auth, bookings: myBookingsApi }) => {
      auth.me().then(user => {
        myBookingsApi.getMyBookings(user.email).then(res => {
          setBookings(res);
          setLoading(false);
        }).catch(() => setLoading(false));
      }).catch(() => setLoading(false));
    });
  }, []);

  if (loading) return <div style={{ padding: 40, display: 'flex', justifyContent: 'center' }}><div className="spinner" /></div>;

  return (
    <div>
      <h3 style={{ marginBottom: 16 }}>My Tickets</h3>
      {bookings.length === 0 ? (
        <div className="card"><p style={{ color: 'var(--text-muted)' }}>You have no active bookings for upcoming matches.</p></div>
      ) : (
        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr' }}>
          {bookings.map(b => {
             const eventDateStr = new Date(b.event?.date || b.booking_date).toDateString();
             const todayStr = new Date().toDateString();
             const isEventDay = eventDateStr === todayStr;
             const canAccess = isEventDay || isNaN(new Date(b.event?.date).getTime()); 

             return (
               <div key={b.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                 <div>
                   <div style={{ fontSize: '0.8rem', color: 'var(--color-electric-blue)', fontWeight: 600, marginBottom: 4 }}>{b.stadium?.name || `Stadium ID: ${b.stadium_id}`}</div>
                   <div style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 4, lineHeight: 1.3 }}>{b.event?.name || b.event?.event || 'Unknown Match'}</div>
                   <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Date: {new Date(b.event?.date || b.booking_date).toLocaleDateString()}</div>
                 </div>
                 <div style={{ textAlign: 'right' }}>
                   <div style={{ display: 'flex', gap: 16, alignItems: 'center', justifyContent: 'flex-end' }}>
                     <div style={{ textAlign: 'right' }}>
                       <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Tickets</div>
                       <div style={{ fontSize: '1.6rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--color-green)' }}>{b.num_tickets}</div>
                       <div style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: 4, marginTop: 4 }}>Block: {b.section}</div>
                     </div>
                   </div>
                   
                   <div style={{ marginTop: 12 }}>
                     {canAccess ? (
                       <button className="btn-primary" 
                         onClick={() => {
                           setActiveStadiumId(b.stadium_id);
                           setActiveBooking(b);
                           onAccessDashboard();
                         }}
                         style={{ padding: '10px 16px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}
                       >
                         Open Event Tools <ArrowRight size={14} />
                       </button>
                     ) : (
                       <button disabled style={{ padding: '10px 16px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600, background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)', cursor: 'not-allowed' }}>
                         Dashboard Secured (Opens on Event Day)
                       </button>
                     )}
                   </div>
                 </div>
               </div>
             )
          })}
        </div>
      )}
    </div>
  );
}

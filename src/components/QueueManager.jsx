import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Users, Check, Calendar, Zap, RefreshCw, X } from 'lucide-react';
import useStore from '../store/useStore';
import { queues as queuesApi } from '../api/apiService';
import { predictWaitTime } from '../ai/crowdPredictor';

function getWaitColor(wait) {
  if (wait < 8)  return 'var(--color-green)';
  if (wait < 18) return 'var(--color-yellow)';
  if (wait < 30) return 'var(--color-orange)';
  return 'var(--color-red)';
}

function WaitBadge({ wait }) {
  const color = getWaitColor(wait);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, background: `${color}18`, border: `1px solid ${color}40` }}>
      <Clock size={12} color={color} />
      <span style={{ fontSize: '0.8rem', fontWeight: 700, color }}>{wait} min</span>
    </div>
  );
}

function QueueCard({ queue, eventPhase, reservedIds, onReserve, onCancel }) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const isReserved = reservedIds.includes(queue.id);
  const fill = Math.round((queue.reserved / queue.total_slots) * 100);
  const waitTime = queue.wait_time ?? 10;
  const predicted30 = predictWaitTime(waitTime, queue.id, eventPhase);
  const aiSurge = predicted30 > waitTime * 1.4;

  const handleReserve = async () => {
    setLoading(true); setError('');
    try {
      const res = await queuesApi.reserve(queue.id);
      onReserve(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="card"
      style={{ borderColor: isReserved ? 'rgba(0,230,118,0.3)' : 'var(--border-subtle)', position: 'relative', overflow: 'hidden' }}
    >
      {aiSurge && (
        <div style={{ position: 'absolute', top: 0, right: 0, background: 'var(--color-orange)', padding: '3px 10px 3px 16px', fontSize: '0.7rem', fontWeight: 700, borderBottomLeftRadius: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
          <Zap size={11} /> AI: Surge in 30min
        </div>
      )}
      {isReserved && (
        <div style={{ position: 'absolute', top: 0, left: 0, background: 'var(--color-green)', padding: '3px 10px', fontSize: '0.7rem', fontWeight: 700, borderBottomRightRadius: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
          <Check size={11} /> Reserved
        </div>
      )}

      <div style={{ marginTop: isReserved || aiSurge ? 18 : 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div style={{ flex: 1, paddingRight: 12 }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 3 }}>{queue.name}</h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              <Users size={12} />
              <span>{queue.reserved}/{queue.total_slots} slots taken</span>
            </div>
          </div>
          <WaitBadge wait={waitTime} />
        </div>

        {/* Fill bar */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <span>Slot availability</span>
            <span style={{ color: fill > 75 ? 'var(--color-orange)' : 'var(--text-secondary)' }}>{100 - fill}% free</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill"
              style={{ width: `${fill}%`, background: fill > 75 ? 'var(--gradient-danger)' : fill > 50 ? 'var(--gradient-warning)' : 'var(--gradient-success)' }}
            />
          </div>
        </div>

        {/* AI Prediction */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Zap size={13} color="var(--color-electric-blue)" />
            <div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>AI Forecast (30min)</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: getWaitColor(predicted30) }}>{predicted30} min</div>
            </div>
          </div>
          <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '8px 10px' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Best time to go</div>
            <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{aiSurge ? '⚠️ Go now' : '✅ Anytime'}</div>
          </div>
        </div>

        {/* Error */}
        {error && <div style={{ fontSize: '0.78rem', color: 'var(--color-red)', marginBottom: 10, padding: '6px 10px', background: 'rgba(255,23,68,0.1)', borderRadius: 8 }}>⚠️ {error}</div>}

        {/* Action */}
        {!isReserved ? (
          <motion.button onClick={handleReserve} disabled={loading || fill >= 95}
            whileHover={{ scale: fill < 95 ? 1.02 : 1 }} whileTap={{ scale: 0.97 }}
            style={{
              width: '100%', padding: '10px', borderRadius: 10,
              background: fill >= 95 ? 'rgba(255,255,255,0.06)' : 'var(--gradient-blue)',
              color: fill >= 95 ? 'var(--text-muted)' : '#000',
              border: 'none', cursor: fill >= 95 ? 'not-allowed' : 'pointer',
              fontWeight: 700, fontSize: '0.9rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.2s',
            }}
          >
            {loading ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />Reserving...</>
              : fill >= 95 ? 'Queue Full'
              : <><Calendar size={15} />Reserve Time Slot</>}
          </motion.button>
        ) : (
          <div style={{
            display: 'flex', flexDirection: 'column', gap: 6,
          }}>
            <div style={{ width: '100%', padding: '10px', borderRadius: 10, background: 'rgba(0,230,118,0.12)', border: '1px solid rgba(0,230,118,0.3)', color: 'var(--color-green)', fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Check size={15} /> Slot Reserved — Ready to go!
            </div>
            <button onClick={() => onCancel(queue.id)}
              style={{ width: '100%', padding: '7px', borderRadius: 10, background: 'rgba(255,23,68,0.08)', border: '1px solid rgba(255,23,68,0.25)', color: 'var(--color-red)', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
              <X size={12} /> Cancel Reservation
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function QueueManager() {
  const { eventPhase } = useStore();
  const [queues, setQueues]         = useState([]);
  const [myReservations, setMyRes]  = useState([]);   // [{id, queue_id, slot_time}]
  const [filter, setFilter]         = useState('all');
  const [sortBy, setSortBy]         = useState('wait');
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');

  const reservedQueueIds = myReservations.map(r => r.queue_id);

  // Fetch queues + my reservations from backend
  const fetchData = useCallback(async () => {
    try {
      const [q, r] = await Promise.all([
        queuesApi.getAll(),
        queuesApi.getMyReservations().catch(() => []),
      ]);
      setQueues(q);
      setMyRes(r);
      setError('');
    } catch (err) {
      setError('Could not load queues. Using cached data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Re-fetch every 10s (queue wait times update frequently)
  useEffect(() => {
    const timer = setInterval(fetchData, 10000);
    return () => clearInterval(timer);
  }, [fetchData]);

  const handleReserve = (reservation) => {
    setMyRes(prev => [...prev, reservation]);
    setQueues(prev => prev.map(q => q.id === reservation.queue_id ? { ...q, reserved: q.reserved + 1 } : q));
  };

  const handleCancel = async (queueId) => {
    const res = myReservations.find(r => r.queue_id === queueId);
    if (!res) return;
    try {
      await queuesApi.cancelReservation(res.id);
      setMyRes(prev => prev.filter(r => r.id !== res.id));
      setQueues(prev => prev.map(q => q.id === queueId ? { ...q, reserved: Math.max(0, q.reserved - 1) } : q));
    } catch (err) {
      alert('Could not cancel: ' + err.message);
    }
  };

  const filtered = queues
    .filter(q => {
      if (filter === 'available') return (q.reserved / q.total_slots) < 0.95;
      if (filter === 'reserved')  return reservedQueueIds.includes(q.id);
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'wait') return (a.wait_time ?? 99) - (b.wait_time ?? 99);
      if (sortBy === 'fill') return (a.reserved / a.total_slots) - (b.reserved / b.total_slots);
      return 0;
    });

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h2 style={{ fontSize: '1.4rem' }}>Virtual Queue Manager</h2>
          <span className="badge badge-info">AI-Powered</span>
        </div>
        <button onClick={fetchData} style={{ background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '5px 10px', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.8rem' }}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 20 }}>Skip the physical line. Reserve your spot and arrive right on time.</p>

      {error && <div style={{ padding: '10px 14px', background: 'rgba(255,107,53,0.1)', border: '1px solid rgba(255,107,53,0.3)', borderRadius: 10, fontSize: '0.82rem', color: 'var(--color-orange)', marginBottom: 16 }}>⚠️ {error}</div>}

      {/* Active Reservations Banner */}
      {myReservations.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ background: 'rgba(0,230,118,0.06)', border: '1px solid rgba(0,230,118,0.2)', borderRadius: 14, padding: '14px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(0,230,118,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Check size={18} color="var(--color-green)" />
          </div>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--color-green)', fontSize: '0.95rem' }}>
              {myReservations.length} Active Reservation{myReservations.length > 1 ? 's' : ''}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {myReservations.map(r => `${r.queue_name || 'Queue'} @ ${r.slot_time}`).join('  •  ')}
            </div>
          </div>
        </motion.div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="tab-nav" style={{ flex: 'none' }}>
          {[['all', 'All Queues'], ['available', 'Available'], ['reserved', 'My Reservations']].map(([k, l]) => (
            <button key={k} className={`tab-btn ${filter === k ? 'active' : ''}`} onClick={() => setFilter(k)}>{l}</button>
          ))}
        </div>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)}
          style={{ marginLeft: 'auto', background: 'var(--color-bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '5px 10px', color: 'var(--text-primary)', fontSize: '0.82rem', cursor: 'pointer' }}>
          <option value="wait">Wait Time</option>
          <option value="fill">Availability</option>
        </select>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0', color: 'var(--text-muted)', gap: 10 }}>
          <div className="spinner" /> Loading queues from backend...
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {filtered.map(queue => (
              <QueueCard key={queue.id} queue={queue} eventPhase={eventPhase}
                reservedIds={reservedQueueIds}
                onReserve={handleReserve} onCancel={handleCancel}
              />
            ))}
          </div>
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🎫</div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>No queues found</div>
              <div style={{ fontSize: '0.85rem' }}>Try changing your filter</div>
            </div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}

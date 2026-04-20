import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, TrendingUp, Users, MapPin, Clock, Zap, BarChart3 } from 'lucide-react';
import axios from 'axios';
import useStore from '../store/useStore';
import { useSocket } from '../hooks/useSocket';

/**
 * Real-Time Crowd Dashboard - Live monitoring for staff/organizers
 * 
 * Features:
 * - Live gate traffic monitoring
 * - Crowd flow predictions to zones
 * - Critical alerts for high-density areas
 * - Real-time Socket.io updates
 */
export default function RealTimeCrowdDashboard() {
  const { currentUser, userRole } = useStore();
  const socket = useSocket();
  
  // Use 's1' as default, override with user's stadium
  let stadiumId = 's1';
  if (currentUser?.stadium_id) {
    stadiumId = currentUser.stadium_id;
  }
  
  const isAttendee = userRole === 'attendee';
  const [selectedStadium, setSelectedStadium] = React.useState(stadiumId);
  const [eventId] = React.useState('e-s1-0');
  const [gateTraffic, setGateTraffic] = React.useState([]);
  const [predictions, setPredictions] = React.useState([]);
  const [criticalAlerts, setCriticalAlerts] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  const STADIUM_NAMES = {
    s1: 'M. Chinnaswamy Stadium',
    s2: 'Sree Kanteerava Stadium',
    s3: 'Wankhede Stadium',
    s4: 'Eden Gardens',
    s5: 'Arun Jaitley Stadium',
    s6: 'Rajiv Gandhi Khel Mandira',
    s7: 'JSCA International Cricket Stadium',
    s8: 'Maharashtra Cricket Association Stadium',
    s9: 'Jawaharlal Nehru Stadium',
    s10: 'Narendra Modi Stadium',
  };

  // Fetch data
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('venueiq_token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        // Fetch gate traffic
        const trafficRes = await axios.get('http://localhost:4000/api/gates/traffic', {
          params: { stadium_id: selectedStadium, minutes: 5 },
          headers
        });
        setGateTraffic(trafficRes.data?.gate_traffic || []);

        // Fetch predictions
        const predRes = await axios.get('http://localhost:4000/api/crowd-predictions/latest', {
          params: { stadium_id: selectedStadium },
          headers
        });
        const preds = predRes.data?.predictions || [];
        setPredictions(preds);
        setCriticalAlerts(preds.filter(p => p.alert_level === 'critical'));
        
        setError(null);
      } catch (err) {
        console.error('Fetch error:', err);
        setError('Could not load crowd data');
        setGateTraffic([]);
        setPredictions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedStadium]);

  return (
    <div style={{ 
      padding: '20px', 
      minHeight: 'calc(100vh - 80px)', 
      background: 'var(--color-bg-default)',
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(0,212,255,0.12) 0%, rgba(124,77,255,0.08) 100%)',
        border: '1px solid rgba(0,212,255,0.25)',
        borderRadius: 16,
        padding: '20px 24px',
        marginBottom: 24,
      }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <TrendingUp size={18} color="var(--color-electric-blue)" />
            <span style={{ fontSize: '0.8rem', color: 'var(--color-electric-blue)', fontWeight: 700 }}>
              REAL-TIME MONITORING
            </span>
          </div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: 4, color: 'var(--text-primary)', margin: 0 }}>
            Crowd Flow Insights
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>
            Live gate traffic & zone predictions for {STADIUM_NAMES[selectedStadium] || 'Stadium'}
          </p>
        </div>

        {/* Stadium selector for attendees */}
        {isAttendee && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {Object.entries(STADIUM_NAMES).slice(0, 5).map(([id, name]) => (
              <button
                key={id}
                onClick={() => setSelectedStadium(id)}
                style={{
                  padding: '6px 12px',
                  background: selectedStadium === id ? 'var(--color-electric-blue)' : 'transparent',
                  color: selectedStadium === id ? 'white' : 'var(--text-secondary)',
                  border: `1px solid ${selectedStadium === id ? 'var(--color-electric-blue)' : 'var(--border-card)'}`,
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: 500,
                }}
              >
                {name.split(' ')[0]}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div style={{
          background: 'rgba(255, 23, 68, 0.1)',
          border: '1px solid var(--color-red)',
          color: 'var(--color-red)',
          padding: '12px 16px',
          borderRadius: 8,
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {/* Loading state */}
      {loading && gateTraffic.length === 0 && predictions.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '40px 20px',
          color: 'var(--text-muted)',
        }}>
          <div style={{ fontSize: '2rem', marginBottom: 12 }}>⏳</div>
          <div style={{ fontSize: '1rem', fontWeight: 600 }}>Loading Crowd Data...</div>
        </div>
      ) : null}

      {/* Critical Alerts */}
      {criticalAlerts.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Zap size={20} color="var(--color-red)" />
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-red)', margin: 0 }}>
              Critical Alerts ({criticalAlerts.length})
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 12 }}>
            {criticalAlerts.map((alert) => (
              <div
                key={alert._id}
                style={{
                  background: 'rgba(255, 23, 68, 0.1)',
                  border: '2px solid var(--color-red)',
                  borderRadius: 12,
                  padding: 16,
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 8, color: 'var(--color-red)' }}>
                  {alert.zone_name}
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: 12 }}>
                  {alert.predicted_crowd_influx} people expected • ~{alert.predicted_arrival_time_minutes} min
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Confidence: {Math.round(alert.confidence_score * 100)}%</span>
                  <span style={{ color: 'var(--color-red)', fontWeight: 600 }}>CRITICAL</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Gate Traffic */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <MapPin size={20} color="var(--color-electric-blue)" />
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Live Gate Traffic (Last 5 min)</h2>
        </div>
        
        {gateTraffic.length === 0 ? (
          <div style={{
            background: 'var(--color-bg-card)',
            border: '1px dashed var(--border-card)',
            borderRadius: 12,
            padding: 24,
            textAlign: 'center',
            color: 'var(--text-muted)',
          }}>
            📊 No recent gate activity
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            {gateTraffic.map((gate) => (
              <div
                key={gate._id}
                style={{
                  background: 'var(--color-bg-card)',
                  border: '1px solid var(--border-card)',
                  borderRadius: 12,
                  padding: 14,
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                  Gate {gate._id?.split('-')[2] || 'N/A'}
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-electric-blue)', marginBottom: 8 }}>
                  {gate.total_entries}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {gate.scan_count} scans • avg {(gate.total_entries / gate.scan_count).toFixed(1)}/scan
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Predictions */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <BarChart3 size={20} color="var(--color-purple)" />
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Predicted Crowd Flow by Zone</h2>
        </div>

        {predictions.length === 0 ? (
          <div style={{
            background: 'var(--color-bg-card)',
            border: '1px dashed var(--border-card)',
            borderRadius: 12,
            padding: 24,
            textAlign: 'center',
            color: 'var(--text-muted)',
          }}>
            🤖 No predictions available yet
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
            {predictions.map((pred) => {
              const getAlertColor = (level) => {
                switch (level) {
                  case 'critical': return 'var(--color-red)';
                  case 'warning': return 'var(--color-orange)';
                  case 'normal': return 'var(--color-green)';
                  default: return 'var(--text-muted)';
                }
              };
              const color = getAlertColor(pred.alert_level);
              
              return (
                <div
                  key={pred._id}
                  style={{
                    background: 'var(--color-bg-card)',
                    border: `1px solid ${color}40`,
                    borderRadius: 12,
                    padding: 14,
                    borderLeft: `4px solid ${color}`,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{pred.zone_name}</div>
                    <div style={{
                      padding: '3px 8px',
                      background: `${color}20`,
                      color,
                      borderRadius: 4,
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                    }}>
                      {pred.alert_level}
                    </div>
                  </div>

                  <div style={{
                    height: 6,
                    background: 'var(--border-subtle)',
                    borderRadius: 3,
                    overflow: 'hidden',
                    marginBottom: 12,
                  }}>
                    <div style={{
                      height: '100%',
                      background: color,
                      width: `${Math.min((pred.predicted_crowd_influx / 300) * 100, 100)}%`,
                    }} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: '0.8rem' }}>
                    <div>
                      <div style={{ color: 'var(--text-muted)', marginBottom: 2 }}>Expected</div>
                      <div style={{ fontWeight: 700, color }}>{pred.predicted_crowd_influx} people</div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-muted)', marginBottom: 2 }}>ETA</div>
                      <div style={{ fontWeight: 700 }}>~{pred.predicted_arrival_time_minutes} min</div>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border-subtle)' }}>
                    Confidence: <strong>{Math.round(pred.confidence_score * 100)}%</strong>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

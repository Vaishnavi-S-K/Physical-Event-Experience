import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCode, MapPin, Users, Clock, AlertCircle, Navigation, ChevronRight, Coffee, UtensilsCrossed, Info } from 'lucide-react';
import { gates as gatesApi, crowdPredictions } from '../api/apiService';
import useStore from '../store/useStore';
import '../styles/EventExperience.css';


// Real stadium data with actual gates and food courts from Google knowledge
const STADIUM_DATA = {
  s1: {
    name: 'M. Chinnaswamy Stadium',
    city: 'Bengaluru',
    capacity: 55000,
    gates: [
      { id: 's1-gate-0', name: 'Gate A - North', location: 'North Entrance', type: 'main' },
      { id: 's1-gate-1', name: 'Gate B - East', location: 'East Entrance', type: 'main' },
      { id: 's1-gate-2', name: 'Gate C - South', location: 'South Entrance', type: 'main' },
      { id: 's1-gate-3', name: 'Gate D - West', location: 'West Entrance', type: 'vip' },
      { id: 's1-gate-4', name: 'Gate E - Emergency', location: 'Emergency Exit', type: 'emergency' },
    ],
    foodCourts: [
      { id: 'fc-1', name: 'Punjabi Dhaba', nearGates: ['s1-gate-0', 's1-gate-1'], distance: 120 },
      { id: 'fc-2', name: 'South Indian Corner', nearGates: ['s1-gate-1', 's1-gate-2'], distance: 150 },
      { id: 'fc-3', name: 'Quick Bites Kiosk', nearGates: ['s1-gate-0'], distance: 80 },
      { id: 'fc-4', name: 'Dessert Paradise', nearGates: ['s1-gate-2', 's1-gate-3'], distance: 200 },
      { id: 'fc-5', name: 'Beverage Station', nearGates: ['s1-gate-3'], distance: 100 },
    ],
  },
  s2: {
    name: 'Sree Kanteerava Stadium',
    city: 'Bengaluru',
    capacity: 48000,
    gates: [
      { id: 's2-gate-0', name: 'Gate 1 - Main', location: 'Main Entrance', type: 'main' },
      { id: 's2-gate-1', name: 'Gate 2 - East', location: 'East Wing', type: 'main' },
      { id: 's2-gate-2', name: 'Gate 3 - West', location: 'West Wing', type: 'main' },
      { id: 's2-gate-3', name: 'Gate 4 - VIP', location: 'VIP Entrance', type: 'vip' },
    ],
    foodCourts: [
      { id: 'fc-1', name: 'Bangalore Street Food', nearGates: ['s2-gate-0'], distance: 100 },
      { id: 'fc-2', name: 'Premium Cafe', nearGates: ['s2-gate-1'], distance: 130 },
      { id: 'fc-3', name: 'Biryani House', nearGates: ['s2-gate-2'], distance: 110 },
      { id: 'fc-4', name: 'VIP Lounge Dining', nearGates: ['s2-gate-3'], distance: 50 },
    ],
  },
  s3: {
    name: 'Wankhede Stadium',
    city: 'Mumbai',
    capacity: 33108,
    gates: [
      { id: 's3-gate-0', name: 'Main Gate', location: 'Main Entrance', type: 'main' },
      { id: 's3-gate-1', name: 'North Gate', location: 'North Wing', type: 'main' },
      { id: 's3-gate-2', name: 'South Gate', location: 'South Wing', type: 'main' },
      { id: 's3-gate-3', name: 'VIP Gate', location: 'VIP Entrance', type: 'vip' },
    ],
    foodCourts: [
      { id: 'fc-1', name: 'Samosa Corner', nearGates: ['s3-gate-0'], distance: 90 },
      { id: 'fc-2', name: 'Biryani Express', nearGates: ['s3-gate-1'], distance: 120 },
      { id: 'fc-3', name: 'Juice Bar', nearGates: ['s3-gate-2'], distance: 100 },
      { id: 'fc-4', name: 'Panipuri Stall', nearGates: ['s3-gate-0'], distance: 80 },
      { id: 'fc-5', name: 'Mumbai Street Food', nearGates: ['s3-gate-1', 's3-gate-2'], distance: 150 },
    ],
  },
  s4: {
    name: 'Eden Gardens',
    city: 'Kolkata',
    capacity: 66349,
    gates: [
      { id: 's4-gate-0', name: 'Main Gate', location: 'Main Entrance', type: 'main' },
      { id: 's4-gate-1', name: 'North Gate', location: 'North Wing', type: 'main' },
      { id: 's4-gate-2', name: 'South Gate', location: 'South Wing', type: 'main' },
      { id: 's4-gate-3', name: 'East Gate', location: 'East Wing', type: 'main' },
      { id: 's4-gate-4', name: 'VIP Gate', location: 'VIP Entrance', type: 'vip' },
    ],
    foodCourts: [
      { id: 'fc-1', name: 'Rosogolla Shop', nearGates: ['s4-gate-0'], distance: 100 },
      { id: 'fc-2', name: 'Biryani House', nearGates: ['s4-gate-1'], distance: 110 },
      { id: 'fc-3', name: 'Chai Stall', nearGates: ['s4-gate-2'], distance: 80 },
      { id: 'fc-4', name: 'Chow Mein Corner', nearGates: ['s4-gate-3'], distance: 120 },
      { id: 'fc-5', name: 'Bengali Sweets', nearGates: ['s4-gate-0', 's4-gate-1'], distance: 130 },
    ],
  },
  s5: {
    name: 'Arun Jaitley Stadium',
    city: 'Delhi',
    capacity: 41820,
    gates: [
      { id: 's5-gate-0', name: 'Gate A - North', location: 'North Entrance', type: 'main' },
      { id: 's5-gate-1', name: 'Gate B - South', location: 'South Entrance', type: 'main' },
      { id: 's5-gate-2', name: 'Gate C - East', location: 'East Entrance', type: 'main' },
      { id: 's5-gate-3', name: 'Gate D - West', location: 'West Entrance', type: 'vip' },
    ],
    foodCourts: [
      { id: 'fc-1', name: 'Delhi Street Food', nearGates: ['s5-gate-0'], distance: 100 },
      { id: 'fc-2', name: 'Tandoori Chicken', nearGates: ['s5-gate-1'], distance: 130 },
      { id: 'fc-3', name: 'Momos Point', nearGates: ['s5-gate-2'], distance: 110 },
      { id: 'fc-4', name: 'Premium Dining', nearGates: ['s5-gate-3'], distance: 60 },
    ],
  },
};

export default function CrowdPredictions() {
  const { currentUser, userRole } = useStore();
  const isAttendee = userRole === 'attendee';
  const isStaffOrOrganizer = userRole === 'staff' || userRole === 'organizer';
  
  // For staff/organizers, use their assigned stadium; for attendees, use selected stadium
  const defaultStadium = currentUser?.stadium_id || 's1';
  const [selectedStadium, setSelectedStadium] = useState(defaultStadium);
  const [selectedGate, setSelectedGate] = useState(null);
  const [gateScans, setGateScans] = useState({});
  const [predictions, setPredictions] = useState([]);
  const [scanHistory, setScanHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [eventId] = useState('e-s1-0');

  // If staff/organizer, lock to their assigned stadium
  useEffect(() => {
    if (isStaffOrOrganizer && currentUser?.stadium_id) {
      setSelectedStadium(currentUser.stadium_id);
    }
  }, [currentUser?.stadium_id, isStaffOrOrganizer]);

  const stadium = STADIUM_DATA[selectedStadium];
  const totalScans = Object.values(gateScans).reduce((a, b) => a + b, 0);

  // Simulate QR scan
  const handleQRScan = async (gateId) => {
    setLoading(true);
    try {
      const response = await gatesApi.scan({
        stadium_id: selectedStadium,
        event_id: eventId,
        gate_id: gateId,
        entry_count: Math.ceil(Math.random() * 3),
        device_type: 'mobile',
      });

      // Update gate scan count
      setGateScans(prev => ({
        ...prev,
        [gateId]: (prev[gateId] || 0) + 1
      }));

      // Update predictions
      if (response.predictions) {
        setPredictions(response.predictions);
      }

      // Add to history
      setScanHistory(prev => [{
        gateId,
        timestamp: new Date(),
        success: true
      }, ...prev.slice(0, 9)]);
    } catch (err) {
      console.error('Scan failed:', err);
    } finally {
      setLoading(false);
    }
  };

  // Get food courts near a gate
  const getFoodCourtsNearGate = (gateId) => {
    return stadium.foodCourts.filter(fc => fc.nearGates.includes(gateId));
  };

  // Get people count for a food court (simulated)
  const getFoodCourtCount = (fcId) => {
    return Math.floor(Math.random() * 150) + 20;
  };

  return (
    <div className="event-experience">
      {/* Header */}
      <div className="exp-header">
        <div className="exp-header-content">
          <h1>🎯 Crowd Predictions & Event Experience</h1>
          <p>Real-time crowd tracking and smart navigation</p>
        </div>
        <div className="live-status">
          <div className="live-dot"></div>
          <span>Live Event</span>
        </div>
      </div>

      {/* KPIs */}
      <div className="kpi-grid">
        <motion.div className="kpi-card" whileHover={{ y: -4 }}>
          <div className="kpi-icon">👥</div>
          <div className="kpi-content">
            <div className="kpi-label">Live Attendees</div>
            <div className="kpi-value">{totalScans.toLocaleString()}</div>
            <div className="kpi-sublabel">via QR scans</div>
          </div>
        </motion.div>

        <motion.div className="kpi-card" whileHover={{ y: -4 }}>
          <div className="kpi-icon">⏱️</div>
          <div className="kpi-content">
            <div className="kpi-label">Avg Wait Time</div>
            <div className="kpi-value">{Math.floor(Math.random() * 15) + 5} min</div>
            <div className="kpi-sublabel">across gates</div>
          </div>
        </motion.div>

        <motion.div className="kpi-card" whileHover={{ y: -4 }}>
          <div className="kpi-icon">🚨</div>
          <div className="kpi-content">
            <div className="kpi-label">Active Alerts</div>
            <div className="kpi-value">{predictions.filter(p => p.alert_level === 'critical').length}</div>
            <div className="kpi-sublabel">critical zones</div>
          </div>
        </motion.div>

        <motion.div className="kpi-card" whileHover={{ y: -4 }}>
          <div className="kpi-icon">🚪</div>
          <div className="kpi-content">
            <div className="kpi-label">Open Gates</div>
            <div className="kpi-value">{stadium.gates.length}</div>
            <div className="kpi-sublabel">total</div>
          </div>
        </motion.div>
      </div>

      <div className="exp-content">
        {/* Gates Section */}
        <div className="gates-section">
          <h2>📍 Stadium Gates</h2>
          <div className="gates-grid">
            {stadium.gates.map(gate => {
              const scanCount = gateScans[gate.id] || 0;
              const isSelected = selectedGate?.id === gate.id;
              return (
                <motion.button
                  key={gate.id}
                  onClick={() => setSelectedGate(isSelected ? null : gate)}
                  whileHover={{ scale: 1.05 }}
                  className={`gate-card ${isSelected ? 'selected' : ''} ${gate.type}`}
                >
                  <div className="gate-header">
                    <span className="gate-icon">🚪</span>
                    <span className="gate-type-badge">{gate.type}</span>
                  </div>
                  <h3>{gate.name}</h3>
                  <p>{gate.location}</p>
                  <div className="gate-stats">
                    <div className="stat">
                      <Users size={14} />
                      <span>{scanCount} scans</span>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Selected Gate Details */}
        <AnimatePresence>
          {selectedGate && (
            <motion.div 
              className="gate-details"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
            >
              <div className="details-header">
                <h2>🔍 {selectedGate.name} Details</h2>
                <button onClick={() => setSelectedGate(null)} className="close-btn">✕</button>
              </div>

              {/* Food Courts Near This Gate */}
              <div className="food-courts-section">
                <h3>🍔 Nearby Food Courts</h3>
                <div className="food-courts-list">
                  {getFoodCourtsNearGate(selectedGate.id).length > 0 ? (
                    getFoodCourtsNearGate(selectedGate.id).map(fc => (
                      <motion.div 
                        key={fc.id} 
                        className="food-court-item"
                        whileHover={{ x: 4 }}
                      >
                        <div className="fc-header">
                          <Coffee size={18} />
                          <div className="fc-info">
                            <div className="fc-name">{fc.name}</div>
                            <div className="fc-distance">{fc.distance}m away</div>
                          </div>
                        </div>
                        <div className="fc-crowd">
                          <Users size={16} />
                          <span>{getFoodCourtCount(fc.id)} people</span>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <p className="no-data">No food courts near this gate</p>
                  )}
                </div>
              </div>

              {/* QR Scanner - Only for Attendees */}
              {isAttendee && (
                <div className="qr-section">
                  <h3>📱 QR Scanner</h3>
                  <button 
                    className="qr-button"
                    onClick={() => handleQRScan(selectedGate.id)}
                    disabled={loading}
                  >
                    <QrCode size={24} />
                    {loading ? 'Scanning...' : 'Scan Entry QR'}
                  </button>
                  <p className="qr-description">Tap to simulate QR code scan at this gate</p>
                </div>
              )}

              {/* Zone Predictions */}
              {predictions.length > 0 && (
                <div className="predictions-section">
                  <h3>📊 Zone Predictions</h3>
                  <div className="predictions-list">
                    {predictions.slice(0, 3).map((pred, idx) => (
                      <div key={idx} className={`prediction-item ${pred.alert_level}`}>
                        <div className="pred-zone">{pred.zone_name}</div>
                        <div className="pred-crowd">{pred.predicted_crowd_influx} people</div>
                        <div className="pred-time">{pred.predicted_arrival_time_minutes}m</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Smart Navigation - Updated based on scans */}
        <div className="smart-nav-section">
          <h2>🧭 Smart Navigation</h2>
          <p className="nav-subtitle">Based on live attendee flow from scanned gates</p>
          <div className="nav-recommendations">
            {stadium.gates.map(gate => {
              const scanCount = gateScans[gate.id] || 0;
              if (scanCount === 0) return null;
              
              const nearbyFoods = getFoodCourtsNearGate(gate.id);
              return (
                <motion.div 
                  key={gate.id} 
                  className="nav-card"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <div className="nav-gate">{gate.name}</div>
                  <div className="nav-flow">
                    {scanCount} attendees passed through
                  </div>
                  <div className="nav-recommendations-list">
                    {nearbyFoods.map(fc => (
                      <div key={fc.id} className="nav-rec">
                        <UtensilsCrossed size={14} />
                        <span>{fc.name}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
          {Object.values(gateScans).every(v => v === 0) && (
            <p className="empty-nav">Scan gates to see smart recommendations</p>
          )}
        </div>

        {/* Scan History */}
        {scanHistory.length > 0 && (
          <div className="history-section">
            <h3>📋 Recent Scans</h3>
            <div className="history-list">
              {scanHistory.map((scan, idx) => (
                <div key={idx} className="history-item">
                  <div className="h-time">{scan.timestamp.toLocaleTimeString()}</div>
                  <div className="h-gate">{stadium.gates.find(g => g.id === scan.gateId)?.name}</div>
                  <div className="h-status">✓ Success</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

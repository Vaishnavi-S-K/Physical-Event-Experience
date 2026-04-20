import React, { useState, useEffect } from 'react';
import { QrCode, CheckCircle, AlertCircle, Users, Clock, MapPin, Send } from 'lucide-react';
import { gates as gatesApi } from '../api/apiService';
import '../styles/GateScanner.css';

export default function GateScanner() {
  const [stadiumId, setStadiumId] = useState('s1');
  const [eventId, setEventId] = useState('e-s1-0');
  const [gateId, setGateId] = useState('s1-gate-0');
  const [entryCount, setEntryCount] = useState(1);
  const [deviceType, setDeviceType] = useState('mobile');
  const [loading, setLoading] = useState(false);
  const [lastScan, setLastScan] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [error, setError] = useState('');
  const [scanHistory, setScanHistory] = useState([]);

  // Simulate QR code scanning
  const handleScan = async () => {
    if (!stadiumId || !eventId || !gateId) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await gatesApi.scan({
        stadium_id: stadiumId,
        event_id: eventId,
        gate_id: gateId,
        entry_count: entryCount,
        entry_direction: 'entry',
        device_type: deviceType,
        scanner_id: `scanner-${gateId}`,
      });

      const scanResult = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date(),
        gate: gateId,
        count: entryCount,
        success: true,
      };

      setLastScan(scanResult);
      setPredictions(response.predictions || []);
      setScanHistory([scanResult, ...scanHistory.slice(0, 9)]);

      // Show success message
      setTimeout(() => setLastScan(null), 3000);
    } catch (err) {
      setError(err.message || 'Failed to process scan');
      setLastScan({
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date(),
        gate: gateId,
        count: entryCount,
        success: false,
        error: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="gate-scanner-container">
      <div className="scanner-header">
        <div className="scanner-title">
          <QrCode size={32} />
          <div>
            <h1>Gate QR Scanner</h1>
            <p>Real-time entry tracking & crowd prediction</p>
          </div>
        </div>
        <div className="live-indicator">
          <div className="live-dot"></div>
          <span>Live</span>
        </div>
      </div>

      <div className="scanner-content">
        {/* Scanner Input Panel */}
        <div className="scanner-panel">
          <h2>📱 Scanner Configuration</h2>
          
          <div className="form-group">
            <label>Stadium *</label>
            <select value={stadiumId} onChange={(e) => setStadiumId(e.target.value)}>
              <option value="s1">M. Chinnaswamy (s1)</option>
              <option value="s2">Sree Kanteerava (s2)</option>
              <option value="s3">Wankhede (s3)</option>
              <option value="s4">Eden Gardens (s4)</option>
              <option value="s5">Arun Jaitley (s5)</option>
            </select>
          </div>

          <div className="form-group">
            <label>Event *</label>
            <select value={eventId} onChange={(e) => setEventId(e.target.value)}>
              <option value="e-s1-0">Champions League Final</option>
              <option value="e-s1-1">Premier League Matchday</option>
              <option value="e-s1-2">Special Tournament</option>
            </select>
          </div>

          <div className="form-group">
            <label>Gate ID *</label>
            <select value={gateId} onChange={(e) => setGateId(e.target.value)}>
              <option value="s1-gate-0">Gate 1 (North)</option>
              <option value="s1-gate-1">Gate 2 (East)</option>
              <option value="s1-gate-2">Gate 3 (South)</option>
              <option value="s1-gate-3">Gate 4 (West)</option>
              <option value="s1-gate-4">Gate 5 (VIP)</option>
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Entry Count</label>
              <input 
                type="number" 
                min="1" 
                max="5" 
                value={entryCount} 
                onChange={(e) => setEntryCount(Math.max(1, parseInt(e.target.value) || 1))}
              />
            </div>
            <div className="form-group">
              <label>Device Type</label>
              <select value={deviceType} onChange={(e) => setDeviceType(e.target.value)}>
                <option value="mobile">Mobile</option>
                <option value="kiosk">Kiosk</option>
                <option value="handheld">Handheld</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="error-message">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <button 
            className="scan-button" 
            onClick={handleScan} 
            disabled={loading}
          >
            <Send size={20} />
            {loading ? 'Scanning...' : 'Simulate QR Scan'}
          </button>
        </div>

        {/* Right Panel: Results */}
        <div className="scanner-results">
          {/* Last Scan Result */}
          {lastScan && (
            <div className={`scan-result ${lastScan.success ? 'success' : 'error'}`}>
              <div className="result-header">
                {lastScan.success ? (
                  <>
                    <CheckCircle size={24} color="#00d47f" />
                    <span>Scan Successful</span>
                  </>
                ) : (
                  <>
                    <AlertCircle size={24} color="#ff6b35" />
                    <span>Scan Failed</span>
                  </>
                )}
              </div>
              <div className="result-details">
                <div className="detail">
                  <MapPin size={16} />
                  <span>{lastScan.gate}</span>
                </div>
                <div className="detail">
                  <Users size={16} />
                  <span>{lastScan.count} person(s)</span>
                </div>
                <div className="detail">
                  <Clock size={16} />
                  <span>{lastScan.timestamp.toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          )}

          {/* Critical Predictions */}
          {predictions.length > 0 && (
            <div className="predictions-box">
              <h3>🚨 Critical Alerts from Prediction</h3>
              <div className="predictions-list">
                {predictions.map((pred, idx) => (
                  <div key={idx} className="prediction-item critical">
                    <div className="pred-header">
                      <span className="zone-name">{pred.zone_name}</span>
                      <span className="alert-badge critical">CRITICAL</span>
                    </div>
                    <div className="pred-details">
                      <div><strong>{pred.predicted_crowd_influx}</strong> people expected</div>
                      <div>Arrival in <strong>{pred.predicted_arrival_time_minutes}</strong> min</div>
                      <div>Confidence: <strong>{(pred.confidence_score * 100).toFixed(0)}%</strong></div>
                    </div>
                    <div className="pred-action">{pred.recommended_action}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Scans History */}
          {scanHistory.length > 0 && (
            <div className="history-box">
              <h3>📋 Recent Scans</h3>
              <div className="history-list">
                {scanHistory.map((scan) => (
                  <div key={scan.id} className={`history-item ${scan.success ? 'success' : 'error'}`}>
                    <div className="h-time">{scan.timestamp.toLocaleTimeString()}</div>
                    <div className="h-gate">{scan.gate}</div>
                    <div className="h-count">+{scan.count}</div>
                    <div className="h-status">
                      {scan.success ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!lastScan && predictions.length === 0 && scanHistory.length === 0 && (
            <div className="empty-state">
              <QrCode size={48} />
              <h3>No scans yet</h3>
              <p>Configure a gate and tap "Simulate QR Scan" to begin</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

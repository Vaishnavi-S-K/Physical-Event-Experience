const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const GateReading = require('../models/GateReading');
const BeaconReading = require('../models/BeaconReading');
const { auth, requireRole } = require('../middleware/auth');

// GET /api/audit/real-metrics/:stadiumId
// Compares simulation results vs raw sensor data for auditing
router.get('/real-metrics/:stadiumId', auth, requireRole('organizer'), async (req, res) => {
  try {
    const { stadiumId } = req.params;
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    // 1. Booking summary
    const bookings = await Booking.find({ stadium_id: stadiumId }).lean();
    
    // 2. Recent gate readings
    const gateReadings = await GateReading.find({ 
      stadium_id: stadiumId, 
      recorded_at: { $gte: oneHourAgo } 
    }).sort({ recorded_at: -1 }).limit(50).lean();
    
    // 3. Recent beacon readings
    const beaconReadings = await BeaconReading.find({ 
      stadium_id: stadiumId, 
      recorded_at: { $gte: oneHourAgo } 
    }).sort({ recorded_at: -1 }).limit(50).lean();
    
    res.json({
      stadiumId,
      timestamp: now,
      summary: {
        total_bookings: bookings.length,
        recent_gate_count: gateReadings.reduce((s, r) => s + (r.in_count || 0), 0),
        avg_beacon_occupancy: beaconReadings.length > 0 
          ? beaconReadings.reduce((s, r) => s + (r.occupancy_estimate || 0), 0) / beaconReadings.length 
          : 0
      },
      raw_samples: {
        gate: gateReadings.slice(0, 5),
        beacon: beaconReadings.slice(0, 5)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

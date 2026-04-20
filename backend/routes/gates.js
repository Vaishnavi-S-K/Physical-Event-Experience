const express = require('express');
const GateScan = require('../models/GateScan');
const {
  predictCrowdFlow,
  getRecentPredictions,
  getCriticalAlerts,
  getGateTraffic
} = require('../services/crowdFlowPrediction');
const { auth, getFilterQuery } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/gates/scan
 * Log a gate scan (QR code entry)
 * Used by gate kiosks/mobile apps when attendee enters
 */
router.post('/scan', async (req, res) => {
  try {
    const {
      stadium_id,
      event_id,
      gate_id,
      user_id,
      ticket_id,
      entry_count = 1,
      entry_direction = 'entry',
      device_type = 'mobile',
      scanner_id,
      qr_code_data
    } = req.body;

    // Validate required fields
    if (!stadium_id || !gate_id) {
      return res.status(400).json({
        error: 'Missing required fields: stadium_id, gate_id'
      });
    }

    // Create gate scan entry
    const scan = new GateScan({
      stadium_id,
      event_id,
      gate_id,
      user_id,
      ticket_id,
      entry_count,
      entry_direction,
      metadata: {
        device_type,
        scanner_id,
        qr_code_data
      }
    });

    await scan.save();

    // Trigger crowd flow prediction
    if (event_id) {
      try {
        const predictions = await predictCrowdFlow(stadium_id, event_id);

        // Broadcast predictions to connected clients via Socket.io
        // (This will be done in server.js)
        res.status(200).json({
          message: 'Gate scan recorded',
          scan_id: scan.id,
          predictions: predictions.filter((p) => p.alert_level !== 'normal')
        });
      } catch (predError) {
        console.error('Error generating predictions:', predError);
        res.status(200).json({
          message: 'Gate scan recorded',
          scan_id: scan.id,
          predictions: []
        });
      }
    } else {
      res.status(200).json({
        message: 'Gate scan recorded',
        scan_id: scan.id,
        predictions: []
      });
    }
  } catch (error) {
    console.error('Error recording gate scan:', error);
    res.status(500).json({ error: 'Failed to record gate scan' });
  }
});

/**
 * GET /api/gates/traffic
 * Get recent gate traffic (for dashboard)
 * Staff/Organizers can only view their assigned stadium
 */
router.get('/traffic', auth, async (req, res) => {
  try {
    let { stadium_id, event_id, minutes = 5 } = req.query;

    // For staff/organizers, enforce their assigned stadium
    const stadiumFilter = getFilterQuery(req.user);
    if (Object.keys(stadiumFilter).length > 0) {
      stadium_id = stadiumFilter.stadium_id;
    }

    if (!stadium_id) {
      return res.status(400).json({ error: 'stadium_id is required' });
    }

    const traffic = await getGateTraffic(stadium_id, event_id, parseInt(minutes));

    res.status(200).json({
      stadium_id,
      event_id,
      time_window_minutes: minutes,
      gate_traffic: traffic
    });
  } catch (error) {
    console.error('Error fetching gate traffic:', error);
    res.status(500).json({ error: 'Failed to fetch gate traffic' });
  }
});

/**
 * GET /api/gates/scans
 * Get all gate scans (filtered by stadium/event)
 * Staff/Organizers can only view their assigned stadium
 */
router.get('/scans', auth, async (req, res) => {
  try {
    let { stadium_id, event_id, gate_id, limit = 50 } = req.query;

    const query = {};
    
    // For staff/organizers, enforce their assigned stadium
    const stadiumFilter = getFilterQuery(req.user);
    if (Object.keys(stadiumFilter).length > 0) {
      query.stadium_id = stadiumFilter.stadium_id;
    } else if (stadium_id) {
      query.stadium_id = stadium_id;
    }

    if (event_id) query.event_id = event_id;
    if (gate_id) query.gate_id = gate_id;

    const scans = await GateScan.find(query)
      .sort({ entry_timestamp: -1 })
      .limit(parseInt(limit))
      .exec();

    res.status(200).json({
      count: scans.length,
      scans
    });
  } catch (error) {
    console.error('Error fetching gate scans:', error);
    res.status(500).json({ error: 'Failed to fetch gate scans' });
  }
});

/**
 * GET /api/gates/stats
 * Get aggregated gate statistics
 * Staff/Organizers can only view their assigned stadium
 */
router.get('/stats', auth, async (req, res) => {
  try {
    let { stadium_id, event_id } = req.query;

    // For staff/organizers, enforce their assigned stadium
    const stadiumFilter = getFilterQuery(req.user);
    if (Object.keys(stadiumFilter).length > 0) {
      stadium_id = stadiumFilter.stadium_id;
    }

    if (!stadium_id) {
      return res.status(400).json({ error: 'stadium_id is required' });
    }

    const query = { stadium_id };
    if (event_id) query.event_id = event_id;

    // Total entries
    const totalEntries = await GateScan.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          total: { $sum: '$entry_count' },
          scan_count: { $sum: 1 }
        }
      }
    ]);

    // Entries by direction
    const byDirection = await GateScan.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$entry_direction',
          count: { $sum: '$entry_count' }
        }
      }
    ]);

    // Top gates
    const topGates = await GateScan.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$gate_id',
          entries: { $sum: '$entry_count' },
          scans: { $sum: 1 }
        }
      },
      { $sort: { entries: -1 } },
      { $limit: 5 }
    ]);

    // Traffic over time (last hour, 10-min buckets)
    const trafficTimeSeries = await GateScan.aggregate([
      {
        $match: {
          ...query,
          entry_timestamp: { $gte: new Date(Date.now() - 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d %H:%M',
              date: '$entry_timestamp'
            }
          },
          entries: { $sum: '$entry_count' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json({
      stadium_id,
      event_id,
      total_entries: totalEntries[0]?.total || 0,
      total_scans: totalEntries[0]?.scan_count || 0,
      by_direction: byDirection,
      top_gates: topGates,
      traffic_time_series: trafficTimeSeries
    });
  } catch (error) {
    console.error('Error fetching gate stats:', error);
    res.status(500).json({ error: 'Failed to fetch gate statistics' });
  }
});

module.exports = router;

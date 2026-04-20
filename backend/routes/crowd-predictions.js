const express = require('express');
const {
  predictCrowdFlow,
  getRecentPredictions,
  getCriticalAlerts
} = require('../services/crowdFlowPrediction');
const CrowdFlowPrediction = require('../models/CrowdFlowPrediction');
const { auth, requireRole, getFilterQuery } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/crowd-predictions/generate
 * Generate crowd flow predictions for a stadium/event
 * Staff/Organizers can only generate predictions for their assigned stadium
 */
router.post('/generate', auth, requireRole('staff', 'organizer'), async (req, res) => {
  try {
    let { stadium_id, event_id } = req.body;

    // For staff/organizers, enforce their assigned stadium
    const stadiumFilter = getFilterQuery(req.user);
    if (Object.keys(stadiumFilter).length > 0) {
      stadium_id = stadiumFilter.stadium_id;
    }

    if (!stadium_id || !event_id) {
      return res
        .status(400)
        .json({ error: 'Missing required fields: stadium_id, event_id' });
    }

    const predictions = await predictCrowdFlow(stadium_id, event_id);

    res.status(200).json({
      stadium_id,
      event_id,
      generated_at: new Date(),
      predictions
    });
  } catch (error) {
    console.error('Error generating predictions:', error);
    res.status(500).json({ error: 'Failed to generate predictions' });
  }
});

/**
 * GET /api/crowd-predictions/latest
 * Get latest crowd flow predictions
 * Staff/Organizers can only view their assigned stadium
 */
router.get('/latest', auth, async (req, res) => {
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

    // Build query - event_id is optional
    const query = { stadium_id };
    if (event_id) {
      query.event_id = event_id;
    }

    const prediction = await CrowdFlowPrediction.findOne(query)
      .sort({ prediction_timestamp: -1 })
      .exec();

    if (!prediction) {
      // Return empty predictions if none found
      return res.status(200).json({
        stadium_id,
        event_id,
        predictions: [],
        message: 'No predictions generated yet'
      });
    }

    res.status(200).json({
      stadium_id,
      event_id,
      prediction_timestamp: prediction.prediction_timestamp,
      predictions: prediction.predicted_zones || [],
      message: 'Latest predictions retrieved'
    });
  } catch (error) {
    console.error('Error fetching latest predictions:', error);
    res.status(500).json({ error: 'Failed to fetch predictions' });
  }
});

/**
 * GET /api/crowd-predictions/history
 * Get prediction history (for analytics)
 */
router.get('/history', auth, async (req, res) => {
  try {
    const { stadium_id, event_id, limit = 20 } = req.query;

    if (!stadium_id) {
      return res.status(400).json({ error: 'stadium_id is required' });
    }

    const query = { stadium_id };
    if (event_id) query.event_id = event_id;

    const predictions = await CrowdFlowPrediction.find(query)
      .sort({ prediction_timestamp: -1 })
      .limit(parseInt(limit))
      .exec();

    res.status(200).json({
      count: predictions.length,
      predictions
    });
  } catch (error) {
    console.error('Error fetching prediction history:', error);
    res.status(500).json({ error: 'Failed to fetch prediction history' });
  }
});

/**
 * GET /api/crowd-predictions/alerts
 * Get critical alerts for real-time notification
 */
router.get('/alerts', auth, async (req, res) => {
  try {
    const { stadium_id, event_id } = req.query;

    if (!stadium_id || !event_id) {
      return res
        .status(400)
        .json({ error: 'stadium_id and event_id are required' });
    }

    const alerts = await getCriticalAlerts(stadium_id, event_id);

    res.status(200).json({
      stadium_id,
      event_id,
      critical_alert_count: alerts.length,
      alerts
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

/**
 * GET /api/crowd-predictions/by-zone
 * Get prediction details for a specific zone
 */
router.get('/by-zone/:zone_id', auth, async (req, res) => {
  try {
    const { zone_id } = req.params;
    const { stadium_id, event_id, limit = 10 } = req.query;

    if (!stadium_id) {
      return res.status(400).json({ error: 'stadium_id is required' });
    }

    const query = {
      stadium_id,
      'predicted_zones.zone_id': zone_id
    };
    if (event_id) query.event_id = event_id;

    const predictions = await CrowdFlowPrediction.find(query)
      .sort({ prediction_timestamp: -1 })
      .limit(parseInt(limit))
      .exec();

    // Extract only the relevant zone predictions
    const zonePredictions = predictions.map((pred) => ({
      prediction_id: pred.id,
      prediction_timestamp: pred.prediction_timestamp,
      zone: pred.predicted_zones.find((z) => z.zone_id === zone_id),
      all_zones_predicted: pred.predicted_zones.length
    }));

    res.status(200).json({
      zone_id,
      stadium_id,
      count: zonePredictions.length,
      predictions: zonePredictions
    });
  } catch (error) {
    console.error('Error fetching zone predictions:', error);
    res.status(500).json({ error: 'Failed to fetch zone predictions' });
  }
});

module.exports = router;

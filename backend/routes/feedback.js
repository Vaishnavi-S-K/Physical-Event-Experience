const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');
const { auth } = require('../middleware/auth');

// POST /api/feedback/wait-time
// Submits a user's reported wait time to calibrate the simulation
router.post('/wait-time', auth, async (req, res) => {
  try {
    const { stadium_id, zone_id, reported_wait_time, actual_wait_time_estimate, event_phase } = req.body;
    
    if (!stadium_id || !zone_id || reported_wait_time === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const feedback = new Feedback({
      user_id: req.user.userId,
      stadium_id,
      zone_id,
      reported_wait_time,
      actual_wait_time_estimate,
      event_phase,
      created_at: new Date()
    });
    
    await feedback.save();
    res.status(201).json({ message: 'Feedback received. Thank you for helping improve VenueIQ!', feedback });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

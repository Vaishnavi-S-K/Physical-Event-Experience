const express = require('express');
const router = express.Router();
const Config = require('../models/Config');
const { auth, requireRole } = require('../middleware/auth');

// GET /api/config/simulation
// Returns all simulation physics and threshold parameters
router.get('/simulation', auth, async (req, res) => {
  try {
    const configs = await Config.find({ key: { $regex: /sim_/ } }).lean();
    const result = {};
    configs.forEach(c => { result[c.key.replace('sim_', '')] = c.value; });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/config/simulation
// Updates simulation parameters (Admin only)
router.patch('/simulation', auth, requireRole('organizer'), async (req, res) => {
  try {
    const updates = req.body; // e.g. { velocity: 0.2, throughput: 60 }
    const promises = Object.entries(updates).map(([key, value]) => {
      return Config.findOneAndUpdate(
        { key: `sim_${key}` },
        { value, last_updated: new Date() },
        { upsert: true, new: true }
      );
    });
    await Promise.all(promises);
    res.json({ message: 'Simulation configuration updated', updates });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

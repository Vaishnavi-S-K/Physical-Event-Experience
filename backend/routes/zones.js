// Zone Routes — MongoDB/Mongoose version
const express     = require('express');
const Zone        = require('../models/Zone');
const ZoneDensity = require('../models/ZoneDensity');
const { auth, requireRole, getFilterQuery } = require('../middleware/auth');

const router = express.Router();

// GET /api/zones — all zones with latest density
router.get('/', auth, async (req, res) => {
  try {
    // Use auth middleware to enforce stadium filtering
    const filter = getFilterQuery(req.user);
    // Allow override for attendees passing stadiumId
    const stadiumId = req.query.stadiumId;
    if (req.user.role === 'attendee' && stadiumId) {
      filter.stadium_id = stadiumId;
    }
    const zones = await Zone.find(filter).lean();
    const result = zones.map(z => ({ ...z, id: z._id }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/zones/density/all -> get latest density for all zones in a stadium
router.get('/density/all', auth, async (req, res) => {
  try {
    // Use auth middleware to enforce stadium filtering
    const filter = getFilterQuery(req.user);
    // Allow override for attendees passing stadiumId
    const stadiumId = req.query.stadiumId;
    if (req.user.role === 'attendee' && stadiumId) {
      filter.stadium_id = stadiumId;
    }
    const zones = await Zone.find(filter).lean();
    const zoneIds = zones.map(z => z._id);

    // Aggregate to get latest density per zone
    const pipeline = [
      { $match: { zone_id: { $in: zoneIds } } },
      { $sort: { recorded_at: -1 } },
      { $group: { _id: '$zone_id', doc: { $first: '$$ROOT' } } }
    ];
    const results = await ZoneDensity.aggregate(pipeline);

    const latestDensities = {};
    results.forEach(r => {
      latestDensities[r._id] = { ...r.doc, id: r.doc._id };
    });

    res.json(latestDensities);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/zones/:id — single zone with history
router.get('/:id', auth, async (req, res) => {
  try {
    const zone = await Zone.findById(req.params.id).lean();
    if (!zone) return res.status(404).json({ error: 'Zone not found' });
    
    // Enforce stadium access control
    const filter = getFilterQuery(req.user);
    if (filter.stadium_id && zone.stadium_id !== filter.stadium_id) {
      return res.status(403).json({ error: 'Access denied to this zone' });
    }

    const history = await ZoneDensity.find({ zone_id: req.params.id })
      .sort({ recorded_at: -1 })
      .limit(60)
      .lean();

    res.json({ ...zone, id: zone._id, densityHistory: history.reverse() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/zones/density — write new reading
router.post('/density', auth, requireRole('staff', 'organizer'), async (req, res) => {
  try {
    const { zone_id, density } = req.body;
    if (!zone_id || density == null)
      return res.status(400).json({ error: 'zone_id and density are required' });

    const zone = await Zone.findById(zone_id);
    if (!zone) return res.status(404).json({ error: 'Zone not found' });

    const record = new ZoneDensity({
      zone_id,
      stadium_id: zone.stadium_id,
      density: parseFloat(density),
      recorded_at: new Date(),
    });
    await record.save();

    res.json({ success: true, id: record._id, zone_id, density: record.density, recorded_at: record.recorded_at });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

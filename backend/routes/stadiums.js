// Stadium Routes — MongoDB/Mongoose version (scale-ready)
const express = require('express');
const router  = express.Router();
const Stadium = require('../models/Stadium');
const Event   = require('../models/Event');
const Zone    = require('../models/Zone');
const { auth, getFilterQuery } = require('../middleware/auth');

// GET /api/stadiums -> all stadiums with next upcoming event
// Supports ?page=1&limit=12&search=bengaluru&type=cricket
router.get('/', auth, async (req, res) => {
  try {
    const { search, type } = req.query;
    const filter = getFilterQuery(req.user);
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { city: { $regex: search, $options: 'i' } },
    ];
    if (type) filter.type = type;

    const stadiums = await Stadium.find(filter).sort({ name: 1 }).lean();

    // Get next upcoming event for each stadium in a single query
    const stadiumIds = stadiums.map(s => s._id);
    const upcomingEvents = await Event.find({
      stadium_id: { $in: stadiumIds },
      status: 'upcoming'
    }).sort({ date: 1 }).lean();

    // Map: first upcoming event per stadium
    const nextEventMap = {};
    upcomingEvents.forEach(e => {
      if (!nextEventMap[e.stadium_id]) {
        nextEventMap[e.stadium_id] = { ...e, id: e._id };
      }
    });

    const enriched = stadiums.map(s => ({
      ...s,
      id: s._id,
      next_event: nextEventMap[s._id] || null,
    }));

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/stadiums/:id -> specific stadium with its events & zone count
router.get('/:id', auth, async (req, res) => {
  try {
    const st = await Stadium.findById(req.params.id).lean();
    if (!st) return res.status(404).json({ error: 'Stadium not found' });
    
    // Enforce stadium access control
    const filter = getFilterQuery(req.user);
    if (filter.stadium_id && st._id !== filter.stadium_id) {
      return res.status(403).json({ error: 'Access denied to this stadium' });
    }

    const [events, zoneCount] = await Promise.all([
      Event.find({ stadium_id: st._id }).sort({ date: 1 }).lean(),
      Zone.countDocuments({ stadium_id: st._id }),
    ]);

    const enrichedEvents = events.map(e => ({ ...e, id: e._id }));
    res.json({ ...st, id: st._id, events: enrichedEvents, zone_count: zoneCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

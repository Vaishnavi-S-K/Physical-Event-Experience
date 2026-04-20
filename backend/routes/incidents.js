// Incident Routes — MongoDB/Mongoose version
const express    = require('express');
const Incident   = require('../models/Incident');
const Zone       = require('../models/Zone');
const { auth, requireRole, getFilterQuery } = require('../middleware/auth');

const router = express.Router();

// GET /api/incidents
router.get('/', auth, async (req, res) => {
  try {
    // Use auth to enforce stadium filtering
    const filter = getFilterQuery(req.user);
    // Allow attendees to override with stadiumId
    const stadiumId = req.query.stadiumId;
    if (req.user.role === 'attendee' && stadiumId) {
      filter.stadium_id = stadiumId;
    }
    
    let incidents = await Incident.find(filter).sort({ created_at: -1 }).lean();

    // Attach zone name
    const zones = await Zone.find().lean();
    incidents = incidents.map(i => {
      const z = zones.find(z => z._id === i.zone_id);
      return { ...i, id: i._id, zone_name: z ? z.name : i.zone_id };
    });

    res.json(incidents);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/incidents/stats
router.get('/stats', auth, async (req, res) => {
  try {
    // Use auth to enforce stadium filtering
    const filter = getFilterQuery(req.user);
    // Allow attendees to override with stadiumId
    const stadiumId = req.query.stadiumId;
    if (req.user.role === 'attendee' && stadiumId) {
      filter.stadium_id = stadiumId;
    }
    
    const incidents = await Incident.find(filter).lean();

    const stats = {
      total: incidents.length,
      active: incidents.filter(i => i.status === 'active' || i.status === 'responding').length,
      pending: incidents.filter(i => i.status === 'pending').length,
      resolved: incidents.filter(i => i.status === 'resolved').length
    };
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/incidents
router.post('/', auth, requireRole('staff', 'organizer', 'attendee'), async (req, res) => {
  try {
    const { type, severity, zone_id, message, assigned_to, stadium_id } = req.body;
    const sId = stadium_id || req.user?.stadium_id || req.query.stadiumId;

    if (!type || !severity || !message)
      return res.status(400).json({ error: 'type, severity, and message are required' });

    const incident = new Incident({
      stadium_id:  sId,
      type,
      severity,
      zone_id:     zone_id || null,
      message,
      status:      'pending',
      reported_by: req.user ? req.user.id : 'unknown',
      assigned_to: assigned_to || null,
      created_at:  new Date(),
    });

    await incident.save();

    const io = req.app.get('io');
    const result = incident.toJSON();
    result.id = result._id;
    if (sId) io.to(`stadium:${sId}`).emit('incident:new', result);
    else io.emit('incident:new', result);

    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/incidents/:id
router.patch('/:id', auth, requireRole('staff', 'organizer'), async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id);
    if (!incident) return res.status(404).json({ error: 'Incident not found' });

    const allowed = ['status', 'assigned_to', 'severity'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    if (updates.status === 'resolved' && incident.status !== 'resolved')
      updates.resolved_at = new Date();

    Object.assign(incident, updates);
    await incident.save();

    const result = incident.toJSON();
    result.id = result._id;
    const io = req.app.get('io');
    if (result.stadium_id) io.to(`stadium:${result.stadium_id}`).emit('incident:update', result);
    else io.emit('incident:update', result);

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

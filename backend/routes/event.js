// Event Routes — MongoDB/Mongoose version
const express      = require('express');
const { v4: uuidv4 } = require('uuid');
const Event        = require('../models/Event');
const Incident     = require('../models/Incident');
const Staff        = require('../models/Staff');
const Notification = require('../models/Notification');
const { auth, requireRole, getFilterQuery } = require('../middleware/auth');

const router = express.Router();

// ===================== EVENT STATE =====================
router.get('/state', auth, async (req, res) => {
  try {
    // Use auth to enforce stadium filtering
    const filter = getFilterQuery(req.user);
    // Allow attendees to override with stadiumId
    const stadiumId = req.query.stadiumId;
    if (req.user.role === 'attendee' && stadiumId) {
      filter.stadium_id = stadiumId;
    }
    
    let state;
    if (filter.stadium_id) {
      state = await Event.findOne(filter).lean();
    } else {
      state = await Event.findOne().lean();
    }

    if (!state) return res.status(404).json({ error: 'Event not found' });

    const activeIncidents = await Incident.countDocuments({
      stadium_id: state.stadium_id,
      status: { $in: ['active', 'responding'] }
    });

    res.json({ ...state, id: state._id, active_incidents: activeIncidents });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/state', auth, requireRole('staff', 'organizer'), async (req, res) => {
  try {
    const stadiumId = req.user.stadium_id || req.body.stadium_id;
    const allowed = ['current_phase', 'attendees', 'open_gates'];
    const updates = { updated_at: new Date() };
    allowed.forEach(k => { if (req.body[k] != null) updates[k] = req.body[k]; });

    const eventInfo = await Event.findOne({ stadium_id: stadiumId });
    if (!eventInfo) return res.status(404).json({ error: 'Event not found' });

    Object.assign(eventInfo, updates);
    await eventInfo.save();

    const io = req.app.get('io');
    if (updates.current_phase) {
      io.to(`stadium:${stadiumId}`).emit('event:phase_change', { phase: updates.current_phase });
    }

    const result = eventInfo.toJSON();
    res.json({ ...result, id: result._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===================== SCHEDULE =====================
router.get('/schedule', auth, async (req, res) => {
  try {
    // Use auth to enforce stadium filtering
    const filter = getFilterQuery(req.user);
    // Allow attendees to override with stadiumId
    const stadiumId = req.query.stadiumId;
    if (req.user.role === 'attendee' && stadiumId) {
      filter.stadium_id = stadiumId;
    }
    
    const eventInfo = filter.stadium_id
      ? await Event.findOne(filter).lean()
      : await Event.findOne().lean();
    const baseTime = eventInfo && eventInfo.date ? new Date(eventInfo.date) : new Date();

    const schedule = [
      { id: '1', event_time: new Date(baseTime.getTime() - 90*60000).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}), label: 'Gates Open', status: 'done', icon: '🚪' },
      { id: '2', event_time: new Date(baseTime.getTime() - 30*60000).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}), label: 'Pre-Match Show', status: 'done', icon: '🎤' },
      { id: '3', event_time: baseTime.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}), label: 'Kick Off / Start', status: 'active', icon: '⚽' },
      { id: '4', event_time: new Date(baseTime.getTime() + 45*60000).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}), label: 'Half Time', status: 'upcoming', icon: '⏸️' },
      { id: '5', event_time: new Date(baseTime.getTime() + 105*60000).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}), label: 'Full Time', status: 'upcoming', icon: '🏆' }
    ];
    res.json(schedule);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===================== STAFF =====================
router.get('/staff', auth, requireRole('staff', 'organizer'), async (req, res) => {
  try {
    // Enforce staff can only see their own stadium's staff
    const filter = getFilterQuery(req.user);
    const staff = await Staff.find(filter).lean();
    const result = staff.map(s => ({ ...s, id: s._id }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/staff/:id', auth, requireRole('staff', 'organizer'), async (req, res) => {
  try {
    const member = await Staff.findById(req.params.id);
    if (!member) return res.status(404).json({ error: 'Staff member not found' });
    const updates = {};
    ['location', 'status'].forEach(k => { if (req.body[k] != null) updates[k] = req.body[k]; });
    Object.assign(member, updates);
    await member.save();
    const result = member.toJSON();
    res.json({ ...result, id: result._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===================== NOTIFICATIONS =====================
router.get('/notifications', auth, async (req, res) => {
  try {
    const { role, stadium_id } = req.user;
    let filter = {};
    if (stadium_id) {
      filter.$or = [{ stadium_id: null }, { stadium_id }, { stadium_id: { $exists: false } }];
    }

    let notifs = await Notification.find(filter)
      .sort({ created_at: -1 })
      .limit(20)
      .lean();

    notifs = notifs
      .filter(n => !n.target_role || n.target_role === role)
      .map(n => ({ ...n, id: n._id }));

    res.json(notifs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/notifications', auth, requireRole('staff', 'organizer'), async (req, res) => {
  try {
    const { type, message, target_role, stadium_id } = req.body;
    if (!type || !message) return res.status(400).json({ error: 'type and message are required' });
    const notif = new Notification({
      stadium_id: stadium_id || req.user.stadium_id,
      type,
      message,
      target_role: target_role || null,
      read: false,
      created_at: new Date(),
    });
    await notif.save();
    const result = notif.toJSON();
    res.status(201).json({ ...result, id: result._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// ===================== ANALYTICS (Data-Driven) =====================

const Booking      = require('../models/Booking');
const ZoneDensity  = require('../models/ZoneDensity');
const Zone         = require('../models/Zone');
const Stadium      = require('../models/Stadium');

// Revenue is derived from actual bookings × avg ticket price per section.
// A real system would have a payments collection; we model it from bookings.
const SECTION_PRICES = {
  'General':     1200,
  'Premium':     3500,
  'VIP':         8000,
  'West Stand':  2000,
  'East Stand':  1800,
  'North Stand': 1500,
  'South Stand': 1500,
};

// F&B spend per attendee by zone type
const FB_SPEND_PER_HEAD = 350;   // avg ₹350 on food & drink
const MERCH_SPEND_PER_HEAD = 180; // avg ₹180 on merchandise

router.get('/analytics/revenue', auth, requireRole('organizer'), async (req, res) => {
  try {
    const stadiumId = req.query.stadiumId || req.user.stadium_id;
    const filter = stadiumId ? { stadium_id: stadiumId } : {};

    const bookings = await Booking.find(filter).lean();
    const totalTickets = bookings.reduce((s, b) => s + (b.num_tickets || 1), 0);

    // Ticket revenue: sum(tickets × section price)
    let ticketRevenue = 0;
    bookings.forEach(b => {
      const price = SECTION_PRICES[b.section] || 1500;
      ticketRevenue += (b.num_tickets || 1) * price;
    });

    // F&B revenue estimate: total attendees × average spend
    const fbRevenue = totalTickets * FB_SPEND_PER_HEAD;

    // Merchandise revenue estimate: ~40% of attendees buy merch
    const merchRevenue = Math.round(totalTickets * 0.4 * MERCH_SPEND_PER_HEAD);

    // VIP/Premium: count VIP/Premium bookings only
    const vipBookings = bookings.filter(b => b.section === 'VIP' || b.section === 'Premium');
    const vipRevenue = vipBookings.reduce((s, b) => {
      const price = SECTION_PRICES[b.section] || 5000;
      return s + (b.num_tickets || 1) * price * 1.5; // VIP includes hospitality markup
    }, 0);

    res.json([
      { category: 'Tickets',       value: ticketRevenue,  color: 'var(--color-blue)' },
      { category: 'F&B',           value: fbRevenue,      color: 'var(--color-orange)' },
      { category: 'Merchandise',   value: merchRevenue,   color: 'var(--color-purple)' },
      { category: 'VIP/Premium',   value: Math.round(vipRevenue), color: 'var(--color-green)' },
    ]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Crowd flow: derived from gate zone density readings over time.
// Each data point = avg gate density in a 30-min window.
router.get('/analytics/crowd-flow', auth, requireRole('organizer', 'staff'), async (req, res) => {
  try {
    const stadiumId = req.query.stadiumId || req.user?.stadium_id;
    if (!stadiumId) return res.json([]);

    // Get gate zones for this stadium
    const gateZones = await Zone.find({ stadium_id: stadiumId, type: 'gate' }).select('_id capacity_limit').lean();
    const gateIds = gateZones.map(z => z._id);
    if (gateIds.length === 0) return res.json([]);

    const totalGateCapacity = gateZones.reduce((s, z) => s + (z.capacity_limit || 3000), 0);

    // Get last 3 hours of density readings for gate zones
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
    const readings = await ZoneDensity.find({
      zone_id: { $in: gateIds },
      recorded_at: { $gte: threeHoursAgo }
    }).sort({ recorded_at: 1 }).lean();

    if (readings.length === 0) {
      // Return sensible defaults based on event phase
      const evnt = await Event.findOne({ stadium_id: stadiumId }).lean();
      const stadium = await Stadium.findById(stadiumId).lean();
      const cap = stadium?.capacity || 40000;
      const fill = evnt?.attendees || cap * 0.7;

      return res.json([
        { time: '-2:30h', ingress: Math.round(fill * 0.08), egress: Math.round(fill * 0.002) },
        { time: '-2:00h', ingress: Math.round(fill * 0.15), egress: Math.round(fill * 0.005) },
        { time: '-1:30h', ingress: Math.round(fill * 0.25), egress: Math.round(fill * 0.01) },
        { time: '-1:00h', ingress: Math.round(fill * 0.30), egress: Math.round(fill * 0.015) },
        { time: '-0:30h', ingress: Math.round(fill * 0.15), egress: Math.round(fill * 0.02) },
        { time: 'Now',    ingress: Math.round(fill * 0.05), egress: Math.round(fill * 0.03) },
      ]);
    }

    // Bucket readings into 30-min windows
    const buckets = {};
    readings.forEach(r => {
      const t      = new Date(r.recorded_at);
      const bucket = `${t.getHours().toString().padStart(2,'0')}:${t.getMinutes() < 30 ? '00' : '30'}`;
      if (!buckets[bucket]) buckets[bucket] = [];
      buckets[bucket].push(r.density);
    });

    const flowData = Object.entries(buckets).map(([time, densities]) => {
      const avgDensity = densities.reduce((s, d) => s + d, 0) / densities.length;
      const ingress    = Math.round((avgDensity / 100) * totalGateCapacity);
      const egress     = Math.round(ingress * 0.08); // ~8% egress during ingress
      return { time, ingress, egress };
    });

    res.json(flowData.slice(-8)); // Last 8 windows (4 hours)
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

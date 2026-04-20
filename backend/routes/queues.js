// Queue Routes — MongoDB/Mongoose version
const express     = require('express');
const Queue       = require('../models/Queue');
const Reservation = require('../models/Reservation');
const Zone        = require('../models/Zone');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/queues -> all queues optionally filtered by stadiumId
router.get('/', async (req, res) => {
  try {
    const stadiumId = req.query.stadiumId;
    const filter = stadiumId ? { stadium_id: stadiumId } : {};
    const queues = await Queue.find(filter).lean();

    // Attach basic zone name
    const zones = await Zone.find().lean();
    const result = queues.map(q => {
      const zone = zones.find(z => z._id === q.zone_id);
      return { ...q, id: q._id, zone_name: zone ? zone.name : 'Unknown' };
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/queues/reservations/mine   ← MUST come before /:id
router.get('/reservations/mine', auth, async (req, res) => {
  try {
    const reservations = await Reservation.find({ user_id: req.user.id, status: 'active' }).lean();

    const enriched = [];
    for (const r of reservations) {
      const queue = await Queue.findById(r.queue_id).lean();
      enriched.push({ ...r, id: r._id, queue_name: queue?.name, wait_time: queue?.wait_time });
    }
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/queues/:id
router.get('/:id', async (req, res) => {
  try {
    const queue = await Queue.findById(req.params.id).lean();
    if (!queue) return res.status(404).json({ error: 'Queue not found' });
    res.json({ ...queue, id: queue._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/queues/:id/reserve
router.post('/:id/reserve', auth, async (req, res) => {
  try {
    const queue = await Queue.findOne({ _id: req.params.id, is_open: true });
    if (!queue) return res.status(404).json({ error: 'Queue not found or closed' });

    if (queue.reserved >= queue.total_slots)
      return res.status(409).json({ error: 'Queue is full' });

    const existing = await Reservation.findOne({ queue_id: queue._id, user_id: req.user.id, status: 'active' });
    if (existing)
      return res.status(409).json({ error: 'You already have an active reservation for this queue' });

    const slotTime = new Date(Date.now() + queue.wait_time * 60000)
      .toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const reservation = new Reservation({
      queue_id:   queue._id,
      user_id:    req.user.id,
      slot_time:  slotTime,
      status:     'active',
      created_at: new Date(),
    });

    await reservation.save();
    queue.reserved = (queue.reserved || 0) + 1;
    await queue.save();

    const result = reservation.toJSON();
    res.status(201).json({
      ...result,
      id: result._id,
      queue_name: queue.name,
      wait_time:  queue.wait_time,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/queues/reservations/:id
router.delete('/reservations/:id', auth, async (req, res) => {
  try {
    const reservation = await Reservation.findOne({ _id: req.params.id, user_id: req.user.id });
    if (!reservation) return res.status(404).json({ error: 'Reservation not found' });

    reservation.status = 'cancelled';
    await reservation.save();

    await Queue.findByIdAndUpdate(reservation.queue_id, { $inc: { reserved: -1 } });
    // Ensure reserved doesn't go below 0
    await Queue.updateOne({ _id: reservation.queue_id, reserved: { $lt: 0 } }, { $set: { reserved: 0 } });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/queues/:id
router.patch('/:id', auth, requireRole('staff', 'organizer'), async (req, res) => {
  try {
    const queue = await Queue.findById(req.params.id);
    if (!queue) return res.status(404).json({ error: 'Queue not found' });

    const allowed = ['wait_time', 'total_slots', 'is_open'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] != null) updates[k] = req.body[k]; });

    Object.assign(queue, updates);
    await queue.save();
    const result = queue.toJSON();
    res.json({ ...result, id: result._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

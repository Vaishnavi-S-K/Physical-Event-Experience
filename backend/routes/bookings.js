// Booking Routes — MongoDB/Mongoose (scale-ready with batched lookups)
const express  = require('express');
const router   = express.Router();
const User     = require('../models/User');
const Booking  = require('../models/Booking');
const Event    = require('../models/Event');
const Stadium  = require('../models/Stadium');
const bcrypt   = require('bcryptjs');

// POST /api/bookings -> Create a booking/ticket
router.post('/', async (req, res) => {
  try {
    const { stadium_id, event_id, section, tickets, email, name } = req.body;
    if (!stadium_id || !event_id) return res.status(400).json({ error: 'Missing stadium or event' });

    // Ensure user exists, if not create a stub attendee
    let user = await User.findOne({ email });
    if (!user) {
      const hashedPassword = bcrypt.hashSync('demo1234', 10);
      user = new User({ email, password: hashedPassword, role: 'attendee', name: name || 'New Fan' });
      await user.save();
    }

    const booking = new Booking({
      user_id:      user._id,
      stadium_id,
      event_id,
      section:      section || 'General',
      num_tickets:  tickets || 1,
      booking_date: new Date(),
    });

    await booking.save();
    res.status(201).json({ success: true, booking: booking.toJSON(), message: 'Ticket successfully booked!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/bookings/mine -> Get all bookings for a user (batched, no N+1 queries)
router.get('/mine', async (req, res) => {
  try {
    const email = req.query.email;
    if (!email) return res.status(400).json({ error: 'Email required' });

    const user = await User.findOne({ email }).lean();
    if (!user) return res.json([]);

    // Fetch all bookings for this user (uses index on user_id)
    const myBookings = await Booking.find({ user_id: user._id })
      .sort({ booking_date: -1 })
      .limit(50)  // cap to last 50 bookings for UI
      .lean();

    if (myBookings.length === 0) return res.json([]);

    // Batch fetch events and stadiums (no N+1 queries)
    const eventIds   = [...new Set(myBookings.map(b => b.event_id))];
    const stadiumIds = [...new Set(myBookings.map(b => b.stadium_id))];

    const [events, stadiums] = await Promise.all([
      Event.find({ _id: { $in: eventIds } }).lean(),
      Stadium.find({ _id: { $in: stadiumIds } }).lean(),
    ]);

    const eventMap   = {};
    const stadiumMap = {};
    events.forEach(e   => { eventMap[e._id]   = { ...e, id: e._id };   });
    stadiums.forEach(s => { stadiumMap[s._id] = { ...s, id: s._id }; });

    // Filter out done/missing events
    const staleIds = [];
    const enriched = myBookings.reduce((acc, b) => {
      const ev = eventMap[b.event_id];
      if (!ev || ev.status === 'done') {
        staleIds.push(b._id);
        return acc;
      }
      acc.push({
        ...b,
        id:      b._id,
        event:   ev,
        stadium: stadiumMap[b.stadium_id] || null,
      });
      return acc;
    }, []);

    // Clean up stale bookings in background (don't await)
    if (staleIds.length > 0) {
      Booking.deleteMany({ _id: { $in: staleIds } }).catch(() => {});
    }

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

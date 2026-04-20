const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Stadium = require('../models/Stadium');
const { auth, getFilterQuery } = require('../middleware/auth');

// GET /api/stats/fill-rate/:stadiumId
// Returns the actual fill rate percentage based on real bookings vs stadium capacity
router.get('/fill-rate/:stadiumId', auth, async (req, res) => {
  try {
    const { stadiumId } = req.params;
    
    // Enforce stadium access control
    const filter = getFilterQuery(req.user);
    if (filter.stadium_id && stadiumId !== filter.stadium_id) {
      return res.status(403).json({ error: 'Access denied to this stadium' });
    }
    
    const stadium = await Stadium.findById(stadiumId).lean();
    if (!stadium) return res.status(404).json({ error: 'Stadium not found' });
    
    const bookingCount = await Booking.aggregate([
      { $match: { stadium_id: stadiumId } },
      { $group: { _id: null, total_tickets: { $sum: '$num_tickets' } } }
    ]);
    
    const totalBooked = bookingCount.length > 0 ? bookingCount[0].total_tickets : 0;
    const capacity = stadium.capacity || 40000;
    const fillRate = (totalBooked / capacity) * 100;
    
    res.json({
      stadium_id: stadiumId,
      stadium_name: stadium.name,
      capacity: capacity,
      total_booked: totalBooked,
      fill_rate: parseFloat(fillRate.toFixed(2))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

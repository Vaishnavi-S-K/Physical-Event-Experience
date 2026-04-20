// Auth Routes — MongoDB/Mongoose version
const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const User    = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'venueiq_secret';

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password are required' });

    const user = await User.findOne({ email }).lean();
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = bcrypt.compareSync(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role, name: user.name, stadium_id: user.stadium_id },
      JWT_SECRET,
      { expiresIn: '12h' }
    );

    const { password: _, ...safeUser } = user;
    safeUser.id = safeUser._id;
    res.json({ token, user: safeUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, stadium_id } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Name, email, and password required' });
    }

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ error: 'User already exists' });

    // Validate stadium_id for staff/organizers
    if ((role === 'staff' || role === 'organizer') && !stadium_id) {
      return res.status(400).json({ error: `${role} must select a stadium` });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: role || 'attendee',
      stadium_id: stadium_id || null,
      status: role === 'attendee' ? 'active' : 'pending',
    });

    await newUser.save();
    res.json({ message: 'Registration successful', status: newUser.status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).lean();
    if (!user) return res.status(404).json({ error: 'User not found' });
    const { password: _, ...safeUser } = user;
    safeUser.id = safeUser._id;
    res.json(safeUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/pending-staff
router.get('/pending-staff', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).lean();
    if (!user || user.role !== 'organizer') return res.status(403).json({ error: 'Unauthorized' });

    const pending = await User.find({ role: 'staff', status: 'pending', stadium_id: user.stadium_id })
      .select('-password')
      .lean();
    const safePending = pending.map(p => { p.id = p._id; return p; });
    res.json(safePending);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/auth/approve-staff/:id
router.patch('/approve-staff/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).lean();
    if (!user || user.role !== 'organizer') return res.status(403).json({ error: 'Unauthorized' });

    const target = await User.findById(req.params.id).lean();
    if (!target || target.stadium_id !== user.stadium_id) return res.status(404).json({ error: 'Staff not found or mismatched stadium' });

    await User.findByIdAndUpdate(req.params.id, { status: 'active' });
    res.json({ message: 'Approved' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/logout
router.post('/logout', auth, (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;

const express = require('express');
const router = express.Router();
const Incident = require('../models/Incident');
const Notification = require('../models/Notification');
const { auth, requireRole } = require('../middleware/auth');

// POST /api/alerts/security
// Allows manual or external system to trigger a security/safety incident
router.post('/security', auth, requireRole('staff', 'organizer'), async (req, res) => {
  try {
    const { stadium_id, zone_id, type, severity, message } = req.body;
    
    if (!stadium_id || !zone_id || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const now = new Date();
    
    // Create actual incident
    const incident = new Incident({
      stadium_id,
      zone_id,
      type: type || 'security',
      severity: severity || 'high',
      message: `🚨 SECURITY ALERT: ${message}`,
      status: 'active',
      reported_by: 'external_alert',
      created_at: now
    });
    
    await incident.save();
    
    // Create global notification
    const notif = new Notification({
      stadium_id,
      type: 'alert',
      message: `SECURITY ALERT: ${message}. Check dashboard for details.`,
      target_role: 'staff',
      read: false,
      created_at: now
    });
    
    await notif.save();
    
    // Broadcast via global socket room (if needed, though server.js handles sim stats)
    // Here we'd typically emit to the specific stadium room if we had access to 'io'
    
    res.status(201).json({ 
      message: 'Security alert processed and broadcast initiated',
      incident,
      notification: notif
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

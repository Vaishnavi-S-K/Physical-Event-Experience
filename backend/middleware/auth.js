/**
 * JWT Auth Middleware
 */

const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'venueiq_secret';

/**
 * auth — verifies Bearer token, attaches req.user
 */
function auth(req, res, next) {
  const header = req.headers['authorization'];
  if (!header || !header.startsWith('Bearer '))
    return res.status(401).json({ error: 'Authorization token required' });

  const token = header.split(' ')[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * requireRole(...roles) — role-based access guard
 * Usage: router.get('/secret', auth, requireRole('staff', 'organizer'), handler)
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    if (!roles.includes(req.user.role))
      return res.status(403).json({ error: `Access denied. Required role: ${roles.join(' or ')}` });
    next();
  };
}

/**
 * ensureStadiumAccess — For staff/organizers, verify they can only access their assigned stadium
 * Usage: router.get('/stadiums/:stadium_id/...', auth, ensureStadiumAccess, handler)
 * Automatically allows attendees to access all stadiums, restricts staff/organizers to their own
 */
function ensureStadiumAccess(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  
  // Attendees can access all stadiums
  if (req.user.role === 'attendee') {
    return next();
  }
  
  // Staff and organizers can only access their assigned stadium
  const requestedStadiumId = req.params.stadium_id || req.body?.stadium_id || req.query?.stadium_id;
  if (requestedStadiumId && req.user.stadium_id && requestedStadiumId !== req.user.stadium_id) {
    return res.status(403).json({ error: 'You do not have access to this stadium' });
  }
  
  next();
}

/**
 * getFilterQuery — Helper to generate MongoDB filter for stadium_id
 * For staff/organizers: enforces their assigned stadium
 * For attendees: returns empty filter (no restriction)
 */
function getFilterQuery(user) {
  if (!user) return {};
  if (user.role === 'attendee') return {};
  if (user.stadium_id) return { stadium_id: user.stadium_id };
  return { stadium_id: null }; // No stadium assigned (shouldn't happen in normal flow)
}

module.exports = { auth, requireRole, ensureStadiumAccess, getFilterQuery };

/**
 * ============================================================
 *  VenueIQ Backend — Main Server
 *  Express + Socket.io + MongoDB (Mongoose)
 *
 *  Port: 4000 (configurable via .env)
 *
 *  REST API:
 *    POST   /api/auth/login
 *    GET    /api/auth/me
 *    GET    /api/zones
 *    GET    /api/zones/density/all
 *    GET    /api/zones/:id
 *    POST   /api/zones/density
 *    GET    /api/queues
 *    POST   /api/queues/:id/reserve
 *    GET    /api/queues/reservations/mine
 *    DELETE /api/queues/reservations/:id
 *    PATCH  /api/queues/:id
 *    GET    /api/incidents
 *    POST   /api/incidents
 *    PATCH  /api/incidents/:id
 *    GET    /api/event/state
 *    PATCH  /api/event/state
 *    GET    /api/event/schedule
 *    GET    /api/event/staff
 *    PATCH  /api/event/staff/:id
 *    GET    /api/event/notifications
 *    GET    /api/event/analytics/revenue
 *    GET    /api/event/analytics/crowd-flow
 *    GET    /api/event/analytics/zone-stats
 *
 *  Socket.io Events Emitted (server → clients):
 *    crowd:update        — {densities: {zone_id: density}, tick, phase}
 *    queue:update        — updated queue object
 *    incident:new        — new incident object
 *    incident:update     — updated incident object
 *    event:phase_change  — {phase}
 *    notification:new    — notification object
 *    stats:update        — {totalAttendees, avgWaitTime, activeIncidents, openGates}
 *
 *  Socket.io Events Received (clients → server):
 *    join:role           — client announces role (for targeted broadcasts)
 * ============================================================
 */

require('dotenv').config();
const express     = require('express');
const http        = require('http');
const { Server }  = require('socket.io');
const cors        = require('cors');
const helmet      = require('helmet');
const compression = require('compression');
const morgan      = require('morgan');
const rateLimit   = require('express-rate-limit');
const { connectDB } = require('./db/database');

// Mongoose Models (used by simulation engine + auto-seed)
const Stadium      = require('./models/Stadium');
const Event        = require('./models/Event');
const Zone         = require('./models/Zone');
const ZoneDensity  = require('./models/ZoneDensity');
const Queue        = require('./models/Queue');
const Incident     = require('./models/Incident');
const Notification = require('./models/Notification');

// ============================================================
//  EXPRESS SETUP
// ============================================================
const app    = express();
const server = http.createServer(app);
const PORT   = process.env.PORT || 4000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

// Security & middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(morgan('dev'));
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET','POST','PATCH','DELETE','OPTIONS'],
}));
app.use(express.json());

// Rate limiting (200 req/min per IP for API)
app.use('/api/', rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  message: { error: 'Too many requests — please slow down' },
}));

// ============================================================
//  SOCKET.IO SETUP
// ============================================================
const io = new Server(server, {
  cors: {
    origin: [CLIENT_ORIGIN, 'http://localhost:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST'],
  },
  pingTimeout: 30000,
  pingInterval: 10000,
});

// Attach io to app for use in routes
app.set('io', io);

// Socket connection handler
io.on('connection', (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);

  // Client joins role-specific room (optional, mostly for global broadcast if needed)
  socket.on('join:role', (role) => {
    const validRoles = ['attendee', 'staff', 'organizer'];
    if (validRoles.includes(role)) {
      socket.join(`role:${role}`);
    }
  });

  // NEW: Client joins stadium-specific room to only receive events for their venue
  socket.on('join:stadium', (stadiumId) => {
    if (!stadiumId) return;
    // Leave previous stadium rooms to prevent cross-talk
    Array.from(socket.rooms).forEach(room => {
      if (room.startsWith('stadium:')) socket.leave(room);
    });
    socket.join(`stadium:${stadiumId}`);
    console.log(`[Socket] ${socket.id} joined stadium: ${stadiumId}`);
  });

  socket.on('disconnect', (reason) => {
    console.log(`[Socket] Client disconnected: ${socket.id} — ${reason}`);
  });
});

// ============================================================
//  CROWD SIMULATION ENGINE — Physics-Based Model
//
//  Core principles:
//  1. Zone density = f(bookings, event fill-rate, phase behavior)
//     NOT random numbers.
//  2. Queue wait time = people_queued / throughput_rate
//     NOT random drift.
//  3. Incidents auto-detected when density > threshold for 2+ ticks.
//  4. Notifications are triggered by real system events.
//  5. Staff auto-assigned to new critical incidents.
// ============================================================

// Phase-specific TARGET density multipliers per zone type.
// These represent the proportion of that zone's capacity that
// would be occupied during each event phase on a sold-out day.
const PHASE_BEHAVIOR = {
  'Pre-Game':    { gate: 0.82, food: 0.35, restroom: 0.28, merch: 0.65, vip: 0.52, medical: 0.10 },
  'Kick-Off':    { gate: 0.97, food: 0.18, restroom: 0.15, merch: 0.25, vip: 0.88, medical: 0.18 },
  'First Half':  { gate: 0.22, food: 0.28, restroom: 0.32, merch: 0.15, vip: 0.80, medical: 0.22 },
  'Half-Time':   { gate: 0.55, food: 0.98, restroom: 0.95, merch: 0.58, vip: 0.94, medical: 0.28 },
  'Second Half': { gate: 0.20, food: 0.32, restroom: 0.28, merch: 0.18, vip: 0.80, medical: 0.25 },
  'Full-Time':   { gate: 0.95, food: 0.45, restroom: 0.55, merch: 0.75, vip: 0.55, medical: 0.38 },
  'Post-Game':   { gate: 0.80, food: 0.68, restroom: 0.48, merch: 0.70, vip: 0.38, medical: 0.32 },
};

// Track consecutive high-density ticks per zone (for incident debouncing).
const highDensityTicks = {}; // { zone_id: count }

// Simulation Configuration Cache
let simConfig = {
  velocity: 0.18,
  throughput: {
    gate: 120, food: 45, restroom: 60, merch: 25, vip: 80, medical: 10, field: 999
  },
  incidentThreshold: 87,
  incidentResolveThreshold: 62,
  weatherFactor: 1.0
};

const Config = require('./models/Config');
const GateReading = require('./models/GateReading');
const BeaconReading = require('./models/BeaconReading');

async function loadSimulationConfig() {
  try {
    const configs = await Config.find({ key: { $regex: /sim_/ } }).lean();
    if (configs.length > 0) {
      configs.forEach(c => {
        const key = c.key.replace('sim_', '');
        simConfig[key] = c.value;
      });
    }
  } catch (err) {
    console.error('[Simulation] Failed to load config:', err.message);
  }
}

async function initSimulationConfig() {
  const defaults = [
    { key: 'sim_velocity', value: 0.18, description: 'Crowd movement convergence rate' },
    { key: 'sim_throughput', value: simConfig.throughput, description: 'Zone throughput rates (people/min)' },
    { key: 'sim_incidentThreshold', value: 87, description: 'Density % that triggers an incident' },
    { key: 'sim_incidentResolveThreshold', value: 62, description: 'Density % that auto-resolves an incident' },
    { key: 'sim_weatherFactor', value: 1.0, description: 'Global multiplier for crowd behavior (rain/heat)' }
  ];

  for (const def of defaults) {
    await Config.findOneAndUpdate({ key: def.key }, def, { upsert: true });
  }
}

// Booking load per stadium (cached for the simulation tick).
// Re-fetched every 10 ticks to reflect new bookings.
let bookingLoadCache = {};   // { stadium_id: fill_rate (0–1) }
let bookingCacheAge  = 0;

const Booking = require('./models/Booking');
const Staff   = require('./models/Staff');

async function refreshBookingLoad() {
  // Count bookings per stadium → compute fill rate vs. capacity
  const stadiums = await Stadium.find().lean();
  const counts   = await Booking.aggregate([
    { $group: { _id: '$stadium_id', count: { $sum: '$num_tickets' } } }
  ]);
  const countMap = {};
  counts.forEach(c => { countMap[c._id] = c.count; });

  const newCache = {};
  stadiums.forEach(s => {
    const booked   = countMap[s._id] || 0;
    newCache[s._id] = Math.min(1.0, booked / (s.capacity || 40000));
  });
  bookingLoadCache = newCache;
}

let simulationTick = 0;

async function runCrowdSimulation() {
  try {
    const events = await Event.find().lean();
    if (!events || events.length === 0) return;

    // Refresh config and booking load periodically
    if (simulationTick % 10 === 0) {
      await Promise.all([
        loadSimulationConfig(),
        refreshBookingLoad()
      ]);
      bookingCacheAge = simulationTick;
    }

    const allZones  = await Zone.find({ type: { $ne: 'field' } }).lean();
    const allQueues = await Queue.find({ is_open: true }).lean();

    // ── Get Sensor & Historic Data ──────────────────────────────────────────
    const now = new Date();
    const [latestDensityAgg, latestGateReadings, latestBeaconReadings] = await Promise.all([
      ZoneDensity.aggregate([
        { $sort: { recorded_at: -1 } },
        { $group: { _id: '$zone_id', density: { $first: '$density' } } }
      ]),
      GateReading.aggregate([
        { $sort: { recorded_at: -1 } },
        { $group: { _id: '$zone_id', latest: { $first: '$$ROOT' } } }
      ]),
      BeaconReading.aggregate([
        { $sort: { recorded_at: -1 } },
        { $group: { _id: '$zone_id', latest: { $first: '$$ROOT' } } }
      ])
    ]);

    const densityMap = {};
    latestDensityAgg.forEach(d => { densityMap[d._id] = d.density; });
    
    const sensorMap = {};
    latestGateReadings.forEach(r => { sensorMap[r._id] = { type: 'gate', ...r.latest }; });
    latestBeaconReadings.forEach(r => { sensorMap[r._id] = { type: 'beacon', ...r.latest }; });

    // Active incidents (for auto-resolution check)
    const activeIncidentsList = await Incident.find({ status: { $in: ['pending','active','responding'] } }).lean();
    const activeIncidentsByZone = {};
    activeIncidentsList.forEach(i => { activeIncidentsByZone[i.zone_id] = i; });

    const allNewReadings = [];
    const queueUpdates   = [];

    for (const eventState of events) {
      const sId     = eventState.stadium_id;
      const phase   = eventState.current_phase;
      const behavior = PHASE_BEHAVIOR[phase] || PHASE_BEHAVIOR['First Half'];

      // Fill rate: how full is this stadium based on actual bookings?
      // 0.0 = empty, 1.0 = sold out. Default 0.5 if no bookings yet.
      const fillRate = bookingLoadCache[sId] ?? 0.5;

      const stadiumZones  = allZones.filter(z => z.stadium_id === sId);
      const stadiumQueues = allQueues.filter(q => q.stadium_id === sId);

      const densities = {};

      // ── 1. Compute physics-based density per zone ────────────────────────
      stadiumZones.forEach(zone => {
        const current = densityMap[zone._id] ?? 20;
        const sensor  = sensorMap[zone._id];

        // Base target from phase behavior and filling rate
        let phaseMult = behavior[zone.type] ?? 0.35;
        
        // Apply Weather Factor (e.g. rain makes people crowd food/VIP zones more)
        if (['food', 'vip', 'merch'].includes(zone.type)) {
          phaseMult *= (simConfig.weatherFactor > 1 ? simConfig.weatherFactor * 0.8 : 1.0);
        }

        const behaviorTarget = Math.min(100, phaseMult * fillRate * 100);
        
        // Combine with real sensor data if available
        let sensorTarget = behaviorTarget;
        if (sensor) {
          if (sensor.type === 'gate') {
            // High entry count = high local density
            sensorTarget = Math.min(100, (sensor.in_count / 100) * 100);
          } else if (sensor.type === 'beacon') {
            // Beacon occupancy estimate
            sensorTarget = Math.min(100, (sensor.occupancy_estimate / (zone.capacity_limit || 500)) * 100);
          }
        }

        // Final target is a weighted blend (70% sensor, 30% behavior model if sensor exists)
        const target = sensor ? (sensorTarget * 0.7 + behaviorTarget * 0.3) : behaviorTarget;
        const noise  = (Math.random() - 0.48) * 4;
        
        // Velocity-based convergence using Config
        const delta      = (target - current + noise) * simConfig.velocity;
        const newDensity = Math.min(100, Math.max(1, current + delta));

        densities[zone._id] = parseFloat(newDensity.toFixed(1));
      });

      // ── 2. Batch density readings ─────────────────────────────────────────
      Object.entries(densities).forEach(([zone_id, density]) => {
        allNewReadings.push({ stadium_id: sId, zone_id, density, recorded_at: now });
      });

      // ── 3. Physics-based queue wait times ────────────────────────────────
      for (const q of stadiumQueues) {
        const zone        = allZones.find(z => z._id === q.zone_id);
        const density     = densities[q.zone_id] || 40;
        const capacity    = zone?.capacity_limit || 500;
        const throughput  = simConfig.throughput[zone?.type || 'gate'] || 60;
        const peopleInQ   = Math.round((density / 100) * capacity);
        const physicsWait = Math.min(90, Math.max(1, Math.round(peopleInQ / throughput)));

        queueUpdates.push({ id: q._id, wait_time: physicsWait });
      }

      // ── 4. Attendee count: driven by phase delta + fill rate ──────────────
      const maxCapacity = await Stadium.findById(sId).select('capacity').lean()
        .then(s => s?.capacity || 40000)
        .catch(() => 40000);

      const phaseArrivalRate = {
        'Pre-Game':    0.65,  // 65% of ticket holders have arrived
        'Kick-Off':    0.92,
        'First Half':  0.97,
        'Half-Time':   0.98,
        'Second Half': 0.96,
        'Full-Time':   0.70,
        'Post-Game':   0.30,
      };
      const targetAttendees = Math.round(maxCapacity * fillRate * (phaseArrivalRate[phase] || 0.8));
      const currentAttendees = eventState.attendees || targetAttendees;
      const attendeeDrift    = Math.floor((targetAttendees - currentAttendees) * 0.15 + (Math.random() - 0.5) * 40);
      const newAttendees     = Math.max(0, Math.min(maxCapacity, currentAttendees + attendeeDrift));

      await Event.findByIdAndUpdate(eventState._id, { attendees: newAttendees, updated_at: now });

      // ── 5. Auto-detect incidents from density thresholds ─────────────────
      for (const [zoneId, density] of Object.entries(densities)) {
        const zone = stadiumZones.find(z => z._id === zoneId);
        if (!zone) continue;

        if (density >= simConfig.incidentThreshold) {
          highDensityTicks[zoneId] = (highDensityTicks[zoneId] || 0) + 1;

          // Only create incident after 2 consecutive high-density ticks (debounce)
          if (highDensityTicks[zoneId] === 2 && !activeIncidentsByZone[zoneId]) {
            const severity = density >= 95 ? 'critical' : density >= 92 ? 'high' : 'medium';

            // Auto-assign nearest available staff
            const nearbyStaff = await Staff.findOne({ stadium_id: sId, status: 'active' }).lean();

            const incident = new Incident({
              stadium_id:  sId,
              type:        'crowd',
              severity,
              zone_id:     zoneId,
              message:     `🔴 Auto-detected crowd bottleneck at ${zone.name}. Density: ${density.toFixed(0)}%. Immediate dispersal needed.`,
              status:      'active',
              reported_by: 'system',
              assigned_to: nearbyStaff ? nearbyStaff._id : null,
              created_at:  now,
            });
            await incident.save();

            const result = incident.toJSON();
            result.id    = result._id;
            io.to(`stadium:${sId}`).emit('incident:new', result);

            // Dispatch notification to staff
            const notif = new Notification({
              stadium_id:  sId,
              type:        'warning',
              message:     `⚠️ ${zone.name} at ${density.toFixed(0)}% capacity — stewards dispatched.`,
              target_role: 'staff',
              read:        false,
              created_at:  now,
            });
            await notif.save();
            io.to(`stadium:${sId}`).emit('notification:new', notif.toJSON());
          }
        } else {
          // Density is healthy — reset high-density counter
          highDensityTicks[zoneId] = 0;

          // Auto-resolve any active incident in this zone if density dropped
          if (density < simConfig.incidentResolveThreshold && activeIncidentsByZone[zoneId]) {
            const inc = activeIncidentsByZone[zoneId];
            await Incident.findByIdAndUpdate(inc._id, {
              status: 'resolved',
              resolved_at: now,
              message: inc.message + ` ✅ Resolved automatically — density dropped to ${density.toFixed(0)}%.`,
            });
            io.to(`stadium:${sId}`).emit('incident:update', { ...inc, status: 'resolved', resolved_at: now });
          }
        }
      }

      // ── 6. Broadcast stats to connected clients ───────────────────────────
      const avgWait = queueUpdates.length
        ? Math.round(queueUpdates.reduce((s, q) => s + q.wait_time, 0) / queueUpdates.length) : 5;
      const activeCount = activeIncidentsList.filter(i => i.stadium_id === sId).length;

      io.to(`stadium:${sId}`).emit('crowd:update', { densities, tick: simulationTick, phase, timestamp: now.toISOString() });
      io.to(`stadium:${sId}`).emit('stats:update', {
        totalAttendees: newAttendees,
        avgWaitTime:    avgWait,
        activeIncidents: activeCount,
        openGates:      eventState.open_gates,
        phase,
        fillRate:       parseFloat((fillRate * 100).toFixed(1)),
      });

      // ── 7. Phase-transition tip notifications (every 20 ticks) ───────────
      if (simulationTick % 20 === 0) {
        const tip = getPhaseTip(phase, densities, stadiumZones);
        if (tip) {
          const notif = new Notification({
            stadium_id: sId, type: 'info',
            message: tip, target_role: 'attendee',
            read: false, created_at: now,
          });
          await notif.save();
          io.to(`stadium:${sId}`).emit('notification:new', notif.toJSON());
        }
      }
    }

    // ── Batch writes ──────────────────────────────────────────────────────────
    if (allNewReadings.length > 0) {
      await ZoneDensity.insertMany(allNewReadings);
    }
    for (const u of queueUpdates) {
      await Queue.findByIdAndUpdate(u.id, { wait_time: u.wait_time });
    }

    // ── Trim old density readings (prevent DB bloat) ──────────────────────────
    const totalCount = await ZoneDensity.countDocuments();
    if (totalCount > 15000) {
      const cutoff = await ZoneDensity.find().sort({ recorded_at: -1 }).skip(8000).limit(1).lean();
      if (cutoff.length > 0) {
        await ZoneDensity.deleteMany({ recorded_at: { $lt: cutoff[0].recorded_at } });
      }
    }

    simulationTick++;
  } catch (err) {
    console.error('[Simulation Error]', err.message);
  }
}

// Contextual tips sent to attendees based on current phase and zone states
function getPhaseTip(phase, densities, stadiumZones) {
  // Find the least crowded food zone to direct attendees there
  const foodZones = stadiumZones.filter(z => z.type === 'food');
  const leastCrowdedFood = foodZones.reduce((best, z) =>
    (densities[z._id] || 100) < (densities[best?._id] || 100) ? z : best, foodZones[0]);

  const tips = {
    'Half-Time': leastCrowdedFood
      ? `⏸️ Half-Time: ${leastCrowdedFood.name} has shortest queues right now. Head there first!`
      : '⏸️ Half-Time: Avoid main food courts — use side kiosks for faster service.',
    'Pre-Game':  '🚪 Pre-Game tip: Use your designated entry gate to avoid cross-crowd flow.',
    'Full-Time': '🏆 Match over! Use staggered exit — wait 5 min in your seat to avoid peak congestion.',
    'Post-Game': '🚌 Post-Game: Shuttle buses at Gate C & D running every 8 minutes.',
  };
  return tips[phase] || null;
}

// ============================================================
//  ROUTES
// ============================================================
const authRoutes          = require('./routes/auth');
const zoneRoutes          = require('./routes/zones');
const queueRoutes         = require('./routes/queues');
const incidentRoutes      = require('./routes/incidents');
const eventRoutes         = require('./routes/event');
const stadiumRoutes       = require('./routes/stadiums');
const bookingRoutes       = require('./routes/bookings');
const statsRoutes         = require('./routes/stats');
const configRoutes        = require('./routes/config');
const feedbackRoutes      = require('./routes/feedback');
const auditRoutes         = require('./routes/audit');
const alertsRoutes        = require('./routes/alerts');
const gateRoutes          = require('./routes/gates');
const crowdPredictionRoutes = require('./routes/crowd-predictions');

app.use('/api/auth',               authRoutes);
app.use('/api/zones',              zoneRoutes);
app.use('/api/queues',             queueRoutes);
app.use('/api/incidents',          incidentRoutes);
app.use('/api/event',              eventRoutes);
app.use('/api/stadiums',           stadiumRoutes);
app.use('/api/bookings',           bookingRoutes);
app.use('/api/stats',              statsRoutes);
app.use('/api/config',             configRoutes);
app.use('/api/feedback',           feedbackRoutes);
app.use('/api/audit',              auditRoutes);
app.use('/api/alerts',             alertsRoutes);
app.use('/api/gates',              gateRoutes);
app.use('/api/crowd-predictions',  crowdPredictionRoutes);

const path = require('path');
app.use(express.static(path.join(__dirname, '../public')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'VenueIQ Backend',
    version: '2.0.0',
    database: 'MongoDB',
    timestamp: new Date().toISOString(),
    simulation: { tick: simulationTick, interval: parseInt(process.env.SIMULATION_INTERVAL_MS) || 3000 },
    connections: io.engine.clientsCount,
  });
});

// SPA routing: handle all other requests by serving the index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// 404 handler (no longer strictly needed for GET, but good for other methods)
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Error]', err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// ============================================================
//  AUTO-SEED: populate empty database on startup
// ============================================================
async function autoSeed() {
  const bcrypt = require('bcryptjs');
  const stadiumCount = await Stadium.countDocuments();
  if (stadiumCount > 0) {
    console.log('📦 Database already has data — skipping auto-seed.');
    return;
  }

  console.log('🌱 Empty database detected — running auto-seed...');

  const STADIUMS = [
    { _id: 's1', name: 'M. Chinnaswamy Stadium', city: 'Bengaluru', capacity: 40000, type: 'cricket', image: '🏏' },
    { _id: 's2', name: 'Sree Kanteerava Stadium', city: 'Bengaluru', capacity: 25810, type: 'football', image: '⚽' },
    { _id: 's3', name: 'SNR Cricket Stadium', city: 'Mysuru', capacity: 15000, type: 'cricket', image: '🏏' },
    { _id: 's4', name: 'Nehru Stadium', city: 'Hubli', capacity: 15000, type: 'multipurpose', image: '🏟️' }
  ];

  const now = new Date();
  const EVENTS = [
    { _id: 'e1', stadium_id: 's1', name: 'RCB vs CSK - IPL 2026', date: '2026-04-18T19:30:00Z', status: 'upcoming', current_phase: 'Pre-Game', attendees: 38500, open_gates: 6, updated_at: now },
    { _id: 'e2', stadium_id: 's2', name: 'Bengaluru FC vs Mohun Bagan', date: '2026-04-19T20:00:00Z', status: 'upcoming', current_phase: 'Pre-Game', attendees: 21000, open_gates: 4, updated_at: now },
    { _id: 'e3', stadium_id: 's3', name: 'Karnataka vs Mumbai - Ranji', date: '2026-04-20T09:30:00Z', status: 'upcoming', current_phase: 'Pre-Game', attendees: 8000, open_gates: 2, updated_at: now },
    { _id: 'e4', stadium_id: 's4', name: 'KPL Hubli Tigers Match', date: '2026-04-21T18:00:00Z', status: 'upcoming', current_phase: 'Pre-Game', attendees: 12000, open_gates: 3, updated_at: now }
  ];

  await Stadium.insertMany(STADIUMS);
  await Event.insertMany(EVENTS);

  // Zones per stadium
  let allZones = [];
  let allQueues = [];
  let allDensity = [];
  const staffDocs = [];

  STADIUMS.forEach((s, i) => {
    const generic = [
      { _id: `${s._id}-gate-a`, name: 'North Gate A', type: 'gate', capacity_limit: 5000, stadium_id: s._id },
      { _id: `${s._id}-gate-b`, name: 'East Gate B', type: 'gate', capacity_limit: 4500, stadium_id: s._id },
      { _id: `${s._id}-food-1`, name: 'Main Food Court', type: 'food', capacity_limit: 1200, stadium_id: s._id },
      { _id: `${s._id}-restroom-1`, name: 'Restrooms North', type: 'restroom', capacity_limit: 200, stadium_id: s._id },
      { _id: `${s._id}-medical`, name: 'Medical Post A', type: 'medical', capacity_limit: 50, stadium_id: s._id },
      { _id: `${s._id}-field`, name: 'Playing Field', type: 'field', capacity_limit: 500, stadium_id: s._id },
    ];
    if (s._id === 's1') {
      generic.push({ _id: 's1-merch', name: 'RCB Megastore', type: 'merch', capacity_limit: 300, stadium_id: 's1' });
      generic.push({ _id: 's1-vip', name: 'Members Pavilion', type: 'vip', capacity_limit: 800, stadium_id: 's1' });
    }
    allZones.push(...generic);
    allQueues.push(
      { _id: `${s._id}-q1`, stadium_id: s._id, zone_id: `${s._id}-gate-a`, name: 'Express Entry A', type: 'entry', wait_time: 12, is_open: true, total_slots: 200, reserved: 45 },
      { _id: `${s._id}-q2`, stadium_id: s._id, zone_id: `${s._id}-food-1`, name: 'Food Court Pickup', type: 'food', wait_time: 8, is_open: true, total_slots: 100, reserved: 20 }
    );
    generic.forEach(z => {
      allDensity.push({ stadium_id: s._id, zone_id: z._id, density: Math.floor(Math.random() * 40 + 10), recorded_at: now });
    });
    staffDocs.push({ _id: `staff-${i}`, stadium_id: s._id, name: `Ops Lead ${s.city}`, role: 'security_lead', location: `${s._id}-gate-a`, status: 'active', contact: `+91 987654321${i}` });
  });

  await Zone.insertMany(allZones);
  await Queue.insertMany(allQueues);
  await ZoneDensity.insertMany(allDensity);

  const StaffModel = require('./models/Staff');
  await StaffModel.insertMany(staffDocs);

  // Demo users
  const DEMO_HASH = bcrypt.hashSync('demo1234', 10);
  const User = require('./models/User');
  await User.insertMany([
    { name: 'Alex Fan', email: 'attendee@demo.com', password: DEMO_HASH, role: 'attendee', status: 'active' },
    { name: 'Rahul Security', email: 'staff@chinnaswamy.com', password: DEMO_HASH, role: 'staff', stadium_id: 's1', status: 'active' },
    { name: 'Vikram Ops', email: 'staff@kanteerava.com', password: DEMO_HASH, role: 'staff', stadium_id: 's2', status: 'active' },
    { name: 'KSCA Admin', email: 'organizer@chinnaswamy.com', password: DEMO_HASH, role: 'organizer', stadium_id: 's1', status: 'active' },
  ]);

  // Initial incident
  await new Incident({ stadium_id: 's1', type: 'crowd', severity: 'medium', zone_id: 's1-gate-a', message: 'Gate A bottleneck', status: 'pending', created_at: now, reported_by: 'system' }).save();

  console.log('🌱 Auto-seed complete! Demo: attendee@demo.com / demo1234');
}

// ============================================================
//  START SERVER (after DB connect)
// ============================================================
const SIMULATION_INTERVAL = parseInt(process.env.SIMULATION_INTERVAL_MS) || 3000;
let simulationTimer;

connectDB().then(async () => {
  // Auto-seed if the database is empty
  await autoSeed();
  
  // Initialize simulation constants
  await initSimulationConfig();
  await loadSimulationConfig();

  server.listen(PORT, '0.0.0.0', () => {
    console.log('\n╔══════════════════════════════════════╗');
    console.log('║        VenueIQ Backend Server        ║');
    console.log('╠══════════════════════════════════════╣');
    console.log(`║  REST API: http://localhost:${PORT}/api  ║`);
    console.log(`║  Socket.io ready on port ${PORT}         ║`);
    console.log(`║  Database: MongoDB (Mongoose)        ║`);
    console.log(`║  Health:   http://localhost:${PORT}/api/health ║`);
    console.log('╚══════════════════════════════════════╝\n');

    // Start simulation loop AFTER DB is connected
    simulationTimer = setInterval(runCrowdSimulation, SIMULATION_INTERVAL);
    console.log(`⚡ Crowd simulation engine running every ${SIMULATION_INTERVAL}ms`);
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n[Server] Shutting down...');
  clearInterval(simulationTimer);
  const { disconnectDB } = require('./db/database');
  await disconnectDB();
  server.close(() => {
    console.log('[Server] Closed cleanly.');
    process.exit(0);
  });
});

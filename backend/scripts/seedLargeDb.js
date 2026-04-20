/**
 * VenueIQ — Large-Scale Seed Script
 * Generates 10 stadiums, 2000 attendees, 4000+ bookings, and all supporting data.
 *
 * Run with: npm run seed:large
 * (no external faker dependency — uses built-in data arrays for realism)
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const User         = require('../models/User');
const Stadium      = require('../models/Stadium');
const Event        = require('../models/Event');
const Zone         = require('../models/Zone');
const ZoneDensity  = require('../models/ZoneDensity');
const Queue        = require('../models/Queue');
const Reservation  = require('../models/Reservation');
const Incident     = require('../models/Incident');
const Staff        = require('../models/Staff');
const Notification = require('../models/Notification');
const Booking      = require('../models/Booking');

const MONGO_URI    = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/venueiq';
const USER_COUNT   = 2000;
const DEMO_HASH    = bcrypt.hashSync('demo1234', 10);

// ============================================================
// Rich realistic data arrays
// ============================================================

const FIRST_NAMES = [
  'Aarav','Aditya','Akash','Alok','Amit','Anjali','Ankit','Ananya',
  'Arjun','Aryan','Bhavna','Deepak','Deepika','Divya','Farhan','Gaurav',
  'Harini','Hemant','Ishaan','Jaya','Karan','Kavita','Kishore','Kritika',
  'Lavanya','Mahesh','Meera','Mihir','Monica','Naveen','Neha','Nikhil',
  'Nisha','Pallavi','Pooja','Pradeep','Priya','Rahul','Rajan','Ranjit',
  'Rashmi','Rohit','Rohan','Sachin','Sandeep','Sanjay','Sara','Savita',
  'Shikha','Shiv','Shreya','Simran','Sneha','Soham','Sumit','Suresh',
  'Swathi','Tanvi','Tara','Tushar','Uday','Uma','Varun','Veena','Vijay',
  'Vikram','Vinay','Vinita','Vishal','Vivek','Yamini','Yogesh','Zara',
  'Zaid','Saif','Riya','Pavan','Nandini','Lokesh','Keerthi','Jayesh',
  'Indira','Govind','Faisal','Ekta','Dhruv','Chetan','Bharath','Arun'
];

const LAST_NAMES = [
  'Sharma','Verma','Patel','Iyer','Nair','Reddy','Kumar','Singh',
  'Gupta','Mehta','Shah','Joshi','Rao','Thakur','Pillai','Bose',
  'Chopra','Dasgupta','Fernandez','Gaikwad','Hegde','Inamdar','Jain',
  'Kaur','Lal','Malhotra','Naik','Oommen','Pandey','Qureshi','Roy',
  'Saxena','Trivedi','Upadhyay','Vijayakumar','Walia','Xavier','Yadav',
  'Zaveri','Agarwal','Bhatt','Chauhan','Desai','Fernandes','Goel',
  'Hora','Iyengar','Jaswal','Kulkarni','Lokhande','Mistry','Nambiar',
  'Oberoi','Pillai','Rajput','Shenoy','Tyagi','Unnikrishnan','Varghese',
  'Wagle','Yadava','Zala','Acharya','Birla','Contractor','Doshi','Eapen'
];

const CITIES = [
  'Bengaluru','Mumbai','Delhi','Hyderabad','Chennai','Kolkata','Pune',
  'Ahmedabad','Jaipur','Surat','Lucknow','Kanpur','Nagpur','Indore',
  'Bhopal','Visakhapatnam','Pimpri','Patna','Vadodara','Ludhiana'
];

const PHONE_PREFIXES = ['+91 98','+ 91 97','+91 96','+91 95','+91 94','+91 93'];

function randFrom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randFloat(min, max, dp = 1) { return parseFloat((Math.random() * (max - min) + min).toFixed(dp)); }

// Convert stadium name to email-friendly format (lowercase, spaces to underscores)
function stadiumNameToEmail(name) {
  return name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
}

function makeName() { return `${randFrom(FIRST_NAMES)} ${randFrom(LAST_NAMES)}`; }
function makePhone() { return `${randFrom(PHONE_PREFIXES)}${randInt(10000000, 99999999)}`; }

function futureDate(daysMin, daysMax) {
  const d = new Date();
  d.setDate(d.getDate() + randInt(daysMin, daysMax));
  return d;
}

// ============================================================
// 10 Stadiums: 4 existing + 6 new
// ============================================================
const ALL_STADIUMS = [
  // --- Original 4 ---
  { _id: 's1', name: 'M. Chinnaswamy Stadium',     city: 'Bengaluru',       capacity: 40000, type: 'cricket',       image: '🏏' },
  { _id: 's2', name: 'Sree Kanteerava Stadium',    city: 'Bengaluru',       capacity: 25810, type: 'football',      image: '⚽' },
  { _id: 's3', name: 'SNR Cricket Stadium',        city: 'Mysuru',          capacity: 15000, type: 'cricket',       image: '🏏' },
  { _id: 's4', name: 'Nehru Stadium',              city: 'Hubli',           capacity: 15000, type: 'multipurpose',  image: '🏟️' },
  // --- 6 New ---
  { _id: 's5', name: 'Rajiv Gandhi International Stadium', city: 'Hyderabad',  capacity: 55000, type: 'cricket',   image: '🏏' },
  { _id: 's6', name: 'Eden Gardens',               city: 'Kolkata',         capacity: 66000, type: 'cricket',       image: '🏏' },
  { _id: 's7', name: 'Wankhede Stadium',           city: 'Mumbai',          capacity: 33108, type: 'cricket',       image: '🏏' },
  { _id: 's8', name: 'Jawaharlal Nehru Stadium',   city: 'Delhi',           capacity: 75000, type: 'football',      image: '⚽' },
  { _id: 's9', name: 'Maharashtra Cricket Ground', city: 'Pune',            capacity: 37406, type: 'cricket',       image: '🏏' },
  { _id: 's10',name: 'JSCA International Stadium', city: 'Ranchi',          capacity: 39000, type: 'multipurpose',  image: '🏟️' },
];

// ============================================================
// Events per stadium — realistic match schedules
// ============================================================
const EVENT_TEMPLATES = [
  { suffix: 'e1', nameTemplate: (s) => `IPL 2026 — ${s.city} Legends vs RCB`,    phase: 'Pre-Game',    daysAhead: 1  },
  { suffix: 'e2', nameTemplate: (s) => `ISL 2026 — ${s.city} FC Derby`,          phase: 'First Half',  daysAhead: 7  },
  { suffix: 'e3', nameTemplate: (s) => `Ranji Trophy — ${s.city} vs Mumbai`,      phase: 'Pre-Game',    daysAhead: 14 },
  { suffix: 'e4', nameTemplate: (s) => `T20 Blitz — ${s.city} vs Chennai`,        phase: 'Half-Time',   daysAhead: 21 },
  { suffix: 'e5', nameTemplate: (s) => `National Games 2026 — ${s.city} Finals`,  phase: 'Pre-Game',    daysAhead: 30 },
];

// Zone types with realistic names & capacities
const ZONE_TEMPLATES = [
  { type: 'gate',     namePfx: 'Gate',        capMin: 2000, capMax: 6000 },
  { type: 'gate',     namePfx: 'Gate',        capMin: 2000, capMax: 5000 },
  { type: 'gate',     namePfx: 'Entry',       capMin: 1500, capMax: 4000 },
  { type: 'gate',     namePfx: 'VIP Gate',    capMin: 500,  capMax: 1000 },
  { type: 'food',     namePfx: 'Food Court',  capMin: 400,  capMax: 1500 },
  { type: 'food',     namePfx: 'Snack Bar',   capMin: 200,  capMax: 600  },
  { type: 'food',     namePfx: 'Restaurant',  capMin: 150,  capMax: 400  },
  { type: 'food',     namePfx: 'Kiosk',       capMin: 80,   capMax: 200  },
  { type: 'restroom', namePfx: 'Restroom',    capMin: 100,  capMax: 300  },
  { type: 'restroom', namePfx: 'Restroom',    capMin: 100,  capMax: 300  },
  { type: 'restroom', namePfx: 'Restroom',    capMin: 80,   capMax: 200  },
  { type: 'medical',  namePfx: 'Medical Bay', capMin: 20,   capMax: 60   },
  { type: 'medical',  namePfx: 'First Aid',   capMin: 15,   capMax: 30   },
  { type: 'field',    namePfx: 'Playing Field',capMin: 100,  capMax: 200 },
  { type: 'merch',    namePfx: 'Merch Store', capMin: 100,  capMax: 400  },
  { type: 'merch',    namePfx: 'Fan Zone',    capMin: 200,  capMax: 800  },
  { type: 'vip',      namePfx: 'VIP Lounge',  capMin: 200,  capMax: 600  },
  { type: 'vip',      namePfx: 'Club Suite',  capMin: 100,  capMax: 300  },
  { type: 'gate',     namePfx: 'South Gate',  capMin: 1800, capMax: 5000 },
  { type: 'gate',     namePfx: 'North Gate',  capMin: 1800, capMax: 5000 },
  { type: 'food',     namePfx: 'Dine Zone',   capMin: 300,  capMax: 900  },
  { type: 'restroom', namePfx: 'Facilities',  capMin: 100,  capMax: 250  },
  { type: 'merch',    namePfx: 'Souvenir',    capMin: 80,   capMax: 200  },
  { type: 'medical',  namePfx: 'Med Centre',  capMin: 30,   capMax: 80   },
  { type: 'food',     namePfx: 'Cafeteria',   capMin: 250,  capMax: 700  },
  { type: 'gate',     namePfx: 'East Wing',   capMin: 2000, capMax: 5500 },
  { type: 'gate',     namePfx: 'West Wing',   capMin: 2000, capMax: 5500 },
  { type: 'vip',      namePfx: 'Members Box', capMin: 150,  capMax: 500  },
  { type: 'food',     namePfx: 'Bar & Grill', capMin: 180,  capMax: 450  },
  { type: 'merch',    namePfx: 'Team Shop',   capMin: 120,  capMax: 350  },
];

const INCIDENT_TYPES    = ['crowd','equipment','medical','security','fire','weather'];
const INCIDENT_SEVERITY = ['low','medium','high','critical'];
const INCIDENT_MSGS = [
  'Crowd bottleneck forming near main gate.',
  'Equipment failure reported in control room.',
  'Medical emergency — paramedics dispatched.',
  'Suspicious package reported — security responding.',
  'Fan altercation in stand C.',
  'Overcrowding in food court area.',
  'Power outage in east wing.',
  'Queue overflow at entry gate.',
  'Barrier breach near pitch.',
  'Heat exhaustion case — first aid required.',
  'Smoke detected near generator.',
  'Unauthorized access attempt flagged.',
];

const NOTIF_MSGS = [
  '🔴 Critical crowd density detected at Gate A.',
  '⚠️ Food court wait time exceeding 20 minutes.',
  '🟡 Medical unit alerted — section C.',
  '🔵 VIP gate queue forming — dispatch stewards.',
  '⚠️ Restroom facilities at 90% capacity.',
  '🔴 Overcrowding in North Stand area.',
  '🟢 Gates 1–4 cleared for re-entry.',
  '⚡ Power restored to east floodlights.',
  '🔵 Additional stewards deployed to Gate B.',
  '⚠️ Attendee ID check ongoing — minor delay.',
];

// ============================================================
// MAIN SEED FUNCTION
// ============================================================
async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB\n');

  // 1. Clear all
  console.log('🗑️  Clearing existing collections...');
  await Promise.all([
    User.deleteMany({}), Stadium.deleteMany({}), Event.deleteMany({}),
    Zone.deleteMany({}), ZoneDensity.deleteMany({}), Queue.deleteMany({}),
    Reservation.deleteMany({}), Incident.deleteMany({}), Staff.deleteMany({}),
    Notification.deleteMany({}), Booking.deleteMany({}),
  ]);
  console.log('   Done.\n');

  // 2. Stadiums
  await Stadium.insertMany(ALL_STADIUMS);
  console.log(`🏟️  Inserted ${ALL_STADIUMS.length} stadiums`);

  // 3. Events
  const allEvents = [];
  ALL_STADIUMS.forEach(s => {
    EVENT_TEMPLATES.forEach(t => {
      const daysAhead = t.daysAhead;
      allEvents.push({
        _id: `${s._id}-${t.suffix}`,
        stadium_id: s._id,
        name: t.nameTemplate(s),
        date: futureDate(daysAhead, daysAhead + 2),
        status: 'upcoming',
        current_phase: t.phase,
        attendees: randInt(Math.floor(s.capacity * 0.4), Math.floor(s.capacity * 0.95)),
        open_gates: randInt(2, 8),
        updated_at: new Date(),
      });
    });
  });
  await Event.insertMany(allEvents);
  console.log(`📅  Inserted ${allEvents.length} events`);

  // 4. Zones (30 per stadium)
  const allZones = [];
  ALL_STADIUMS.forEach(s => {
    ZONE_TEMPLATES.forEach((zt, i) => {
      allZones.push({
        _id: `${s._id}-z${i + 1}`,
        name: `${zt.namePfx} ${i + 1}`,
        type: zt.type,
        capacity_limit: randInt(zt.capMin, zt.capMax),
        stadium_id: s._id,
      });
    });
  });
  await Zone.insertMany(allZones);
  console.log(`📍  Inserted ${allZones.length} zones`);

  // 5. Initial zone density readings
  const densityReadings = allZones.map(z => ({
    stadium_id: z.stadium_id,
    zone_id: z._id,
    density: randFloat(5, 75),
    recorded_at: new Date(),
  }));
  await ZoneDensity.insertMany(densityReadings);
  console.log(`📊  Inserted ${densityReadings.length} density readings`);

  // 6. Queues (4 per stadium)
  const allQueues = [];
  ALL_STADIUMS.forEach(s => {
    const gateZones = allZones.filter(z => z.stadium_id === s._id && z.type === 'gate');
    const foodZones = allZones.filter(z => z.stadium_id === s._id && z.type === 'food');
    const queueDefs = [
      { zone: gateZones[0], name: 'Main Entry Queue',    type: 'entry' },
      { zone: gateZones[1], name: 'VIP Entry Queue',     type: 'entry' },
      { zone: foodZones[0], name: 'Food Court Queue',    type: 'food'  },
      { zone: foodZones[1], name: 'Snack Bar Queue',     type: 'food'  },
    ];
    queueDefs.forEach((q, i) => {
      if (!q.zone) return;
      const totalSlots = randInt(100, 400);
      allQueues.push({
        _id: `${s._id}-q${i + 1}`,
        stadium_id: s._id,
        zone_id: q.zone._id,
        name: q.name,
        type: q.type,
        wait_time: randInt(3, 25),
        is_open: true,
        total_slots: totalSlots,
        reserved: randInt(0, Math.floor(totalSlots * 0.7)),
      });
    });
  });
  await Queue.insertMany(allQueues);
  console.log(`🕑  Inserted ${allQueues.length} queues`);

  // 7. Staff (multiple per stadium)
  const allStaff = [];
  ALL_STADIUMS.forEach((s, si) => {
    const roles = ['Security Lead','Operations Manager','Gate Supervisor','First Aid Officer','Crowd Steward'];
    roles.forEach((role, ri) => {
      const gateZone = allZones.find(z => z.stadium_id === s._id && z.type === 'gate');
      allStaff.push({
        _id: `staff-${s._id}-${ri + 1}`,
        stadium_id: s._id,
        name: makeName(),
        role: role.toLowerCase().replace(/\s/g, '_'),
        location: gateZone ? gateZone._id : `${s._id}-z1`,
        status: 'active',
        contact: makePhone(),
      });
    });
  });
  await Staff.insertMany(allStaff);
  console.log(`👷  Inserted ${allStaff.length} staff members`);

  // 8. Users — attendees (2000) + staff users + organizers
  const attendeeUsers = [];
  for (let i = 0; i < USER_COUNT; i++) {
    attendeeUsers.push({
      name: makeName(),
      email: `attendee${i}@demo.com`,
      password: DEMO_HASH,
      role: 'attendee',
      status: 'active',
    });
  }

  // Staff user accounts (one per stadium)
  const staffUsers = ALL_STADIUMS.map(s => ({
    name: `${s.city} Staff`,
    email: `staff_${stadiumNameToEmail(s.name)}@gmail.com`,
    password: DEMO_HASH,
    role: 'staff',
    stadium_id: s._id,
    status: 'active',
  }));

  // Organizer accounts (one per stadium) - using British spelling "organiser"
  const organizerUsers = ALL_STADIUMS.map(s => ({
    name: `${s.name} Organizer`,
    email: `organiser_${stadiumNameToEmail(s.name)}@gmail.com`,
    password: DEMO_HASH,
    role: 'organizer',
    stadium_id: s._id,
    status: 'active',
  }));

  // Also keep original demo accounts
  const originalDemoUsers = [
    { name: 'Alex Fan',       email: 'attendee@demo.com',                password: DEMO_HASH, role: 'attendee',  status: 'active' },
    { name: 'Rahul Security', email: 'staff@chinnaswamy.com',             password: DEMO_HASH, role: 'staff',     stadium_id: 's1', status: 'active' },
    { name: 'KSCA Admin',     email: 'organizer@chinnaswamy.com',         password: DEMO_HASH, role: 'organizer', stadium_id: 's1', status: 'active' },
    { name: 'Vikram Ops',     email: 'staff@kanteerava.com',              password: DEMO_HASH, role: 'staff',     stadium_id: 's2', status: 'active' },
  ];

  // Insert in batches to avoid memory issues
  const BATCH = 500;
  for (let i = 0; i < attendeeUsers.length; i += BATCH) {
    await User.insertMany(attendeeUsers.slice(i, i + BATCH));
  }
  await User.insertMany([...staffUsers, ...organizerUsers, ...originalDemoUsers]);
  console.log(`👥  Inserted ${attendeeUsers.length} attendees + ${staffUsers.length} staff + ${organizerUsers.length} organizers + ${originalDemoUsers.length} original demo users`);

  // Fetch inserted attendee user IDs for bookings
  const insertedAttendees = await User.find({ role: 'attendee' }).select('_id email').lean();

  // 9. Bookings — 2 per attendee on average (4000+ total)
  const allBookings = [];
  for (const att of insertedAttendees) {
    const numBookings = randInt(1, 3);
    for (let b = 0; b < numBookings; b++) {
      const ev = randFrom(allEvents);
      allBookings.push({
        _id: uuidv4(),
        user_id: att._id,
        stadium_id: ev.stadium_id,
        event_id: ev._id,
        section: randFrom(['General', 'Premium', 'VIP', 'West Stand', 'East Stand', 'North Stand', 'South Stand']),
        num_tickets: randInt(1, 4),
        booking_date: new Date(Date.now() - randInt(0, 7) * 86400000),
      });
    }
  }

  for (let i = 0; i < allBookings.length; i += BATCH) {
    await Booking.insertMany(allBookings.slice(i, i + BATCH));
  }
  console.log(`🎟️  Inserted ${allBookings.length} bookings`);

  // 10. Reservations
  const allReservations = [];
  for (let i = 0; i < 500; i++) {
    const att = randFrom(insertedAttendees);
    const q   = randFrom(allQueues);
    allReservations.push({
      _id: uuidv4(),
      queue_id: q._id,
      user_id: att._id,
      slot_time: `${randInt(17, 21)}:${randFrom(['00','15','30','45'])}`,
      status: randFrom(['active','active','active','cancelled']),
      created_at: new Date(Date.now() - randInt(0, 3) * 3600000),
    });
  }
  await Reservation.insertMany(allReservations);
  console.log(`🔖  Inserted ${allReservations.length} reservations`);

  // 11. Incidents (3-7 per stadium)
  const allIncidents = [];
  ALL_STADIUMS.forEach(s => {
    const count = randInt(3, 7);
    const sZones = allZones.filter(z => z.stadium_id === s._id);
    for (let i = 0; i < count; i++) {
      const zone = randFrom(sZones);
      allIncidents.push({
        _id: uuidv4(),
        stadium_id: s._id,
        type: randFrom(INCIDENT_TYPES),
        severity: randFrom(INCIDENT_SEVERITY),
        zone_id: zone._id,
        message: randFrom(INCIDENT_MSGS),
        status: randFrom(['pending','pending','active','resolved']),
        reported_by: randFrom(['system','staff','attendee']),
        assigned_to: null,
        created_at: new Date(Date.now() - randInt(0, 12) * 3600000),
      });
    }
  });
  await Incident.insertMany(allIncidents);
  console.log(`⚠️  Inserted ${allIncidents.length} incidents`);

  // 12. Notifications
  const allNotifications = [];
  ALL_STADIUMS.forEach(s => {
    const count = randInt(5, 10);
    for (let i = 0; i < count; i++) {
      allNotifications.push({
        _id: uuidv4(),
        stadium_id: s._id,
        type: randFrom(['info','warning','alert','success']),
        message: randFrom(NOTIF_MSGS),
        target_role: randFrom(['staff','staff','organizer',null]),
        read: Math.random() > 0.5,
        created_at: new Date(Date.now() - randInt(0, 24) * 3600000),
      });
    }
  });
  await Notification.insertMany(allNotifications);
  console.log(`🔔  Inserted ${allNotifications.length} notifications`);

  // ============================================================
  // Summary
  // ============================================================
  console.log('\n╔══════════════════════════════════════════════╗');
  console.log('║    🎉 Large-Scale Seed Complete!             ║');
  console.log('╠══════════════════════════════════════════════╣');
  console.log(`║  Stadiums:      ${String(ALL_STADIUMS.length).padEnd(28)}║`);
  console.log(`║  Events:        ${String(allEvents.length).padEnd(28)}║`);
  console.log(`║  Zones:         ${String(allZones.length).padEnd(28)}║`);
  console.log(`║  Users:         ${String(USER_COUNT + staffUsers.length + organizerUsers.length + 4).padEnd(28)}║`);
  console.log(`║  Bookings:      ${String(allBookings.length).padEnd(28)}║`);
  console.log(`║  Queues:        ${String(allQueues.length).padEnd(28)}║`);
  console.log(`║  Reservations:  ${String(allReservations.length).padEnd(28)}║`);
  console.log(`║  Incidents:     ${String(allIncidents.length).padEnd(28)}║`);
  console.log(`║  Notifications: ${String(allNotifications.length).padEnd(28)}║`);
  console.log('╠══════════════════════════════════════════════╣');
  console.log('║  Demo Accounts:                              ║');
  console.log('║  attendee@demo.com        / demo1234         ║');
  console.log('║  attendee0@demo.com       / demo1234         ║');
  console.log('║  ─────────────────────────────────────────  ║');
  console.log('║  Staff Accounts (per stadium):               ║');
  console.log('║  staff_m_chinnaswamy_stadium@gmail.com       ║');
  console.log('║  staff_wankhede_stadium@gmail.com            ║');
  console.log('║  staff_eden_gardens@gmail.com                ║');
  console.log('║  ─────────────────────────────────────────  ║');
  console.log('║  Organiser Accounts (per stadium):           ║');
  console.log('║  organiser_m_chinnaswamy_stadium@gmail.com   ║');
  console.log('║  organiser_wankhede_stadium@gmail.com        ║');
  console.log('║  organiser_eden_gardens@gmail.com            ║');
  console.log('║  (All with password: demo1234)               ║');
  console.log('╚══════════════════════════════════════════════╝\n');

  await mongoose.connection.close();
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});

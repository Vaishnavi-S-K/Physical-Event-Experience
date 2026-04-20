/**
 * VenueIQ MongoDB Seed Script
 *
 * Usage: npm run db:seed
 *
 * This script connects to MongoDB and populates
 * it with the Karnataka multi-stadium demo data.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// Models
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

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/venueiq';

// Helper function to convert stadium name to email-friendly format
function stadiumNameToEmail(name) {
  return name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
}

// ============================================================
//  Seed Data
// ============================================================

const STADIUMS = [
  { _id: 's1', name: 'M. Chinnaswamy Stadium', city: 'Bengaluru', capacity: 40000, type: 'cricket', image: '🏏' },
  { _id: 's2', name: 'Sree Kanteerava Stadium', city: 'Bengaluru', capacity: 25810, type: 'football', image: '⚽' },
  { _id: 's3', name: 'SNR Cricket Stadium', city: 'Mysuru', capacity: 15000, type: 'cricket', image: '🏏' },
  { _id: 's4', name: 'Nehru Stadium', city: 'Hubli', capacity: 15000, type: 'multipurpose', image: '🏟️' }
];

const EVENTS = [
  { _id: 'e1', stadium_id: 's1', name: 'RCB vs CSK - IPL 2026', date: '2026-04-18T19:30:00Z', status: 'upcoming', current_phase: 'Pre-Game', attendees: 38500, open_gates: 6 },
  { _id: 'e2', stadium_id: 's2', name: 'Bengaluru FC vs Mohun Bagan', date: '2026-04-19T20:00:00Z', status: 'upcoming', current_phase: 'Pre-Game', attendees: 21000, open_gates: 4 },
  { _id: 'e3', stadium_id: 's3', name: 'Karnataka vs Mumbai - Ranji', date: '2026-04-20T09:30:00Z', status: 'upcoming', current_phase: 'Pre-Game', attendees: 8000, open_gates: 2 },
  { _id: 'e4', stadium_id: 's4', name: 'KPL Hubli Tigers Match', date: '2026-04-21T18:00:00Z', status: 'upcoming', current_phase: 'Pre-Game', attendees: 12000, open_gates: 3 }
];

function generateZonesForStadium(stadiumId) {
  const generic = [
    { _id: `${stadiumId}-gate-a`, name: 'North Gate A', type: 'gate', capacity_limit: 5000 },
    { _id: `${stadiumId}-gate-b`, name: 'East Gate B', type: 'gate', capacity_limit: 4500 },
    { _id: `${stadiumId}-food-1`, name: 'Main Food Court', type: 'food', capacity_limit: 1200 },
    { _id: `${stadiumId}-restroom-1`, name: 'Restrooms North', type: 'restroom', capacity_limit: 200 },
    { _id: `${stadiumId}-medical`, name: 'Medical Post A', type: 'medical', capacity_limit: 50 },
    { _id: `${stadiumId}-field`, name: 'Playing Field', type: 'field', capacity_limit: 500 }
  ];
  if (stadiumId === 's1') {
    generic.push({ _id: 's1-merch', name: 'RCB Megastore', type: 'merch', capacity_limit: 300 });
    generic.push({ _id: 's1-vip', name: 'Members Pavilion', type: 'vip', capacity_limit: 800 });
  }
  return generic.map(z => ({ ...z, stadium_id: stadiumId }));
}

function generateQueuesForStadium(stadiumId) {
  return [
    { _id: `${stadiumId}-q1`, stadium_id: stadiumId, zone_id: `${stadiumId}-gate-a`, name: 'Express Entry A', type: 'entry', wait_time: 12, is_open: true, total_slots: 200, reserved: 45 },
    { _id: `${stadiumId}-q2`, stadium_id: stadiumId, zone_id: `${stadiumId}-food-1`, name: 'Food Court Pickup', type: 'food', wait_time: 8, is_open: true, total_slots: 100, reserved: 20 }
  ];
}

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB for seeding...');

    // Drop existing data
    console.log('🗑️  Clearing existing collections...');
    await Promise.all([
      User.deleteMany({}),
      Stadium.deleteMany({}),
      Event.deleteMany({}),
      Zone.deleteMany({}),
      ZoneDensity.deleteMany({}),
      Queue.deleteMany({}),
      Reservation.deleteMany({}),
      Incident.deleteMany({}),
      Staff.deleteMany({}),
      Notification.deleteMany({}),
      Booking.deleteMany({}),
    ]);

    // Insert stadiums & events
    await Stadium.insertMany(STADIUMS);
    console.log(`  ✅ ${STADIUMS.length} stadiums inserted`);

    await Event.insertMany(EVENTS);
    console.log(`  ✅ ${EVENTS.length} events inserted`);

    // Insert zones, queues, density readings
    let allZones = [];
    let allQueues = [];
    let allDensity = [];

    STADIUMS.forEach(s => {
      const sz = generateZonesForStadium(s._id);
      const sq = generateQueuesForStadium(s._id);
      allZones = [...allZones, ...sz];
      allQueues = [...allQueues, ...sq];

      sz.forEach(z => {
        allDensity.push({
          stadium_id: s._id,
          zone_id: z._id,
          density: Math.floor(Math.random() * 40 + 10),
          recorded_at: new Date()
        });
      });
    });

    await Zone.insertMany(allZones);
    console.log(`  ✅ ${allZones.length} zones inserted`);

    await Queue.insertMany(allQueues);
    console.log(`  ✅ ${allQueues.length} queues inserted`);

    await ZoneDensity.insertMany(allDensity);
    console.log(`  ✅ ${allDensity.length} initial density readings inserted`);

    // Staff
    const staffDocs = STADIUMS.map((s, i) => ({
      _id: `staff-${i}`,
      stadium_id: s._id,
      name: `Ops Lead ${s.city}`,
      role: 'security_lead',
      location: `${s._id}-gate-a`,
      status: 'active',
      contact: `+91 987654321${i}`
    }));
    await Staff.insertMany(staffDocs);
    console.log(`  ✅ ${staffDocs.length} staff inserted`);

    // Users
    const DEMO_HASH = bcrypt.hashSync('demo1234', 10);
    
    // Create staff and organizer accounts for each stadium
    const staffAndOrgAccounts = STADIUMS.flatMap(s => [
      { 
        name: `${s.city} Staff`, 
        email: `staff_${stadiumNameToEmail(s.name)}@gmail.com`, 
        password: DEMO_HASH, 
        role: 'staff', 
        stadium_id: s._id, 
        status: 'active' 
      },
      { 
        name: `${s.name} Organiser`, 
        email: `organiser_${stadiumNameToEmail(s.name)}@gmail.com`, 
        password: DEMO_HASH, 
        role: 'organizer', 
        stadium_id: s._id, 
        status: 'active' 
      }
    ]);
    
    // Generic attendee account
    const users = [
      { name: 'Alex Fan', email: 'attendee@demo.com', password: DEMO_HASH, role: 'attendee', status: 'active' },
      ...staffAndOrgAccounts
    ];
    await User.insertMany(users);
    console.log(`  ✅ ${users.length} users inserted`);

    // Initial incident
    const incident = new Incident({
      stadium_id: 's1',
      type: 'crowd',
      severity: 'medium',
      zone_id: 's1-gate-a',
      message: 'Gate A bottleneck',
      status: 'pending',
      created_at: new Date(),
      reported_by: 'system'
    });
    await incident.save();
    console.log('  ✅ 1 initial incident inserted');

    console.log('\n🌱 Seeded Karnataka Multi-Stadium Database!');
    console.log('Demo Accounts:');
    console.log('  Attendee:  attendee@demo.com / demo1234');
    console.log('  ─────────────────────────────────────────');
    console.log('  Staff (per stadium):');
    console.log('    staff_m_chinnaswamy_stadium@gmail.com / demo1234');
    console.log('    staff_sree_kanteerava_stadium@gmail.com / demo1234');
    console.log('  ─────────────────────────────────────────');
    console.log('  Organiser (per stadium):');
    console.log('    organiser_m_chinnaswamy_stadium@gmail.com / demo1234');
    console.log('    organiser_sree_kanteerava_stadium@gmail.com / demo1234\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed Error:', err);
    process.exit(1);
  }
}

seed();

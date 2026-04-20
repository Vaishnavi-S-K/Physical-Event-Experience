/**
 * ============================================================
 *  LARGE-SCALE DATABASE SEEDING
 *  Populates database with:
 *  - 10 Indian stadiums (with real coordinates)
 *  - 50 events (5 per stadium)
 *  - 300 zones (30 per stadium - gates, food, medical, merch, VIP)
 *  - 2,000 attendees
 *  - ~6,000 bookings (randomized 1-3 per attendee)
 *  - 40 queues
 *  - 500 reservations
 *  - Gate scans & crowd predictions for real-time simulation
 * ============================================================
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// Models
const Stadium = require('../models/Stadium');
const Event = require('../models/Event');
const Zone = require('../models/Zone');
const User = require('../models/User');
const Booking = require('../models/Booking');
const Queue = require('../models/Queue');
const Reservation = require('../models/Reservation');
const Staff = require('../models/Staff');
const GateScan = require('../models/GateScan');
const StadiumGeometry = require('../models/StadiumGeometry');

// ============================================================
//  REAL STADIUM DATA (10 Indian stadiums with coordinates)
// ============================================================

const STADIUMS_DATA = [
  {
    name: 'M. A. Chinnaswamy Stadium',
    city: 'Bengaluru',
    country: 'India',
    coordinates: { latitude: 13.197, longitude: 77.6016 },
    capacity: 40000,
    type: 'cricket'
  },
  {
    name: 'Sree Kanteerava Stadium',
    city: 'Bengaluru',
    country: 'India',
    coordinates: { latitude: 13.1939, longitude: 77.5707 },
    capacity: 25810,
    type: 'football'
  },
  {
    name: 'Wankhede Stadium',
    city: 'Mumbai',
    country: 'India',
    coordinates: { latitude: 19.0176, longitude: 72.8263 },
    capacity: 33108,
    type: 'cricket'
  },
  {
    name: 'Eden Gardens',
    city: 'Kolkata',
    country: 'India',
    coordinates: { latitude: 22.5645, longitude: 88.3639 },
    capacity: 68000,
    type: 'cricket'
  },
  {
    name: 'Arun Jaitley Stadium (formerly Delhi)',
    city: 'Delhi',
    country: 'India',
    coordinates: { latitude: 28.5921, longitude: 77.2507 },
    capacity: 41820,
    type: 'cricket'
  },
  {
    name: 'Rajiv Gandhi International Cricket Stadium',
    city: 'Hyderabad',
    country: 'India',
    coordinates: { latitude: 17.371, longitude: 78.4789 },
    capacity: 39075,
    type: 'cricket'
  },
  {
    name: 'Maharashtra Cricket Association Stadium',
    city: 'Pune',
    country: 'India',
    coordinates: { latitude: 18.8149, longitude: 73.9336 },
    capacity: 35000,
    type: 'cricket'
  },
  {
    name: 'JSCA International Stadium',
    city: 'Ranchi',
    country: 'India',
    coordinates: { latitude: 23.3645, longitude: 85.3273 },
    capacity: 49162,
    type: 'cricket'
  },
  {
    name: 'Narendra Modi Stadium',
    city: 'Ahmedabad',
    country: 'India',
    coordinates: { latitude: 23.0822, longitude: 72.533 },
    capacity: 132000,
    type: 'cricket'
  },
  {
    name: 'Safdarjung Stadium',
    city: 'Delhi',
    country: 'India',
    coordinates: { latitude: 28.5682, longitude: 77.2105 },
    capacity: 30000,
    type: 'football'
  }
];

// Event templates
const EVENT_TEMPLATES = [
  { name: 'IPL T20 Cricket Match', type: 'cricket' },
  { name: 'ISL Football Match', type: 'football' },
  { name: 'Test Cricket Match (Day 1)', type: 'cricket' },
  { name: 'National Cricket Championship', type: 'cricket' },
  { name: 'Football Friendly Match', type: 'football' }
];

// Zone types and their typical capacities
const ZONE_TYPES = [
  { type: 'gate', capacity: 5000, count: 4 },
  { type: 'food', capacity: 1200, count: 3 },
  { type: 'restroom', capacity: 800, count: 2 },
  { type: 'medical', capacity: 200, count: 1 },
  { type: 'merch', capacity: 600, count: 2 },
  { type: 'vip', capacity: 2000, count: 2 },
  { type: 'parking', capacity: 10000, count: 1 },
  { type: 'security', capacity: 500, count: 1 },
  { type: 'information', capacity: 300, count: 1 },
  { type: 'field', capacity: 50000, count: 1 }
];

// ============================================================
//  HELPER FUNCTIONS
// ============================================================

async function connectToDb() {
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/venueiq';
  console.log(`📦 Connecting to MongoDB: ${MONGO_URI}`);

  await mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  console.log('✅ Connected to MongoDB');
}

async function clearDb() {
  console.log('🧹 Clearing database collections...');
  await Stadium.deleteMany({});
  await Event.deleteMany({});
  await Zone.deleteMany({});
  await User.deleteMany({});
  await Booking.deleteMany({});
  await Queue.deleteMany({});
  await Reservation.deleteMany({});
  await Staff.deleteMany({});
  await GateScan.deleteMany({});
  await StadiumGeometry.deleteMany({});
  console.log('✅ Database cleared');
}

function generateStadiumId(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 10);
}

function generateEventName(stadium, template, index) {
  const month = (index % 12) + 1;
  const day = (index % 28) + 1;
  return `${template.name} - ${stadium.name} (2026)`;
}

function generateEventDate(index) {
  const month = (index % 12) + 1;
  const day = (index % 28) + 1;
  const hour = 14 + (index % 8); // 14:00 - 22:00
  return new Date(2026, month - 1, day, hour, 0, 0);
}

function generateZones(stadiumId, stadiumName, capacity) {
  const zones = [];
  let zoneIndex = 0;

  ZONE_TYPES.forEach((zt) => {
    for (let i = 0; i < zt.count; i++) {
      const zoneName = `${zt.type.charAt(0).toUpperCase() + zt.type.slice(1)} ${i + 1}`;
      zones.push({
        _id: `${stadiumId}-${zt.type}-${i}`,
        name: zoneName,
        type: zt.type,
        capacity_limit: Math.round(zt.capacity * (0.8 + Math.random() * 0.4)),
        stadium_id: stadiumId
      });
      zoneIndex++;
    }
  });

  return zones;
}

function generateStadiumGeometry(stadiumData, zones) {
  // Use the _id from stadiumData directly
  const stadiumId = stadiumData._id;
  
  // Create gates with realistic coordinates within stadium
  const gates = zones
    .filter((z) => z.type === 'gate')
    .map((z, i) => ({
      gate_id: z._id,
      gate_name: z.name,
      gate_type: ['main', 'side', 'vip', 'emergency'][i % 4],
      coordinates: {
        latitude: stadiumData.coordinates.latitude + (Math.random() - 0.5) * 0.005,
        longitude: stadiumData.coordinates.longitude + (Math.random() - 0.5) * 0.005
      },
      capacity_per_hour: 1000 + Math.random() * 500,
      typical_queue_time_minutes: 5 + Math.random() * 15
    }));

  // Create zone geometry with coordinates
  const zoneGeometry = zones.map((z) => ({
    zone_id: z._id,
    zone_name: z.name,
    zone_type: z.type,
    coordinates: {
      latitude: stadiumData.coordinates.latitude + (Math.random() - 0.5) * 0.01,
      longitude: stadiumData.coordinates.longitude + (Math.random() - 0.5) * 0.01
    },
    capacity: z.capacity_limit,
    area_sq_meters: z.capacity_limit * 2.5
  }));

  // Calculate gate-to-zone distances
  const gateToZoneDistances = [];
  gates.forEach((gate) => {
    zoneGeometry
      .filter((z) => z.zone_type !== 'gate')
      .forEach((zone) => {
        const distance = Math.random() * 1000 + 50; // 50-1050 meters
        const walkTime = Math.ceil(distance / 1.4); // 1.4 m/s walking speed
        gateToZoneDistances.push({
          gate_id: gate.gate_id,
          zone_id: zone.zone_id,
          distance_meters: Math.round(distance),
          walk_time_minutes: Math.ceil(walkTime / 60),
          popularity_factor: 0.8 + Math.random() * 0.4
        });
      });
  });

  return {
    stadium_id: stadiumId,
    stadium_name: stadiumData.name,
    location: {
      coordinates: stadiumData.coordinates,
      address: `${stadiumData.city}, ${stadiumData.country}`,
      city: stadiumData.city
    },
    gates,
    zones: zoneGeometry,
    gate_to_zone_distances: gateToZoneDistances,
    metadata: {
      source: 'real_stadium_data',
      last_verified: new Date(),
      total_capacity: stadiumData.capacity
    }
  };
}

function generateUsers(count) {
  const users = [];
  const roles = ['attendee', 'staff', 'organizer'];

  for (let i = 0; i < count; i++) {
    const role = i < count * 0.8 ? 'attendee' : i < count * 0.95 ? 'staff' : 'organizer';
    const email = `user${i}@example.com`;
    const passwordHash = bcrypt.hashSync('password123', 10);

    users.push({
      _id: `u${i}`,
      email,
      password: passwordHash,
      name: `User ${i}`,
      role,
      phone: `+91${9000000000 + i}`,
      verified: true,
      created_at: new Date()
    });
  }

  return users;
}

function generateBookings(users, stadiums, eventsPerStadium) {
  const bookings = [];
  const bookingsPerUser = 2 + Math.floor(Math.random() * 2); // 2-3 bookings per user

  for (const user of users) {
    for (let b = 0; b < bookingsPerUser; b++) {
      const randomStadium = stadiums[Math.floor(Math.random() * stadiums.length)];
      const eventIndex = Math.floor(Math.random() * eventsPerStadium);
      const eventId = `e-${randomStadium._id}-${eventIndex}`;

      bookings.push({
        _id: `booking-${bookings.length}`,
        user_id: user._id,
        stadium_id: randomStadium._id,
        event_id: eventId,
        num_tickets: 1 + Math.floor(Math.random() * 3),
        section: ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)],
        seat_numbers: [],
        entryTimestamp: new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000), // Random time in last 10 days
        status: 'confirmed',
        price: 500 + Math.random() * 2000,
        created_at: new Date()
      });
    }
  }

  return bookings;
}

function generateQueues(stadiums) {
  const queues = [];

  stadiums.forEach((stadium) => {
    const queueCount = 4; // 4 queues per stadium
    for (let i = 0; i < queueCount; i++) {
      queues.push({
        _id: `q-${stadium._id}-${i}`,
        stadium_id: stadium._id,
        zone_id: `${stadium._id}-food-${i}`,
        name: `Food Queue ${i + 1}`,
        reserved: Math.floor(Math.random() * 20),
        total_slots: 50,
        wait_time: 5 + Math.floor(Math.random() * 40),
        created_at: new Date()
      });
    }
  });

  return queues;
}

function generateReservations(users, queues) {
  const reservations = [];
  const reservationsCount = Math.min(500, users.length * 0.25);

  for (let i = 0; i < reservationsCount; i++) {
    const user = users[Math.floor(Math.random() * users.length)];
    const queue = queues[Math.floor(Math.random() * queues.length)];

    reservations.push({
      _id: `r-${i}`,
      queue_id: queue._id,
      user_id: user._id,
      slot_time: new Date(Date.now() + Math.random() * 60 * 60 * 1000),
      status: ['pending', 'confirmed', 'completed'][Math.floor(Math.random() * 3)],
      created_at: new Date()
    });
  }

  return reservations;
}

function generateGateScans(stadiums, events, count = 500) {
  const scans = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const stadium = stadiums[Math.floor(Math.random() * stadiums.length)];
    const event = events.find((e) => e.stadium_id === stadium._id);
    const gateIndex = Math.floor(Math.random() * 4); // 4 gates per stadium

    scans.push({
      stadium_id: stadium._id,
      event_id: event._id,
      gate_id: `${stadium._id}-gate-${gateIndex}`,
      user_id: `u${Math.floor(Math.random() * 2000)}`,
      entry_timestamp: new Date(now.getTime() - Math.random() * 60 * 60 * 1000), // Last hour
      entry_count: 1 + Math.floor(Math.random() * 3), // Family groups 1-3
      entry_direction: 'entry',
      metadata: {
        device_type: ['mobile', 'kiosk'][Math.floor(Math.random() * 2)],
        scanner_id: `scanner-${gateIndex}`
      }
    });
  }

  return scans;
}

// ============================================================
//  MAIN SEEDING FUNCTION
// ============================================================

async function seedLargeDb() {
  try {
    await connectToDb();
    await clearDb();

    console.log('🚀 Starting large-scale database seeding...\n');

    // 1. CREATE STADIUMS
    console.log('📍 Creating 10 stadiums...');
    const stadiumDocs = STADIUMS_DATA.map((s) => ({
      _id: generateStadiumId(s.name),
      ...s,
      image: '🏟️',
      created_at: new Date()
    }));
    const stadiums = await Stadium.insertMany(stadiumDocs);
    console.log(`✅ Created ${stadiums.length} stadiums\n`);

    // 2. CREATE ZONES & STADIUM GEOMETRIES
    console.log('🗺️ Creating 300 zones (30 per stadium) and stadium geometries...');
    let totalZones = 0;
    const allZones = [];
    const geometries = [];

    for (let i = 0; i < stadiums.length; i++) {
      const stadium = stadiums[i];
      const stadiumData = stadiumDocs[i]; // Original data with coordinates
      const zones = generateZones(stadium._id, stadium.name, stadium.capacity);
      allZones.push(...zones);
      totalZones += zones.length;

      // Create stadium geometry using original data
      const geometry = generateStadiumGeometry(stadiumData, zones);
      geometries.push(geometry);
    }

    await Zone.insertMany(allZones);
    await StadiumGeometry.insertMany(geometries);
    console.log(`✅ Created ${totalZones} zones and ${geometries.length} stadium geometries\n`);

    // 3. CREATE EVENTS (5 per stadium = 50 events)
    console.log('📅 Creating 50 events (5 per stadium)...');
    const events = [];
    let eventIndex = 0;

    for (const stadium of stadiums) {
      for (let i = 0; i < 5; i++) {
        const template = EVENT_TEMPLATES[i % EVENT_TEMPLATES.length];
        events.push({
          _id: `e-${stadium._id}-${i}`,
          stadium_id: stadium._id,
          name: generateEventName(stadium, template, eventIndex),
          date: generateEventDate(eventIndex),
          status: 'upcoming',
          current_phase: 'Pre-Game',
          attendees: Math.floor(stadium.capacity * (0.4 + Math.random() * 0.5)),
          open_gates: 3 + Math.floor(Math.random() * 2),
          created_at: new Date(),
          updated_at: new Date()
        });
        eventIndex++;
      }
    }

    await Event.insertMany(events);
    console.log(`✅ Created ${events.length} events\n`);

    // 4. CREATE USERS (2,000 attendees)
    console.log('👥 Creating 2,000 users...');
    const users = generateUsers(2000);
    await User.insertMany(users);
    console.log(`✅ Created ${users.length} users\n`);

    // 5. CREATE BOOKINGS (4,000-6,000)
    console.log('🎫 Creating 4,000-6,000 bookings...');
    const bookings = generateBookings(users, stadiums, 5);
    await Booking.insertMany(bookings);
    console.log(`✅ Created ${bookings.length} bookings\n`);

    // 6. CREATE QUEUES (40 total = 4 per stadium)
    console.log('🔲 Creating 40 queues (4 per stadium)...');
    const queues = generateQueues(stadiums);
    await Queue.insertMany(queues);
    console.log(`✅ Created ${queues.length} queues\n`);

    // 7. CREATE RESERVATIONS (500)
    console.log('📝 Creating 500 queue reservations...');
    const reservations = generateReservations(users, queues);
    await Reservation.insertMany(reservations);
    console.log(`✅ Created ${reservations.length} reservations\n`);

    // 8. CREATE STAFF (60 = 5 per stadium + 10 organizers)
    console.log('👨‍💼 Creating 60 staff members...');
    const staffMembers = [];
    let staffIndex = 0;

    for (const stadium of stadiums) {
      for (let i = 0; i < 5; i++) {
        staffMembers.push({
          _id: `staff-${stadium._id}-${i}`,
          user_id: `u${2000 + staffIndex}`,
          stadium_id: stadium._id,
          name: `Staff Member ${i + 1}`,
          role: ['steward', 'medic', 'security'][i % 3],
          zone_id: `${stadium._id}-gate-${i % 4}`,
          location: { latitude: 0, longitude: 0 },
          status: 'active',
          created_at: new Date()
        });
        staffIndex++;
      }
    }

    // Add 10 organizers
    for (let i = 0; i < 10; i++) {
      staffMembers.push({
        _id: `staff-organizer-${i}`,
        user_id: `u${2000 + staffIndex}`,
        stadium_id: stadiums[i % stadiums.length]._id,
        name: `Organizer ${i + 1}`,
        role: 'organizer',
        status: 'active',
        created_at: new Date()
      });
      staffIndex++;
    }

    await Staff.insertMany(staffMembers);
    console.log(`✅ Created ${staffMembers.length} staff members\n`);

    // 9. CREATE GATE SCANS (simulate real-time entry)
    console.log('🚪 Creating gate scans (simulating real-time entry)...');
    const gateScans = generateGateScans(stadiums, events, 500);
    await GateScan.insertMany(gateScans);
    console.log(`✅ Created ${gateScans.length} gate scans\n`);

    // SUMMARY
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ LARGE-SCALE DATABASE SEEDING COMPLETED!\n');
    console.log('📊 Summary:');
    console.log(`   ✓ Stadiums:      ${stadiums.length}`);
    console.log(`   ✓ Events:        ${events.length}`);
    console.log(`   ✓ Zones:         ${allZones.length}`);
    console.log(`   ✓ Users:         ${users.length}`);
    console.log(`   ✓ Bookings:      ${bookings.length}`);
    console.log(`   ✓ Queues:        ${queues.length}`);
    console.log(`   ✓ Reservations:  ${reservations.length}`);
    console.log(`   ✓ Staff:         ${staffMembers.length}`);
    console.log(`   ✓ Gate Scans:    ${gateScans.length}`);
    console.log('═══════════════════════════════════════════════════════════════\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run seeding
seedLargeDb();

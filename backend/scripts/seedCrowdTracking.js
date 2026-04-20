/**
 * ============================================================
 *  QUICK REAL-TIME CROWD TRACKING SEED
 *  Adds GateScan and StadiumGeometry data to existing database
 *  Run after seedLargeDb.js
 * ============================================================
 */

require('dotenv').config();
const mongoose = require('mongoose');

const Stadium = require('../models/Stadium');
const Event = require('../models/Event');
const Zone = require('../models/Zone');
const GateScan = require('../models/GateScan');
const StadiumGeometry = require('../models/StadiumGeometry');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/venueiq';

async function connectToDb() {
  console.log(`📦 Connecting to MongoDB...`);
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected\n');
}

async function addCrowdTrackingData() {
  try {
    await connectToDb();

    // Get existing stadiums and events
    const stadiums = await Stadium.find().lean();
    const events = await Event.find().lean();
    const zones = await Zone.find().lean();

    console.log(`Found ${stadiums.length} stadiums, ${events.length} events, ${zones.length} zones\n`);

    // Clear existing gate scans and geometries
    await GateScan.deleteMany({});
    await StadiumGeometry.deleteMany({});

    // 1. CREATE STADIUM GEOMETRIES
    console.log('🗺️ Creating stadium geometries...');
    const geometries = [];

    for (const stadium of stadiums) {
      const stadiumZones = zones.filter((z) => z.stadium_id === stadium._id);
      const gatesZones = stadiumZones.filter((z) => z.type === 'gate');
      const otherZones = stadiumZones.filter((z) => z.type !== 'gate');

      const gates = gatesZones.map((z, i) => ({
        gate_id: z._id,
        gate_name: z.name,
        gate_type: ['main', 'side', 'vip', 'emergency'][i % 4],
        coordinates: {
          latitude: 28.6 + Math.random() * 0.1 - 0.05,
          longitude: 77.2 + Math.random() * 0.1 - 0.05
        },
        capacity_per_hour: 1000 + Math.random() * 500,
        typical_queue_time_minutes: 5 + Math.random() * 15
      }));

      const zoneGeometry = stadiumZones.map((z) => ({
        zone_id: z._id,
        zone_name: z.name,
        zone_type: z.type,
        coordinates: {
          latitude: 28.6 + Math.random() * 0.15 - 0.075,
          longitude: 77.2 + Math.random() * 0.15 - 0.075
        },
        capacity: z.capacity_limit,
        area_sq_meters: z.capacity_limit * 2.5
      }));

      const gateToZoneDistances = [];
      gates.forEach((gate) => {
        otherZones.forEach((zone) => {
          const distance = Math.random() * 1000 + 50;
          gateToZoneDistances.push({
            gate_id: gate.gate_id,
            zone_id: zone._id,
            distance_meters: Math.round(distance),
            walk_time_minutes: Math.ceil(distance / 1.4 / 60),
            popularity_factor: 0.8 + Math.random() * 0.4
          });
        });
      });

      geometries.push({
        stadium_id: stadium._id,
        stadium_name: stadium.name,
        location: {
          coordinates: { latitude: 28.6, longitude: 77.2 },
          address: `${stadium.city}, India`,
          city: stadium.city
        },
        gates,
        zones: zoneGeometry,
        gate_to_zone_distances: gateToZoneDistances,
        metadata: {
          source: 'real_stadium_data',
          last_verified: new Date(),
          total_capacity: stadium.capacity
        }
      });
    }

    await StadiumGeometry.insertMany(geometries);
    console.log(`✅ Created ${geometries.length} stadium geometries\n`);

    // 2. CREATE GATE SCANS (simulating real entry)
    console.log('🚪 Creating gate scans (real-time entry simulation)...');
    const gateScans = [];
    const now = new Date();

    for (const event of events) {
      const eventZones = zones.filter((z) => z.stadium_id === event.stadium_id);
      const gates = eventZones.filter((z) => z.type === 'gate');

      // Simulate 100 gate scans per event
      for (let i = 0; i < 100; i++) {
        const gate = gates[Math.floor(Math.random() * gates.length)];
        if (!gate) continue;

        gateScans.push({
          stadium_id: event.stadium_id,
          event_id: event._id,
          gate_id: gate._id,
          user_id: `u${Math.floor(Math.random() * 2000)}`,
          entry_timestamp: new Date(now.getTime() - Math.random() * 60 * 60 * 1000),
          entry_count: 1 + Math.floor(Math.random() * 3),
          entry_direction: 'entry',
          metadata: {
            device_type: ['mobile', 'kiosk'][Math.floor(Math.random() * 2)],
            scanner_id: `scanner-${gate._id}`
          }
        });
      }
    }

    await GateScan.insertMany(gateScans);
    console.log(`✅ Created ${gateScans.length} gate scans\n`);

    // SUMMARY
    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ REAL-TIME CROWD TRACKING DATA ADDED!\n');
    console.log('📊 Summary:');
    console.log(`   ✓ Stadium Geometries:  ${geometries.length}`);
    console.log(`   ✓ Gate Scans:          ${gateScans.length}`);
    console.log('═══════════════════════════════════════════════════════\n');

    console.log('🚀 Next steps:');
    console.log('   1. Start backend:  npm run dev');
    console.log('   2. Open frontend:  npm run dev (in root dir)');
    console.log('   3. Test gate scanning: POST /api/gates/scan');
    console.log('   4. Check predictions: GET /api/crowd-predictions/latest');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run
addCrowdTrackingData();

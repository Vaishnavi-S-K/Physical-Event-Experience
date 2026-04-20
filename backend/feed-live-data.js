/**
 * Feed real gate scan data into the system for live monitoring
 * Creates recent GateScan documents across all stadiums and gates
 */
const mongoose = require('mongoose');
const GateScan = require('./models/GateScan');
const Event = require('./models/Event');
const CrowdFlowPrediction = require('./models/CrowdFlowPrediction');
const { predictCrowdFlow } = require('./services/crowdFlowPrediction');

const STADIUMS = ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8', 's9', 's10'];
const GATES_PER_STADIUM = 4;

mongoose.connect('mongodb://127.0.0.1:27017/venueiq').then(async () => {
  try {
    console.log('📊 Feeding recent gate scan data...\n');

    // Get active events
    const events = await Event.find({ current_phase: { $ne: null } }).limit(1);
    if (!events.length) {
      console.log('❌ No active events found');
      process.exit(1);
    }

    let scansCreated = 0;
    const now = new Date();

    // Generate gate scans for each stadium
    for (const stadium of STADIUMS) {
      const event = events.find(e => e.stadium_id === stadium) || events[0];
      const eventId = event._id;

      // Create 10-15 gate scans per stadium in the last 5 minutes
      const scanCount = Math.floor(Math.random() * 6) + 10; // 10-15 scans

      for (let i = 0; i < scanCount; i++) {
        const gateNum = Math.floor(Math.random() * GATES_PER_STADIUM);
        const minutesAgo = Math.floor(Math.random() * 5); // 0-4 minutes ago
        const secondsAgo = Math.floor(Math.random() * 60); // 0-59 seconds ago

        const scanTime = new Date(now.getTime() - (minutesAgo * 60 * 1000) - (secondsAgo * 1000));

        const scan = new GateScan({
          stadium_id: stadium,
          event_id: eventId,
          gate_id: `${stadium}-gate-${gateNum}`,
          user_id: `u${Math.floor(Math.random() * 2000) + 1}`,
          entry_count: Math.floor(Math.random() * 3) + 1, // 1-3 people per scan
          entry_direction: 'entry',
          entry_timestamp: scanTime,
          metadata: {
            device_type: 'kiosk',
            scanner_id: `scanner-${stadium}-g${gateNum}`
          }
        });

        await scan.save();
        scansCreated++;
      }

      // Generate predictions for this stadium based on new data
      console.log(`  → ${scansCreated} scans created for ${stadium}`);
    }

    console.log(`\n✅ Created ${scansCreated} fresh gate scans (0-5 minutes old)\n`);

    // Generate predictions for each stadium
    console.log('🤖 Generating crowd predictions...\n');
    let predictionsGenerated = 0;

    for (const stadium of STADIUMS) {
      try {
        const event = events.find(e => e.stadium_id === stadium) || events[0];
        const predictions = await predictCrowdFlow(stadium, event._id);

        if (predictions && predictions.length > 0) {
          console.log(`  ✓ ${stadium}: ${predictions.length} zones predicted`);
          predictionsGenerated++;
        }
      } catch (err) {
        console.log(`  ✗ ${stadium}: ${err.message}`);
      }
    }

    console.log(`\n✅ Predictions generated for ${predictionsGenerated} stadiums\n`);
    console.log('📈 Live data ready! Refresh the frontend to see real data.\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
});

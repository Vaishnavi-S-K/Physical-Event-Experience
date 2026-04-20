const mongoose = require('mongoose');
const ZoneDensity = require('../models/ZoneDensity');
const Queue = require('../models/Queue');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/venueiq';

async function validate() {
  await mongoose.connect(MONGO_URI);
  console.log('--- Data Integrity Check ---');

  const now = new Date();
  let anomalies = 0;

  // Check 1: Densities must be 0-100
  const badDensities = await ZoneDensity.find({
    $or: [{ density: { $lt: 0 } }, { density: { $gt: 100 } }]
  }).lean();
  
  if (badDensities.length > 0) {
    console.warn(`[WARNING] Found ${badDensities.length} density readings out of bounds!`);
    anomalies += badDensities.length;
    // Auto-fix
    await ZoneDensity.updateMany({ density: { $lt: 0 } }, { density: 0 });
    await ZoneDensity.updateMany({ density: { $gt: 100 } }, { density: 100 });
  }

  // Check 2: Wait times shouldn't be negative or absurd (>120 for small zones)
  const badWaitTimes = await Queue.find({
    $or: [{ wait_time: { $lt: 0 } }, { wait_time: { $gt: 150 } }]
  }).lean();

  if (badWaitTimes.length > 0) {
    console.warn(`[WARNING] Found ${badWaitTimes.length} queues with unrealistic wait times!`);
    anomalies += badWaitTimes.length;
    await Queue.updateMany({ wait_time: { $lt: 0 } }, { wait_time: 0 });
    await Queue.updateMany({ wait_time: { $gt: 150 } }, { wait_time: 150 });
  }

  if (anomalies === 0) {
    console.log('✅ Data integrity verified. No anomalies detected.');
  } else {
    console.log(`🧹 Fixed ${anomalies} data anomalies.`);
  }

  await mongoose.connection.close();
  process.exit(0);
}

validate().catch(console.error);

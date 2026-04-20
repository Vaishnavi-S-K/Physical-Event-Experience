const mongoose = require('mongoose');
const Config = require('../models/Config');
const Feedback = require('../models/Feedback');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/venueiq';

async function calibrate() {
  await mongoose.connect(MONGO_URI);
  console.log('--- Model Calibration Job ---');

  // Fetch recent feedback (last 24 hours)
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const feedbacks = await Feedback.find({ created_at: { $gte: oneDayAgo } }).lean();

  if (feedbacks.length < 5) {
    console.log('Not enough feedback data yet for calibration.');
    await mongoose.connection.close();
    return process.exit(0);
  }

  // Calculate error ratio: Avg(Reported / Estimated)
  let totalRatio = 0;
  feedbacks.forEach(f => {
    const estimated = f.actual_wait_time_estimate || 10;
    totalRatio += f.reported_wait_time / estimated;
  });
  const avgError = totalRatio / feedbacks.length;

  console.log(`Average wait-time mismatch ratio: ${avgError.toFixed(2)}`);

  // If people report longer waits (avgError > 1.2), decrease throughput
  // If people report shorter waits (avgError < 0.8), increase throughput
  if (avgError > 1.2 || avgError < 0.8) {
    const configDoc = await Config.findOne({ key: 'sim_throughput' });
    if (configDoc) {
      const newThroughput = { ...configDoc.value };
      // Apply adjustment globally for now
      Object.keys(newThroughput).forEach(k => {
        if (k !== 'field') {
          newThroughput[k] = Math.max(5, Math.min(500, Math.round(newThroughput[k] / avgError)));
        }
      });

      await Config.findOneAndUpdate(
        { key: 'sim_throughput' },
        { value: newThroughput, last_updated: new Date() }
      );
      console.log('Updated simulation throughput rates based on user feedback calibration.');
    }
  } else {
    console.log('Model calibration reflects current reality. No changes needed.');
  }

  await mongoose.connection.close();
  process.exit(0);
}

calibrate().catch(console.error);

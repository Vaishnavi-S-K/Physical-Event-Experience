const mongoose = require('mongoose');
const GateScan = require('./models/GateScan');
const CrowdFlowPrediction = require('./models/CrowdFlowPrediction');

mongoose.connect('mongodb://127.0.0.1:27017/venueiq').then(async () => {
  const startTime = new Date(Date.now() - 5 * 60 * 1000);

  // Check gate traffic
  const s1Traffic = await GateScan.aggregate([
    { $match: { stadium_id: 's1', entry_timestamp: { $gte: startTime } } },
    { $group: { _id: '$gate_id', entries: { $sum: '$entry_count' } } }
  ]);

  // Check predictions
  const s1Pred = await CrowdFlowPrediction.findOne({ stadium_id: 's1' }).sort({ prediction_timestamp: -1 });

  console.log('✅ DATABASE VERIFICATION\n');
  console.log('Gate Traffic for s1:');
  console.log(`  → ${s1Traffic.length} active gates`);
  console.log(`  → ${s1Traffic.reduce((sum, g) => sum + g.entries, 0)} total entries`);

  console.log('\nPrediction for s1:');
  if (s1Pred) {
    console.log(`  → ${s1Pred.predicted_zones.length} zones with predictions`);
    const critical = s1Pred.predicted_zones.filter(z => z.alert_level === 'critical');
    const warning = s1Pred.predicted_zones.filter(z => z.alert_level === 'warning');
    console.log(`  → ${critical.length} CRITICAL zones, ${warning.length} WARNING zones`);
    console.log(`  → Generated: ${new Date(s1Pred.prediction_timestamp).toLocaleTimeString()}`);
  }

  process.exit(0);
}).catch(e => console.error('Error:', e.message));

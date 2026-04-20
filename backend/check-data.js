const mongoose = require('mongoose');
const GateScan = require('./models/GateScan');

mongoose.connect('mongodb://127.0.0.1:27017/venueiq').then(async () => {
  const startTime = new Date(Date.now() - 5 * 60 * 1000); // Last 5 minutes
  
  const recent = await GateScan.find({
    stadium_id: 's1',
    entry_timestamp: { $gte: startTime }
  }).limit(5);
  
  console.log('Recent GateScan (last 5 min):', recent.length, 'records');
  if (recent[0]) console.log('Sample:', JSON.stringify(recent[0], null, 2));
  
  // Check all scans for s1 to understand data range
  const all = await GateScan.find({ stadium_id: 's1' }).sort({ entry_timestamp: -1 }).limit(1);
  console.log('\n\nLatest s1 scan:');
  if (all[0]) {
    console.log('Timestamp:', new Date(all[0].entry_timestamp).toLocaleString());
    console.log('Gate:', all[0].gate_id);
    console.log('Count:', all[0].entry_count);
  }
  
  process.exit(0);
}).catch(err => console.error('Error:', err.message));

const mongoose = require('mongoose');
const GateScan = require('./models/GateScan');

mongoose.connect('mongodb://127.0.0.1:27017/venueiq').then(async () => {
  const startTime = new Date(Date.now() - 5 * 60 * 1000);
  
  const s1Recent = await GateScan.find({
    stadium_id: 's1',
    entry_timestamp: { $gte: startTime }
  }).sort({ entry_timestamp: -1 });
  
  console.log('S1 recent scans (last 5 min):', s1Recent.length);
  console.log('Total entries from s1:', s1Recent.reduce((sum, s) => sum + s.entry_count, 0));
  
  if (s1Recent[0]) {
    const traffic = await GateScan.aggregate([
      { $match: { stadium_id: 's1', entry_timestamp: { $gte: startTime } } },
      { $group: { _id: '$gate_id', total: { $sum: '$entry_count' }, scans: { $sum: 1 } } },
      { $sort: { total: -1 } }
    ]);
    console.log('\nGate traffic aggregation:');
    traffic.forEach(g => {
      console.log(`  ${g._id}: ${g.total} entries (${g.scans} scans)`);
    });
  }
  
  process.exit(0);
}).catch(e => console.error('Error:', e.message));

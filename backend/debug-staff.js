const mongoose = require('mongoose');
const User = require('./models/User');

(async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/venueiq');
    console.log('Connected to DB\n');
    
    // Find all staff users
    const staff = await User.find({ role: 'staff' }).select('email stadium_id role').lean();
    
    console.log('STAFF USERS IN DATABASE:');
    console.log('Total staff accounts:', staff.length);
    console.log('');
    
    staff.slice(0, 10).forEach(s => {
      console.log('  Email:', s.email);
      console.log('  Stadium_id:', s.stadium_id);
      console.log('');
    });
    
    // Check for any without stadium_id
    const noStadium = staff.filter(s => !s.stadium_id);
    if (noStadium.length > 0) {
      console.log('WARNING: Staff without stadium_id:', noStadium.length);
      noStadium.forEach(s => console.log('  -', s.email));
    }
    
    process.exit(0);
  } catch (err) {
    console.error('ERROR:', err.message);
    process.exit(1);
  }
})();

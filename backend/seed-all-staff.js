/**
 * Seed staff and organizer accounts for all stadiums
 * Creates accounts so users can register/login with stadium-specific credentials
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const STADIUMS = [
  { id: 's1', name: 'M. Chinnaswamy Stadium', code: 'MC' },
  { id: 's2', name: 'Sree Kanteerava Stadium', code: 'SK' },
  { id: 's3', name: 'Wankhede Stadium', code: 'WK' },
  { id: 's4', name: 'Eden Gardens', code: 'EG' },
  { id: 's5', name: 'Arun Jaitley Stadium', code: 'AJ' },
  { id: 's6', name: 'Rajiv Gandhi Khel Mandira', code: 'RG' },
  { id: 's7', name: 'JSCA International Cricket Stadium', code: 'JS' },
  { id: 's8', name: 'Maharashtra Cricket Association Stadium', code: 'MCA' },
  { id: 's9', name: 'Jawaharlal Nehru Stadium', code: 'JNS' },
  { id: 's10', name: 'Narendra Modi Stadium', code: 'NMS' }
];

const PASSWORD = 'demo1234'; // Same password for all demo accounts

mongoose.connect('mongodb://127.0.0.1:27017/venueiq').then(async () => {
  try {
    console.log('🔐 Seeding staff & organizer accounts...\n');
    
    let created = 0;

    for (const stadium of STADIUMS) {
      const staffEmail = `staff_${stadium.code.toLowerCase()}@gmail.com`;
      const organiserEmail = `organiser_${stadium.code.toLowerCase()}@gmail.com`;

      // Check if staff exists
      let staffUser = await User.findOne({ email: staffEmail });
      if (!staffUser) {
        const hashedPwd = bcrypt.hashSync(PASSWORD, 10);
        staffUser = new User({
          name: `Staff - ${stadium.name}`,
          email: staffEmail,
          password: hashedPwd,
          role: 'staff',
          stadium_id: stadium.id,
          status: 'active'
        });
        await staffUser.save();
        console.log(`  ✓ Created: ${staffEmail}`);
        created++;
      }

      // Check if organiser exists
      let organiserUser = await User.findOne({ email: organiserEmail });
      if (!organiserUser) {
        const hashedPwd = bcrypt.hashSync(PASSWORD, 10);
        organiserUser = new User({
          name: `Organiser - ${stadium.name}`,
          email: organiserEmail,
          password: hashedPwd,
          role: 'organizer',
          stadium_id: stadium.id,
          status: 'active'
        });
        await organiserUser.save();
        console.log(`  ✓ Created: ${organiserEmail}`);
        created++;
      }
    }

    console.log(`\n✅ Created/verified ${created} accounts\n`);
    console.log('📝 Demo Credentials (password: demo1234):\n');
    
    STADIUMS.forEach(st => {
      console.log(`${st.name} (${st.code}):`);
      console.log(`  Staff:     staff_${st.code.toLowerCase()}@gmail.com`);
      console.log(`  Organiser: organiser_${st.code.toLowerCase()}@gmail.com\n`);
    });

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
});

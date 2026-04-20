// Test complete login flow
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

(async () => {
  try {
    console.log('=== TESTING LOGIN FLOW ===\n');
    
    // Test login with staff from s1
    const email = 'staff_m_chinnaswamy_stadium@gmail.com';
    const password = 'demo1234';
    
    console.log(`Logging in: ${email}\n`);
    
    const response = await fetch('http://localhost:4000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    if (!response.ok) {
      console.error('Login failed:', response.status);
      process.exit(1);
    }
    
    const data = await response.json();
    
    console.log('LOGIN RESPONSE:');
    console.log(JSON.stringify(data, null, 2));
    
    console.log('\n--- USER OBJECT DETAILS ---');
    console.log('user.email:', data.user.email);
    console.log('user.stadium_id:', data.user.stadium_id);
    console.log('user.role:', data.user.role);
    console.log('user.name:', data.user.name);
    console.log('\nToken:', data.token.substring(0, 50) + '...');
    
    if (!data.user.stadium_id) {
      console.error('\nERROR: stadium_id NOT in user response!');
      process.exit(1);
    }
    
    console.log('\n✅ Stadium_id is properly returned by backend');
    process.exit(0);
  } catch (err) {
    console.error('ERROR:', err.message);
    process.exit(1);
  }
})();

const stadiums = [
  { _id: 's1', name: 'M. Chinnaswamy Stadium' },
  { _id: 's2', name: 'Sree Kanteerava Stadium' },
  { _id: 's3', name: 'SNR Cricket Stadium' },
  { _id: 's4', name: 'Nehru Stadium' },
  { _id: 's5', name: 'Rajiv Gandhi International Stadium' },
  { _id: 's6', name: 'Eden Gardens' },
  { _id: 's7', name: 'Wankhede Stadium' },
  { _id: 's8', name: 'Jawaharlal Nehru Stadium' },
  { _id: 's9', name: 'Maharashtra Cricket Ground' },
  { _id: 's10', name: 'JSCA International Stadium' }
];

function stadiumNameToEmail(name) {
  return name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
}

console.log('CORRECT STAFF LOGIN CREDENTIALS:\n');
stadiums.forEach(s => {
  const emailPart = stadiumNameToEmail(s.name);
  console.log(`${s._id}: staff_${emailPart}@gmail.com (password: demo1234)`);
});

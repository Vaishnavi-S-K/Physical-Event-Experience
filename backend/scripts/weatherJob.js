const mongoose = require('mongoose');
const Config = require('../models/Config');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/venueiq';

async function syncWeather() {
  await mongoose.connect(MONGO_URI);
  console.log('--- Weather Update Job ---');

  // Logic: In a real scenario, fetch from OpenWeatherMap
  // For now, we simulate different weather states
  const weatherStates = [
    { name: 'Clear', factor: 1.0 },
    { name: 'Light Rain', factor: 1.3 }, // People crowd indoor/food zones more in rain
    { name: 'Heavy Rain', factor: 1.6 },
    { name: 'Extreme Heat', factor: 1.2 }
  ];

  const current = weatherStates[Math.floor(Math.random() * weatherStates.length)];
  console.log(`Setting simulation weather to: ${current.name} (Factor: ${current.factor})`);

  await Config.findOneAndUpdate(
    { key: 'sim_weatherFactor' },
    { value: current.factor, last_updated: new Date() },
    { upsert: true }
  );

  console.log('Weather synchronized successfully.');
  await mongoose.connection.close();
  process.exit(0);
}

syncWeather().catch(console.error);

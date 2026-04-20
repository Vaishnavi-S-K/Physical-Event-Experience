/**
 * VenueIQ Database Layer — MongoDB via Mongoose
 *
 * In production: connects to MongoDB Atlas via MONGO_URI env variable.
 * In development: automatically starts an in-memory MongoDB server
 * if MONGO_URI is not set or points to localhost (and local mongo is unavailable).
 */

const mongoose = require('mongoose');

let mongoServer = null;

async function connectDB() {
  let uri = process.env.MONGO_URI;

  // If no external MONGO_URI is configured, use in-memory MongoDB
  if (!uri || uri.includes('127.0.0.1') || uri.includes('localhost')) {
    try {
      // Try connecting to local MongoDB first
      if (uri) {
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
        console.log(`✅ MongoDB connected (local): ${mongoose.connection.host}`);
        return;
      }
    } catch {
      // Local MongoDB not available, fall through to in-memory
    }

    // Start in-memory MongoDB server
    console.log('🔄 Starting in-memory MongoDB server...');
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongoServer = await MongoMemoryServer.create();
    uri = mongoServer.getUri();
    console.log(`✅ In-memory MongoDB started at: ${uri}`);
  }

  try {
    await mongoose.connect(uri);
    console.log(`✅ MongoDB connected: ${mongoose.connection.host}`);
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  }
}

async function disconnectDB() {
  await mongoose.connection.close();
  if (mongoServer) {
    await mongoServer.stop();
    mongoServer = null;
  }
}

mongoose.connection.on('error', (err) => {
  console.error('MongoDB runtime error:', err.message);
});

module.exports = { connectDB, disconnectDB, mongoose };

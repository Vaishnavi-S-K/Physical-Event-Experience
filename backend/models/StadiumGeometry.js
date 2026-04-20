const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const stadiumGeometrySchema = new mongoose.Schema(
  {
    id: { type: String, default: uuidv4, index: true },
    stadium_id: { type: String, required: true, index: true, unique: true },
    stadium_name: String,
    location: {
      coordinates: {
        latitude: Number,
        longitude: Number
      },
      address: String,
      city: String
    },
    gates: [
      {
        gate_id: String,
        gate_name: String,
        gate_type: { type: String, enum: ['main', 'side', 'vip', 'emergency'] },
        coordinates: {
          latitude: Number,
          longitude: Number
        },
        capacity_per_hour: Number,
        typical_queue_time_minutes: Number
      }
    ],
    zones: [
      {
        zone_id: String,
        zone_name: String,
        zone_type: String, // 'food', 'restroom', 'medical', 'merch', 'vip', 'field', 'parking'
        coordinates: {
          latitude: Number,
          longitude: Number
        },
        capacity: Number,
        area_sq_meters: Number
      }
    ],
    // Pre-computed distances between gates and zones
    gate_to_zone_distances: [
      {
        gate_id: String,
        zone_id: String,
        distance_meters: Number,
        walk_time_minutes: Number,
        popularity_factor: { type: Number, default: 1.0 } // 1.2 = 20% more popular
      }
    ],
    // Zone interconnectivity
    zone_adjacency: [
      {
        zone_a_id: String,
        zone_b_id: String,
        distance_meters: Number,
        can_overflow_to: { type: Boolean, default: true }
      }
    ],
    metadata: {
      source: String, // 'google_maps', 'manual_entry'
      last_verified: Date,
      total_capacity: Number,
      parking_spaces: Number,
      accessibility_features: [String]
    }
  },
  { timestamps: true }
);

stadiumGeometrySchema.index({ stadium_id: 1 });

module.exports = mongoose.model('StadiumGeometry', stadiumGeometrySchema);

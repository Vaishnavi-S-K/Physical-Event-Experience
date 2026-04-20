const mongoose = require('mongoose');

const beaconReadingSchema = new mongoose.Schema({
  stadium_id: { type: String, required: true },
  zone_id: { type: String, required: true },
  occupancy_estimate: { type: Number, required: true }, // Number of unique devices detected
  recorded_at: { type: Date, default: Date.now }
}, { timestamps: true });

beaconReadingSchema.index({ stadium_id: 1, recorded_at: -1 });
beaconReadingSchema.index({ zone_id: 1, recorded_at: -1 });

module.exports = mongoose.model('BeaconReading', beaconReadingSchema);

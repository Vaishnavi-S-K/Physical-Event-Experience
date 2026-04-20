const mongoose = require('mongoose');

const gateReadingSchema = new mongoose.Schema({
  stadium_id: { type: String, required: true },
  zone_id: { type: String, required: true },
  in_count: { type: Number, default: 0 },
  out_count: { type: Number, default: 0 },
  recorded_at: { type: Date, default: Date.now }
}, { timestamps: true });

gateReadingSchema.index({ stadium_id: 1, recorded_at: -1 });
gateReadingSchema.index({ zone_id: 1, recorded_at: -1 });

module.exports = mongoose.model('GateReading', gateReadingSchema);

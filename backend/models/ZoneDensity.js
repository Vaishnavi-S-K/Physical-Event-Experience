const mongoose = require('mongoose');

const zoneDensitySchema = new mongoose.Schema({
  stadium_id:  { type: String },
  zone_id:     { type: String, required: true },
  density:     { type: Number, required: true },
  recorded_at: { type: Date, default: Date.now },
}, { timestamps: false });

// Index for efficient lookups
zoneDensitySchema.index({ zone_id: 1, recorded_at: -1 });
zoneDensitySchema.index({ stadium_id: 1 });

zoneDensitySchema.set('toJSON', { virtuals: true });
zoneDensitySchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('ZoneDensity', zoneDensitySchema);

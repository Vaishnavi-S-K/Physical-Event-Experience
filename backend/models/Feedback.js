const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  user_id: { type: String, required: true },
  stadium_id: { type: String, required: true },
  zone_id: { type: String, required: true },
  reported_wait_time: { type: Number, required: true }, // Minutes
  actual_wait_time_estimate: { type: Number }, // System's estimate at that time
  event_phase: { type: String },
  created_at: { type: Date, default: Date.now }
}, { timestamps: true });

feedbackSchema.index({ stadium_id: 1, created_at: -1 });

module.exports = mongoose.model('Feedback', feedbackSchema);

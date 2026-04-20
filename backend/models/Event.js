const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  _id:           { type: String },            // e.g. 'e1', 'e2'
  stadium_id:    { type: String, required: true },
  name:          { type: String, required: true },
  date:          { type: Date, required: true },
  status:        { type: String, default: 'upcoming' },
  current_phase: { type: String, default: 'Pre-Game' },
  attendees:     { type: Number, default: 0 },
  open_gates:    { type: Number, default: 4 },
  updated_at:    { type: Date, default: Date.now },
}, { timestamps: true });

eventSchema.set('toJSON', { virtuals: true });
eventSchema.set('toObject', { virtuals: true });
eventSchema.virtual('id').get(function () { return this._id; });

module.exports = mongoose.model('Event', eventSchema);

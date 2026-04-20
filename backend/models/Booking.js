const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  _id:          { type: String, default: () => require('uuid').v4() },
  user_id:      { type: String, required: true },
  stadium_id:   { type: String, required: true },
  event_id:     { type: String, required: true },
  section:      { type: String, default: 'General' },
  num_tickets:  { type: Number, default: 1 },
  booking_date: { type: Date, default: Date.now },
  entryTimestamp: { type: Date, default: null },
}, { timestamps: true });

// Indexes for performance at scale
bookingSchema.index({ user_id: 1 });
bookingSchema.index({ stadium_id: 1 });
bookingSchema.index({ event_id: 1 });
bookingSchema.index({ booking_date: -1 });

bookingSchema.set('toJSON', { virtuals: true });
bookingSchema.set('toObject', { virtuals: true });
bookingSchema.virtual('id').get(function () { return this._id; });

module.exports = mongoose.model('Booking', bookingSchema);

const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  _id:        { type: String, default: () => require('uuid').v4() },
  queue_id:   { type: String, required: true },
  user_id:    { type: String, required: true },
  slot_time:  { type: String },
  status:     { type: String, default: 'active' },
  created_at: { type: Date, default: Date.now },
}, { timestamps: true });

reservationSchema.set('toJSON', { virtuals: true });
reservationSchema.set('toObject', { virtuals: true });
reservationSchema.virtual('id').get(function () { return this._id; });

module.exports = mongoose.model('Reservation', reservationSchema);

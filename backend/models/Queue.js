const mongoose = require('mongoose');

const queueSchema = new mongoose.Schema({
  _id:         { type: String },             // e.g. 's1-q1'
  stadium_id:  { type: String, required: true },
  zone_id:     { type: String },
  name:        { type: String, required: true },
  type:        { type: String },             // entry, food, etc.
  wait_time:   { type: Number, default: 10 },
  is_open:     { type: Boolean, default: true },
  total_slots: { type: Number, default: 100 },
  reserved:    { type: Number, default: 0 },
}, { timestamps: true });

queueSchema.set('toJSON', { virtuals: true });
queueSchema.set('toObject', { virtuals: true });
queueSchema.virtual('id').get(function () { return this._id; });

module.exports = mongoose.model('Queue', queueSchema);

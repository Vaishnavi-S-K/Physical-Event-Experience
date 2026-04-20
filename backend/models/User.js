const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  _id:        { type: String, default: () => require('uuid').v4() },
  name:       { type: String, required: true },
  email:      { type: String, required: true, unique: true },
  password:   { type: String, required: true },
  role:       { type: String, enum: ['attendee', 'staff', 'organizer'], default: 'attendee' },
  stadium_id: { type: String, default: null },
  status:     { type: String, default: 'active' },
}, { timestamps: true });

// Indexes for performance at scale
userSchema.index({ email: 1 });       // unique already, but explicit
userSchema.index({ role: 1 });
userSchema.index({ stadium_id: 1 });
userSchema.index({ status: 1 });

// Virtual "id" field that returns _id (so existing frontend code works)
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });
userSchema.virtual('id').get(function () { return this._id; });

module.exports = mongoose.model('User', userSchema);

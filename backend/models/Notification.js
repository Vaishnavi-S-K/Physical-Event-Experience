const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  _id:         { type: String, default: () => require('uuid').v4() },
  stadium_id:  { type: String },
  type:        { type: String, required: true },
  message:     { type: String, required: true },
  target_role: { type: String, default: null },
  read:        { type: Boolean, default: false },
  created_at:  { type: Date, default: Date.now },
}, { timestamps: true });

notificationSchema.set('toJSON', { virtuals: true });
notificationSchema.set('toObject', { virtuals: true });
notificationSchema.virtual('id').get(function () { return this._id; });

module.exports = mongoose.model('Notification', notificationSchema);

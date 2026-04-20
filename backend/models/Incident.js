const mongoose = require('mongoose');

const incidentSchema = new mongoose.Schema({
  _id:         { type: String, default: () => require('uuid').v4() },
  stadium_id:  { type: String },
  type:        { type: String, required: true },
  severity:    { type: String, required: true },
  zone_id:     { type: String, default: null },
  message:     { type: String, required: true },
  status:      { type: String, default: 'pending' },
  reported_by: { type: String },
  assigned_to: { type: String, default: null },
  created_at:  { type: Date, default: Date.now },
  resolved_at: { type: Date, default: null },
}, { timestamps: true });

incidentSchema.set('toJSON', { virtuals: true });
incidentSchema.set('toObject', { virtuals: true });
incidentSchema.virtual('id').get(function () { return this._id; });

module.exports = mongoose.model('Incident', incidentSchema);

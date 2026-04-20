const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
  _id:        { type: String },
  stadium_id: { type: String, required: true },
  name:       { type: String, required: true },
  role:       { type: String },
  location:   { type: String },
  status:     { type: String, default: 'active' },
  contact:    { type: String },
}, { timestamps: true });

staffSchema.set('toJSON', { virtuals: true });
staffSchema.set('toObject', { virtuals: true });
staffSchema.virtual('id').get(function () { return this._id; });

module.exports = mongoose.model('Staff', staffSchema);

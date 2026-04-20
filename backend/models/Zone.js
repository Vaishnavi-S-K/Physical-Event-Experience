const mongoose = require('mongoose');

const zoneSchema = new mongoose.Schema({
  _id:            { type: String },          // e.g. 's1-gate-a'
  name:           { type: String, required: true },
  type:           { type: String },          // gate, food, restroom, medical, field, merch, vip
  capacity_limit: { type: Number },
  stadium_id:     { type: String, required: true },
}, { timestamps: true });

zoneSchema.set('toJSON', { virtuals: true });
zoneSchema.set('toObject', { virtuals: true });
zoneSchema.virtual('id').get(function () { return this._id; });

module.exports = mongoose.model('Zone', zoneSchema);

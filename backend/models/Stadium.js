const mongoose = require('mongoose');

const stadiumSchema = new mongoose.Schema({
  _id:      { type: String },           // e.g. 's1', 's2'
  name:     { type: String, required: true },
  city:     { type: String, required: true },
  capacity: { type: Number, required: true },
  type:     { type: String },            // cricket, football, multipurpose
  image:    { type: String },            // emoji
  address:  { type: String },            // Full address from Google
  location: {
    lat: { type: Number },
    lng: { type: Number }
  },
  gatesCount: { type: Number },          // Estimated number of gates
  foodCourts: [{
    name: { type: String },
    distanceMeters: { type: Number },
    location: {
      lat: { type: Number },
      lng: { type: Number }
    }
  }]
}, { timestamps: true });

stadiumSchema.set('toJSON', { virtuals: true });
stadiumSchema.set('toObject', { virtuals: true });
stadiumSchema.virtual('id').get(function () { return this._id; });

module.exports = mongoose.model('Stadium', stadiumSchema);

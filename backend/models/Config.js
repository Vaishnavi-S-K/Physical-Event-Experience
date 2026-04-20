const mongoose = require('mongoose');

const configSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true },
  description: { type: String },
  last_updated: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Config', configSchema);

const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const gateScanSchema = new mongoose.Schema(
  {
    id: { type: String, default: uuidv4, index: true },
    stadium_id: { type: String, required: true, index: true },
    event_id: { type: String, index: true },
    gate_id: { type: String, required: true, index: true },
    user_id: { type: String, index: true },
    ticket_id: { type: String },
    entry_timestamp: { type: Date, default: Date.now, index: true },
    entry_count: { type: Number, default: 1 }, // Number of people entering at this scan (family group)
    entry_direction: { type: String, enum: ['entry', 'exit'], default: 'entry' },
    metadata: {
      device_type: String, // mobile, kiosk, manual
      scanner_id: String,
      qr_code_data: String
    }
  },
  { timestamps: true }
);

// Compound index for efficient queries
gateScanSchema.index({ stadium_id: 1, entry_timestamp: -1 });
gateScanSchema.index({ gate_id: 1, entry_timestamp: -1 });
gateScanSchema.index({ event_id: 1, entry_timestamp: -1 });

module.exports = mongoose.model('GateScan', gateScanSchema);

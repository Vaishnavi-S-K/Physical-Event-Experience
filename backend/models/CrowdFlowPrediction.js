const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const crowdFlowPredictionSchema = new mongoose.Schema(
  {
    id: { type: String, default: uuidv4, index: true },
    stadium_id: { type: String, required: true, index: true },
    event_id: { type: String, index: true },
    prediction_timestamp: { type: Date, default: Date.now, index: true },
    time_window: {
      start: Date, // e.g., next 5 minutes
      end: Date
    },
    source_gate_id: String,
    source_gate_name: String,
    predicted_zones: [
      {
        zone_id: String,
        zone_name: String,
        zone_type: String,
        predicted_crowd_influx: Number, // estimated number of people
        predicted_arrival_time_minutes: Number,
        confidence_score: { type: Number, min: 0, max: 1 }, // 0.75 = 75% confident
        alert_level: { type: String, enum: ['normal', 'warning', 'critical'] },
        recommended_action: String // e.g., "Open additional checkout lane"
      }
    ],
    actual_vs_predicted: {
      actual_crowd_observed: Number,
      prediction_accuracy: Number, // 0-100%
      recorded_at: Date
    },
    generated_by: String // 'ai_model', 'historical_pattern', 'manual'
  },
  { timestamps: true }
);

crowdFlowPredictionSchema.index({ stadium_id: 1, prediction_timestamp: -1 });
crowdFlowPredictionSchema.index({ event_id: 1, prediction_timestamp: -1 });

module.exports = mongoose.model('CrowdFlowPrediction', crowdFlowPredictionSchema);

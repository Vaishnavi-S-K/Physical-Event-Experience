const GateScan = require('../models/GateScan');
const CrowdFlowPrediction = require('../models/CrowdFlowPrediction');
const StadiumGeometry = require('../models/StadiumGeometry');
const { calculateWalkTime } = require('./stadiumFetcher');

/**
 * Crowd Flow Prediction Engine
 * Predicts which zones will get crowded based on recent gate traffic
 */

/**
 * Get recent gate traffic (last N minutes)
 */
const getGateTraffic = async (stadiumId, eventId, minutesWindow = 5) => {
  const startTime = new Date(Date.now() - minutesWindow * 60 * 1000);

  // Build match query - event_id is optional
  const matchQuery = {
    stadium_id: stadiumId,
    entry_timestamp: { $gte: startTime },
    entry_direction: 'entry'
  };
  
  if (eventId) {
    matchQuery.event_id = eventId;
  }

  const traffic = await GateScan.aggregate([
    {
      $match: matchQuery
    },
    {
      $group: {
        _id: '$gate_id',
        total_entries: { $sum: '$entry_count' },
        scan_count: { $sum: 1 },
        latest_scan: { $max: '$entry_timestamp' }
      }
    },
    {
      $sort: { total_entries: -1 }
    }
  ]);

  return traffic;
};

/**
 * Predict crowd flow to zones based on gate traffic
 */
const predictCrowdFlow = async (stadiumId, eventId) => {
  try {
    // Get stadium geometry
    const geometry = await StadiumGeometry.findOne({ stadium_id: stadiumId });
    if (!geometry) {
      throw new Error(`Stadium geometry not found for ${stadiumId}`);
    }

    // Get recent gate traffic
    const gateTraffic = await getGateTraffic(stadiumId, eventId, 5);

    if (gateTraffic.length === 0) {
      console.log(`No recent gate traffic for stadium ${stadiumId}`);
      return [];
    }

    const predictions = [];

    // For each active gate, predict which zones will get crowded
    for (const gate of gateTraffic) {
      const gateInfo = geometry.gates.find((g) => g.gate_id === gate._id);
      if (!gateInfo) continue;

      // Get gate-to-zone distances
      const gateToZones = geometry.gate_to_zone_distances.filter(
        (d) => d.gate_id === gate._id
      );

      // Sort by walk time and distance
      gateToZones.sort((a, b) => a.walk_time_minutes - b.walk_time_minutes);

      // Predict for closest zones (people will naturally go to nearest food/restroom first)
      const closestZones = gateToZones.slice(0, 5); // Top 5 closest zones

      for (const zone of closestZones) {
        const zoneInfo = geometry.zones.find((z) => z.zone_id === zone.zone_id);
        if (!zoneInfo) continue;

        // Calculate predicted crowd influx
        // Assumption: People arriving through this gate will visit nearby zones
        // Distribution: closer zones get more traffic
        const proximityFactor = 1 / (1 + zone.walk_time_minutes * 0.1); // Closer = higher factor
        const crowdInflux = Math.round(gate.total_entries * proximityFactor * zone.popularity_factor);

        // Calculate confidence score based on:
        // - Recency of traffic (more recent = higher confidence)
        // - Volume of traffic (more scans = higher confidence)
        // - Distance (closer zones = higher confidence)
        const recencyMinutes = (Date.now() - gate.latest_scan) / 60000;
        const recencyFactor = Math.max(0, 1 - recencyMinutes / 10); // Fade after 10 mins
        const volumeFactor = Math.min(1, gate.scan_count / 10); // More scans = higher confidence
        const distanceFactor = Math.max(0.6, 1 - zone.walk_time_minutes / 30); // Closer = higher confidence
        const confidence = (recencyFactor * 0.4 + volumeFactor * 0.4 + distanceFactor * 0.2).toFixed(2);

        // Determine alert level
        let alertLevel = 'normal';
        if (crowdInflux > 100) alertLevel = 'warning';
        if (crowdInflux > 200) alertLevel = 'critical';

        // Generate recommended action
        let recommendedAction = 'Monitor situation';
        if (alertLevel === 'warning') {
          recommendedAction = 'Prepare additional staff in zone';
        } else if (alertLevel === 'critical') {
          recommendedAction = 'Deploy staff now. Open additional checkouts. Consider flow diversion.';
        }

        predictions.push({
          gate_id: gate._id,
          gate_name: gateInfo.gate_name,
          zone_id: zone.zone_id,
          zone_name: zoneInfo.zone_name,
          zone_type: zoneInfo.zone_type,
          crowd_influx: crowdInflux,
          arrival_time_minutes: zone.walk_time_minutes,
          confidence: parseFloat(confidence),
          alert_level: alertLevel,
          recommended_action: recommendedAction,
          proximity_factor: proximityFactor.toFixed(2),
          popularity_factor: zone.popularity_factor
        });
      }
    }

    // Group predictions by zone to aggregate traffic from multiple gates
    const zoneAggregates = aggregatePredictionsByZone(predictions);

    // Save predictions to database
    const predictionDoc = new CrowdFlowPrediction({
      stadium_id: stadiumId,
      event_id: eventId,
      prediction_timestamp: new Date(),
      time_window: {
        start: new Date(),
        end: new Date(Date.now() + 30 * 60 * 1000) // 30-minute window
      },
      predicted_zones: zoneAggregates,
      generated_by: 'ai_model'
    });

    await predictionDoc.save();

    return zoneAggregates;
  } catch (error) {
    console.error('Error in predictCrowdFlow:', error);
    throw error;
  }
};

/**
 * Aggregate predictions by zone (if multiple gates feed into same zone)
 */
const aggregatePredictionsByZone = (predictions) => {
  const zoneMap = new Map();

  for (const pred of predictions) {
    const key = pred.zone_id;
    if (!zoneMap.has(key)) {
      zoneMap.set(key, {
        zone_id: pred.zone_id,
        zone_name: pred.zone_name,
        zone_type: pred.zone_type,
        predicted_crowd_influx: 0,
        predicted_arrival_time_minutes: pred.arrival_time_minutes,
        confidence_score: 0,
        contributing_gates: [],
        alert_level: 'normal',
        recommended_action: ''
      });
    }

    const zone = zoneMap.get(key);
    zone.predicted_crowd_influx += pred.crowd_influx;
    zone.confidence_score = Math.max(zone.confidence_score, pred.confidence);
    zone.contributing_gates.push(pred.gate_id);

    // Update alert level based on total crowd
    if (zone.predicted_crowd_influx > 100) zone.alert_level = 'warning';
    if (zone.predicted_crowd_influx > 200) zone.alert_level = 'critical';
  }

  // Convert to array and generate actions
  return Array.from(zoneMap.values()).map((zone) => {
    if (zone.alert_level === 'critical') {
      zone.recommended_action = 'URGENT: Deploy staff now. Open additional checkouts. Consider flow diversion.';
    } else if (zone.alert_level === 'warning') {
      zone.recommended_action = 'Prepare staff. Monitor in real-time.';
    } else {
      zone.recommended_action = 'Monitor situation.';
    }
    return zone;
  });
};

/**
 * Get recent predictions (for dashboard)
 */
const getRecentPredictions = async (stadiumId, eventId, limit = 10) => {
  const predictions = await CrowdFlowPrediction.find({
    stadium_id: stadiumId,
    event_id: eventId
  })
    .sort({ prediction_timestamp: -1 })
    .limit(limit)
    .exec();

  return predictions;
};

/**
 * Get critical alert predictions (for urgent notifications)
 */
const getCriticalAlerts = async (stadiumId, eventId) => {
  const latestPrediction = await CrowdFlowPrediction.findOne({
    stadium_id: stadiumId,
    event_id: eventId
  })
    .sort({ prediction_timestamp: -1 })
    .exec();

  if (!latestPrediction) return [];

  return latestPrediction.predicted_zones.filter((z) => z.alert_level === 'critical');
};

/**
 * Calculate prediction accuracy (compare with actual crowd data)
 */
const calculatePredictionAccuracy = async (stadiumId, eventId, predictionId) => {
  try {
    const prediction = await CrowdFlowPrediction.findById(predictionId);
    if (!prediction) throw new Error('Prediction not found');

    // Get actual crowd density for the same zones within the time window
    // This would be compared against ZoneDensity data
    // For now, placeholder implementation
    let totalAccuracy = 0;
    const zones = prediction.predicted_zones;

    zones.forEach((zone) => {
      // Mock calculation - in real implementation, compare with actual ZoneDensity
      const predictionError = Math.random() * 20; // 0-20% error margin
      const accuracy = Math.max(0, 100 - predictionError);
      totalAccuracy += accuracy;
    });

    const avgAccuracy = zones.length > 0 ? totalAccuracy / zones.length : 0;

    // Update prediction with accuracy
    prediction.actual_vs_predicted.prediction_accuracy = Math.round(avgAccuracy);
    prediction.actual_vs_predicted.recorded_at = new Date();
    await prediction.save();

    return avgAccuracy;
  } catch (error) {
    console.error('Error calculating prediction accuracy:', error);
    throw error;
  }
};

module.exports = {
  getGateTraffic,
  predictCrowdFlow,
  getRecentPredictions,
  getCriticalAlerts,
  calculatePredictionAccuracy
};

module.exports = {
  getGateTraffic,
  predictCrowdFlow,
  getRecentPredictions,
  getCriticalAlerts,
  calculatePredictionAccuracy
};

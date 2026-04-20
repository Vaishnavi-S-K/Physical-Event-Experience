/**
 * VenueIQ AI Crowd Prediction Engine
 * 
 * Uses a lightweight LSTM-inspired model implemented in JavaScript.
 * In production, this would use TensorFlow.js with proper training data.
 * 
 * Current approach: Synthetic LSTM simulation with:
 * - Time-series crowd patterns (historical stadium data)
 * - Event phase multipliers
 * - Zone-specific behavioral models
 * - 30-minute ahead prediction with confidence scores
 */

// === Crowd Behavior Models Per Zone Type ===
const ZONE_BEHAVIOR = {
  gate: {
    preGame:   { base: 75, variance: 20, trend: 'rising' },
    kickOff:   { base: 90, variance: 10, trend: 'peak' },
    firstHalf: { base: 30, variance: 15, trend: 'falling' },
    halfTime:  { base: 60, variance: 20, trend: 'rising' },
    secondHalf:{ base: 25, variance: 10, trend: 'stable' },
    fullTime:  { base: 85, variance: 15, trend: 'peak' },
    postGame:  { base: 70, variance: 20, trend: 'falling' },
  },
  food: {
    preGame:   { base: 40, variance: 15, trend: 'rising' },
    kickOff:   { base: 25, variance: 10, trend: 'falling' },
    firstHalf: { base: 30, variance: 12, trend: 'stable' },
    halfTime:  { base: 95, variance: 5, trend: 'peak' },  // Surge at half-time
    secondHalf:{ base: 35, variance: 15, trend: 'stable' },
    fullTime:  { base: 50, variance: 20, trend: 'rising' },
    postGame:  { base: 70, variance: 20, trend: 'falling' },
  },
  restroom: {
    preGame:   { base: 35, variance: 15, trend: 'stable' },
    kickOff:   { base: 20, variance: 10, trend: 'falling' },
    firstHalf: { base: 30, variance: 15, trend: 'stable' },
    halfTime:  { base: 85, variance: 10, trend: 'peak' },  // High demand at half-time
    secondHalf:{ base: 30, variance: 15, trend: 'stable' },
    fullTime:  { base: 55, variance: 20, trend: 'rising' },
    postGame:  { base: 45, variance: 20, trend: 'falling' },
  },
  merchandise: {
    preGame:   { base: 60, variance: 20, trend: 'rising' },
    kickOff:   { base: 30, variance: 15, trend: 'falling' },
    firstHalf: { base: 20, variance: 10, trend: 'stable' },
    halfTime:  { base: 50, variance: 20, trend: 'rising' },
    secondHalf:{ base: 20, variance: 10, trend: 'stable' },
    fullTime:  { base: 70, variance: 20, trend: 'rising' },
    postGame:  { base: 65, variance: 20, trend: 'falling' },
  },
  medical: {
    preGame:   { base: 15, variance: 5, trend: 'stable' },
    kickOff:   { base: 20, variance: 8, trend: 'stable' },
    firstHalf: { base: 25, variance: 10, trend: 'stable' },
    halfTime:  { base: 30, variance: 12, trend: 'rising' },
    secondHalf:{ base: 25, variance: 10, trend: 'stable' },
    fullTime:  { base: 35, variance: 15, trend: 'rising' },
    postGame:  { base: 30, variance: 12, trend: 'falling' },
  },
  vip: {
    preGame:   { base: 50, variance: 20, trend: 'rising' },
    kickOff:   { base: 80, variance: 10, trend: 'stable' },
    firstHalf: { base: 75, variance: 10, trend: 'stable' },
    halfTime:  { base: 90, variance: 8, trend: 'peak' },
    secondHalf:{ base: 75, variance: 10, trend: 'stable' },
    fullTime:  { base: 60, variance: 20, trend: 'falling' },
    postGame:  { base: 40, variance: 20, trend: 'falling' },
  },
};

// === Phase Key Mapping ===
const phaseKey = {
  'Pre-Game':    'preGame',
  'Kick-Off':    'kickOff',
  'First Half':  'firstHalf',
  'Half-Time':   'halfTime',
  'Second Half': 'secondHalf',
  'Full-Time':   'fullTime',
  'Post-Game':   'postGame',
};

// === LSTM-Inspired Prediction (Synthetic) ===
// Simulates hidden state carry-over effect of LSTM
class SimpleLSTM {
  constructor() {
    this.hiddenState = {};
    this.cellState = {};
  }

  forget(zoneId, rate = 0.85) {
    this.hiddenState[zoneId] = (this.hiddenState[zoneId] || 0) * rate;
    this.cellState[zoneId] = (this.cellState[zoneId] || 0) * rate;
  }

  update(zoneId, input) {
    const h = this.hiddenState[zoneId] || 0;
    const c = this.cellState[zoneId] || 0;
    // Simplified LSTM gates
    const forgetGate = 1 / (1 + Math.exp(-(h * 0.1 + input * 0.1)));
    const inputGate  = 1 / (1 + Math.exp(-(h * 0.15 + input * 0.2)));
    const cellCand   = Math.tanh(h * 0.2 + input * 0.3);
    const newCell    = forgetGate * c + inputGate * cellCand;
    const outputGate = 1 / (1 + Math.exp(-(h * 0.1 + newCell * 0.1)));
    const newHidden  = outputGate * Math.tanh(newCell);
    this.hiddenState[zoneId] = newHidden;
    this.cellState[zoneId] = newCell;
    return { hidden: newHidden, cell: newCell };
  }

  predict(zoneId, currentDensity, zoneType, eventPhase, minutesAhead = 30) {
    const pKey = phaseKey[eventPhase] || 'firstHalf';
    const behavior = ZONE_BEHAVIOR[zoneType]?.[pKey] || { base: 40, variance: 15, trend: 'stable' };

    // Update LSTM state
    const { hidden } = this.update(zoneId, currentDensity / 100);

    // Trend adjustment
    const trendEffect = {
      rising:  minutesAhead * 0.4,
      falling: -minutesAhead * 0.35,
      peak:    minutesAhead > 15 ? -minutesAhead * 0.3 : minutesAhead * 0.1,
      stable:  (Math.random() - 0.5) * 5,
    }[behavior.trend] || 0;

    // Combine: LSTM hidden state + behavior model + trend
    const basePred = behavior.base + (hidden * 20);
    const withTrend = basePred + trendEffect;
    const noise = (Math.random() - 0.5) * behavior.variance;
    const prediction = Math.min(100, Math.max(0, withTrend + noise));

    // Confidence based on how well we know the zone pattern
    const confidence = Math.min(95, Math.max(50, 
      80 - (behavior.variance / 3) + (Math.abs(hidden) * 10)
    ));

    return {
      currentDensity,
      predicted30min: Math.round(prediction),
      confidence: Math.round(confidence),
      trend: behavior.trend,
      alert: prediction > 80 ? 'critical' : prediction > 65 ? 'warning' : 'normal',
      recommendation: getRecommendation(zoneType, prediction, eventPhase),
    };
  }
}

// === Recommendation Engine ===
function getRecommendation(zoneType, predictedDensity, eventPhase) {
  if (predictedDensity > 80) {
    const recommendations = {
      gate: `High congestion expected. Open auxiliary lanes and deploy crowd control staff.`,
      food: `Food court surge forecast. Pre-stock counters and add 2 service staff.`,
      restroom: `Capacity warning. Redirect attendees to alternate restrooms in SE wing.`,
      merchandise: `High demand in 30min. Increase cashier count and replenish stock.`,
      vip: `VIP area filling fast. Pre-validate access lists and manage entry rate.`,
      medical: `Medical demand rising. Alert backup medic team to stand by.`,
    };
    return recommendations[zoneType] || 'Consider managing crowd flow to this area.';
  } else if (predictedDensity < 30) {
    return `Area underutilized. Consider promotions or redirecting attendees here.`;
  }
  return `Normal operations expected. Maintain current staffing levels.`;
}

// === Global LSTM Instance ===
const lstm = new SimpleLSTM();

// === Main Prediction Function ===
export function predictCrowdDensity(zones, zoneDensities, eventPhase) {
  const predictions = {};
  zones.forEach(zone => {
    if (zone.type === 'field') return;
    const current = zoneDensities[zone.id] || 30;
    predictions[zone.id] = lstm.predict(zone.id, current, zone.type, eventPhase, 30);
  });
  return predictions;
}

// === Wait Time Prediction ===
export function predictWaitTime(currentWait, zoneId, eventPhase) {
  const pKey = phaseKey[eventPhase] || 'firstHalf';
  const multiplier = {
    preGame:     1.3,
    kickOff:     0.8,
    firstHalf:   0.9,
    halfTime:    2.2,
    secondHalf:  0.9,
    fullTime:    1.5,
    postGame:    1.1,
  }[pKey] || 1.0;

  const predictedWait = Math.round(currentWait * multiplier + (Math.random() - 0.5) * 4);
  return Math.max(1, Math.min(60, predictedWait));
}

// === Crowd Route Recommendation ===
export function getRouteRecommendation(fromZone, toZone, zoneDensities) {
  const density = zoneDensities[toZone] || 50;
  if (density > 75) {
    return {
      recommended: false,
      message: `⚠️ High congestion detected. Consider an alternate route or wait 10–15 minutes.`,
      altRoute: 'Use the corridor near Gate D for faster access.',
      estimatedTime: Math.round(density / 10) + ' min',
    };
  }
  return {
    recommended: true,
    message: `✅ Route clear. Estimated arrival: ${Math.round(density / 20) + 2} minutes.`,
    altRoute: null,
    estimatedTime: (Math.round(density / 20) + 2) + ' min',
  };
}

// === Export LSTM instance for reuse ===
export { lstm };

import { create } from 'zustand';

// === Venue Zone Definitions ===
export const VENUE_ZONES = [
  { id: 'gate-a', name: 'Gate A (North)', x: 300, y: 50, w: 120, h: 60, type: 'gate', capacity: 800 },
  { id: 'gate-b', name: 'Gate B (East)', x: 620, y: 250, w: 60, h: 120, type: 'gate', capacity: 600 },
  { id: 'gate-c', name: 'Gate C (South)', x: 300, y: 520, w: 120, h: 60, type: 'gate', capacity: 800 },
  { id: 'gate-d', name: 'Gate D (West)', x: 40, y: 250, w: 60, h: 120, type: 'gate', capacity: 600 },
  { id: 'food-1', name: 'Food Court Alpha', x: 80, y: 120, w: 110, h: 80, type: 'food', capacity: 300 },
  { id: 'food-2', name: 'Food Court Beta', x: 530, y: 120, w: 110, h: 80, type: 'food', capacity: 300 },
  { id: 'food-3', name: 'Concession Row', x: 80, y: 420, w: 110, h: 80, type: 'food', capacity: 400 },
  { id: 'restroom-1', name: 'Restrooms NW', x: 195, y: 105, w: 70, h: 50, type: 'restroom', capacity: 80 },
  { id: 'restroom-2', name: 'Restrooms NE', x: 455, y: 105, w: 70, h: 50, type: 'restroom', capacity: 80 },
  { id: 'restroom-3', name: 'Restrooms SW', x: 195, y: 470, w: 70, h: 50, type: 'restroom', capacity: 80 },
  { id: 'restroom-4', name: 'Restrooms SE', x: 455, y: 470, w: 70, h: 50, type: 'restroom', capacity: 80 },
  { id: 'medical', name: 'Medical Center', x: 530, y: 420, w: 110, h: 80, type: 'medical', capacity: 50 },
  { id: 'merch', name: 'Merchandise Store', x: 200, y: 420, w: 90, h: 80, type: 'merchandise', capacity: 200 },
  { id: 'vip', name: 'VIP Lounge', x: 530, y: 240, w: 90, h: 80, type: 'vip', capacity: 150 },
  { id: 'field', name: 'Playing Field', x: 155, y: 165, w: 400, h: 250, type: 'field', capacity: 0 },
];

// === Event Phases ===
export const EVENT_PHASES = ['Pre-Game', 'Kick-Off', 'First Half', 'Half-Time', 'Second Half', 'Full-Time', 'Post-Game'];

// === Initial Zone Densities ===
const generateInitialDensities = () => {
  const densities = {};
  VENUE_ZONES.forEach(zone => {
    densities[zone.id] = zone.type === 'field' ? 0 : Math.floor(Math.random() * 45 + 10);
  });
  return densities;
};

// === Queue Items ===
const QUEUE_ITEMS = [
  { id: 'q1', name: 'Food Court Alpha – Grill Station', zoneId: 'food-1', waitTime: 18, slots: 24, reserved: 8 },
  { id: 'q2', name: 'Food Court Beta – Pizza & Pasta', zoneId: 'food-2', waitTime: 12, slots: 30, reserved: 5 },
  { id: 'q3', name: 'Concession Row – Beverages', zoneId: 'food-3', waitTime: 8, slots: 50, reserved: 15 },
  { id: 'q4', name: 'Merchandise Store – Main Counter', zoneId: 'merch', waitTime: 22, slots: 20, reserved: 12 },
  { id: 'q5', name: 'VIP Lounge – Entrance', zoneId: 'vip', waitTime: 5, slots: 15, reserved: 6 },
];

// === Incidents ===
const INITIAL_INCIDENTS = [
  { id: 'i1', type: 'crowd', severity: 'high', zone: 'gate-a', message: 'Overcrowding at Gate A entry point', time: '21:15', status: 'active', assignedTo: 'Security Team B' },
  { id: 'i2', type: 'medical', severity: 'medium', zone: 'food-1', message: 'Attendee requires medical attention near Food Court Alpha', time: '21:22', status: 'responding', assignedTo: 'Medic Unit 2' },
  { id: 'i3', type: 'maintenance', severity: 'low', zone: 'restroom-3', message: 'Restroom SW requires cleaning', time: '21:30', status: 'pending', assignedTo: null },
];

// === Staff Members ===
const INITIAL_STAFF = [
  { id: 's1', name: 'Alex Rivera', role: 'Security', location: 'Gate A', status: 'active', avatar: '👮' },
  { id: 's2', name: 'Maria Santos', role: 'Medic', location: 'Medical Center', status: 'responding', avatar: '🏥' },
  { id: 's3', name: 'James Cooper', role: 'Vendor', location: 'Food Court Alpha', status: 'active', avatar: '🍔' },
  { id: 's4', name: 'Lisa Chen', role: 'Operations', location: 'Control Room', status: 'active', avatar: '📋' },
  { id: 's5', name: 'Tom Bradley', role: 'Security', location: 'Gate B', status: 'active', avatar: '👮' },
  { id: 's6', name: 'Sarah Kim', role: 'Customer Service', location: 'Gate C', status: 'active', avatar: '🎫' },
];

// === Notifications ===
const INITIAL_NOTIFICATIONS = [
  { id: 'n1', type: 'warning', message: 'Gate A density reaching 85% capacity', time: '21:28', read: false },
  { id: 'n2', type: 'info', message: 'Halftime starting in 12 minutes — prepare for surge', time: '21:25', read: false },
  { id: 'n3', type: 'success', message: 'Food Court Beta wait time reduced to 12 min', time: '21:20', read: true },
];

// === Zustand Store ===
const useStore = create((set, get) => ({
  // --- User Role & Venue Details ---
  userRole: null, // 'attendee' | 'staff' | 'organizer'
  setUserRole: (role) => set({ userRole: role }),

  // --- Current User (from JWT token after login) ---
  currentUser: (() => {
    try {
      const saved = localStorage.getItem('venueiq_currentUser');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  })(),
  setCurrentUser: (user) => {
    if (user) {
      localStorage.setItem('venueiq_currentUser', JSON.stringify(user));
    } else {
      localStorage.removeItem('venueiq_currentUser');
    }
    set({ currentUser: user });
  },

  activeStadiumId: localStorage.getItem('venueiq_stadium') || null,
  setActiveStadiumId: (id) => {
    localStorage.setItem('venueiq_stadium', id);
    set({ activeStadiumId: id });
  },

  activeBooking: null,
  setActiveBooking: (booking) => set({ activeBooking: booking }),

  // --- Page State ---
  currentPage: 'landing',
  setCurrentPage: (page) => set({ currentPage: page }),
  activeMobileMenu: false,
  setActiveMobileMenu: (v) => set({ activeMobileMenu: v }),

  // --- Venue State ---
  zoneDensities: generateInitialDensities(),
  selectedZone: null,
  setSelectedZone: (zone) => set({ selectedZone: zone }),

  eventPhase: 'First Half',
  setEventPhase: (phase) => set({ eventPhase: phase }),

  totalAttendees: 52847,
  avgWaitTime: 14,
  activeIncidents: 3,
  openGates: 4,

  // --- Queues ---
  queues: QUEUE_ITEMS,
  userReservations: [],
  reserveQueue: (queueId, timeSlot) => {
    const { queues, userReservations } = get();
    const updated = queues.map(q =>
      q.id === queueId ? { ...q, reserved: q.reserved + 1 } : q
    );
    set({
      queues: updated,
      userReservations: [...userReservations, { queueId, timeSlot, id: Date.now() }]
    });
  },

  // --- Incidents ---
  incidents: INITIAL_INCIDENTS,
  addIncident: (incident) => set(state => ({
    incidents: [{ ...incident, id: `i${Date.now()}`, time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) }, ...state.incidents],
    activeIncidents: state.activeIncidents + 1,
  })),
  resolveIncident: (id) => set(state => ({
    incidents: state.incidents.map(i => i.id === id ? { ...i, status: 'resolved' } : i),
    activeIncidents: Math.max(0, state.activeIncidents - 1),
  })),
  updateIncident: (id, updates) => set(state => ({
    incidents: state.incidents.map(i => i.id === id ? { ...i, ...updates } : i),
  })),

  // --- Staff ---
  staff: INITIAL_STAFF,
  updateStaffLocation: (id, location) => set(state => ({
    staff: state.staff.map(s => s.id === id ? { ...s, location } : s),
  })),

  // --- Notifications ---
  notifications: INITIAL_NOTIFICATIONS,
  unreadCount: 2,
  addNotification: (notif) => set(state => ({
    notifications: [{ ...notif, id: `n${Date.now()}`, read: false, time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) }, ...state.notifications],
    unreadCount: state.unreadCount + 1,
  })),
  markAllRead: () => set(state => ({
    notifications: state.notifications.map(n => ({ ...n, read: true })),
    unreadCount: 0,
  })),

  // --- Crowd Predictions (AI output) ---
  predictions: {},
  setPredictions: (preds) => set({ predictions: preds }),

  // --- Server-driven real-time setters (from Socket.io) ---
  setZoneDensitiesFromServer: (densities, tick, phase) => set(state => ({
    zoneDensities: { ...state.zoneDensities, ...densities },
    simulationTick: tick ?? state.simulationTick + 1,
    eventPhase: phase ?? state.eventPhase,
  })),

  setStatsFromServer: (stats) => set({
    totalAttendees: stats.totalAttendees ?? 52847,
    avgWaitTime:    stats.avgWaitTime    ?? 14,
    activeIncidents:stats.activeIncidents?? 3,
    openGates:      stats.openGates      ?? 4,
    eventPhase:     stats.phase          ?? 'First Half',
  }),

  updateQueueFromServer: (updatedQueue) => set(state => ({
    queues: state.queues.map(q => q.id === updatedQueue.id ? { ...q, wait_time: updatedQueue.wait_time } : q),
  })),

  // --- Local simulation tick (fallback when backend is offline) ---
  simulationTick: 0,
  updateSimulation: () => {
    const { zoneDensities, eventPhase, queues } = get();
    const newDensities = { ...zoneDensities };

    // Simulate crowd flow based on event phase
    const phaseMultiplier = {
      'Pre-Game': 0.6, 'Kick-Off': 0.9, 'First Half': 0.5,
      'Half-Time': 1.0, 'Second Half': 0.5, 'Full-Time': 0.95, 'Post-Game': 0.8
    }[eventPhase] || 0.5;

    VENUE_ZONES.forEach(zone => {
      if (zone.type === 'field') return;
      const current = newDensities[zone.id] || 30;
      const noise = (Math.random() - 0.5) * 12;
      const phaseEffect = zone.type === 'gate' ? phaseMultiplier * 20 * (Math.random() - 0.3) : 0;
      const foodSurge = zone.type === 'food' && eventPhase === 'Half-Time' ? 25 * Math.random() : 0;
      newDensities[zone.id] = Math.min(100, Math.max(5, current + noise + phaseEffect + foodSurge));
    });

    // Update queues
    const newQueues = queues.map(q => ({
      ...q,
      waitTime: Math.max(2, q.waitTime + Math.floor((Math.random() - 0.5) * 4)),
    }));

    const totalAtt = get().totalAttendees + Math.floor((Math.random() - 0.3) * 50);
    const avgWait = Math.round(Object.values(newDensities).reduce((a, b) => a + b, 0) / Object.values(newDensities).length / 5);

    set(state => ({
      zoneDensities: newDensities,
      queues: newQueues,
      totalAttendees: Math.max(45000, Math.min(65000, totalAtt)),
      avgWaitTime: Math.max(2, Math.min(40, avgWait)),
      simulationTick: state.simulationTick + 1,
    }));
  },

  // --- Revenue Data ---
  revenueData: [
    { time: '18:00', concessions: 12000, merchandise: 8000, tickets: 0 },
    { time: '18:30', concessions: 28000, merchandise: 15000, tickets: 0 },
    { time: '19:00', concessions: 45000, merchandise: 22000, tickets: 5000 },
    { time: '19:30', concessions: 67000, merchandise: 31000, tickets: 8000 },
    { time: '20:00', concessions: 82000, merchandise: 38000, tickets: 12000 },
    { time: '20:30', concessions: 91000, merchandise: 41000, tickets: 15000 },
    { time: '21:00', concessions: 105000, merchandise: 48000, tickets: 18000 },
    { time: '21:30', concessions: 128000, merchandise: 55000, tickets: 20000 },
  ],

  // --- Crowd Flow Historical Data ---
  crowdFlowHistory: Array.from({ length: 12 }, (_, i) => ({
    time: `${18 + Math.floor(i / 2)}:${i % 2 === 0 ? '00' : '30'}`,
    attendees: Math.floor(5000 + i * 4000 + Math.random() * 2000),
    exiting: Math.floor(i > 8 ? (i - 8) * 3000 : 500),
  })),
}));

export default useStore;

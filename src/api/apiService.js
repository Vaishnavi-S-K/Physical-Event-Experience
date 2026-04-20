/**
 * VenueIQ API Service
 * Connects the React frontend to the Express backend.
 * 
 * Base URL: http://localhost:4000/api
 * Auth: Bearer JWT token stored in localStorage
 */

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

// ============================================================
//  HTTP Utilities
// ============================================================

function getToken() {
  return localStorage.getItem('venueiq_token');
}

function setToken(token) {
  localStorage.setItem('venueiq_token', token);
}

function clearToken() {
  localStorage.removeItem('venueiq_token');
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return res.json();
}

const get  = (path, opts) => request(path, { method: 'GET', ...opts });
const post = (path, body, opts) => request(path, { method: 'POST', body: JSON.stringify(body), ...opts });
const patch = (path, body, opts) => request(path, { method: 'PATCH', body: JSON.stringify(body), ...opts });
const del  = (path, opts) => request(path, { method: 'DELETE', ...opts });

// ============================================================
//  Auth API
// ============================================================
export const auth = {
  login: async (email, password) => {
    const data = await post('/auth/login', { email, password });
    setToken(data.token);
    return data;
  },
  register: (data) => post('/auth/register', data),
  logout: async () => {
    try { await post('/auth/logout', {}); } catch {}
    clearToken();
  },
  me: () => get('/auth/me'),
  getToken,
  clearToken,
};

// ============================================================
//  Stadiums & Bookings API
// ============================================================

export const bookings = {
  create: (data) => post('/bookings', data),
  getMyBookings: (email) => get(`/bookings/mine?email=${encodeURIComponent(email)}`),
};

export const stadiums = {
  getAll:  () => get('/stadiums'),
  getById: (id) => get(`/stadiums/${id}`),
};

const getS = () => {
  const sid = localStorage.getItem('venueiq_stadium');
  return sid ? `?stadiumId=${sid}` : '';
};
const getSQ = (existing) => {
  const sid = localStorage.getItem('venueiq_stadium');
  return sid ? (existing ? `&stadiumId=${sid}` : `?stadiumId=${sid}`) : '';
};

// ============================================================
//  Zones API
// ============================================================
export const zones = {
  getAll:         ()         => get(`/zones${getS()}`),
  getDensityMap:  ()         => get(`/zones/density/all${getS()}`),
  getById:        (id)       => get(`/zones/${id}${getS()}`),
  postDensity:    (zone_id, density) => post('/zones/density', { zone_id, density }),
};

// ============================================================
//  Queues API
// ============================================================
export const queues = {
  getAll:         ()         => get(`/queues${getS()}`),
  getById:        (id)       => get(`/queues/${id}${getS()}`),
  reserve:        (id)       => post(`/queues/${id}/reserve`, {}),
  getMyReservations: ()      => get(`/queues/reservations/mine${getS()}`),
  cancelReservation: (id)    => del(`/queues/reservations/${id}`),
  update:         (id, data) => patch(`/queues/${id}`, data),
};

// ============================================================
//  Incidents API
// ============================================================
export const incidents = {
  getAll:    (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    return get(`/incidents${params ? `?${params}` : ''}${getSQ(params)}`);
  },
  getStats:  ()              => get(`/incidents/stats${getS()}`),
  create:    (data)          => post('/incidents', data),
  update:    (id, data)      => patch(`/incidents/${id}`, data),
  resolve:   (id)            => patch(`/incidents/${id}`, { status: 'resolved' }),
  delete:    (id)            => del(`/incidents/${id}`),
};

// ============================================================
//  Event API
// ============================================================
export const event = {
  getState:      ()           => get(`/event/state${getS()}`),
  updateState:   (data)       => patch('/event/state', data),
  getSchedule:   ()           => get(`/event/schedule${getS()}`),
  updateSchedule:(id, status) => patch(`/event/schedule/${id}`, { status }),
  getStaff:      ()           => get(`/event/staff${getS()}`),
  updateStaff:   (id, data)   => patch(`/event/staff/${id}`, data),
  getNotifications: ()        => get(`/event/notifications${getS()}`),
  createNotification: (data)  => post('/event/notifications', data),
  analytics: {
    revenue:    ()             => get(`/event/analytics/revenue${getS()}`),
    crowdFlow:  ()             => get(`/event/analytics/crowd-flow${getS()}`),
    zoneStats:  ()             => get(`/event/analytics/zone-stats${getS()}`),
  },
};

// ============================================================
//  Gates & Crowd Tracking API
// ============================================================
export const gates = {
  scan: (data) => post('/gates/scan', data),
  getTraffic: (query = {}) => {
    const params = new URLSearchParams(query).toString();
    return get(`/gates/traffic?${params}`);
  },
  getScans: (query = {}) => {
    const params = new URLSearchParams(query).toString();
    return get(`/gates/scans?${params}`);
  },
  getStats: (query = {}) => {
    const params = new URLSearchParams(query).toString();
    return get(`/gates/stats?${params}`);
  },
};

export const crowdPredictions = {
  generate: (data) => post('/crowd-predictions/generate', data),
  getLatest: (query = {}) => {
    const params = new URLSearchParams(query).toString();
    return get(`/crowd-predictions/latest?${params}`);
  },
  getHistory: (query = {}) => {
    const params = new URLSearchParams(query).toString();
    return get(`/crowd-predictions/history?${params}`);
  },
  getAlerts: (query = {}) => {
    const params = new URLSearchParams(query).toString();
    return get(`/crowd-predictions/alerts?${params}`);
  },
  getByZone: (zoneId, query = {}) => {
    const params = new URLSearchParams(query).toString();
    return get(`/crowd-predictions/by-zone/${zoneId}?${params}`);
  },
};

// ============================================================
//  Health Check
// ============================================================
export const health = {
  check: () => get('/health'),
};

/**
 * useSocket — React hook for Socket.io real-time updates
 *
 * Connects to the VenueIQ backend on mount, joins role room,
 * and wires all server events to the Zustand store.
 *
 * Events handled:
 *   crowd:update  → updates zoneDensities + simulationTick
 *   stats:update  → updates totalAttendees, avgWaitTime, activeIncidents
 *   queue:update  → updates individual queue wait times
 *   notification:new → pushes new notification
 */

import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import useStore from '../store/useStore';
import { auth as authApi } from '../api/apiService';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '';

export function useSocket() {
  const socketRef = useRef(null);
  const {
    userRole,
    setZoneDensitiesFromServer,
    setStatsFromServer,
    updateQueueFromServer,
    addNotification,
  } = useStore();

  useEffect(() => {
    if (!userRole) return;

    // Connect
    const socket = io(SOCKET_URL, {
      auth: { token: authApi.getToken() },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket.id);
      // Join role-specific room for targeted notifications
      socket.emit('join:role', userRole);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
    });

    socket.on('connect_error', (err) => {
      console.warn('[Socket] Connection error:', err.message);
    });

    // === Real-time event handlers ===

    socket.on('crowd:update', ({ densities, tick, phase }) => {
      if (setZoneDensitiesFromServer) {
        setZoneDensitiesFromServer(densities, tick, phase);
      }
    });

    socket.on('stats:update', (stats) => {
      if (setStatsFromServer) {
        setStatsFromServer(stats);
      }
    });

    socket.on('queue:update', (queue) => {
      if (updateQueueFromServer) {
        updateQueueFromServer(queue);
      }
    });

    socket.on('notification:new', (notif) => {
      addNotification(notif);
    });

    socket.on('incident:new', (incident) => {
      // Refetch or add directly — handled by component polling for now
      console.log('[Socket] New incident:', incident.id);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [userRole]);

  return socketRef;
}

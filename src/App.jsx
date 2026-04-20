import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import useStore from './store/useStore';
import LandingPage from './pages/LandingPage';
import RegisterPage from './pages/RegisterPage';
import AttendeeDashboard from './pages/AttendeeDashboard';
import StaffPortal from './pages/StaffPortal';
import OrganizerDashboard from './pages/OrganizerDashboard';
import Navbar from './components/Navbar';
import CrowdPredictions from './components/CrowdPredictions';
import RealTimeCrowdDashboard from './components/RealTimeCrowdDashboard';
import IncidentBoard from './components/IncidentBoard';
import StaffDispatch from './components/StaffDispatch';
import { useSocket } from './hooks/useSocket';
import { health as healthApi } from './api/apiService';

// Page-level animation variants
const pageVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

export default function App() {
  const { userRole, currentPage, updateSimulation, addNotification, simulationTick, setCurrentPage } = useStore();
  const [backendOnline, setBackendOnline] = useState(false);

  // === Socket.io real-time connection ===
  useSocket();

  // === Backend health check ===
  useEffect(() => {
    const checkHealth = async () => {
      try {
        await healthApi.check();
        setBackendOnline(true);
      } catch {
        setBackendOnline(false);
      }
    };
    checkHealth();
    const hInterval = setInterval(checkHealth, 15000);
    return () => clearInterval(hInterval);
  }, []);

  // === Real-time simulation (every 3 seconds) ===
  useEffect(() => {
    const intervalId = setInterval(() => {
      updateSimulation();
    }, 3000);
    return () => clearInterval(intervalId);
  }, [updateSimulation]);

  // === Smart notification triggers ===
  useEffect(() => {
    if (simulationTick > 0 && simulationTick % 8 === 0) {
      const { zoneDensities } = useStore.getState();
      const criticalZones = Object.entries(zoneDensities).filter(([, d]) => d > 82);
      if (criticalZones.length > 0) {
        addNotification({
          type: 'warning',
          message: `⚠️ High density detected in ${criticalZones.length} zone(s). Consider crowd dispersal measures.`,
        });
      }
    }
  }, [simulationTick, addNotification]);

  // === Routing ===
  const renderPage = () => {
    // Unauthenticated pages
    if (!userRole) {
      if (currentPage === 'register') {
        return <RegisterPage onBack={() => setCurrentPage('landing')} onRegisterSuccess={() => setCurrentPage('landing')} />;
      }
      return <LandingPage />;
    }

    // Authenticated — role-based routing
    if (userRole === 'attendee') {
      return <AttendeeDashboard />;
    }
    
    // Staff routing
    if (userRole === 'staff') {
      if (currentPage === 'crowd-monitoring') return <RealTimeCrowdDashboard />;
      if (currentPage === 'incidents') return <IncidentBoard />;
      if (currentPage === 'dispatch') return <StaffDispatch />;
      // Default to staff-dashboard
      return <StaffPortal />;
    }
    
    // Organizer routing
    if (userRole === 'organizer') {
      if (currentPage === 'predictions') return <CrowdPredictions />;
      if (currentPage === 'crowd-monitoring') return <RealTimeCrowdDashboard />;
      if (currentPage === 'operations') return <IncidentBoard />; // Reuse IncidentBoard for operations
      // Default to organizer-dashboard
      return <OrganizerDashboard />;
    }
    
    return <LandingPage />;
  };

  const page = renderPage();
  const showUnauthenticated = !userRole;

  if (showUnauthenticated) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPage}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {page}
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="app"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="app-layout"
      >
        <Navbar />
        {/* Backend status badge */}
        <div style={{
          position: 'fixed', bottom: 20, left: 270, zIndex: 200,
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '5px 12px', borderRadius: 20,
          background: backendOnline ? 'rgba(0,230,118,0.1)' : 'rgba(255,107,53,0.1)',
          border: `1px solid ${backendOnline ? 'rgba(0,230,118,0.3)' : 'rgba(255,107,53,0.3)'}`,
          fontSize: '0.72rem', fontWeight: 600, pointerEvents: 'none',
        }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: backendOnline ? 'var(--color-green)' : 'var(--color-orange)' }} />
          <span style={{ color: backendOnline ? 'var(--color-green)' : 'var(--color-orange)' }}>
            {backendOnline ? 'Backend ● :4000' : 'Backend Offline (sim mode)'}
          </span>
        </div>
        <main className="main-content">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
              {page}
            </motion.div>
          </AnimatePresence>
        </main>
      </motion.div>
    </AnimatePresence>
  );
}

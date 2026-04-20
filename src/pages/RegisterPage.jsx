import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, User, ArrowLeft, Building2 } from 'lucide-react';

export default function RegisterPage({ onBack, onRegisterSuccess }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('attendee');
  const [stadiumId, setStadiumId] = useState('');
  const [stadiums, setStadiums] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    import('../api/apiService').then(({ stadiums: stApi }) => {
      stApi.getAll().then(res => setStadiums(res)).catch(() => {});
    });
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (role === 'staff' && !stadiumId) {
      setError('Staff must select an assigned stadium');
      setLoading(false);
      return;
    }

    try {
      const { auth: authApi } = await import('../api/apiService');
      const res = await authApi.register({ name, email, password, role, stadium_id: stadiumId });
      
      let msg = 'Registration successful! You can now log in.';
      if (res.status === 'pending') {
        msg = 'Registration successful. Your staff account is pending approval from the organizer.';
      }
      
      alert(msg);
      onRegisterSuccess();
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="card main-dashboard-layer"
      style={{
        maxWidth: 400,
        margin: '60px auto',
        padding: '30px 40px',
        textAlign: 'center',
        background: 'var(--surface)',
      }}
    >
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20 }}>
        <ArrowLeft size={16} /> Back to Login
      </button>

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(0, 212, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <User size={24} color="var(--color-electric-blue)" />
        </div>
      </div>
      
      <h2 style={{ marginBottom: 8, fontSize: '1.5rem' }}>Create Account</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 24 }}>
        Join VenueIQ to manage your upcoming events.
      </p>

      {error && (
        <div style={{ background: 'rgba(255,23,68,0.1)', color: '#FF1744', padding: '10px', borderRadius: 8, fontSize: '0.85rem', marginBottom: 20 }}>
          {error}
        </div>
      )}

      <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ position: 'relative' }}>
          <User size={18} style={{ position: 'absolute', left: 14, top: 14, color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Full Name"
            value={name} onChange={e => setName(e.target.value)}
            style={{ width: '100%', padding: '12px 12px 12px 42px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'white' }}
            required
          />
        </div>
        <div style={{ position: 'relative' }}>
          <Mail size={18} style={{ position: 'absolute', left: 14, top: 14, color: 'var(--text-muted)' }} />
          <input
            type="email"
            placeholder="Email Address"
            value={email} onChange={e => setEmail(e.target.value)}
            style={{ width: '100%', padding: '12px 12px 12px 42px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'white' }}
            required
          />
        </div>
        <div style={{ position: 'relative' }}>
          <Lock size={18} style={{ position: 'absolute', left: 14, top: 14, color: 'var(--text-muted)' }} />
          <input
            type="password"
            placeholder="Password"
            value={password} onChange={e => setPassword(e.target.value)}
            style={{ width: '100%', padding: '12px 12px 12px 42px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'white' }}
            required
          />
        </div>
        
        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" onClick={() => setRole('attendee')} style={{ flex: 1, padding: '10px', background: role === 'attendee' ? 'rgba(0,212,255,0.2)' : 'rgba(255,255,255,0.05)', border: `1px solid ${role === 'attendee' ? 'var(--color-electric-blue)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 8, color: 'white', cursor: 'pointer' }}>
            Attendee
          </button>
          <button type="button" onClick={() => setRole('staff')} style={{ flex: 1, padding: '10px', background: role === 'staff' ? 'rgba(124,77,255,0.2)' : 'rgba(255,255,255,0.05)', border: `1px solid ${role === 'staff' ? 'var(--color-purple)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 8, color: 'white', cursor: 'pointer' }}>
            Staff
          </button>
        </div>

        {role === 'staff' && (
          <div style={{ position: 'relative' }}>
            <Building2 size={18} style={{ position: 'absolute', left: 14, top: 14, color: 'var(--text-muted)' }} />
            <select
              value={stadiumId} onChange={e => setStadiumId(e.target.value)}
              style={{ width: '100%', padding: '12px 12px 12px 42px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'white', appearance: 'none' }}
              required={role === 'staff'}
            >
              <option value="" disabled>Select Assigned Stadium</option>
              {stadiums.map(s => (
                <option key={s.id} value={s.id} style={{color: 'black'}}>{s.name}</option>
              ))}
            </select>
          </div>
        )}

        <button
          type="submit"
          className="btn-primary"
          style={{ width: '100%', padding: '14px', borderRadius: 8, fontWeight: 600, fontSize: '1rem', marginTop: 10 }}
          disabled={loading}
        >
          {loading ? 'Registering...' : 'Complete Registration'}
        </button>
      </form>
    </motion.div>
  );
}

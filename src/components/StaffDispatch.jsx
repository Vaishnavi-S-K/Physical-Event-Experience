import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Users, MapPin, Phone, AlertCircle, CheckCircle, Clock, MessageSquare, Send } from 'lucide-react';
import useStore from '../store/useStore';

const STAFF_ROLES = [
  { id: 1, name: 'Raj Kumar', role: 'Security Lead', location: 'Gate North', status: 'active', phone: '+91-9876543210' },
  { id: 2, name: 'Priya Singh', role: 'Crowd Manager', location: 'Food Court East', status: 'active', phone: '+91-9876543211' },
  { id: 3, name: 'Amit Patel', role: 'First Aid', location: 'Medical Station', status: 'on-break', phone: '+91-9876543212' },
  { id: 4, name: 'Neha Sharma', role: 'Ushering', location: 'Seating Level 2', status: 'active', phone: '+91-9876543213' },
  { id: 5, name: 'Vikram Das', role: 'Parking', location: 'Lot A', status: 'idle', phone: '+91-9876543214' },
];

function StaffCard({ member, onContact }) {
  const statusColors = {
    active: 'var(--color-green)',
    'on-break': 'var(--color-yellow)',
    idle: 'var(--text-muted)',
  };
  const color = statusColors[member.status] || 'var(--text-muted)';

  return (
    <motion.div
      layout
      className="card"
      style={{
        padding: '14px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
      }}
      whileHover={{ y: -2 }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: `${color}18`,
              border: `2px solid ${color}40`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Users size={16} color={color} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{member.name}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{member.role}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        <div style={{ textAlign: 'right', minWidth: '120px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
            <MapPin size={12} /> {member.location}
          </div>
          <div
            style={{
              fontSize: '0.7rem',
              padding: '3px 8px',
              borderRadius: 12,
              background: `${color}15`,
              color,
              border: `1px solid ${color}30`,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              fontWeight: 600,
              display: 'inline-block',
            }}
          >
            {member.status.replace('-', ' ')}
          </div>
        </div>
        <button
          onClick={() => onContact(member)}
          style={{
            padding: '8px 12px',
            background: 'var(--color-purple)',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: '0.8rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <Phone size={14} />
          Contact
        </button>
      </div>
    </motion.div>
  );
}

export default function StaffDispatch() {
  const { currentUser } = useStore();
  const [staff, setStaff] = useState(STAFF_ROLES);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [messages, setMessages] = useState({});
  const [messageText, setMessageText] = useState('');

  const handleContact = (member) => {
    setSelectedStaff(member);
    if (!messages[member.id]) {
      setMessages((prev) => ({ ...prev, [member.id]: [] }));
    }
  };

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedStaff) return;

    setMessages((prev) => ({
      ...prev,
      [selectedStaff.id]: [
        ...(prev[selectedStaff.id] || []),
        { sender: 'You', text: messageText, time: new Date() },
      ],
    }));
    setMessageText('');
  };

  const activeStaff = staff.filter((s) => s.status === 'active').length;
  const onBreakStaff = staff.filter((s) => s.status === 'on-break').length;
  const idleStaff = staff.filter((s) => s.status === 'idle').length;

  return (
    <div style={{ padding: '20px', display: 'flex', gap: 20, height: 'calc(100vh - 80px)', overflow: 'hidden' }}>
      {/* Left Panel - Staff List */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'linear-gradient(135deg, rgba(255,107,53,0.12) 0%, rgba(255,23,68,0.06) 100%)',
            border: '1px solid rgba(255,107,53,0.25)',
            borderRadius: 16,
            padding: '16px 20px',
            marginBottom: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Users size={18} color="var(--color-orange)" />
            <span style={{ fontSize: '0.8rem', color: 'var(--color-orange)', fontWeight: 700, letterSpacing: '0.1em' }}>STAFF DISPATCH</span>
          </div>
          <h2 style={{ fontSize: '1.3rem', marginBottom: 8 }}>Team Coordination</h2>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              ✓ <strong>{activeStaff}</strong> Active
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              ⏸ <strong>{onBreakStaff}</strong> On Break
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              — <strong>{idleStaff}</strong> Idle
            </div>
          </div>
        </motion.div>

        {/* Staff List */}
        <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {staff.map((member) => (
            <StaffCard
              key={member.id}
              member={member}
              onContact={handleContact}
            />
          ))}
        </div>
      </div>

      {/* Right Panel - Chat */}
      {selectedStaff && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          style={{
            width: '320px',
            background: 'var(--color-bg-card)',
            border: '1px solid var(--border-card)',
            borderRadius: 16,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Chat Header */}
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontWeight: 600 }}>{selectedStaff.name}</div>
              <button
                onClick={() => setSelectedStaff(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '1rem',
                }}
              >
                ✕
              </button>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{selectedStaff.role}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
              <MapPin size={11} /> {selectedStaff.location}
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflow: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {messages[selectedStaff.id]?.map((msg, idx) => (
              <div key={idx} style={{ textAlign: msg.sender === 'You' ? 'right' : 'left' }}>
                <div
                  style={{
                    padding: '8px 12px',
                    borderRadius: 10,
                    background: msg.sender === 'You' ? 'var(--color-purple)' : 'var(--border-card)',
                    color: msg.sender === 'You' ? 'white' : 'var(--text-primary)',
                    fontSize: '0.85rem',
                    lineHeight: '1.4',
                    display: 'inline-block',
                    maxWidth: '90%',
                    wordWrap: 'break-word',
                  }}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: 8 }}>
            <input
              type="text"
              placeholder="Type message..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              style={{
                flex: 1,
                padding: '8px 10px',
                background: 'var(--border-subtle)',
                border: '1px solid var(--border-card)',
                borderRadius: 8,
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
              }}
            />
            <button
              onClick={handleSendMessage}
              style={{
                padding: '8px 10px',
                background: 'var(--color-purple)',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Send size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

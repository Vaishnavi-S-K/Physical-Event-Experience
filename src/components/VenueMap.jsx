import React from 'react';
import { motion } from 'framer-motion';

export default function VenueMap({ zones = [], height = 580, stadiumId: propStadiumId }) {
  // Determine which image to show based on stadiumId prop or zones data
  const stadiumImages = {
    's1': '/Chinnaswamy_stadium.webp',
    's2': '/kanteevera_stadium.jpg',
    's3': '/wankhede-stadium.jpg',
    's4': '/Eden_Gardens.jpg',
    's5': '/SNR_stadium.png',
    's6': '/Rajiv_gandhi.jpeg',
    's7': '/JSCA.jpg',
    's8': '/mca-stadium-pune.jpg',
    's9': '/pandit-jawaharlal-nehru-stadium.jpg',
    's10': '/Nehru_stadium.jpg',
    'default': '/Chinnaswamy_stadium.webp'
  };

  // Use prop stadiumId, then zones data, then localStorage, then default
  let stadiumId = propStadiumId;
  console.log('[VenueMap] propStadiumId received:', propStadiumId);
  if (!stadiumId && zones.length > 0 && zones[0].stadium_id) {
    stadiumId = zones[0].stadium_id;
    console.log('[VenueMap] Using zones[0].stadium_id:', stadiumId);
  }
  if (!stadiumId) {
    const local = localStorage.getItem('venueiq_stadium') || 's1';
    stadiumId = local;
    console.log('[VenueMap] Using localStorage/default:', stadiumId);
  }
  console.log('[VenueMap] FINAL stadiumId:', stadiumId, '-> Image:', stadiumImages[stadiumId]);

  const bgUrl = stadiumImages[stadiumId] || stadiumImages.default;

  // Stadium names for display
  const stadiumNames = {
    's1': 'M. Chinnaswamy Stadium',
    's2': 'Sree Kanteerava Stadium',
    's3': 'Wankhede Stadium',
    's4': 'Eden Gardens',
    's5': 'Arun Jaitley Stadium',
    's6': 'Rajiv Gandhi Khel Mandira',
    's7': 'JSCA International Cricket Stadium',
    's8': 'Maharashtra Cricket Association Stadium',
    's9': 'Jawaharlal Nehru Stadium',
    's10': 'Narendra Modi Stadium'
  };

  const stadiumName = stadiumNames[stadiumId] || 'Stadium';

  return (
    <div style={{
      width: '100%',
      height: height,
      position: 'relative',
      borderRadius: 16,
      overflow: 'hidden',
      background: '#080C18',
      border: '1px solid rgba(255,255,255,0.08)'
    }}>
      <motion.img 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        src={bgUrl} 
        alt={stadiumName}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block'
        }}
      />
      {/* Stadium name overlay */}
      <div style={{
        position: 'absolute',
        bottom: 16,
        left: 16,
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(8px)',
        padding: '8px 12px',
        borderRadius: 8,
        color: 'rgba(255, 255, 255, 0.9)',
        fontSize: '0.85rem',
        fontWeight: 600
      }}>
        {stadiumName}
      </div>
    </div>
  );
}

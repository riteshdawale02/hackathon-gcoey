import React, { useState, useEffect, useRef } from 'react';
import { Tv, Volume2, VolumeX, Activity, Clock, BellRing, Building } from 'lucide-react';
import { queueApi } from '../services/api';
import { announcer } from '../utils/audioAnnouncer';

export default function DisplayPage() {
  const [displayData, setDisplayData] = useState({
    nowServing: [
      {
        tokenNumber: 'CARD-002',
        departmentCode: 'CARD',
        patientName: 'John Doe',
        doctorName: 'Dr. Rajesh Sharma',
        roomNumber: 'Room 101',
      },
      {
        tokenNumber: 'GEN-001',
        departmentCode: 'GEN',
        patientName: 'Sarah Connor',
        doctorName: 'Dr. Emily Chen',
        roomNumber: 'Room 203',
      },
    ],
    upcoming: [
      { tokenNumber: 'CARD-003', departmentCode: 'CARD', isPriority: false, position: 1 },
      { tokenNumber: 'CARD-004', departmentCode: 'CARD', isPriority: true, position: 2 },
      { tokenNumber: 'GEN-002', departmentCode: 'GEN', isPriority: false, position: 3 },
      { tokenNumber: 'ORTH-001', departmentCode: 'ORTH', isPriority: false, position: 4 },
    ],
  });

  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const [soundEnabled, setSoundEnabled] = useState(true);
  const previousServingRef = useRef([]);

  // Digital clock update
  useEffect(() => {
    const clock = setInterval(() => setCurrentTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(clock);
  }, []);

  // Poll display endpoint every 5 seconds
  const fetchDisplay = async () => {
    try {
      const res = await queueApi.getDisplayQueue();
      const current = res.data;

      // Check if new call has appeared
      if (current.nowServing && current.nowServing.length > 0) {
        const prevTokens = previousServingRef.current.map((t) => t.tokenNumber);
        const newlyCalled = current.nowServing.find((t) => !prevTokens.includes(t.tokenNumber));

        if (newlyCalled && soundEnabled) {
          announcer.announceToken(newlyCalled.tokenNumber, newlyCalled.roomNumber, newlyCalled.doctorName);
        }
        previousServingRef.current = current.nowServing;
      }

      setDisplayData(current);
    } catch (err) {
      console.log('Display polling fallback');
    }
  };

  useEffect(() => {
    fetchDisplay();
    const interval = setInterval(fetchDisplay, 3000);
    const handleUpdate = () => fetchDisplay();
    window.addEventListener('pulsequeue_updated', handleUpdate);
    return () => {
      clearInterval(interval);
      window.removeEventListener('pulsequeue_updated', handleUpdate);
    };
  }, [soundEnabled]);

  return (
    <div className="tv-display-layout">
      {/* Broadcast Header */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingBottom: '24px',
          borderBottom: '2px solid #1e293b',
          marginBottom: '32px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '54px',
              height: '54px',
              background: 'linear-gradient(135deg, #0284c7, #0d9488)',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 24px rgba(2, 132, 199, 0.4)',
            }}
          >
            <Activity size={32} color="#ffffff" />
          </div>
          <div>
            <h1 style={{ fontSize: '2.4rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em' }}>
              PulseQueue Hospital Broadcast
            </h1>
            <div style={{ color: '#94a3b8', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="live-indicator">
                <span className="live-dot"></span>
                <span>LIVE SYSTEM FEED</span>
              </span>
              <span>• Auto-updates every 5s</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <button
            onClick={() => {
              announcer.initAudioContext();
              setSoundEnabled(!soundEnabled);
              if (!soundEnabled) announcer.playChime();
            }}
            style={{
              background: soundEnabled ? '#0f172a' : '#334155',
              border: '1px solid #334155',
              color: soundEnabled ? '#38bdf8' : '#94a3b8',
              padding: '10px 18px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.95rem',
            }}
          >
            {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
            <span>{soundEnabled ? 'Chime Active' : 'Chime Muted'}</span>
          </button>

          <div
            style={{
              fontSize: '2.2rem',
              fontWeight: 800,
              fontFamily: 'monospace',
              background: '#0f172a',
              border: '1px solid #334155',
              padding: '6px 20px',
              borderRadius: '12px',
              color: '#38bdf8',
            }}
          >
            {currentTime}
          </div>
        </div>
      </header>

      {/* Main Screen Layout: Large "NOW SERVING" Grid on Left, "UPCOMING" Column on Right */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
        {/* Left: NOW SERVING */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <span
              style={{
                fontSize: '1.4rem',
                fontWeight: 800,
                color: '#38bdf8',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}
            >
              🔔 Now Serving in Consultation Rooms
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {(!displayData.nowServing || displayData.nowServing.length === 0) ? (
              <div
                style={{
                  background: '#0f172a',
                  border: '1px dashed #334155',
                  padding: '60px',
                  borderRadius: '16px',
                  textAlign: 'center',
                  color: '#94a3b8',
                  fontSize: '1.2rem',
                }}
              >
                No consultations actively in progress. Doctors will call upcoming tokens shortly.
              </div>
            ) : (
              displayData.nowServing.map((item, idx) => (
                <div
                  key={item.tokenNumber || idx}
                  style={{
                    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                    border: '2px solid #0284c7',
                    borderRadius: '18px',
                    padding: '24px 32px',
                    boxShadow: '0 10px 30px rgba(2, 132, 199, 0.25)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      <span
                        style={{
                          background: '#0284c7',
                          color: '#ffffff',
                          fontWeight: 800,
                          fontSize: '0.85rem',
                          padding: '4px 12px',
                          borderRadius: '6px',
                        }}
                      >
                        {item.departmentCode} OPD
                      </span>
                      <span style={{ color: '#38bdf8', fontWeight: 700, fontSize: '0.9rem' }}>
                        PROCEED INSIDE
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: '4.5rem',
                        fontWeight: 900,
                        fontFamily: 'var(--font-heading)',
                        color: '#ffffff',
                        lineHeight: 1.05,
                        textShadow: '0 0 20px rgba(56, 189, 248, 0.4)',
                      }}
                    >
                      {item.tokenNumber}
                    </div>
                    <div style={{ fontSize: '1.25rem', color: '#cbd5e1', fontWeight: 600, marginTop: '8px' }}>
                      Patient: {item.patientName}
                    </div>
                  </div>

                  {/* Room & Doctor Box */}
                  <div
                    style={{
                      background: '#0284c7',
                      color: '#ffffff',
                      borderRadius: '14px',
                      padding: '20px 28px',
                      textAlign: 'center',
                      minWidth: '220px',
                    }}
                  >
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.05em', opacity: 0.9 }}>
                      DESTINATION
                    </div>
                    <div style={{ fontSize: '2.2rem', fontWeight: 900 }}>
                      {item.roomNumber || 'Room 101'}
                    </div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 600, opacity: 0.95, marginTop: '4px' }}>
                      {item.doctorName || 'Attending Doctor'}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: UP NEXT QUEUE */}
        <div
          style={{
            background: '#0f172a',
            border: '1px solid #1e293b',
            borderRadius: '18px',
            padding: '24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc' }}>
              ⏳ Up Next in Queue
            </h2>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
              {displayData.upcoming?.length || 0} waiting
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {(!displayData.upcoming || displayData.upcoming.length === 0) ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                Waiting lobby is clear!
              </div>
            ) : (
              displayData.upcoming.map((item, idx) => (
                <div
                  key={item.tokenNumber || idx}
                  style={{
                    background: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '10px',
                    padding: '12px 16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ color: '#64748b', fontWeight: 800, fontSize: '0.95rem' }}>#{idx + 1}</span>
                    <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#38bdf8' }}>
                      {item.tokenNumber}
                    </span>
                    {item.isPriority && (
                      <span className="badge badge-priority" style={{ fontSize: '0.65rem' }}>PRIORITY</span>
                    )}
                  </div>
                  <span
                    style={{
                      background: '#334155',
                      color: '#cbd5e1',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                    }}
                  >
                    {item.departmentCode}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

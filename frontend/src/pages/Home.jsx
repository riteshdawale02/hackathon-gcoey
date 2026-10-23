import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  Users,
  Stethoscope,
  Tv,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import { queueApi } from '../services/api';

export default function Home() {
  const [stats, setStats] = useState({
    totalToday: 7,
    totalWaiting: 4,
    totalInProgress: 2,
    totalCompleted: 1,
  });

  useEffect(() => {
    queueApi.getOverallStats()
      .then((res) => setStats(res.data))
      .catch((err) => console.log('Using default stats preview:', err.message));
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Hero Section */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)',
          border: '1px solid #bae6fd',
          padding: '40px 32px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ maxWidth: '720px', position: 'relative', zIndex: 2 }}>
          <div
            className="badge badge-progress"
            style={{ marginBottom: '16px', display: 'inline-flex' }}
          >
            <Sparkles size={14} />
            <span>Digital Hospital Flow Platform</span>
          </div>
          <h1 className="hero-title" style={{ marginBottom: '16px', color: '#0f172a' }}>
            Smart Hospital Token &amp; Live Queue System
          </h1>
          <p style={{ fontSize: '1.1rem', color: '#475569', lineHeight: 1.6, marginBottom: '24px' }}>
            Eliminate waiting room chaos. Automate patient check-in, generate departmental tokens,
            provide real-time wait time estimates, and empower doctors with one-click queue management.
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Link to="/patient" className="btn btn-primary btn-lg">
              <span>Patient Check-in / Track Token</span>
              <ArrowRight size={18} />
            </Link>
            <Link to="/display" target="_blank" className="btn btn-outline btn-lg">
              <Tv size={18} />
              <span>Launch Lobby TV Display</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Live Hospital Metrics */}
      <div className="grid-4">
        <div className="stat-card">
          <div>
            <div className="stat-label">Total Registered Today</div>
            <div className="stat-val" style={{ color: '#0284c7' }}>{stats.totalToday || 7}</div>
          </div>
          <div className="stat-icon" style={{ background: '#e0f2fe', color: '#0284c7' }}>
            <Users size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-label">Currently Waiting</div>
            <div className="stat-val" style={{ color: '#d97706' }}>{stats.totalWaiting || 4}</div>
          </div>
          <div className="stat-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
            <Clock size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-label">In Consultation</div>
            <div className="stat-val" style={{ color: '#4f46e5' }}>{stats.totalInProgress || 2}</div>
          </div>
          <div className="stat-icon" style={{ background: '#ede9fe', color: '#4f46e5' }}>
            <Stethoscope size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-label">Completed Consults</div>
            <div className="stat-val" style={{ color: '#10b981' }}>{stats.totalCompleted || 1}</div>
          </div>
          <div className="stat-icon" style={{ background: '#d1fae5', color: '#10b981' }}>
            <CheckCircle2 size={24} />
          </div>
        </div>
      </div>

      {/* Modules Selector for Presentation Walkthrough */}
      <div>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '16px' }}>Interactive Hackathon Demo Portals</h2>
        <div className="grid-2">
          {/* Patient Card */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                <div className="brand-icon" style={{ background: '#0284c7' }}>
                  <Users size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem' }}>1. Patient Self-Service Portal</h3>
                  <p style={{ fontSize: '0.88rem', color: '#64748b' }}>For mobile patient smartphones or kiosks</p>
                </div>
              </div>
              <p style={{ color: '#475569', fontSize: '0.94rem', marginBottom: '20px' }}>
                Self-register with name, age, and department. Instant token generation with live queue counter,
                estimated wait time calculation, and turn alert notification.
              </p>
            </div>
            <Link to="/patient" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
              <span>Open Patient Portal</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          {/* Receptionist Card */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                <div className="brand-icon" style={{ background: '#0d9488' }}>
                  <Activity size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem' }}>2. Reception / Triage Desk</h3>
                  <p style={{ fontSize: '0.88rem', color: '#64748b' }}>Front office walk-in patient manager</p>
                </div>
              </div>
              <p style={{ color: '#475569', fontSize: '0.94rem', marginBottom: '20px' }}>
                Rapid walk-in registration, phone lookup, department triage, and emergency priority
                tagging that jumps patients ahead in the queue.
              </p>
            </div>
            <Link to="/reception" className="btn btn-outline" style={{ alignSelf: 'flex-start' }}>
              <span>Open Reception Desk</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          {/* Doctor Card */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                <div className="brand-icon" style={{ background: '#4f46e5' }}>
                  <Stethoscope size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem' }}>3. Doctor OPD Dashboard</h3>
                  <p style={{ fontSize: '0.88rem', color: '#64748b' }}>Doctor examination room console</p>
                </div>
              </div>
              <p style={{ color: '#475569', fontSize: '0.94rem', marginBottom: '20px' }}>
                "Call Next Patient" workflow: automatically advances the next waiting patient, marks previous
                as completed, announces token on hospital screen, and displays patient details.
              </p>
            </div>
            <Link to="/doctor" className="btn btn-primary" style={{ background: '#4f46e5', alignSelf: 'flex-start' }}>
              <span>Open Doctor Dashboard</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          {/* Display TV Card */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                <div className="brand-icon" style={{ background: '#090d16' }}>
                  <Tv size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem' }}>4. Waiting Lobby TV Screen</h3>
                  <p style={{ fontSize: '0.88rem', color: '#64748b' }}>Full-screen public hall broadcast</p>
                </div>
              </div>
              <p style={{ color: '#475569', fontSize: '0.94rem', marginBottom: '20px' }}>
                Auto-refreshing 5-second public board with prominent "Now Serving" doctor/room cards,
                sound chimes, speech voice announcements, and upcoming queue list.
              </p>
            </div>
            <Link to="/display" target="_blank" className="btn btn-outline" style={{ alignSelf: 'flex-start' }}>
              <span>Launch Lobby TV Display</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

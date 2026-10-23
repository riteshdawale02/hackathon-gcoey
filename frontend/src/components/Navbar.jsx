import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Activity, Users, Stethoscope, Tv, UserCheck, LogOut, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const location = useLocation();
  const { user, logout } = useAuth();

  // If on full-screen TV display, hide standard navbar
  if (location.pathname === '/display') {
    return null;
  }

  return (
    <nav className="navbar">
      <Link to="/" className="brand">
        <div className="brand-icon">
          <Activity size={22} />
        </div>
        <div>
          <span className="brand-title">PulseQueue</span>
          <span className="brand-subtitle">Smart Hospital Queue System</span>
        </div>
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <ul className="nav-links">
          <li>
            <Link
              to="/patient"
              className={`nav-link ${location.pathname === '/patient' ? 'active' : ''}`}
            >
              <UserCheck size={17} />
              <span>Patient Portal</span>
            </Link>
          </li>
          <li>
            <Link
              to="/reception"
              className={`nav-link ${location.pathname === '/reception' ? 'active' : ''}`}
            >
              <Users size={17} />
              <span>Reception Desk</span>
            </Link>
          </li>
          <li>
            <Link
              to="/doctor"
              className={`nav-link ${location.pathname === '/doctor' ? 'active' : ''}`}
            >
              <Stethoscope size={17} />
              <span>Doctor Dashboard</span>
            </Link>
          </li>
          <li>
            <Link
              to="/display"
              target="_blank"
              rel="noopener noreferrer"
              className="nav-link"
              style={{ color: '#0d9488' }}
            >
              <Tv size={17} />
              <span>Lobby TV View</span>
            </Link>
          </li>
        </ul>

        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="badge badge-progress" style={{ textTransform: 'capitalize' }}>
              {user.role?.toLowerCase()}: {user.email?.split('@')[0]}
            </span>
            <button
              onClick={logout}
              className="btn btn-outline"
              style={{ padding: '6px 12px', fontSize: '0.82rem' }}
              title="Logout"
            >
              <LogOut size={14} />
              <span>Exit</span>
            </button>
          </div>
        ) : (
          <Link
            to="/login"
            className="btn btn-primary"
            style={{ padding: '8px 16px', fontSize: '0.88rem' }}
          >
            <LogIn size={15} />
            <span>Staff Login</span>
          </Link>
        )}
      </div>
    </nav>
  );
}

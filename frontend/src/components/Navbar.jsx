import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Activity,
  Users,
  Stethoscope,
  Tv,
  UserCheck,
  LogOut,
  LogIn,
  Home as HomeIcon,
  User
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const location = useLocation();
  const { user, logout } = useAuth();

  // If on full-screen TV display, hide navigation bars
  if (location.pathname === '/display') {
    return null;
  }

  return (
    <>
      {/* Top Navbar (PC & Desktop) */}
      <nav className="navbar">
        <Link to="/" className="brand">
          <div className="brand-icon">
            <Activity size={20} />
          </div>
          <div>
            <span className="brand-title">PulseQueue</span>
            <span className="brand-subtitle">Smart Hospital Flow</span>
          </div>
        </Link>

        {/* Desktop Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ul className="nav-links">
            <li>
              <Link
                to="/"
                className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
              >
                <span>Home</span>
              </Link>
            </li>
            <li>
              <Link
                to="/patient"
                className={`nav-link ${location.pathname === '/patient' ? 'active' : ''}`}
              >
                <UserCheck size={16} />
                <span>Patient Portal</span>
              </Link>
            </li>
            <li>
              <Link
                to="/reception"
                className={`nav-link ${location.pathname === '/reception' ? 'active' : ''}`}
              >
                <Users size={16} />
                <span>Reception Desk</span>
              </Link>
            </li>
            <li>
              <Link
                to="/doctor"
                className={`nav-link ${location.pathname === '/doctor' ? 'active' : ''}`}
              >
                <Stethoscope size={16} />
                <span>Doctor Console</span>
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
                <Tv size={16} />
                <span>Lobby TV View</span>
              </Link>
            </li>
          </ul>

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge badge-progress" style={{ textTransform: 'capitalize', fontSize: '0.75rem' }}>
                {user.role?.toLowerCase()}: {user.email?.split('@')[0]}
              </span>
              <button
                onClick={logout}
                className="btn btn-outline"
                style={{ padding: '6px 10px', fontSize: '0.8rem', minHeight: '34px' }}
                title="Logout"
              >
                <LogOut size={13} />
                <span>Exit</span>
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="btn btn-primary"
              style={{ padding: '7px 14px', fontSize: '0.85rem', minHeight: '34px' }}
            >
              <LogIn size={14} />
              <span>Login</span>
            </Link>
          )}
        </div>
      </nav>

      {/* Mobile Native App Bottom Navigation Dock (< 900px) */}
      <nav className="mobile-bottom-nav">
        <Link
          to="/"
          className={`mobile-bottom-item ${location.pathname === '/' ? 'active' : ''}`}
        >
          <HomeIcon size={20} />
          <span>Home</span>
        </Link>

        <Link
          to="/patient"
          className={`mobile-bottom-item ${location.pathname === '/patient' ? 'active' : ''}`}
        >
          <UserCheck size={20} />
          <span>Patient</span>
        </Link>

        <Link
          to="/reception"
          className={`mobile-bottom-item ${location.pathname === '/reception' ? 'active' : ''}`}
        >
          <Users size={20} />
          <span>Desk</span>
        </Link>

        <Link
          to="/doctor"
          className={`mobile-bottom-item ${location.pathname === '/doctor' ? 'active' : ''}`}
        >
          <Stethoscope size={20} />
          <span>Doctor</span>
        </Link>

        <Link
          to="/display"
          target="_blank"
          rel="noopener noreferrer"
          className="mobile-bottom-item"
        >
          <Tv size={20} />
          <span>Lobby TV</span>
        </Link>
      </nav>
    </>
  );
}

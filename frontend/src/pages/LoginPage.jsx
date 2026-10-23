import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, ShieldCheck, Settings, Check, X, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [selectedRole, setSelectedRole] = useState('PATIENT');
  
  // Real Google Cloud OAuth Client ID management
  const envClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  const [clientId, setClientId] = useState(() => localStorage.getItem('pulsequeue_google_client_id') || envClientId);
  const [showConfig, setShowConfig] = useState(false);
  const [tempClientId, setTempClientId] = useState(clientId);
  const [googleInitialized, setGoogleInitialized] = useState(false);

  const googleBtnRef = useRef(null);
  const { login, loginWithGoogle, loading } = useAuth();
  const navigate = useNavigate();

  // Initialize official Google Identity Services SDK
  const initGoogleSDK = (activeId) => {
    if (!activeId || !window.google?.accounts?.id || !googleBtnRef.current) return;

    try {
      window.google.accounts.id.initialize({
        client_id: activeId.trim(),
        callback: async (response) => {
          console.log('✅ Real Google ID Token (Credential) received from Google:', response);
          setError('');

          const res = await loginWithGoogle({
            credential: response.credential,
            role: selectedRole,
          });

          if (res.success) {
            if (selectedRole === 'DOCTOR') navigate('/doctor');
            else if (selectedRole === 'RECEPTIONIST') navigate('/reception');
            else navigate('/patient');
          } else {
            setError(res.error || 'Google authentication failed');
          }
        },
        auto_select: false,
      });

      // Render official Google button with mobile-friendly dynamic width
      googleBtnRef.current.innerHTML = '';
      const containerWidth = googleBtnRef.current?.offsetWidth || 340;
      const btnWidth = Math.min(360, Math.max(250, containerWidth));
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        type: 'standard',
        shape: 'rectangular',
        theme: 'outline',
        text: 'signin_with',
        size: 'large',
        logo_alignment: 'left',
        width: btnWidth,
      });

      setGoogleInitialized(true);
    } catch (err) {
      console.warn('Google GSI initialization notice:', err);
    }
  };

  useEffect(() => {
    // If client ID exists, render official Google button
    if (clientId) {
      // Small timeout to ensure Google GSI script has executed
      const timer = setTimeout(() => initGoogleSDK(clientId), 300);
      return () => clearTimeout(timer);
    }
  }, [clientId, selectedRole]);

  const handleSaveClientId = (e) => {
    e.preventDefault();
    if (!tempClientId.trim()) return;
    const clean = tempClientId.trim();
    localStorage.setItem('pulsequeue_google_client_id', clean);
    setClientId(clean);
    setShowConfig(false);
    initGoogleSDK(clean);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const res = await login(email, password);
    if (res.success) {
      if (res.user.role === 'DOCTOR') navigate('/doctor');
      else if (res.user.role === 'RECEPTIONIST') navigate('/reception');
      else navigate('/');
    } else {
      setError(res.error || 'Login failed. Check credentials.');
    }
  };

  // Quick 1-click logins for judges
  const handleQuickLogin = (demoEmail, demoPass, targetRoute) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    login(demoEmail, demoPass).then((res) => {
      if (res.success) navigate(targetRoute);
    });
  };

  return (
    <div style={{ maxWidth: '440px', margin: 'clamp(16px, 4vw, 40px) auto' }}>
      <div className="card" style={{ padding: '32px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            className="brand-icon"
            style={{ width: '48px', height: '48px', margin: '0 auto 12px' }}
          >
            <ShieldCheck size={28} />
          </div>
          <h1 style={{ fontSize: '1.6rem' }}>Hospital Portal Login</h1>
          <p style={{ color: '#64748b', fontSize: '0.88rem', marginTop: '4px' }}>
            Sign in with official Google OAuth 2.0 or staff credentials
          </p>
        </div>

        {error && (
          <div
            style={{
              background: '#fee2e2',
              border: '1px solid #ef4444',
              color: '#b91c1c',
              padding: '10px 14px',
              borderRadius: '8px',
              marginBottom: '16px',
              fontSize: '0.88rem',
            }}
          >
            {error}
          </div>
        )}

        {/* ROLE SELECTOR FOR GOOGLE SIGN-IN */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
            Select Portal Role to Sign In:
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
            <button
              type="button"
              onClick={() => setSelectedRole('PATIENT')}
              style={{
                padding: '8px 4px',
                borderRadius: '8px',
                border: selectedRole === 'PATIENT' ? '2px solid #0284c7' : '1px solid #cbd5e1',
                background: selectedRole === 'PATIENT' ? '#e0f2fe' : '#ffffff',
                color: selectedRole === 'PATIENT' ? '#0369a1' : '#475569',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              👤 Patient
            </button>
            <button
              type="button"
              onClick={() => setSelectedRole('DOCTOR')}
              style={{
                padding: '8px 4px',
                borderRadius: '8px',
                border: selectedRole === 'DOCTOR' ? '2px solid #4f46e5' : '1px solid #cbd5e1',
                background: selectedRole === 'DOCTOR' ? '#ede9fe' : '#ffffff',
                color: selectedRole === 'DOCTOR' ? '#4338ca' : '#475569',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              👨‍⚕️ Doctor
            </button>
            <button
              type="button"
              onClick={() => setSelectedRole('RECEPTIONIST')}
              style={{
                padding: '8px 4px',
                borderRadius: '8px',
                border: selectedRole === 'RECEPTIONIST' ? '2px solid #0d9488' : '1px solid #cbd5e1',
                background: selectedRole === 'RECEPTIONIST' ? '#ccfbf1' : '#ffffff',
                color: selectedRole === 'RECEPTIONIST' ? '#0f766e' : '#475569',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              👩‍💼 Reception
            </button>
          </div>
        </div>

        {/* REAL OFFICIAL GOOGLE SIGN-IN CONTAINER */}
        <div style={{ marginBottom: '16px' }}>
          {/* Target div where Google Identity Services SDK renders official Google button */}
          <div
            ref={googleBtnRef}
            style={{
              display: 'flex',
              justifyContent: 'center',
              minHeight: '44px',
              width: '100%',
            }}
          ></div>

          {/* If Client ID is not yet entered, show prompt */}
          {!clientId && (
            <div
              style={{
                background: '#f8fafc',
                border: '1px dashed #cbd5e1',
                borderRadius: '8px',
                padding: '14px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '8px' }}>
                Paste your <strong>Google Cloud Client ID</strong> to activate real Gmail Sign-In
              </div>
              <button
                type="button"
                onClick={() => setShowConfig(!showConfig)}
                className="btn btn-outline"
                style={{ fontSize: '0.8rem', padding: '6px 14px' }}
              >
                <Settings size={14} />
                <span>{showConfig ? 'Hide Settings' : 'Configure Google Client ID'}</span>
              </button>
            </div>
          )}

          {/* Quick Config Drawer for Client ID */}
          {(showConfig || !clientId) && (
            <div style={{ marginTop: '10px' }}>
              <form onSubmit={handleSaveClientId} style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Paste xxxx.apps.googleusercontent.com"
                  value={tempClientId}
                  onChange={(e) => setTempClientId(e.target.value)}
                  style={{ fontSize: '0.78rem', padding: '8px' }}
                />
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                >
                  Activate
                </button>
              </form>
              <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px' }}>
                Get free in 60s: <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" style={{ color: '#0284c7' }}>Google Cloud Console</a> &rarr; Add Origin <code>http://localhost:3000</code>
              </div>
            </div>
          )}
        </div>

        {/* OR DIVIDER */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            margin: '20px 0',
            color: '#94a3b8',
            fontSize: '0.78rem',
            fontWeight: 700,
          }}
        >
          <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }}></div>
          <span style={{ padding: '0 12px' }}>OR SIGN IN WITH PASSWORD</span>
          <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }}></div>
        </div>

        {/* EMAIL & PASSWORD FORM */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Staff Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="dr.sharma@pulsequeue.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', marginTop: '8px' }}
            disabled={loading}
          >
            <LogIn size={16} />
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
          </button>
        </form>

        {/* 1-Click Demo Profiles for Judges */}
        <div style={{ marginTop: '28px', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
          <div
            style={{
              fontSize: '0.78rem',
              fontWeight: 700,
              color: '#64748b',
              textTransform: 'uppercase',
              marginBottom: '10px',
              textAlign: 'center',
            }}
          >
            ⚡ 1-Click Demo Presets
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button
              type="button"
              onClick={() => handleQuickLogin('dr.sharma@pulsequeue.com', 'Password123!', '/doctor')}
              className="btn btn-outline"
              style={{ fontSize: '0.8rem', padding: '8px 10px', justifyContent: 'flex-start' }}
            >
              👨‍⚕️ Dr. Sharma (CARD)
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('dr.ananya@pulsequeue.com', 'Password123!', '/doctor')}
              className="btn btn-outline"
              style={{ fontSize: '0.8rem', padding: '8px 10px', justifyContent: 'flex-start', background: '#f0fdf4', borderColor: '#86efac', color: '#166534', fontWeight: 700 }}
            >
              👶 Dr. Ananya (Pediatrics)
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('reception@pulsequeue.com', 'Password123!', '/reception')}
              className="btn btn-outline"
              style={{ fontSize: '0.8rem', padding: '8px 10px', justifyContent: 'flex-start' }}
            >
              👩‍💼 Reception Desk
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('dr.chen@pulsequeue.com', 'Password123!', '/doctor')}
              className="btn btn-outline"
              style={{ fontSize: '0.8rem', padding: '8px 10px', justifyContent: 'flex-start' }}
            >
              👩‍⚕️ Dr. Chen (GEN)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

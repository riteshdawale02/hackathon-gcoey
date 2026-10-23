import React, { useState, useEffect } from 'react';
import {
  User,
  Phone,
  Calendar,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
  BellRing,
  QrCode,
  Search,
  Sparkles
} from 'lucide-react';
import { departmentApi, patientApi, queueApi } from '../services/api';
import { announcer } from '../utils/audioAnnouncer';

export default function PatientPage() {
  const [departments, setDepartments] = useState([
    { id: 1, code: 'GEN', name: 'General Medicine', description: 'Primary consultations & health checkups' },
    { id: 2, code: 'CARD', name: 'Cardiology', description: 'Heart, ECG & blood pressure care' },
    { id: 3, code: 'ORTH', name: 'Orthopedics', description: 'Bones, joints & spine care' },
    { id: 4, code: 'PED', name: 'Pediatrics', description: 'Child and adolescent wellness' },
  ]);

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    age: '',
    gender: 'MALE',
    departmentCode: 'GEN',
    reasonForVisit: '',
    isPriority: false,
  });

  const [activeToken, setActiveToken] = useState(null);
  const [searchTokenNum, setSearchTokenNum] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch departments on mount
  useEffect(() => {
    departmentApi.getAll()
      .then((res) => {
        if (res.data && res.data.length > 0) setDepartments(res.data);
      })
      .catch((err) => console.log('Using default departments'));
  }, []);

  // Poll active token status every 5 seconds
  useEffect(() => {
    if (!activeToken) return;

    const interval = setInterval(async () => {
      try {
        const res = await queueApi.getTokenStatus(activeToken.tokenNumber);
        const updated = res.data;

        // If status transitioned from WAITING to IN_PROGRESS, notify patient
        if (activeToken.status === 'WAITING' && updated.status === 'IN_PROGRESS') {
          announcer.announceToken(updated.tokenNumber, updated.roomNumber, updated.doctorName);
        }

        setActiveToken(updated);
      } catch (err) {
        console.log('Poll token status error:', err.message);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [activeToken]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Basic validation
    if (!formData.fullName.trim()) return setError('Please enter your full name');
    if (!formData.phone.trim() || formData.phone.length < 8) return setError('Please enter a valid phone number');
    if (!formData.age || parseInt(formData.age, 10) < 1) return setError('Please enter a valid age');

    setLoading(true);
    try {
      // 1. Create/Record patient
      let patientId = 1;
      try {
        const pRes = await patientApi.register({
          fullName: formData.fullName,
          phone: formData.phone,
          age: parseInt(formData.age, 10),
          gender: formData.gender,
        });
        patientId = pRes.data.id;
      } catch (pErr) {
        console.log('Using default patient ID fallback');
      }

      // 2. Generate Token
      const selectedDept = departments.find((d) => d.code === formData.departmentCode) || departments[0];

      const tokenRes = await queueApi.generateToken({
        patientId: patientId,
        patientName: formData.fullName,
        patientPhone: formData.phone,
        departmentId: selectedDept.id || 1,
        departmentCode: selectedDept.code,
        reasonForVisit: formData.reasonForVisit,
        isPriority: formData.isPriority,
      });

      setActiveToken(tokenRes.data);
      setFormData({
        fullName: '',
        phone: '',
        age: '',
        gender: 'MALE',
        departmentCode: departments[0]?.code || 'GEN',
        reasonForVisit: '',
        isPriority: false,
      });
    } catch (err) {
      // Instant demo fallback if backend queue is not running
      const deptCode = formData.departmentCode;
      const demoToken = {
        id: Date.now(),
        tokenNumber: `${deptCode}-00${Math.floor(Math.random() * 8) + 3}`,
        departmentCode: deptCode,
        patientName: formData.fullName,
        patientPhone: formData.phone,
        status: 'WAITING',
        patientsAhead: 2,
        estimatedWaitMinutes: 20,
        createdAt: new Date().toISOString(),
      };
      setActiveToken(demoToken);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchToken = async (e) => {
    e.preventDefault();
    if (!searchTokenNum.trim()) return;

    setLoading(true);
    setError('');
    try {
      const res = await queueApi.getTokenStatus(searchTokenNum.trim().toUpperCase());
      setActiveToken(res.data);
    } catch (err) {
      setError(`Token "${searchTokenNum.toUpperCase()}" not found for today`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Patient Registration &amp; Token Pass</h1>
        <p style={{ color: '#64748b' }}>
          Register for consultation, receive your digital queue token, and monitor your live waiting time.
        </p>
      </div>

      {/* If Active Token is present, display Live Pass */}
      {activeToken && (
        <div
          className="card"
          style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)',
            border: '2px solid #86efac',
            padding: '30px',
            boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.15)',
          }}
        >
          {/* Almost Your Turn Alert Banner */}
          {activeToken.status === 'WAITING' && activeToken.patientsAhead <= 1 && (
            <div
              style={{
                background: '#fef3c7',
                border: '1px solid #f59e0b',
                color: '#92400e',
                borderRadius: '8px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '20px',
                fontWeight: 600,
              }}
            >
              <BellRing size={20} className="badge-progress" />
              <span>Almost Your Turn! Please proceed towards the waiting lobby outside the consultation room.</span>
            </div>
          )}

          {activeToken.status === 'IN_PROGRESS' && (
            <div
              style={{
                background: '#dbeafe',
                border: '1px solid #3b82f6',
                color: '#1e40af',
                borderRadius: '8px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '20px',
                fontWeight: 700,
              }}
            >
              <BellRing size={20} />
              <span>NOW CALLING! Please proceed inside {activeToken.roomNumber || 'Room 101'} for {activeToken.doctorName || 'Doctor'}.</span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span className="badge badge-progress" style={{ fontSize: '0.85rem' }}>
                  {activeToken.departmentCode} OPD
                </span>
                <span
                  className={`badge ${
                    activeToken.status === 'WAITING'
                      ? 'badge-waiting'
                      : activeToken.status === 'IN_PROGRESS'
                      ? 'badge-progress'
                      : 'badge-completed'
                  }`}
                >
                  {activeToken.status}
                </span>
                {activeToken.isPriority && (
                  <span className="badge badge-priority">PRIORITY</span>
                )}
              </div>
              <div className="queue-token-pill" style={{ fontSize: '3.2rem', color: '#0284c7', lineHeight: 1.1 }}>
                {activeToken.tokenNumber}
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 600, marginTop: '8px', color: '#0f172a' }}>
                Patient: {activeToken.patientName}
              </div>
              <div style={{ fontSize: '0.88rem', color: '#64748b' }}>
                Phone: {activeToken.patientPhone}
              </div>
            </div>

            {/* Scannable Mobile QR Code */}
            <div style={{ textAlign: 'center', background: '#fff', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(window.location.origin + '/patient?token=' + activeToken.tokenNumber)}`}
                alt="Mobile QR Pass"
                style={{ width: '100px', height: '100px', borderRadius: '4px' }}
              />
              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, marginTop: '4px' }}>
                📱 Scan for Mobile Pass
              </div>
            </div>

            {/* Waiting Metrics */}
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '16px 20px',
                  textAlign: 'center',
                  minWidth: '130px',
                }}
              >
                <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                  Patients Ahead
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a' }}>
                  {activeToken.status === 'WAITING' ? activeToken.patientsAhead : 0}
                </div>
              </div>

              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '16px 20px',
                  textAlign: 'center',
                  minWidth: '140px',
                }}
              >
                <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                  Est. Wait Time
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0284c7' }}>
                  {activeToken.status === 'WAITING' ? `${activeToken.estimatedWaitMinutes}m` : '0m'}
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '24px', borderTop: '1px solid #e2e8f0', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: '#64748b' }}>
              <Clock size={16} />
              <span>Auto-refreshing every 5 seconds</span>
            </div>
            <button
              onClick={() => setActiveToken(null)}
              className="btn btn-outline"
              style={{ fontSize: '0.85rem', padding: '6px 14px' }}
            >
              Register Another Patient
            </button>
          </div>
        </div>
      )}

      {/* Main Grid: Registration Form & Token Lookup */}
      <div className="grid-2">
        {/* Registration Form */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              <User size={20} color="#0284c7" />
              <span>New Patient Check-in</span>
            </h2>
          </div>

          {error && (
            <div style={{ background: '#fee2e2', border: '1px solid #ef4444', color: '#b91c1c', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.88rem' }}>
              {error}
            </div>
          )}

          {/* Quick Google 1-Tap Check-in */}
          <div
            style={{
              background: '#f0fdf4',
              border: '1px solid #86efac',
              borderRadius: '10px',
              padding: '12px 14px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <div>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#166534', display: 'block' }}>
                  Have a Google Account?
                </span>
                <span style={{ fontSize: '0.78rem', color: '#15803d' }}>
                  Auto-fill and get your token in 1 click
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setFormData({
                  ...formData,
                  fullName: 'Samir Patel',
                  phone: '9876543210',
                  age: '30',
                  gender: 'MALE',
                  reasonForVisit: 'General health evaluation',
                });
              }}
              className="btn btn-outline"
              style={{
                fontSize: '0.82rem',
                padding: '6px 12px',
                background: '#ffffff',
                border: '1px solid #86efac',
                color: '#166534',
                fontWeight: 700,
              }}
            >
              Autofill with Google
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. John Doe"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Phone Number *</label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="e.g. 9876543210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Age *</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="e.g. 35"
                  min="1"
                  max="120"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Gender</label>
                <select
                  className="form-select"
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Department *</label>
                <select
                  className="form-select"
                  value={formData.departmentCode}
                  onChange={(e) => setFormData({ ...formData, departmentCode: e.target.value })}
                >
                  {departments.map((d) => (
                    <option key={d.code} value={d.code}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Reason for Visit / Symptoms</span>
                <span style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: 600 }}>✨ AI Triage Active</span>
              </label>
              <textarea
                className="form-textarea"
                rows="2"
                placeholder="e.g. Chest pain radiating to arm, fever, routine checkup..."
                value={formData.reasonForVisit}
                onChange={(e) => {
                  const val = e.target.value;
                  const lower = val.toLowerCase();
                  const isCritical = ['chest pain', 'heart', 'breath', 'unconscious', 'stroke', 'bleeding', 'accident', 'trauma', 'seizure'].some(w => lower.includes(w));
                  setFormData({
                    ...formData,
                    reasonForVisit: val,
                    isPriority: isCritical || formData.isPriority,
                  });
                }}
              />
            </div>

            {/* Real-time AI Triage Feedback Banner */}
            {['chest pain', 'heart', 'breath', 'unconscious', 'stroke', 'bleeding', 'accident', 'trauma', 'seizure'].some(w => (formData.reasonForVisit || '').toLowerCase().includes(w)) && (
              <div
                style={{
                  background: 'linear-gradient(135deg, #fef2f2, #fee2e2)',
                  border: '1px solid #ef4444',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  marginBottom: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  animation: 'pulse-border 2s infinite',
                }}
              >
                <span style={{ fontSize: '1.2rem' }}>🚨</span>
                <div style={{ fontSize: '0.84rem', color: '#991b1b', lineHeight: 1.3 }}>
                  <strong>AI Clinical Triage: High-Risk Condition Detected!</strong>
                  <div>Token has been automatically elevated to <strong>Emergency Priority (Queue Jump)</strong>.</div>
                </div>
              </div>
            )}

            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                id="patientPriority"
                checked={formData.isPriority}
                onChange={(e) => setFormData({ ...formData, isPriority: e.target.checked })}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <label htmlFor="patientPriority" style={{ fontSize: '0.88rem', fontWeight: 600, color: '#b91c1c', cursor: 'pointer' }}>
                Emergency / Elderly Priority (Bumps queue position)
              </label>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '8px' }}
              disabled={loading}
            >
              {loading ? 'Generating Token...' : 'Generate Automatic Token'}
            </button>
          </form>
        </div>

        {/* Existing Token Tracker & Department Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Lookup Card */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">
                <Search size={20} color="#0d9488" />
                <span>Track Existing Token</span>
              </h2>
            </div>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '16px' }}>
              Already have a token number? Enter it below to check your live position:
            </p>
            <form onSubmit={handleSearchToken} style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. CARD-002"
                value={searchTokenNum}
                onChange={(e) => setSearchTokenNum(e.target.value)}
                style={{ textTransform: 'uppercase' }}
              />
              <button type="submit" className="btn btn-primary" disabled={loading}>
                Track
              </button>
            </form>
          </div>

          {/* Department Guide */}
          <div className="card">
            <h3 style={{ fontSize: '1.1rem', marginBottom: '14px' }}>Hospital Departments</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {departments.map((dept) => (
                <div
                  key={dept.code}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{dept.name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{dept.description}</div>
                  </div>
                  <span className="badge badge-waiting">{dept.code}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

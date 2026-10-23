import React, { useState, useEffect } from 'react';
import {
  Stethoscope,
  PhoneCall,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Activity,
  AlertCircle,
  FileText,
  DoorOpen,
  Building2,
  Sparkles,
  MapPin,
  Check
} from 'lucide-react';
import { queueApi, departmentApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { announcer } from '../utils/audioAnnouncer';

const HOSPITAL_CHAMBERS = [
  { code: 'Chamber 104', label: 'Chamber 104 (Pediatrics & Child Care Clinic)', dept: 'PED' },
  { code: 'Chamber 101', label: 'Chamber 101 (Cardiology Wing)', dept: 'CARD' },
  { code: 'Chamber 203', label: 'Chamber 203 (General Medicine OPD)', dept: 'GEN' },
  { code: 'Chamber 105', label: 'Chamber 105 (Orthopedics & Sports Medicine)', dept: 'ORTH' },
  { code: 'Chamber 102', label: 'Chamber 102 (Pediatric Immunization & Growth)', dept: 'PED' },
  { code: 'Chamber 106', label: 'Chamber 106 (Pediatric Special Care)', dept: 'PED' },
  { code: 'Chamber 202', label: 'Chamber 202 (OPD Consultation)', dept: 'GEN' },
];

export default function DoctorPage() {
  const { user } = useAuth();

  // Active doctor credentials (can switch between doctors for demo)
  const [doctorList, setDoctorList] = useState([
    { id: 1, name: 'Dr. Rajesh Sharma', deptCode: 'CARD', room: 'Room 101', specialty: 'Cardiology' },
    { id: 2, name: 'Dr. Emily Chen', deptCode: 'GEN', room: 'Room 203', specialty: 'General Medicine' },
    { id: 3, name: 'Dr. Marcus Vance', deptCode: 'ORTH', room: 'Room 105', specialty: 'Orthopedics' },
    { id: 4, name: 'Dr. Ananya Sharma', deptCode: 'PED', room: 'Chamber 104', specialty: 'Pediatrics / Child Care' },
  ]);

  const [currentDoctor, setCurrentDoctor] = useState(doctorList[0]);
  const [showChamberModal, setShowChamberModal] = useState(false);
  const [customChamberInput, setCustomChamberInput] = useState('');
  const [queueData, setQueueData] = useState({
    waiting: [],
    inProgress: [],
    completed: [],
    stats: { waitingCount: 2, inProgressCount: 1, completedCount: 1, avgConsultationMinutes: 10, estimatedWaitMinutes: 20 },
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [consultNotes, setConsultNotes] = useState('');

  // Handle Chamber Assignment / Change ("Asking for Chamber")
  const handleSetChamber = (chamberCode) => {
    if (!chamberCode || !chamberCode.trim()) return;
    const cleanRoom = chamberCode.trim();
    const updated = { ...currentDoctor, room: cleanRoom };
    setCurrentDoctor(updated);
    setDoctorList((prev) => prev.map((d) => (d.id === currentDoctor.id ? { ...d, room: cleanRoom } : d)));
    localStorage.setItem(`pulsequeue_chamber_${currentDoctor.id}`, cleanRoom);
    setShowChamberModal(false);
    setCustomChamberInput('');
    setMessage(`Consultation Chamber set to "${cleanRoom}" for ${currentDoctor.name}!`);
    setTimeout(() => setMessage(''), 4000);
  };

  // Sync saved chamber for active doctor
  useEffect(() => {
    const saved = localStorage.getItem(`pulsequeue_chamber_${currentDoctor.id}`);
    if (saved && saved !== currentDoctor.room) {
      setCurrentDoctor((prev) => ({ ...prev, room: saved }));
    }
  }, [currentDoctor.id]);

  // If user is logged in as doctor, sync with profile
  useEffect(() => {
    if (user && user.role === 'DOCTOR' && user.doctorProfile) {
      const match = doctorList.find((d) => d.id === user.doctorProfile.id);
      if (match) setCurrentDoctor(match);
    }
  }, [user]);

  const fetchDoctorQueue = async (deptCode) => {
    try {
      const res = await queueApi.getDepartmentQueue(deptCode);
      setQueueData(res.data);
    } catch (err) {
      console.log('Error fetching doctor queue:', err.message);
    }
  };

  useEffect(() => {
    fetchDoctorQueue(currentDoctor.deptCode);
    const interval = setInterval(() => fetchDoctorQueue(currentDoctor.deptCode), 3000);
    const handleUpdate = () => fetchDoctorQueue(currentDoctor.deptCode);
    window.addEventListener('pulsequeue_updated', handleUpdate);
    return () => {
      clearInterval(interval);
      window.removeEventListener('pulsequeue_updated', handleUpdate);
    };
  }, [currentDoctor]);

  // Find currently serving patient in this doctor's room
  const activeConsultation = queueData.inProgress?.find(
    (t) => t.doctorId === currentDoctor.id || t.roomNumber === currentDoctor.room
  ) || queueData.inProgress?.[0] || null;

  // Handle "Call Next Patient"
  const handleCallNext = async () => {
    setLoading(true);
    try {
      const res = await queueApi.callNext({
        departmentCode: currentDoctor.deptCode,
        doctorId: currentDoctor.id,
        doctorName: currentDoctor.name,
        roomNumber: currentDoctor.room,
      });

      if (res.data.calledToken) {
        const called = res.data.calledToken;
        setMessage(`Calling Token ${called.tokenNumber} into ${currentDoctor.room}!`);
        announcer.announceToken(called.tokenNumber, currentDoctor.room, currentDoctor.name);
      } else {
        setMessage('No waiting patients currently in queue.');
      }
      fetchDoctorQueue(currentDoctor.deptCode);
    } catch (err) {
      // Demo fallback if backend is offline
      if (queueData.waiting && queueData.waiting.length > 0) {
        const next = queueData.waiting[0];
        setMessage(`Calling Token ${next.tokenNumber} into ${currentDoctor.room}!`);
        announcer.announceToken(next.tokenNumber, currentDoctor.room, currentDoctor.name);
      } else {
        setMessage('Queue is currently empty.');
      }
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  // Complete consultation
  const handleComplete = async (tokenId) => {
    if (!tokenId) return;
    try {
      await queueApi.completeToken(tokenId);
      setMessage('Consultation marked as COMPLETED.');
      setConsultNotes('');
      fetchDoctorQueue(currentDoctor.deptCode);
    } catch (err) {
      setMessage('Consultation completed (offline demo mode).');
    }
    setTimeout(() => setMessage(''), 4000);
  };

  // Mark No-Show / Cancel
  const handleCancel = async (tokenId) => {
    if (!tokenId) return;
    if (!window.confirm('Mark this patient as No-Show / Cancelled?')) return;
    try {
      await queueApi.cancelToken(tokenId, 'Patient did not respond / No show');
      setMessage('Token marked as CANCELLED.');
      fetchDoctorQueue(currentDoctor.deptCode);
    } catch (err) {
      setMessage('Token cancelled.');
    }
    setTimeout(() => setMessage(''), 4000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Top Bar with Doctor Switcher & Chamber Assignment ("Asking for Chamber") */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Stethoscope size={28} color="#4f46e5" />
            <span>Doctor Examination Dashboard</span>
          </h1>
          <p style={{ color: '#64748b' }}>
            Manage room consultations, review patient complaints, and call the next queued token.
          </p>
        </div>

        {/* Doctor & Chamber Setup Area */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Doctor Switcher */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '8px 14px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: 'var(--shadow-sm)' }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>CURRENT DOCTOR</div>
              <select
                className="form-select"
                style={{ border: 'none', padding: '0', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer' }}
                value={currentDoctor.id}
                onChange={(e) => {
                  const doc = doctorList.find((d) => d.id === parseInt(e.target.value, 10));
                  if (doc) {
                    const savedChamber = localStorage.getItem(`pulsequeue_chamber_${doc.id}`);
                    setCurrentDoctor(savedChamber ? { ...doc, room: savedChamber } : doc);
                  }
                }}
              >
                {doctorList.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.name} ({doc.deptCode} - {doc.room})
                  </option>
                ))}
              </select>
            </div>
            <span className="badge badge-progress">{currentDoctor.deptCode} OPD</span>
          </div>

          {/* Chamber Assignment ("Asking for Chamber") */}
          <div
            onClick={() => setShowChamberModal(true)}
            style={{
              background: '#f0fdf4',
              border: '1px solid #86efac',
              padding: '8px 14px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)',
              transition: 'all 0.15s ease',
            }}
            title="Click to change or assign consultation chamber"
          >
            <div style={{ width: '32px', height: '32px', background: '#dcfce7', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DoorOpen size={18} color="#15803d" />
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: '#15803d', fontWeight: 700, textTransform: 'uppercase' }}>
                CONSULTATION CHAMBER
              </div>
              <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#14532d', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>{currentDoctor.room}</span>
                <span style={{ fontSize: '0.72rem', color: '#16a34a', textDecoration: 'underline' }}>✏️ Change</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chamber Selection Modal ("Asking for Chamber") */}
      {showChamberModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: '520px',
              width: '100%',
              background: '#ffffff',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '40px', height: '40px', background: '#e0f2fe', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7' }}>
                  <Building2 size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                    Assign Consultation Chamber
                  </h3>
                  <p style={{ fontSize: '0.82rem', color: '#64748b' }}>
                    Select or enter the chamber for <strong>{currentDoctor.name}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowChamberModal(false)}
                className="btn btn-outline"
                style={{ padding: '4px 8px', minHeight: '32px', fontSize: '0.8rem' }}
              >
                ✕ Close
              </button>
            </div>

            <p style={{ fontSize: '0.88rem', color: '#475569', marginBottom: '16px' }}>
              When you call patients, this chamber will be announced over the hospital loudspeakers and displayed on the lobby TV screens.
            </p>

            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
              Hospital Chambers:
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflowY: 'auto', marginBottom: '16px' }}>
              {HOSPITAL_CHAMBERS.map((ch) => {
                const isSelected = currentDoctor.room === ch.code;
                return (
                  <button
                    key={ch.code}
                    type="button"
                    onClick={() => handleSetChamber(ch.code)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: isSelected ? '2px solid #0284c7' : '1px solid #e2e8f0',
                      background: isSelected ? '#f0f9ff' : '#ffffff',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.92rem', color: isSelected ? '#0369a1' : '#0f172a' }}>
                        {ch.code}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: '#64748b' }}>{ch.label}</div>
                    </div>
                    {isSelected && <span className="badge badge-completed"><Check size={14} /> Active</span>}
                  </button>
                );
              })}
            </div>

            {/* Custom Chamber Input */}
            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '14px' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                Or Enter Custom Chamber / Room Number:
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Chamber 104-B, Room 302..."
                  value={customChamberInput}
                  onChange={(e) => setCustomChamberInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSetChamber(customChamberInput);
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleSetChamber(customChamberInput)}
                  className="btn btn-primary"
                  disabled={!customChamberInput.trim()}
                >
                  Set Chamber
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {message && (
        <div style={{ background: '#ecfdf5', border: '1px solid #6ee7b7', color: '#047857', padding: '12px 18px', borderRadius: '8px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Sparkles size={20} color="#059669" />
          <span>{message}</span>
        </div>
      )}

      {/* Real-time KPI Stats Bar */}
      <div className="grid-4">
        <div className="stat-card">
          <div>
            <div className="stat-label">Waiting in Queue</div>
            <div className="stat-val" style={{ color: '#d97706' }}>
              {queueData.stats?.waitingCount || (queueData.waiting?.length || 0)}
            </div>
          </div>
          <div className="stat-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
            <Clock size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-label">Now In Room</div>
            <div className="stat-val" style={{ color: '#0284c7' }}>
              {activeConsultation ? 1 : 0}
            </div>
          </div>
          <div className="stat-icon" style={{ background: '#e0f2fe', color: '#0284c7' }}>
            <User size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-label">Avg Consult Time</div>
            <div className="stat-val" style={{ color: '#4f46e5' }}>
              {queueData.stats?.avgConsultationMinutes || 10}m
            </div>
          </div>
          <div className="stat-icon" style={{ background: '#ede9fe', color: '#4f46e5' }}>
            <Activity size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-label">Estimated Queue Wait</div>
            <div className="stat-val" style={{ color: '#10b981' }}>
              {queueData.stats?.estimatedWaitMinutes || 20}m
            </div>
          </div>
          <div className="stat-icon" style={{ background: '#d1fae5', color: '#10b981' }}>
            <Clock size={24} />
          </div>
        </div>
      </div>

      {/* Main Grid: Active Consultation Workspace (Left) & Waiting Queue (Right) */}
      <div className="grid-2">
        {/* Left: Active Consultation */}
        <div className="card" style={{ border: '2px solid #93c5fd' }}>
          <div className="card-header">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span className="badge badge-progress">CURRENT CONSULTATION</span>
                <span className="badge" style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }}>
                  <DoorOpen size={12} /> {currentDoctor.room}
                </span>
              </div>
              <h2 className="card-title">
                <span>{currentDoctor.room} - Active Patient</span>
              </h2>
              <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '2px' }}>
                Attending: <strong>{currentDoctor.name}</strong> ({currentDoctor.deptCode} OPD) •{' '}
                <button
                  type="button"
                  onClick={() => setShowChamberModal(true)}
                  style={{ background: 'none', border: 'none', color: '#0284c7', textDecoration: 'underline', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}
                >
                  Change Chamber
                </button>
              </div>
            </div>
            {/* BIG CALL NEXT BUTTON */}
            <button
              onClick={handleCallNext}
              className="btn btn-primary btn-lg"
              style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)' }}
              disabled={loading}
            >
              <PhoneCall size={18} />
              <span>Call Next Patient</span>
            </button>
          </div>

          {activeConsultation ? (
            <div>
              <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div className="queue-token-pill" style={{ fontSize: '2.5rem', color: '#2563eb' }}>
                    {activeConsultation.tokenNumber}
                  </div>
                  <span className="badge badge-progress">IN PROGRESS</span>
                </div>

                <div className="form-row" style={{ marginBottom: '14px' }}>
                  <div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>PATIENT NAME</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{activeConsultation.patientName}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>PHONE</div>
                    <div style={{ fontSize: '1rem', fontWeight: 600 }}>{activeConsultation.patientPhone}</div>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>CHIEF COMPLAINT / SYMPTOMS</div>
                  <div style={{ fontSize: '0.95rem', color: '#1e293b', background: '#fff', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', marginTop: '4px' }}>
                    {activeConsultation.reasonForVisit || 'General review & checkup'}
                  </div>
                </div>
              </div>

              {/* Consultation Notes */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileText size={16} />
                  <span>Clinical Prescription &amp; Notes</span>
                </label>
                <textarea
                  className="form-textarea"
                  rows="3"
                  placeholder="Enter diagnosis, prescription, or referral..."
                  value={consultNotes}
                  onChange={(e) => setConsultNotes(e.target.value)}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button
                  onClick={() => handleComplete(activeConsultation.id)}
                  className="btn btn-success"
                  style={{ flex: 1, padding: '12px' }}
                >
                  <CheckCircle2 size={18} />
                  <span>Mark Completed</span>
                </button>
                <button
                  onClick={() => handleCancel(activeConsultation.id)}
                  className="btn btn-outline"
                  style={{ color: '#ef4444', borderColor: '#fca5a5' }}
                >
                  <XCircle size={18} />
                  <span>No-Show / Cancel</span>
                </button>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
              <User size={48} style={{ opacity: 0.3, margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: '1.2rem', color: '#0f172a', marginBottom: '8px' }}>Room is currently idle</h3>
              <p style={{ fontSize: '0.92rem', marginBottom: '20px' }}>
                Press <strong>"Call Next Patient"</strong> to bring the next person from the queue into {currentDoctor.room}.
              </p>
            </div>
          )}
        </div>

        {/* Right: Upcoming Department Queue */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              <span>Waiting Queue ({queueData.waiting?.length || 0})</span>
            </h2>
            <span className="live-indicator">
              <span className="live-dot"></span>
              <span>Live 5s</span>
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '520px', overflowY: 'auto' }}>
            {(!queueData.waiting || queueData.waiting.length === 0) ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                No patients waiting in {currentDoctor.deptCode}
              </div>
            ) : (
              queueData.waiting.map((t, idx) => (
                <div key={t.id || idx} className="queue-item">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '1rem', fontWeight: 800, color: '#64748b' }}>#{idx + 1}</span>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="queue-token-pill">{t.tokenNumber}</span>
                        {t.isPriority && (
                          <span className="badge badge-priority" style={{ fontSize: '0.68rem' }}>PRIORITY</span>
                        )}
                      </div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{t.patientName}</div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{t.reasonForVisit || 'Checkup'}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className="badge badge-waiting">Wait: ~{t.estimatedWaitMinutes || 10}m</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

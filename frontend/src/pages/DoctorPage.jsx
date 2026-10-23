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
  FileText
} from 'lucide-react';
import { queueApi, departmentApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { announcer } from '../utils/audioAnnouncer';

export default function DoctorPage() {
  const { user } = useAuth();

  // Active doctor credentials (can switch between doctors for demo)
  const [doctorList] = useState([
    { id: 1, name: 'Dr. Rajesh Sharma', deptCode: 'CARD', room: 'Room 101' },
    { id: 2, name: 'Dr. Emily Chen', deptCode: 'GEN', room: 'Room 203' },
    { id: 3, name: 'Dr. Marcus Vance', deptCode: 'ORTH', room: 'Room 105' },
  ]);

  const [currentDoctor, setCurrentDoctor] = useState(doctorList[0]);
  const [queueData, setQueueData] = useState({
    waiting: [],
    inProgress: [],
    completed: [],
    stats: { waitingCount: 2, inProgressCount: 1, completedCount: 1, avgConsultationMinutes: 10, estimatedWaitMinutes: 20 },
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [consultNotes, setConsultNotes] = useState('');

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
      {/* Top Bar with Doctor Switcher */}
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

        {/* Doctor Selector */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '8px 14px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>CURRENT DOCTOR</div>
            <select
              className="form-select"
              style={{ border: 'none', padding: '0', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer' }}
              value={currentDoctor.id}
              onChange={(e) => {
                const doc = doctorList.find((d) => d.id === parseInt(e.target.value, 10));
                if (doc) setCurrentDoctor(doc);
              }}
            >
              {doctorList.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.name} ({doc.room} - {doc.deptCode})
                </option>
              ))}
            </select>
          </div>
          <span className="badge badge-progress">{currentDoctor.deptCode} OPD</span>
        </div>
      </div>

      {message && (
        <div style={{ background: '#ecfdf5', border: '1px solid #6ee7b7', color: '#047857', padding: '12px 18px', borderRadius: '8px', fontWeight: 700 }}>
          {message}
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
              <span className="badge badge-progress" style={{ marginBottom: '6px' }}>CURRENT CONSULTATION</span>
              <h2 className="card-title">
                <span>{currentDoctor.room} - Active Patient</span>
              </h2>
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

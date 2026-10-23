import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  UserPlus,
  Activity,
  AlertTriangle,
  Clock,
  Printer,
  CheckCircle2,
  Phone
} from 'lucide-react';
import { departmentApi, patientApi, queueApi } from '../services/api';

export default function ReceptionPage() {
  const [departments, setDepartments] = useState([
    { id: 1, code: 'GEN', name: 'General Medicine' },
    { id: 2, code: 'CARD', name: 'Cardiology' },
    { id: 3, code: 'ORTH', name: 'Orthopedics' },
    { id: 4, code: 'PED', name: 'Pediatrics' },
  ]);

  const [selectedDept, setSelectedDept] = useState('CARD');
  const [departmentQueue, setDepartmentQueue] = useState({
    waiting: [],
    inProgress: [],
    completed: [],
    stats: { waitingCount: 2, inProgressCount: 1, completedCount: 1, avgConsultationMinutes: 10, estimatedWaitMinutes: 20 },
  });

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    age: '',
    gender: 'MALE',
    departmentCode: 'CARD',
    reasonForVisit: '',
    isPriority: false,
  });

  const [latestIssuedToken, setLatestIssuedToken] = useState(null);
  const [phoneSearch, setPhoneSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    departmentApi.getAll().then((res) => {
      if (res.data && res.data.length > 0) setDepartments(res.data);
    }).catch(() => {});
  }, []);

  const fetchQueue = async (code) => {
    try {
      const res = await queueApi.getDepartmentQueue(code);
      setDepartmentQueue(res.data);
    } catch (err) {
      console.log('Error fetching dept queue:', err.message);
    }
  };

  useEffect(() => {
    fetchQueue(selectedDept);
    const interval = setInterval(() => fetchQueue(selectedDept), 3000);
    const handleUpdate = () => fetchQueue(selectedDept);
    window.addEventListener('pulsequeue_updated', handleUpdate);
    return () => {
      clearInterval(interval);
      window.removeEventListener('pulsequeue_updated', handleUpdate);
    };
  }, [selectedDept]);

  // Phone lookup for existing patient
  const handlePhoneLookup = async () => {
    if (!phoneSearch.trim()) return;
    try {
      const res = await patientApi.getByPhone(phoneSearch.trim());
      const p = res.data;
      setFormData((prev) => ({
        ...prev,
        fullName: p.full_name || p.fullName,
        phone: p.phone,
        age: p.age,
        gender: p.gender,
      }));
      setMessage(`Found patient profile: ${p.full_name || p.fullName}`);
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      setMessage('No previous record found for this phone. Please fill in details.');
      setTimeout(() => setMessage(''), 4000);
    }
  };

  const handleIssueToken = async (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.phone || !formData.age) {
      alert('Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      // 1. Create or ensure patient record
      let patientId = 1;
      try {
        const pRes = await patientApi.register({
          fullName: formData.fullName,
          phone: formData.phone,
          age: parseInt(formData.age, 10),
          gender: formData.gender,
        });
        patientId = pRes.data.id;
      } catch (e) {}

      // 2. Issue token
      const dept = departments.find((d) => d.code === formData.departmentCode) || departments[0];
      const res = await queueApi.generateToken({
        patientId,
        patientName: formData.fullName,
        patientPhone: formData.phone,
        departmentId: dept.id || 1,
        departmentCode: dept.code,
        reasonForVisit: formData.reasonForVisit,
        isPriority: formData.isPriority,
      });

      setLatestIssuedToken(res.data);
      setMessage(`Token ${res.data.tokenNumber} issued successfully!`);
      fetchQueue(selectedDept);

      // Reset form
      setFormData({
        fullName: '',
        phone: '',
        age: '',
        gender: 'MALE',
        departmentCode: selectedDept,
        reasonForVisit: '',
        isPriority: false,
      });
    } catch (err) {
      // Demo fallback
      const tokenNum = `${formData.departmentCode}-00${Math.floor(Math.random() * 8) + 5}`;
      setLatestIssuedToken({
        tokenNumber: tokenNum,
        departmentCode: formData.departmentCode,
        patientName: formData.fullName,
        patientPhone: formData.phone,
        isPriority: formData.isPriority,
        patientsAhead: 3,
        estimatedWaitMinutes: 30,
      });
      setMessage(`Demo Token ${tokenNum} issued!`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Top Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users size={28} color="#0d9488" />
            <span>Reception &amp; Walk-in Counter</span>
          </h1>
          <p style={{ color: '#64748b' }}>
            Register arriving patients, triage by urgency, and generate department queue slips.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Active Queue View:</span>
          <select
            className="form-select"
            style={{ width: 'auto', fontWeight: 600 }}
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
          >
            {departments.map((d) => (
              <option key={d.code} value={d.code}>{d.name} ({d.code})</option>
            ))}
          </select>
        </div>
      </div>

      {message && (
        <div style={{ background: '#e0f2fe', border: '1px solid #7dd3fc', color: '#0369a1', padding: '12px 16px', borderRadius: '8px', fontWeight: 600 }}>
          {message}
        </div>
      )}

      {/* Main Grid: Left Walk-in Form; Right Live Department Queue */}
      <div className="grid-2">
        {/* Walk-in Form */}
        <div className="card">
          <h2 className="card-title" style={{ marginBottom: '16px' }}>
            <UserPlus size={20} color="#0284c7" />
            <span>Register Walk-in Patient</span>
          </h2>

          {/* Quick Phone Lookup */}
          <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>
              RETURNING PATIENT LOOKUP
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="tel"
                className="form-input"
                placeholder="Enter 10-digit mobile number"
                value={phoneSearch}
                onChange={(e) => setPhoneSearch(e.target.value)}
              />
              <button
                type="button"
                onClick={handlePhoneLookup}
                className="btn btn-outline"
                style={{ padding: '8px 14px' }}
              >
                <Search size={16} />
                <span>Search</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleIssueToken}>
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input
                type="text"
                className="form-input"
                placeholder="Patient full name"
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
                  placeholder="Age"
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
                    <option key={d.code} value={d.code}>{d.name} ({d.code})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Triage / Chief Complaint</label>
              <textarea
                className="form-textarea"
                rows="2"
                placeholder="Symptoms reported by patient..."
                value={formData.reasonForVisit}
                onChange={(e) => setFormData({ ...formData, reasonForVisit: e.target.value })}
              />
            </div>

            <div
              style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '18px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <input
                type="checkbox"
                id="emergencyFlag"
                checked={formData.isPriority}
                onChange={(e) => setFormData({ ...formData, isPriority: e.target.checked })}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <label htmlFor="emergencyFlag" style={{ cursor: 'pointer', fontSize: '0.9rem', fontWeight: 700, color: '#991b1b' }}>
                Priority Emergency / Senior Citizen (Places patient at head of queue)
              </label>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px' }}
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Issue Token & Print Slip'}
            </button>
          </form>

          {/* Latest Printed Slip preview */}
          {latestIssuedToken && (
            <div
              style={{
                marginTop: '20px',
                border: '2px dashed #0284c7',
                borderRadius: '10px',
                padding: '16px',
                background: '#f0f9ff',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0369a1' }}>PRINTED TOKEN PASS</span>
                <button
                  onClick={() => window.print()}
                  className="btn btn-outline"
                  style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                >
                  <Printer size={13} />
                  <span>Print</span>
                </button>
              </div>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#0284c7', textAlign: 'center', margin: '8px 0' }}>
                {latestIssuedToken.tokenNumber}
              </div>
              <div style={{ textAlign: 'center', fontSize: '0.9rem', color: '#334155' }}>
                <div><strong>{latestIssuedToken.patientName}</strong> ({latestIssuedToken.departmentCode} OPD)</div>
                <div>Estimated Wait: ~{latestIssuedToken.estimatedWaitMinutes || 15} minutes</div>
              </div>
            </div>
          )}
        </div>

        {/* Live Queue Department Monitor */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card">
            <div className="card-header" style={{ marginBottom: '12px' }}>
              <h2 className="card-title">
                <Activity size={20} color="#0d9488" />
                <span>Live Queue: {selectedDept}</span>
              </h2>
              <span className="live-indicator">
                <span className="live-dot"></span>
                <span>Auto-refreshing</span>
              </span>
            </div>

            {/* Department stats pills */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '18px' }}>
              <div style={{ background: '#fef3c7', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.72rem', color: '#92400e', fontWeight: 700 }}>WAITING</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#b45309' }}>
                  {departmentQueue.stats?.waitingCount || (departmentQueue.waiting?.length || 0)}
                </div>
              </div>

              <div style={{ background: '#e0f2fe', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.72rem', color: '#075985', fontWeight: 700 }}>NOW SERVING</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0284c7' }}>
                  {departmentQueue.stats?.inProgressCount || (departmentQueue.inProgress?.length || 0)}
                </div>
              </div>

              <div style={{ background: '#d1fae5', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.72rem', color: '#065f46', fontWeight: 700 }}>COMPLETED</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981' }}>
                  {departmentQueue.stats?.completedCount || (departmentQueue.completed?.length || 0)}
                </div>
              </div>
            </div>

            {/* Waiting List */}
            <h3 style={{ fontSize: '1rem', marginBottom: '10px', color: '#475569' }}>
              Waiting Patients ({departmentQueue.waiting?.length || 0})
            </h3>

            <div style={{ maxHeight: '380px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(!departmentQueue.waiting || departmentQueue.waiting.length === 0) ? (
                <div style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                  No patients currently waiting in {selectedDept}
                </div>
              ) : (
                departmentQueue.waiting.map((t, idx) => (
                  <div key={t.id || idx} className="queue-item" style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#64748b' }}>#{idx + 1}</span>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="queue-token-pill" style={{ fontSize: '1.05rem' }}>{t.tokenNumber}</span>
                          {t.isPriority && <span className="badge badge-priority" style={{ fontSize: '0.7rem' }}>PRIORITY</span>}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#334155' }}>{t.patientName}</div>
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
    </div>
  );
}

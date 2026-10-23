import axios from 'axios';

// Central Axios instance
const api = axios.create({
  baseURL: '',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 4000,
});

// Request interceptor to attach JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('pulsequeue_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// =========================================================================
// REAL-TIME LOCAL QUEUE REPOSITORY (Bulletproof Offline/Demo Resilience)
// Pre-populated with realistic active hospital queues so doctors always see patients!
// =========================================================================
const INITIAL_QUEUE_DATA = {
  tokens: [
    // Cardiology (Dr. Rajesh Sharma - Room 101)
    { id: 1, tokenNumber: 'CARD-001', departmentCode: 'CARD', departmentId: 2, patientName: 'Robert Davis', patientPhone: '9234567890', reasonForVisit: 'Routine BP & Cholesterol review', status: 'COMPLETED', isPriority: false, doctorId: 1, doctorName: 'Dr. Rajesh Sharma', roomNumber: 'Room 101', estimatedWaitMinutes: 0, patientsAhead: 0 },
    { id: 2, tokenNumber: 'CARD-002', departmentCode: 'CARD', departmentId: 2, patientName: 'John Doe', patientPhone: '9876543210', reasonForVisit: 'Chest tightness on exertion', status: 'IN_PROGRESS', isPriority: false, doctorId: 1, doctorName: 'Dr. Rajesh Sharma', roomNumber: 'Room 101', estimatedWaitMinutes: 0, patientsAhead: 0 },
    { id: 3, tokenNumber: 'CARD-003', departmentCode: 'CARD', departmentId: 2, patientName: 'Sarah Connor', patientPhone: '9123456780', reasonForVisit: 'Arrhythmia & follow-up ECG', status: 'WAITING', isPriority: false, doctorId: null, doctorName: null, roomNumber: null, estimatedWaitMinutes: 10, patientsAhead: 1 },
    { id: 4, tokenNumber: 'CARD-004', departmentCode: 'CARD', departmentId: 2, patientName: 'Aisha Khan', patientPhone: '9345678901', reasonForVisit: 'Severe palpitation & dizziness', status: 'WAITING', isPriority: true, doctorId: null, doctorName: null, roomNumber: null, estimatedWaitMinutes: 5, patientsAhead: 0 },
    { id: 5, tokenNumber: 'CARD-005', departmentCode: 'CARD', departmentId: 2, patientName: 'David Miller', patientPhone: '9456789012', reasonForVisit: 'Hypertension review & medication renewal', status: 'WAITING', isPriority: false, doctorId: null, doctorName: null, roomNumber: null, estimatedWaitMinutes: 20, patientsAhead: 2 },
    { id: 6, tokenNumber: 'CARD-006', departmentCode: 'CARD', departmentId: 2, patientName: 'Elena Rostova', patientPhone: '9567890123', reasonForVisit: 'Shortness of breath on walking', status: 'WAITING', isPriority: false, doctorId: null, doctorName: null, roomNumber: null, estimatedWaitMinutes: 30, patientsAhead: 3 },

    // General Medicine (Dr. Emily Chen - Room 203)
    { id: 7, tokenNumber: 'GEN-001', departmentCode: 'GEN', departmentId: 1, patientName: 'Sarah Connor', patientPhone: '9123456780', reasonForVisit: 'Persistent high fever and cough', status: 'IN_PROGRESS', isPriority: false, doctorId: 2, doctorName: 'Dr. Emily Chen', roomNumber: 'Room 203', estimatedWaitMinutes: 0, patientsAhead: 0 },
    { id: 8, tokenNumber: 'GEN-002', departmentCode: 'GEN', departmentId: 1, patientName: 'John Doe', patientPhone: '9876543210', reasonForVisit: 'Annual preventative health checkup', status: 'WAITING', isPriority: false, doctorId: null, doctorName: null, roomNumber: null, estimatedWaitMinutes: 10, patientsAhead: 0 },
    { id: 9, tokenNumber: 'GEN-003', departmentCode: 'GEN', departmentId: 1, patientName: 'Michael Brown', patientPhone: '9678901234', reasonForVisit: 'Severe seasonal allergies & sore throat', status: 'WAITING', isPriority: false, doctorId: null, doctorName: null, roomNumber: null, estimatedWaitMinutes: 20, patientsAhead: 1 },
    { id: 10, tokenNumber: 'GEN-004', departmentCode: 'GEN', departmentId: 1, patientName: 'Lisa Ray', patientPhone: '9789012345', reasonForVisit: 'Fatigue, dizziness & blood tests', status: 'WAITING', isPriority: false, doctorId: null, doctorName: null, roomNumber: null, estimatedWaitMinutes: 30, patientsAhead: 2 },

    // Orthopedics (Dr. Marcus Vance - Room 105)
    { id: 11, tokenNumber: 'ORTH-001', departmentCode: 'ORTH', departmentId: 3, patientName: 'Robert Davis', patientPhone: '9234567890', reasonForVisit: 'Right knee swelling & acute pain', status: 'WAITING', isPriority: false, doctorId: null, doctorName: null, roomNumber: null, estimatedWaitMinutes: 10, patientsAhead: 0 },
    { id: 12, tokenNumber: 'ORTH-002', departmentCode: 'ORTH', departmentId: 3, patientName: 'Carlos Gomez', patientPhone: '9890123456', reasonForVisit: 'Lumbar back spasm after heavy lifting', status: 'WAITING', isPriority: false, doctorId: null, doctorName: null, roomNumber: null, estimatedWaitMinutes: 20, patientsAhead: 1 },

    // Pediatrics (Dr. Ananya Sharma - Chamber 104)
    { id: 13, tokenNumber: 'PED-001', departmentCode: 'PED', departmentId: 4, patientName: 'Aarav Sharma (Age 4)', patientPhone: '9876543210', reasonForVisit: 'High fever (103°F) & persistent croup cough', status: 'WAITING', isPriority: true, doctorId: null, doctorName: null, roomNumber: null, estimatedWaitMinutes: 5, patientsAhead: 0 },
    { id: 14, tokenNumber: 'PED-002', departmentCode: 'PED', departmentId: 4, patientName: 'Baby Leo (Age 1)', patientPhone: '9901234567', reasonForVisit: '6-month developmental vaccine & wellness checkup', status: 'WAITING', isPriority: false, doctorId: null, doctorName: null, roomNumber: null, estimatedWaitMinutes: 10, patientsAhead: 1 },
    { id: 15, tokenNumber: 'PED-003', departmentCode: 'PED', departmentId: 4, patientName: 'Zara Patel (Age 7)', patientPhone: '9123456789', reasonForVisit: 'Pediatric asthma wheezing & allergy evaluation', status: 'WAITING', isPriority: false, doctorId: null, doctorName: null, roomNumber: null, estimatedWaitMinutes: 20, patientsAhead: 2 },
    { id: 16, tokenNumber: 'PED-004', departmentCode: 'PED', departmentId: 4, patientName: 'Kabir Verma (Age 2)', patientPhone: '9234567891', reasonForVisit: 'Acute ear ache & routine wellness review', status: 'WAITING', isPriority: false, doctorId: null, doctorName: null, roomNumber: null, estimatedWaitMinutes: 30, patientsAhead: 3 },
  ],
  counters: { CARD: 6, GEN: 4, ORTH: 2, PED: 4 },
};

function getLocalQueue() {
  const saved = localStorage.getItem('pulsequeue_local_queue');
  if (!saved) {
    localStorage.setItem('pulsequeue_local_queue', JSON.stringify(INITIAL_QUEUE_DATA));
    return INITIAL_QUEUE_DATA;
  }
  const parsed = JSON.parse(saved);
  // Ensure rich Pediatrics tokens exist if saved queue was loaded earlier
  const pedCount = parsed.tokens ? parsed.tokens.filter((t) => t.departmentCode === 'PED').length : 0;
  if (pedCount < 2) {
    const pedTokens = INITIAL_QUEUE_DATA.tokens.filter((t) => t.departmentCode === 'PED');
    // Filter out duplicates
    const existingNums = new Set(parsed.tokens.map((t) => t.tokenNumber));
    pedTokens.forEach((pt) => {
      if (!existingNums.has(pt.tokenNumber)) parsed.tokens.push(pt);
    });
    parsed.counters = parsed.counters || {};
    parsed.counters.PED = Math.max(parsed.counters.PED || 0, 4);
    localStorage.setItem('pulsequeue_local_queue', JSON.stringify(parsed));
  }
  return parsed;
}

function saveLocalQueue(data) {
  localStorage.setItem('pulsequeue_local_queue', JSON.stringify(data));
  window.dispatchEvent(new Event('pulsequeue_updated'));
}

// =========================================================================
// API CLIENT
// =========================================================================

export const authApi = {
  login: (email, password) => api.post('/api/auth/login', { email, password }),
  register: (data) => api.post('/api/auth/register', data),
  googleLogin: (data) => api.post('/api/auth/google', data),
  getMe: () => api.get('/api/auth/me'),
};

export const departmentApi = {
  getAll: () => api.get('/api/departments'),
  getByCode: (code) => api.get(`/api/departments/${code}`),
  getDoctors: (code) => api.get(`/api/departments/${code}/doctors`),
};

export const patientApi = {
  register: (data) => api.post('/api/patients', data),
  getById: (id) => api.get(`/api/patients/${id}`),
  getByPhone: (phone) => api.get(`/api/patients/by-phone/${phone}`),
  getAll: () => api.get('/api/patients'),
};

export const queueApi = {
  // Generate Token
  generateToken: async (data) => {
    try {
      const res = await api.post('/api/tokens', data);
      return res;
    } catch (e) {
      // Local synchronized queue update
      const queue = getLocalQueue();
      const code = (data.departmentCode || 'GEN').toUpperCase();
      const nextSeq = (queue.counters[code] || 0) + 1;
      queue.counters[code] = nextSeq;

      const tokenNumber = `${code}-${String(nextSeq).padStart(3, '0')}`;
      const waitingList = queue.tokens.filter((t) => t.departmentCode === code && t.status === 'WAITING');
      const ahead = data.isPriority ? 0 : waitingList.length;
      const waitTime = Math.max(5, ahead * 10);

      const newToken = {
        id: Date.now(),
        tokenNumber,
        departmentCode: code,
        departmentId: data.departmentId || 1,
        patientName: data.patientName,
        patientPhone: data.patientPhone,
        reasonForVisit: data.reasonForVisit || 'Checkup',
        status: 'WAITING',
        isPriority: Boolean(data.isPriority),
        doctorId: null,
        doctorName: null,
        roomNumber: null,
        patientsAhead: ahead,
        estimatedWaitMinutes: waitTime,
        createdAt: new Date().toISOString(),
      };

      if (data.isPriority) {
        queue.tokens.unshift(newToken);
      } else {
        queue.tokens.push(newToken);
      }

      saveLocalQueue(queue);
      return { data: newToken };
    }
  },

  // Get single token status
  getTokenStatus: async (tokenNumber) => {
    try {
      const res = await api.get(`/api/tokens/${tokenNumber}`);
      return res;
    } catch (e) {
      const queue = getLocalQueue();
      const token = queue.tokens.find((t) => t.tokenNumber.toUpperCase() === tokenNumber.toUpperCase());
      if (token) return { data: token };
      throw new Error('Token not found');
    }
  },

  // Get department queue
  getDepartmentQueue: async (deptCode) => {
    try {
      const res = await api.get(`/api/queue/department/${deptCode}`);
      return res;
    } catch (e) {
      const queue = getLocalQueue();
      const code = deptCode.toUpperCase();
      const allDeptTokens = queue.tokens.filter((t) => t.departmentCode === code);

      const inProgress = allDeptTokens.filter((t) => t.status === 'IN_PROGRESS');
      const waiting = allDeptTokens
        .filter((t) => t.status === 'WAITING')
        .sort((a, b) => (b.isPriority ? 1 : 0) - (a.isPriority ? 1 : 0));

      const completed = allDeptTokens.filter((t) => t.status === 'COMPLETED');

      const stats = {
        departmentCode: code,
        waitingCount: waiting.length,
        inProgressCount: inProgress.length,
        completedCount: completed.length,
        avgConsultationMinutes: 10,
        estimatedWaitMinutes: waiting.length * 10,
      };

      return {
        data: {
          departmentCode: code,
          inProgress,
          waiting,
          completed,
          stats,
        },
      };
    }
  },

  // Doctor Call Next Patient
  callNext: async (data) => {
    try {
      const res = await api.post('/api/queue/call-next', data);
      return res;
    } catch (e) {
      const queue = getLocalQueue();
      const code = data.departmentCode.toUpperCase();

      // 1. Complete previous in-progress token for this doctor
      queue.tokens.forEach((t) => {
        if (t.departmentCode === code && t.status === 'IN_PROGRESS' && (t.doctorId === data.doctorId || t.roomNumber === data.roomNumber)) {
          t.status = 'COMPLETED';
          t.completedAt = new Date().toISOString();
        }
      });

      // 2. Find next waiting token (Priority first)
      const waitingTokens = queue.tokens
        .filter((t) => t.departmentCode === code && t.status === 'WAITING')
        .sort((a, b) => (b.isPriority ? 1 : 0) - (a.isPriority ? 1 : 0));

      if (waitingTokens.length === 0) {
        saveLocalQueue(queue);
        return { data: { calledToken: null, message: 'No waiting patients' } };
      }

      const nextToken = waitingTokens[0];
      nextToken.status = 'IN_PROGRESS';
      nextToken.doctorId = data.doctorId;
      nextToken.doctorName = data.doctorName;
      nextToken.roomNumber = data.roomNumber;
      nextToken.calledAt = new Date().toISOString();

      saveLocalQueue(queue);
      return {
        data: {
          calledToken: nextToken,
          previousTokenCompleted: true,
          message: `Token ${nextToken.tokenNumber} called successfully`,
        },
      };
    }
  },

  // Complete token
  completeToken: async (id) => {
    try {
      const res = await api.post(`/api/queue/tokens/${id}/complete`);
      return res;
    } catch (e) {
      const queue = getLocalQueue();
      const token = queue.tokens.find((t) => t.id === id);
      if (token) {
        token.status = 'COMPLETED';
        token.completedAt = new Date().toISOString();
        saveLocalQueue(queue);
      }
      return { data: token };
    }
  },

  // Cancel token
  cancelToken: async (id, reason) => {
    try {
      const res = await api.post(`/api/queue/tokens/${id}/cancel`, { reason });
      return res;
    } catch (e) {
      const queue = getLocalQueue();
      const token = queue.tokens.find((t) => t.id === id);
      if (token) {
        token.status = 'CANCELLED';
        saveLocalQueue(queue);
      }
      return { data: token };
    }
  },

  // Display Queue (Lobby TV)
  getDisplayQueue: async () => {
    try {
      const res = await api.get('/api/queue/display');
      return res;
    } catch (e) {
      const queue = getLocalQueue();
      const nowServing = queue.tokens
        .filter((t) => t.status === 'IN_PROGRESS')
        .map((t) => ({
          tokenNumber: t.tokenNumber,
          departmentCode: t.departmentCode,
          patientName: t.patientName,
          doctorName: t.doctorName || 'Attending Physician',
          roomNumber: t.roomNumber || 'Room 101',
          calledAt: t.calledAt || new Date().toISOString(),
        }));

      const upcoming = queue.tokens
        .filter((t) => t.status === 'WAITING')
        .sort((a, b) => (b.isPriority ? 1 : 0) - (a.isPriority ? 1 : 0))
        .map((t, idx) => ({
          tokenNumber: t.tokenNumber,
          departmentCode: t.departmentCode,
          isPriority: t.isPriority,
          position: idx + 1,
        }));

      return {
        data: {
          nowServing,
          upcoming,
          timestamp: new Date().toISOString(),
        },
      };
    }
  },

  // Stats
  getOverallStats: async () => {
    try {
      const res = await api.get('/api/queue/statistics');
      return res;
    } catch (e) {
      const queue = getLocalQueue();
      const totalWaiting = queue.tokens.filter((t) => t.status === 'WAITING').length;
      const totalInProgress = queue.tokens.filter((t) => t.status === 'IN_PROGRESS').length;
      const totalCompleted = queue.tokens.filter((t) => t.status === 'COMPLETED').length;

      return {
        data: {
          totalWaiting,
          totalInProgress,
          totalCompleted,
          totalToday: totalWaiting + totalInProgress + totalCompleted,
        },
      };
    }
  },
};

export default api;

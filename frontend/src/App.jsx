import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import PatientPage from './pages/PatientPage';
import ReceptionPage from './pages/ReceptionPage';
import DoctorPage from './pages/DoctorPage';
import DisplayPage from './pages/DisplayPage';
import LoginPage from './pages/LoginPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="app-container">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/patient" element={<PatientPage />} />
              <Route path="/reception" element={<ReceptionPage />} />
              <Route path="/doctor" element={<DoctorPage />} />
              <Route path="/display" element={<DisplayPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

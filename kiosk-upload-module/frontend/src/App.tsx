import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { KioskView } from './pages/KioskView';
import { MobileUploadView } from './pages/MobileUploadView';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/kiosk" element={<KioskView />} />
        <Route path="/upload/:token" element={<MobileUploadView />} />
        <Route path="*" element={<Navigate to="/kiosk" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

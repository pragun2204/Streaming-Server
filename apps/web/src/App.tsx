import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './stores/authStore';

import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { CreateRoomPage } from './pages/CreateRoomPage';
import { RoomPage } from './pages/RoomPage';
import { SettingsPage } from './pages/SettingsPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { HealthPage } from './pages/HealthPage';
import { NotFoundPage } from './pages/NotFoundPage';

const queryClient = new QueryClient();

export const App: React.FC = () => {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    // Check existing session cookie on app mount
    checkAuth();
  }, [checkAuth]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/rooms/new" element={<CreateRoomPage />} />
          <Route path="/rooms/:roomId" element={<RoomPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/health" element={<HealthPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;

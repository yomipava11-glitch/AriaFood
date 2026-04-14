import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import './index.css';

import Layout from './components/Layout';
import LoadingScreen from './components/LoadingScreen';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Scan from './pages/Scan';
import History from './pages/History';
import Settings from './pages/Settings';
import AnalysisResult from './pages/AnalysisResult';
import MealDetails from './pages/MealDetails';
import Recommendations from './pages/Recommendations';
import Onboarding from './pages/Onboarding';
import ChatAssistant from './pages/ChatAssistant';
import Workout from './pages/Workout';
import Cycle from './pages/Cycle';

import { DataProvider, useData } from './context/DataContext';

const AppRoutes = () => {
    const { userProfile, loading } = useData();

    if (loading) return <LoadingScreen />;

    // If has_completed_onboarding is false or undefined (new profile), force onboarding
    const needsOnboarding = userProfile ? userProfile.has_completed_onboarding === false : true;

    return (
        <Routes>
            <Route path="/onboarding" element={needsOnboarding ? <Onboarding /> : <Navigate to="/" replace />} />
            <Route path="/" element={needsOnboarding ? <Navigate to="/onboarding" replace /> : <Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="scan" element={<Scan />} />
                <Route path="scan/results" element={<AnalysisResult />} />
                <Route path="history" element={<History />} />
                <Route path="meals" element={<MealDetails />} />
                <Route path="recommendations" element={<Recommendations />} />
                <Route path="settings" element={<Settings />} />
                <Route path="chat" element={<ChatAssistant />} />
                <Route path="workout" element={<Workout />} />
                <Route path="cycle" element={<Cycle />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
        </Routes>
    );
};

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(prev => {
        if (prev?.user?.id === newSession?.user?.id && prev?.access_token === newSession?.access_token) {
          return prev;
        }
        return newSession;
      });
    });
    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <LoadingScreen />;

  if (!session) return <Auth />;

  return (
    <DataProvider session={session}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </DataProvider>
  );
}

export default App;

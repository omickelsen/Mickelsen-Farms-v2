import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Header from './components/Header';
import Home from './pages/Home';
import HorseBoarding from './pages/HorseBoarding';
import Events from './pages/Events';
import Calendar from './pages/Calendar';
import HorseLessons from './pages/HorseLessons';
import TrailRides from './pages/TrailRides';
import Admin from './pages/Admin';
import AdminHorseBoarding from './pages/AdminHorseBoarding';
import AdminHorseLessons from './pages/AdminHorseLessons';
import AdminTrailRides from './pages/AdminTrailRides';
import AdminEvents from './pages/AdminEvents';

function App() {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google) {
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
        if (!clientId) {
          console.error('VITE_GOOGLE_CLIENT_ID is not set in .env file');
          return;
        }
        // Initialization handled in Header.jsx, so no renderButton here
      }
    };
    script.onerror = () => console.error('Failed to load Google Sign-In SDK');
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleCredentialResponse = (response) => {
    localStorage.setItem('googleIdToken', response.credential);
    window.location.href = '/';
  };

  return (
    <AuthProvider>
      <Router>
        <div>
          <Header />
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/horse-boarding" element={<HorseBoarding />} />
              <Route path="/events" element={<Events />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/horse-lessons" element={<HorseLessons />} />
              <Route path="/trail-rides" element={<TrailRides />} />
              <Route
                path="/admin"
                element={
                  <RequireAdmin>
                    <Admin />
                  </RequireAdmin>
                }
              />
              <Route
                path="/admin/horse-boarding"
                element={
                  <RequireAdmin>
                    <AdminHorseBoarding />
                  </RequireAdmin>
                }
              />
              <Route
                path="/admin/horse-lessons"
                element={
                  <RequireAdmin>
                    <AdminHorseLessons />
                  </RequireAdmin>
                }
              />
              <Route
                path="/admin/trail-rides"
                element={
                  <RequireAdmin>
                    <AdminTrailRides />
                  </RequireAdmin>
                }
              />
              <Route
                path="/admin/events"
                element={
                  <RequireAdmin>
                    <AdminEvents />
                  </RequireAdmin>
                }
              />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

function RequireAdmin({ children }) {
  const { token, isAdmin, loading, error } = useAuth();

  useEffect(() => {
  }, [token, isAdmin, loading, error]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;
  if (!token || !isAdmin) {
    return <Navigate to="/" replace />;
  }
  return children;
}

export default App;
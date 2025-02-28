import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Header from './components/Header';
import Home from './pages/Home';
import HorseBoarding from './pages/HorseBoarding';
import Events from './pages/Events';
import Calendar from './pages/Calendar'; // This can be removed or adjusted if CalendarComponent fully replaces it
import HorseLessons from './pages/HorseLessons';
import TrailRides from './pages/TrailRides';
import Admin from './pages/Admin';

function App() {
  useEffect(() => {
    console.log('App component mounted');
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
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
        });
        window.google.accounts.id.renderButton(
          document.getElementById('google-signin'),
          { theme: 'outline', size: 'large' }
        );
      }
    };
    script.onerror = () => console.error('Failed to load Google Sign-In SDK');
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleCredentialResponse = (response) => {
    console.log('Encoded JWT ID token: ' + response.credential);
    window.localStorage.setItem('googleIdToken', response.credential);
    window.location.href = '/admin';
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
              <Route path="/calendar" element={<Calendar />} /> {/* Keep this for standalone view if needed */}
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
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

function RequireAdmin({ children }) {
  const { token, isAdmin } = useAuth();

  useEffect(() => {
    console.log('RequireAdmin token and isAdmin:', { token, isAdmin });
  }, [token, isAdmin]);

  if (!token || !isAdmin) {
    return <Navigate to="/" replace />;
  }
  return children;
}

export default App;
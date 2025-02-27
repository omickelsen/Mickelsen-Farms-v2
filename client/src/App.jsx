import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Home from './pages/Home';
import HorseBoarding from './pages/HorseBoarding';
import Events from './pages/Events';
import Calendar from './pages/Calendar';
import HorseLessons from './pages/HorseLessons';
import TrailRides from './pages/TrailRides';
import Admin from './pages/Admin';

function Header() {
  const { token, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('Header token updated:', token);
  }, [token]);

  return (
    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: '#333', color: '#fff' }}>
      <h1>Mickelsen Family Farms</h1>
      <div>
        {!token ? (
          <div id="google-signin" style={{ display: 'inline-block' }}></div>
        ) : (
          <button onClick={() => { logout(); navigate('/'); }} style={{ marginLeft: '10px' }}>Logout</button>
        )}
      </div>
    </header>
  );
}

function App() {
  const [count, setCount] = useState(0);

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
          return; // Prevent initialization if clientId is missing
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
    window.location.href = '/admin'; // Redirect to admin after login
  };

  useEffect(() => {
    const idToken = window.localStorage.getItem('googleIdToken');
    if (idToken) {
      console.log('Found stored token:', idToken);
    }
  }, []);

  return (
    <AuthProvider>
      <Router>
        <div>
          <Header />
          <nav>
            <ul>
              <li><a href="/" onClick={() => console.log('Navigating to Home')}>Home</a></li>
              <li><a href="/horse-boarding" onClick={() => console.log('Navigating to Horse Boarding')}>Horse Boarding</a></li>
              <li><a href="/events" onClick={() => console.log('Navigating to Events')}>Events</a></li>
              <li><a href="/calendar" onClick={() => console.log('Navigating to Calendar')}>Calendar</a></li>
              <li><a href="/horse-lessons" onClick={() => console.log('Navigating to Horse Lessons')}>Horse Lessons</a></li>
              <li><a href="/trail-rides" onClick={() => console.log('Navigating to Trail Rides')}>Trail Rides</a></li>
              <li><a href="/admin" onClick={() => console.log('Navigating to Admin')}>Admin</a></li>
            </ul>
          </nav>
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
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
        </Router>
      </AuthProvider>
    
  );
}

// Higher-order component to require admin access
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
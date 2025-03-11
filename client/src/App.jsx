import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
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
import AuthSuccess from './components/AuthSuccess'; // Import the new component

function App() {
  return (
    <AuthProvider>
      <Router>
        <div>
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
              <Route path="/auth/success" element={<AuthSuccess />} /> {/* Use the imported component */}
              <Route path="*" element={<Home />} /> {/* Fallback to Home */}
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

function RequireAdmin({ children }) {
  const { token, isAdmin, loading, error } = useAuth();
  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;
  if (!token || !isAdmin) return <Navigate to="/" replace />;
  return children;
}

export default App;
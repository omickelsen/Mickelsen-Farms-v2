import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Home from './pages/Home';
import HorseBoarding from './pages/HorseBoarding';
import Events from './pages/Events';
import Calendar from './pages/Calendar';
import HorseLessons from './pages/HorseLessons';
import TrailRides from './pages/TrailRides';
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
              <Route path="/auth/success" element={<AuthSuccess />} /> {/* Use the imported component */}
              <Route path="*" element={<Home />} /> {/* Fallback to Home */}
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
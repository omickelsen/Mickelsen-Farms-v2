import { useState, useEffect, useCallback } from 'react';
import { fetchWithToken } from '../context/AuthContext';
import CalendarComponent from '../components/CalendarComponent';
import ServicesSection from '../components/ServicesSection';
import CarouselComponent from '../components/CarouselComponent';
import { useAuth } from '../context/AuthContext';

function Home() {
  const [events, setEvents] = useState([]);
  const [request, setRequest] = useState('');
  const [message, setMessage] = useState('');
  const [images, setImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loadingImages, setLoadingImages] = useState(true); // New loading state
  const { token, isAdmin } = useAuth();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetchWithToken(
          process.env.NODE_ENV === 'production'
            ? 'https://your-heroku-app.herokuapp.com/api/calendar/events'
            : 'http://localhost:5000/api/calendar/events'
        );
        if (!response.ok) throw new Error('Failed to fetch events');
        const data = await response.json();
        setEvents(data);
      } catch (err) {
        console.error('Error fetching events:', err);
      }
    };

    const fetchImages = async () => {
      setLoadingImages(true); // Start loading
      try {
        const response = await fetch(
          process.env.NODE_ENV === 'production'
            ? 'https://your-heroku-app.herokuapp.com/api/images'
            : 'http://localhost:5000/api/images'
        ); // Unauthenticated fetch for images
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        console.log('Pre-loaded images:', data.images); // Debug log
        setImages(data.images || []);
      } catch (err) {
        console.error('Error pre-loading images:', err);
        setImages([]); // Fallback to empty array on error
      } finally {
        setLoadingImages(false); // End loading
      }
    };

    fetchEvents();
    fetchImages();
  }, []);

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(
        process.env.NODE_ENV === 'production'
          ? 'https://your-heroku-app.herokuapp.com/api/requests'
          : 'http://localhost:5000/api/requests',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ request }),
        }
      );
      if (response.ok) {
        setMessage('Request submitted successfully!');
        setRequest('');
      } else {
        setMessage('Failed to submit request.');
      }
    } catch (err) {
      setMessage('Error submitting request: ' + err.message);
    }
  };

  const handleEventUpdate = useCallback((updatedEvents) => {
    setEvents(updatedEvents);
  }, []);

  return (
    <div className="min-h-screen pt-24">
      <section className="relative bg-cover bg-center h-96" style={{ backgroundImage: "url('/path-to-farm-image.jpg')" }}>
        <div className="absolute inset-0 bg-black opacity-50"></div>
        <div className="relative text-center text-white pt-24">
          <h1 className="text-5xl font-bold">Mickelsen Family Farms</h1>
          <p className="mt-4 text-xl">Experience the beauty of rural life with us.</p>
        </div>
      </section>

      <section id="about" className="py-16 bg-white">
        <h2 className="section-title">About Us</h2>
        <div className="max-w-3xl mx-auto text-center text-gray-700">
          <p>A family-owned farm offering horse boarding, lessons, trail rides, and events. [Add your detailed description here.]</p>
          {loadingImages ? (
            <p className="text-center">Loading images...</p>
          ) : (
            <CarouselComponent
              images={images}
              setImages={setImages}
              currentImageIndex={currentImageIndex}
              setCurrentImageIndex={setCurrentImageIndex}
            />
          )}
        </div>
      </section>

      <ServicesSection />

      <section id="calendar" className="py-16 bg-white">
        <h2 className="section-title">Calendar</h2>
        <div className="calendar-section">
          <CalendarComponent
            onEventUpdate={handleEventUpdate}
            height="900px"
          />
        </div>
      </section>

      <section id="contact" className="py-16 bg-white">
        <h2 className="section-title">Contact Us</h2>
        <div className="max-w-md mx-auto text-center text-gray-700">
          <p>1339 North 500 East, Pleasant Grove, UT 84062</p>
          <p>Email: mickelsenfamilyfarms@gmail.com</p>
          <p>JoDee: +1 801-372-2070 | AL: +1 801-360-6071</p>
        </div>
      </section>

      <section className="py-16 bg-gray-100">
        <h3 className="text-2xl font-bold text-center mb-4">Submit a Request</h3>
        <form onSubmit={handleRequestSubmit} className="max-w-md mx-auto">
          <textarea
            value={request}
            onChange={(e) => setRequest(e.target.value)}
            placeholder="Enter your request"
            className="w-full p-2 mb-4 border rounded"
          />
          <button type="submit" className="btn-primary">
            Submit
          </button>
          {message && <p className="mt-2 text-gray-700">{message}</p>}
        </form>
      </section>
    </div>
  );
}

export default Home;
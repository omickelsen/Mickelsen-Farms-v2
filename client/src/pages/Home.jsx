import React, { useState, useEffect } from 'react';
import { fetchWithToken } from '../context/AuthContext';
import Calendar from './Calendar';
import ServicesSection from '../components/ServicesSection';
import CarouselComponent from '../components/CarouselComponent';
import HeroSection from '../components/HeroSection'; // Import the new component
import { useAuth } from '../context/AuthContext';

function Home() {
  const [request, setRequest] = useState('');
  const [message, setMessage] = useState('');
  const [images, setImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loadingImages, setLoadingImages] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    const fetchImages = async () => {
      setLoadingImages(true);
      try {
        const response = await fetch(
          process.env.NODE_ENV === 'production'
            ? 'https://your-heroku-app.herokuapp.com/api/images'
            : 'http://localhost:5000/api/images'
        );
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        setImages(data.images || []);
      } catch (err) {
        console.error('Error pre-loading images:', err);
        setImages([]);
      } finally {
        setLoadingImages(false);
      }
    };

    fetchImages();
  }, [token]);

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

  return (
    <div className="min-h-screen bg-gray-100">
      <HeroSection /> {/* Use the new component */}
      <section id="about" className="py-10 md:py-16">
        <div className="container">
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
        </div>
      </section>

      <ServicesSection />

      <section id="calendar" className="py-6 md:py-8">
        <div className="container">
          <Calendar />
        </div>
      </section>

      <section id="contact" className="py-10 md:py-16">
        <div className="container">
          <h2 className="section-title">Contact Us</h2>
          <div className="max-w-md mx-auto text-center text-gray-700">
            <p>1339 North 500 East, Pleasant Grove, UT 84062</p>
            <p>Email: mickelsenfamilyfarms@gmail.com</p>
            <p>JoDee: +1 801-372-2070 | AL: +1 801-360-6071</p>
          </div>
        </div>
      </section>

      <section className="py-10 md:py-16 bg-gray-100">
        <div className="container">
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
        </div>
      </section>
    </div>
  );
};

export default Home;
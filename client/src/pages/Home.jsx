import React, { useState, useEffect } from 'react';
import { fetchWithToken } from '../context/AuthContext';
import Calendar from './Calendar';
import ServicesSection from '../components/ServicesSection';
import CarouselComponent from '../components/CarouselComponent';
import HeroSection from '../components/HeroSection';
import { useAuth } from '../context/AuthContext';

function Home() {
  const [request, setRequest] = useState('');
  const [message, setMessage] = useState('');
  const [carouselImages, setCarouselImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loadingImages, setLoadingImages] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    const fetchImages = async () => {
      setLoadingImages(true);
      try {
        const response = await fetch('/api/images?page=carousel');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        setCarouselImages(data.images || []);
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error fetching carousel images:', err);
        }
        setCarouselImages([]);
      } finally {
        setLoadingImages(false);
      }
    };

    fetchImages();
  }, [token]);

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request }),
      });
      if (response.ok) {
        setMessage('Request submitted successfully!');
        setRequest('');
      } else {
        setMessage('Failed to submit request.');
      }
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error submitting request:', err);
      }
      setMessage('Error submitting request: ' + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <HeroSection />
      <section id="about" className="py-10 md:py-16">
        <div className="container">
          <h2 className="section-title">About Us</h2>
          <div className="max-w-3xl mx-auto text-center text-gray-700">
            <p>A family-owned farm offering horse boarding, lessons, trail rides, and events. JoDee’s dream of turning her passion into a profession happened years ago with the help of her husband Al. They met and married in 1987 when JoDee announced that when he married her the horse came along. Both of them grew up on big farms in Idaho, so it seemed the logical step. They purchased their small farm surrounded by many other farms and immediately began filling the property with chickens, ducks, rabbits, goats, horses, pigs, dogs, cats, cows and children. Al quickly shared in her passion and soon found himself enjoying time riding horses in the mountains and caring for the various animals. They raised their kids teaching them to care for animals and the hard work involved with maintaining a family farm. As their children grew, JoDee taught them how to ride horses and Al taught them how to care for the animals and all the skills involved on the farm like hauling hay, fixing fence and shoveling manure. As their children left and began to have families of their own and all the farms around them were developed into housing developments, they decided they wanted to offer the same experiences to others that their children experienced. Thus, they started offering services in the summer months by hosting “Down on the Farm” mini camps, birthday parties and horse riding lessons. About 9 years ago, Al retired and they decided to expand their business and build an indoor arena and offer services year round to include boarding. A few years ago they acquired additional property to expand their services more. They currently are boarding horses, many of their own and love sharing their passion of caring and interacting with animals with others.</p>
            {loadingImages ? (
              <p className="text-center">Loading images...</p>
            ) : (
              <CarouselComponent
                images={carouselImages}
                setImages={setCarouselImages}
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
}

export default Home;
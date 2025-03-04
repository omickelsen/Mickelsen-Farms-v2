import React, { useState, useEffect } from 'react';
import EditableSection from '../components/EditableSection';
import ImageUpload from '../components/ImageUpload';
import PdfDownload from '../components/PdfDownload';

function TrailRides() {
  const [imageUrls, setImageUrls] = useState(['/path-to-trail1.jpg', '/path-to-trail2.jpg']);
  const [registrationPdf, setRegistrationPdf] = useState('/trail-rides-registration.pdf');

  useEffect(() => {
    fetch(process.env.NODE_ENV === 'production' ? 'https://your-heroku-app.herokuapp.com/api/images?page=trail-rides' : 'http://localhost:5000/api/images?page=trail-rides')
      .then((res) => res.json())
      .then((data) => setImageUrls(data.images.length ? data.images : ['/path-to-trail1.jpg', '/path-to-trail2.jpg']));
  }, []);

  const handleImageUpload = (url) => {
    setImageUrls((prev) => [...prev, url].slice(-2));
  };

  return (
    <div className="py-16 bg-gray-50 min-h-screen">
      <h2 className="text-4xl font-bold text-center text-teal-700 mb-12">Trail Rides</h2>
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-2xl font-semibold text-teal-600 mb-4">Overview</h3>
            <EditableSection page="trail-rides" initialContent="Enjoy guided trail rides through our scenic farm landscapes." field="overview" />
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-2xl font-semibold text-teal-600 mb-4">Details</h3>
            <EditableSection page="trail-rides" initialContent="Includes guide, horse, and safety gear. Pricing: $75/hour, $200/half-day." field="details" />
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-2xl font-semibold text-teal-600 mb-4">Gallery</h3>
            <ImageUpload onUpload={handleImageUpload} page="trail-rides" />
            <div className="mt-4 grid grid-cols-2 gap-4">
              {imageUrls.map((url, index) => (
                <img key={index} src={url} alt={`Trail Ride ${index + 1}`} className="w-full h-64 object-cover rounded-lg" />
              ))}
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-2xl font-semibold text-teal-600 mb-4">Registration</h3>
            <EditableSection page="trail-rides" initialContent="Download our trail ride registration form:" field="registration" />
            <div className="mt-4">
              <PdfDownload url={registrationPdf} label="Trail Ride Registration" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TrailRides;
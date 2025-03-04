import React, { useState, useEffect } from 'react';
import EditableSection from '../components/EditableSection';
import ImageUpload from '../components/ImageUpload';
import PdfDownload from '../components/PdfDownload';

function Events() {
  const [imageUrls, setImageUrls] = useState(['/path-to-event1.jpg', '/path-to-event2.jpg']);
  const [dayCampPdf, setDayCampPdf] = useState('/events-daycamp.pdf');
  const [partyPdf, setPartyPdf] = useState('/events-party.pdf');
  const [waiverPdf, setWaiverPdf] = useState('/events-waiver.pdf');

  useEffect(() => {
    fetch(process.env.NODE_ENV === 'production' ? 'https://your-heroku-app.herokuapp.com/api/images?page=events' : 'http://localhost:5000/api/images?page=events')
      .then((res) => res.json())
      .then((data) => setImageUrls(data.images.length ? data.images : ['/path-to-event1.jpg', '/path-to-event2.jpg']));
  }, []);

  const handleImageUpload = (url) => {
    setImageUrls((prev) => [...prev, url].slice(-4));
  };

  return (
    <div className="py-16 bg-gray-50 min-h-screen">
      <h2 className="text-4xl font-bold text-center text-teal-700 mb-12">Events</h2>
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-2xl font-semibold text-teal-600 mb-4">Overview</h3>
            <EditableSection page="events" initialContent="We host various events including riding clinics, open houses, and seasonal celebrations." field="overview" />
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-2xl font-semibold text-teal-600 mb-4">Down on the Farm Day Camps</h3>
            <EditableSection page="events" initialContent="Join our Down on the Farm Day Camps! Register here:" field="dayCamps" />
            <div className="mt-4">
              <PdfDownload url={dayCampPdf} label="Day Camp Registration" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-2xl font-semibold text-teal-600 mb-4">Farm Parties & Birthday Parties</h3>
            <EditableSection page="events" initialContent="Host your Farm Party or Birthday Party with us! Register here:" field="parties" />
            <div className="mt-4">
              <PdfDownload url={partyPdf} label="Party Registration" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-2xl font-semibold text-teal-600 mb-4">Gallery</h3>
            <ImageUpload onUpload={handleImageUpload} page="events" />
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              {imageUrls.map((url, index) => (
                <img key={index} src={url} alt={`Event ${index + 1}`} className="w-full h-48 object-cover rounded-lg" />
              ))}
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-2xl font-semibold text-teal-600 mb-4">Waiver</h3>
            <EditableSection page="events" initialContent="Download our Release and Waiver of Liability form:" field="waiver" />
            <div className="mt-4">
              <PdfDownload url={waiverPdf} label="Release and Waiver" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Events;
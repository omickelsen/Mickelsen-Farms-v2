import React, { useState, useEffect } from 'react';
import EditableSection from '../components/EditableSection';
import ImageUpload from '../components/ImageUpload';
import PdfDownload from '../components/PdfDownload';

function HorseBoarding() {
  const [imageUrl, setImageUrl] = useState('/path-to-farm-image.jpg');
  const [pdfUrl, setPdfUrl] = useState('/horse-boarding.pdf'); // Sample PDF

  useEffect(() => {
    fetch(process.env.NODE_ENV === 'production' ? 'https://your-heroku-app.herokuapp.com/api/images?page=horse-boarding' : 'http://localhost:5000/api/images?page=horse-boarding')
      .then((res) => res.json())
      .then((data) => setImageUrl(data.images[0] || '/path-to-farm-image.jpg'));
  }, []);

  return (
    <div className="py-16 bg-gray-50 min-h-screen">
      <h2 className="text-4xl font-bold text-center text-teal-700 mb-12">Horse Boarding</h2>
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-2xl font-semibold text-teal-600 mb-4">Overview</h3>
            <EditableSection page="horse-boarding" initialContent="Top-notch horse boarding with spacious stalls, daily care, and training facilities." field="overview" />
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-2xl font-semibold text-teal-600 mb-4">Pricing</h3>
            <EditableSection page="horse-boarding" initialContent="Starting at $500/month for standard stall, $750/month for premium with outdoor access." field="pricing" />
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-2xl font-semibold text-teal-600 mb-4">Extras</h3>
            <EditableSection page="horse-boarding" initialContent="Extras include grooming ($50/week), training sessions ($75/hour), and custom feed plans." field="extras" />
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-2xl font-semibold text-teal-600 mb-4">Gallery</h3>
            <ImageUpload onUpload={setImageUrl} page="horse-boarding" />
            {imageUrl && <img src={imageUrl} alt="Horse Boarding" className="mt-4 w-full h-64 object-cover rounded-lg" />}
            <div className="mt-4">
              <EditableSection page="horse-boarding" initialContent="Download our boarding info:" field="pdf" />
              <PdfDownload url={pdfUrl} label="Boarding Info PDF" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HorseBoarding;
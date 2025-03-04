import React, { useState, useEffect } from 'react';
import EditableSection from '../components/EditableSection';
import ImageUpload from '../components/ImageUpload';
import PdfDownload from '../components/PdfDownload';

function HorseLessons() {
  const [imageUrl, setImageUrl] = useState('/path-to-lesson-image.jpg');
  const [ridingLevelsPdf, setRidingLevelsPdf] = useState('/horse-lessons-levels.pdf');
  const [registrationPdf, setRegistrationPdf] = useState('/horse-lessons-registration.pdf');
  const [paymentInfo, setPaymentInfo] = useState('Payment via cash, check, or Venmo @MickelsenFarms.');

  useEffect(() => {
    fetch(process.env.NODE_ENV === 'production' ? 'https://your-heroku-app.herokuapp.com/api/images?page=horse-lessons' : 'http://localhost:5000/api/images?page=horse-lessons')
      .then((res) => res.json())
      .then((data) => setImageUrl(data.images[0] || '/path-to-lesson-image.jpg'));
  }, []);

  return (
    <div className="py-16 bg-gray-50 min-h-screen">
      <h2 className="text-4xl font-bold text-center text-teal-700 mb-12">Horse Lessons</h2>
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-2xl font-semibold text-teal-600 mb-4">Overview</h3>
            <EditableSection page="horse-lessons" initialContent="Offering beginner to advanced riding lessons with experienced instructors." field="overview" />
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-2xl font-semibold text-teal-600 mb-4">Riding Levels</h3>
            <EditableSection page="horse-lessons" initialContent="Riding Levels: Beginner, Intermediate, Advanced. Download PDFs for details:" field="levels" />
            <div className="mt-4 space-x-4">
              <PdfDownload url={ridingLevelsPdf} label="Beginner Guide" />
              <PdfDownload url={ridingLevelsPdf} label="Intermediate Guide" />
              <PdfDownload url={ridingLevelsPdf} label="Advanced Guide" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-2xl font-semibold text-teal-600 mb-4">Payment Info</h3>
            <EditableSection page="horse-lessons" initialContent={paymentInfo} field="payment" />
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-2xl font-semibold text-teal-600 mb-4">Registration</h3>
            <EditableSection page="horse-lessons" initialContent="Download our registration form:" field="registration" />
            <div className="mt-4">
              <PdfDownload url={registrationPdf} label="Registration Form" />
            </div>
            <div className="mt-4">
              <ImageUpload onUpload={setImageUrl} page="horse-lessons" />
              {imageUrl && <img src={imageUrl} alt="Horse Lessons" className="mt-4 w-full h-64 object-cover rounded-lg" />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HorseLessons;
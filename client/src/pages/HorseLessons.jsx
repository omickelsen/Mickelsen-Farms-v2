import React, { useState, useEffect } from 'react';
import EditableSection from '../components/EditableSection';
import ImageUpload from '../components/ImageUpload';
import PdfUpload from '../components/PdfUpload';
import PdfDownload from '../components/PdfDownload';
import { useAuth, fetchWithToken } from '../context/AuthContext';

// Function to extract the original filename from URL, removing the timestamp prefix
const getFilenameFromUrl = (url) => {
  const parts = url.substring(url.lastIndexOf('/') + 1).split('-');
  return parts.slice(1).join('-'); // Join remaining parts after removing the timestamp
};

function HorseLessons() {
  const { isAdmin } = useAuth();
  const [imageUrl, setImageUrl] = useState('/path-to-lesson-image.jpg');
  const [ridingLevelsPdf, setRidingLevelsPdf] = useState(() => {
    const saved = localStorage.getItem('ridingLevelsPdf');
    return saved ? JSON.parse(saved) : [];
  });
  const [registrationPdf, setRegistrationPdf] = useState(() => {
    const saved = localStorage.getItem('registrationPdf');
    return saved ? JSON.parse(saved) : [];
  });
  const [paymentInfo, setPaymentInfo] = useState('Payment via cash, check, or Venmo @MickelsenFarms.');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const imageResponse = await fetch(
          process.env.NODE_ENV === 'production'
            ? 'https://your-heroku-app.herokuapp.com/api/images?page=horse-lessons'
            : 'http://localhost:5000/api/images?page=horse-lessons'
        );
        const imageData = await imageResponse.json();
        console.log('Fetched image data for HorseLessons:', imageData);
        setImageUrl(imageData.images[0] || '/path-to-lesson-image.jpg');
        // No PDF fetch; using localStorage
      } catch (err) {
        console.error('Error fetching image data:', err);
      }
    };
    fetchData();

    // Persist state to localStorage
    localStorage.setItem('ridingLevelsPdf', JSON.stringify(ridingLevelsPdf));
    localStorage.setItem('registrationPdf', JSON.stringify(registrationPdf));
  }, [ridingLevelsPdf, registrationPdf]);

  const handlePdfUpload = (url, section) => {
    if (!isAdmin) {
      alert('Only admins can upload PDFs.');
      return;
    }
    console.log('Handling PDF upload with URL:', url, 'for section:', section);

    if (section === 'ridingLevels') {
      setRidingLevelsPdf((prev) => {
        const updated = [...prev, url];
        console.log('Updated Riding Levels PDF state:', updated);
        return updated;
      });
    } else if (section === 'registration') {
      setRegistrationPdf((prev) => {
        const updated = [...prev, url];
        console.log('Updated Registration PDF state:', updated);
        return updated;
      });
    }
  };

  const handlePdfRemove = async (urlToRemove, section) => {
    if (!isAdmin) {
      alert('Only admins can remove PDFs.');
      return;
    }
    console.log('Handling PDF removal with URL:', urlToRemove, 'from section:', section);

    const response = await fetchWithToken(
      process.env.NODE_ENV === 'production'
        ? 'https://your-heroku-app.herokuapp.com/api/pdfs'
        : 'http://localhost:5000/api/pdfs',
      {
        method: 'DELETE',
        headers: { 'Page': 'horse-lessons', 'Url': urlToRemove },
      }
    );
    if (response.ok) {
      if (section === 'ridingLevels') {
        setRidingLevelsPdf((prev) => {
          const updated = prev.filter((url) => url !== urlToRemove);
          console.log('Updated Riding Levels PDF state after removal:', updated);
          return updated;
        });
      } else if (section === 'registration') {
        setRegistrationPdf((prev) => {
          const updated = prev.filter((url) => url !== urlToRemove);
          console.log('Updated Registration PDF state after removal:', updated);
          return updated;
        });
      }
    } else {
      console.error('Failed to remove PDF:', await response.text());
    }
  };

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
            <EditableSection page="horse-lessons" initialContent="Download PDFs for details:" field="levels" />
            <div className="mt-4 space-x-4">
              {ridingLevelsPdf.map((url, index) => (
                <div key={index} className="flex items-center">
                  <PdfDownload url={url} label={getFilenameFromUrl(url)} />
                  {isAdmin && <button onClick={() => handlePdfRemove(url, 'ridingLevels')} className="text-red-500 ml-2">Remove</button>}
                </div>
              ))}
              {isAdmin && <PdfUpload onUpload={(url) => handlePdfUpload(url, 'ridingLevels')} page="horse-lessons" />}
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
              {registrationPdf.map((url, index) => (
                <div key={index} className="flex items-center">
                  <PdfDownload url={url} label={getFilenameFromUrl(url)} />
                  {isAdmin && <button onClick={() => handlePdfRemove(url, 'registration')} className="text-red-500 ml-2">Remove</button>}
                </div>
              ))}
              {isAdmin && <PdfUpload onUpload={(url) => handlePdfUpload(url, 'registration')} page="horse-lessons" />}
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
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

function HorseBoarding() {
  const { isAdmin } = useAuth();
  const [imageUrl, setImageUrl] = useState('/path-to-farm-image.jpg');
  const [documentsPdf, setDocumentsPdf] = useState(() => {
    const saved = localStorage.getItem('horseBoarding_documentsPdf');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const imageResponse = await fetch(
          process.env.NODE_ENV === 'production'
            ? 'https://your-heroku-app.herokuapp.com/api/images?page=horse-boarding'
            : 'http://localhost:5000/api/images?page=horse-boarding'
        );
        const imageData = await imageResponse.json();
        console.log('Fetched image data for HorseBoarding:', imageData);
        setImageUrl(imageData.images[0] || '/path-to-farm-image.jpg');
        // No PDF fetch; using localStorage
      } catch (err) {
        console.error('Error fetching image data:', err);
      }
    };
    fetchData();

    // Persist state to localStorage with page-specific key
    localStorage.setItem('horseBoarding_documentsPdf', JSON.stringify(documentsPdf));
  }, [documentsPdf]);

  const handleImageUpload = (url) => {
    setImageUrl(url);
  };

  const handlePdfUpload = (url, section) => {
    if (!isAdmin) {
      alert('Only admins can upload PDFs.');
      return;
    }
    console.log('Handling PDF upload with URL:', url, 'for section:', section);

    if (section === 'documents') {
      setDocumentsPdf((prev) => {
        const updated = [...prev, url];
        console.log('Updated Documents PDF state:', updated);
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
        headers: { 'Page': 'horse-boarding', 'Url': urlToRemove },
      }
    );
    if (response.ok) {
      setDocumentsPdf((prev) => {
        const updated = prev.filter((url) => url !== urlToRemove);
        console.log('Updated Documents PDF state after removal:', updated);
        return updated;
      });
    } else {
      console.error('Failed to remove PDF:', await response.text());
    }
  };

  return (
    <div className="py-16 bg-gray-50 min-h-screen">
      <h2 className="text-4xl font-bold text-center text-teal-700 mb-12">Horse Boarding</h2>
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-2xl font-semibold text-teal-600 mb-4">Overview</h3>
            <EditableSection page="horse-boarding" initialContent="Top-notch horse boarding with spacious stalls, daily care, and training facilities. Use of all the facility
Lighted indoor arena 40 X 60
Lighted Outdoor arean 72 X 72
Enclosed stalls and daily turnout
Stalls cleaned 3X per week
High quality alfalfa feed and pasture turn out in the summer
Fresh water
Use of tack room and storage of tack
Use of barn equipment-whips, jumps, barrels, etc.
Health records kept on every horse boarded at our facility" field="overview" />
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-2xl font-semibold text-teal-600 mb-4">Pricing</h3>
            <EditableSection page="horse-boarding" initialContent="Currently: $400 per month.
$50 initial deposit
Extra Fees for special requests (SawDust)
Boarding fees are subject to change subject to change based off of feed cost." field="pricing" />
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-2xl font-semibold text-teal-600 mb-4">Extras</h3>
            <EditableSection page="horse-boarding" initialContent="Extras include grooming ($50/week), training sessions ($75/hour), and custom feed plans." field="extras" />
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-2xl font-semibold text-teal-600 mb-4">Gallery & Documents</h3>
            <ImageUpload onUpload={handleImageUpload} page="horse-boarding" />
            {imageUrl && <img src={imageUrl} alt="Horse Boarding" className="mt-4 w-full h-64 object-cover rounded-lg" />}
            {isAdmin && <PdfUpload onUpload={(url) => handlePdfUpload(url, 'documents')} page="horse-boarding" />}
            {documentsPdf.length > 0 && (
              <div className="mt-4">
                <EditableSection page="horse-boarding" initialContent="Download our boarding documents:" field="pdf" />
                {documentsPdf.map((url, index) => (
                  <div key={index} className="flex items-center justify-between mt-2">
                    <PdfDownload url={url} label={getFilenameFromUrl(url)} />
                    {isAdmin && <button onClick={() => handlePdfRemove(url, 'documents')} className="text-red-500 ml-2">Remove</button>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default HorseBoarding;
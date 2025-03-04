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

function Events() {
  const { isAdmin } = useAuth();
  const [imageUrls, setImageUrls] = useState(() => {
    const saved = localStorage.getItem('events_imageUrls');
    return saved ? JSON.parse(saved) : ['/path-to-event1.jpg', '/path-to-event2.jpg'];
  });
  const [dayCampPdf, setDayCampPdf] = useState(() => {
    const saved = localStorage.getItem('events_dayCampPdf');
    return saved ? JSON.parse(saved) : [];
  });
  const [partyPdf, setPartyPdf] = useState(() => {
    const saved = localStorage.getItem('events_partyPdf');
    return saved ? JSON.parse(saved) : [];
  });
  const [waiverPdf, setWaiverPdf] = useState(() => {
    const saved = localStorage.getItem('events_waiverPdf');
    return saved ? JSON.parse(saved) : [];
  });

  // Fetch data on mount only
  useEffect(() => {
    const fetchData = async () => {
      try {
        const imageResponse = await fetch(
          process.env.NODE_ENV === 'production'
            ? 'https://your-heroku-app.herokuapp.com/api/images?page=events'
            : 'http://localhost:5000/api/images?page=events'
        );
        const imageData = await imageResponse.json();
        console.log('Fetched image data for Events (once):', imageData);
        setImageUrls(imageData.images.length ? imageData.images : ['/path-to-event1.jpg', '/path-to-event2.jpg']);
        // No PDF fetch; using localStorage
      } catch (err) {
        console.error('Error fetching image data:', err);
      }
    };
    fetchData();
  }, []); // Empty dependency array to run once on mount

  // Persist state to localStorage on change
  useEffect(() => {
    localStorage.setItem('events_imageUrls', JSON.stringify(imageUrls));
    localStorage.setItem('events_dayCampPdf', JSON.stringify(dayCampPdf));
    localStorage.setItem('events_partyPdf', JSON.stringify(partyPdf));
    localStorage.setItem('events_waiverPdf', JSON.stringify(waiverPdf));
  }, [imageUrls, dayCampPdf, partyPdf, waiverPdf]);

  const handleImageUpload = (url) => {
    setImageUrls((prev) => {
      const updated = [...prev, url].slice(-4); // Limit to last 4 images
      console.log('Updated Image URLs state:', updated);
      return updated;
    });
  };

  const handlePdfUpload = (url, section) => {
    if (!isAdmin) {
      alert('Only admins can upload PDFs.');
      return;
    }
    console.log('Handling PDF upload with URL:', url, 'for section:', section);

    if (section === 'dayCamp') {
      setDayCampPdf((prev) => {
        const updated = [...prev, url];
        console.log('Updated Day Camp PDF state:', updated);
        return updated;
      });
    } else if (section === 'party') {
      setPartyPdf((prev) => {
        const updated = [...prev, url];
        console.log('Updated Party PDF state:', updated);
        return updated;
      });
    } else if (section === 'waiver') {
      setWaiverPdf((prev) => {
        const updated = [...prev, url];
        console.log('Updated Waiver PDF state:', updated);
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
        headers: { 'Page': 'events', 'Url': urlToRemove },
      }
    );
    if (response.ok) {
      if (section === 'dayCamp') {
        setDayCampPdf((prev) => {
          const updated = prev.filter((url) => url !== urlToRemove);
          console.log('Updated Day Camp PDF state after removal:', updated);
          return updated;
        });
      } else if (section === 'party') {
        setPartyPdf((prev) => {
          const updated = prev.filter((url) => url !== urlToRemove);
          console.log('Updated Party PDF state after removal:', updated);
          return updated;
        });
      } else if (section === 'waiver') {
        setWaiverPdf((prev) => {
          const updated = prev.filter((url) => url !== urlToRemove);
          console.log('Updated Waiver PDF state after removal:', updated);
          return updated;
        });
      }
    } else {
      console.error('Failed to remove PDF:', await response.text());
    }
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
              {dayCampPdf.map((url, index) => (
                <div key={index} className="flex items-center">
                  <PdfDownload url={url} label={getFilenameFromUrl(url)} />
                  {isAdmin && <button onClick={() => handlePdfRemove(url, 'dayCamp')} className="text-red-500 ml-2">Remove</button>}
                </div>
              ))}
              {isAdmin && <PdfUpload onUpload={(url) => handlePdfUpload(url, 'dayCamp')} page="events" />}
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-2xl font-semibold text-teal-600 mb-4">Farm Parties & Birthday Parties</h3>
            <EditableSection page="events" initialContent="Host your Farm Party or Birthday Party with us! Register here:" field="parties" />
            <div className="mt-4">
              {partyPdf.map((url, index) => (
                <div key={index} className="flex items-center">
                  <PdfDownload url={url} label={getFilenameFromUrl(url)} />
                  {isAdmin && <button onClick={() => handlePdfRemove(url, 'party')} className="text-red-500 ml-2">Remove</button>}
                </div>
              ))}
              {isAdmin && <PdfUpload onUpload={(url) => handlePdfUpload(url, 'party')} page="events" />}
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
              {waiverPdf.map((url, index) => (
                <div key={index} className="flex items-center">
                  <PdfDownload url={url} label={getFilenameFromUrl(url)} />
                  {isAdmin && <button onClick={() => handlePdfRemove(url, 'waiver')} className="text-red-500 ml-2">Remove</button>}
                </div>
              ))}
              {isAdmin && <PdfUpload onUpload={(url) => handlePdfUpload(url, 'waiver')} page="events" />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Events;
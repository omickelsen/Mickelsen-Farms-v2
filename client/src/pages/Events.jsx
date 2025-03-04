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
  const { isAdmin, token } = useAuth();
  const [imageUrls, setImageUrls] = useState([]);
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const imageResponse = await fetch(
          process.env.NODE_ENV === 'production'
            ? 'https://your-heroku-app.herokuapp.com/api/images?page=events'
            : 'http://localhost:5000/api/images?page=events'
        );
        const imageData = await imageResponse.json();
        console.log('Fetched image data for Events (initial):', imageData);
        setImageUrls(imageData.images || []);
      } catch (err) {
        console.error('Error fetching initial image data:', err);
      }
    };
    fetchData();
  }, []); // Empty dependency array to run once

  const handleImageUpload = async (event) => {
    if (!isAdmin) {
      alert('Only admins can upload images.');
      return;
    }

    const files = event.target.files;
    if (!files.length) return;

    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append('image', file));

    try {
      const uploadResponse = await fetchWithToken(
        process.env.NODE_ENV === 'production'
          ? 'https://your-heroku-app.herokuapp.com/api/images'
          : 'http://localhost:5000/api/images',
        {
          method: 'POST',
          body: formData,
          headers: { 'Page': 'events' },
        }
      );

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        throw new Error(`Failed to upload image: ${errorText}`);
      }
      const uploadData = await uploadResponse.json();
      console.log('Upload response:', uploadData);

      // Re-fetch updated images
      const updatedResponse = await fetch(
        process.env.NODE_ENV === 'production'
          ? 'https://your-heroku-app.herokuapp.com/api/images?page=events'
          : 'http://localhost:5000/api/images?page=events'
      );
      if (updatedResponse.ok) {
        const updatedData = await updatedResponse.json();
        console.log('Updated images data:', updatedData);
        setImageUrls(updatedData.images || []);
      }

      alert('Images uploaded successfully!');
    } catch (err) {
      console.error('Error uploading images:', err);
      alert('Failed to upload images: ' + err.message);
    }
  };

  const handleImageDelete = async (urlToRemove) => {
    if (!isAdmin) {
      alert('Only admins can delete images.');
      return;
    }

    try {
      const deleteResponse = await fetchWithToken(
        process.env.NODE_ENV === 'production'
          ? 'https://your-heroku-app.herokuapp.com/api/images'
          : 'http://localhost:5000/api/images',
        {
          method: 'DELETE',
          headers: { 'Page': 'events', 'Url': urlToRemove },
        }
      );

      if (!deleteResponse.ok) {
        const errorText = await deleteResponse.text();
        throw new Error(`Failed to delete image: ${errorText}`);
      }

      // Re-fetch after deletion
      const updatedResponse = await fetch(
        process.env.NODE_ENV === 'production'
          ? 'https://your-heroku-app.herokuapp.com/api/images?page=events'
          : 'http://localhost:5000/api/images?page=events'
      );
      if (updatedResponse.ok) {
        const updatedData = await updatedResponse.json();
        console.log('Updated images data after delete:', updatedData);
        setImageUrls(updatedData.images || []);
      }

      alert('Image deleted successfully!');
    } catch (err) {
      console.error('Error deleting image:', err);
      alert('Failed to delete image: ' + err.message);
    }
  };

  const [selectedImage, setSelectedImage] = useState(null);

  const openModal = (url) => {
    setSelectedImage(url);
  };

  const closeModal = () => {
    setSelectedImage(null);
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
        localStorage.setItem('events_dayCampPdf', JSON.stringify(updated));
        console.log('Updated Day Camp PDF state:', updated);
        return updated;
      });
    } else if (section === 'party') {
      setPartyPdf((prev) => {
        const updated = [...prev, url];
        localStorage.setItem('events_partyPdf', JSON.stringify(updated));
        console.log('Updated Party PDF state:', updated);
        return updated;
      });
    } else if (section === 'waiver') {
      setWaiverPdf((prev) => {
        const updated = [...prev, url];
        localStorage.setItem('events_waiverPdf', JSON.stringify(updated));
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
          localStorage.setItem('events_dayCampPdf', JSON.stringify(updated));
          console.log('Updated Day Camp PDF state after removal:', updated);
          return updated;
        });
      } else if (section === 'party') {
        setPartyPdf((prev) => {
          const updated = prev.filter((url) => url !== urlToRemove);
          localStorage.setItem('events_partyPdf', JSON.stringify(updated));
          console.log('Updated Party PDF state after removal:', updated);
          return updated;
        });
      } else if (section === 'waiver') {
        setWaiverPdf((prev) => {
          const updated = prev.filter((url) => url !== urlToRemove);
          localStorage.setItem('events_waiverPdf', JSON.stringify(updated));
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
            {isAdmin && (
              <div>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="border p-2 rounded mb-4"
                />
              </div>
            )}
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              {imageUrls.map((url, index) => (
                <div key={index} className="relative">
                  <img
                    src={url}
                    alt={`Event ${index + 1}`}
                    className="w-full h-48 object-cover rounded-lg cursor-pointer"
                    onClick={() => openModal(url)}
                  />
                  {isAdmin && (
                    <button
                      onClick={() => handleImageDelete(url)}
                      className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded"
                    >
                      X
                    </button>
                  )}
                </div>
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

      {/* Modal for larger image view */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={closeModal}>
          <div className="relative">
            <img src={selectedImage} alt="Enlarged" className="max-h-[90vh] max-w-[90vw]" />
            <button
              onClick={closeModal}
              className="absolute top-2 right-2 text-white bg-red-600 p-2 rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Events;
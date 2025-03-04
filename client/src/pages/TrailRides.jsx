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

function TrailRides() {
  const { isAdmin, token } = useAuth();
  const [imageUrls, setImageUrls] = useState([]);
  const [registrationPdf, setRegistrationPdf] = useState(() => {
    const saved = localStorage.getItem('trailRides_registrationPdf');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const imageResponse = await fetch(
          process.env.NODE_ENV === 'production'
            ? 'https://your-heroku-app.herokuapp.com/api/images?page=trail-rides'
            : 'http://localhost:5000/api/images?page=trail-rides'
        );
        const imageData = await imageResponse.json();
        console.log('Fetched image data for TrailRides (initial):', imageData);
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
          headers: { 'Page': 'trail-rides' },
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
          ? 'https://your-heroku-app.herokuapp.com/api/images?page=trail-rides'
          : 'http://localhost:5000/api/images?page=trail-rides'
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
          headers: { 'Page': 'trail-rides', 'Url': urlToRemove },
        }
      );

      if (!deleteResponse.ok) {
        const errorText = await deleteResponse.text();
        throw new Error(`Failed to delete image: ${errorText}`);
      }

      // Re-fetch after deletion
      const updatedResponse = await fetch(
        process.env.NODE_ENV === 'production'
          ? 'https://your-heroku-app.herokuapp.com/api/images?page=trail-rides'
          : 'http://localhost:5000/api/images?page=trail-rides'
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

    if (section === 'registration') {
      setRegistrationPdf((prev) => {
        const updated = [...prev, url];
        localStorage.setItem('trailRides_registrationPdf', JSON.stringify(updated));
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
        headers: { 'Page': 'trail-rides', 'Url': urlToRemove },
      }
    );
    if (response.ok) {
      setRegistrationPdf((prev) => {
        const updated = prev.filter((url) => url !== urlToRemove);
        localStorage.setItem('trailRides_registrationPdf', JSON.stringify(updated));
        console.log('Updated Registration PDF state after removal:', updated);
        return updated;
      });
    } else {
      console.error('Failed to remove PDF:', await response.text());
    }
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
            <div className="mt-4 grid grid-cols-2 gap-4">
              {imageUrls.map((url, index) => (
                <div key={index} className="relative">
                  <img
                    src={url}
                    alt={`Trail Ride ${index + 1}`}
                    className="w-full h-64 object-cover rounded-lg cursor-pointer"
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
            <h3 className="text-2xl font-semibold text-teal-600 mb-4">Registration</h3>
            <EditableSection page="trail-rides" initialContent="Download our trail ride registration form:" field="registration" />
            <div className="mt-4">
              {registrationPdf.map((url, index) => (
                <div key={index} className="flex items-center">
                  <PdfDownload url={url} label={getFilenameFromUrl(url)} />
                  {isAdmin && <button onClick={() => handlePdfRemove(url, 'registration')} className="text-red-500 ml-2">Remove</button>}
                </div>
              ))}
              {isAdmin && <PdfUpload onUpload={(url) => handlePdfUpload(url, 'registration')} page="trail-rides" />}
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

export default TrailRides;
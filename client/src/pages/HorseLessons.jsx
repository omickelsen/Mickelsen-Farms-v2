import React, { useState, useEffect } from 'react';
import EditableSection from '../components/EditableSection';
import ImageUpload from '../components/ImageUpload';
import PdfUpload from '../components/PdfUpload';
import PdfDownload from '../components/PdfDownload';
import { useAuth, fetchWithToken } from '../context/AuthContext';

// Function to extract the original filename from URL, removing the timestamp prefix
const getFilenameFromUrl = (url) => {
  const parts = url.substring(url.lastIndexOf('/') + 1).split('-');
  return parts.slice(1).join('-');
};

function HorseLessons() {
  const { isAdmin, token } = useAuth();
  const [imageUrls, setImageUrls] = useState([]);
  const [ridingLevelsPdf, setRidingLevelsPdf] = useState(() => {
    const saved = localStorage.getItem('ridingLevelsPdf');
    return saved ? JSON.parse(saved) : [];
  });
  const [registrationPdf, setRegistrationPdf] = useState(() => {
    const saved = localStorage.getItem('registrationPdf');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const cacheBuster = new Date().getTime();
        const response = await fetch(`/api/images?page=horse-lessons&t=${cacheBuster}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        setImageUrls(data.images || []);
        // Sync with backend to remove phantoms
        const savedImages = localStorage.getItem('imageUrls');
        if (savedImages) {
          const savedUrls = JSON.parse(savedImages);
          const validUrls = data.images.filter(url => savedUrls.includes(url));
          if (validUrls.length !== savedUrls.length) {
            localStorage.setItem('imageUrls', JSON.stringify(data.images));
          }
        } else {
          localStorage.setItem('imageUrls', JSON.stringify(data.images));
        }
      } catch (err) {
        // Error handled silently in production
      }
    };
    fetchData();
  }, []);

  const handleImageUpload = async (event) => {
    if (!isAdmin) return;

    const files = event.target.files;
    if (!files.length) return;

    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append('image', file));

    try {
      const uploadResponse = await fetchWithToken('/api/images', {
        method: 'POST',
        body: formData,
        headers: { 'Page': 'horse-lessons' },
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        throw new Error(`Failed to upload image: ${errorText}`);
      }
      const uploadData = await uploadResponse.json();

      const updatedResponse = await fetch('/api/images?page=horse-lessons');
      if (updatedResponse.ok) {
        const updatedData = await updatedResponse.json();
        setImageUrls(updatedData.images || []);
        localStorage.setItem('imageUrls', JSON.stringify(updatedData.images));
      }
    } catch (err) {
      // Error handled silently in production
    }
  };

  const handleImageDelete = async (urlToRemove) => {
    if (!isAdmin) return;

    try {
      const deleteResponse = await fetchWithToken('/api/images', {
        method: 'DELETE',
        headers: { 'Page': 'horse-lessons', 'Url': urlToRemove },
      });

      if (!deleteResponse.ok) {
        const errorText = await deleteResponse.text();
        throw new Error(`Failed to delete image: ${errorText}`);
      }

      // Fetch updated list to sync state
      const updatedResponse = await fetch('/api/images?page=horse-lessons');
      if (updatedResponse.ok) {
        const updatedData = await updatedResponse.json();
        setImageUrls(updatedData.images || []);
        localStorage.setItem('imageUrls', JSON.stringify(updatedData.images));
      }
    } catch (err) {
      // Error handled silently in production
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
    if (!isAdmin) return;

    if (section === 'ridingLevels') {
      setRidingLevelsPdf((prev) => {
        const updated = [...prev, url];
        localStorage.setItem('ridingLevelsPdf', JSON.stringify(updated));
        return updated;
      });
    } else if (section === 'registration') {
      setRegistrationPdf((prev) => {
        const updated = [...prev, url];
        localStorage.setItem('registrationPdf', JSON.stringify(updated));
        return updated;
      });
    }
  };

  const handlePdfRemove = async (urlToRemove, section) => {
    if (!isAdmin) return;

    const response = await fetchWithToken('/api/pdfs', {
      method: 'DELETE',
      headers: { 'Page': 'horse-lessons', 'Url': urlToRemove },
    });
    if (response.ok) {
      if (section === 'ridingLevels') {
        setRidingLevelsPdf((prev) => {
          const updated = prev.filter((url) => url !== urlToRemove);
          localStorage.setItem('ridingLevelsPdf', JSON.stringify(updated));
          return updated;
        });
      } else if (section === 'registration') {
        setRegistrationPdf((prev) => {
          const updated = prev.filter((url) => url !== urlToRemove);
          localStorage.setItem('registrationPdf', JSON.stringify(updated));
          return updated;
        });
      }
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
            <EditableSection page="horse-lessons" initialContent="Payment via cash, check, or Venmo @MickelsenFarms." field="payment" />
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
            {isAdmin && (
              <div className="mt-4">
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
                    alt={`Horse Lessons ${index + 1}`}
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
        </div>
      </div>

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

export default HorseLessons;
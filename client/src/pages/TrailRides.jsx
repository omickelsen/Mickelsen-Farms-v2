import React, { useState, useEffect } from 'react';
import EditableSection from '../components/EditableSection';
import PdfUpload from '../components/PdfUpload';
import PdfDownload from '../components/PdfDownload';
import { useAuth, fetchWithToken } from '../context/AuthContext';

const getFilenameFromUrl = (url) => {
  const parts = url.substring(url.lastIndexOf('/') + 1).split('-');
  return parts.slice(1).join('-');
};

function TrailRides() {
  const { isAdmin, token } = useAuth();
  const [imageUrls, setImageUrls] = useState([]);
  const [registrationPdf, setRegistrationPdf] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch images
        const imageResponse = await fetch('/api/images?page=trail-rides');
        const imageData = await imageResponse.json();
        setImageUrls(imageData.images || []);

        // Fetch PDFs
        const pdfResponse = await fetch('/api/pdfs?page=trail-rides');
        if (!pdfResponse.ok) throw new Error('Failed to fetch PDFs');
        const pdfData = await pdfResponse.json();
        setRegistrationPdf(pdfData.pdfs || []);
        // Optionally update localStorage as a fallback
        localStorage.setItem('trailRides_registrationPdf', JSON.stringify(pdfData.pdfs || []));
      } catch (err) {
        console.error('Fetch error:', err);
        // Fallback to localStorage if fetch fails
        const savedPdfs = localStorage.getItem('trailRides_registrationPdf');
        if (savedPdfs) setRegistrationPdf(JSON.parse(savedPdfs));
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
        headers: { 'Page': 'trail-rides' },
      });
      if (!uploadResponse.ok) throw new Error('Image upload failed');
      const updatedResponse = await fetch('/api/images?page=trail-rides');
      if (updatedResponse.ok) {
        const updatedData = await updatedResponse.json();
        setImageUrls(updatedData.images || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleImageDelete = async (urlToRemove) => {
    if (!isAdmin) return;
    try {
      const deleteResponse = await fetchWithToken('/api/images', {
        method: 'DELETE',
        headers: { 'Page': 'trail-rides', 'Url': urlToRemove },
      });
      if (!deleteResponse.ok) throw new Error('Image delete failed');
      const updatedResponse = await fetch('/api/images?page=trail-rides');
      if (updatedResponse.ok) {
        const updatedData = await updatedResponse.json();
        setImageUrls(updatedData.images || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePdfUpload = async (url) => {
    if (!isAdmin) return;
    setRegistrationPdf((prev) => {
      const updated = [...prev, url];
      localStorage.setItem('trailRides_registrationPdf', JSON.stringify(updated));
      return updated;
    });
    // Fetch updated PDFs to ensure sync
    const pdfResponse = await fetch('/api/pdfs?page=trail-rides');
    if (pdfResponse.ok) {
      const pdfData = await pdfResponse.json();
      setRegistrationPdf(pdfData.pdfs || []);
    }
  };

  const handlePdfRemove = async (urlToRemove) => {
    if (!isAdmin) return;
    try {
      const response = await fetchWithToken('/api/pdfs', {
        method: 'DELETE',
        headers: { 'Page': 'trail-rides', 'Url': urlToRemove },
      });
      if (!response.ok) throw new Error('PDF delete failed');
      const updatedResponse = await fetch('/api/pdfs?page=trail-rides');
      if (updatedResponse.ok) {
        const updatedData = await updatedResponse.json();
        setRegistrationPdf(updatedData.pdfs || []);
        localStorage.setItem('trailRides_registrationPdf', JSON.stringify(updatedData.pdfs || []));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const [selectedImage, setSelectedImage] = useState(null);
  const openModal = (url) => setSelectedImage(url);
  const closeModal = () => setSelectedImage(null);

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
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="border p-2 rounded mb-4"
              />
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
                  {isAdmin && <button onClick={() => handlePdfRemove(url)} className="text-red-500 ml-2">Remove</button>}
                </div>
              ))}
              {isAdmin && <PdfUpload onUpload={handlePdfUpload} page="trail-rides" />}
            </div>
          </div>
        </div>
      </div>
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={closeModal}>
          <div className="relative">
            <img src={selectedImage} alt="Enlarged" className="max-h-[90vh] max-w-[90vw]" />
            <button onClick={closeModal} className="absolute top-2 right-2 text-white bg-red-600 p-2 rounded">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default TrailRides;
import React, { useState, useEffect } from 'react';
import EditableSection from '../components/EditableSection';
import PdfUpload from '../components/PdfUpload';
import PdfDownload from '../components/PdfDownload';
import { useAuth, fetchWithToken } from '../context/AuthContext';
import Header from '../components/Header';
import InstructorAvailability from '../components/InstructorAvailability';

function HorseLessons() {
  const { isAdmin, token } = useAuth();
  const [imageUrls, setImageUrls] = useState([]);
  const [pdfs, setPdfs] = useState([]);
  const [error, setError] = useState(null);
  const [deletingImage, setDeletingImage] = useState(null);

  const fetchData = async () => {
    try {
      const cacheBuster = new Date().getTime();
      const imageResponse = await fetch(`/api/assets/images?page=horse-lessons&t=${cacheBuster}`);
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch images: ${imageResponse.status} ${await imageResponse.text()}`);
      }
      const imageData = await imageResponse.json();
      setImageUrls(imageData.images || []);

      const pdfResponse = await fetch(`/api/assets/pdfs?page=horse-lessons&t=${cacheBuster}`);
      if (!pdfResponse.ok) {
        throw new Error(`Failed to fetch PDFs: ${pdfResponse.status} ${await pdfResponse.text()}`);
      }
      const pdfData = await pdfResponse.json();
      setPdfs(pdfData.pdfs || []);
      setError(null);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleImageUpload = async (event) => {
    if (!isAdmin) return;
    const files = event.target.files;
    if (!files.length) return;
    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append('images', file)); // Updated to 'images'
    try {
      const uploadResponse = await fetchWithToken('/api/assets/images', {
        method: 'POST',
        body: formData,
        headers: { 'Page': 'horse-lessons' },
      });
      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        throw new Error(`Image upload failed: ${errorText}`);
      }
      fetchData(); // Refresh data
    } catch (err) {
      console.error('Image upload error:', err);
      setError(err.message);
    }
  };

  const handleImageDelete = async (urlToRemove) => {
    if (!isAdmin) return;
    setDeletingImage(urlToRemove);
    try {
      const deleteResponse = await fetchWithToken('/api/assets/images', {
        method: 'DELETE',
        headers: { 'Page': 'horse-lessons', 'Url': urlToRemove },
      });
      if (!deleteResponse.ok && deleteResponse.status !== 404) {
        const errorText = await deleteResponse.text();
        throw new Error(`Image delete failed: ${errorText}`);
      }
      console.warn(`Image not found on server, proceeding to refresh list: ${urlToRemove}`);
      fetchData(); // Refresh data
    } catch (err) {
      console.error('Image delete error:', err);
      setError(`Image delete failed: ${err.message}`);
    } finally {
      setDeletingImage(null);
    }
  };

  const handlePdfUpload = () => {
    if (!isAdmin) return;
    fetchData(); // Refresh data
  };

  const handlePdfRemove = async (urlToRemove) => {
    if (!isAdmin) return;
    try {
      const deleteResponse = await fetchWithToken('/api/assets/pdfs', {
        method: 'DELETE',
        headers: { 'Page': 'horse-lessons', 'Url': urlToRemove },
      });
      if (!deleteResponse.ok && deleteResponse.status !== 404) {
        const errorText = await deleteResponse.text();
        throw new Error(`PDF delete failed: ${errorText}`);
      }
      fetchData(); // Refresh data
    } catch (err) {
      console.error('PDF remove error:', err);
      setError(err.message);
    }
  };

  const getFilenameFromUrl = (url) => {
    const parts = url.substring(url.lastIndexOf('/') + 1).split('-');
    return parts.slice(1).join('-');
  };

  const [selectedImage, setSelectedImage] = useState(null);
  const openModal = (url) => setSelectedImage(url);
  const closeModal = () => setSelectedImage(null);

  const handleImageError = (url) => {
    console.error(`Failed to load image: ${url}`);
    setImageUrls((prev) => prev.filter((u) => u !== url));
  };

  // Filter PDFs based on section
  const ridingLevelsPdfs = pdfs.filter(pdf => (pdf.section || '').toLowerCase() === 'ridinglevels');
  const registrationPdfs = pdfs.filter(pdf => (pdf.section || '').toLowerCase() === 'registration' || (pdf.section || '').toLowerCase() === 'default');

  return (
    <div className="bg-gray-100 min-h-screen font-sans">
      <Header />
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <h2 className="text-4xl font-bold text-center text-teal-700 mb-8">Horse Lessons</h2>
        {error && <div className="text-red-600 text-center mb-6 bg-red-100 p-4 rounded-lg">{error}</div>}
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Overview Section */}
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
              <h3 className="text-2xl font-semibold text-teal-600 mb-4">Overview</h3>
              <EditableSection page="horse-lessons" initialContent="Offering beginner to advanced riding lessons with experienced instructors." field="overview" />
            </div>

            {/* Riding Levels Section */}
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
              <h3 className="text-2xl font-semibold text-teal-600 mb-4">Riding Levels</h3>
              <EditableSection page="horse-lessons" initialContent="Download PDFs for details:" field="levels" />
              <div className="mt-4 space-y-2">
                {ridingLevelsPdfs.length > 0 ? (
                  ridingLevelsPdfs.map((pdf, index) => (
                    <div key={pdf.url} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                      <PdfDownload url={pdf.url} label={pdf.originalName || getFilenameFromUrl(pdf.url)} />
                      {isAdmin && (
                        <button
                          onClick={() => handlePdfRemove(pdf.url)}
                          className="text-red-500 hover:text-red-700 ml-4 transition-colors duration-200"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-600">No Riding Levels PDFs available.</p>
                )}
                {isAdmin && <PdfUpload onUpload={handlePdfUpload} page="horse-lessons" section="ridingLevels" />}
              </div>
            </div>

            {/* Payment Info Section */}
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
              <h3 className="text-2xl font-semibold text-teal-600 mb-4">Payment Info</h3>
              <EditableSection page="horse-lessons" initialContent="Payment via cash, check, or Venmo @MickelsenFarms." field="payment" />
            </div>

            {/* Instructor Availability Section */}
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
              <h3 className="text-2xl font-semibold text-teal-600 mb-4">Instructor Availability</h3>
              <InstructorAvailability page="horse-lessons" />
            </div>

            {/* Registration Section */}
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
              <h3 className="text-2xl font-semibold text-teal-600 mb-4">Registration</h3>
              <EditableSection page="horse-lessons" initialContent="Download our registration form:" field="registration" />
              <div className="mt-4 space-y-2">
                {registrationPdfs.length > 0 ? (
                  registrationPdfs.map((pdf, index) => (
                    <div key={pdf.url} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                      <PdfDownload url={pdf.url} label={pdf.originalName || getFilenameFromUrl(pdf.url)} />
                      {isAdmin && (
                        <button
                          onClick={() => handlePdfRemove(pdf.url)}
                          className="text-red-500 hover:text-red-700 ml-4 transition-colors duration-200"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-600">No Registration PDFs available.</p>
                )}
                {isAdmin && <PdfUpload onUpload={handlePdfUpload} page="horse-lessons" section="registration" />}
              </div>
              {isAdmin && (
                <div className="mt-6">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="border border-gray-300 p-2 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              )}
              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-6">
                {imageUrls.length > 0 ? (
                  imageUrls.map((url, index) => (
                    <div key={url} className="relative group">
                      <img
                        src={url}
                        alt={`Horse Lessons ${index + 1}`}
                        className="w-full h-48 object-cover rounded-lg cursor-pointer transition-opacity duration-300 group-hover:opacity-90"
                        onClick={() => openModal(url)}
                        onError={() => handleImageError(url)}
                      />
                      {isAdmin && (
                        <button
                          onClick={() => handleImageDelete(url)}
                          className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                          disabled={deletingImage === url}
                        >
                          {deletingImage === url ? 'Deleting...' : 'X'}
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-600">No images available.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={closeModal}>
          <div className="relative">
            <img src={selectedImage} alt="Enlarged" className="max-h-[90vh] max-w-[90vw] rounded-lg" />
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-white bg-red-600 p-2 rounded-lg hover:bg-red-700 transition-colors duration-200"
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
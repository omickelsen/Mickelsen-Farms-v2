import React, { useState, useEffect } from 'react';
import EditableSection from '../components/EditableSection';
import PdfUpload from '../components/PdfUpload';
import PdfDownload from '../components/PdfDownload';
import { useAuth, fetchWithToken } from '../context/AuthContext';

const getFilenameFromUrl = (url) => {
  const parts = url.substring(url.lastIndexOf('/') + 1).split('-');
  return parts.slice(1).join('-');
};

function HorseBoarding() {
  const { isAdmin, token } = useAuth() || {};
  const [imageUrls, setImageUrls] = useState([]);
  const [documentsPdf, setDocumentsPdf] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const imageResponse = await fetch('/api/images?page=horse-boarding');
        const imageData = await imageResponse.json();
        setImageUrls(imageData.images || []);

        const pdfResponse = await fetch('/api/pdfs?page=horse-boarding');
        if (!pdfResponse.ok) throw new Error('Failed to fetch PDFs');
        const pdfData = await pdfResponse.json();
        setDocumentsPdf(pdfData.pdfs || []);
        localStorage.setItem('horseBoarding_documentsPdf', JSON.stringify(pdfData.pdfs || []));
      } catch (err) {
        console.error('Fetch error:', err);
        const savedPdfs = localStorage.getItem('horseBoarding_documentsPdf');
        if (savedPdfs) setDocumentsPdf(JSON.parse(savedPdfs));
      }
    };
    fetchData();
  }, []);

  const handleImageUpload = async (event) => {
    if (!isAdmin || !token) return;
    const files = event.target.files;
    if (!files.length) return;
    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append('image', file));
    try {
      const uploadResponse = await fetchWithToken('/api/images', {
        method: 'POST',
        body: formData,
        headers: { 'Page': 'horse-boarding' },
      });
      if (!uploadResponse.ok) throw new Error('Image upload failed');
      const updatedResponse = await fetch('/api/images?page=horse-boarding');
      if (updatedResponse.ok) {
        const updatedData = await updatedResponse.json();
        setImageUrls(updatedData.images || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleImageDelete = async (urlToRemove) => {
    if (!isAdmin || !token) return;
    try {
      const deleteResponse = await fetchWithToken('/api/images', {
        method: 'DELETE',
        headers: { 'Page': 'horse-boarding', 'Url': urlToRemove },
      });
      if (!deleteResponse.ok) throw new Error('Image delete failed');
      const updatedResponse = await fetch('/api/images?page=horse-boarding');
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
    setDocumentsPdf((prev) => {
      const updated = [...prev, url];
      localStorage.setItem('horseBoarding_documentsPdf', JSON.stringify(updated));
      return updated;
    });
    const updatedResponse = await fetch('/api/pdfs?page=horse-boarding');
    if (updatedResponse.ok) {
      const updatedData = await updatedResponse.json();
      setDocumentsPdf(updatedData.pdfs || []);
      localStorage.setItem('horseBoarding_documentsPdf', JSON.stringify(updatedData.pdfs || []));
    }
  };

  const handlePdfRemove = async (urlToRemove) => {
    if (!isAdmin) return;
    try {
      const response = await fetchWithToken('/api/pdfs', {
        method: 'DELETE',
        headers: { 'Page': 'horse-boarding', 'Url': urlToRemove },
      });
      if (!response.ok) throw new Error('PDF delete failed');
      const updatedResponse = await fetch('/api/pdfs?page=horse-boarding');
      if (updatedResponse.ok) {
        const updatedData = await updatedResponse.json();
        setDocumentsPdf(updatedData.pdfs || []);
        localStorage.setItem('horseBoarding_documentsPdf', JSON.stringify(updatedData.pdfs || []));
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
      <h2 className="text-4xl font-bold text-center text-teal-700 mb-12">Horse Boarding</h2>
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-2xl font-semibold text-teal-600 mb-4">Overview</h3>
            <EditableSection page="horse-boarding" initialContent="Top-notch horse boarding with spacious stalls, daily care, and training facilities." field="overview" />
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-2xl font-semibold text-teal-600 mb-4">Pricing</h3>
            <EditableSection page="horse-boarding" initialContent="Currently: $400 per month. $50 initial deposit. Extra Fees for special requests (SawDust). Boarding fees are subject to change based off of feed cost." field="pricing" />
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-2xl font-semibold text-teal-600 mb-4">Extras</h3>
            <EditableSection page="horse-boarding" initialContent="Extras include grooming ($50/week), training sessions ($75/hour), and custom feed plans." field="extras" />
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-2xl font-semibold text-teal-600 mb-4">Gallery & Documents</h3>
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
                    alt={`Horse Boarding ${index + 1}`}
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
            {isAdmin && <PdfUpload onUpload={handlePdfUpload} page="horse-boarding" />}
            {documentsPdf.length > 0 && (
              <div className="mt-4">
                <EditableSection page="horse-boarding" initialContent="Download our boarding documents:" field="pdf" />
                {documentsPdf.map((url, index) => (
                  <div key={index} className="flex items-center justify-between mt-2">
                    <PdfDownload url={url} label={getFilenameFromUrl(url)} />
                    {isAdmin && <button onClick={() => handlePdfRemove(url)} className="text-red-500 ml-2">Remove</button>}
                  </div>
                ))}
              </div>
            )}
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

export default HorseBoarding;
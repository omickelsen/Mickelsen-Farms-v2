import React, { useState, useEffect } from 'react';
import EditableSection from '../components/EditableSection';
import PdfUpload from '../components/PdfUpload';
import PdfDownload from '../components/PdfDownload';
import { useAuth, fetchWithToken } from '../context/AuthContext';

const getFilenameFromUrl = (url) => {
  const parts = url.substring(url.lastIndexOf('/') + 1).split('-');
  return parts.slice(1).join('-');
};

// Map filenames to sections (adjust based on your naming convention)
const categorizePdf = (url) => {
  const filename = getFilenameFromUrl(url).toLowerCase();
  if (filename.includes('riding') || filename.includes('level')) return 'ridingLevels';
  if (filename.includes('registration') || filename.includes('reg')) return 'registration';
  return 'registration'; // Default to registration if unclear
};

function HorseLessons() {
  const { isAdmin, token } = useAuth();
  const [imageUrls, setImageUrls] = useState([]);
  const [ridingLevelsPdf, setRidingLevelsPdf] = useState([]);
  const [registrationPdf, setRegistrationPdf] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const cacheBuster = new Date().getTime();
        const imageResponse = await fetch(`/api/images?page=horse-lessons&t=${cacheBuster}`);
        if (!imageResponse.ok) throw new Error('Failed to fetch images');
        const imageData = await imageResponse.json();
        setImageUrls(imageData.images || []);

        const pdfResponse = await fetch(`/api/pdfs?page=horse-lessons&t=${cacheBuster}`);
        if (!pdfResponse.ok) throw new Error('Failed to fetch PDFs');
        const pdfData = await pdfResponse.json();
        const validPdfs = pdfData.pdfs.filter(url => url.endsWith('.pdf'));
        const categorizedPdfs = validPdfs.reduce((acc, url) => {
          const category = categorizePdf(url);
          if (category === 'ridingLevels') acc.ridingLevels.push(url);
          else acc.registration.push(url);
          return acc;
        }, { ridingLevels: [], registration: [] });
        setRidingLevelsPdf(categorizedPdfs.ridingLevels);
        setRegistrationPdf(categorizedPdfs.registration);
        localStorage.setItem('ridingLevelsPdf', JSON.stringify(categorizedPdfs.ridingLevels));
        localStorage.setItem('registrationPdf', JSON.stringify(categorizedPdfs.registration));
      } catch (err) {
        console.error('Fetch error:', err);
        const savedRidingLevels = localStorage.getItem('ridingLevelsPdf');
        const savedRegistration = localStorage.getItem('registrationPdf');
        if (savedRidingLevels) setRidingLevelsPdf(JSON.parse(savedRidingLevels));
        if (savedRegistration) setRegistrationPdf(JSON.parse(savedRegistration));
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
      if (!uploadResponse.ok) throw new Error('Image upload failed');
      const updatedResponse = await fetch('/api/images?page=horse-lessons');
      if (updatedResponse.ok) {
        const updatedData = await updatedResponse.json();
        setImageUrls(updatedData.images || []);
        localStorage.setItem('imageUrls', JSON.stringify(updatedData.images));
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
        headers: { 'Page': 'horse-lessons', 'Url': urlToRemove },
      });
      if (!deleteResponse.ok) throw new Error('Image delete failed');
      const updatedResponse = await fetch('/api/images?page=horse-lessons');
      if (updatedResponse.ok) {
        const updatedData = await updatedResponse.json();
        setImageUrls(updatedData.images || []);
        localStorage.setItem('imageUrls', JSON.stringify(updatedData.images));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePdfUpload = async (url, section) => {
    if (!isAdmin) return;
    const updatedResponse = await fetch('/api/pdfs?page=horse-lessons');
    if (updatedResponse.ok) {
      const updatedData = await updatedResponse.json();
      const validPdfs = updatedData.pdfs.filter(url => url.endsWith('.pdf'));
      const categorizedPdfs = validPdfs.reduce((acc, url) => {
        const category = categorizePdf(url);
        if (category === 'ridingLevels') acc.ridingLevels.push(url);
        else acc.registration.push(url);
        return acc;
      }, { ridingLevels: [], registration: [] });
      setRidingLevelsPdf(categorizedPdfs.ridingLevels);
      setRegistrationPdf(categorizedPdfs.registration);
      localStorage.setItem('ridingLevelsPdf', JSON.stringify(categorizedPdfs.ridingLevels));
      localStorage.setItem('registrationPdf', JSON.stringify(categorizedPdfs.registration));
    }
  };

  const handlePdfRemove = async (urlToRemove, section) => {
    if (!isAdmin) return;
    try {
      const response = await fetchWithToken('/api/pdfs', {
        method: 'DELETE',
        headers: { 'Page': 'horse-lessons', 'Url': urlToRemove },
      });
      if (!response.ok) {
        console.warn(`DELETE failed for ${urlToRemove} with status ${response.status}`);
      }
      const updatedResponse = await fetch('/api/pdfs?page=horse-lessons');
      if (updatedResponse.ok) {
        const updatedData = await updatedResponse.json();
        const validPdfs = updatedData.pdfs.filter(url => url.endsWith('.pdf'));
        const categorizedPdfs = validPdfs.reduce((acc, url) => {
          const category = categorizePdf(url);
          if (category === 'ridingLevels') acc.ridingLevels.push(url);
          else acc.registration.push(url);
          return acc;
        }, { ridingLevels: [], registration: [] });
        setRidingLevelsPdf(categorizedPdfs.ridingLevels);
        setRegistrationPdf(categorizedPdfs.registration);
        localStorage.setItem('ridingLevelsPdf', JSON.stringify(categorizedPdfs.ridingLevels));
        localStorage.setItem('registrationPdf', JSON.stringify(categorizedPdfs.registration));
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
            <button onClick={closeModal} className="absolute top-2 right-2 text-white bg-red-600 p-2 rounded">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default HorseLessons;
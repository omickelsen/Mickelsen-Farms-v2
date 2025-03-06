import React, { useState, useEffect } from 'react';
import EditableSection from '../components/EditableSection';
import PdfUpload from '../components/PdfUpload';
import PdfDownload from '../components/PdfDownload';
import { useAuth, fetchWithToken } from '../context/AuthContext';
import Header from '../components/Header';

const getFilenameFromUrl = (url) => {
  const parts = url.substring(url.lastIndexOf('/') + 1).split('-');
  return parts.slice(1).join('-');
};

// Map filenames to sections (adjust based on your naming convention)
const categorizePdf = (pdf) => {
  const filename = getFilenameFromUrl(pdf.url).toLowerCase(); // Use pdf.url since it's an object
  if (filename.includes('riding') || filename.includes('level')) return 'ridingLevels';
  if (filename.includes('registration') || filename.includes('reg')) return 'registration';
  return 'registration'; // Default to registration if unclear
};

function HorseLessons() {
  const { isAdmin, token } = useAuth();
  const [imageUrls, setImageUrls] = useState([]);
  const [ridingLevelsPdf, setRidingLevelsPdf] = useState([]);
  const [registrationPdf, setRegistrationPdf] = useState([]);
  const [error, setError] = useState(null);
  const [deletingImage, setDeletingImage] = useState(null);

  // Define baseUrl at the component level (needed for PDFs, not images)
  const baseUrl = process.env.NODE_ENV === 'production'
    ? 'https://mickelsen-family-farms.herokuapp.com'
    : 'http://localhost:5000';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const cacheBuster = new Date().getTime();
        // Fetch images with baseUrl (but use S3 URLs directly)
        const imageResponse = await fetch(`/api/assets/images?page=horse-lessons&t=${cacheBuster}`);
        if (!imageResponse.ok) {
          throw new Error(`Failed to fetch images: ${imageResponse.status} ${await imageResponse.text()}`);
        }
        const imageData = await imageResponse.json();
        setImageUrls(imageData.images || []); // Use S3 URLs directly

        // Fetch PDFs with baseUrl
        const pdfResponse = await fetch(`${baseUrl}/api/assets/pdfs?page=horse-lessons&t=${cacheBuster}`);
        if (!pdfResponse.ok) {
          throw new Error(`Failed to fetch PDFs: ${pdfResponse.status} ${await pdfResponse.text()}`);
        }
        const pdfData = await pdfResponse.json();
        
        // Handle pdfs as an array of objects
        const validPdfs = Array.isArray(pdfData.pdfs) ? pdfData.pdfs.filter(pdf => pdf.url && pdf.url.endsWith('.pdf')) : [];
        const categorizedPdfs = validPdfs.reduce((acc, pdf) => {
          const category = categorizePdf(pdf);
          if (category === 'ridingLevels') acc.ridingLevels.push(pdf.url);
          else acc.registration.push(pdf.url);
          return acc;
        }, { ridingLevels: [], registration: [] });
        setRidingLevelsPdf(categorizedPdfs.ridingLevels);
        setRegistrationPdf(categorizedPdfs.registration);
        localStorage.setItem('ridingLevelsPdf', JSON.stringify(categorizedPdfs.ridingLevels));
        localStorage.setItem('registrationPdf', JSON.stringify(categorizedPdfs.registration));
        setError(null);
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err.message);
        const savedRidingLevels = localStorage.getItem('ridingLevelsPdf');
        const savedRegistration = localStorage.getItem('registrationPdf');
        if (savedRidingLevels) setRidingLevelsPdf(JSON.parse(savedRidingLevels) || []);
        if (savedRegistration) setRegistrationPdf(JSON.parse(savedRegistration) || []);
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
      const uploadResponse = await fetchWithToken('/api/assets/images', {
        method: 'POST',
        body: formData,
        headers: { 'Page': 'horse-lessons' },
      });
      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        throw new Error(`Image upload failed: ${errorText}`);
      }
      const updatedResponse = await fetch('/api/assets/images?page=horse-lessons');
      if (updatedResponse.ok) {
        const updatedData = await updatedResponse.json();
        console.log('Updated images after upload:', updatedData);
        setImageUrls(updatedData.images || []); // Use S3 URLs directly
        localStorage.setItem('horseLessons_imageUrls', JSON.stringify(updatedData.images));
      }
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
        headers: { 'Page': 'horse-lessons', 'Url': urlToRemove }, // Send full S3 URL
      });
      if (!deleteResponse.ok && deleteResponse.status !== 404) {
        const errorText = await deleteResponse.text();
        throw new Error(`Image delete failed: ${errorText}`);
      }
      console.warn(`Image not found on server, proceeding to refresh list: ${urlToRemove}`);
      const updatedResponse = await fetch('/api/assets/images?page=horse-lessons');
      if (!updatedResponse.ok) {
        const errorText = await updatedResponse.text();
        throw new Error(`Failed to fetch updated images after delete: ${errorText}`);
      }
      const updatedData = await updatedResponse.json();
      console.log('Updated images after delete:', updatedData);
      setImageUrls(updatedData.images || []);
      localStorage.setItem('horseLessons_imageUrls', JSON.stringify(updatedData.images));
      setError(null);
    } catch (err) {
      console.error('Image delete error:', err);
      setError(`Image delete failed: ${err.message}`);
    } finally {
      setDeletingImage(null);
    }
  };

  const handlePdfUpload = async (url, section) => {
    if (!isAdmin) return;
    try {
      const updatedResponse = await fetch(`${baseUrl}/api/assets/pdfs?page=horse-lessons`);
      if (!updatedResponse.ok) {
        const errorText = await updatedResponse.text();
        throw new Error(`Failed to fetch updated PDFs: ${errorText}`);
      }
      const updatedData = await updatedResponse.json();
      console.log('Updated PDFs after upload:', updatedData);
      const validPdfs = Array.isArray(updatedData.pdfs) ? updatedData.pdfs.filter(pdf => pdf.url && pdf.url.endsWith('.pdf')) : [];
      const categorizedPdfs = validPdfs.reduce((acc, pdf) => {
        const category = categorizePdf(pdf);
        if (category === 'ridingLevels') acc.ridingLevels.push(pdf.url);
        else acc.registration.push(pdf.url);
        return acc;
      }, { ridingLevels: [], registration: [] });
      setRidingLevelsPdf(categorizedPdfs.ridingLevels);
      setRegistrationPdf(categorizedPdfs.registration);
      localStorage.setItem('ridingLevelsPdf', JSON.stringify(categorizedPdfs.ridingLevels));
      localStorage.setItem('registrationPdf', JSON.stringify(categorizedPdfs.registration));
      setError(null);
    } catch (err) {
      console.error('PDF upload fetch error:', err);
      setError(err.message);
    }
  };

  const handlePdfRemove = async (urlToRemove, section) => {
    if (!isAdmin) return;
    try {
      const deleteResponse = await fetchWithToken(`${baseUrl}/api/assets/pdfs`, {
        method: 'DELETE',
        headers: { 'Page': 'horse-lessons', 'Url': urlToRemove },
      });
      if (!deleteResponse.ok) {
        const errorText = await deleteResponse.text();
        console.warn(`DELETE failed for ${urlToRemove} with status ${deleteResponse.status}: ${errorText}`);
        if (deleteResponse.status !== 404) {
          throw new Error(`PDF delete failed: ${errorText}`);
        }
      }
      const updatedResponse = await fetch(`${baseUrl}/api/assets/pdfs?page=horse-lessons`);
      if (!updatedResponse.ok) {
        const errorText = await updatedResponse.text();
        throw new Error(`Failed to fetch updated PDFs: ${errorText}`);
      }
      const updatedData = await updatedResponse.json();
      console.log('Updated PDFs after delete:', updatedData);
      const validPdfs = Array.isArray(updatedData.pdfs) ? updatedData.pdfs.filter(pdf => pdf.url && pdf.url.endsWith('.pdf')) : [];
      const categorizedPdfs = validPdfs.reduce((acc, pdf) => {
        const category = categorizePdf(pdf);
        if (category === 'ridingLevels') acc.ridingLevels.push(pdf.url);
        else acc.registration.push(pdf.url);
        return acc;
      }, { ridingLevels: [], registration: [] });
      setRidingLevelsPdf(categorizedPdfs.ridingLevels);
      setRegistrationPdf(categorizedPdfs.registration);
      localStorage.setItem('ridingLevelsPdf', JSON.stringify(categorizedPdfs.ridingLevels));
      localStorage.setItem('registrationPdf', JSON.stringify(categorizedPdfs.registration));
      setError(null);
    } catch (err) {
      console.error('PDF remove error:', err);
      setError(err.message);
    }
  };

  const [selectedImage, setSelectedImage] = useState(null);
  const openModal = (url) => setSelectedImage(url);
  const closeModal = () => setSelectedImage(null);

  const handleImageError = (url) => {
    console.error(`Failed to load image: ${url}`);
    setImageUrls((prev) => prev.filter((u) => u !== url));
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <Header />
      <div className="py-8">
        <h2 className="text-4xl font-bold text-center text-teal-700 mb-12">Horse Lessons</h2>
        {error && <div className="text-red-500 text-center mb-4">{error}</div>}
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
                {ridingLevelsPdf.length > 0 ? (
                  ridingLevelsPdf.map((url, index) => (
                    <div key={index} className="flex items-center">
                      <PdfDownload url={`${baseUrl}${url}`} label={getFilenameFromUrl(url)} />
                      {isAdmin && <button onClick={() => handlePdfRemove(url, 'ridingLevels')} className="text-red-500 ml-2">Remove</button>}
                    </div>
                  ))
                ) : (
                  <p>No Riding Levels PDFs available.</p>
                )}
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
                {registrationPdf.length > 0 ? (
                  registrationPdf.map((url, index) => (
                    <div key={index} className="flex items-center">
                      <PdfDownload url={`${baseUrl}${url}`} label={getFilenameFromUrl(url)} />
                      {isAdmin && <button onClick={() => handlePdfRemove(url, 'registration')} className="text-red-500 ml-2">Remove</button>}
                    </div>
                  ))
                ) : (
                  <p>No Registration PDFs available.</p>
                )}
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
                {imageUrls.length > 0 ? (
                  imageUrls.map((url, index) => (
                    <div key={index} className="relative">
                      <img
                        src={url} // Use S3 URL directly
                        alt={`Horse Lessons ${index + 1}`}
                        className="w-full h-48 object-cover rounded-lg cursor-pointer"
                        onClick={() => openModal(url)}
                        onError={() => handleImageError(url)}
                      />
                      {isAdmin && (
                        <button
                          onClick={() => handleImageDelete(url)}
                          className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded"
                          disabled={deletingImage === url}
                        >
                          {deletingImage === url ? 'Deleting...' : 'X'}
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <p>No images available.</p>
                )}
              </div>
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
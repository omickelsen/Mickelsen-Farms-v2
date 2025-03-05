import React, { useState, useEffect } from 'react';
import EditableSection from '../components/EditableSection';
import PdfUpload from '../components/PdfUpload';
import PdfDownload from '../components/PdfDownload';
import { useAuth, fetchWithToken } from '../context/AuthContext';

const getFilenameFromUrl = (url) => {
  const parts = url.substring(url.lastIndexOf('/') + 1).split('-');
  return parts.slice(1).join('-');
};

// Map filenames to sections (secondary check)
const categorizePdf = (url) => {
  const filename = getFilenameFromUrl(url).toLowerCase();
  if (filename.includes('day-camp') || filename.includes('camp')) return 'dayCamp';
  if (filename.includes('party')) return 'party';
  if (filename.includes('waiver') || filename.includes('liability')) return 'waiver';
  return null; // No default, rely on section parameter
};

function Events() {
  const { isAdmin, token } = useAuth();
  const [imageUrls, setImageUrls] = useState([]);
  const [dayCampPdf, setDayCampPdf] = useState([]);
  const [partyPdf, setPartyPdf] = useState([]);
  const [waiverPdf, setWaiverPdf] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const imageResponse = await fetch('/api/images?page=events');
        const imageData = await imageResponse.json();
        setImageUrls(imageData.images || []);

        const pdfResponse = await fetch('/api/pdfs?page=events');
        if (!pdfResponse.ok) throw new Error('Failed to fetch PDFs');
        const pdfData = await pdfResponse.json();
        const validPdfs = pdfData.pdfs.filter(url => url.endsWith('.pdf'));
        const categorizedPdfs = validPdfs.reduce((acc, url) => {
          // Initial categorization based on fetch (no section context)
          const filenameCategory = categorizePdf(url);
          if (filenameCategory) {
            if (filenameCategory === 'dayCamp') acc.dayCamp.push(url);
            else if (filenameCategory === 'party') acc.party.push(url);
            else if (filenameCategory === 'waiver') acc.waiver.push(url);
          } else {
            // Fallback to a neutral state (will be corrected by upload section)
            acc.uncategorized.push(url);
          }
          return acc;
        }, { dayCamp: [], party: [], waiver: [], uncategorized: [] });

        // Initial state based on filename categorization
        setDayCampPdf(categorizedPdfs.dayCamp);
        setPartyPdf(categorizedPdfs.party);
        setWaiverPdf(categorizedPdfs.waiver);
        localStorage.setItem('events_dayCampPdf', JSON.stringify(categorizedPdfs.dayCamp));
        localStorage.setItem('events_partyPdf', JSON.stringify(categorizedPdfs.party));
        localStorage.setItem('events_waiverPdf', JSON.stringify(categorizedPdfs.waiver));
      } catch (err) {
        console.error('Fetch error:', err);
        const savedDayCamp = localStorage.getItem('events_dayCampPdf');
        const savedParty = localStorage.getItem('events_partyPdf');
        const savedWaiver = localStorage.getItem('events_waiverPdf');
        if (savedDayCamp) setDayCampPdf(JSON.parse(savedDayCamp));
        if (savedParty) setPartyPdf(JSON.parse(savedParty));
        if (savedWaiver) setWaiverPdf(JSON.parse(savedWaiver));
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
        headers: { 'Page': 'events' },
      });
      if (!uploadResponse.ok) throw new Error('Image upload failed');
      const updatedResponse = await fetch('/api/images?page=events');
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
        headers: { 'Page': 'events', 'Url': urlToRemove },
      });
      if (!deleteResponse.ok) throw new Error('Image delete failed');
      const updatedResponse = await fetch('/api/images?page=events');
      if (updatedResponse.ok) {
        const updatedData = await updatedResponse.json();
        setImageUrls(updatedData.images || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePdfUpload = async (url, section) => {
    if (!isAdmin) return;
    const updatedResponse = await fetch('/api/pdfs?page=events');
    if (updatedResponse.ok) {
      const updatedData = await updatedResponse.json();
      const validPdfs = updatedData.pdfs.filter(url => url.endsWith('.pdf'));
      const categorizedPdfs = validPdfs.reduce((acc, url) => {
        // Primary categorization based on upload section
        let category = section; // Use the section from the upload
        const filenameCategory = categorizePdf(url);
        if (filenameCategory && !['dayCamp', 'party', 'waiver'].includes(category)) {
          category = filenameCategory; // Override with filename if section is invalid
        }
        if (category === 'dayCamp') acc.dayCamp.push(url);
        else if (category === 'party') acc.party.push(url);
        else if (category === 'waiver') acc.waiver.push(url);
        return acc;
      }, { dayCamp: [], party: [], waiver: [] });
      setDayCampPdf(categorizedPdfs.dayCamp);
      setPartyPdf(categorizedPdfs.party);
      setWaiverPdf(categorizedPdfs.waiver);
      localStorage.setItem('events_dayCampPdf', JSON.stringify(categorizedPdfs.dayCamp));
      localStorage.setItem('events_partyPdf', JSON.stringify(categorizedPdfs.party));
      localStorage.setItem('events_waiverPdf', JSON.stringify(categorizedPdfs.waiver));
    }
  };

  const handlePdfRemove = async (urlToRemove, section) => {
    if (!isAdmin) return;
    try {
      const response = await fetchWithToken('/api/pdfs', {
        method: 'DELETE',
        headers: { 'Page': 'events', 'Url': urlToRemove },
      });
      if (!response.ok) {
        console.warn(`DELETE failed for ${urlToRemove} with status ${response.status}`);
      }
      const updatedResponse = await fetch('/api/pdfs?page=events');
      if (updatedResponse.ok) {
        const updatedData = await updatedResponse.json();
        const validPdfs = updatedData.pdfs.filter(url => url.endsWith('.pdf'));
        const categorizedPdfs = validPdfs.reduce((acc, url) => {
          // Recategorize based on original upload section (not re-evaluated here)
          let category = section; // Use the section from the remove action
          const filenameCategory = categorizePdf(url);
          if (filenameCategory && !['dayCamp', 'party', 'waiver'].includes(category)) {
            category = filenameCategory; // Fallback to filename if section is invalid
          }
          if (category === 'dayCamp') acc.dayCamp.push(url);
          else if (category === 'party') acc.party.push(url);
          else if (category === 'waiver') acc.waiver.push(url);
          return acc;
        }, { dayCamp: [], party: [], waiver: [] });
        setDayCampPdf(categorizedPdfs.dayCamp);
        setPartyPdf(categorizedPdfs.party);
        setWaiverPdf(categorizedPdfs.waiver);
        localStorage.setItem('events_dayCampPdf', JSON.stringify(categorizedPdfs.dayCamp));
        localStorage.setItem('events_partyPdf', JSON.stringify(categorizedPdfs.party));
        localStorage.setItem('events_waiverPdf', JSON.stringify(categorizedPdfs.waiver));
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

export default Events;
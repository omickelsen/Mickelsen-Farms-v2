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

const categorizePdf = (pdf) => {
  const filename = getFilenameFromUrl(pdf.url).toLowerCase();
  if (filename.includes('day-camp') || filename.includes('camp')) return 'dayCamp';
  if (filename.includes('party')) return 'party';
  if (filename.includes('waiver') || filename.includes('liability')) return 'waiver';
  return 'dayCamp';
};

function Events() {
  const { isAdmin, token } = useAuth();
  const [imageUrls, setImageUrls] = useState([]);
  const [dayCampPdf, setDayCampPdf] = useState([]);
  const [partyPdf, setPartyPdf] = useState([]);
  const [waiverPdf, setWaiverPdf] = useState([]);
  const [error, setError] = useState(null);
  const [deletingImage, setDeletingImage] = useState(null);

  const baseUrl = process.env.NODE_ENV === 'production'
    ? 'https://mickelsen-family-farms.herokuapp.com'
    : 'http://localhost:5000';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const cacheBuster = new Date().getTime();
        const imageResponse = await fetch(`${baseUrl}/api/assets/images?page=events&t=${cacheBuster}`);
        if (!imageResponse.ok) {
          throw new Error(`Failed to fetch images: ${imageResponse.status} ${await imageResponse.text()}`);
        }
        const imageData = await imageResponse.json();
        setImageUrls(imageData.images); // Use S3 URLs directly
        localStorage.setItem('events_imageUrls', JSON.stringify(imageData.images));

        const pdfResponse = await fetch(`${baseUrl}/api/assets/pdfs?page=events&t=${cacheBuster}`);
        if (!pdfResponse.ok) {
          throw new Error(`Failed to fetch PDFs: ${pdfResponse.status} ${await pdfResponse.text()}`);
        }
        const pdfData = await pdfResponse.json();

        const validPdfs = Array.isArray(pdfData.pdfs) ? pdfData.pdfs.filter(pdf => pdf.url && pdf.url.endsWith('.pdf')) : [];
        const categorizedPdfs = validPdfs.reduce((acc, pdf) => {
          const category = pdf.section || categorizePdf(pdf);
          if (category === 'dayCamp') acc.dayCamp.push(pdf.url);
          else if (category === 'party') acc.party.push(pdf.url);
          else if (category === 'waiver') acc.waiver.push(pdf.url);
          return acc;
        }, { dayCamp: [], party: [], waiver: [] });
        setDayCampPdf(categorizedPdfs.dayCamp);
        setPartyPdf(categorizedPdfs.party);
        setWaiverPdf(categorizedPdfs.waiver);
        localStorage.setItem('events_dayCampPdf', JSON.stringify(categorizedPdfs.dayCamp));
        localStorage.setItem('events_partyPdf', JSON.stringify(categorizedPdfs.party));
        localStorage.setItem('events_waiverPdf', JSON.stringify(categorizedPdfs.waiver));
        setError(null);
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err.message);
        const savedImageUrls = localStorage.getItem('events_imageUrls');
        const savedDayCamp = localStorage.getItem('events_dayCampPdf');
        const savedParty = localStorage.getItem('events_partyPdf');
        const savedWaiver = localStorage.getItem('events_waiverPdf');
        if (savedImageUrls) setImageUrls(JSON.parse(savedImageUrls));
        if (savedDayCamp) setDayCampPdf(JSON.parse(savedDayCamp) || []);
        if (savedParty) setPartyPdf(JSON.parse(savedParty) || []);
        if (savedWaiver) setWaiverPdf(JSON.parse(savedWaiver) || []);
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
        headers: { 'Page': 'events' },
      });
      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        throw new Error(`Image upload failed: ${errorText}`);
      }
      const updatedResponse = await fetch(`${baseUrl}/api/assets/images?page=events`);
      if (updatedResponse.ok) {
        const updatedData = await updatedResponse.json();
        console.log('Updated images after upload:', updatedData);
        setImageUrls(updatedData.images); // Use S3 URLs directly
        localStorage.setItem('events_imageUrls', JSON.stringify(updatedData.images));
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
        headers: { 'Page': 'events', 'Url': urlToRemove }, // Send the full S3 URL
      });
      if (!deleteResponse.ok && deleteResponse.status !== 404) {
        const errorText = await deleteResponse.text();
        throw new Error(`Image delete failed: ${errorText}`);
      }
      console.warn(`Image not found on server, proceeding to refresh list: ${urlToRemove}`);
      const updatedResponse = await fetch(`${baseUrl}/api/assets/images?page=events`);
      if (!updatedResponse.ok) {
        const errorText = await updatedResponse.text();
        throw new Error(`Failed to fetch updated images after delete: ${errorText}`);
      }
      const updatedData = await updatedResponse.json();
      console.log('Updated images after delete:', updatedData);
      setImageUrls(updatedData.images);
      localStorage.setItem('events_imageUrls', JSON.stringify(updatedData.images));
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
      const updatedResponse = await fetch(`${baseUrl}/api/assets/pdfs?page=events`);
      if (!updatedResponse.ok) {
        const errorText = await updatedResponse.text();
        throw new Error(`Failed to fetch updated PDFs: ${errorText}`);
      }
      const updatedData = await updatedResponse.json();
      console.log('Updated PDFs after upload:', updatedData);
      const validPdfs = Array.isArray(updatedData.pdfs) ? updatedData.pdfs.filter(pdf => pdf.url && pdf.url.endsWith('.pdf')) : [];
      let newPdfs = { dayCamp: [...dayCampPdf], party: [...partyPdf], waiver: [...waiverPdf] };
      if (section) {
        if (section === 'dayCamp') newPdfs.dayCamp.push(url);
        else if (section === 'party') newPdfs.party.push(url);
        else if (section === 'waiver') newPdfs.waiver.push(url);
      }
      setDayCampPdf(newPdfs.dayCamp);
      setPartyPdf(newPdfs.party);
      setWaiverPdf(newPdfs.waiver);
      localStorage.setItem('events_dayCampPdf', JSON.stringify(newPdfs.dayCamp));
      localStorage.setItem('events_partyPdf', JSON.stringify(newPdfs.party));
      localStorage.setItem('events_waiverPdf', JSON.stringify(newPdfs.waiver));
      setError(null);
    } catch (err) {
      console.error('PDF upload fetch error:', err);
      setError(err.message);
    }
  };

  const handlePdfRemove = async (urlToRemove, section) => {
    if (!isAdmin) return;
    try {
      const relativeUrl = urlToRemove.startsWith(baseUrl) ? urlToRemove.replace(baseUrl, '') : urlToRemove;
      const deleteResponse = await fetchWithToken('/api/assets/pdfs', {
        method: 'DELETE',
        headers: { 'Page': 'events', 'Url': relativeUrl },
      });
      if (!deleteResponse.ok) {
        const errorText = await deleteResponse.text();
        console.warn(`DELETE failed for ${relativeUrl} with status ${deleteResponse.status}: ${errorText}`);
        if (deleteResponse.status !== 404) {
          throw new Error(`PDF delete failed: ${errorText}`);
        }
      }
      const updatedResponse = await fetch(`${baseUrl}/api/assets/pdfs?page=events`);
      if (!updatedResponse.ok) {
        const errorText = await updatedResponse.text();
        throw new Error(`Failed to fetch updated PDFs: ${errorText}`);
      }
      const updatedData = await updatedResponse.json();
      console.log('Updated PDFs after delete:', updatedData);
      const validPdfs = Array.isArray(updatedData.pdfs) ? updatedData.pdfs.filter(pdf => pdf.url && pdf.url.endsWith('.pdf')) : [];
      const categorizedPdfs = validPdfs.reduce((acc, pdf) => {
        const category = pdf.section || categorizePdf(pdf);
        if (category === 'dayCamp') acc.dayCamp.push(pdf.url);
        else if (category === 'party') acc.party.push(pdf.url);
        else if (category === 'waiver') acc.waiver.push(pdf.url);
        return acc;
      }, { dayCamp: [], party: [], waiver: [] });
      setDayCampPdf(categorizedPdfs.dayCamp);
      setPartyPdf(categorizedPdfs.party);
      setWaiverPdf(categorizedPdfs.waiver);
      localStorage.setItem('events_dayCampPdf', JSON.stringify(categorizedPdfs.dayCamp));
      localStorage.setItem('events_partyPdf', JSON.stringify(categorizedPdfs.party));
      localStorage.setItem('events_waiverPdf', JSON.stringify(categorizedPdfs.waiver));
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
        <h2 className="text-4xl font-bold text-center text-teal-700 mb-12">Events</h2>
        {error && <div className="text-red-500 text-center mb-4">{error}</div>}
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
                {dayCampPdf.length > 0 ? (
                  dayCampPdf.map((url, index) => (
                    <div key={index} className="flex items-center">
                      <PdfDownload url={`${baseUrl}${url}`} label={getFilenameFromUrl(url)} />
                      {isAdmin && <button onClick={() => handlePdfRemove(url, 'dayCamp')} className="text-red-500 ml-2">Remove</button>}
                    </div>
                  ))
                ) : (
                  <p>No Day Camp PDFs available.</p>
                )}
                {isAdmin && <PdfUpload onUpload={(url, section) => handlePdfUpload(url, section)} page="events" section="dayCamp" />}
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h3 className="text-2xl font-semibold text-teal-600 mb-4">Farm Parties & Birthday Parties</h3>
              <EditableSection page="events" initialContent="Host your Farm Party or Birthday Party with us! Register here:" field="parties" />
              <div className="mt-4">
                {partyPdf.length > 0 ? (
                  partyPdf.map((url, index) => (
                    <div key={index} className="flex items-center">
                      <PdfDownload url={`${baseUrl}${url}`} label={getFilenameFromUrl(url)} />
                      {isAdmin && <button onClick={() => handlePdfRemove(url, 'party')} className="text-red-500 ml-2">Remove</button>}
                    </div>
                  ))
                ) : (
                  <p>No Party PDFs available.</p>
                )}
                {isAdmin && <PdfUpload onUpload={(url, section) => handlePdfUpload(url, section)} page="events" section="party" />}
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
                {imageUrls.length > 0 ? (
                  imageUrls.map((url, index) => (
                    <div key={index} className="relative">
                      <img
                        src={url} // Use S3 URL directly
                        alt={`Event ${index + 1}`}
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
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h3 className="text-2xl font-semibold text-teal-600 mb-4">Waiver</h3>
              <EditableSection page="events" initialContent="Download our Release and Waiver of Liability form:" field="waiver" />
              <div className="mt-4">
                {waiverPdf.length > 0 ? (
                  waiverPdf.map((url, index) => (
                    <div key={index} className="flex items-center">
                      <PdfDownload url={`${baseUrl}${url}`} label={getFilenameFromUrl(url)} />
                      {isAdmin && <button onClick={() => handlePdfRemove(url, 'waiver')} className="text-red-500 ml-2">Remove</button>}
                    </div>
                  ))
                ) : (
                  <p>No Waiver PDFs available.</p>
                )}
                {isAdmin && <PdfUpload onUpload={(url, section) => handlePdfUpload(url, section)} page="events" section="waiver" />}
              </div>
            </div>
          </div>
        </div>
      </div>
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={closeModal}>
          <div className="relative">
            <img
              src={selectedImage} // Use S3 URL
              alt="Enlarged"
              className="max-h-[90vh] max-w-[90vw]"
              onError={() => handleImageError(selectedImage)}
            />
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
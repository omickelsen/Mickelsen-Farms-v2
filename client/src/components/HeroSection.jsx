import React, { useState, useEffect } from 'react';
import { useAuth, fetchWithToken } from '../context/AuthContext';

const HeroSection = () => {
  const { isAdmin, token } = useAuth();
  const [backgroundImage, setBackgroundImage] = useState('/path-to-farm-image.jpg');
  const [images, setImages] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [deletingImage, setDeletingImage] = useState(null);

  // Define baseUrl at the component level
  const baseUrl = process.env.NODE_ENV === 'production'
    ? 'https://mickelsen-family-farms.herokuapp.com'
    : 'http://localhost:5000';

  useEffect(() => {
    const fetchHeroBackground = async () => {
      try {
        const cacheBuster = new Date().getTime();
        const response = await fetch(`${baseUrl}/api/assets/images?page=default&t=${cacheBuster}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch hero background: ${response.status} ${await response.text()}`);
        }
        const data = await response.json();
        const fullImageUrls = Array.isArray(data.images) ? data.images.map(url => `${baseUrl}${url}`) : [];
        setImages(fullImageUrls);
        setBackgroundImage(fullImageUrls[0] || '/path-to-farm-image.jpg');
        setError(null);
      } catch (err) {
        console.error('Error fetching hero background:', err);
        setError('Error fetching hero background.');
        setImages([]);
      }
    };

    fetchHeroBackground();
  }, [baseUrl, isAdmin, token]);

  const handleImageUpload = async (event) => {
    if (!isAdmin) {
      setError('Only admins can change the background image.');
      return;
    }

    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      const uploadResponse = await fetchWithToken(
        `${baseUrl}/api/assets/images`,
        {
          method: 'POST',
          body: formData,
          headers: { 'Page': 'default' },
        }
      );

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        throw new Error(`Failed to upload image: ${errorText}`);
      }

      const updatedResponse = await fetch(`${baseUrl}/api/assets/images?page=default`);
      if (updatedResponse.ok) {
        const updatedData = await updatedResponse.json();
        
        const fullImageUrls = Array.isArray(updatedData.images) ? updatedData.images.map(url => `${baseUrl}${url}`) : [];
        setImages(fullImageUrls);
        setBackgroundImage(fullImageUrls[0] || '/path-to-farm-image.jpg');
        setSuccess('Background image updated successfully!');
      } else {
        throw new Error('Failed to update background image.');
      }
    } catch (err) {
      console.error('Error updating hero background:', err);
      setError(`Failed to update background image: ${err.message}`);
    }
  };

  const handleImageDelete = async (urlToRemove) => {
    if (!isAdmin) {
      setError('Only admins can delete images.');
      return;
    }

    setDeletingImage(urlToRemove);
    const relativeUrl = urlToRemove.startsWith(baseUrl) ? urlToRemove.replace(baseUrl, '') : urlToRemove;

    try {
      const deleteResponse = await fetchWithToken(
        `${baseUrl}/api/assets/images`,
        {
          method: 'DELETE',
          headers: { 'Page': 'default', 'Url': relativeUrl },
        }
      );

      if (!deleteResponse.ok && deleteResponse.status !== 404) {
        const errorText = await deleteResponse.text();
        throw new Error(`Failed to delete image: ${errorText}`);
      }

      console.warn(`Image not found on server, proceeding to refresh list: ${relativeUrl}`);
      const updatedResponse = await fetch(`${baseUrl}/api/assets/images?page=default`);
      if (!updatedResponse.ok) {
        const errorText = await updatedResponse.text();
        throw new Error(`Failed to fetch updated images after delete: ${errorText}`);
      }

      const updatedData = await updatedResponse.json();
      console.log('Updated images after delete:', updatedData);
      const fullImageUrls = Array.isArray(updatedData.images) ? updatedData.images.map(url => `${baseUrl}${url}`) : [];
      setImages(fullImageUrls);
      setBackgroundImage(fullImageUrls[0] || '/path-to-farm-image.jpg');
      setSuccess('Image deleted successfully!');
      setError(null);
    } catch (err) {
      console.error('Error deleting image:', err);
      setError(`Failed to delete image: ${err.message}`);
    } finally {
      setDeletingImage(null);
    }
  };

  return (
    <section
      className="relative bg-cover bg-center h-64 md:h-96"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <div className="absolute inset-0 bg-black opacity-40"></div>
      <div className="relative flex items-center justify-center h-full text-white p-4">
        <div className="text-center">
          <h1 className="text-3xl md:text-5xl font-bold text-shadow">Mickelsen Family Farms</h1>
          <p className="mt-2 md:mt-4 text-lg md:text-xl">Experience the beauty of rural life with us.</p>
        </div>
      </div>
      {isAdmin && (
        <div className="absolute bottom-4 right-4">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="btn-primary p-2 rounded"
          />
          {error && <div className="text-red-500 mt-2">{error}</div>}
          {success && <div className="text-green-500 mt-2">{success}</div>}
          {images.length > 0 && (
            <div className="mt-2">
              {images.map((url, index) => (
                <button
                  key={index}
                  onClick={() => handleImageDelete(url)}
                  className="ml-2 bg-red-600 text-white p-1 rounded"
                  disabled={deletingImage === url}
                >
                  {deletingImage === url ? 'Deleting...' : `Delete ${index + 1}`}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default HeroSection;
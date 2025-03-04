import React, { useState, useEffect } from 'react';
import { useAuth, fetchWithToken } from '../context/AuthContext';

const HeroSection = () => {
  const { token, isAdmin } = useAuth();
  const [backgroundImage, setBackgroundImage] = useState('/path-to-farm-image.jpg');
  const [isUploading, setIsUploading] = useState(false);
  const [images, setImages] = useState([]); // Store all images for delete option

  useEffect(() => {
    const fetchHeroBackground = async () => {
      try {
        const response = await fetch(
          process.env.NODE_ENV === 'production'
            ? 'https://your-heroku-app.herokuapp.com/api/images?page=default'
            : 'http://localhost:5000/api/images?page=default'
        );
        if (response.ok) {
          const data = await response.json();
          console.log('Hero fetched images data:', data);
          setImages(data.images || []);
          setBackgroundImage(data.images[0] || '/path-to-farm-image.jpg');
        } else {
          console.error('Fetch failed with status:', response.status);
        }
      } catch (err) {
        console.error('Error fetching hero background:', err);
      }
    };
    fetchHeroBackground();
  }, []);

  const handleImageUpload = async (event) => {
    if (!isAdmin || !token) {
      alert('Only admins can change the background image.');
      return;
    }

    const file = event.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const uploadResponse = await fetchWithToken(
        process.env.NODE_ENV === 'production'
          ? 'https://your-heroku-app.herokuapp.com/api/images'
          : 'http://localhost:5000/api/images',
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
      const uploadData = await uploadResponse.json();
      console.log('Upload response:', uploadData);

      // Re-fetch the updated background image
      const updatedResponse = await fetch(
        process.env.NODE_ENV === 'production'
          ? 'https://your-heroku-app.herokuapp.com/api/images?page=default'
          : 'http://localhost:5000/api/images?page=default'
      );
      if (updatedResponse.ok) {
        const updatedData = await updatedResponse.json();
        console.log('Updated images data:', updatedData);
        setImages(updatedData.images || []);
        setBackgroundImage(updatedData.images[0] || uploadData.url || '/path-to-farm-image.jpg');
      } else {
        console.error('Update fetch failed with status:', updatedResponse.status);
      }

      alert('Background image updated successfully!');
    } catch (err) {
      console.error('Error updating hero background:', err);
      alert('Failed to update background image: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageDelete = async (urlToRemove) => {
    if (!isAdmin || !token) {
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
          headers: { 'Page': 'default', 'Url': urlToRemove },
        }
      );

      if (!deleteResponse.ok) {
        const errorText = await deleteResponse.text();
        throw new Error(`Failed to delete image: ${errorText}`);
      }

      // Re-fetch after deletion
      const updatedResponse = await fetch(
        process.env.NODE_ENV === 'production'
          ? 'https://your-heroku-app.herokuapp.com/api/images?page=default'
          : 'http://localhost:5000/api/images?page=default'
      );
      if (updatedResponse.ok) {
        const updatedData = await updatedResponse.json();
        console.log('Updated images data after delete:', updatedData);
        setImages(updatedData.images || []);
        setBackgroundImage(updatedData.images[0] || '/path-to-farm-image.jpg');
      }
      alert('Image deleted successfully!');
    } catch (err) {
      console.error('Error deleting image:', err);
      alert('Failed to delete image: ' + err.message);
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
            disabled={isUploading}
            className="btn-primary p-2 rounded"
          />
          {isUploading && <span className="ml-2 text-white">Uploading...</span>}
          {images.length > 0 && (
            <div className="mt-2">
              {images.map((url, index) => (
                <button
                  key={index}
                  onClick={() => handleImageDelete(url)}
                  className="ml-2 bg-red-600 text-white p-1 rounded"
                >
                  Delete {index + 1}
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
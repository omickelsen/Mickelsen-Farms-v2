import React, { useState, useEffect } from 'react';
import { useAuth, fetchWithToken } from '../context/AuthContext';

const HeroSection = () => {
  const { token, isAdmin } = useAuth();
  const [backgroundImage, setBackgroundImage] = useState('/path-to-farm-image.jpg');
  const [isUploading, setIsUploading] = useState(false);

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
          console.log('Hero fetched images data:', data); // Debugging
          setBackgroundImage(data.images[0] || '/path-to-farm-image.jpg');
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

      if (!uploadResponse.ok) throw new Error('Failed to upload image');
      const uploadData = await uploadResponse.json();
      const newImageUrl = uploadData.url;

      setBackgroundImage(newImageUrl);
      alert('Background image updated successfully!');
    } catch (err) {
      console.error('Error updating hero background:', err);
      alert('Failed to update background image.');
    } finally {
      setIsUploading(false);
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
        </div>
      )}
    </section>
  );
};

export default HeroSection;
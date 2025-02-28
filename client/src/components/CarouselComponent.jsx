import React, { useEffect, useCallback } from 'react';
import AdminImageUpload from './AdminImageUpload';
import { fetchWithToken } from '../context/AuthContext';
import { useAuth } from '../context/AuthContext';

const CarouselComponent = ({
  images,
  setImages,
  currentImageIndex,
  setCurrentImageIndex,
}) => {
  const { token, isAdmin } = useAuth();

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 8000); // 8-second interval
    return () => clearInterval(interval);
  }, [images.length, setCurrentImageIndex]);

  const handleNextImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  const handlePrevImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
  };

  const handleImageUpload = async (newImage) => {
    if (isAdmin && token) {
      try {
        const formData = new FormData();
        formData.append('image', newImage);
        const response = await fetchWithToken(
          process.env.NODE_ENV === 'production'
            ? 'https://your-heroku-app.herokuapp.com/api/images'
            : 'http://localhost:5000/api/images',
          {
            method: 'POST',
            body: formData,
          }
        );
        if (!response.ok) throw new Error('Failed to upload image');
        const data = await response.json();
        setImages((prevImages) => [...prevImages, data.url]);
      } catch (err) {
        console.error('Error uploading image:', err);
      }
    }
  };

  const handleRemoveImage = (index) => {
    if (isAdmin && token) {
      setImages((prevImages) => prevImages.filter((_, i) => i !== index));
      if (currentImageIndex >= images.length - 1) {
        setCurrentImageIndex(0);
      }
    }
  };

  return (
    <div className="relative mt-6">
      {images.length > 0 && (
        <>
          <img
            src={images[currentImageIndex]}
            alt="Farm Facilities"
            className="w-full h-96 object-cover rounded-lg transition-opacity duration-1000 ease-in-out"
          />
          <button
            onClick={handlePrevImage}
            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-teal-600 text-white p-2 rounded-full"
            disabled={images.length <= 1}
          >
            ←
          </button>
          <button
            onClick={handleNextImage}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-teal-600 text-white p-2 rounded-full"
            disabled={images.length <= 1}
          >
            →
          </button>
        </>
      )}
      {isAdmin && <AdminImageUpload onImageUpload={handleImageUpload} />}
      {isAdmin && images.length > 0 && (
        <div className="mt-2">
          {images.map((img, index) => (
            <button
              key={index}
              onClick={() => handleRemoveImage(index)}
              className="text-red-500 ml-2"
            >
              Remove {index + 1}
            </button>
          ))}
          <span className="ml-4 text-gray-700">Total Images: {images.length}</span>
        </div>
      )}
    </div>
  );
};

export default CarouselComponent;
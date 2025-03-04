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

  // Fetch images for the 'carousel' page
  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await fetch(
          process.env.NODE_ENV === 'production'
            ? 'https://your-heroku-app.herokuapp.com/api/images?page=carousel'
            : 'http://localhost:5000/api/images?page=carousel'
        );
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        console.log('Carousel fetched images data:', data); // Debugging
        setImages(data.images || []);
      } catch (err) {
        console.error('Error fetching carousel images:', err);
        setImages([]);
      }
    };
    fetchImages();
  }, [setImages]);

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
        console.log('Uploading image:', newImage.name); // Debug file
        const response = await fetchWithToken(
          process.env.NODE_ENV === 'production'
            ? 'https://your-heroku-app.herokuapp.com/api/images'
            : 'http://localhost:5000/api/images',
          {
            method: 'POST',
            body: formData,
            headers: { 'Page': 'carousel' },
          }
        );
        if (!response.ok) throw new Error(`Upload failed with status: ${response.status}`);
        const data = await response.json();
        console.log('Upload response data:', data); // Debug response
        if (data.url) {
          setImages((prevImages) => [...prevImages, data.url]);
        } else {
          console.error('No URL in response:', data);
          alert('Upload failed: No valid image URL returned.');
        }
      } catch (err) {
        console.error('Error uploading image:', err);
        alert('Failed to upload image: ' + err.message);
      }
    } else {
      alert('Only admins can upload images.');
    }
  };

  const handleRemoveImage = async (index) => {
    if (isAdmin && token) {
      try {
        const urlToRemove = images[index];
        const response = await fetchWithToken(
          process.env.NODE_ENV === 'production'
            ? 'https://your-heroku-app.herokuapp.com/api/images'
            : 'http://localhost:5000/api/images',
          {
            method: 'DELETE',
            headers: {
              'Page': 'carousel',
              'Url': urlToRemove,
            },
          }
        );
        if (!response.ok) throw new Error(`Delete failed with status: ${response.status}`);
        setImages((prevImages) => prevImages.filter((_, i) => i !== index));
        if (currentImageIndex >= images.length - 1) {
          setCurrentImageIndex(0);
        }
      } catch (err) {
        console.error('Error removing image:', err);
        alert('Failed to remove image: ' + err.message);
      }
    } else {
      alert('Only admins can remove images.');
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
            onError={(e) => console.log('Image load error for:', images[currentImageIndex])} // Debug image load
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
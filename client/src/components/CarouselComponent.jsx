import React, { useEffect, useState } from 'react';
import AdminImageUpload from './AdminImageUpload';
import { useAuth, fetchWithToken } from '../context/AuthContext';

const CarouselComponent = ({
  currentImageIndex,
  setCurrentImageIndex,
}) => {
  const { isAdmin, token } = useAuth();
  const [images, setImages] = useState([]);
  const [originalImages, setOriginalImages] = useState([]);
  const [error, setError] = useState(null);
  const [deletingImage, setDeletingImage] = useState(null);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const cacheBuster = new Date().getTime();
        const response = await fetch(`/api/assets/images?page=carousel&t=${cacheBuster}`);
        if (!response.ok && response.status !== 304) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        // Use S3 URLs directly
        setOriginalImages(data.images || []);
        setImages(data.images || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching carousel images:', err);
        setImages([]);
        setOriginalImages([]);
        setError('Failed to load carousel images');
      }
    };

    // Fetch images whenever isAdmin or token changes (e.g., after login)
    fetchImages();
  }, [isAdmin, token]);

  useEffect(() => {
    if (images.length === 0) return;
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [images.length, setCurrentImageIndex]);

  const handleNextImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  const handlePrevImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
  };

  const handleImageUpload = async (event) => {
    if (!isAdmin) {
      setError('Only admins can upload images.');
      return;
    }

    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      const uploadResponse = await fetchWithToken(
        '/api/assets/images',
        {
          method: 'POST',
          body: formData,
          headers: { 'Page': 'carousel' },
        }
      );

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        throw new Error(`Failed to upload image: ${errorText}`);
      }

      const updatedResponse = await fetch('/api/assets/images?page=carousel');
      if (updatedResponse.ok) {
        const updatedData = await updatedResponse.json();
        console.log('Updated images after upload:', updatedData);
        // Use S3 URLs directly
        setOriginalImages(updatedData.images || []);
        setImages(updatedData.images || []);
      } else {
        throw new Error('Failed to update carousel images.');
      }
    } catch (err) {
      console.error('Error uploading carousel image:', err);
      setError(`Failed to upload image: ${err.message}`);
    }
  };

  const handleRemoveImage = async (index) => {
    if (!isAdmin) {
      setError('Only admins can remove images.');
      return;
    }

    setDeletingImage(index);
    const urlToRemove = images[index]; // Use the full S3 URL

    try {
      const response = await fetchWithToken(
        '/api/assets/images',
        {
          method: 'DELETE',
          headers: {
            'Page': 'carousel',
            'Url': urlToRemove, // Send the full S3 URL
          },
        }
      );

      if (!response.ok) {
        throw new Error('Delete failed');
      }

      const updatedResponse = await fetch('/api/assets/images?page=carousel');
      if (updatedResponse.ok) {
        const updatedData = await updatedResponse.json();
        console.log('Updated images after delete:', updatedData);
        // Use S3 URLs directly
        setOriginalImages(updatedData.images || []);
        setImages(updatedData.images || []);
        if (currentImageIndex >= updatedData.images.length) {
          setCurrentImageIndex(0);
        }
        setError(null);
      }
    } catch (err) {
      console.error('Error removing image:', err);
      setError(`Failed to remove image: ${err.message}`);
    } finally {
      setDeletingImage(null);
    }
  };

  return (
    <div className="relative mt-6">
      {images.length > 0 ? (
        <>
          <img
            src={images[currentImageIndex]}
            alt="Farm Facilities"
            className="w-full h-96 object-cover rounded-lg transition-opacity duration-1000 ease-in-out"
            onError={(e) => {
              console.error('Image load error:', e.target.src, e);
              setError('Image failed to load, carousel reset');
              setImages([]);
              setOriginalImages([]);
            }}
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
      ) : (
        <p className="text-center text-gray-500">No images available in the carousel.</p>
      )}
      {error && <div className="text-red-500 mt-2">{error}</div>}
      {isAdmin && <AdminImageUpload onImageUpload={handleImageUpload} />}
      {isAdmin && images.length > 0 && (
        <div className="mt-2">
          {images.map((img, index) => (
            <button
              key={index}
              onClick={() => handleRemoveImage(index)}
              className="text-red-500 ml-2"
              disabled={deletingImage === index}
            >
              {deletingImage === index ? 'Deleting...' : `Remove ${index + 1}`}
            </button>
          ))}
          <span className="ml-4 text-gray-700">Total Images: {images.length}</span>
        </div>
      )}
    </div>
  );
};

export default CarouselComponent;
import React, { useEffect, useState } from 'react';
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
  const [originalImages, setOriginalImages] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const cacheBuster = new Date().getTime();
        if (process.env.NODE_ENV === 'development') {
          
        }
        const response = await fetch(`/api/images?page=carousel&t=${cacheBuster}`);
        if (process.env.NODE_ENV === 'development') {
          
        }
        if (!response.ok && response.status !== 304) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        if (process.env.NODE_ENV === 'development') {
          
        }
        const baseUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : '';
        const fullUrls = data.images.map(url => {
          const cleanUrl = url.startsWith('http') ? url.replace(/^http:\/\/localhost:5000/, '') : url;
          return `${baseUrl}${cleanUrl}`;
        });
        setOriginalImages(data.images || []);
        setImages(fullUrls);
        setError(null); // Clear error on successful fetch
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error fetching carousel images:', err);
        }
        setImages([]);
        setOriginalImages([]);
        setError('Failed to load carousel images');
      }
    };
    fetchImages();
  }, [setImages]);

  useEffect(() => {
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

  const handleRemoveImage = async (index) => {
    if (isAdmin && token) {
      try {
        const urlToRemove = images[index];
        const originalUrl = originalImages[index] || urlToRemove.replace(/^http:\/\/localhost:5000/, '');
        const response = await fetchWithToken(
          '/api/images',
          {
            method: 'DELETE',
            headers: {
              'Page': 'carousel',
              'Url': originalUrl,
            },
          }
        );
        if (!response.ok) throw new Error('Delete failed');
        setImages((prevImages) => prevImages.filter((_, i) => i !== index));
        setOriginalImages((prev) => prev.filter((_, i) => i !== index));
        if (currentImageIndex >= images.length - 1) {
          setCurrentImageIndex(0);
        }
        setError(null); // Clear error on successful delete
      } catch (err) {
        alert('Failed to remove image: ' + err.message); // Keep alert for user action feedback
      }
    } else {
      alert('Only admins can remove images.'); // Keep alert for authorization feedback
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
            onError={(e) => {
              if (process.env.NODE_ENV === 'development') {
                console.error('Image load error:', e.target.src, e);
              }
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
      )}
      {error && <div className="text-red-500 mt-2">{error}</div>}
      {isAdmin && <AdminImageUpload onImageUpload={(url) => {
        const baseUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : '';
        const cleanUrl = url.startsWith('http') ? url.replace(/^http:\/\/localhost:5000/, '') : url;
        setImages((prev) => [...prev, `${baseUrl}${cleanUrl}`]);
      }} />}
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
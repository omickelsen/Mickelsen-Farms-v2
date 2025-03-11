import React from 'react';

const GoogleMapComponent = () => {
  // Replace with the actual address or coordinates of Mickelsen Family Farm
  const farmAddress = '1393 North 500 East, Pleasant Grove, UT 84062'; //  address from your Contact section
  // Replace with your Google API key
  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;

  // Construct the embed URL with the API key
  const mapUrl = `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodeURIComponent(farmAddress)}&zoom=14`;

  return (
    <div className="map-container w-full max-w-4xl mx-auto my-4">
      <iframe
        src={mapUrl}
        width="100%"
        height="450"
        style={{ border: 0 }}
        allowFullScreen=""
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title="Mickelsen Family Farm Location"
      ></iframe>
    </div>
  );
};

export default GoogleMapComponent;
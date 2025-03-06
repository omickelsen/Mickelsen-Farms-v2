import React from 'react';

const PdfDownload = ({ url, label }) => {
  const baseUrl = process.env.NODE_ENV === 'production'
    ? 'https://mickelsen-family-farms.herokuapp.com'
    : 'http://localhost:5000';
  const fullUrl = url.startsWith(baseUrl) ? url : `${baseUrl}${url}`;

  return (
    <a
      href={fullUrl}
      download={label} // Use the original filename without timestamp
      className="text-teal-600 hover:text-teal-800 underline"
    >
      {label}
    </a>
  );
};

export default PdfDownload;
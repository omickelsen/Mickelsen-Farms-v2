import React from 'react';

const PdfDownload = ({ url, label }) => {


  // Use the raw S3 URL directly
  const fullUrl = url;

  // Clean label for display
  const displayLabel = label?.replace(/[^a-zA-Z0-9-_.\s]/g, '') || 'View PDF';

  return (
    <a
      href={fullUrl}
      target="_blank" // Open in new tab for inline rendering or download
      rel="noopener noreferrer" // Security best practice
      className="text-teal-600 hover:text-teal-800 underline"
      onClick={() => console.log('Opening PDF:', fullUrl)} // Debug click event
    >
      {displayLabel}
    </a>
  );
};

export default PdfDownload;
import React from 'react';

const PdfDownload = ({ url, label }) => {
  // Log the raw URL for debugging
  console.log('PdfDownload URL:', url);

  // Use the raw S3 URL directly, no need to prepend baseUrl
  const fullUrl = url;

  // Ensure label is a string and clean it for the download attribute
  const downloadLabel = label?.replace(/[^a-zA-Z0-9-_.\s]/g, '') || 'download.pdf';

  return (
    <a
      href={fullUrl}
      download={downloadLabel} // Use the cleaned label for download
      target="_blank" // Open in new tab to ensure browser handles PDF correctly
      rel="noopener noreferrer" // Security best practice
      className="text-teal-600 hover:text-teal-800 underline"
      onClick={() => console.log('Downloading PDF:', fullUrl)} // Debug click event
    >
      {label}
    </a>
  );
};

export default PdfDownload;
import React from 'react';

const PdfDownload = ({ url, label }) => (
  <a
    href={url}
    download
    className="text-teal-600 hover:text-teal-800 underline"
  >
    {label}
  </a>
);

export default PdfDownload;
import React, { useState } from 'react';
import { X, Download, ZoomIn, ZoomOut, FileText, Loader2 } from 'lucide-react';
import './PDFViewer.css';

function PDFViewer({ pdfUrl, filename, onClose }) {
  const [loading, setLoading] = useState(true);
  const [scale, setScale] = useState(1);

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.2, 3));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.2, 0.5));
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = filename || 'document.pdf';
    link.target = '_blank';
    link.click();
  };

  return (
    <div className="pdf-viewer-modal">
      <div className="pdf-viewer-overlay" onClick={onClose}></div>
      
      <div className="pdf-viewer-container">
        {/* Header */}
        <div className="pdf-viewer-header">
          <div className="pdf-title">
            <FileText size={20} />
            <span>{filename || 'Document Viewer'}</span>
          </div>
          
          <div className="pdf-viewer-actions">
            <button className="pdf-action-btn" onClick={handleZoomOut} title="Zoom Out">
              <ZoomOut size={18} />
            </button>
            <span className="zoom-level">{Math.round(scale * 100)}%</span>
            <button className="pdf-action-btn" onClick={handleZoomIn} title="Zoom In">
              <ZoomIn size={18} />
            </button>
            <button className="pdf-action-btn" onClick={handleDownload} title="Download">
              <Download size={18} />
            </button>
            <button className="pdf-action-btn close-btn" onClick={onClose} title="Close">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* PDF Content */}
        <div className="pdf-viewer-content">
          {loading && (
            <div className="pdf-loading">
              <Loader2 size={32} className="spinning" />
              <p>Loading PDF...</p>
            </div>
          )}
          
          <iframe
            src={pdfUrl}
            title="PDF Viewer"
            className="pdf-iframe"
            style={{ transform: `scale(${scale})`, transformOrigin: '0 0' }}
            onLoad={() => setLoading(false)}
            allow="fullscreen"
          />
        </div>
      </div>
    </div>
  );
}

export default PDFViewer;
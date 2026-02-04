import React, { useState, useEffect, useRef } from 'react';
import { X, Download, ZoomIn, ZoomOut, FileText, Loader2, AlertCircle } from 'lucide-react';
import './PDFViewer.css';

function PDFViewer({ pdfUrl, filename, onClose }) {
  const [loading, setLoading] = useState(true);
  const [scale, setScale] = useState(1);
  const [showDownloadButton, setShowDownloadButton] = useState(false);
  const [fileType, setFileType] = useState('pdf');
  const [hasError, setHasError] = useState(false);
  const iframeRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    // Check file type from filename
    const fileExt = filename?.split('.').pop().toLowerCase() || '';
    const isPDF = fileExt === 'pdf';
    setFileType(isPDF ? 'pdf' : 'other');
    
    // Get file info from localStorage
    const fileInfoStr = localStorage.getItem('currentFileInfo');
    if (fileInfoStr) {
      try {
        const fileInfo = JSON.parse(fileInfoStr);
        if (!fileInfo.isPDF) {
          // For non-PDF files, show download button after 4 seconds
          timeoutRef.current = setTimeout(() => {
            setShowDownloadButton(true);
          }, 4000);
        }
      } catch (e) {
        console.error('Error parsing file info:', e);
      }
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [filename]);

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.2, 3));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.2, 0.5));
  };

  const handleDownload = () => {
    // Create a link and trigger download
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = filename || 'document';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleIframeLoad = () => {
    setLoading(false);
    setHasError(false);
    // Clear timeout if content loaded
    if (timeoutRef.current && fileType === 'pdf') {
      clearTimeout(timeoutRef.current);
    }
  };

  const handleIframeError = () => {
    setLoading(false);
    setHasError(true);
    setShowDownloadButton(true);
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
            {fileType !== 'pdf' && (
              <span className="file-type-badge">
                {filename?.split('.').pop().toUpperCase() || 'FILE'}
              </span>
            )}
          </div>
          
          <div className="pdf-viewer-actions">
            {fileType === 'pdf' && (
              <>
                <button className="pdf-action-btn" onClick={handleZoomOut} title="Zoom Out">
                  <ZoomOut size={18} />
                </button>
                <span className="zoom-level">{Math.round(scale * 100)}%</span>
                <button className="pdf-action-btn" onClick={handleZoomIn} title="Zoom In">
                  <ZoomIn size={18} />
                </button>
              </>
            )}
            
            {/* Always show download button */}
            <button className="pdf-action-btn" onClick={handleDownload} title="Download">
              <Download size={18} />
            </button>
            
            <button className="pdf-action-btn close-btn" onClick={onClose} title="Close">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="pdf-viewer-content">
          {loading && (
            <div className="pdf-loading">
              <Loader2 size={32} className="spinning" />
              <p>Loading document...</p>
              {fileType !== 'pdf' && (
                <p className="loading-note">Click above to download</p>
              )}
            </div>
          )}
          
          {hasError && (
            <div className="pdf-error">
              <AlertCircle size={48} />
              <h3>Cannot Display Document</h3>
              <p>This file type cannot be displayed in the browser.</p>
              <button className="btn-download-large" onClick={handleDownload}>
                <Download size={20} />
                Download File
              </button>
            </div>
          )}
          
          <iframe
            ref={iframeRef}
            src={pdfUrl}
            title="Document Viewer"
            className="pdf-iframe"
            style={{ 
              transform: fileType === 'pdf' ? `scale(${scale})` : 'none',
              transformOrigin: fileType === 'pdf' ? '0 0' : 'center',
              display: hasError ? 'none' : 'block'
            }}
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            allow="fullscreen"
          />
          
          {/* Download overlay for non-PDF files after timeout */}
          {!loading && !hasError && showDownloadButton && fileType !== 'pdf' && (
            <div className="download-overlay">
              <div className="download-overlay-content">
                <p>For best experience with this file type:</p>
                <button className="btn-download-overlay" onClick={handleDownload}>
                  <Download size={16} />
                  Download File
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PDFViewer;

// import React, { useState } from 'react';
// import { X, Download, ZoomIn, ZoomOut, FileText, Loader2 } from 'lucide-react';
// import './PDFViewer.css';

// function PDFViewer({ pdfUrl, filename, onClose }) {
//   const [loading, setLoading] = useState(true);
//   const [scale, setScale] = useState(1);

//   const handleZoomIn = () => {
//     setScale(prev => Math.min(prev + 0.2, 3));
//   };

//   const handleZoomOut = () => {
//     setScale(prev => Math.max(prev - 0.2, 0.5));
//   };

//   const handleDownload = () => {
//     const link = document.createElement('a');
//     link.href = pdfUrl;
//     link.download = filename || 'document.pdf';
//     link.target = '_blank';
//     link.click();
//   };

//   return (
//     <div className="pdf-viewer-modal">
//       <div className="pdf-viewer-overlay" onClick={onClose}></div>
      
//       <div className="pdf-viewer-container">
//         {/* Header */}
//         <div className="pdf-viewer-header">
//           <div className="pdf-title">
//             <FileText size={20} />
//             <span>{filename || 'Document Viewer'}</span>
//           </div>
          
//           <div className="pdf-viewer-actions">
//             <button className="pdf-action-btn" onClick={handleZoomOut} title="Zoom Out">
//               <ZoomOut size={18} />
//             </button>
//             <span className="zoom-level">{Math.round(scale * 100)}%</span>
//             <button className="pdf-action-btn" onClick={handleZoomIn} title="Zoom In">
//               <ZoomIn size={18} />
//             </button>
//             <button className="pdf-action-btn" onClick={handleDownload} title="Download">
//               <Download size={18} />
//             </button>
//             <button className="pdf-action-btn close-btn" onClick={onClose} title="Close">
//               <X size={18} />
//             </button>
//           </div>
//         </div>

//         {/* PDF Content */}
//         <div className="pdf-viewer-content">
//           {loading && (
//             <div className="pdf-loading">
//               <Loader2 size={32} className="spinning" />
//               <p>Loading PDF...</p>
//             </div>
//           )}
          
//           <iframe
//             src={pdfUrl}
//             title="PDF Viewer"
//             className="pdf-iframe"
//             style={{ transform: `scale(${scale})`, transformOrigin: '0 0' }}
//             onLoad={() => setLoading(false)}
//             allow="fullscreen"
//           />
//         </div>
//       </div>
//     </div>
//   );
// }

// export default PDFViewer;
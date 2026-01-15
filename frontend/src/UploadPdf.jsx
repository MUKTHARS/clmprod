import React, { useState } from 'react'
import axios from 'axios'

function UploadPdf({ onUploadComplete, setLoading }) {
  const [file, setFile] = useState(null)
  const [uploadStatus, setUploadStatus] = useState('')

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile)
      setUploadStatus('')
    } else {
      setUploadStatus('Please select a PDF file')
      setFile(null)
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setUploadStatus('Please select a file first')
      return
    }

    const formData = new FormData()
    formData.append('file', file)

    setLoading(true)
    setUploadStatus('Uploading...')

    try {
      const response = await axios.post('http://localhost:8000/upload/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      setUploadStatus('Upload successful!')
      onUploadComplete(response.data)
      setFile(null)
      document.getElementById('pdf-upload').value = ''
    } catch (error) {
      console.error('Upload error:', error)
      setUploadStatus(`Error: ${error.response?.data?.detail || error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="upload-container">
      <h2>Upload PDF Contract</h2>
      <div className="upload-box">
        <input
          type="file"
          id="pdf-upload"
          accept=".pdf"
          onChange={handleFileChange}
          className="file-input"
        />
        <label htmlFor="pdf-upload" className="file-label">
          Choose PDF File
        </label>
        {file && <p className="file-name">Selected: {file.name}</p>}
        <button 
          onClick={handleUpload} 
          className="upload-button"
          disabled={!file}
        >
          Upload & Process
        </button>
        {uploadStatus && (
          <p className={`status ${uploadStatus.includes('Error') ? 'error' : 'success'}`}>
            {uploadStatus}
          </p>
        )}
        <div className="instructions">
          <p><strong>Supported PDFs:</strong></p>
          <ul>
            <li>Grant agreements</li>
            <li>Contract documents</li>
            <li>Funding agreements</li>
            <li>Research grants</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default UploadPdf
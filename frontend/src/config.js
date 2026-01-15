// Get the API URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001';
const FRONTEND_URL = window.location.origin;

// Clean the URL (remove trailing slash)
const cleanUrl = (url) => {
  return url.endsWith('/') ? url.slice(0, -1) : url;
};

const BASE_API_URL = cleanUrl(API_BASE_URL);

export const API_CONFIG = {
  BASE_URL: BASE_API_URL,
  FRONTEND_URL: cleanUrl(FRONTEND_URL),
  ENDPOINTS: {
    CONTRACTS: `${BASE_API_URL}/api/contracts`,
    UPLOAD: `${BASE_API_URL}/upload`,
    SIMILAR: (id) => `${BASE_API_URL}/api/contracts/${id}/similar`,
    COMPREHENSIVE: (id) => `${BASE_API_URL}/api/contracts/${id}/comprehensive`,
    CONTRACT_BY_ID: (id) => `${BASE_API_URL}/api/contracts/${id}`
  }
};

// Helper function for API calls
export const fetchAPI = async (endpoint, options = {}) => {
  try {
    const response = await fetch(endpoint, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    return await response.text();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export default API_CONFIG;


// // /home/ubuntu/clmprod/frontend/src/config.js
// // Get the API URL from environment variable
// const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

// // Clean the URL (remove trailing slash)
// const baseUrl = API_BASE_URL.endsWith('/') 
//   ? API_BASE_URL.slice(0, -1) 
//   : API_BASE_URL;

// export const API_URLS = {
//   CONTRACTS: `${baseUrl}/api/contracts`,
//   UPLOAD: `${baseUrl}/api/upload`,
//   // Add other endpoints as needed
// };

// // Helper function for API calls
// export const fetchAPI = async (endpoint, options = {}) => {
//   try {
//     const url = `${API_CONFIG.BASE_URL}${endpoint}`;
//     const response = await fetch(url, options);
    
//     // Check if response is HTML instead of JSON
//     const contentType = response.headers.get('content-type');
//     if (!contentType || !contentType.includes('application/json')) {
//       const text = await response.text();
//       console.error('Received non-JSON response:', text.substring(0, 500));
//       throw new Error('Server returned HTML instead of JSON');
//     }
    
//     return await response.json();
//   } catch (error) {
//     console.error('API Error:', error);
//     throw error;
//   }
// };

// export default API_URLS;
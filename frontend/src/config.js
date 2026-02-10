// Get the API URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://localhost:4001';
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
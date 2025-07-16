// API service for evidence submission
import { apiFetch } from '../utils/apiFetch';

/**
 * Submit evidence data to the API
 * 
 * @param {Object} evidenceData - The evidence data to submit
 * @returns {Promise} - Resolves with response data
 */
export const submitEvidence = async (evidenceData) => {
  try {
    console.log('Submitting evidence data:', evidenceData);
    
    const response = await apiFetch('evidence/submit', {
      method: 'POST',
      body: JSON.stringify(evidenceData),
    });
    
    return response;
  } catch (error) {
    console.error('Evidence submission error:', error);
    return {
      success: false,
      error: 'Failed to submit evidence. Please try again.',
    };
  }
};

/**
 * Fetch evidence data from the API
 * 
 * @param {string} evidenceId - Optional ID to fetch specific evidence
 * @returns {Promise} - Resolves with response data
 */
export const getEvidenceData = async (evidenceId = null) => {
  try {
    const endpoint = evidenceId ? `evidence/${evidenceId}` : 'evidence';
    
    const response = await apiFetch(endpoint, {
      method: 'GET',
    });
    
    return response;
  } catch (error) {
    console.error('Evidence fetch error:', error);
    return {
      success: false,
      error: 'Failed to fetch evidence data. Please try again.',
    };
  }
};

/**
 * Upload evidence file to the API
 * 
 * @param {Object} fileData - The file data to upload
 * @param {Object} metadata - Additional metadata for the file
 * @returns {Promise} - Resolves with response data
 */
export const uploadEvidenceFile = async (fileData, metadata = {}) => {
  try {
    // Create form data for file upload
    const formData = new FormData();
    formData.append('file', fileData);
    
    // Add any metadata
    Object.keys(metadata).forEach(key => {
      formData.append(key, metadata[key]);
    });
    
    const response = await apiFetch('evidence/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });
    
    return response;
  } catch (error) {
    console.error('Evidence upload error:', error);
    return {
      success: false,
      error: 'Failed to upload evidence file. Please try again.',
    };
  }
};

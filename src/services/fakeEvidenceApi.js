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
 * Submit form data to the PlanDetails/FillForm API
 * 
 * @param {Object} formData - The form data to submit
 * @returns {Promise} - Resolves with response data
 */
export const submitFormData = async (formData) => {
  try {
    const response = await apiFetch('PlanDetails/FillForm', {
      method: 'POST',
      body: JSON.stringify(formData),
    });
    
    console.log("fill form response:", response);
    
    // Handle non-JSON responses
    if (response.isTextResponse) {
      // Check if the raw text response indicates success
      const isSuccess = 
        response.success || 
        (response.rawResponse && 
          (response.rawResponse.toLowerCase().includes('success') || 
           response.rawResponse.toLowerCase().includes('updated') ||
           !response.rawResponse.toLowerCase().includes('error')));
      
      return {
        success: isSuccess,
        message: isSuccess ? 'Form submitted successfully' : 'Failed to submit form',
        rawResponse: response.rawResponse
      };
    }
    
    return response;
  } catch (error) {
    console.error('Form submission error:', error);
    return {
      success: false,
      error: error.message || 'Failed to submit form data. Please try again.',
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

/**
 * Upload images to ImageUpload/ImageUpload API
 * 
 * @param {FormData} formData - Form data with images and metadata
 * @returns {Promise} - Resolves with response data
 */
export const uploadImages = async (formData) => {
  try {
    const response = await apiFetch('/ImgUpload/UploadImage', {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });
    
    console.log("Image upload response:", response);
    
    // Handle non-JSON responses
    if (response.isTextResponse) {
      // Check if the raw text response indicates success
      const isSuccess = 
        response.success || 
        (response.rawResponse && 
          (response.rawResponse.toLowerCase().includes('success') || 
           response.rawResponse.toLowerCase().includes('uploaded')));
      
      return {
        success: isSuccess,
        message: isSuccess ? 'Images uploaded successfully' : 'Failed to upload images',
        rawResponse: response.rawResponse
      };
    }
    
    return response;
  } catch (error) {
    console.error('Image upload error:', error);
    return {
      success: false,
      error: error.message || 'Failed to upload images. Please try again.',
    };
  }
};

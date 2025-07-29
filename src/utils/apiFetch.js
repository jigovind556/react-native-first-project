// Import dependencies
import { API_BASE_URL } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loginUser } from '../services/authService';

/**
 * Industry-grade fetch utility for making API requests
 * Automatically handles authentication, errors, and common response patterns
 * 
 * @param {string} endpoint - API endpoint (without base URL)
 * @param {Object} options - Fetch options (method, body, headers, etc.)
 * @param {boolean} requiresAuth - Whether the request requires authentication
 * @returns {Promise<Object>} - Response data
 */
export const apiFetch = async (endpoint, options = {}, requiresAuth = true) => {
  try {
    // Set up default headers
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Handle authentication if required
    if (requiresAuth) {
      // Get auth token from AsyncStorage
      const token = await AsyncStorage.getItem('authToken');
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        
        // // Add token to headers directly instead of using cookies
        // const sessionId = await AsyncStorage.getItem('sessionId');
        // if (sessionId) {
        //   headers['Session-ID'] = sessionId;
        // }
      } else {
        console.warn('Authentication required but no token found');
      }
    }

    // Construct full URL, handling relative paths with ../
    let baseUrl = API_BASE_URL;
    let processedEndpoint = endpoint;
    
    // Handle relative paths with ../ in the endpoint
    if (endpoint.includes('../')) {
      const baseUrlParts = API_BASE_URL.endsWith('/') 
        ? API_BASE_URL.slice(0, -1).split('/')
        : API_BASE_URL.split('/');
      
      // Count and process the ../ occurrences
      while (processedEndpoint.startsWith('../')) {
        // Remove a segment from baseUrl for each ../
        if (baseUrlParts.length > 3) { // Keep at least http(s)://domain
          baseUrlParts.pop();
        }
        // Remove the ../ from the endpoint
        processedEndpoint = processedEndpoint.substring(3);
      }
      
      // Reconstruct the base URL
      baseUrl = baseUrlParts.join('/');
      
      // Ensure baseUrl ends with a slash unless it's just a domain
      if (!baseUrl.endsWith('/') && baseUrlParts.length >= 3) {
        baseUrl += '/';
      }
    }
    
    // Add a leading slash to the endpoint if it doesn't have one and doesn't start with ../
    if (!processedEndpoint.startsWith('/') && !endpoint.includes('../')) {
      processedEndpoint = '/' + processedEndpoint;
    }
    
    const url = `${baseUrl}${processedEndpoint}`;
    console.log("url:", url);
    // Make the request with updated options
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle different response status codes
    if (response.status === 204) {
      // No content
      return { success: true };
    }

    // Check if response is JSON by examining the content type header
    const contentType = response.headers.get('content-type');
    let data;

    if (contentType && contentType.includes('application/json')) {
      // Parse JSON response
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('Error parsing JSON response:', parseError);
        // Attempt to get text and provide it as raw response
        const textResponse = await response.text();
        return {
          success: false,
          error: 'Invalid JSON response',
          statusCode: response.status,
          rawResponse: textResponse.substring(0, 1000), // Truncate large responses
        };
      }
    } else {
      // Handle non-JSON responses (HTML, text, etc.)
      try {
        const textResponse = await response.text();
        
        return {
          success: response.ok,
          statusCode: response.status,
          rawResponse: textResponse.substring(0, 1000), // Truncate large responses
          contentType: contentType || 'unknown',
          isTextResponse: true
        };
      } catch (textError) {
        console.error('Error reading response as text:', textError);
        return {
          success: false,
          error: 'Unable to read response',
          statusCode: response.status
        };
      }
    }
    
    // Handle error status codes for JSON responses
    if (!response.ok) {
      return {
        success: false,
        error: data?.message || `Error: ${response.status} ${response.statusText}`,
        statusCode: response.status,
        data,
      };
    }

    // Return success response
    return {
      success: true,
      data,
      statusCode: response.status,
    };
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    
    // Return standardized error response
    return {
      success: false,
      error: error.message || 'Network error occurred',
      isNetworkError: true,
    };
  }
};

/**
 * Helper function to set authentication data after login
 * 
 * @param {string} token - Authentication token
 * @param {Object} authData - Additional authentication data
 * @returns {Promise<void>}
 */
export const setAuthData = async (token, authData = {}) => {
  try {
    // Store token in AsyncStorage
    await AsyncStorage.setItem('authToken', token);
    
    // Store any additional auth data
    if (authData.userData) {
      await AsyncStorage.setItem('userData', JSON.stringify(authData.userData));
    }
  } catch (error) {
    console.error('Error setting auth data:', error);
  }
};

/**
 * Helper function to clear authentication on logout
 * 
 * @returns {Promise<void>}
 */
export const clearAuthData = async () => {
  try {
    // Remove all auth-related data from AsyncStorage
    const authKeys = ['authToken', 'userData'];
    
    // Use Promise.all to remove all items in parallel
    await Promise.all(authKeys.map(key => AsyncStorage.removeItem(key)));
    
    console.log('Successfully cleared authentication data');
  } catch (error) {
    console.error('Error clearing auth data:', error);
  }
};

/**
 * Check if the current authentication is valid and not expired
 * 
 * @returns {Promise<boolean>} - Whether the user is authenticated with a valid session
 */
export const isAuthValid = async () => {
  try {
    // Check if token exists
    const token = await AsyncStorage.getItem('authToken');
    console.log('Auth token:', token);
    if (!token) {
      return false;
    }
    // check if user data exists
    const userData = await AsyncStorage.getItem('userData');
    if (!userData) {
      return false;
    }
    console.log(`User data found: ${userData}`);
    // validate user data 
    const parsedUserData = JSON.parse(userData);
    console.log(`Parsed user data:`, parsedUserData);
    if (!parsedUserData.username || !parsedUserData.storecode) {
      return false;
    }
    const response = await loginUser(parsedUserData.username, parsedUserData.storecode);
    console.log('Auth validity check response:', response);
    if (!response.success) {
      console.error('Authentication check failed:', response.error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error checking auth validity:', error);
    return false;
  }
};

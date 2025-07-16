// Import dependencies
import { API_BASE_URL } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
        
        // Add token to headers directly instead of using cookies
        const sessionId = await AsyncStorage.getItem('sessionId');
        if (sessionId) {
          headers['Session-ID'] = sessionId;
        }
      } else {
        console.warn('Authentication required but no token found');
      }
    }

    // Construct full URL
    const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;

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

    // Parse response
    const data = await response.json();

    // Handle error status codes
    if (!response.ok) {
      return {
        success: false,
        error: data.message || `Error: ${response.status} ${response.statusText}`,
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
    
    // Store session ID if provided
    if (authData.sessionId) {
      await AsyncStorage.setItem('sessionId', authData.sessionId);
    }
    
    // Store expiry time if provided
    if (authData.expires) {
      await AsyncStorage.setItem('authExpiry', authData.expires.toString());
    } else {
      // Default expiry of 30 days
      const expiry = Date.now() + 30 * 24 * 60 * 60 * 1000;
      await AsyncStorage.setItem('authExpiry', expiry.toString());
    }
    
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
    const authKeys = ['authToken', 'sessionId', 'authExpiry', 'userData'];
    
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
    if (!token) {
      return false;
    }
    
    // Check if token has expired
    const expiryStr = await AsyncStorage.getItem('authExpiry');
    if (expiryStr) {
      const expiry = parseInt(expiryStr, 10);
      if (Date.now() > expiry) {
        // Token has expired, clear auth data
        await clearAuthData();
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error checking auth validity:', error);
    return false;
  }
};

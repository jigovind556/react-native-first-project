// API services for authentication
import { apiFetch, setAuthData, clearAuthData, isAuthValid } from '../utils/apiFetch';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const loginUser = async (username, password) => {
  try {
    const response = await apiFetch('/TaskUserValidation/UserValidation', {
      method: 'POST',
      body: JSON.stringify({
        username,
        storecode:password,
      }),
    }, false); // Auth not required for login
    console.log(response);
    
    if (response.success) {
      // Set auth data for future requests
      const result = response.data.result;
      console.log(result);
      
      if (!result || result.strOut === 'E') {
        return {
          success: false,
          error: 'Invalid username or password'
        };
      }
      
      // Get the authentication key from the response
      const authToken = response.data.key;
      
      if (!authToken) {
        return {
          success: false,
          error: 'Authentication token not received'
        };
      }
      
      // Store the auth data with user info and session
      await setAuthData(authToken, {
        userData: {
          username: result.username || username,
          storecode: result.storecode || password,
        },
      });
      
      return {
        success: true,
        data: {
          username: result.username || username,
        }
      };
    }
    else {
      return {
        success: false,
        error: response.error || 'Login failed. Please try again.'
      };
    }
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      error: error.message || 'Network error. Please try again.',
    };
  }
};

// Request OTP for password reset
export const requestOTP = async (email) => {
  try {
    const response = await apiFetch('request-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }, false); // Auth not required for requesting OTP
    
    return response;
  } catch (error) {
    console.error('OTP request error:', error);
    return {
      success: false,
      error: 'Failed to send OTP. Please try again.',
    };
  }
};

// Reset password with OTP
export const resetPassword = async (email, otp, newPassword) => {
  try {
    const response = await apiFetch('reset-password', {
      method: 'POST',
      body: JSON.stringify({
        email,
        otp,
        newPassword
      }),
    }, false); // Auth not required for password reset
    
    return response;
  } catch (error) {
    console.error('Password reset error:', error);
    return {
      success: false,
      error: 'Failed to reset password. Please try again.',
    };
  }
};

// Check user authentication status
export const checkAuthStatus = async () => {
  try {
    const isValid = await isAuthValid();
    
    if (isValid) {
      // Get user data
      const userDataStr = await AsyncStorage.getItem('userData');
      const userData = userDataStr ? JSON.parse(userDataStr) : null;
      
      return {
        isAuthenticated: true,
        userData
      };
    }
    
    return { isAuthenticated: false };
  } catch (error) {
    console.error('Auth check error:', error);
    return { isAuthenticated: false, error: error.message };
  }
};

// This section intentionally left blank as the logoutUser function is defined later in the file

// Register new user
export const registerUser = async (username, email, password) => {
  try {
    const response = await apiFetch('register', {
      method: 'POST',
      body: JSON.stringify({
        username,
        email,
        password,
      }),
    }, false); // Auth not required for registration
    
    if (response.success && response.data?.token) {
      // Set auth data for future requests
      await setAuthData(response.data.token, {
        userData: {
          username,
          email,
          // Add any other user data from response
        },
        sessionId: response.data.sessionId || `session-${Date.now()}`
      });
    }
    
    return response;
  } catch (error) {
    console.error('Registration error:', error);
    return {
      success: false,
      error: 'Failed to register. Please try again.',
    };
  }
};

// Logout user
export const logoutUser = async () => {
  try {
    // Try to call logout API if available
    try {
      await apiFetch('logout', {
        method: 'POST',
      });
    } catch (apiError) {
      // Silently handle API errors during logout
      console.warn('Logout API error:', apiError);
    }
    
    // Clear auth data regardless of API response
    await clearAuthData();
    
    return {
      success: true,
      message: 'Logged out successfully'
    };
  } catch (error) {
    console.error('Logout error:', error);
    
    // Still clear auth data on error
    await clearAuthData();
    
    return {
      success: false,
      error: 'Error occurred during logout, but you have been logged out locally.',
    };
  }
};

// API services for authentication
import { apiFetch, setAuthData, clearAuthData, isAuthValid } from '../utils/apiFetch';

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
    
    if (response.success ) {
      // Set auth data for future requests
      const result = response.data.result;
      console.log(result);
      if (!result || result.strOut === 'E') {
        throw new Error('Invalid username or password');
      }
      await setAuthData(response.data.key, {
        userData: {
          username: result.username,
          storecode: result.storecode,
          // Add any other user data from response
        },
        sessionId: response.data.sessionId || `session-${Date.now()}`,
      });
    }

    // Since we're using a dummy endpoint, let's simulate a response
    // In a real app, you'd parse the JSON from the actual response
    // return {
    //   success: true,
    //   data: {
    //     username: username,
    //     token: 'dummy-token-12345',
    //   }
    // };
    
    return response;
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      error: 'Network error. Please try again.',
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
    const response = await apiFetch('logout', {
      method: 'POST',
    });
    
    // Clear auth data regardless of response from server
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

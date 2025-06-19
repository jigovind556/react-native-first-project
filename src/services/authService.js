// API services for authentication
export const loginUser = async (username, password) => {
  try {
    // In a real app, this would be your actual API endpoint
    const response = await fetch('https://example.com/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        password,
      }),
    });
    
    // Since we're using a dummy endpoint, let's simulate a response
    // In a real app, you'd parse the JSON from the actual response
    return {
      success: true,
      data: {
        username: username,
        token: 'dummy-token-12345',
      }
    };
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
    // In a real app, this would be your actual API endpoint
    const response = await fetch('https://example.com/api/request-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });
    
    // Simulate a response
    return {
      success: true,
      message: 'OTP sent to your email'
    };
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
    // In a real app, this would be your actual API endpoint
    const response = await fetch('https://example.com/api/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        otp,
        newPassword
      }),
    });
    
    // Simulate a response
    return {
      success: true,
      message: 'Password reset successful'
    };
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
    // In a real app, this would be your actual API endpoint
    const response = await fetch('https://example.com/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        email,
        password,
      }),
    });
    
    // Simulate a response
    return {
      success: true,
      data: {
        username: username,
        email: email,
        token: 'dummy-token-register-12345',
      }
    };
  } catch (error) {
    console.error('Registration error:', error);
    return {
      success: false,
      error: 'Failed to register. Please try again.',
    };
  }
};

# API Utility Documentation

## Overview

This project includes an industry-grade fetch utility for making API requests. The utility handles authentication cookies automatically and fetches data from endpoints configured in the environment variables.

## Environment Configuration

The API base URL is stored in a `.env` file at the root of the project:

```
API_BASE_URL=https://example.com/api
```

## Core API Utility Functions

### apiFetch

The main utility function for making API requests is `apiFetch` located in `src/utils/apiFetch.js`. This function handles authentication, error handling, and standardized response formats.

```javascript
import { apiFetch } from '../utils/apiFetch';

// Example usage
const response = await apiFetch('endpoint', {
  method: 'POST',
  body: JSON.stringify(data),
}, requiresAuth);
```

Parameters:
- `endpoint`: The API endpoint (without base URL)
- `options`: Fetch options (method, body, headers, etc.)
- `requiresAuth`: Whether the request requires authentication (default: true)

Returns:
- A standardized response object with `success`, `data`, and possible `error` fields

### Authentication Helpers

The utility provides additional functions for managing authentication:

- `setAuthCookies(token, cookieData)`: Sets authentication cookies after login
- `clearAuthCookies()`: Clears authentication on logout

## Usage in Service Functions

All API service functions in the application use this utility. For example, in `authService.js`:

```javascript
import { apiFetch, setAuthCookies, clearAuthCookies } from '../utils/apiFetch';

export const loginUser = async (username, password) => {
  const response = await apiFetch('login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  }, false);
  
  if (response.success && response.data?.token) {
    await setAuthCookies(response.data.token);
  }
  
  return response;
};
```

## Adding New Service Functions

When creating new service functions that make API requests, import and use the `apiFetch` utility:

```javascript
import { apiFetch } from '../utils/apiFetch';

export const myNewFunction = async (data) => {
  try {
    const response = await apiFetch('my-endpoint', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    return response;
  } catch (error) {
    console.error('Error:', error);
    return {
      success: false,
      error: 'An error occurred. Please try again.',
    };
  }
};
```

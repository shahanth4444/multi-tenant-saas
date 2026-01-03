/**
 * API Client Configuration
 * 
 * Configures Axios instance for making HTTP requests to the backend API.
 * Includes request/response interceptors for authentication and error handling.
 * 
 * @module api
 */

import axios from 'axios'

/**
 * Axios Instance
 * 
 * Pre-configured Axios instance with base URL and interceptors.
 * Automatically attaches JWT token to requests and handles 401 errors.
 */
const api = axios.create({ baseURL: __API__ })

/**
 * Request Interceptor
 * 
 * Automatically attaches JWT token from localStorage to all requests.
 * Token is added to Authorization header as Bearer token.
 */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

/**
 * Response Interceptor
 * 
 * Handles authentication errors globally.
 * Redirects to login page and clears token on 401 Unauthorized responses.
 */
api.interceptors.response.use(
  (r) => r,
  (err) => {
    // Handle authentication failures
    if (err.response && err.response.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api

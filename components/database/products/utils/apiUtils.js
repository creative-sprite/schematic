// components\database\products\utils\apiUtils.js

/**
 * Generic fetch wrapper with error handling and JSON parsing
 * @param {string} url - The URL to fetch
 * @param {Object} options - Fetch options
 * @returns {Promise<any>} Parsed response data
 */
export const fetchWithErrorHandling = async (url, options = {}) => {
    try {
      const res = await fetch(url, options);
      
      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}: ${res.statusText}`);
      }
      
      // Try to parse as JSON
      try {
        const text = await res.text();
        return text ? JSON.parse(text) : {};
      } catch (parseError) {
        throw new Error(`Failed to parse response: ${parseError.message}`);
      }
    } catch (error) {
      console.error(`Fetch error for ${url}:`, error);
      throw error;
    }
  };
  
  /**
   * Create standardized response object for success cases
   * @param {any} data - The data to include in the response
   * @param {number} status - HTTP status code
   * @returns {Object} Standardized response object
   */
  export const createSuccessResponse = (data, status = 200) => {
    return {
      status,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, data })
    };
  };
  
  /**
   * Create standardized response object for error cases
   * @param {string} message - Error message
   * @param {number} status - HTTP status code
   * @returns {Object} Standardized error response object
   */
  export const createErrorResponse = (message, status = 500) => {
    return {
      status,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, message })
    };
  };
  
  /**
   * Format errors from Mongoose/MongoDB for consistent client responses
   * @param {Error} error - The error object
   * @returns {string} Formatted error message
   */
  export const formatDatabaseError = (error) => {
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.keys(error.errors).map(key => 
        error.errors[key].message
      );
      return `Validation error: ${errors.join(', ')}`;
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return `Duplicate value for ${field}. This value already exists.`;
    }
    
    // Handle cast errors (invalid ID format, etc.)
    if (error.name === 'CastError') {
      return `Invalid ${error.path}: ${error.value}`;
    }
    
    // Default error message
    return error.message || 'An unknown database error occurred';
  };
  
  /**
   * Helper to safely parse request body as JSON
   * @param {Request} request - The request object
   * @returns {Promise<Object>} Parsed request body
   */
  export const parseRequestBody = async (request) => {
    try {
      return await request.json();
    } catch (error) {
      throw new Error('Invalid request body: Could not parse as JSON');
    }
  };
  
  /**
   * Extract ID from query parameters
   * @param {URL} url - The request URL
   * @param {string} paramName - The parameter name to extract
   * @returns {string|null} The extracted ID or null if not found
   */
  export const getIdFromQuery = (url, paramName = 'id') => {
    const params = new URLSearchParams(url.search);
    return params.get(paramName);
  };
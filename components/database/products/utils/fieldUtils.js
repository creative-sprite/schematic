// components\database\products\utils\fieldUtils.js

/**
 * Format field label with prefix and suffix for display
 * @param {Object} field - The field object
 * @returns {string} Formatted field label
 */
export const getFormattedFieldLabel = (field) => {
    if (!field) return '';
    
    if (field.fieldType === 'number' && (field.prefix || field.suffix)) {
      return `${field.prefix ? field.prefix + ' ' : ''}${field.label}${field.suffix ? ' ' + field.suffix : ''}`;
    }
    
    return field.label || '';
  };
  
  /**
   * Format field value for display based on field type
   * @param {Object} field - The field object
   * @param {any} value - The field value
   * @returns {string} Formatted field value
   */
  export const getFormattedFieldValue = (field, value) => {
    if (!field) return '';
    
    // Handle empty values
    if (value === undefined || value === null || value === '') {
      return '';
    }
    
    // Handle number fields
    if (field.fieldType === 'number') {
      return `${field.prefix || ''}${value}${field.suffix || ''}`;
    }
    
    // Handle array values (checkboxes, multiselect)
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    
    // Default to string conversion
    return String(value);
  };
  
  /**
   * Validate field value based on field type
   * @param {Object} field - The field object
   * @param {any} value - The value to validate
   * @returns {boolean} Whether the value is valid
   */
  export const isValidFieldValue = (field, value) => {
    if (!field) return false;
    
    // Text fields should be strings
    if (field.fieldType === 'text' || field.fieldType === 'url') {
      return typeof value === 'string';
    }
    
    // Number fields should be numbers or numeric strings
    if (field.fieldType === 'number') {
      return !isNaN(parseFloat(value)) && isFinite(value);
    }
    
    // Date fields should be valid dates
    if (field.fieldType === 'date') {
      return !isNaN(Date.parse(value));
    }
    
    // Dropdown/select should match one of the options
    if (field.fieldType === 'dropdown' || field.fieldType === 'radio' || field.fieldType === 'select') {
      return field.options?.includes(value);
    }
    
    // Checkbox and multiselect should be arrays with valid options
    if (field.fieldType === 'checkbox' || field.fieldType === 'multiselect') {
      return Array.isArray(value) && 
        (field.fieldType !== 'checkbox' || value.every(item => field.options?.includes(item)));
    }
    
    // Default fallback
    return true;
  };
  
  /**
   * Get default value for a field based on its type
   * @param {Object} field - The field object
   * @returns {any} Default value for the field
   */
  export const getDefaultFieldValue = (field) => {
    if (!field) return '';
    
    // Multi-select fields use arrays
    if (field.fieldType === 'checkbox' || field.fieldType === 'multiselect') {
      return [];
    }
    
    // Default to empty string
    return '';
  };
  
  /**
   * Ensure a field object has all required properties
   * @param {Object} field - The field object to normalize
   * @returns {Object} Normalized field object
   */
  export const normalizeField = (field) => {
    if (!field) return null;
    
    // Create a copy to avoid mutating the original
    const normalized = { ...field };
    
    // Ensure ID is present (use _id if available)
    normalized.id = field.id || field._id || `field-${Date.now()}`;
    
    // Set default field type if missing
    normalized.fieldType = field.fieldType || 'text';
    
    // Ensure options array for fields that need it
    if (['dropdown', 'radio', 'checkbox', 'select'].includes(normalized.fieldType)) {
      normalized.options = Array.isArray(field.options) ? [...field.options] : [];
    }
    
    // Add prefix/suffix for number fields if missing
    if (normalized.fieldType === 'number') {
      normalized.prefix = field.prefix || '';
      normalized.suffix = field.suffix || '';
    }
    
    return normalized;
  };
  
  /**
   * Convert form field definitions to product custom data format
   * @param {Object} values - Object containing field values
   * @param {Array} fields - Array of field definitions
   * @returns {Array} Array of custom data objects
   */
  export const createCustomData = (values, fields) => {
    if (!values || !fields) return [];
    
    const customData = [];
    const coreFields = ['Category', 'Name', 'Type', 'Suppliers'];
    
    Object.entries(values).forEach(([key, value]) => {
      // Skip core fields
      if (coreFields.includes(key)) return;
      
      // Find the field definition
      const field = fields.find(f => f.label === key);
      if (field) {
        customData.push({
          fieldId: field._id || field.id,
          value: value
        });
      }
    });
    
    return customData;
  };
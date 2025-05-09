// components\database\products\hooks\useCustomFields.js

import { useState, useEffect, useCallback } from "react";

/**
 * Custom hook for fetching and managing custom fields
 */
export const useCustomFields = () => {
  // State management
  const [customFields, setCustomFields] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch all custom fields from the API
   */
  const fetchCustomFields = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await fetch("/api/database/products/customFields");
      
      if (!res.ok) {
        throw new Error(`Error fetching custom fields: ${res.statusText}`);
      }
      
      const data = await res.json();
      
      if (data.success) {
        // Format fields to ensure they have proper IDs
        const formattedFields = data.data.map(field => ({
          ...field,
          id: field._id || field.id,
          order: field.order || 0 // Ensure order is defined
        }));
        
        // Sort fields by order
        const sortedFields = formattedFields.sort((a, b) => (a.order || 0) - (b.order || 0));
        
        setCustomFields(sortedFields);
      } else {
        throw new Error(data.message || "Failed to fetch custom fields");
      }
    } catch (err) {
      console.error("Error in fetchCustomFields:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Create or update a custom field
   * @param {Object} fieldData - Custom field data to create/update
   * @returns {Promise<Object>} Created/Updated field data
   */
  const createCustomField = async (fieldData) => {
    try {
      console.log("DEBUG: Entire Field Data", JSON.stringify(fieldData, null, 2));
      
      setLoading(true);
      setError(null);
      
      // Validate required fields
      if (!fieldData.label || !fieldData.fieldType) {
        throw new Error("Label and field type are required");
      }
      
      // For field types that require options, validate they exist
      if (
        ["dropdown", "radio", "checkbox", "select"].includes(fieldData.fieldType) &&
        (!fieldData.options || fieldData.options.length === 0)
      ) {
        throw new Error(`Options are required for ${fieldData.fieldType} field type`);
      }

      // Determine if this is an update or create
      const isUpdate = !!fieldData._id;
      
      // Prepare the fetch options - KEEP THE ENTIRE PAYLOAD
      const fetchOptions = {
        method: isUpdate ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fieldData),
      };

      // Set the correct URL for update or create
      const url = isUpdate 
        ? `/api/database/products/customFields?id=${fieldData._id}` 
        : "/api/database/products/customFields";
      
      const res = await fetch(url, fetchOptions);
      
      // Capture the full response text
      const responseText = await res.text();
      console.log("DEBUG: Full Server Response", responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Failed to parse response:", parseError);
        throw new Error("Invalid server response: " + responseText);
      }
      
      if (!res.ok) {
        throw new Error(`Error ${isUpdate ? 'updating' : 'creating'} custom field: ${data.message || res.statusText}`);
      }
      
      if (data.success) {
        // Update the fields in state
        setCustomFields(prev => {
          // If updating an existing field
          if (isUpdate) {
            return prev.map(field => 
              field._id === data.data._id ? { ...data.data, id: data.data._id } : field
            );
          }
          
          // If creating a new field
          return [...prev, { ...data.data, id: data.data._id }];
        });
        
        return data.data;
      } else {
        throw new Error(data.message || `Failed to ${isUpdate ? 'update' : 'create'} custom field`);
      }
    } catch (err) {
      console.error("Error in createCustomField:", err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Fetch custom fields on initial load
  useEffect(() => {
    fetchCustomFields();
  }, [fetchCustomFields]);

  return {
    customFields,
    loading,
    error,
    refreshCustomFields: fetchCustomFields,
    createCustomField,
  };
};
// components\database\products\hooks\useForms.js
import { useState, useEffect, useCallback } from "react";

/**
 * Custom hook for fetching and managing forms
 */
export const useForms = () => {
  // State management
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch all forms from the API
   */
  const fetchForms = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await fetch("/api/database/products/forms");
      
      if (!res.ok) {
        throw new Error(`Error fetching forms: ${res.statusText}`);
      }
      
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      
      if (data.success) {
        setForms(data.data);
      } else {
        throw new Error(data.message || "Failed to fetch forms");
      }
    } catch (err) {
      console.error("Error in fetchForms:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Create a new form
   * @param {Object} formData - Form data to create
   * @returns {Promise<Object>} Created form data
   */
  const createForm = async (formData) => {
    try {
      setLoading(true);
      setError(null);
      
      // Validate required fields
      if (!formData.category || !formData.name || !formData.type) {
        throw new Error("Category, name and type are required");
      }
      
      const res = await fetch("/api/database/products/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      
      if (!res.ok) {
        throw new Error(`Error creating form: ${res.statusText}`);
      }
      
      const data = await res.json();
      
      if (data.success) {
        // Add the new form to the state
        setForms(prev => [...prev, data.data]);
        return data.data;
      } else {
        throw new Error(data.message || "Failed to create form");
      }
    } catch (err) {
      console.error("Error in createForm:", err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update an existing form
   * @param {string} formId - ID of the form to update
   * @param {Object} formData - Updated form data
   * @returns {Promise<Object>} Updated form data
   */
  const updateForm = async (formId, formData) => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await fetch(`/api/database/products/forms?id=${formId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      
      if (!res.ok) {
        throw new Error(`Error updating form: ${res.statusText}`);
      }
      
      const data = await res.json();
      
      if (data.success) {
        // Update the form in the state
        setForms(prev => prev.map(form => 
          form._id === formId ? data.data : form
        ));
        return data.data;
      } else {
        throw new Error(data.message || "Failed to update form");
      }
    } catch (err) {
      console.error("Error in updateForm:", err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Delete a form by ID
   * @param {string} formId - ID of the form to delete
   * @returns {Promise<boolean>} Success status
   */
  const deleteForm = async (formId) => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await fetch(`/api/database/products/forms?id=${formId}`, {
        method: "DELETE",
      });
      
      if (!res.ok) {
        throw new Error(`Error deleting form: ${res.statusText}`);
      }
      
      const data = await res.json();
      
      if (data.success) {
        // Remove the deleted form from state
        setForms(prev => prev.filter(form => form._id !== formId));
        return true;
      } else {
        throw new Error(data.message || "Failed to delete form");
      }
    } catch (err) {
      console.error("Error in deleteForm:", err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Fetch forms on initial load
  useEffect(() => {
    fetchForms();
  }, [fetchForms]);

  return {
    forms,
    loading,
    error,
    refreshForms: fetchForms,
    createForm,
    updateForm,
    deleteForm
  };
};
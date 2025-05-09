// components\database\products\hooks\useSuppliers.js

import { useState, useEffect, useCallback } from "react";

/**
 * Custom hook for fetching and managing suppliers
 */
export const useSuppliers = () => {
  // State management
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch all suppliers from the API
   */
  const fetchSuppliers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await fetch("/api/database/suppliers");
      
      if (!res.ok) {
        throw new Error(`Error fetching suppliers: ${res.statusText}`);
      }
      
      const data = await res.json();
      
      if (data.success) {
        // Format suppliers for easier use in components
        const formattedSuppliers = data.data.map(supplier => ({
          _id: supplier._id,
          id: supplier._id, // Add consistent id field
          name: supplier.supplierName,
          label: supplier.supplierName, // For PrimeReact components
          value: supplier._id, // For PrimeReact components
          original: supplier // Keep original data
        }));
        
        setSuppliers(formattedSuppliers);
      } else {
        throw new Error(data.message || "Failed to fetch suppliers");
      }
    } catch (err) {
      console.error("Error in fetchSuppliers:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get a supplier by ID
   * @param {string} supplierId - ID of the supplier to get
   * @returns {Object|null} Supplier data or null if not found
   */
  const getSupplierById = (supplierId) => {
    return suppliers.find(supplier => 
      supplier._id === supplierId || supplier.id === supplierId
    ) || null;
  };

  /**
   * Get supplier names by IDs
   * @param {Array<string>} supplierIds - Array of supplier IDs
   * @returns {Array<Object>} Array of supplier objects with id and name
   */
  const getSuppliersByIds = (supplierIds) => {
    if (!supplierIds || !Array.isArray(supplierIds) || supplierIds.length === 0) {
      return [];
    }
    
    return suppliers.filter(supplier => 
      supplierIds.includes(supplier._id) || supplierIds.includes(supplier.id)
    ).map(supplier => ({
      id: supplier._id,
      name: supplier.name
    }));
  };

  // Fetch suppliers on initial load
  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  return {
    suppliers,
    loading,
    error,
    refreshSuppliers: fetchSuppliers,
    getSupplierById,
    getSuppliersByIds
  };
};
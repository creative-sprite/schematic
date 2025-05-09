// components\database\products\hooks\useProducts.js

import { useState, useEffect, useCallback } from "react";

/**
 * Custom hook for fetching and managing products
 */
export const useProducts = () => {
  // State management
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch all products from the API
   */
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await fetch("/api/database/products");
      
      if (!res.ok) {
        throw new Error(`Error fetching products: ${res.statusText}`);
      }
      
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      
      if (data.success) {
        setProducts(data.data);
      } else {
        throw new Error(data.message || "Failed to fetch products");
      }
    } catch (err) {
      console.error("Error in fetchProducts:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Create a new product
   * @param {Object} productData - Product data to create
   * @returns {Promise<Object>} Created product data
   */
  const createProduct = async (productData) => {
    try {
      setLoading(true);
      setError(null);
      
      // Validate required fields
      if (!productData.category || !productData.name || !productData.type || !productData.form) {
        throw new Error("Category, name, type and form are required");
      }
      
      const res = await fetch("/api/database/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
      });
      
      if (!res.ok) {
        throw new Error(`Error creating product: ${res.statusText}`);
      }
      
      const data = await res.json();
      
      if (data.success) {
        // Add the new product to the state
        setProducts(prev => [...prev, data.data]);
        return data.data;
      } else {
        throw new Error(data.message || "Failed to create product");
      }
    } catch (err) {
      console.error("Error in createProduct:", err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update an existing product
   * @param {string} productId - ID of the product to update
   * @param {Object} productData - Updated product data
   * @returns {Promise<Object>} Updated product data
   */
  const updateProduct = async (productId, productData) => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await fetch(`/api/database/products?id=${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
      });
      
      if (!res.ok) {
        throw new Error(`Error updating product: ${res.statusText}`);
      }
      
      const data = await res.json();
      
      if (data.success) {
        // Update the product in the state
        setProducts(prev => prev.map(product => 
          product._id === productId ? data.data : product
        ));
        return data.data;
      } else {
        throw new Error(data.message || "Failed to update product");
      }
    } catch (err) {
      console.error("Error in updateProduct:", err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Delete a product by ID
   * @param {string} productId - ID of the product to delete
   * @returns {Promise<boolean>} Success status
   */
  const deleteProduct = async (productId) => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await fetch(`/api/database/products?id=${productId}`, {
        method: "DELETE",
      });
      
      if (!res.ok) {
        throw new Error(`Error deleting product: ${res.statusText}`);
      }
      
      const data = await res.json();
      
      if (data.success) {
        // Remove the deleted product from state
        setProducts(prev => prev.filter(product => product._id !== productId));
        return true;
      } else {
        throw new Error(data.message || "Failed to delete product");
      }
    } catch (err) {
      console.error("Error in deleteProduct:", err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Fetch products on initial load
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    loading,
    error,
    refreshProducts: fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct
  };
};
// lib/ventCalculations.js

/**
 * Calculate ventilation price based on length tiers
 * 
 * @param {Object} item - The ventilation or grease extract item with prices
 * @param {Object} dimensions - The dimensions object (length, width, height)
 * @param {Object} options - Additional calculation options
 * @returns {number} - The calculated price
 */
export function calculateVentPrice(item, dimensions = {}, options = {}) {
    // Ensure we have the required data
    if (!item || !item.prices) {
      return 0;
    }
  
    // Extract the length, ensuring it's a number
    let length = Number(dimensions.length) || 0;
    
    // If length is between 0 and 1, treat it as 1 (minimum value)
    if (length > 0 && length < 1) {
      length = 1;
    }
    
    // If no length provided, return 0
    if (length <= 0) {
      return 0;
    }
  
    // Determine the category based on item name/category
    const isGreaseExtract = isGreaseExtractItem(item);
    
    // Calculate price based on item type
    if (isGreaseExtract) {
      return calculateGreaseExtractPrice(item, length);
    } else {
      return calculateAirIntakeExtractPrice(item, length);
    }
  }
  
  /**
   * Check if an item is a grease extract item
   */
  function isGreaseExtractItem(item) {
    if (!item) return false;
    
    // Check category
    if (item.category && item.category.toLowerCase().includes('grease')) {
      return true;
    }
    
    // Check subcategory
    if (item.subcategory && item.subcategory.toLowerCase().includes('grease')) {
      return true;
    }
    
    // Check item name
    if ((item.name && item.name.toLowerCase().includes('grease')) || 
        (item.item && item.item.toLowerCase().includes('grease'))) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Calculate price for air intake/extract items
   * 
   * For air intake/extract:
   * - 0-4 length: Price A
   * - > 4 length: First 4 units at Price A, remaining at Price B
   */
  function calculateAirIntakeExtractPrice(item, length) {
    // Get the prices (grades A and B)
    const priceA = Number(item.prices.A) || 0;
    const priceB = Number(item.prices.B) || 0;
    
    let totalPrice = 0;
    
    if (length <= 4) {
      // Simple calculation for length 0-4
      totalPrice = length * priceA;
    } else {
      // Tiered calculation for length > 4
      // First 4 units at Price A
      totalPrice = 4 * priceA;
      
      // Remaining units at Price B
      totalPrice += (length - 4) * priceB;
    }
    
    return totalPrice;
  }
  
  /**
   * Calculate price for grease extract items
   * 
   * For grease extract:
   * - 1-4 length: Price A
   * - 5-20 length: Price B
   * - > 20 length: Price C
   */
  function calculateGreaseExtractPrice(item, length) {
    // Get the prices (grades A, B, and C)
    const priceA = Number(item.prices.A) || 0;
    const priceB = Number(item.prices.B) || 0;
    const priceC = Number(item.prices.C) || 0;
    
    let totalPrice = 0;
    
    if (length <= 4) {
      // Length 1-4: Use Price A
      totalPrice = length * priceA;
    } else if (length <= 20) {
      // Length 5-20: First 4 at Price A, remaining at Price B
      totalPrice = 4 * priceA;
      totalPrice += (length - 4) * priceB;
    } else {
      // Length > 20: First 4 at Price A, next 16 at Price B, remaining at Price C
      totalPrice = 4 * priceA;
      totalPrice += 16 * priceB;
      totalPrice += (length - 20) * priceC;
    }
    
    return totalPrice;
  }
  
  /**
   * Main export for calculating ventilation and grease extract prices
   * 
   * @param {Object} item - The item with prices and category/name info
   * @param {Object} dimensions - The dimensions object (length, width, height)
   * @returns {number} - The calculated price
   */
  export function calculateVentilationPrice(item, dimensions) {
    return calculateVentPrice(item, dimensions);
  }
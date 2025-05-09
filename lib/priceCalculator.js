// lib\priceCalculator.js

/**
 * Calculate price for an item based on its pricing formula and dimensions.
 * 
 * @param {Object} item - The item to calculate price for (with prices, calculationType)
 * @param {Object} dims - The dimensions of the item (length, width, height)
 * @returns {number} The calculated price
 */
export function calculateItemPrice(item, dims = {}) {
  if (!item) return 0;
  
  // If item has a direct price field, use that
  if (item.price !== undefined && item.price !== null) {
      return Number(item.price);
  }
  
  // Look for price in customData
  if (item.customData && Array.isArray(item.customData)) {
      const priceField = item.customData.find(
          field => field.fieldName && field.fieldName.toLowerCase() === "price"
      );
      
      if (priceField && priceField.value !== undefined && priceField.value !== null) {
          return Number(priceField.value);
      }
  }
  
  // If item has prices object (legacy approach)
  if (item.prices) {
      // If the item has a specific calculation type, use formula-based calculation
      if (item.calculationType) {
          return calculatePriceByFormula(item, dims);
      }
      
      // Otherwise, get the default price for the item
      if (item.prices.default !== undefined) {
          return Number(item.prices.default);
      }
      
      // If no default price, use the first available price
      const firstPrice = Object.values(item.prices)[0];
      if (firstPrice !== undefined) {
          return Number(firstPrice);
      }
  }
  
  // Return 0 if no price could be determined
  return 0;
}

/**
* Calculate ventilation product price
* 
* @param {Object} product - The ventilation product
* @param {number} quantity - The quantity of the product
* @returns {number} The calculated price (price × quantity)
*/
export function calculateVentilationPrice(product, quantity = 1) {
  if (!product) return 0;
  
  let price = 0;
  
  // Try to get price from direct field
  if (product.price !== undefined && product.price !== null) {
      price = Number(product.price);
  } 
  // Try to get price from extractedPrice field (from API)
  else if (product.extractedPrice !== undefined && product.extractedPrice !== null) {
      price = Number(product.extractedPrice);
  }
  // Otherwise, look in customData
  else if (product.customData && Array.isArray(product.customData)) {
      const priceField = product.customData.find(
          field => field.fieldName && field.fieldName.toLowerCase() === "price"
      );
      
      if (priceField && priceField.value !== undefined && priceField.value !== null) {
          price = Number(priceField.value);
      }
  }
  
  // Apply quantity multiplier and return
  return price * quantity;
}

/**
* Calculate price based on formula and dimensions
* 
* @param {Object} item - The item with calculationType and prices
* @param {Object} dims - The dimensions (length, width, height)
* @returns {number} The calculated price
*/
function calculatePriceByFormula(item, dims = {}) {
  if (!item || !item.calculationType) return 0;
  
  const { length = 0, width = 0, height = 0 } = dims;
  const basePrice = item.prices.default || Object.values(item.prices)[0] || 0;
  
  switch (item.calculationType.toLowerCase()) {
      case 'area':
          // Calculate based on length × width (area)
          if (length > 0 && width > 0) {
              const area = length * width;
              return area * Number(basePrice);
          }
          break;
      
      case 'volume':
          // Calculate based on length × width × height (volume)
          if (length > 0 && width > 0 && height > 0) {
              const volume = length * width * height;
              return volume * Number(basePrice);
          }
          break;
          
      case 'linear':
          // Calculate based on length only
          if (length > 0) {
              return length * Number(basePrice);
          }
          break;
          
      case 'fixed':
      default:
          // Fixed price regardless of dimensions
          return Number(basePrice);
  }
  
  // If we couldn't calculate based on the formula (missing dimensions),
  // just return the base price
  return Number(basePrice);
}

/**
* Calculate the total price for a collection of ventilation products
* 
* @param {Array} selections - Array of {product, quantity} objects
* @returns {number} The total price
*/
export function calculateTotalVentilationPrice(selections = []) {
  if (!Array.isArray(selections) || selections.length === 0) {
      return 0;
  }
  
  return selections.reduce((total, selection) => {
      const itemPrice = selection.price || 0;
      const quantity = selection.quantity || 0;
      return total + (itemPrice * quantity);
  }, 0);
}
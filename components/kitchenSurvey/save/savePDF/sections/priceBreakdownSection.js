// components/kitchenSurvey/save/savePDF/sections/priceBreakdownSection.js
import { formatCurrency } from '../templateUtils';

/**
 * Helper to get a unique name for each structure entry
 */
const getStructureEntryName = (entry, index) => {
  if (entry.selectionData && entry.selectionData.length > 0) {
    const typeNames = entry.selectionData
      .map((item) => item.type)
      .filter((type) => type && type !== "")
      .join(", ");
    return typeNames || `Structure ${index + 1}`;
  }
  return `Structure ${index + 1}`;
};

/**
 * Calculate structure price for a single entry
 */
const calculateStructureEntryPrice = (entry, structureItems = []) => {
  if (!entry || !entry.selectionData || !Array.isArray(structureItems) || structureItems.length === 0) {
    return 0;
  }

  // Calculate type temp (sum of prices for ceiling, wall, floor)
  const typeTemp = entry.selectionData.reduce((acc, row) => {
    let price = 0;
    if (row.item && row.grade) {
      const found = structureItems.find(
        (itm) => itm.subcategory === row.type && itm.item === row.item
      );
      if (found && found.prices && found.prices[row.grade] != null) {
        price = Number(found.prices[row.grade]);
      }
    }
    return acc + price;
  }, 0);

  // Calculate size temp (product of dimensions)
  const dimensionsLength = entry.dimensions?.length || 1;
  const dimensionsWidth = entry.dimensions?.width || 1;
  const dimensionsHeight = entry.dimensions?.height || 1;
  const sizeTemp = dimensionsLength * dimensionsWidth * dimensionsHeight;

  // Total for this entry is type temp * size temp
  return typeTemp * sizeTemp;
};

/**
 * Calculate specialist equipment total
 */
const calculateSpecialistTotal = (specialistEquipmentData = []) => {
  return specialistEquipmentData.reduce((total, item) => {
    let itemPrice = 0;
    
    // Check for direct price property
    if (item.price !== undefined && item.price !== null) {
      itemPrice = Number(item.price);
    }
    // Check for price in customData
    else if (item.customData && Array.isArray(item.customData)) {
      const priceField = item.customData.find(
        field => field.fieldName && field.fieldName.toLowerCase() === "price"
      );
      
      if (priceField && priceField.value !== undefined && priceField.value !== null) {
        itemPrice = Number(priceField.value);
      }
    }
    
    const quantity = Number(item.number) || 1;
    return total + (itemPrice * quantity);
  }, 0);
};

/**
 * Ensure numeric values
 */
const ensureNumeric = (value) => {
  if (typeof value === "undefined" || value === null) return 0;
  if (typeof value === "object" && value !== null) return value.overall || 0;
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

/**
 * Generates the price breakdown section of the PDF
 * @param {Object} data - Survey data
 * @returns {String} HTML for the price breakdown section
 */
export const generatePriceBreakdownSection = (data) => {
  const {
    structureTotal = 0,
    surveyData: equipmentEntries = [],
    canopyTotal = 0,
    accessDoorPrice = 0,
    ventilationPrice = 0,
    airPrice = 0,
    fanPartsPrice = 0,
    airInExTotal = 0,
    schematicItemsTotal = 0,
    greaseTotal = 0,
    specialistEquipmentData = [],
    parkingCost = 0,
    postServiceReport = "No",
    postServiceReportPrice = 0,
    modify = 0,
    structureEntries = [],
    structureItems = [],
    equipmentItems = []
  } = data || {};

  // Calculate modification factor
  const factor = 1 + (modify / 100);

  // Calculate equipment total
  const equipmentTotal = (equipmentEntries || []).reduce((sum, entry) => {
    const match = equipmentItems.find(
      (itm) =>
        itm.subcategory?.trim().toLowerCase() === entry.subcategory?.trim().toLowerCase() &&
        itm.item?.trim().toLowerCase() === entry.item?.trim().toLowerCase()
    );
    if (match && match.prices && match.prices[entry.grade] != null) {
      const price = Number(match.prices[entry.grade]);
      const qty = Number(entry.number) || 0;
      return sum + price * qty;
    }
    return sum;
  }, 0);

  // Calculate specialist equipment total
  const specialistTotal = calculateSpecialistTotal(specialistEquipmentData);

  // Build price breakdown items
  const priceItems = [];

  // Structure section - handle multiple entries
  if (Array.isArray(structureEntries) && structureEntries.length > 0 && Array.isArray(structureItems) && structureItems.length > 0) {
    structureEntries.forEach((entry, index) => {
      const entryPrice = calculateStructureEntryPrice(entry, structureItems);
      if (entryPrice > 0) {
        priceItems.push({
          label: getStructureEntryName(entry, index),
          value: entryPrice * factor
        });
      }
    });
  } else if (structureTotal > 0) {
    priceItems.push({
      label: "Structure Total",
      value: structureTotal * factor
    });
  }

  // Equipment
  if (equipmentTotal > 0) {
    priceItems.push({
      label: "Equipment",
      value: equipmentTotal * factor
    });
  }

  // Canopy
  if (canopyTotal > 0) {
    priceItems.push({
      label: "Canopy",
      value: canopyTotal * factor
    });
  }

  // Access Door
  if (accessDoorPrice > 0) {
    priceItems.push({
      label: "Access Door",
      value: accessDoorPrice * factor
    });
  }

  // Ventilation (combine ventilationPrice and fanPartsPrice)
  const totalVentilation = ensureNumeric(ventilationPrice) + ensureNumeric(fanPartsPrice);
  if (totalVentilation > 0) {
    priceItems.push({
      label: "Ventilation",
      value: totalVentilation * factor
    });
  }

  // Air Systems (combine airPrice and airInExTotal)
  const totalAir = ensureNumeric(airPrice) + ensureNumeric(airInExTotal);
  if (totalAir > 0) {
    priceItems.push({
      label: "Air Systems",
      value: totalAir * factor
    });
  }

  // Schematic Items - handle both object and number formats
  if (typeof schematicItemsTotal === "object" && schematicItemsTotal !== null) {
    if (schematicItemsTotal.breakdown && Object.keys(schematicItemsTotal.breakdown).length > 0) {
      // Show breakdown by category
      Object.entries(schematicItemsTotal.breakdown).forEach(([category, categoryTotal]) => {
        if (Number(categoryTotal) > 0) {
          priceItems.push({
            label: category,
            value: Number(categoryTotal) * factor
          });
        }
      });
    } else if (Number(schematicItemsTotal.overall) > 0) {
      priceItems.push({
        label: "Schematic Items",
        value: Number(schematicItemsTotal.overall) * factor
      });
    }
  } else if (Number(schematicItemsTotal) > 0) {
    priceItems.push({
      label: "Schematic Items",
      value: Number(schematicItemsTotal) * factor
    });
  }

  // Grease
  if (greaseTotal > 0) {
    priceItems.push({
      label: "Grease",
      value: greaseTotal * factor
    });
  }

  // Specialist Equipment
  if (specialistTotal > 0) {
    priceItems.push({
      label: "Specialist Equipment",
      value: specialistTotal * factor
    });
  }

  // Parking Cost
  if (parkingCost > 0) {
    priceItems.push({
      label: "Parking Cost",
      value: parkingCost * factor
    });
  }

  // Post-Service Report
  if (postServiceReport === "Yes" && postServiceReportPrice > 0) {
    priceItems.push({
      label: "Post-Service Report",
      value: postServiceReportPrice * factor
    });
  }

  // Calculate subtotal
  const subtotal = priceItems.reduce((total, item) => total + item.value, 0);

  // Calculate grand total
  const grandTotal = subtotal;

  // If no price items, don't show the section
  if (priceItems.length === 0) {
    return '';
  }

  return `
    <!-- Price Breakdown -->
    <div class="p-card no-break">
        <div class="p-card-body">
            <div class="p-card-title">Price Breakdown</div>
            <div class="p-card-content">
                <div class="p-datatable price-table">
                    <table class="p-datatable-table">
                        <thead class="p-datatable-thead">
                            <tr>
                                <th>Item</th>
                                <th class="text-right">Price</th>
                            </tr>
                        </thead>
                        <tbody class="p-datatable-tbody">
                            ${priceItems.map(item => `
                            <tr>
                                <td class="price-label">${item.label}</td>
                                <td class="price-value">£${formatCurrency(item.value)}</td>
                            </tr>`).join('')}
                            
                            ${modify !== 0 ? `
                            <tr class="subtotal-row">
                                <td class="price-label">Subtotal (before modification)</td>
                                <td class="price-value">£${formatCurrency(subtotal / factor)}</td>
                            </tr>
                            <tr>
                                <td class="price-label">Modification (${modify > 0 ? "+" : ""}${modify}%)</td>
                                <td class="price-value">${modify > 0 ? "+" : ""}£${formatCurrency(subtotal - (subtotal / factor))}</td>
                            </tr>` : ''}
                            
                            <tr class="total-row">
                                <td class="price-label">GRAND TOTAL</td>
                                <td class="price-value">£${formatCurrency(grandTotal)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
  `;
};

export default generatePriceBreakdownSection;
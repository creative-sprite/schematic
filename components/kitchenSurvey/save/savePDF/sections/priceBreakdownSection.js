// components/kitchenSurvey/save/savePDF/sections/priceBreakdownSection.js
import { formatCurrency } from '../templateUtils';

/**
 * Calculates subtotal from survey data
 * @param {Object} data - Survey data
 * @returns {Number} Calculated subtotal
 */
const calculateSubtotal = (data) => {
  const {
    structureTotal = 0,
    surveyData: equipmentEntries = [],
    canopyTotal = 0,
    accessDoorPrice = 0,
    ventilationPrice = 0,
    airPrice = 0,
    fanPartsPrice = 0,
    airInExTotal = 0,
    schematicItemsTotal = 0
  } = data || {};

  // Calculate equipment total
  const equipmentTotal = (equipmentEntries || []).reduce(
    (total, item) => total + (item.price || 0),
    0
  );

  // Calculate subtotal
  return (
    structureTotal +
    equipmentTotal +
    canopyTotal +
    accessDoorPrice +
    ventilationPrice +
    airPrice +
    fanPartsPrice +
    airInExTotal +
    (typeof schematicItemsTotal === "object"
      ? schematicItemsTotal.overall || 0
      : schematicItemsTotal || 0)
  );
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
    modify = 0
  } = data || {};
  
  // Calculate equipment total
  const equipmentTotal = (equipmentEntries || []).reduce(
    (total, item) => total + (item.price || 0),
    0
  );
  
  // Calculate subtotal
  const subtotal = calculateSubtotal(data);
  
  // Calculate grand total with modification
  const grandTotal = subtotal * (1 + (modify || 0) / 100);
  
  return `
    <!-- Price Breakdown - Important to keep this together -->
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
                            ${
                                structureTotal > 0
                                    ? `
                            <tr>
                                <td class="price-label">Structure Total</td>
                                <td class="price-value">£${formatCurrency(structureTotal)}</td>
                            </tr>`
                                    : ""
                            }
                            
                            ${
                                equipmentTotal > 0
                                    ? `
                            <tr>
                                <td class="price-label">Equipment</td>
                                <td class="price-value">£${formatCurrency(equipmentTotal)}</td>
                            </tr>`
                                    : ""
                            }
                            
                            ${
                                canopyTotal > 0
                                    ? `
                            <tr>
                                <td class="price-label">Canopy</td>
                                <td class="price-value">£${formatCurrency(canopyTotal)}</td>
                            </tr>`
                                    : ""
                            }
                            
                            ${
                                accessDoorPrice > 0
                                    ? `
                            <tr>
                                <td class="price-label">Access Door</td>
                                <td class="price-value">£${formatCurrency(accessDoorPrice)}</td>
                            </tr>`
                                    : ""
                            }
                            
                            ${
                                ventilationPrice > 0
                                    ? `
                            <tr>
                                <td class="price-label">Ventilation</td>
                                <td class="price-value">£${formatCurrency(ventilationPrice)}</td>
                            </tr>`
                                    : ""
                            }
                            
                            ${
                                airPrice > 0
                                    ? `
                            <tr>
                                <td class="price-label">Air Supply/Extract</td>
                                <td class="price-value">£${formatCurrency(airPrice)}</td>
                            </tr>`
                                    : ""
                            }
                            
                            ${
                                fanPartsPrice > 0
                                    ? `
                            <tr>
                                <td class="price-label">Fan Parts</td>
                                <td class="price-value">£${formatCurrency(fanPartsPrice)}</td>
                            </tr>`
                                    : ""
                            }
                            
                            ${
                                airInExTotal > 0
                                    ? `
                            <tr>
                                <td class="price-label">Air In/Ex</td>
                                <td class="price-value">£${formatCurrency(airInExTotal)}</td>
                            </tr>`
                                    : ""
                            }
                            
                            ${
                                schematicItemsTotal
                                    ? `
                            <tr>
                                <td class="price-label">Schematic Items</td>
                                <td class="price-value">£${formatCurrency(
                                  typeof schematicItemsTotal === "object"
                                    ? schematicItemsTotal.overall || 0
                                    : schematicItemsTotal || 0
                                )}</td>
                            </tr>`
                                    : ""
                            }
                            
                            <tr class="subtotal-row">
                                <td class="price-label">Subtotal</td>
                                <td class="price-value">£${formatCurrency(subtotal)}</td>
                            </tr>
                            
                            ${
                                modify
                                    ? `
                            <tr>
                                <td class="price-label">Modification (${
                                    modify > 0 ? "+" : ""
                                }${modify}%)</td>
                                <td class="price-value">${
                                    modify > 0 ? "+" : ""
                                }£${formatCurrency((subtotal * modify) / 100)}</td>
                            </tr>`
                                    : ""
                            }
                            
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

// Export the helper function for use in other modules
export { calculateSubtotal };

export default generatePriceBreakdownSection;
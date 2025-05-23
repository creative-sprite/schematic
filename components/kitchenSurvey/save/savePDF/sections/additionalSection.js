// components/kitchenSurvey/save/savePDF/sections/additionalSection.js

import { formatCurrency } from '../templateUtils';

/**
 * Generates the additional services section of the PDF
 * @param {Object} data - Survey data
 * @returns {String} HTML for the additional services section
 */
export const generateAdditionalSection = (data) => {
  // Try multiple possible data paths
  const additionalServices = data?.additionalServices || {};
  
  // Extract values with fallbacks to root level properties
  const parkingCost = additionalServices.parkingCost !== undefined 
    ? additionalServices.parkingCost 
    : data?.parkingCost || 0;
    
  const postServiceReport = additionalServices.postServiceReport !== undefined 
    ? additionalServices.postServiceReport 
    : data?.postServiceReport || "No";
    
  const postServiceReportPrice = additionalServices.postServiceReportPrice !== undefined 
    ? additionalServices.postServiceReportPrice 
    : data?.postServiceReportPrice || 0;

  // Helper function to check if a field has meaningful content
  const hasContent = (value) => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim() !== '';
    if (typeof value === 'number') return value > 0;
    return Boolean(value);
  };

  // Check if any additional services have content
  const hasParkingCost = hasContent(parkingCost);
  const hasPostServiceReport = hasContent(postServiceReport) && postServiceReport.toLowerCase() !== 'no';
  const hasPostServiceReportPrice = hasContent(postServiceReportPrice);

  // If no content, return empty string (hide the entire card)
  if (!hasParkingCost && !hasPostServiceReport && !hasPostServiceReportPrice) {
    return '';
  }

  return `
    <!-- Additional Services -->
    <div class="p-card">
        <div class="p-card-body">
            <div class="p-card-title">Additional Services</div>
            <div class="p-card-content">
                
                ${
                    hasParkingCost
                        ? `
                <div class="info-row">
                    <span class="label">Parking Cost:</span>
                    <span class="data">£${formatCurrency(parkingCost)}</span>
                </div>`
                        : ""
                }
                
                ${
                    hasPostServiceReport
                        ? `
                <div class="info-row">
                    <span class="label">Post Service Report:</span>
                    <span class="data">${postServiceReport}</span>
                </div>
                `
                        : ""
                }
                
            </div>
        </div>
    </div>
  `;
};

export default generateAdditionalSection;
// components/kitchenSurvey/save/savePDF/sections/headerSection.js

/**
 * Generates the header section of the PDF
 * @param {Object} data - Survey data
 * @returns {String} HTML for the header section
 */
export const generateHeaderSection = (data) => {
  const { refValue, surveyDate, operations, structureId } = data || {};
  
  return `
    <!-- Header -->
    <h1>${operations?.typeOfCooking || "Kitchen Survey"} Quote</h1>
    <div class="p-card no-break header-card">
      <div class="p-card-body">
        <div class="header-info-row">
        <span class="data">${structureId || ""}</span>
            <span class="data">${refValue || ""}</span>
            <span class="data">
              ${new Date(surveyDate || Date.now()).toLocaleDateString()}
            </span>
        </div>
      </div>
    </div>
  `;
};

export default generateHeaderSection;
// components/kitchenSurvey/save/savePDF/sections/equipmentSection.js

/**
 * Generates the equipment survey section of the PDF (regular equipment only)
 * @param {Object} data - Survey data
 * @returns {String} HTML for the equipment survey section
 */
export const generateEquipmentSection = (data) => {
  // Try multiple possible data paths for equipment comments
  const { 
    surveyData: equipmentEntries = [], 
    equipment = {},
    equipmentSurvey = {}
  } = data || {};
  
  // Extract comments from multiple possible sources
  let subcategoryComments = {};
  
  // Check equipment object
  if (equipment.subcategoryComments) {
    subcategoryComments = { ...subcategoryComments, ...equipment.subcategoryComments };
  }
  
  // Check equipmentSurvey object  
  if (equipmentSurvey.subcategoryComments) {
    subcategoryComments = { ...subcategoryComments, ...equipmentSurvey.subcategoryComments };
  }
  
  console.log('Equipment Comments Debug:', {
    hasEquipmentSurvey: !!equipmentSurvey,
    equipmentSurveyKeys: Object.keys(equipmentSurvey),
    equipmentSurveySubcategoryComments: equipmentSurvey.subcategoryComments,
    subcategoryComments: subcategoryComments,
    subcategoryKeys: Object.keys(subcategoryComments)
  });
  
  // Function to find relevant equipment comments by subcategory
  const findEquipmentCommentsBySubcategory = (subcategory) => {
    const matchingComments = {};
    Object.entries(subcategoryComments).forEach(([key, comment]) => {
      if (hasContent(comment)) {
        // Case-insensitive matching
        const lowerKey = key.toLowerCase();
        const lowerSubcategory = subcategory.toLowerCase();
        if (lowerKey === lowerSubcategory || lowerKey.includes(lowerSubcategory) || lowerSubcategory.includes(lowerKey)) {
          matchingComments[key] = comment;
        }
      }
    });
    return matchingComments;
  };
  
  // Helper function to check if a field has meaningful content
  const hasContent = (value) => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim() !== '';
    if (typeof value === 'object' && value !== null) {
      return Object.keys(value).some(key => hasContent(value[key]));
    }
    return Boolean(value);
  };
  
  // Check if any content exists
  const hasEquipmentEntries = equipmentEntries && equipmentEntries.length > 0;
  const hasAnySubcategoryComments = Object.keys(subcategoryComments).some(key => hasContent(subcategoryComments[key]));
  
  // If no content, return empty string (hide the entire card)
  if (!hasEquipmentEntries && !hasAnySubcategoryComments) {
    return '';
  }
  
  // Group equipment entries by subcategory
  const equipmentBySubcategory = {};
  equipmentEntries.forEach(item => {
    const subcategory = item.subcategory || 'Uncategorized';
    if (!equipmentBySubcategory[subcategory]) {
      equipmentBySubcategory[subcategory] = [];
    }
    equipmentBySubcategory[subcategory].push(item);
  });
  
  return `
    <!-- Equipment Survey -->
    <div class="p-card">
        <div class="p-card-body">
            <div class="p-card-title">Equipment Survey</div>
            <div class="p-card-content">
                ${
                    hasEquipmentEntries
                        ? `
                ${Object.entries(equipmentBySubcategory).map(([subcategory, items]) => {
                  const subcategoryComments = findEquipmentCommentsBySubcategory(subcategory);
                  
                  return `
                    <h3>${subcategory}</h3>
                    <div class="p-datatable">
                        <table class="p-datatable-table">
                            <thead class="p-datatable-thead">
                                <tr>
                                    <th>Item</th>
                                    <th>Quantity</th>
                                </tr>
                            </thead>
                            <tbody class="p-datatable-tbody">
                                ${items.map(item => `
                                <tr>
                                    <td>${item.name || item.item || "N/A"}</td>
                                    <td class="text-center">${item.quantity || 1}</td>
                                </tr>`).join('')}
                            </tbody>
                        </table>
                    </div>
                    
                    ${Object.keys(subcategoryComments).length > 0 ? `
                    ${Object.entries(subcategoryComments).map(([key, comment]) => `
                    <div class="comment">
                        <strong>Comments:</strong><br>
                        ${comment}
                    </div>
                    `).join('')}` : ''}
                  `;
                }).join('')}`
                        : ""
                }
            </div>
        </div>
    </div>
  `;
};

export default generateEquipmentSection;
// components/kitchenSurvey/save/savePDF/sections/specialistSection.js

/**
 * Generates the specialist equipment section of the PDF
 * @param {Object} data - Survey data
 * @returns {String} HTML for the specialist equipment section
 */
export const generateSpecialistSection = (data) => {
  // Follow the same pattern as equipmentSection.js
  const { 
    specialistEquipmentData = [],
    equipment = {},
    specialistEquipmentSurvey = {}
  } = data || {};
  
  // Extract comments from multiple possible sources (same pattern as equipment)
  let categoryComments = {};
  
  // Check equipment object
  if (equipment.categoryComments) {
    categoryComments = { ...categoryComments, ...equipment.categoryComments };
  }
  
  // Check specialistEquipmentSurvey object  
  if (specialistEquipmentSurvey.categoryComments) {
    categoryComments = { ...categoryComments, ...specialistEquipmentSurvey.categoryComments };
  }
  
  console.log('Specialist Equipment Comments Debug:', {
    categoryKeys: Object.keys(categoryComments),
    specialistEquipmentDataCount: specialistEquipmentData.length,
    allCategories: [...new Set(specialistEquipmentData.map(item => item.category))]
  });
  
  // Function to find relevant specialist equipment comments by category - clean version
  const findSpecialistCommentsByCategory = (category) => {
    const matchingComments = {};
    
    Object.entries(categoryComments).forEach(([key, comment]) => {
      if (hasContent(comment)) {
        // Normalize both strings for comparison
        const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
        const normalizedCategory = category.toLowerCase().replace(/[^a-z0-9]/g, '');
        
        // Try exact match first, then partial matches
        if (normalizedKey === normalizedCategory || 
            normalizedKey.includes(normalizedCategory) || 
            normalizedCategory.includes(normalizedKey)) {
          // Use the category name as the key to avoid duplicates
          matchingComments[category] = comment;
        }
      }
    });
    
    return matchingComments;
  };
  
  // Helper function to render custom data fields - only show fields with actual data
  const renderCustomData = (customData) => {
    if (!customData || !Array.isArray(customData)) return '';
    
    const validFields = customData
      .filter((field) => {
        // Skip if field is invalid
        if (!field || typeof field !== "object") return false;
        
        // Skip system fields
        if (field.fieldName === "__v" || field.fieldName === "_id") return false;
        
        // Skip price/cost fields
        const fieldLabel = field.fieldName || '';
        if (fieldLabel.toLowerCase().includes("price") || fieldLabel.toLowerCase().includes("cost")) {
          return false;
        }
        
        // Only include fields that have actual content
        const value = field.value;
        if (value === null || value === undefined) return false;
        if (typeof value === 'string' && value.trim() === '') return false;
        if (typeof value === 'number' && value === 0) {
          // For numbers, 0 might be valid data, so include it
          return true;
        }
        
        return true; // Field has valid data
      })
      .map((field) => {
        const fieldLabel = field.fieldName || 'Unknown Field';
        const prefix = field.prefix || "";
        const suffix = field.suffix || "";
        const displayValue = field.value?.toString() || "";
        
        return `
          <div style="margin-bottom: 0.3rem; margin-left: 1rem;">
            <strong>${fieldLabel}:</strong> 
            <span>${prefix}${displayValue}${suffix}</span>
          </div>
        `;
      });
    
    return validFields.join('');
  };
  const hasContent = (value) => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim() !== '';
    if (typeof value === 'object' && value !== null) {
      return Object.keys(value).some(key => hasContent(value[key]));
    }
    return Boolean(value);
  };
  
  // Check if any content exists
  const hasSpecialistEntries = specialistEquipmentData && specialistEquipmentData.length > 0;
  const hasAnyCategoryComments = Object.keys(categoryComments).some(key => hasContent(categoryComments[key]));
  
  // If no content, return empty string (hide the entire card)
  if (!hasSpecialistEntries && !hasAnyCategoryComments) {
    return '';
  }
  
  // Group specialist equipment by category
  const specialistByCategory = {};
  specialistEquipmentData.forEach(item => {
    const category = item.category || 'Uncategorized';
    if (!specialistByCategory[category]) {
      specialistByCategory[category] = [];
    }
    specialistByCategory[category].push(item);
  });
  
  return `
    <!-- Specialist Equipment -->
    <div class="p-card">
        <div class="p-card-body">
            <div class="p-card-title">Specialist Equipment</div>
            <div class="p-card-content">
                ${
                    hasSpecialistEntries
                        ? `
                ${Object.entries(specialistByCategory).map(([category, items]) => {
                  const categoryCommentsForCategory = findSpecialistCommentsByCategory(category);
                  
                  return `
                    <h3>${category}</h3>
                    <div class="p-datatable">
                        <table class="p-datatable-table">
                            <thead class="p-datatable-thead">
                                <tr>
                                    <th>Item Details</th>
                                    <th>Quantity</th>
                                </tr>
                            </thead>
                            <tbody class="p-datatable-tbody">
                                ${items.map(item => {
                                  const customDataHtml = renderCustomData(item.customData || []);
                                  const isDimension = item.length || item.width || item.height;
                                  
                                  return `
                                <tr>
                                    <td>
                                        <strong>${item.name || item.item || "Unnamed Item"}</strong>
                                        ${item.type ? `<br><em>Type: ${item.type}</em>` : ''}
                                        ${isDimension ? `
                                        <br><strong>Dimensions:</strong>
                                        ${item.length ? `Length: ${item.length} ` : ''}
                                        ${item.width ? `Width: ${item.width} ` : ''}
                                        ${item.height ? `Height: ${item.height}` : ''}` : ''}
                                        ${customDataHtml ? `<br>${customDataHtml}` : ''}
                                    </td>
                                    <td class="text-center">${item.number || 1}</td>
                                </tr>`;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                    
                    ${Object.keys(categoryCommentsForCategory).length > 0 ? `
                    <div class="comment">
                        <strong>Comments:</strong><br>
                        ${Object.values(categoryCommentsForCategory)[0]}
                    </div>` : ''}
                  `;
                }).join('')}`
                        : ""
                }
            </div>
        </div>
    </div>
  `;
};

export default generateSpecialistSection;
// components/kitchenSurvey/save/savePDF/sections/structureSection.js

/**
 * Generates the structure details section of the PDF
 * @param {Object} data - Survey data
 * @returns {String} HTML for the structure details section
 */
export const generateStructureSection = (data) => {
  // Try multiple possible data paths
  const structure = data?.structure || {};
  let entries = [];
  
  // Primary path: structure.entries (new format)
  if (structure.entries && Array.isArray(structure.entries)) {
    entries = structure.entries;
  }
  // Fallback: structureEntries at root level
  else if (data?.structureEntries && Array.isArray(data.structureEntries)) {
    entries = data.structureEntries;
  }
  // Fallback: check for old format
  else if (data?.structureSelectionData && Array.isArray(data.structureSelectionData)) {
    // Convert old format to new format
    entries = [{
      id: 'legacy-entry',
      selectionData: data.structureSelectionData,
      dimensions: data.structureDimensions || {},
      comments: data.structureComments || ''
    }];
  }
  
  console.log('Structure PDF Debug:', {
    hasStructure: !!structure,
    entriesLength: entries.length,
    structureKeys: Object.keys(structure),
    dataKeys: Object.keys(data || {}),
    entries: entries
  });
  
  // Helper function to check if a field has meaningful content
  const hasContent = (value) => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim() !== '';
    if (typeof value === 'object' && value !== null) {
      // For dimensions, check if any dimension values exist
      return Object.values(value).some(val => val && val !== 0);
    }
    return Boolean(value);
  };
  
  // Check if any entries exist
  if (!entries || entries.length === 0) {
    console.log('Structure PDF: No entries found');
    return '';
  }
  
  // Check if any entry has meaningful content
  const hasAnyContent = entries.some(entry => {
    const hasDimensions = hasContent(entry.dimensions) && 
      (entry.dimensions.length || entry.dimensions.width || entry.dimensions.height);
    const hasSelectionData = entry.selectionData && entry.selectionData.length > 0;
    const hasComments = hasContent(entry.comments);
    
    console.log('Entry content check:', {
      entryId: entry.id,
      hasDimensions,
      hasSelectionData,
      hasComments,
      dimensions: entry.dimensions,
      selectionDataLength: entry.selectionData?.length || 0
    });
    
    return hasDimensions || hasSelectionData || hasComments;
  });
  
  // If no meaningful content in any entry, hide the entire card
  if (!hasAnyContent) {
    console.log('Structure PDF: No meaningful content found');
    return '';
  }
  
  console.log('Structure PDF: Rendering structure section with', entries.length, 'entries');
  
  return `
    <!-- Structure Details -->
    <div class="p-card">
        <div class="p-card-body">
            <div class="p-card-title">Structure Details</div>
            <div class="p-card-content">
                ${entries.map((entry, index) => {
                  const hasDimensions = hasContent(entry.dimensions) && 
                    (entry.dimensions.length || entry.dimensions.width || entry.dimensions.height);
                  const hasSelectionData = entry.selectionData && entry.selectionData.length > 0;
                  const hasComments = hasContent(entry.comments);
                  
                  // Only render entry if it has content
                  if (!hasDimensions && !hasSelectionData && !hasComments) {
                    return '';
                  }
                  
                  return `
                    ${entries.length > 1 ? `<h3>Structure Entry ${index + 1}</h3>` : ''}
                    
                    ${
                        hasDimensions
                            ? `
                    <div class="info-row">
                        <span class="label">Dimensions:</span>
                        <span class="data">
                            ${entry.dimensions?.length || 0}m × 
                            ${entry.dimensions?.width || 0}m × 
                            ${entry.dimensions?.height || 0}m
                        </span>
                    </div>`
                            : ""
                    }
                    
                    ${
                        hasSelectionData
                            ? `
                    <h3>Structure Components</h3>
                    <div class="p-datatable">
                        <table class="p-datatable-table">
                            <thead class="p-datatable-thead">
                                <tr>
                                    <th>Type</th>
                                    <th>Item</th>
                                    <th>Grade</th>
                                </tr>
                            </thead>
                            <tbody class="p-datatable-tbody">
                                ${entry.selectionData
                                    .map(
                                        (item) => `
                                <tr>
                                    <td>${item.type || ""}</td>
                                    <td>${item.item || ""}</td>
                                    <td>${item.grade || ""}</td>
                                </tr>`
                                    )
                                    .join("")}
                            </tbody>
                        </table>
                    </div>`
                            : ""
                    }
                    
                    ${
                        hasComments
                            ? `
                    <div class="comment">
                        <strong>Comments:</strong><br>
                        ${entry.comments}
                    </div>`
                            : ""
                    }
                    
                    ${index < entries.length - 1 ? '<br>' : ''}
                  `;
                }).join('')}
            </div>
        </div>
    </div>
  `;
};

export default generateStructureSection;
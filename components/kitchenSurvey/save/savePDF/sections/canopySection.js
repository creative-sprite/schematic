// components/kitchenSurvey/save/savePDF/sections/canopySection.js

/**
 * Generates the canopy details section of the PDF
 * @param {Object} data - Survey data
 * @returns {String} HTML for the canopy details section
 */
export const generateCanopySection = (data) => {
  const { 
    canopyEntries = [], 
    canopyComments = {} 
  } = data || {};
  
  // Helper function to check if a field has meaningful content
  const hasContent = (value) => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim() !== '';
    if (typeof value === 'object' && value !== null) {
      return Object.values(value).some(val => val && (typeof val === 'string' ? val.trim() !== '' : Boolean(val)));
    }
    return Boolean(value);
  };
  
  // Function to find comments for a specific canopy/filter pair
  const findCommentsForEntry = (entry) => {
    const matchingComments = {};
    
    // Look for comments that match this entry's pattern
    Object.entries(canopyComments).forEach(([key, comment]) => {
      if (hasContent(comment)) {
        // Check if this comment belongs to this entry
        // Comments might be keyed by canopy-item-filter-item-id pattern
        const canopyItem = entry.canopy?.item;
        const filterItem = entry.filter?.item;
        
        if (canopyItem && filterItem && key.includes(canopyItem) && key.includes(filterItem)) {
          matchingComments[key] = comment;
        }
        // Or check if it matches the entry ID
        else if (entry.id && key.includes(entry.id)) {
          matchingComments[key] = comment;
        }
      }
    });
    
    return matchingComments;
  };
  
  // Check if any entries exist
  if (!canopyEntries || canopyEntries.length === 0) {
    return '';
  }
  
  // Check if any entry has meaningful content
  const hasAnyContent = canopyEntries.some(entry => {
    const hasCanopyData = hasContent(entry.canopy);
    const hasFilterData = hasContent(entry.filter);
    return hasCanopyData || hasFilterData;
  }) || Object.keys(canopyComments).some(key => hasContent(canopyComments[key]));
  
  // If no meaningful content in any entry, hide the entire card
  if (!hasAnyContent) {
    return '';
  }
  
  return `
    <!-- Canopy Details -->
    <div class="p-card">
        <div class="p-card-body">
            <div class="p-card-title">Canopy Details</div>
            <div class="p-card-content">
                ${canopyEntries.map((entry, index) => {
                  const hasCanopyData = hasContent(entry.canopy);
                  const hasFilterData = hasContent(entry.filter);
                  const entryComments = findCommentsForEntry(entry);
                  
                  // Only render entry if it has content
                  if (!hasCanopyData && !hasFilterData) {
                    return '';
                  }
                  
                  return `
                    ${canopyEntries.length > 1 ? `<h3>Canopy ${index + 1}</h3>` : ''}
                    
                    ${
                        hasCanopyData
                            ? `
                    <h4>Canopy</h4>
                    <div class="p-datatable">
                        <table class="p-datatable-table">
                            <thead class="p-datatable-thead">
                                <tr>
                                    <th>Type</th>
                                    <th>Item</th>
                                    <th>Grade</th>
                                    <th>Length</th>
                                    <th>Width</th>
                                    <th>Height</th>
                                </tr>
                            </thead>
                            <tbody class="p-datatable-tbody">
                                <tr>
                                    <td>${entry.canopy.type || ""}</td>
                                    <td>${entry.canopy.item || ""}</td>
                                    <td>${entry.canopy.grade || ""}</td>
                                    <td>${entry.canopy.length || ""}</td>
                                    <td>${entry.canopy.width || ""}</td>
                                    <td>${entry.canopy.height || ""}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>`
                            : ""
                    }
                    
                    ${
                        hasFilterData
                            ? `
                    <h4>${Number(entry.filter.number || entry.filter.quantity || 1) > 1 ? 'Filters' : 'Filter'}</h4>
                    <div class="p-datatable">
                        <table class="p-datatable-table">
                            <thead class="p-datatable-thead">
                                <tr>
                                    <th>Type</th>
                                    <th>Item</th>
                                    <th>Grade</th>
                                    <th>Quantity</th>
                                </tr>
                            </thead>
                            <tbody class="p-datatable-tbody">
                                <tr>
                                    <td>${entry.filter.type || ""}</td>
                                    <td>${entry.filter.item || ""}</td>
                                    <td>${entry.filter.grade || ""}</td>
                                    <td>${entry.filter.number || ""}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>`
                            : ""
                    }
                    
                    ${
                        Object.keys(entryComments).length > 0
                            ? `
                    ${Object.entries(entryComments).map(([key, comment]) => `
                    <div class="comment">
                        <strong>Comments:</strong><br>
                        ${comment}
                    </div>
                    `).join('')}`
                            : ""
                    }
                    
                    ${index < canopyEntries.length - 1 ? '<br>' : ''}
                  `;
                }).join('')}
            </div>
        </div>
    </div>
  `;
};

export default generateCanopySection;
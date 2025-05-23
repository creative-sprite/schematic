// components/kitchenSurvey/save/savePDF/sections/accessRequirementsSection.js

/**
 * Generates the access requirements section of the PDF
 * @param {Object} data - Survey data
 * @returns {String} HTML for the access requirements section
 */
export const generateAccessRequirementsSection = (data) => {
  const { access = {} } = data || {};
  
  // Helper function to check if a field has meaningful content
  const hasContent = (value) => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim() !== '';
    if (Array.isArray(value)) return value.length > 0;
    return Boolean(value);
  };
  
  // Helper function to format array values (for PPE multi-select)
  const formatArrayValue = (array) => {
    if (!Array.isArray(array) || array.length === 0) return '';
    return array.join(', ');
  };
  
  // Check if any access fields have content
  const hasAccessContent = 
    hasContent(access.mechanicalEngineer) ||
    hasContent(access.mechanicalEngineerDetails) ||
    hasContent(access.roofAccess) ||
    hasContent(access.roofAccessDetails) ||
    hasContent(access.systemIsolated) ||
    hasContent(access.manning) ||
    hasContent(access.frequencyOfService) ||
    hasContent(access.keysrequired) ||
    hasContent(access.dbs) ||
    hasContent(access.permit) ||
    hasContent(access.inductionNeeded) ||
    hasContent(access.inductionDetails) ||
    hasContent(access.wasteTankToggle) ||
    hasContent(access.wasteTankSelection) ||
    hasContent(access.wasteTankDetails) ||
    hasContent(access.ppeToggle) ||
    hasContent(access.ppeMulti) ||
    hasContent(access.ppeDetails) ||
    hasContent(access.wasteManagementRequired) ||
    hasContent(access.wasteManagementDetails) ||
    hasContent(access.otherComments);
  
  // If no content in access section, return empty string (hide the entire card)
  if (!hasAccessContent) {
    return '';
  }
  
  return `
    <!-- Access Requirements -->
    <div class="p-card">
        <div class="p-card-body">
            <div class="p-card-title">Access Requirements</div>
            <div class="p-card-content">
                
                ${
                    hasContent(access.mechanicalEngineer)
                        ? `
                <div class="info-row">
                    <span class="label">M&E Engineer Required:</span> 
                    <span class="data">${access.mechanicalEngineer}</span>
                </div>
                ${hasContent(access.mechanicalEngineerDetails) ? `
                <div class="comment">
                    <strong>Engineer Details:</strong><br>
                    ${access.mechanicalEngineerDetails}
                </div>` : ''}`
                        : ""
                }
                
                ${
                    hasContent(access.roofAccess)
                        ? `
                <div class="info-row">
                    <span class="label">Roof Access Required:</span> 
                    <span class="data">${access.roofAccess}</span>
                </div>
                ${hasContent(access.roofAccessDetails) ? `
                <div class="comment">
                    <strong>Roof Access Details:</strong><br>
                    ${access.roofAccessDetails}
                </div>` : ''}`
                        : ""
                }
                
                ${
                    hasContent(access.systemIsolated)
                        ? `
                <div class="info-row">
                    <span class="label">System to be Isolated Before Service:</span> 
                    <span class="data">${access.systemIsolated}</span>
                </div>`
                        : ""
                }
                
                ${
                    hasContent(access.manning)
                        ? `
                <div class="info-row">
                    <span class="label">Manning:</span> 
                    <span class="data">${access.manning}</span>
                </div>`
                        : ""
                }
                
                ${
                    hasContent(access.frequencyOfService)
                        ? `
                <div class="info-row">
                    <span class="label">Frequency of Service:</span> 
                    <span class="data">${access.frequencyOfService}</span>
                </div>`
                        : ""
                }
                
                ${
                    hasContent(access.keysrequired)
                        ? `
                <div class="info-row">
                    <span class="label">Keys Required:</span> 
                    <span class="data">${access.keysrequired}</span>
                </div>`
                        : ""
                }
                
                ${
                    hasContent(access.dbs)
                        ? `
                <div class="info-row">
                    <span class="label">DBS Check:</span> 
                    <span class="data">${access.dbs}</span>
                </div>`
                        : ""
                }
                
                ${
                    hasContent(access.permit)
                        ? `
                <div class="info-row">
                    <span class="label">Permit to Work:</span> 
                    <span class="data">${access.permit}</span>
                </div>`
                        : ""
                }
                
                ${
                    hasContent(access.inductionNeeded)
                        ? `
                <div class="info-row">
                    <span class="label">Induction Needed:</span> 
                    <span class="data">${access.inductionNeeded}</span>
                </div>
                ${hasContent(access.inductionDetails) ? `
                <div class="comment">
                    <strong>Induction Details:</strong><br>
                    ${access.inductionDetails}
                </div>` : ''}`
                        : ""
                }
                
                ${
                    hasContent(access.wasteTankToggle)
                        ? `
                <div class="info-row">
                    <span class="label">Waste Tank Required:</span> 
                    <span class="data">${access.wasteTankToggle}</span>
                </div>
                ${hasContent(access.wasteTankSelection) ? `
                <div class="info-row">
                    <span class="label">Waste Tank Type:</span> 
                    <span class="data">${access.wasteTankSelection}</span>
                </div>` : ''}
                ${hasContent(access.wasteTankDetails) ? `
                <div class="comment">
                    <strong>Waste Tank Details:</strong><br>
                    ${access.wasteTankDetails}
                </div>` : ''}`
                        : ""
                }
                
                ${
                    hasContent(access.ppeToggle)
                        ? `
                <div class="info-row">
                    <span class="label">PPE Required:</span> 
                    <span class="data">${access.ppeToggle}</span>
                </div>
                ${hasContent(access.ppeMulti) && Array.isArray(access.ppeMulti) && access.ppeMulti.length > 0 ? `
                <div class="info-row">
                    <span class="label">PPE Types:</span> 
                    <span class="data">${formatArrayValue(access.ppeMulti)}</span>
                </div>` : ''}
                ${hasContent(access.ppeDetails) ? `
                <div class="comment">
                    <strong>PPE Details:</strong><br>
                    ${access.ppeDetails}
                </div>` : ''}`
                        : ""
                }
                
                ${
                    hasContent(access.wasteManagementRequired)
                        ? `
                <div class="info-row">
                    <span class="label">Waste Management Required:</span> 
                    <span class="data">${access.wasteManagementRequired}</span>
                </div>
                ${hasContent(access.wasteManagementDetails) ? `
                <div class="comment">
                    <strong>Waste Management Details:</strong><br>
                    ${access.wasteManagementDetails}
                </div>` : ''}`
                        : ""
                }
                
                ${
                    hasContent(access.otherComments)
                        ? `
                <div class="comment">
                    <strong>Other Comments:</strong><br>
                    ${access.otherComments}
                </div>`
                        : ""
                }
                
            </div>
        </div>
    </div>
  `;
};

export default generateAccessRequirementsSection;
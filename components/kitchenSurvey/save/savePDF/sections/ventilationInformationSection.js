// components/kitchenSurvey/save/savePDF/sections/ventilationInformationSection.js

/**
 * Generates the ventilation information section of the PDF
 * @param {Object} data - Survey data
 * @returns {String} HTML for the ventilation information section
 */
export const generateVentilationInformationSection = (data) => {
  const { ventilation = {} } = data || {};
  
  // Helper function to check if a field has meaningful content
  const hasContent = (value) => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim() !== '';
    if (Array.isArray(value)) return value.length > 0;
    return Boolean(value);
  };
  
  // Check if any ventilation fields have content
  const hasVentilationContent = 
    hasContent(ventilation.obstructionsToggle) ||
    hasContent(ventilation.damageToggle) ||
    hasContent(ventilation.inaccessibleAreasToggle) ||
    hasContent(ventilation.clientActionsToggle) ||
    hasContent(ventilation.description) ||
    hasContent(ventilation.accessLocations);
  
  // If no content in ventilation section, return empty string (hide the entire card)
  if (!hasVentilationContent) {
    return '';
  }
  
  return `
    <!-- Ventilation Information -->
    <div class="p-card">
        <div class="p-card-body">
            <div class="p-card-title">Ventilation Information</div>
            <div class="p-card-content">
                
                ${
                    hasContent(ventilation.obstructionsToggle)
                        ? `
                <div class="info-row">
                    <span class="label">Obstructions:</span> 
                    <span class="data">${ventilation.obstructionsToggle}</span>
                </div>
                ${hasContent(ventilation.obstructionsText) ? `
                <div class="comment">
                    <strong>Obstructions Details:</strong><br>
                    ${ventilation.obstructionsText.trim()}
                </div>` : ''}`
                        : ""
                }
                
                ${
                    hasContent(ventilation.damageToggle)
                        ? `
                <div class="info-row">
                    <span class="label">Damage:</span> 
                    <span class="data">${ventilation.damageToggle}</span>
                </div>
                ${hasContent(ventilation.damageText) ? `
                <div class="comment">
                    <strong>Damage Details:</strong><br>
                    ${ventilation.damageText.trim()}
                </div>` : ''}`
                        : ""
                }
                
                ${
                    hasContent(ventilation.inaccessibleAreasToggle)
                        ? `
                <div class="info-row">
                    <span class="label">Inaccessible Areas:</span> 
                    <span class="data">${ventilation.inaccessibleAreasToggle}</span>
                </div>
                ${hasContent(ventilation.inaccessibleAreasText) ? `
                <div class="comment">
                    <strong>Inaccessible Areas Details:</strong><br>
                    ${ventilation.inaccessibleAreasText.trim()}
                </div>` : ''}`
                        : ""
                }
                
                ${
                    hasContent(ventilation.clientActionsToggle)
                        ? `
                <div class="info-row">
                    <span class="label">Client Actions:</span> 
                    <span class="data">${ventilation.clientActionsToggle}</span>
                </div>
                ${hasContent(ventilation.clientActionsText) ? `
                <div class="comment">
                    <strong>Client Actions Details:</strong><br>
                    ${ventilation.clientActionsText.trim()}
                </div>` : ''}`
                        : ""
                }
                
                ${
                    hasContent(ventilation.accessLocations) && Array.isArray(ventilation.accessLocations)
                        ? `
                <div class="info-row">
                    <span class="label">Access Locations:</span> 
                    <span class="data">${ventilation.accessLocations.join(', ')}</span>
                </div>`
                        : ""
                }
                
                ${
                    hasContent(ventilation.description)
                        ? `
                <div class="comment">
                    <strong>Description:</strong><br>
                    ${ventilation.description}
                </div>`
                        : ""
                }
                
            </div>
        </div>
    </div>
  `;
};

export default generateVentilationInformationSection;
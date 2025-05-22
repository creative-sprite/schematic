// components/kitchenSurvey/save/savePDF/sections/additionalInfoSection.js

/**
 * Generates the additional information section of the PDF
 * @param {Object} data - Survey data
 * @returns {String} HTML for the additional information section
 */
export const generateAdditionalInfoSection = (data) => {
  const { access = {}, operations = {} } = data || {};
  
  // Helper function to check if a field has meaningful content
  const hasContent = (value) => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim() !== '';
    return Boolean(value);
  };
  
  // Check if any sections have content
  const hasOperationsContent = 
    hasContent(operations.typeOfCooking) ||
    hasContent(operations.coversPerDay) ||
    hasContent(operations.bestServiceTime) ||
    hasContent(operations.bestServiceDay) ||
    hasContent(operations.serviceDue);
    
  const hasAccessContent = 
    hasContent(access.inductionNeeded) ||
    hasContent(access.roofAccess) ||
    hasContent(access.permitToWork) ||
    hasContent(access.dbs) ||
    hasContent(access.permit);
  
  // If no content in any section, return empty string (hide the entire card)
  if (!hasOperationsContent && !hasAccessContent) {
    return '';
  }
  
  return `
    <!-- Additional Information -->
    <div class="p-card">
        <div class="p-card-body">
            <div class="p-card-title">Additional Information</div>
            <div class="p-card-content">
                
                <!-- Operations Information - Match survey form order -->
                ${
                    hasOperationsContent
                        ? `
                <h3>Operations Information</h3>
                <div>
                    ${
                        hasContent(operations.typeOfCooking)
                            ? `
                    <div class="info-row">
                        <span class="label">Type of Cooking:</span> 
                        <span class="data">${operations.typeOfCooking}</span>
                    </div>`
                            : ""
                    }
                    
                    ${
                        hasContent(operations.coversPerDay)
                            ? `
                    <div class="info-row">
                        <span class="label">Covers Per Day:</span> 
                        <span class="data">${operations.coversPerDay}</span>
                    </div>`
                            : ""
                    }
                    
                    ${
                        hasContent(operations.bestServiceTime)
                            ? `
                    <div class="info-row">
                        <span class="label">Best Service Time:</span> 
                        <span class="data">${operations.bestServiceTime}</span>
                    </div>`
                            : ""
                    }
                    
                    ${
                        hasContent(operations.bestServiceDay)
                            ? `
                    <div class="info-row">
                        <span class="label">Best Service Day:</span> 
                        <span class="data">${operations.bestServiceDay}</span>
                    </div>`
                            : ""
                    }
                    
                    ${
                        hasContent(operations.serviceDue)
                            ? `
                    <div class="info-row">
                        <span class="label">Service Due:</span> 
                        <span class="data">${new Date(
                            operations.serviceDue
                        ).toLocaleDateString()}</span>
                    </div>`
                            : ""
                    }
                </div>`
                        : ""
                }
                
                <!-- Access Requirements -->
                ${
                    hasAccessContent
                        ? `
                <h3>Access Requirements</h3>
                <div>
                    ${
                        hasContent(access.inductionNeeded)
                            ? `
                    <div class="info-row">
                        <span class="label">Induction Needed:</span> 
                        <span class="data">${access.inductionNeeded}</span>
                    </div>`
                            : ""
                    }
                    
                    ${
                        hasContent(access.roofAccess)
                            ? `
                    <div class="info-row">
                        <span class="label">Roof Access:</span> 
                        <span class="data">${access.roofAccess}</span>
                    </div>`
                            : ""
                    }
                    
                    ${
                        hasContent(access.permitToWork)
                            ? `
                    <div class="info-row">
                        <span class="label">Permit to Work:</span> 
                        <span class="data">${access.permitToWork}</span>
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
                        <span class="label">Permit:</span> 
                        <span class="data">${access.permit}</span>
                    </div>`
                            : ""
                    }
                </div>`
                        : ""
                }
                
            </div>
        </div>
    </div>
  `;
};

export default generateAdditionalInfoSection;
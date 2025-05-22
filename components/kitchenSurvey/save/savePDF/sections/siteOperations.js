// components/kitchenSurvey/save/savePDF/sections/siteOperations.js

/**
 * Generates the site operations section of the PDF
 * @param {Object} data - Survey data
 * @returns {String} HTML for the site operations section
 */
export const generateSiteOperationsSection = (data) => {
  const { operations = {} } = data || {};
  
  // Helper function to check if a field has meaningful content
  const hasContent = (value) => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim() !== '';
    if (typeof value === 'object' && value !== null) {
      // For operational hours, check if any time fields have content
      if (value.weekdays || value.weekend) {
        const weekdaysHasContent = value.weekdays && (value.weekdays.start || value.weekdays.end);
        const weekendHasContent = value.weekend && (value.weekend.start || value.weekend.end);
        return weekdaysHasContent || weekendHasContent;
      }
    }
    return Boolean(value);
  };
  
  // Check if any operations fields have content
  const hasAnyContent = 
    hasContent(operations.patronDisruption) ||
    hasContent(operations.patronDisruptionDetails) ||
    hasContent(operations.eightHoursAvailable) ||
    hasContent(operations.eightHoursAvailableDetails) ||
    hasContent(operations.bestServiceTime) ||
    hasContent(operations.bestServiceDay) ||
    hasContent(operations.serviceDue) ||
    hasContent(operations.operationalHours) ||
    hasContent(operations.typeOfCooking) ||
    hasContent(operations.coversPerDay);
  
  // If no content, return empty string (hide the entire card)
  if (!hasAnyContent) {
    return '';
  }
  
  // Format date for service due if it exists
  const formattedServiceDue = operations.serviceDue 
    ? new Date(operations.serviceDue).toLocaleDateString() 
    : '';
  
  return `
    <!-- Site Operations -->
    <div class="p-card">
        <div class="p-card-body">
            <div class="p-card-title">Site Operations</div>
            <div class="p-card-content">
                <div class="info-section">
                    ${
                        hasContent(operations.patronDisruption)
                            ? `
                    <div class="info-row">
                        <span class="label">Patron Disruption:</span>
                        <span class="data">${operations.patronDisruption}</span>
                    </div>`
                            : ""
                    }
                    
                    ${
                        hasContent(operations.patronDisruptionDetails)
                            ? `
                    <div class="comment">
                        <strong>Patron Disruption Details:</strong><br>
                        ${operations.patronDisruptionDetails}
                    </div>`
                            : ""
                    }
                    
                    ${
                        hasContent(operations.eightHoursAvailable)
                            ? `
                    <div class="info-row">
                        <span class="label">8 Hours Available:</span>
                        <span class="data">${operations.eightHoursAvailable}</span>
                    </div>`
                            : ""
                    }
                    
                    ${
                        hasContent(operations.eightHoursAvailableDetails)
                            ? `
                    <div class="comment">
                        <strong>8 Hours Available Details:</strong><br>
                        ${operations.eightHoursAvailableDetails}
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
                        hasContent(operations.serviceDue) && formattedServiceDue
                            ? `
                    <div class="info-row">
                        <span class="label">Service Due:</span>
                        <span class="data">${formattedServiceDue}</span>
                    </div>`
                            : ""
                    }
                    
                    ${
                        hasContent(operations.operationalHours) && 
                        ((operations.operationalHours.weekdays && (operations.operationalHours.weekdays.start || operations.operationalHours.weekdays.end)) ||
                         (operations.operationalHours.weekend && (operations.operationalHours.weekend.start || operations.operationalHours.weekend.end)))
                            ? `
                    <div class="info-section">
                        <h3>Operational Hours</h3>
                        
                        ${
                            operations.operationalHours.weekdays && 
                            (operations.operationalHours.weekdays.start || operations.operationalHours.weekdays.end)
                                ? `
                        <div class="info-row">
                            <span class="label">Weekdays:</span>
                            <span class="data">
                                ${operations.operationalHours.weekdays.start || 'N/A'} - 
                                ${operations.operationalHours.weekdays.end || 'N/A'}
                            </span>
                        </div>`
                                : ""
                        }
                        
                        ${
                            operations.operationalHours.weekend && 
                            (operations.operationalHours.weekend.start || operations.operationalHours.weekend.end)
                                ? `
                        <div class="info-row">
                            <span class="label">Weekend:</span>
                            <span class="data">
                                ${operations.operationalHours.weekend.start || 'N/A'} - 
                                ${operations.operationalHours.weekend.end || 'N/A'}
                            </span>
                        </div>`
                                : ""
                        }
                    </div>`
                            : ""
                    }
                    
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
                </div>
            </div>
        </div>
    </div>
  `;
};

export default generateSiteOperationsSection;
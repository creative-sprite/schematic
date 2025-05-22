// components/kitchenSurvey/save/savePDF/sections/siteInfoSection.js

/**
 * Generates the site information section of the PDF
 * @param {Object} data - Survey data
 * @returns {String} HTML for the site information section
 */
export const generateSiteInfoSection = (data) => {
  const { siteDetails, contacts = [], primaryContactIndex, walkAroundContactIndex, parking } = data || {};
  
  // Helper function to check if a field has meaningful content
  const hasContent = (value) => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim() !== '';
    return Boolean(value);
  };
  
  // Build complete address with proper line formatting
  let siteAddress = "";
  if (siteDetails?.addresses && siteDetails.addresses[0]) {
    const address = siteDetails.addresses[0];
    const addressLines = [];
    
    // Line 1: Building number/name and street
    const line1Parts = [];
    if (address.addressNameNumber) line1Parts.push(address.addressNameNumber);
    if (address.addressLine1) line1Parts.push(address.addressLine1);
    if (line1Parts.length > 0) {
      addressLines.push(line1Parts.join(' '));
    }
    
    // Line 2: Address line 2 (if exists)
    if (address.addressLine2) {
      addressLines.push(address.addressLine2);
    }
    
    // Line 3: Town
    if (address.town) {
      addressLines.push(address.town);
    }
    
    // Line 4: County (if exists)
    if (address.county) {
      addressLines.push(address.county);
    }
    
    // Line 5: Country and postcode
    const lastLineParts = [];
    if (address.country) lastLineParts.push(address.country);
    if (address.postCode) lastLineParts.push(address.postCode);
    if (lastLineParts.length > 0) {
      addressLines.push(lastLineParts.join(' '));
    }
    
    // Join with HTML line breaks
    siteAddress = addressLines.join('<br/>');
  }
  
  // The primary contact
  const primaryContact =
    contacts && contacts.length > (primaryContactIndex || 0)
        ? contacts[primaryContactIndex]
        : null;
        
  // The walk around contact
  const walkAroundContact =
    contacts && contacts.length > (walkAroundContactIndex || 0)
        ? contacts[walkAroundContactIndex]
        : null;
        
  return `
    <!-- Site Information -->
    <div class="p-card no-break">
        <div class="p-card-body">
            <div class="p-card-title">${siteDetails?.siteName || ""}</div>
            <div class="p-card-content">
                
                <div class="info-row">
                    <span class="data">${siteAddress}</span>
                </div>
                
               
                
                <!-- Contacts Section with Flex Layout -->
                <div style="display: flex; justify-content: space-between; gap: 30px; margin-top: 15px;">
                    <div style="flex: 1; min-width: 0;">
                        ${
                            primaryContact
                                ? `
                        <div class="info-row">
                            <span class="label">Primary Contact:</span>
                            <span class="data">
                                ${primaryContact.contactFirstName || ""} 
                                ${primaryContact.contactLastName || ""}
                            </span>
                        </div>
                        ${
                            primaryContact.number || primaryContact.email
                                ? `
                        <div class="info-row">
                            <span class="label">Contact Details:</span>
                            <span class="data">
                                ${primaryContact.number || ""} 
                                ${
                                    primaryContact.email
                                        ? `/ ${primaryContact.email}`
                                        : ""
                                }
                            </span>
                        </div>`
                                : ""
                        }`
                                : `
                        <div class="info-row">
                            <span class="label">Primary Contact:</span>
                            <span class="data"></span>
                        </div>`
                        }
                    </div>
                    
                    <div style="flex: 1; min-width: 0;">
                        ${
                            walkAroundContact
                                ? `
                        <div class="info-row">
                            <span class="label">Walk Around Contact:</span>
                            <span class="data">
                                ${walkAroundContact.contactFirstName || ""} 
                                ${walkAroundContact.contactLastName || ""}
                            </span>
                        </div>
                        ${
                            walkAroundContact.number || walkAroundContact.email
                                ? `
                        <div class="info-row">
                            <span class="label">Contact Details:</span>
                            <span class="data">
                                ${walkAroundContact.number || ""} 
                                ${
                                    walkAroundContact.email
                                        ? `/ ${walkAroundContact.email}`
                                        : ""
                                }
                            </span>
                        </div>`
                                : ""
                        }`
                                : `
                        <div class="info-row">
                            <span class="label">Walk Around Contact:</span>
                            <span class="data"></span>
                        </div>`
                        }
                    </div>
                </div>
                
                <!-- Parking Information -->
                ${
                    hasContent(parking)
                        ? `
                <div class="comment">
                    <strong>Parking:</strong><br>
                    ${parking}
                </div>`
                        : ""
                }
            </div>
        </div>
    </div>
  `;
};

export default generateSiteInfoSection;
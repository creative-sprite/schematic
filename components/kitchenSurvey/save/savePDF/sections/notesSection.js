// components/kitchenSurvey/save/savePDF/sections/notesSection.js

/**
 * Generates the notes section of the PDF
 * @param {Object} data - Survey data
 * @returns {String} HTML for the notes section
 */
export const generateNotesSection = (data) => {
  const { notes = {} } = data || {};
  
  // Helper function to check if a field has meaningful content
  const hasContent = (value) => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim() !== '';
    return Boolean(value);
  };
  
  // Check if any notes fields have content
  const hasAnyContent = 
    hasContent(notes.comments) ||
    hasContent(notes.previousIssues) ||
    hasContent(notes.damage) ||
    hasContent(notes.inaccessibleAreas) ||
    hasContent(notes.clientActions);
  
  // If no content, return empty string (hide the entire card)
  if (!hasAnyContent) {
    return '';
  }
  
  return `
    <!-- Notes -->
    <div class="p-card">
        <div class="p-card-body">
            <div class="p-card-title">Notes</div>
            <div class="p-card-content">
                ${
                    hasContent(notes.comments)
                        ? `
                <div class="comment">
                    <strong>General Comments:</strong><br>
                    ${notes.comments}
                </div>`
                        : ""
                }
                
                ${
                    hasContent(notes.previousIssues)
                        ? `
                <div class="comment">
                    <strong>Previous Issues:</strong><br>
                    ${notes.previousIssues}
                </div>`
                        : ""
                }
                
                ${
                    hasContent(notes.damage)
                        ? `
                <div class="comment">
                    <strong>Damage:</strong><br>
                    ${notes.damage}
                </div>`
                        : ""
                }
                
                ${
                    hasContent(notes.inaccessibleAreas)
                        ? `
                <div class="comment">
                    <strong>Inaccessible Areas:</strong><br>
                    ${notes.inaccessibleAreas}
                </div>`
                        : ""
                }
                
                ${
                    hasContent(notes.clientActions)
                        ? `
                <div class="comment">
                    <strong>Client Actions:</strong><br>
                    ${notes.clientActions}
                </div>`
                        : ""
                }
            </div>
        </div>
    </div>
  `;
};

export default generateNotesSection;
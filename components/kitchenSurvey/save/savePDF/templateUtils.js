// components/kitchenSurvey/save/savePDF/templateUtils.js

/**
 * Utility function to create the surrounding HTML document
 * @param {String} contentHtml - Combined HTML from all sections
 * @param {String} refValue - Survey reference value
 * @returns {String} Complete HTML document
 */
export const createDocumentWrapper = (contentHtml, refValue) => {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Kitchen Survey Quote - ${refValue || "Unknown"}</title>
    <!-- PrimeReact CSS -->
    <link rel="stylesheet" href="https://unpkg.com/primereact/resources/themes/lara-light-indigo/theme.css" />
    <link rel="stylesheet" href="https://unpkg.com/primereact/resources/primereact.min.css" />
    <link rel="stylesheet" href="https://unpkg.com/primeicons/primeicons.css" />
    
    <!-- External CSS file -->
    <link rel="stylesheet" href="/styles/savePDF.css" />
</head>
<body>
    <div class="container">
        <!-- Main Content -->
        <div class="content">
            ${contentHtml}
            
            <!-- Footer -->
            <div class="footer">
                <p>This quote is valid for 30 days from the date of issue. All prices are subject to final survey confirmation.</p>
                <p>Reference: ${refValue || "N/A"} - Generated on ${new Date().toLocaleString()}</p>
            </div>
        </div>
        
        <!-- Footer for each page -->
        <div class="page-footer">
            Reference: ${refValue || "N/A"} - Page <span class="pageNumber"></span> of <span class="totalPages"></span>
        </div>
    </div>
</body>
</html>
  `;
};

/**
 * Combines all section HTML into a single HTML string
 * @param {Object} sections - Object containing all section HTML strings
 * @returns {String} Combined HTML content
 */
export const combineHtmlSections = (sections) => {
  return Object.values(sections).join('');
};

/**
 * Helper function to format currency values
 * @param {Number} value - Numeric value to format
 * @param {Number} decimals - Number of decimal places (default: 2)
 * @returns {String} Formatted currency string
 */
export const formatCurrency = (value, decimals = 2) => {
  if (typeof value !== 'number') return '0.00';
  return value.toFixed(decimals);
};
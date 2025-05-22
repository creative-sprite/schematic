// components/kitchenSurvey/save/savePDF/siteDataHandler.js

// Simple storage for selected site data
let selectedSiteForPDF = null;

/**
 * Call this when a site is selected to store it for PDF generation
 * @param {Object} siteData - Complete site object from SiteSelect
 */
export const storeSiteForPDF = (siteData) => {
    selectedSiteForPDF = siteData;
    console.log("=== STORING SITE FOR PDF ===");
    console.log("Site stored:", siteData?.siteName);
    console.log("Has addresses:", !!siteData?.addresses);
    console.log("First address:", siteData?.addresses?.[0]);
    console.log("Address line 1:", siteData?.addresses?.[0]?.addressLine1);
    console.log("===========================");
};

/**
 * Get the stored site data for PDF generation
 * @returns {Object|null} - Stored site data or null
 */
export const getSiteForPDF = () => {
    console.log("=== GETTING SITE FOR PDF ===");
    console.log("Retrieved site:", selectedSiteForPDF?.siteName);
    console.log("Has addresses:", !!selectedSiteForPDF?.addresses);
    console.log("First address:", selectedSiteForPDF?.addresses?.[0]);
    console.log("============================");
    return selectedSiteForPDF;
};

/**
 * Clear the stored site data
 */
export const clearSiteForPDF = () => {
    selectedSiteForPDF = null;
};
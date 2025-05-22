// components/kitchenSurvey/save/savePDF/useSavePDF.js

import { useState, useCallback } from "react";
import { getSurveyPdfFolder, getCloudinaryPdfUrl } from "@/lib/cloudinary";

// Import section generators
import generateHeaderSection from "./sections/headerSection";
import generateSiteInfoSection from "./sections/siteInfoSection";
import generateStructureSection from "./sections/structureSection";
import generateEquipmentSection from "./sections/equipmentSection";
import generateSpecialistSection from "./sections/specialistSection";
import generateSchematicSection from "./sections/schematicSection";
import generateCanopySection from "./sections/canopySection";
import generatePriceBreakdownSection, { calculateSubtotal } from "./sections/priceBreakdownSection";
import generateAdditionalInfoSection from "./sections/additionalInfoSection";
import generateVentilationInformationSection from "./sections/ventilationInformationSection";
import generateNotesSection from "./sections/notesSection";
import { generateSiteOperationsSection } from "./sections/siteOperations";

// Import template utilities
import { createDocumentWrapper, combineHtmlSections } from "./templateUtils";

/**
 * Generates complete HTML for PDF from survey data
 * @param {Object} surveyData Survey data
 * @param {String} schematicHtml Optional HTML for schematic
 * @returns {String} Complete HTML document as string
 */
export const generateStyledHtml = (surveyData, schematicHtml = null) => {
  // Generate all sections
  const sections = {
    header: generateHeaderSection(surveyData),
    siteInfo: generateSiteInfoSection(surveyData),
    siteOperations: generateSiteOperationsSection(surveyData),
    notes: generateNotesSection(surveyData),
    structure: generateStructureSection(surveyData),
    equipment: generateEquipmentSection(surveyData),
    specialist: generateSpecialistSection(surveyData),
    schematic: generateSchematicSection(surveyData),
    canopy: generateCanopySection(surveyData),
    ventilationInformation: generateVentilationInformationSection(surveyData),
    priceBreakdown: generatePriceBreakdownSection(surveyData),
    additionalInfo: generateAdditionalInfoSection(surveyData)
  };
  
  // Combine sections into content
  const contentHtml = combineHtmlSections(sections);
  
  // Wrap content in document template
  return createDocumentWrapper(contentHtml, surveyData?.refValue);
};

/**
 * Hook that provides PDF generation functionality
 * @returns {Object} PDF generation methods and state
 */
export const useSavePDF = () => {
  // State to track PDF module loading
  const [pdfState, setPdfState] = useState({
    isLoading: false,
    isReady: true,
    error: null,
  });

  // Function to capture DOM element as HTML string
  const captureElementAsHtml = useCallback(async (elementRef) => {
    if (!elementRef || !elementRef.current) {
      return null;
    }

    // Get the element's outerHTML
    const htmlContent = elementRef.current.outerHTML;

    // Normalize the HTML to ensure it's valid
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, "text/html");

    // Return the cleaned HTML
    return doc.body.innerHTML;
  }, []);

  // Helper function to upload PDF to Cloudinary
  const uploadPdfToCloudinary = useCallback(
    async (pdfDataUrl, fileName, folder) => {
      try {
        // Create file from base64 data
        const file = await fetch(pdfDataUrl).then((res) => res.blob());

        // Create FormData object for upload
        const formData = new FormData();
        formData.append("file", file, fileName);
        formData.append("folder", folder);
        formData.append("resource_type", "auto");
        formData.append("preserveFilename", "true");

        // Upload to Cloudinary via backend route
        const response = await fetch("/api/cloudinary/upload", {
          method: "POST",
          body: formData,
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.message || "Upload failed");
        }

        return result;
      } catch (error) {
        console.error("Error uploading to Cloudinary:", error);
        return {
          success: false,
          message: error.message || "Upload failed",
        };
      }
    },
    []
  );

  // Calculate equipment total
  const computeEquipmentTotal = useCallback((surveyData, equipmentItems) => {
    return (
      (surveyData || []).reduce(
        (total, item) => total + (item.price || 0),
        0
      ) || 0
    );
  }, []);

  // Main function to generate PDF quote using server-side puppeteer
  const generateQuote = useCallback(
    async (
      surveyId,
      schematicRef,
      surveyData,
      computeTotalPrice,
      toast
    ) => {
      // Prevent duplicate generation
      if (window.__generating_quote) {
        return {
          success: false,
          message: "Quote generation already in progress",
        };
      }
      window.__generating_quote = true;

      try {
        console.log("PDF Generation: Starting quote generation for survey:", surveyId);

        // FIXED: Fetch complete survey data from database instead of relying on passed data
        let completeSurveyData = surveyData;
        
        if (surveyId) {
          try {
            console.log("PDF Generation: Fetching complete survey data from database...");
            const response = await fetch(`/api/surveys/kitchenSurveys/viewAll/${surveyId}`);
            
            if (response.ok) {
              const apiResult = await response.json();
              if (apiResult.success && apiResult.data) {
                console.log("PDF Generation: Successfully fetched survey data from database");
                console.log("PDF Generation: Equipment comments found:", apiResult.data.equipmentSurvey?.subcategoryComments);
                
                // Use the database data as the primary source, merge with passed data for any missing fields
                completeSurveyData = {
                  ...surveyData, // Keep any additional data passed from the form
                  ...apiResult.data, // Override with complete database data
                  
                  // Ensure we have the equipment survey data with comments
                  equipmentSurvey: apiResult.data.equipmentSurvey || {},
                  
                  // For backward compatibility, also set surveyData to the equipment entries
                  surveyData: apiResult.data.equipmentSurvey?.entries || [],
                  
                  // Ensure specialist equipment data is available
                  specialistEquipmentSurvey: apiResult.data.specialistEquipmentSurvey || {},
                  specialistEquipmentData: apiResult.data.specialistEquipmentSurvey?.entries || [],
                };
                
                console.log("PDF Generation: Final survey data prepared with:", {
                  hasEquipmentSurvey: !!completeSurveyData.equipmentSurvey,
                  equipmentEntriesCount: completeSurveyData.equipmentSurvey?.entries?.length || 0,
                  subcategoryCommentsCount: Object.keys(completeSurveyData.equipmentSurvey?.subcategoryComments || {}).length,
                  subcategoryComments: completeSurveyData.equipmentSurvey?.subcategoryComments
                });
              } else {
                console.warn("PDF Generation: Failed to fetch survey data, using passed data");
              }
            } else {
              console.warn("PDF Generation: API request failed, using passed data");
            }
          } catch (fetchError) {
            console.error("PDF Generation: Error fetching survey data:", fetchError);
            console.log("PDF Generation: Falling back to passed data");
          }
        }

        // Extract basic info for filename and folder
        const { refValue, siteDetails } = completeSurveyData || {};

        // Calculate the grand total price
        let totalPrice = 0;
        if (typeof computeTotalPrice === "function") {
          const priceResult = computeTotalPrice();
          totalPrice =
            typeof priceResult === "number"
              ? priceResult
              : typeof priceResult === "object" &&
                priceResult?.grandTotal
              ? priceResult.grandTotal
              : 0;
        }

        // Capture schematic HTML if available
        let schematicHtml = null;
        if (schematicRef && schematicRef.current) {
          schematicHtml = await captureElementAsHtml(schematicRef);
        }

        // MODIFIED: Remove timestamp from PDF filename
        const pdfName = `Quote-${refValue || ""}.pdf`;

        // Get folder for storage - UPDATED TO USE IMPORTED FUNCTION
        const siteName =
          siteDetails?.siteName ||
          siteDetails?.name ||
          "unknown-site";
        const pdfFolder = getSurveyPdfFolder(
          siteName,
          refValue || "unknown"
        );

        console.log("PDF Generation: Generating HTML content...");

        // Generate the HTML content for the PDF using the complete survey data
        const htmlContent = generateStyledHtml(
          completeSurveyData,
          schematicHtml
        );

        console.log("PDF Generation: Calling server-side PDF API...");

        // Call server-side API to generate PDF
        const response = await fetch("/api/quotes/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            html: htmlContent,
            fileName: pdfName,
            options: {
              format: "A4",
              printBackground: true,
              margin: {
                top: "1cm",
                right: "1cm",
                bottom: "1cm",
                left: "1cm",
              },
              displayHeaderFooter: true,
              headerTemplate: `
              <div style="width: 100%; font-size: 9px; font-family: Arial; color: #777; padding: 0 10mm; display: flex; justify-content: center;">
                  Kitchen Survey Quote - ${
                    refValue || "Unknown"
                  } - Page <span class="pageNumber"></span> of <span class="totalPages"></span>
              </div>`,
              footerTemplate: `
              <div style="width: 100%; font-size: 9px; font-family: Arial; color: #777; padding: 0 10mm; display: flex; justify-content: center;">
                  Reference: ${
                    refValue || "N/A"
                  } - Page <span class="pageNumber"></span> of <span class="totalPages"></span>
              </div>`,
            },
            folder: pdfFolder,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`PDF generation failed: ${errorText}`);
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.message || "PDF generation failed");
        }

        // Get the correct PDF URL using our standard function
        const pdfPublicId = result.publicId;
        const pdfUrl = getCloudinaryPdfUrl(pdfPublicId);

        console.log("PDF Debug Info:", {
          publicId: pdfPublicId,
          generatedUrl: pdfUrl,
          originalUrl: result.pdfUrl,
        });

        // Prepare quote data for saving to database
        const quotePayload = {
          name: `Quote-${refValue || ""}`,
          cloudinary: {
            publicId: pdfPublicId, // Store the publicId as received from API
            url: pdfUrl, // Store the URL generated with our standard function
          },
          surveyId: surveyId,
          refValue: refValue,
          totalPrice: totalPrice,
          createdAt: new Date(),
        };

        // Save quote to database
        const saveResponse = await fetch("/api/quotes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(quotePayload),
        });

        const saveResult = await saveResponse.json();

        if (saveResult.success) {
          toast?.current?.show({
            severity: "success",
            summary: "Quote Created",
            detail: "Quote has been saved successfully",
            life: 3000,
          });
          return { success: true, data: saveResult.data };
        } else {
          throw new Error(
            saveResult.message || "Failed to save quote"
          );
        }
      } catch (error) {
        console.error("Error generating quote:", error);
        toast?.current?.show({
          severity: "error",
          summary: "Quote Error",
          detail: error.message || "Error creating quote",
          life: 5000,
        });
        return { success: false, error };
      } finally {
        window.__generating_quote = false;
      }
    },
    [captureElementAsHtml, computeEquipmentTotal]
  );

  // Return safe versions of functions and state
  return {
    generateQuote,
    captureElementAsHtml,
    uploadPdfToCloudinary,
    getSurveyPdfFolder,
    computeEquipmentTotal,
    isLoading: pdfState.isLoading,
    isReady: pdfState.isReady,
    error: pdfState.error,
    // Also expose the HTML generation function
    generateStyledHtml,
  };
};

export default useSavePDF;
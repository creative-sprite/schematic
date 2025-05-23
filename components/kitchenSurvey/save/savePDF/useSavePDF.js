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
import generatePriceBreakdownSection from "./sections/priceBreakdownSection";
import generateAccessRequirementsSection from "./sections/accessRequirementsSection";
import generateVentilationInformationSection from "./sections/ventilationInformationSection";
import generateImageSection from "./sections/imageSection";
import generateNotesSection from "./sections/notesSection";
import { generateSiteOperationsSection } from "./sections/siteOperations";
import generateAdditionalSection from "./sections/additionalSection";

// Import template utilities
import { createDocumentWrapper, combineHtmlSections } from "./templateUtils";

/**
 * Generates complete HTML for PDF from survey data (ASYNC for image processing)
 * @param {Object} surveyData Survey data
 * @param {String} schematicHtml Optional HTML for schematic
 * @returns {Promise<String>} Complete HTML document as string
 */
export const generateStyledHtml = async (surveyData, schematicHtml = null) => {
  console.log('Starting HTML generation for PDF...');
  
  try {
    // Generate all sections - images section is async for base64 conversion
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
      accessRequirements: generateAccessRequirementsSection(surveyData),
      images: await generateImageSection(surveyData),
      additionalServices: generateAdditionalSection(surveyData),
      priceBreakdown: generatePriceBreakdownSection(surveyData),
    };
    
    console.log('All sections generated, combining HTML...');
    
    // Combine sections into content
    const contentHtml = combineHtmlSections(sections);
    
    // Wrap content in document template
    const finalHtml = createDocumentWrapper(contentHtml, surveyData?.refValue);
    
    console.log('HTML generation complete, length:', finalHtml?.length || 0);
    return finalHtml;
    
  } catch (error) {
    console.error('Error generating HTML:', error);
    return createDocumentWrapper(
      '<div>Error generating PDF content. Please try again.</div>', 
      surveyData?.refValue || 'Error'
    );
  }
};

/**
 * Hook that provides PDF generation functionality
 * @returns {Object} PDF generation methods and state
 */
export const useSavePDF = () => {
  const [pdfState] = useState({
    isLoading: false,
    isReady: true,
    error: null,
  });

  // Function to capture DOM element as HTML string
  const captureElementAsHtml = useCallback(async (elementRef) => {
    if (!elementRef || !elementRef.current) {
      return null;
    }

    const htmlContent = elementRef.current.outerHTML;
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, "text/html");
    return doc.body.innerHTML;
  }, []);

  // Calculate equipment total
  const computeEquipmentTotal = useCallback((surveyData, equipmentItems) => {
    return (
      (surveyData || []).reduce(
        (total, item) => total + (item.price || 0),
        0
      ) || 0
    );
  }, []);

  // Main function to generate PDF quote
  const generateQuote = useCallback(
    async (
      surveyId,
      schematicRef,
      surveyData,
      computeTotalPrice,
      toast
    ) => {
      if (window.__generating_quote) {
        return {
          success: false,
          message: "Quote generation already in progress",
        };
      }
      window.__generating_quote = true;

      try {
        console.log("Starting quote generation for survey:", surveyId);

        // Get complete survey data from database
        let completeSurveyData = surveyData;
        
        if (surveyId) {
          try {
            const response = await fetch(`/api/surveys/kitchenSurveys/viewAll/${surveyId}`);
            
            if (response.ok) {
              const apiResult = await response.json();
              if (apiResult.success && apiResult.data) {
                completeSurveyData = {
                  ...surveyData, // Keep form data (including File objects for images)
                  ...apiResult.data, // Override with database data
                  
                  // CRITICAL: Preserve form images which have File objects for preview
                  images: surveyData.images || surveyData.surveyImages || apiResult.data.images || {},
                  surveyImages: surveyData.surveyImages || surveyData.images || apiResult.data.images || {},
                  
                  // Ensure equipment survey data
                  equipmentSurvey: apiResult.data.equipmentSurvey || {},
                  surveyData: apiResult.data.equipmentSurvey?.entries || [],
                  specialistEquipmentSurvey: apiResult.data.specialistEquipmentSurvey || {},
                  specialistEquipmentData: apiResult.data.specialistEquipmentSurvey?.entries || [],
                  
                  // Include structure entries for pricing calculations
                  structureEntries: apiResult.data.structure?.entries || surveyData.structureEntries || [],
                };
              }
            }
          } catch (fetchError) {
            console.error("Error fetching survey data:", fetchError);
          }
        }

        // Fetch equipment and structure items for price calculations if not already included
        try {
          if (!completeSurveyData.equipmentItems) {
            const equipmentResponse = await fetch('/api/equipment/kitchenEquipment');
            if (equipmentResponse.ok) {
              const equipmentData = await equipmentResponse.json();
              completeSurveyData.equipmentItems = equipmentData || [];
            }
          }

          if (!completeSurveyData.structureItems) {
            const structureResponse = await fetch('/api/structure/kitchenStructure');
            if (structureResponse.ok) {
              const structureData = await structureResponse.json();
              completeSurveyData.structureItems = structureData || [];
            }
          }
        } catch (fetchError) {
          console.error("Error fetching equipment/structure items:", fetchError);
        }

        // Extract basic info
        const { refValue, siteDetails } = completeSurveyData || {};

        // Calculate total price
        let totalPrice = 0;
        if (typeof computeTotalPrice === "function") {
          const priceResult = computeTotalPrice();
          totalPrice = typeof priceResult === "number" ? priceResult : priceResult?.grandTotal || 0;
        }

        // Capture schematic if available
        let schematicHtml = null;
        if (schematicRef && schematicRef.current) {
          schematicHtml = await captureElementAsHtml(schematicRef);
        }

        // Generate HTML content (ASYNC - converts File objects to base64)
        console.log("Converting images to base64 and generating HTML...");
        const htmlContent = await generateStyledHtml(completeSurveyData, schematicHtml);

        // Prepare file info
        const pdfName = `Quote-${refValue || ""}.pdf`;
        const siteName = siteDetails?.siteName || siteDetails?.name || "unknown-site";
        const pdfFolder = getSurveyPdfFolder(siteName, refValue || "unknown");

        console.log("Calling server-side PDF API...");

        // Generate PDF
        const response = await fetch("/api/quotes/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            html: htmlContent,
            fileName: pdfName,
            options: {
              format: "A4",
              printBackground: true,
              margin: { top: "1cm", right: "1cm", bottom: "1cm", left: "1cm" },
              waitUntil: ['networkidle0', 'load'],
              timeout: 90000, // Increased timeout for base64 images
            },
            folder: pdfFolder,
          }),
        });

        if (!response.ok) {
          throw new Error(`PDF generation failed: ${await response.text()}`);
        }

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.message || "PDF generation failed");
        }

        // Save quote to database
        const quotePayload = {
          name: `Quote-${refValue || ""}`,
          cloudinary: {
            publicId: result.publicId,
            url: getCloudinaryPdfUrl(result.publicId),
          },
          surveyId: surveyId,
          refValue: refValue,
          totalPrice: totalPrice,
          createdAt: new Date(),
        };

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
            detail: "Quote with images has been saved successfully",
            life: 3000,
          });
          return { success: true, data: saveResult.data };
        } else {
          throw new Error(saveResult.message || "Failed to save quote");
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

  return {
    generateQuote,
    captureElementAsHtml,
    computeEquipmentTotal,
    isLoading: pdfState.isLoading,
    isReady: pdfState.isReady,
    error: pdfState.error,
    generateStyledHtml,
  };
};

export default useSavePDF;
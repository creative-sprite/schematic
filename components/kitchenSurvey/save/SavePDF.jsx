// components/kitchenSurvey/save/SavePDF.jsx

// Import required hooks and utilities
import { useSavePDF, generateStyledHtml } from "./savePDF/useSavePDF";
import { getSurveyPdfFolder, getCloudinaryPdfUrl } from "@/lib/cloudinary";

// Re-export for backward compatibility
export { generateStyledHtml, useSavePDF };

/**
 * Main SavePDF component that serves as an entry point for PDF generation
 *
 * @param {Object} props Component properties
 * @param {String} props.surveyId ID of the survey
 * @param {Object} props.schematicRef Reference to schematic DOM element
 * @param {Object} props.surveyData Complete survey data
 * @param {Function} props.computeTotalPrice Function to compute total price
 * @param {Object} props.toast Toast notification reference
 * @returns {React.Component} SavePDF component
 */
const SavePDF = ({
    surveyId,
    schematicRef,
    surveyData,
    computeTotalPrice,
    toast,
}) => {
    const { isReady, isLoading, error } = useSavePDF();

    if (isLoading) {
        return <div>Loading PDF generator...</div>;
    }

    if (!isReady) {
        return (
            <div>PDF generator not available: {error || "Unknown error"}</div>
        );
    }

    return null; // or actual component JSX
};

export default SavePDF;

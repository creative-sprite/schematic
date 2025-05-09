// components/kitchenSurvey/save/SaveSurvey.jsx
import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Toast } from "primereact/toast";
import {
    computeEquipmentTotal,
    computeGrandTotals,
} from "../pricing/PricingUtils";
import { getSurveyImageFolder } from "@/lib/cloudinary";

/**
 * Component for handling survey saving functionality with automatic quote generation
 */
export default function SaveSurvey({
    targetRef, // Reference to the form content for PDF capture
    schematicRef, // Reference to the schematic for image capture
    surveyId,
    refValue,
    surveyDate,
    parking, // Dedicated parking prop
    siteDetails,
    contacts,
    primaryContactIndex,
    walkAroundContactIndex,
    structureId,
    structureTotal,
    structureSelectionData,
    structureDimensions,
    structureComments,
    surveyData,
    equipmentItems,
    specialistEquipmentData,
    canopyTotal,
    canopyEntries = [], // Add default empty array to prevent undefined errors
    accessDoorPrice,
    ventilationPrice,
    airPrice,
    fanPartsPrice,
    airInExTotal,
    schematicItemsTotal,
    selectedGroupId,
    operations,
    access,
    equipment = {}, // Add default empty object to prevent undefined errors
    notes,
    ventilation,
    areasState,
    modify,
    // Survey images directly passed from parent - standardized location only
    surveyImages = {},
    // Schematic data props
    placedItems = [],
    specialItems = [],
    gridSpaces = 26,
    cellSize = 40,
    groupDimensions = {},
    accessDoorSelections = {},
    fanGradeSelections = {},
    flexiDuctSelections = {},
}) {
    const router = useRouter();
    const toast = useRef(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    // Store a reference to the latest surveyImages to avoid state dependency issues
    const surveyImagesRef = useRef(surveyImages);

    // Keep surveyImagesRef up to date, but without causing re-renders
    useEffect(() => {
        surveyImagesRef.current = surveyImages;
    }, [surveyImages]);

    // Compute equipment total from main area's surveyData
    const computedEquipmentTotal = () => {
        return computeEquipmentTotal(surveyData, equipmentItems);
    };

    // For dynamic import of jsPDF
    const [jsPDFModule, setJsPDFModule] = useState(null);

    // Dynamically import jsPDF only on the client side
    useEffect(() => {
        import("html2canvas").then(() => {
            import("jspdf")
                .then((module) => {
                    setJsPDFModule(() => module.default);
                })
                .catch((error) => {
                    console.error("Failed to load jsPDF:", error);
                });
        });
    }, []);

    // Function to compute grand totals from main area and all duplicated areas
    const computedGrandTotals = () => {
        // Create object with main area totals
        const mainTotals = {
            structureTotal: structureTotal,
            equipmentTotal: computedEquipmentTotal(), // computed from main area's surveyData
            canopyTotal: canopyTotal,
            accessDoorPrice: accessDoorPrice,
            ventilationPrice: ventilationPrice,
            airPrice: airPrice,
            fanPartsPrice: fanPartsPrice,
            airInExTotal: airInExTotal,
            schematicItemsTotal: schematicItemsTotal,
        };

        // Use utility function to compute combined totals
        return computeGrandTotals(mainTotals, areasState);
    };

    /**
     * Captures only the used portion of the schematic as a JPG image
     * Implementation captures only the area of the grid where items are placed
     */
    const captureSchematic = async () => {
        if (!schematicRef?.current) {
            console.error("No schematic element found for exporting");
            return null;
        }

        try {
            const html2canvas = (await import("html2canvas")).default;

            // Find the canvas element within the schematic reference
            const canvasElement = schematicRef.current.querySelector(".canvas");
            if (!canvasElement) {
                console.error("Canvas element not found in schematic");
                return null;
            }

            // Step 1: Calculate the minimum and maximum used cells
            let minX = Infinity,
                minY = Infinity;
            let maxX = -Infinity,
                maxY = -Infinity;

            // Iterate through placed items to find boundaries
            placedItems.forEach((item) => {
                const { cellX, cellY } = item;

                // Update min/max values
                minX = Math.min(minX, cellX);
                minY = Math.min(minY, cellY);
                maxX = Math.max(maxX, cellX);
                maxY = Math.max(maxY, cellY);
            });

            // Handle special items (measurements, labels)
            specialItems.forEach((item) => {
                if (item.type === "label") {
                    minX = Math.min(minX, item.cellX);
                    minY = Math.min(minY, item.cellY);
                    maxX = Math.max(maxX, item.cellX);
                    maxY = Math.max(maxY, item.cellY);
                } else if (item.type === "measurement") {
                    minX = Math.min(minX, item.startCellX, item.endCellX);
                    minY = Math.min(minY, item.startCellY, item.endCellY);
                    maxX = Math.max(maxX, item.startCellX, item.endCellX);
                    maxY = Math.max(maxY, item.startCellY, item.endCellY);
                }
            });

            // If no items placed, capture entire grid
            if (
                minX === Infinity ||
                minY === Infinity ||
                maxX === -Infinity ||
                maxY === -Infinity
            ) {
                console.log("No items placed, capturing entire grid");
                const canvas = await html2canvas(canvasElement, {
                    scale: 2,
                    useCORS: true,
                    allowTaint: true,
                    scrollX: 0,
                    scrollY: 0,
                });
                return canvas.toDataURL("image/jpeg", 0.9);
            }

            // Add some padding (1 cell) around the used area
            minX = Math.max(0, minX - 1);
            minY = Math.max(0, minY - 1);
            maxX = Math.min(gridSpaces - 1, maxX + 1);
            maxY = Math.min(gridSpaces - 1, maxY + 1);

            // Calculate dimensions in pixels
            const left = minX * cellSize;
            const top = minY * cellSize;
            const width = (maxX - minX + 1) * cellSize;
            const height = (maxY - minY + 1) * cellSize;

            console.log(
                `Capturing schematic from (${minX},${minY}) to (${maxX},${maxY})`
            );
            console.log(
                `Pixel dimensions: left=${left}, top=${top}, width=${width}, height=${height}`
            );

            // Create a temporary container with exact dimensions for the cropped area
            const tempContainer = document.createElement("div");
            tempContainer.style.width = `${width}px`;
            tempContainer.style.height = `${height}px`;
            tempContainer.style.overflow = "hidden";
            tempContainer.style.position = "relative";

            // Clone the canvas element
            const canvasClone = canvasElement.cloneNode(true);
            canvasClone.style.position = "absolute";
            canvasClone.style.left = `-${left}px`;
            canvasClone.style.top = `-${top}px`;
            tempContainer.appendChild(canvasClone);

            // Temporarily append to document body
            document.body.appendChild(tempContainer);

            // Capture the cropped area
            const canvas = await html2canvas(tempContainer, {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                scrollX: 0,
                scrollY: 0,
            });

            // Clean up
            document.body.removeChild(tempContainer);

            return canvas.toDataURL("image/jpeg", 0.9);
        } catch (error) {
            console.error("Error capturing schematic:", error);
            return null;
        }
    };

    /**
     * Generates a quote PDF using a simplified approach
     * This builds a clean new content specifically for PDF
     */
    const generateQuote = async (savedSurveyId) => {
        // Simple locking mechanism with console
        console.log("⭐⭐⭐ GENERATING QUOTE - SIMPLIFIED APPROACH ⭐⭐⭐");

        // Basic validation
        if (window.__generating_quote) {
            console.log("Already generating a quote - skipping");
            return;
        }

        if (!schematicRef?.current) {
            console.log("No schematic ref found - skipping quote generation");
            return;
        }

        // Lock to prevent duplicate generation
        window.__generating_quote = true;

        try {
            // 1. Capture schematic image directly - this works well
            console.log("Capturing schematic image...");
            const schematicImgData = await captureSchematic();
            console.log("✓ Schematic captured");

            // 2. Get price total with simplified approach
            let priceTotal = 0;
            try {
                // Try to get computed total first
                const grandTotal = computedGrandTotals();

                if (typeof grandTotal === "number" && !isNaN(grandTotal)) {
                    priceTotal = grandTotal;
                } else if (
                    typeof grandTotal === "object" &&
                    grandTotal.structureTotal
                ) {
                    // Extract the structure total if it's an object
                    priceTotal = Number(grandTotal.structureTotal) || 0;
                }

                // Force to a valid number
                priceTotal = Number(priceTotal) || 0;
                console.log("Price calculation: ", priceTotal);
            } catch (err) {
                console.log("Error calculating price, using 0:", err);
                priceTotal = 0;
            }

            // 3. Build a comprehensive HTML representation that exactly matches the survey form structure
            // Generate HTML template with ALL survey information and exact 1-to-1 layout
            const cleanHtml = `
                <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 800px;">
                    <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #f0f0f0; padding-bottom: 15px;">
                        <h1 style="color: #333; margin-bottom: 10px;">Kitchen Survey</h1>
                        <p style="font-size: 18px;"><strong>Reference:</strong> ${
                            refValue || "N/A"
                        }</p>
                        <p><strong>Date:</strong> ${new Date(
                            surveyDate
                        ).toLocaleDateString()}</p>
                    </div>
                    
                    <!-- Survey Information Section -->
                    <div style="margin-bottom: 30px; border: 1px solid #ddd; padding: 15px; border-radius: 4px;">
                        <h2 style="background-color: #f0f0f0; padding: 8px; margin-top: 0;">Site Details</h2>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                            <div>
                                <p><strong>Site Name:</strong> ${
                                    siteDetails?.name ||
                                    siteDetails?.siteName ||
                                    "N/A"
                                }</p>
                                <p><strong>Address:</strong> ${
                                    siteDetails?.address || "N/A"
                                }</p>
                                <p><strong>Postcode:</strong> ${
                                    siteDetails?.postcode || "N/A"
                                }</p>
                            </div>
                            <div>
                                <p><strong>Survey Type:</strong> ${
                                    operations?.typeOfCooking ||
                                    "Kitchen Deep Clean"
                                }</p>
                                <p><strong>Parking:</strong> ${
                                    parking || "Not specified"
                                }</p>
                                <p><strong>Permit Required:</strong> ${
                                    access?.permit || "No"
                                }</p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Structure Information -->
                    <div style="margin-bottom: 30px; border: 1px solid #ddd; padding: 15px; border-radius: 4px;">
                        <h2 style="background-color: #f0f0f0; padding: 8px; margin-top: 0;">Structure</h2>
                        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;">
                            <div>
                                <p><strong>Structure ID:</strong> ${
                                    structureId || "N/A"
                                }</p>
                            </div>
                            <div>
                                <p><strong>Length (m):</strong> ${
                                    (groupDimensions &&
                                        groupDimensions[structureId]?.length) ||
                                    "N/A"
                                }</p>
                                <p><strong>Width (m):</strong> ${
                                    (groupDimensions &&
                                        groupDimensions[structureId]?.width) ||
                                    "N/A"
                                }</p>
                                <p><strong>Height (m):</strong> ${
                                    (groupDimensions &&
                                        groupDimensions[structureId]?.height) ||
                                    "N/A"
                                }</p>
                            </div>
                            <div>
                                <p><strong>Structure Total:</strong> £${
                                    structureTotal
                                        ? structureTotal.toFixed(2)
                                        : "0.00"
                                }</p>
                            </div>
                        </div>
                        ${
                            structureComments
                                ? `
                        <div style="margin-top: 10px;">
                            <p><strong>Structure Comments:</strong> ${structureComments}</p>
                        </div>
                        `
                                : ""
                        }
                    </div>
                    
                    <!-- Equipment -->
                    <div style="margin-bottom: 30px; border: 1px solid #ddd; padding: 15px; border-radius: 4px;">
                        <h2 style="background-color: #f0f0f0; padding: 8px; margin-top: 0;">Equipment</h2>
                        ${
                            surveyData && surveyData.length > 0
                                ? `
                        <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
                            <tr style="background-color: #f5f5f5;">
                                <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Equipment</th>
                                <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Grade</th>
                                <th style="padding: 8px; text-align: right; border: 1px solid #ddd;">Quantity</th>
                                <th style="padding: 8px; text-align: right; border: 1px solid #ddd;">Price</th>
                            </tr>
                            ${surveyData
                                .map(
                                    (item) => `
                            <tr>
                                <td style="padding: 8px; border: 1px solid #ddd;">${
                                    item.name || "N/A"
                                }</td>
                                <td style="padding: 8px; border: 1px solid #ddd;">${
                                    item.grade || "N/A"
                                }</td>
                                <td style="padding: 8px; text-align: right; border: 1px solid #ddd;">${
                                    item.quantity || 0
                                }</td>
                                <td style="padding: 8px; text-align: right; border: 1px solid #ddd;">£${(
                                    item.price || 0
                                ).toFixed(2)}</td>
                            </tr>
                            `
                                )
                                .join("")}
                        </table>
                        <p><strong>Equipment Total:</strong> £${
                            computedEquipmentTotal
                                ? computedEquipmentTotal().toFixed(2)
                                : "0.00"
                        }</p>
                        `
                                : `<p>No equipment items added</p>`
                        }
                        ${
                            equipment?.notes
                                ? `
                        <div style="margin-top: 10px;">
                            <p><strong>Equipment Notes:</strong> ${equipment.notes}</p>
                        </div>
                        `
                                : ""
                        }
                    </div>
                    
                    <!-- Specialist Equipment -->
                    <div style="margin-bottom: 30px; border: 1px solid #ddd; padding: 15px; border-radius: 4px;">
                        <h2 style="background-color: #f0f0f0; padding: 8px; margin-top: 0;">Specialist Equipment</h2>
                        ${
                            specialistEquipmentData &&
                            specialistEquipmentData.length > 0
                                ? `
                        <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
                            <tr style="background-color: #f5f5f5;">
                                <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Equipment</th>
                                <th style="padding: 8px; text-align: right; border: 1px solid #ddd;">Quantity</th>
                                <th style="padding: 8px; text-align: right; border: 1px solid #ddd;">Price</th>
                            </tr>
                            ${specialistEquipmentData
                                .map(
                                    (item) => `
                            <tr>
                                <td style="padding: 8px; border: 1px solid #ddd;">${
                                    item.name || "N/A"
                                }</td>
                                <td style="padding: 8px; text-align: right; border: 1px solid #ddd;">${
                                    item.quantity || 0
                                }</td>
                                <td style="padding: 8px; text-align: right; border: 1px solid #ddd;">£${(
                                    item.price || 0
                                ).toFixed(2)}</td>
                            </tr>
                            `
                                )
                                .join("")}
                        </table>
                        `
                                : `<p>No specialist equipment items added</p>`
                        }
                    </div>
                    
                    <!-- Canopy Information -->
                    <div style="margin-bottom: 30px; border: 1px solid #ddd; padding: 15px; border-radius: 4px;">
                        <h2 style="background-color: #f0f0f0; padding: 8px; margin-top: 0;">Canopy</h2>
                        ${
                            canopyEntries && canopyEntries.length > 0
                                ? `
                        <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
                            <tr style="background-color: #f5f5f5;">
                                <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Description</th>
                                <th style="padding: 8px; text-align: right; border: 1px solid #ddd;">Dimensions</th>
                                <th style="padding: 8px; text-align: right; border: 1px solid #ddd;">Price</th>
                            </tr>
                            ${canopyEntries
                                .map(
                                    (item) => `
                            <tr>
                                <td style="padding: 8px; border: 1px solid #ddd;">${
                                    item.name || item.description || "Canopy"
                                }</td>
                                <td style="padding: 8px; text-align: right; border: 1px solid #ddd;">${
                                    (item.length ? `L: ${item.length}` : "") +
                                        (item.width
                                            ? ` W: ${item.width}`
                                            : "") +
                                        (item.height
                                            ? ` H: ${item.height}`
                                            : "") || "N/A"
                                }</td>
                                <td style="padding: 8px; text-align: right; border: 1px solid #ddd;">£${(
                                    item.price || 0
                                ).toFixed(2)}</td>
                            </tr>
                            `
                                )
                                .join("")}
                        </table>
                        `
                                : ""
                        }
                        <p><strong>Canopy Total:</strong> £${
                            canopyTotal ? canopyTotal.toFixed(2) : "0.00"
                        }</p>
                    </div>
                    
                    <!-- Schematic List Items -->
                    <div style="margin-bottom: 30px; border: 1px solid #ddd; padding: 15px; border-radius: 4px;">
                        <h2 style="background-color: #f0f0f0; padding: 8px; margin-top: 0;">Schematic List Items</h2>
                        ${
                            placedItems && placedItems.length > 0
                                ? `
                        <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
                            <tr style="background-color: #f5f5f5;">
                                <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Item</th>
                                <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Category</th>
                                <th style="padding: 8px; text-align: right; border: 1px solid #ddd;">Dimensions</th>
                            </tr>
                            ${placedItems
                                .filter((item) => item.name) // Only include items with names
                                .map(
                                    (item) => `
                            <tr>
                                <td style="padding: 8px; border: 1px solid #ddd;">${
                                    item.name || "N/A"
                                }</td>
                                <td style="padding: 8px; border: 1px solid #ddd;">${
                                    item.category || "N/A"
                                }</td>
                                <td style="padding: 8px; text-align: right; border: 1px solid #ddd;">${
                                    (item.length ? `L: ${item.length}` : "") +
                                        (item.width
                                            ? ` W: ${item.width}`
                                            : "") +
                                        (item.height
                                            ? ` H: ${item.height}`
                                            : "") || "N/A"
                                }</td>
                            </tr>
                            `
                                )
                                .join("")}
                        </table>
                        `
                                : `<p>No schematic items added</p>`
                        }
                    </div>
                    
                    <!-- Schematic Information -->
                    <div style="margin-bottom: 30px; border: 1px solid #ddd; padding: 15px; border-radius: 4px;">
                        <h2 style="background-color: #f0f0f0; padding: 8px; margin-top: 0;">Schematic Information</h2>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                            <div>
                                <p><strong>Access Door Price:</strong> £${
                                    accessDoorPrice
                                        ? accessDoorPrice.toFixed(2)
                                        : "0.00"
                                }</p>
                                <p><strong>Ventilation Price:</strong> £${
                                    ventilationPrice
                                        ? ventilationPrice.toFixed(2)
                                        : "0.00"
                                }</p>
                                <p><strong>Air Price:</strong> £${
                                    airPrice ? airPrice.toFixed(2) : "0.00"
                                }</p>
                            </div>
                            <div>
                                <p><strong>Fan Parts Price:</strong> £${
                                    fanPartsPrice
                                        ? fanPartsPrice.toFixed(2)
                                        : "0.00"
                                }</p>
                                <p><strong>Air In/Ex Total:</strong> £${
                                    airInExTotal
                                        ? airInExTotal.toFixed(2)
                                        : "0.00"
                                }</p>
                                <p><strong>Schematic Items Total:</strong> £${
                                    typeof schematicItemsTotal === "object"
                                        ? (
                                              schematicItemsTotal.overall || 0
                                          ).toFixed(2)
                                        : (schematicItemsTotal || 0).toFixed(2)
                                }</p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Ventilation Information -->
                    <div style="margin-bottom: 30px; border: 1px solid #ddd; padding: 15px; border-radius: 4px;">
                        <h2 style="background-color: #f0f0f0; padding: 8px; margin-top: 0;">Ventilation Information</h2>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                            <div>
                                <p><strong>Extract Rate (m³/s):</strong> ${
                                    ventilation?.extractRate || "N/A"
                                }</p>
                                <p><strong>Extract Type:</strong> ${
                                    ventilation?.extractType || "N/A"
                                }</p>
                                <p><strong>Supply Rate (m³/s):</strong> ${
                                    ventilation?.supplyRate || "N/A"
                                }</p>
                            </div>
                            <div>
                                <p><strong>Supply Type:</strong> ${
                                    ventilation?.supplyType || "N/A"
                                }</p>
                                <p><strong>Fan Location:</strong> ${
                                    ventilation?.fanLocation || "N/A"
                                }</p>
                                <p><strong>Atmosphere Discharge:</strong> ${
                                    ventilation?.atmosphereDischarge || "N/A"
                                }</p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Access Requirements -->
                    <div style="margin-bottom: 30px; border: 1px solid #ddd; padding: 15px; border-radius: 4px;">
                        <h2 style="background-color: #f0f0f0; padding: 8px; margin-top: 0;">Access Requirements</h2>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                            <div>
                                <p><strong>Induction Needed:</strong> ${
                                    access?.inductionNeeded || "No"
                                }</p>
                                <p><strong>Maintenance Engineer:</strong> ${
                                    access?.maintenanceEngineer || "No"
                                }</p>
                                <p><strong>Mechanical Engineer:</strong> ${
                                    access?.mechanicalEngineer || "No"
                                }</p>
                                <p><strong>Electrical Engineer:</strong> ${
                                    access?.electricalEngineer || "No"
                                }</p>
                            </div>
                            <div>
                                <p><strong>System Isolated:</strong> ${
                                    access?.systemIsolated || "No"
                                }</p>
                                <p><strong>Roof Access:</strong> ${
                                    access?.roofAccess || "No"
                                }</p>
                                <p><strong>Keys Required:</strong> ${
                                    access?.keysrequired || "No"
                                }</p>
                                <p><strong>Permit to Work:</strong> ${
                                    access?.permitToWork || "No"
                                }</p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Operations Information -->
                    <div style="margin-bottom: 30px; border: 1px solid #ddd; padding: 15px; border-radius: 4px;">
                        <h2 style="background-color: #f0f0f0; padding: 8px; margin-top: 0;">Site Operations</h2>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                            <div>
                                <p><strong>Patron Disruption:</strong> ${
                                    operations?.patronDisruption || "No"
                                }</p>
                                <p><strong>Type of Cooking:</strong> ${
                                    operations?.typeOfCooking || "N/A"
                                }</p>
                                <p><strong>Covers Per Day:</strong> ${
                                    operations?.coversPerDay || "N/A"
                                }</p>
                            </div>
                            <div>
                                <p><strong>Best Service Time:</strong> ${
                                    operations?.bestServiceTime || "N/A"
                                }</p>
                                <p><strong>Best Service Day:</strong> ${
                                    operations?.bestServiceDay || "N/A"
                                }</p>
                                <p><strong>8 Hours Available:</strong> ${
                                    operations?.eightHoursAvailable || "No"
                                }</p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Notes -->
                    <div style="margin-bottom: 30px; border: 1px solid #ddd; padding: 15px; border-radius: 4px;">
                        <h2 style="background-color: #f0f0f0; padding: 8px; margin-top: 0;">Notes</h2>
                        <p><strong>Comments:</strong> ${
                            notes?.comments || "No comments added"
                        }</p>
                        <p><strong>Previous Issues:</strong> ${
                            notes?.previousIssues || "None"
                        }</p>
                        <p><strong>Damage:</strong> ${
                            notes?.damage || "None reported"
                        }</p>
                        <p><strong>Inaccessible Areas:</strong> ${
                            notes?.inaccessibleAreas || "None reported"
                        }</p>
                    </div>
                    
                    <!-- Pricing Summary -->
                    <div style="margin-bottom: 30px; border: 2px solid #ddd; padding: 15px; border-radius: 4px; background-color: #f9f9f9;">
                        <h2 style="background-color: #e0e0e0; padding: 8px; margin-top: 0; text-align: center;">Price Summary</h2>
                        <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
                            <tr style="background-color: #f0f0f0;">
                                <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Item</th>
                                <th style="padding: 8px; text-align: right; border: 1px solid #ddd;">Price</th>
                            </tr>
                            <tr>
                                <td style="padding: 8px; border: 1px solid #ddd;">Structure</td>
                                <td style="padding: 8px; text-align: right; border: 1px solid #ddd;">£${
                                    structureTotal
                                        ? structureTotal.toFixed(2)
                                        : "0.00"
                                }</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px; border: 1px solid #ddd;">Equipment</td>
                                <td style="padding: 8px; text-align: right; border: 1px solid #ddd;">£${
                                    computedEquipmentTotal
                                        ? computedEquipmentTotal().toFixed(2)
                                        : "0.00"
                                }</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px; border: 1px solid #ddd;">Canopy</td>
                                <td style="padding: 8px; text-align: right; border: 1px solid #ddd;">£${
                                    canopyTotal
                                        ? canopyTotal.toFixed(2)
                                        : "0.00"
                                }</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px; border: 1px solid #ddd;">Access Doors</td>
                                <td style="padding: 8px; text-align: right; border: 1px solid #ddd;">£${
                                    accessDoorPrice
                                        ? accessDoorPrice.toFixed(2)
                                        : "0.00"
                                }</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px; border: 1px solid #ddd;">Ventilation</td>
                                <td style="padding: 8px; text-align: right; border: 1px solid #ddd;">£${
                                    ventilationPrice
                                        ? ventilationPrice.toFixed(2)
                                        : "0.00"
                                }</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px; border: 1px solid #ddd;">Air Systems</td>
                                <td style="padding: 8px; text-align: right; border: 1px solid #ddd;">£${
                                    airPrice ? airPrice.toFixed(2) : "0.00"
                                }</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px; border: 1px solid #ddd;">Fan Parts</td>
                                <td style="padding: 8px; text-align: right; border: 1px solid #ddd;">£${
                                    fanPartsPrice
                                        ? fanPartsPrice.toFixed(2)
                                        : "0.00"
                                }</td>
                            </tr>
                            <tr style="font-weight: bold; background-color: #e6e6e6;">
                                <td style="padding: 8px; border: 1px solid #ddd;">Grand Total</td>
                                <td style="padding: 8px; text-align: right; border: 1px solid #ddd;">£${priceTotal.toFixed(
                                    2
                                )}</td>
                            </tr>
                        </table>
                        ${
                            modify > 0
                                ? `
                        <p style="text-align: right;"><strong>Price Modifier:</strong> ${modify}%</p>
                        <p style="text-align: right; font-size: 18px; font-weight: bold;">Final Total: £${(
                            priceTotal *
                            (1 + modify / 100)
                        ).toFixed(2)}</p>
                        `
                                : ""
                        }
                    </div>
                </div>
            `;

            console.log("Created clean HTML for PDF");

            // 4. Create a temporary div to render the clean HTML
            const tempContainer = document.createElement("div");
            tempContainer.style.position = "absolute";
            tempContainer.style.left = "-9999px";
            tempContainer.style.width = "800px"; // Fixed width for PDF
            tempContainer.innerHTML = cleanHtml;
            document.body.appendChild(tempContainer);

            console.log("Created temporary container for PDF content");

            // 5. Capture the clean content directly
            const html2canvas = (await import("html2canvas")).default;
            const canvas = await html2canvas(tempContainer, {
                scale: 2,
                logging: false,
                windowWidth: 800,
            });

            // Get image data
            const imgData = canvas.toDataURL("image/png");
            console.log("✓ PDF content captured");

            // Clean up temporary element
            document.body.removeChild(tempContainer);

            // 6. Create the quote payload
            const quoteName = `Quote-${refValue || ""}-${new Date()
                .toLocaleDateString()
                .replace(/\//g, "-")}`;
            console.log("Quote name:", quoteName);

            // Create simplified quote payload
            const quotePayload = {
                name: quoteName,
                pdfData: imgData,
                schematicImg: schematicImgData,
                surveyData: {
                    priceTotal,
                    surveyId: savedSurveyId,
                },
                surveyId: savedSurveyId,
                siteDetails: siteDetails,
                refValue: refValue,
                totalPrice: priceTotal,
                createdAt: new Date(),
            };

            console.log("Saving quote to database:", {
                name: quoteName,
                surveyId: savedSurveyId,
                totalPrice: priceTotal,
            });

            // 7. Send to API
            const response = await fetch("/api/quotes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(quotePayload),
            });

            const result = await response.json();
            console.log(
                "✓ Quote saved successfully:",
                result.success ? "Success" : "Failed"
            );
        } catch (error) {
            console.error("Error in quote generation:", error);
        } finally {
            // Always unlock
            window.__generating_quote = false;
            console.log("⭐⭐⭐ QUOTE GENERATION COMPLETE ⭐⭐⭐");
        }
    };

    /**
     * Uploads images to Cloudinary via our server API and returns updated image objects
     * @param {Array} images - Array of image objects with files
     * @param {string} siteName - Site name for folder structure
     * @param {string} surveyRef - Survey reference for folder structure
     * @param {string} category - Image category (Structure, Equipment, etc.)
     * @returns {Array} - Updated image objects with Cloudinary URLs
     */
    const uploadImagesToCloudinary = async (
        images,
        siteName,
        surveyRef,
        category
    ) => {
        if (!images || images.length === 0) {
            console.log(`[SaveSurvey] No images to upload for ${category}`);
            return [];
        }

        const uploadedImages = [];
        let siteNameSafe = siteName || "unknown-site";
        siteNameSafe = siteNameSafe.replace(/[:/\\?*"|<>]/g, "-"); // Clean site name for URL

        console.log(
            `[SaveSurvey] Starting upload of ${images.length} images for ${category}`,
            images.map((img) => ({
                hasFile: !!img.file,
                fileType: img.file ? img.file.type : "none",
                fileSize: img.file ? img.file.size : 0,
                isPending: !!img.metadata?.pendingUpload,
                url: img.url ? img.url.substring(0, 20) + "..." : "no url",
            }))
        );

        // Process each image
        for (const image of images) {
            // Enhanced validation and debugging
            if (!image) {
                console.error(
                    `[SaveSurvey] Skipping undefined image object for ${category}`
                );
                continue;
            }

            // Check if the image has a file property and is pending upload
            if (!image.file) {
                console.log(`[SaveSurvey] Image missing file property:`, {
                    url: image.url
                        ? image.url.substring(0, 20) + "..."
                        : "none",
                    alt: image.alt || "none",
                    metadata: image.metadata ? "present" : "missing",
                });
                uploadedImages.push(image); // Keep but don't upload
                continue;
            }

            if (!image.metadata?.pendingUpload) {
                console.log(`[SaveSurvey] Image not pending upload:`, {
                    isPending: !!image.metadata?.pendingUpload,
                    isCloudinary: !!image.publicId,
                });
                uploadedImages.push(image); // Keep but don't upload
                continue;
            }

            // Image is eligible for upload - proceed
            console.log(`[SaveSurvey] Processing image for upload:`, {
                name: image.file?.name || "unknown",
                size: image.file?.size || 0,
                type: image.file?.type || "unknown",
            });

            try {
                // Create folder path using the updated format
                const folder = getSurveyImageFolder(
                    siteName,
                    surveyRef,
                    category
                );

                console.log(
                    `[SaveSurvey] Uploading image to folder: ${folder}`
                );

                // Create form data for upload to our server API
                const formData = new FormData();
                formData.append("file", image.file);
                formData.append("folder", folder);
                formData.append("preserveFilename", "true"); // Preserve original filename without timestamp

                console.log(
                    `[SaveSurvey] Sending to /api/cloudinary/upload with:`,
                    {
                        folder,
                        fileName: image.file.name,
                        fileSize: image.file.size,
                        fileType: image.file.type,
                        preserveFilename: true,
                    }
                );

                // Upload to our server-side API endpoint instead of directly to Cloudinary
                const response = await fetch("/api/cloudinary/upload", {
                    method: "POST",
                    body: formData,
                });

                if (!response.ok) {
                    let errorData;
                    try {
                        errorData = await response.json();
                    } catch (e) {
                        // If response isn't JSON
                        errorData = { message: await response.text() };
                    }

                    console.error(`[SaveSurvey] API error response:`, {
                        status: response.status,
                        statusText: response.statusText,
                        errorData,
                    });

                    throw new Error(
                        `Upload failed: ${
                            errorData.message || response.statusText
                        }`
                    );
                }

                const result = await response.json();
                console.log(`[SaveSurvey] Upload response:`, {
                    success: result.success,
                    publicId: result.data?.public_id || "none",
                    message: result.message || "No message",
                });

                if (!result.success || !result.data) {
                    throw new Error(
                        `Upload failed: ${result.message || "Unknown error"}`
                    );
                }

                const data = result.data;
                console.log(
                    `[SaveSurvey] Successfully uploaded image to Cloudinary: ${data.public_id}`
                );

                // Create uploaded image object with Cloudinary data
                const uploadedImage = {
                    publicId: data.public_id,
                    url: data.secure_url,
                    secureUrl: data.secure_url,
                    alt: image.alt || image.title || "",
                    title: image.title || image.alt || "",
                    format: data.format,
                    width: data.width,
                    height: data.height,
                    uploadedAt: new Date().toISOString(),
                    metadata: {
                        ...image.metadata,
                        pendingUpload: false,
                        cloudinary: true,
                        originalName: image.metadata?.name,
                        category: category, // Ensure category is stored in metadata
                    },
                };

                uploadedImages.push(uploadedImage);

                // Show success notification
                toast.current.show({
                    severity: "success",
                    summary: "Upload Success",
                    detail: `Uploaded image to Cloudinary: ${image.file.name}`,
                    life: 3000,
                });

                // If we were working with blob URLs, revoke them to free up memory
                if (
                    image.url &&
                    typeof image.url === "string" &&
                    image.url.startsWith("blob:")
                ) {
                    URL.revokeObjectURL(image.url);
                }
            } catch (error) {
                console.error(
                    `[SaveSurvey] Error uploading image to Cloudinary:`,
                    error
                );
                toast.current.show({
                    severity: "error",
                    summary: "Upload Error",
                    detail: `Failed to upload image: ${error.message}`,
                    life: 5000,
                });

                // If upload fails, mark the image with an error flag but still include it
                uploadedImages.push({
                    ...image,
                    metadata: {
                        ...image.metadata,
                        uploadError: true,
                        errorMessage: error.message,
                    },
                });
            }
        }

        console.log(
            `[SaveSurvey] Completed processing ${
                uploadedImages.length
            } images for ${category}. Success count: ${
                uploadedImages.filter((img) => img.publicId).length
            }`
        );
        return uploadedImages;
    };

    /**
     * Handles the saving of survey data with Cloudinary image processing
     */
    const handleSaveSurvey = async () => {
        // Enhanced validation - require site selection
        if (!siteDetails || (!siteDetails._id && !siteDetails.id)) {
            toast.current.show({
                severity: "error",
                summary: "Missing Site",
                detail: "Please select a site before saving the survey",
                life: 5000,
            });
            return;
        }

        setIsSubmitting(true);

        // Get images from surveyImagesRef to avoid the dependency in useEffect
        const imagesToProcess = { ...surveyImagesRef.current };

        // Count images by category for logging
        Object.entries(imagesToProcess).forEach(([category, imgs]) => {
            console.log(
                `[SaveSurvey] Category ${category} has ${imgs.length} images`
            );

            // Check for file objects and pending uploads
            const withFiles = imgs.filter((img) => !!img.file).length;
            const pendingUploads = imgs.filter(
                (img) => !!img.metadata?.pendingUpload
            ).length;

            console.log(`[SaveSurvey] Category ${category} status:`, {
                totalImages: imgs.length,
                imagesWithFiles: withFiles,
                pendingUploads: pendingUploads,
            });
        });

        // Process and upload images only if there are any to process
        let processedImages = { ...imagesToProcess };

        const siteName =
            siteDetails?.name || siteDetails?.siteName || "unknown-site";
        const cleanRef = refValue
            ? refValue.replace(/[:/\\?*"|<>]/g, "-")
            : "unknown";

        console.log(
            `[SaveSurvey] Using site name: ${siteName}, ref: ${cleanRef}`
        );

        try {
            // Use Promise.all to wait for ALL category uploads to complete
            console.log(
                "[SaveSurvey] Starting uploads for all categories with Promise.all"
            );

            // Track all upload promises in an array
            const uploadPromises = [];
            const categoryResults = {};

            // For each category, create a promise for uploading all images
            for (const category of Object.keys(processedImages)) {
                if (
                    processedImages[category] &&
                    processedImages[category].length > 0
                ) {
                    console.log(
                        `[SaveSurvey] Queueing ${processedImages[category].length} images for ${category}`
                    );

                    // Create a promise that uploads all images in this category
                    // We'll resolve all these promises in parallel with Promise.all
                    const categoryPromise = (async () => {
                        toast.current.show({
                            severity: "info",
                            summary: `Uploading ${category} Images`,
                            detail: `Starting upload of ${processedImages[category].length} images...`,
                            life: 3000,
                        });

                        // Start the upload for this category
                        const uploadedImages = await uploadImagesToCloudinary(
                            processedImages[category],
                            siteName,
                            cleanRef,
                            category
                        );

                        // Store the result for this category
                        categoryResults[category] = uploadedImages;

                        console.log(
                            `[SaveSurvey] Completed ${uploadedImages.length} images for ${category}`
                        );

                        // Show category completion message
                        toast.current.show({
                            severity: "success",
                            summary: `${category} Uploads Complete`,
                            detail: `Uploaded ${
                                uploadedImages.filter((img) => img.publicId)
                                    .length
                            } images to Cloudinary`,
                            life: 3000,
                        });

                        return uploadedImages;
                    })();

                    // Add this category's promise to our array
                    uploadPromises.push(categoryPromise);
                }
            }

            // Wait for ALL category uploads to complete before proceeding
            if (uploadPromises.length > 0) {
                toast.current.show({
                    severity: "info",
                    summary: "Image Upload in Progress",
                    detail: `Processing ${uploadPromises.length} categories of images for upload...`,
                    life: 5000,
                });

                console.log(
                    `[SaveSurvey] Waiting for ${uploadPromises.length} category uploads to complete...`
                );

                try {
                    await Promise.all(uploadPromises);
                    console.log(
                        "[SaveSurvey] All category uploads completed successfully!"
                    );

                    toast.current.show({
                        severity: "success",
                        summary: "Image Upload Complete",
                        detail: "All images have been successfully uploaded to Cloudinary!",
                        life: 5000,
                    });

                    // Now update the processed images with results from all categories
                    for (const [category, images] of Object.entries(
                        categoryResults
                    )) {
                        processedImages[category] = images;
                    }
                } catch (uploadError) {
                    console.error(
                        "[SaveSurvey] Error during image uploads:",
                        uploadError
                    );
                    toast.current.show({
                        severity: "error",
                        summary: "Upload Error",
                        detail: "Some images failed to upload. Survey will save but some images may be missing.",
                        life: 5000,
                    });
                }
            } else {
                console.log("[SaveSurvey] No images to upload");
            }

            console.log(
                "[SaveSurvey] All images processed for Cloudinary upload"
            );
        } catch (error) {
            console.error("[SaveSurvey] Error processing images:", error);
            toast.current.show({
                severity: "error",
                summary: "Image Processing Error",
                detail: "There was an error uploading images to Cloudinary. The survey will be saved without images.",
                life: 5000,
            });
        }

        // Extract the site ID properly for MongoDB reference - handling both _id and id formats
        const siteId = siteDetails._id || siteDetails.id;

        // Compute main area totals separately without combining with duplicated areas
        const mainAreaTotals = {
            structureTotal: structureTotal,
            equipmentTotal: computedEquipmentTotal(), // computed from main area's surveyData
            canopyTotal: canopyTotal,
            accessDoorPrice: accessDoorPrice,
            ventilationPrice: ventilationPrice,
            airPrice: airPrice,
            fanPartsPrice: fanPartsPrice,
            airInExTotal: airInExTotal,
            schematicItemsTotal: schematicItemsTotal,
            modify: modify,
            groupingId: selectedGroupId, // main area's groupingId
        };

        // Create a copy of contacts with the primary/walkAround flags set correctly
        const processedContacts = contacts.map((contact, index) => {
            return {
                ...contact,
                isPrimaryContact: index === primaryContactIndex,
                isWalkAroundContact: index === walkAroundContactIndex,
            };
        });

        // Create a processed copy of operations data
        const processedOperations = { ...operations };

        // Convert time string values to Date objects for MongoDB
        if (processedOperations.operationalHours) {
            // Process weekdays times
            if (processedOperations.operationalHours.weekdays) {
                const weekdays = processedOperations.operationalHours.weekdays;

                if (weekdays.start) {
                    // Create Date objects from time strings (HH:MM)
                    const [hours, minutes] = weekdays.start
                        .split(":")
                        .map(Number);
                    const startDate = new Date();
                    startDate.setHours(hours, minutes, 0);
                    weekdays.start = startDate;
                }

                if (weekdays.end) {
                    const [hours, minutes] = weekdays.end
                        .split(":")
                        .map(Number);
                    const endDate = new Date();
                    endDate.setHours(hours, minutes, 0);
                    weekdays.end = endDate;
                }
            }

            // Process weekend times
            if (processedOperations.operationalHours.weekend) {
                const weekend = processedOperations.operationalHours.weekend;

                if (weekend.start) {
                    const [hours, minutes] = weekend.start
                        .split(":")
                        .map(Number);
                    const startDate = new Date();
                    startDate.setHours(hours, minutes, 0);
                    weekend.start = startDate;
                }

                if (weekend.end) {
                    const [hours, minutes] = weekend.end.split(":").map(Number);
                    const endDate = new Date();
                    endDate.setHours(hours, minutes, 0);
                    weekend.end = endDate;
                }
            }
        }

        // Extract and validate equipment data
        // Make sure equipmentSubcategoryComments is always an object with deep clone
        const equipmentSubcategoryComments = equipment?.subcategoryComments
            ? JSON.parse(JSON.stringify(equipment.subcategoryComments))
            : {};

        // Make sure equipmentNotes is always a string
        const equipmentNotes = equipment?.notes || "";

        // Make sure specialistCategoryComments is always an object with deep clone
        const specialistCategoryComments = equipment?.categoryComments
            ? JSON.parse(JSON.stringify(equipment.categoryComments))
            : {};

        // Process and validate access door selections, ensuring they have consistent structure
        const processedAccessDoorSelections = {};

        // Process each access door selection to ensure proper structure
        Object.entries(accessDoorSelections).forEach(([itemId, doorData]) => {
            // Make sure each door has the expected properties
            processedAccessDoorSelections[itemId] = {
                // Ensure MongoDB ID is present and prioritized
                mongoId: doorData.mongoId || doorData.id || "",
                id: doorData.mongoId || doorData.id || "",
                name: doorData.name || "Selected Door",
                type: doorData.type || "",
                dimensions: doorData.dimensions || "",
                price: doorData.price || 0,
            };
        });

        // Process duplicated areas to ensure each includes the equipment notes and comments
        const processedAreasState = areasState.map((area) => {
            return {
                ...area,
                // Ensure equipment notes and subcategory comments are included properly
                equipmentNotes: area.equipmentNotes || "",
                equipmentSubcategoryComments:
                    area.equipmentSubcategoryComments || {},
            };
        });

        // Create comprehensive survey payload with standardized top-level images
        const surveyPayload = {
            // Basic info
            refValue: refValue,
            surveyDate: surveyDate,
            site: { _id: siteId }, // Format site reference as object with _id property

            // Contacts - use the processed contacts with flags
            contacts: processedContacts,

            // Site sections - Use dedicated parking field
            general: {
                surveyType:
                    processedOperations.typeOfCooking || "Kitchen Deep Clean",
                parking: parking || "",
                dbs: access.dbs || "Not Required",
                permit: access.permit || "No",
            },

            // Store all images in the top-level images field
            images: processedImages,

            // Section data
            structure: {
                structureId,
                structureTotal,
                selectionData: structureSelectionData || [],
                dimensions: structureDimensions || {},
                structureComments: structureComments || "",
            },

            // Include subcategoryComments in the equipmentSurvey section
            equipmentSurvey: {
                entries: surveyData,
                subcategoryComments: equipmentSubcategoryComments,
                notes: equipmentNotes,
            },

            // Include categoryComments in the specialistEquipmentSurvey section
            specialistEquipmentSurvey: {
                entries: specialistEquipmentData,
                categoryComments: specialistCategoryComments,
                notes: equipment?.notes || "",
            },

            canopySurvey: {
                entries:
                    canopyEntries && canopyEntries.length > 0
                        ? canopyEntries
                        : canopyTotal
                        ? [{ canopyTotal }]
                        : [],
            },
            schematic: {
                // Pricing data
                accessDoorPrice,
                ventilationPrice,
                airPrice,
                fanPartsPrice,
                airInExTotal,
                schematicItemsTotal,
                selectedGroupId,

                // Canvas configuration
                gridSpaces: gridSpaces,
                cellSize: cellSize,

                // Save full collections of selections and dimensions
                accessDoorSelections: processedAccessDoorSelections,
                flexiDuctSelections: flexiDuctSelections,
                groupDimensions: groupDimensions,
                fanGradeSelections: fanGradeSelections,

                // Schematic items with embedded dimensions and selections
                placedItems: placedItems.map((item) => {
                    // Clone the item to avoid modifying the original
                    const updatedItem = { ...item };

                    // Get item key - using same approach as SchematicList.jsx for consistency
                    const getItemKey = (item) => item.id || item._id || "";
                    const itemKey = getItemKey(item);

                    // Only process dimensions for items that potentially need them
                    if (
                        item.requiresDimensions ||
                        item.category === "Air" ||
                        item.category === "Grease"
                    ) {
                        // IMPROVED: Extract dimensions with more robust handling
                        // Get existing dimensions from item with null/undefined checks
                        const existingItemDims = {
                            length:
                                item.length !== undefined &&
                                item.length !== null
                                    ? item.length
                                    : "",
                            width:
                                item.width !== undefined && item.width !== null
                                    ? item.width
                                    : "",
                            height:
                                item.height !== undefined &&
                                item.height !== null
                                    ? item.height
                                    : "",
                        };

                        // Get dimensions from groupDimensions with safer access
                        // Check for dimensions using both the direct key and aggregated keys
                        const findItemDimensions = (item, groupDimensions) => {
                            // First try direct key lookup
                            const directKey = getItemKey(item);
                            if (groupDimensions && groupDimensions[directKey]) {
                                return groupDimensions[directKey];
                            }

                            // If item has a name, try lowercase name-based lookup
                            if (item.name) {
                                const nameLower = item.name
                                    .trim()
                                    .toLowerCase();

                                // Check if any key in groupDimensions contains the item name
                                for (const key in groupDimensions) {
                                    if (key.includes(nameLower)) {
                                        return groupDimensions[key];
                                    }
                                }
                            }

                            // If we get here, no dimensions were found
                            return { length: "", width: "", height: "" };
                        };

                        // Get dimensions using the improved lookup function
                        const groupDims = findItemDimensions(
                            item,
                            groupDimensions
                        );

                        // Initialize dimensions - use group dimensions as priority source
                        let finalLength =
                            groupDims.length !== ""
                                ? String(groupDims.length)
                                : "";
                        let finalWidth =
                            groupDims.width !== ""
                                ? String(groupDims.width)
                                : "";
                        let finalHeight =
                            groupDims.height !== ""
                                ? String(groupDims.height)
                                : "";

                        // Fall back to existing item dimensions if needed
                        if (
                            finalLength === "" &&
                            existingItemDims.length !== ""
                        ) {
                            finalLength = String(existingItemDims.length);
                        }
                        if (
                            finalWidth === "" &&
                            existingItemDims.width !== ""
                        ) {
                            finalWidth = String(existingItemDims.width);
                        }
                        if (
                            finalHeight === "" &&
                            existingItemDims.height !== ""
                        ) {
                            finalHeight = String(existingItemDims.height);
                        }

                        // Check if dimensions exist in groupDimensions object first
                        if (groupDimensions && groupDimensions[itemKey]) {
                            // If any dimensions are explicitly set in groupDimensions, use them
                            finalLength = groupDimensions[itemKey].length
                                ? String(groupDimensions[itemKey].length)
                                : finalLength;
                            finalWidth = groupDimensions[itemKey].width
                                ? String(groupDimensions[itemKey].width)
                                : finalWidth;
                            finalHeight = groupDimensions[itemKey].height
                                ? String(groupDimensions[itemKey].height)
                                : finalHeight;
                        }

                        // Only as a last resort for Air and Grease items, default to "1" if still empty
                        if (
                            (item.category === "Air" ||
                                item.category === "Grease") &&
                            (finalLength === "" ||
                                finalWidth === "" ||
                                finalHeight === "")
                        ) {
                            finalLength = finalLength || "1";
                            finalWidth = finalWidth || "1";
                            finalHeight = finalHeight || "1";
                        }

                        // DIRECT ASSIGNMENT: Set dimensions directly on updatedItem
                        // Using direct assignment with explicit string conversion
                        updatedItem.length = String(finalLength);
                        updatedItem.width = String(finalWidth);
                        updatedItem.height = String(finalHeight);
                    } else {
                        // For items that don't need dimensions, ensure they have empty strings
                        updatedItem.length = "";
                        updatedItem.width = "";
                        updatedItem.height = "";
                    }

                    // If we have access door selection for this item, include it
                    if (
                        item.category &&
                        item.category.toLowerCase() === "access doors"
                    ) {
                        const doorSelection =
                            processedAccessDoorSelections &&
                            processedAccessDoorSelections[itemKey];
                        if (doorSelection) {
                            updatedItem.selectedDoorId =
                                doorSelection.mongoId || doorSelection.id || "";
                            updatedItem.selectedDoorType =
                                doorSelection.type || "";
                            updatedItem.selectedDoorName =
                                doorSelection.name || "";
                        }
                    }

                    return updatedItem;
                }),
                specialItems, // Include special items
            },

            // Form sections
            ventilationInfo: {
                ...ventilation,
                accessLocations: ventilation.accessLocations || [],
            },
            access: access,

            // Keep this for backward compatibility
            specialistEquipment: {
                ...equipment,
                // Explicitly copy these fields to maintain backward compatibility
                acroPropsToggle: equipment?.acroPropsToggle || "No",
                loftBoardsToggle: equipment?.loftBoardsToggle || "No",
                scaffBoardsToggle: equipment?.scaffBoardsToggle || "No",
                laddersToggle: equipment?.laddersToggle || "No",
                mobileScaffoldTower: equipment?.mobileScaffoldTower || "No",
                flexiHose: equipment?.flexiHose || "No",
                flexiHoseCircumference: equipment?.flexiHoseCircumference || "",
                flexiHoseLength: equipment?.flexiHoseLength || "",
                mewp: equipment?.mewp || "No",
                notes: equipment?.notes || "",
            },

            operations: operations, // operations no longer contains parking
            notes: notes, // The notes object should already have obstructions as an array

            // Areas and totals - include updated area state with equipment notes
            totals: {
                mainArea: mainAreaTotals,
                duplicatedAreas: processedAreasState, // Use processed areas that include equipment notes
                grandTotal: computedGrandTotals(), // Grand total for all areas
                modify: modify,
            },
            duplicatedAreas: processedAreasState, // Use processed areas that include equipment notes
        };

        // Fix the type issues with schematicItemsTotal without logging the large payloads
        if (typeof surveyPayload.schematic.schematicItemsTotal === "object") {
            surveyPayload.schematic.schematicItemsTotal =
                surveyPayload.schematic.schematicItemsTotal.overall || 0;
        }

        if (
            typeof surveyPayload.totals.mainArea.schematicItemsTotal ===
            "object"
        ) {
            surveyPayload.totals.mainArea.schematicItemsTotal =
                surveyPayload.totals.mainArea.schematicItemsTotal.overall || 0;
        }

        // Ensure grandTotal has numeric values
        if (surveyPayload.totals.grandTotal) {
            if (
                typeof surveyPayload.totals.grandTotal.schematicItemsTotal ===
                "object"
            ) {
                surveyPayload.totals.grandTotal.schematicItemsTotal =
                    surveyPayload.totals.grandTotal.schematicItemsTotal
                        .overall || 0;
            } else if (
                typeof surveyPayload.totals.grandTotal.schematicItemsTotal ===
                "string"
            ) {
                // Handle string representation of object
                if (
                    surveyPayload.totals.grandTotal.schematicItemsTotal.includes(
                        "[object Object]"
                    )
                ) {
                    surveyPayload.totals.grandTotal.schematicItemsTotal = 0;
                } else {
                    surveyPayload.totals.grandTotal.schematicItemsTotal =
                        Number(
                            surveyPayload.totals.grandTotal.schematicItemsTotal
                        ) || 0;
                }
            }
        }

        try {
            let res;
            // If editing existing, use PUT; otherwise POST
            if (surveyId) {
                res = await fetch(
                    `/api/surveys/kitchenSurveys/viewAll/${surveyId}`,
                    {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(surveyPayload),
                    }
                );
            } else {
                res = await fetch("/api/surveys/kitchenSurveys", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(surveyPayload),
                });
            }

            const json = await res.json();

            if (json.success) {
                toast.current.show({
                    severity: "success",
                    summary: "Success",
                    detail: surveyId
                        ? "Survey updated successfully!"
                        : "Survey saved successfully!",
                });

                // Automatically generate quote for the saved survey without nested function calls
                if (json.data && (json.data._id || json.data.id)) {
                    const savedId = json.data._id || json.data.id;
                    console.log(
                        `[SaveSurvey] Survey saved with ID: ${savedId}, DIRECT call to generate quote`
                    );
                    console.log(
                        `[SaveSurvey] SINGLE GENERATION - TIMESTAMP: ${new Date().toISOString()}`
                    );

                    // Call the function directly with proper error handling
                    try {
                        await generateQuote(savedId);
                        console.log(
                            `[SaveSurvey] Quote generated successfully for survey: ${savedId}`
                        );
                    } catch (quoteError) {
                        console.error(
                            "[SaveSurvey] ERROR IN DIRECT QUOTE GENERATION:",
                            quoteError
                        );
                        window.__inProgressQuoteGeneration = false; // Ensure flag is reset on error
                    }
                }

                console.log(
                    `[SaveSurvey] TIMESTAMP BEFORE REDIRECT: ${new Date().toISOString()}`
                );

                // Add longer delay to ensure uploads have time to complete
                // and user can see confirmation messages
                toast.current.show({
                    severity: "success",
                    summary: "Save Complete",
                    detail: "Survey saved successfully and all uploads completed!",
                    life: 5000,
                });

                // Redirect back to site page or surveys list after delay
                if (siteDetails && siteDetails._id) {
                    console.log(
                        `[SaveSurvey] Will redirect to site page after delay: /database/clients/site/${siteDetails._id}`
                    );

                    // Use a longer timeout to ensure uploads completely finish and user sees success messages
                    setTimeout(() => {
                        router.push(
                            `/database/clients/site/${siteDetails._id}`
                        );
                    }, 3000); // Increased to 3 seconds to ensure uploads complete
                } else {
                    console.log(
                        "[SaveSurvey] Will redirect to surveys list after delay"
                    );

                    // Use a longer timeout to ensure uploads completely finish and user sees success messages
                    setTimeout(() => {
                        router.push("/surveys");
                    }, 3000); // Increased to 3 seconds to ensure uploads complete
                }
            } else {
                // Enhanced error handling to show validation errors
                console.error("[SaveSurvey] API Error Response:", json);
                if (json.errors) {
                    console.error(
                        "[SaveSurvey] Validation errors:",
                        json.errors
                    );
                    const errorDetails = Object.entries(json.errors)
                        .map(([field, message]) => `${field}: ${message}`)
                        .join(", ");
                    throw new Error(`Validation error: ${errorDetails}`);
                } else {
                    throw new Error(json.message || "Failed to save survey");
                }
            }
        } catch (error) {
            console.error("[SaveSurvey] Error saving survey:", error);
            toast.current.show({
                severity: "error",
                summary: "Error",
                detail: error.message || "Error saving survey",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <Toast ref={toast} />
            <div
                style={{
                    position: "fixed",
                    bottom: "1rem",
                    right: "1rem",
                    zIndex: 1000,
                }}
            >
                <button
                    onClick={handleSaveSurvey}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    disabled={isSubmitting}
                    style={{
                        padding: "0.75rem 1.5rem",
                        fontSize: "1rem",
                        backgroundColor: isHovered ? "#F9C400" : "#7e7e7e",
                        color: "#fff",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        transition: "background-color 0.2s ease",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                    }}
                >
                    {isSubmitting && (
                        <i
                            className="pi pi-spin pi-spinner"
                            style={{ fontSize: "1.2rem" }}
                        ></i>
                    )}
                    {surveyId ? "Update Survey" : "Save Survey"}
                </button>
            </div>
        </>
    );
}

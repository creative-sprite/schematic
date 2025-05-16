// components/kitchenSurvey/save/SaveSurvey.jsx
import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Toast } from "primereact/toast";
import { ProgressBar } from "primereact/progressbar";
import {
    computeEquipmentTotal,
    computeGrandTotals,
} from "../pricing/PricingUtils";
import { getSurveyImageFolder } from "@/lib/cloudinary";

// Utility function to generate Cloudinary URLs consistently
const getCloudinaryUrl = (publicId) => {
    const cloudName =
        process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dnu5hunya";
    return `https://res.cloudinary.com/${cloudName}/image/upload/${publicId}`;
};

/**
 * Component for handling survey saving functionality with automatic quote generation
 */
export default function SaveSurvey({
    // Reference to the form content for PDF capture
    targetRef,
    // Reference for capturing schematic in quotes
    schematicRef,
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
    canopyComments = {}, // Add canopyComments prop with default empty object
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
    modify,
    // Survey images directly passed from parent - standardized location only
    surveyImages = {},
    // Schematic data props
    placedItems = [],
    specialItems = [],
    gridSpaces = 26,
    cellSize = 40,
    accessDoorSelections = {},
    fanGradeSelections = {},
    flexiDuctSelections = {},
    // Collection-related props
    collectionId = null,
    areaIndex = 0,
    totalAreas = 1,
    // Survey creation function
    createSurveyIfNeeded = null,
    // Optional function to update parent pagination
    updateParentPagination = null,
}) {
    const router = useRouter();
    const toast = useRef(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    // New state for tracking upload progress
    const [uploadProgress, setUploadProgress] = useState({
        active: false,
        total: 0,
        completed: 0,
        message: "",
    });

    // Track the active quote generation
    const quoteGenerationTimerRef = useRef(null);

    // Debugging ref to track equipment state
    const equipmentDebugRef = useRef({
        lastEquipment: null,
        hasSubcategoryComments: false,
        commentCount: 0,
    });

    // Update the debug ref when equipment changes
    useEffect(() => {
        if (equipment) {
            equipmentDebugRef.current = {
                lastEquipment: equipment,
                hasSubcategoryComments: !!equipment.subcategoryComments,
                commentCount: equipment.subcategoryComments
                    ? Object.keys(equipment.subcategoryComments).length
                    : 0,
            };

            console.log(
                "SaveSurvey: Equipment updated:",
                equipment.subcategoryComments
                    ? `Has ${
                          Object.keys(equipment.subcategoryComments).length
                      } comments`
                    : "Missing subcategoryComments"
            );
        }
    }, [equipment]);

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (quoteGenerationTimerRef.current) {
                clearTimeout(quoteGenerationTimerRef.current);
            }
        };
    }, []);

    // Memoized equipment total calculation
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

    // Memoized grand totals calculation - main area only
    const computedGrandTotals = () => {
        // Create object with main area totals
        const mainTotals = {
            structureTotal: structureTotal,
            equipmentTotal: computedEquipmentTotal(),
            canopyTotal: canopyTotal,
            accessDoorPrice: accessDoorPrice,
            ventilationPrice: ventilationPrice,
            airPrice: airPrice,
            fanPartsPrice: fanPartsPrice,
            airInExTotal: airInExTotal,
            schematicItemsTotal: schematicItemsTotal,
            modify: modify,
            groupingId: selectedGroupId,
        };

        // Use utility function to compute totals for main area only
        return computeGrandTotals(mainTotals, []);
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
     * Simplified function to generate a quote PDF
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
                                    structureDimensions?.length || "N/A"
                                }</p>
                                <p><strong>Width (m):</strong> ${
                                    structureDimensions?.width || "N/A"
                                }</p>
                                <p><strong>Height (m):</strong> ${
                                    structureDimensions?.height || "N/A"
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
     * Simplified function to upload a single image to Cloudinary
     * Returns the uploaded image data, or null on failure
     */
    const uploadSingleImage = async (image, category, siteName, surveyRef) => {
        if (!image || !image.file) {
            console.log(`[SaveSurvey] Cannot upload image - missing file`);
            return null;
        }

        try {
            // Create folder path using helper function
            const folder = getSurveyImageFolder(siteName, surveyRef, category);

            console.log(`[SaveSurvey] Uploading image to folder: ${folder}`);

            // Create form data for upload
            const formData = new FormData();
            formData.append("file", image.file);
            formData.append("folder", folder);
            formData.append("preserveFilename", "true"); // Preserve original filename

            // Upload to server API endpoint
            const response = await fetch("/api/cloudinary/upload", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(
                    `Upload failed: ${response.statusText} - ${errorText}`
                );
            }

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.message || "Upload failed");
            }

            const data = result.data;

            // Return uploaded image data with simplified structure
            return {
                publicId: data.public_id,
                url: data.secure_url,
                category: category,
                uploaded: true,
            };
        } catch (error) {
            console.error(`[SaveSurvey] Error uploading image:`, error);
            return null;
        }
    };

    /**
     * Simplified batch upload function with progress tracking
     */
    const uploadAllImages = async (images, siteName, surveyRef) => {
        // Count total images that need uploading
        let totalImagesToUpload = 0;
        let imagesToUpload = [];

        // Create flat list of all images that need uploading
        Object.entries(images).forEach(([category, categoryImages]) => {
            categoryImages.forEach((image) => {
                // Only include images with files that haven't been uploaded
                if (image.file && !image.uploaded) {
                    totalImagesToUpload++;
                    imagesToUpload.push({
                        ...image,
                        category,
                    });
                }
            });
        });

        // If no images to upload, return original images
        if (totalImagesToUpload === 0) {
            console.log("[SaveSurvey] No images need uploading");
            return images;
        }

        // Initialize progress
        setUploadProgress({
            active: true,
            total: totalImagesToUpload,
            completed: 0,
            message: `Starting upload of ${totalImagesToUpload} images...`,
        });

        // Make a copy of the images object to update
        const updatedImages = JSON.parse(JSON.stringify(images));

        // Process each image
        for (let i = 0; i < imagesToUpload.length; i++) {
            const image = imagesToUpload[i];
            const { category } = image;

            // Update progress
            setUploadProgress((prev) => ({
                ...prev,
                completed: i,
                message: `Uploading image ${
                    i + 1
                } of ${totalImagesToUpload}...`,
            }));

            // Upload the image
            const uploadedImage = await uploadSingleImage(
                image,
                category,
                siteName,
                surveyRef
            );

            // Find the image in our updatedImages and update it
            if (uploadedImage) {
                const index = updatedImages[category].findIndex(
                    (img) =>
                        img.id === image.id ||
                        (img.url === image.url && !img.publicId)
                );

                if (index !== -1) {
                    // Update with uploaded data
                    updatedImages[category][index] = {
                        ...updatedImages[category][index],
                        publicId: uploadedImage.publicId,
                        url: uploadedImage.url,
                        uploaded: true,
                        file: null, // Remove file reference after upload
                    };
                }
            }
        }

        // Complete progress
        setUploadProgress({
            active: false,
            total: totalImagesToUpload,
            completed: totalImagesToUpload,
            message: `Completed upload of ${totalImagesToUpload} images`,
        });

        return updatedImages;
    };

    /**
     * IMPROVED: Function to directly capture equipment comments from DOM
     * This serves as a fallback if state-based comments are missing
     */
    const captureEquipmentCommentsFromDOM = () => {
        const capturedComments = {};

        if (typeof document !== "undefined") {
            try {
                // Target all subcategory comment textareas by their ID pattern
                const commentTextareas = document.querySelectorAll(
                    '[id^="subcategory-comment-"]'
                );

                // Log the total found
                console.log(
                    `[SaveSurvey] Found ${commentTextareas.length} equipment comment textareas in DOM`
                );

                commentTextareas.forEach((textarea) => {
                    if (textarea.value && textarea.value.trim()) {
                        // Extract subcategory from ID by removing the prefix and converting hyphens back to spaces
                        const idParts = textarea.id.split("-");
                        if (idParts.length >= 3) {
                            const subcategoryId = idParts.slice(2).join("-");
                            const subcategory = subcategoryId.replace(
                                /-/g,
                                " "
                            );
                            capturedComments[subcategory] =
                                textarea.value.trim();

                            console.log(
                                `[SaveSurvey] Captured comment for subcategory: "${subcategory}"`
                            );
                        }
                    }
                });

                // Also check for orphaned comments (those without equipment entries)
                const orphanedCommentTextareas = document.querySelectorAll(
                    '[id^="orphaned-comment-"]'
                );

                console.log(
                    `[SaveSurvey] Found ${orphanedCommentTextareas.length} orphaned comment textareas in DOM`
                );

                orphanedCommentTextareas.forEach((textarea) => {
                    if (textarea.value && textarea.value.trim()) {
                        const idParts = textarea.id.split("-");
                        if (idParts.length >= 3) {
                            const subcategoryId = idParts.slice(2).join("-");
                            const subcategory = subcategoryId.replace(
                                /-/g,
                                " "
                            );
                            capturedComments[subcategory] =
                                textarea.value.trim();

                            console.log(
                                `[SaveSurvey] Captured orphaned comment for subcategory: "${subcategory}"`
                            );
                        }
                    }
                });

                console.log(
                    "[SaveSurvey] Directly captured",
                    Object.keys(capturedComments).length,
                    "comments from DOM"
                );
            } catch (error) {
                console.error(
                    "[SaveSurvey] Error capturing comments from DOM:",
                    error
                );
            }
        }

        return capturedComments;
    };

    /**
     * NEW: Function to directly capture specialist equipment category comments from DOM
     * This serves as a fallback if state-based comments are missing
     */
    const captureSpecialistCategoryCommentsFromDOM = () => {
        const capturedComments = {};

        if (typeof document !== "undefined") {
            try {
                // Target all category comment textareas by their ID pattern
                const commentTextareas = document.querySelectorAll(
                    '[id^="category-comment-"]'
                );

                console.log(
                    "[SaveSurvey] Found",
                    commentTextareas.length,
                    "specialist category comment textareas in DOM"
                );

                commentTextareas.forEach((textarea) => {
                    if (textarea.value && textarea.value.trim()) {
                        // Extract category from ID by removing the prefix and converting hyphens back to spaces
                        const idParts = textarea.id.split("-");
                        if (idParts.length >= 3) {
                            const categoryId = idParts.slice(2).join("-");
                            const category = categoryId.replace(/-/g, " ");
                            capturedComments[category] = textarea.value.trim();
                            console.log(
                                "[SaveSurvey] Captured comment for category:",
                                category
                            );
                        }
                    }
                });

                console.log(
                    "[SaveSurvey] Directly captured",
                    Object.keys(capturedComments).length,
                    "specialist category comments from DOM"
                );
            } catch (error) {
                console.error(
                    "[SaveSurvey] Error capturing specialist category comments from DOM:",
                    error
                );
            }
        }

        return capturedComments;
    };

    /**
     * IMPROVED: Simplified function to sync comments before saving
     * This directly calls component methods to force updates
     */
    const syncComponentStates = () => {
        console.log("[SaveSurvey] Syncing component states before saving");

        // Try to sync canopy comments using Area1Logic's method
        let canopySynced = false;
        if (
            typeof window !== "undefined" &&
            window.area1LogicInstance &&
            typeof window.area1LogicInstance.syncCanopyComments === "function"
        ) {
            canopySynced = window.area1LogicInstance.syncCanopyComments();
            console.log("[SaveSurvey] Canopy comments synced:", canopySynced);
        }

        // Try to sync equipment subcategory comments
        let equipmentSynced = false;
        if (
            typeof window !== "undefined" &&
            window.equipmentComponentInstance &&
            typeof window.equipmentComponentInstance.syncSubcategoryComments ===
                "function"
        ) {
            equipmentSynced =
                window.equipmentComponentInstance.syncSubcategoryComments();
            console.log(
                "[SaveSurvey] Equipment comments synced:",
                equipmentSynced
            );
        }

        // Try to sync specialist equipment category comments
        let specialistSynced = false;
        if (
            typeof window !== "undefined" &&
            window.specialistEquipmentInstance &&
            typeof window.specialistEquipmentInstance.syncChanges === "function"
        ) {
            specialistSynced = window.specialistEquipmentInstance.syncChanges();
            console.log(
                "[SaveSurvey] Specialist equipment category comments synced:",
                specialistSynced
            );
        } else {
            console.log(
                "[SaveSurvey] No specialist equipment instance found for syncing"
            );
        }

        // Try direct component access as fallback
        if (
            !canopySynced &&
            typeof window !== "undefined" &&
            window.canopyComponentInstance
        ) {
            if (
                typeof window.canopyComponentInstance.forceUpdateComments ===
                "function"
            ) {
                canopySynced =
                    window.canopyComponentInstance.forceUpdateComments();
                console.log(
                    "[SaveSurvey] Canopy comments synced via direct component access:",
                    canopySynced
                );
            }
        }

        // Increase delay to ensure updates have been processed
        return new Promise((resolve) => setTimeout(resolve, 300));
    };

    /**
     * FIXED: Simplified save survey function
     */
    const handleSaveSurvey = async (
        shouldRedirect = true,
        manualCollectionId = null
    ) => {
        // Protect against double submission
        if (isSubmitting) {
            console.log("[SaveSurvey] Already submitting - ignoring click");
            return;
        }

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

        try {
            // IMPROVED: Sync component states before proceeding
            await syncComponentStates();

            // Short pause to ensure all state updates have been processed
            await new Promise((resolve) => setTimeout(resolve, 500));

            // Extract site info for folder structure
            const siteName =
                siteDetails?.name || siteDetails?.siteName || "unknown-site";
            const cleanRef = refValue
                ? refValue.replace(/[:/\\?*"|<>]/g, "-")
                : "unknown";

            // 1. Upload all images that need uploading
            const updatedImages = await uploadAllImages(
                surveyImages,
                siteName,
                cleanRef
            );

            // 2. Extract the site ID properly for MongoDB reference
            const siteId = siteDetails._id || siteDetails.id;

            // 3. Process contacts with the primary/walkAround flags
            const processedContacts = contacts.map((contact, index) => ({
                ...contact,
                isPrimaryContact: index === primaryContactIndex,
                isWalkAroundContact: index === walkAroundContactIndex,
            }));

            // 4. Prepare normalized structure data
            const normalizedSelectionData = (structureSelectionData || []).map(
                (item) => ({
                    type: item.type || "",
                    item: item.item || "",
                    grade: item.grade || "",
                })
            );

            const normalizedDimensions = {
                length:
                    structureDimensions?.length !== undefined
                        ? Number(structureDimensions.length)
                        : null,
                width:
                    structureDimensions?.width !== undefined
                        ? Number(structureDimensions.width)
                        : null,
                height:
                    structureDimensions?.height !== undefined
                        ? Number(structureDimensions.height)
                        : null,
            };

            // Log equipment and comments state before saving
            console.log(
                "[SaveSurvey] Equipment object at save time:",
                equipment ? "present" : "missing",
                equipment?.subcategoryComments
                    ? `with ${
                          Object.keys(equipment.subcategoryComments).length
                      } comments`
                    : "WITHOUT subcategoryComments"
            );

            console.log(
                "[SaveSurvey] Canopy comments at save time:",
                canopyComments
                    ? `${Object.keys(canopyComments).length} comments`
                    : "None"
            );

            // IMPROVED: Direct capture of equipment comments from DOM
            const domCapturedComments = captureEquipmentCommentsFromDOM();

            // NEW: Direct capture of specialist category comments from DOM
            const domCapturedSpecialistComments =
                captureSpecialistCategoryCommentsFromDOM();

            // Create a final subcategoryComments object with prioritized sources
            const finalSubcategoryComments = {
                // Start with any existing comments from equipment object
                ...(equipment?.subcategoryComments || {}),
                // Add any comments captured from DOM (these will override if keys match)
                ...domCapturedComments,
            };

            // NEW: Create a final specialist categoryComments object with prioritized sources
            const finalSpecialistCategoryComments = {
                // Start with any existing comments from equipment object
                ...(equipment?.categoryComments || {}),
                // Add any comments captured from DOM (these will override if keys match)
                ...domCapturedSpecialistComments,
            };

            console.log(
                "[SaveSurvey] Final subcategoryComments for saving:",
                Object.keys(finalSubcategoryComments).length > 0
                    ? `${Object.keys(finalSubcategoryComments).length} comments`
                    : "Empty object"
            );

            console.log(
                "[SaveSurvey] Final specialist categoryComments for saving:",
                Object.keys(finalSpecialistCategoryComments).length > 0
                    ? `${
                          Object.keys(finalSpecialistCategoryComments).length
                      } comments`
                    : "Empty object"
            );

            // Use provided collection ID if available
            const effectiveCollectionId = manualCollectionId || collectionId;

            // 5. Create the survey payload with simplified structure
            const surveyPayload = {
                // Basic info
                refValue: refValue,
                surveyDate: surveyDate,
                site: { _id: siteId },
                contacts: processedContacts,

                // Include collection information if this is part of a collection
                ...(effectiveCollectionId
                    ? {
                          collectionId: effectiveCollectionId,
                          areaIndex: areaIndex,
                      }
                    : {}),

                // General info
                general: {
                    surveyType:
                        operations.typeOfCooking || "Kitchen Deep Clean",
                    parking: parking || "",
                    dbs: access.dbs || "Not Required",
                    permit: access.permit || "No",
                },

                // Images in standardized format - just publicId and category
                images: {
                    Structure: updatedImages.Structure.map((img) => ({
                        publicId: img.publicId,
                        url: img.url,
                        category: "Structure",
                    })).filter((img) => img.publicId),

                    Equipment: updatedImages.Equipment.map((img) => ({
                        publicId: img.publicId,
                        url: img.url,
                        category: "Equipment",
                    })).filter((img) => img.publicId),

                    Canopy: updatedImages.Canopy.map((img) => ({
                        publicId: img.publicId,
                        url: img.url,
                        category: "Canopy",
                    })).filter((img) => img.publicId),

                    Ventilation: updatedImages.Ventilation.map((img) => ({
                        publicId: img.publicId,
                        url: img.url,
                        category: "Ventilation",
                    })).filter((img) => img.publicId),
                },

                // Section data
                structure: {
                    structureId,
                    structureTotal,
                    selectionData: normalizedSelectionData,
                    dimensions: normalizedDimensions,
                    structureComments: structureComments || "",
                },

                // IMPROVED: Use finalSubcategoryComments that combines state and DOM captures
                equipmentSurvey: {
                    entries: surveyData,
                    subcategoryComments: finalSubcategoryComments,
                },

                // IMPROVED: Use finalSpecialistCategoryComments that combines state and DOM captures
                specialistEquipmentSurvey: {
                    entries: specialistEquipmentData,
                    categoryComments: finalSpecialistCategoryComments,
                },

                // IMPROVED: Use current canopyComments state directly
                canopySurvey: {
                    entries:
                        canopyEntries && canopyEntries.length > 0
                            ? canopyEntries
                            : canopyTotal
                            ? [{ canopyTotal }]
                            : [],
                    comments: canopyComments || {}, // Use current state
                },

                schematic: {
                    accessDoorPrice,
                    ventilationPrice,
                    airPrice,
                    fanPartsPrice,
                    airInExTotal,
                    schematicItemsTotal:
                        typeof schematicItemsTotal === "object"
                            ? schematicItemsTotal.overall || 0
                            : schematicItemsTotal,
                    selectedGroupId,
                    gridSpaces,
                    cellSize,
                    accessDoorSelections,
                    flexiDuctSelections,
                    fanGradeSelections,
                    placedItems,
                    specialItems,
                },

                // Form sections
                ventilationInfo: {
                    ...ventilation,
                    accessLocations: ventilation.accessLocations || [],
                },
                access: access,

                specialistEquipment: {
                    acroPropsToggle: equipment?.acroPropsToggle || "No",
                    loftBoardsToggle: equipment?.loftBoardsToggle || "No",
                    scaffBoardsToggle: equipment?.scaffBoardsToggle || "No",
                    laddersToggle: equipment?.laddersToggle || "No",
                    mobileScaffoldTower: equipment?.mobileScaffoldTower || "No",
                    flexiHose: equipment?.flexiHose || "No",
                    flexiHoseCircumference:
                        equipment?.flexiHoseCircumference || "",
                    flexiHoseLength: equipment?.flexiHoseLength || "",
                    mewp: equipment?.mewp || "No",
                    // Store category comments in the specialistEquipment section too
                    categoryComments: finalSpecialistCategoryComments,
                },

                operations: operations,
                notes: notes,

                // UPDATED: Simplified totals with main area only
                totals: {
                    mainArea: {
                        structureTotal,
                        equipmentTotal: computedEquipmentTotal(),
                        canopyTotal,
                        accessDoorPrice,
                        ventilationPrice,
                        airPrice,
                        fanPartsPrice,
                        airInExTotal,
                        schematicItemsTotal:
                            typeof schematicItemsTotal === "object"
                                ? schematicItemsTotal.overall || 0
                                : schematicItemsTotal,
                        modify,
                        groupingId: selectedGroupId,
                    },
                    grandTotal: computedGrandTotals(),
                    modify: modify,
                },
            };

            // Log critical parts of the payload
            console.log("[SaveSurvey] Final payload structure:", {
                hasEquipmentSurvey: !!surveyPayload.equipmentSurvey,
                hasSubcategoryComments:
                    !!surveyPayload.equipmentSurvey?.subcategoryComments,
                subcategoryCommentsCount: Object.keys(
                    surveyPayload.equipmentSurvey?.subcategoryComments || {}
                ).length,
                hasCanopyComments: !!surveyPayload.canopySurvey?.comments,
                canopyCommentsCount: Object.keys(
                    surveyPayload.canopySurvey?.comments || {}
                ).length,
                hasSpecialistCategoryComments:
                    Object.keys(
                        surveyPayload.specialistEquipmentSurvey
                            .categoryComments || {}
                    ).length > 0,
            });

            // 6. Save the survey
            let res;

            console.log(
                `[SaveSurvey] ${
                    surveyId ? "Updating" : "Creating"
                } survey with payload`
            );

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

            // FIXED: Enhanced error handling for the API response
            if (!res.ok) {
                const errorText = await res.text();
                console.error(
                    `[SaveSurvey] HTTP Error: ${res.status} ${res.statusText}`,
                    errorText
                );
                throw new Error(
                    `Failed to save survey: ${res.status} ${res.statusText}`
                );
            }

            const json = await res.json();

            if (json.success) {
                console.log(
                    `[SaveSurvey] Survey ${
                        surveyId ? "updated" : "created"
                    } successfully:`,
                    json.data
                );

                toast.current.show({
                    severity: "success",
                    summary: "Success",
                    detail: surveyId
                        ? "Survey updated successfully!"
                        : "Survey saved successfully!",
                });

                // Generate quote
                if (json.data && (json.data._id || json.data.id)) {
                    const savedId = json.data._id || json.data.id;
                    console.log(
                        `[SaveSurvey] Survey saved with ID: ${savedId}`
                    );

                    // Use a timer to delay quote generation
                    if (quoteGenerationTimerRef.current) {
                        clearTimeout(quoteGenerationTimerRef.current);
                    }

                    quoteGenerationTimerRef.current = setTimeout(async () => {
                        try {
                            await generateQuote(savedId);
                        } catch (quoteError) {
                            console.error(
                                "[SaveSurvey] Error generating quote:",
                                quoteError
                            );
                        }
                    }, 500);
                }

                // Only redirect if shouldRedirect is true
                if (shouldRedirect) {
                    // Redirect after a delay
                    setTimeout(() => {
                        if (siteDetails && siteDetails._id) {
                            router.push(
                                `/database/clients/site/${siteDetails._id}`
                            );
                        } else {
                            router.push("/surveys");
                        }
                    }, 3000);
                } else {
                    // Reset the submitting state when not redirecting
                    setIsSubmitting(false);
                }

                // Return success info
                return { success: true, data: json.data };
            } else {
                // Enhanced error handling
                console.error("[SaveSurvey] API Error:", json);
                throw new Error(json.message || "Failed to save survey");
            }
        } catch (error) {
            console.error("[SaveSurvey] Error saving survey:", error);
            toast.current.show({
                severity: "error",
                summary: "Error",
                detail: error.message || "Error saving survey",
            });
            setIsSubmitting(false);
            setUploadProgress({
                active: false,
                total: 0,
                completed: 0,
                message: "",
            });
            return { success: false, error };
        } finally {
            if (shouldRedirect) {
                setIsSubmitting(false);
                setUploadProgress({
                    active: false,
                    total: 0,
                    completed: 0,
                    message: "",
                });
            }
        }
    };

    return (
        <>
            <Toast ref={toast} />

            {/* Upload progress indicator */}
            {uploadProgress.active && (
                <div
                    style={{
                        position: "fixed",
                        top: "70px",
                        left: "50%",
                        transform: "translateX(-50%)",
                        width: "60%",
                        backgroundColor: "white",
                        padding: "1rem",
                        borderRadius: "8px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                        zIndex: 1001,
                    }}
                >
                    <h3>Uploading Images</h3>
                    <p>{uploadProgress.message}</p>
                    <ProgressBar
                        value={
                            (uploadProgress.completed / uploadProgress.total) *
                            100
                        }
                        style={{ height: "20px" }}
                    />
                    <p>
                        {uploadProgress.completed} of {uploadProgress.total}{" "}
                        complete
                    </p>
                </div>
            )}

            {/* Save Survey button */}
            <button
                onClick={() => handleSaveSurvey(true)}
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
                    cursor: isSubmitting ? "not-allowed" : "pointer",
                    transition: "background-color 0.2s ease",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    opacity: isSubmitting ? 0.7 : 1,
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
        </>
    );
}

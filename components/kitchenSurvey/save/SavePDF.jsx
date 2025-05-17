// components/kitchenSurvey/pdf/SavePDF.jsx
import { useEffect, useState } from "react";
import { getSurveyPdfFolder, uploadPdfToCloudinary } from "@/lib/cloudinary";

export default function SavePDF() {
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

    /**
     * Captures only the used portion of the schematic as a JPG image
     * Optimized for smaller file size
     */
    const captureSchematic = async (
        schematicRef,
        gridSpaces,
        cellSize,
        placedItems,
        specialItems
    ) => {
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
                    scale: 1, // OPTIMIZATION: Reduced from 2 to decrease size
                    useCORS: true,
                    allowTaint: true,
                    scrollX: 0,
                    scrollY: 0,
                });
                return canvas.toDataURL("image/jpeg", 0.8); // OPTIMIZATION: JPEG with 80% quality
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
                scale: 1, // OPTIMIZATION: Reduced from 2 to decrease size
                useCORS: true,
                allowTaint: true,
                scrollX: 0,
                scrollY: 0,
            });

            // Clean up
            document.body.removeChild(tempContainer);

            return canvas.toDataURL("image/jpeg", 0.8); // OPTIMIZATION: Using JPEG with 80% quality
        } catch (error) {
            console.error("Error capturing schematic:", error);
            return null;
        }
    };

    /**
     * Generate a quote PDF and save it to Cloudinary
     * Optimized for smaller file size
     */
    const generateQuote = async (
        savedSurveyId,
        schematicRef,
        surveyDataForPDF,
        computedEquipmentTotal,
        computedGrandTotals,
        toast
    ) => {
        console.log("⭐⭐⭐ GENERATING QUOTE - OPTIMIZED APPROACH ⭐⭐⭐");

        // Destructure survey data
        const {
            refValue,
            surveyDate,
            parking,
            siteDetails,
            structureId,
            structureTotal,
            structureDimensions,
            structureComments,
            surveyData,
            canopyTotal,
            canopyEntries,
            accessDoorPrice,
            ventilationPrice,
            airPrice,
            fanPartsPrice,
            airInExTotal,
            schematicItemsTotal,
            operations,
            access,
            modify,
            placedItems,
            specialItems,
            gridSpaces,
            cellSize,
        } = surveyDataForPDF;

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
            const schematicImgData = await captureSchematic(
                schematicRef,
                gridSpaces,
                cellSize,
                placedItems,
                specialItems
            );
            console.log("✓ Schematic captured");

            // 2. Get price total
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

            // 3. Generate HTML
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
                    
                    <!-- Site Details Section -->
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
                                <td style="padding: 8px; border: 1px solid #ddd;">GRAND TOTAL</td>
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

            // 4. Create a temporary div to render the clean HTML
            const tempContainer = document.createElement("div");
            tempContainer.style.position = "absolute";
            tempContainer.style.left = "-9999px";
            tempContainer.style.width = "800px"; // Fixed width for PDF
            tempContainer.innerHTML = cleanHtml;
            document.body.appendChild(tempContainer);

            console.log("Created temporary container for PDF content");

            // 5. Capture the clean content
            const html2canvas = (await import("html2canvas")).default;
            const canvas = await html2canvas(tempContainer, {
                scale: 1, // OPTIMIZATION: Reduced scale from 2 to 1
                logging: false,
                windowWidth: 800,
            });

            // Get image data - OPTIMIZATION: Using JPEG with 80% quality instead of PNG
            const imgData = canvas.toDataURL("image/jpeg", 0.8);
            console.log("✓ PDF content captured");

            // Clean up temporary element
            document.body.removeChild(tempContainer);

            // 6. Generate PDF
            const pdfName = `Quote-${refValue || ""}-${new Date()
                .toLocaleDateString()
                .replace(/\//g, "-")}.pdf`;
            const pdfFolder = getSurveyPdfFolder(
                siteDetails?.siteName || siteDetails?.name || "unknown-site",
                refValue || "unknown"
            );

            console.log(`Saving PDF to Cloudinary folder: ${pdfFolder}`);

            try {
                // Create a jsPDF instance - OPTIMIZATION: Added compress option
                const pdf = new jsPDFModule({
                    orientation: "portrait",
                    unit: "pt",
                    format: "a4",
                    compress: true, // OPTIMIZATION: Enable compression
                });

                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

                // Add the image to the PDF
                pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight); // OPTIMIZATION: Using JPEG

                // Get the PDF as base64 data URL
                const pdfDataUrl = pdf.output("dataurlstring");

                // Upload PDF to Cloudinary
                console.log("Uploading PDF to Cloudinary...");
                const uploadResult = await uploadPdfToCloudinary(
                    pdfDataUrl,
                    pdfName,
                    pdfFolder
                );

                if (!uploadResult.success) {
                    throw new Error(
                        "Cloudinary upload failed: " + uploadResult.message
                    );
                }

                console.log("PDF successfully uploaded to Cloudinary");

                // 7. Create quote payload with Cloudinary references
                const quoteName = `Quote-${refValue || ""}-${new Date()
                    .toLocaleDateString()
                    .replace(/\//g, "-")}`;

                const quotePayload = {
                    name: quoteName,
                    // Store Cloudinary information instead of the PDF data
                    cloudinary: {
                        publicId: uploadResult.data.public_id,
                        url: uploadResult.data.secure_url,
                    },
                    // Keep minimal PDF data for backwards compatibility
                    pdfData: null,
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
                    cloudinaryPublicId: uploadResult.data.public_id,
                });

                // 8. Send to API
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

                // Show success message
                if (result.success) {
                    toast.current?.show({
                        severity: "success",
                        summary: "Quote Created",
                        detail: "Quote has been saved to Cloudinary and database",
                        life: 3000,
                    });
                }

                return { success: true, data: result.data };
            } catch (pdfError) {
                console.error("Error generating or uploading PDF:", pdfError);
                toast.current?.show({
                    severity: "error",
                    summary: "PDF Error",
                    detail: pdfError.message || "Error generating PDF",
                    life: 5000,
                });
                return { success: false, error: pdfError };
            }
        } catch (error) {
            console.error("Error in quote generation:", error);
            toast.current?.show({
                severity: "error",
                summary: "Quote Error",
                detail: error.message || "Error creating quote",
                life: 5000,
            });
            return { success: false, error };
        } finally {
            // Always unlock
            window.__generating_quote = false;
            console.log("⭐⭐⭐ QUOTE GENERATION COMPLETE ⭐⭐⭐");
        }
    };

    // Export functions for use in SaveSurvey
    return {
        captureSchematic,
        generateQuote,
        jsPDFModule,
    };
}

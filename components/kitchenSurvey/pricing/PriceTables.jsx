// components/kitchenSurvey/pricing/PriceTables.jsx

"use client";
import React from "react";
import "../../../styles/priceList.css";
import { computeStructureTotal } from "./PricingUtils";

export default function PriceTables({
    structureTotal,
    structureId,
    equipmentTotal,
    equipmentId,
    canopyTotal,
    canopyId,
    accessDoorPrice,
    ventilationPrice,
    airPrice,
    fanPartsPrice,
    airInExTotal,
    modify,
    setModify,
    groupingId,
    schematicItemsTotal = 0,
    greaseTotal = 0,
    specialistEquipmentData = [],
    // NEW: Add parameters for parking cost and post-service report
    parkingCost = 0,
    postServiceReport = "No",
    postServiceReportPrice = 0,
    areaLabel,
    // NEW: Add parameters for structure entries
    structureEntries = [],
    structureItems = [],
}) {
    // Calculate modification factor
    const factor = 1 + modify / 100;

    // Create data for each section
    const sections = [];

    // NEW: Helper to get a unique name for each structure entry
    const getStructureEntryName = (entry, index) => {
        if (entry.selectionData && entry.selectionData.length > 0) {
            const typeNames = entry.selectionData
                .map((item) => item.type)
                .filter((type) => type && type !== "")
                .join(", ");

            return typeNames || `Structure ${index + 1}`;
        }
        return `Structure ${index + 1}`;
    };

    // NEW: Calculate structure price for a single entry
    const calculateStructureEntryPrice = (entry) => {
        if (
            !entry ||
            !entry.selectionData ||
            !Array.isArray(structureItems) ||
            structureItems.length === 0
        ) {
            return 0;
        }

        // Calculate type temp (sum of prices for ceiling, wall, floor)
        const typeTemp = entry.selectionData.reduce((acc, row) => {
            let price = 0;
            if (row.item && row.grade) {
                const found = structureItems.find(
                    (itm) =>
                        itm.subcategory === row.type && itm.item === row.item
                );
                if (found && found.prices && found.prices[row.grade] != null) {
                    price = Number(found.prices[row.grade]);
                }
            }
            return acc + price;
        }, 0);

        // Calculate size temp (product of dimensions)
        const dimensionsLength = entry.dimensions?.length || 1;
        const dimensionsWidth = entry.dimensions?.width || 1;
        const dimensionsHeight = entry.dimensions?.height || 1;

        const sizeTemp = dimensionsLength * dimensionsWidth * dimensionsHeight;

        // Total for this entry is type temp * size temp
        return typeTemp * sizeTemp;
    };

    // Structure section - UPDATED to handle multiple entries
    if (
        Array.isArray(structureEntries) &&
        structureEntries.length > 0 &&
        Array.isArray(structureItems) &&
        structureItems.length > 0
    ) {
        // Show individual structure entries
        structureEntries.forEach((entry, index) => {
            const entryPrice = calculateStructureEntryPrice(entry) * factor;
            if (entryPrice > 0) {
                sections.push({
                    title: "Structure",
                    items: [
                        {
                            name: getStructureEntryName(entry, index),
                            value: entryPrice,
                            details: entry.comments,
                        },
                    ],
                    total: entryPrice,
                    hasDetails: !!entry.comments,
                });
            }
        });
    } else if (structureTotal > 0) {
        // Fallback to single structure total
        sections.push({
            title: "Structure",
            items: [
                { name: "Structure Total", value: structureTotal * factor },
            ],
            total: structureTotal * factor,
        });
    }

    // Equipment section
    if (equipmentTotal > 0) {
        sections.push({
            title: "Equipment",
            items: [
                { name: "Equipment Total", value: equipmentTotal * factor },
            ],
            total: equipmentTotal * factor,
        });
    }

    // Canopy section
    if (canopyTotal > 0) {
        sections.push({
            title: "Canopy",
            items: [{ name: "Canopy Total", value: canopyTotal * factor }],
            total: canopyTotal * factor,
        });
    }

    // Access Door section
    if (accessDoorPrice > 0) {
        sections.push({
            title: "Access Door",
            items: [
                { name: "Access Door Price", value: accessDoorPrice * factor },
            ],
            total: accessDoorPrice * factor,
        });
    }

    // Ventilation section (combines ventilationPrice and fanPartsPrice)
    const ventItems = [];
    if (ventilationPrice > 0) {
        ventItems.push({
            name: "Ventilation Price",
            value: ventilationPrice * factor,
        });
    }
    if (fanPartsPrice > 0) {
        ventItems.push({
            name: "Ventilation Parts",
            value: fanPartsPrice * factor,
        });
    }
    if (ventItems.length > 0) {
        sections.push({
            title: "Ventilation",
            items: ventItems,
            total: (ventilationPrice + fanPartsPrice) * factor,
        });
    }

    // Air section (combines airPrice and airInExTotal)
    const airItems = [];
    if (airPrice > 0) {
        airItems.push({ name: "Air Price (Legacy)", value: airPrice * factor });
    }
    if (airInExTotal > 0) {
        airItems.push({
            name: "Air Intake & Extract",
            value: airInExTotal * factor,
        });
    }
    if (airItems.length > 0) {
        sections.push({
            title: "Air Systems",
            items: airItems,
            total: (airPrice + airInExTotal) * factor,
        });
    }

    // Schematic section - UPDATED CODE HERE
    if (
        typeof schematicItemsTotal === "object" &&
        schematicItemsTotal !== null
    ) {
        // If it's a comprehensive object with breakdown
        if (
            schematicItemsTotal.breakdown &&
            Object.keys(schematicItemsTotal.breakdown).length > 0
        ) {
            // Create a section for each category in the breakdown
            Object.entries(schematicItemsTotal.breakdown).forEach(
                ([category, categoryTotal]) => {
                    if (Number(categoryTotal) > 0) {
                        sections.push({
                            title: category,
                            items: [
                                {
                                    name: `${category} Total`,
                                    value: Number(categoryTotal) * factor,
                                },
                            ],
                            total: Number(categoryTotal) * factor,
                        });
                    }
                }
            );
        }
        // Fallback if there's only an overall property
        else if (Number(schematicItemsTotal.overall) > 0) {
            sections.push({
                title: "Schematic",
                items: [
                    {
                        name: "Schematic Items Total",
                        value: Number(schematicItemsTotal.overall) * factor,
                    },
                ],
                total: Number(schematicItemsTotal.overall) * factor,
            });
        }
    }
    // Direct number handling
    else if (Number(schematicItemsTotal) > 0) {
        sections.push({
            title: "Schematic",
            items: [
                {
                    name: "Schematic Items Total",
                    value: Number(schematicItemsTotal) * factor,
                },
            ],
            total: Number(schematicItemsTotal) * factor,
        });
    }

    // Grease section
    if (greaseTotal > 0) {
        sections.push({
            title: "Grease",
            items: [{ name: "Grease Total", value: greaseTotal * factor }],
            total: greaseTotal * factor,
        });
    }

    // Process specialist equipment data
    const specialistItems = [];
    let specialistTotal = 0;

    specialistEquipmentData.forEach((item) => {
        let itemPrice = 0;
        let priceFound = false;

        // Check for direct price property
        if (item.price !== undefined && item.price !== null) {
            itemPrice = Number(item.price);
            priceFound = true;
        }
        // Check for price in customData
        else if (item.customData && Array.isArray(item.customData)) {
            const priceField = item.customData.find(
                (field) =>
                    field.fieldName && field.fieldName.toLowerCase() === "price"
            );

            if (
                priceField &&
                priceField.value !== undefined &&
                priceField.value !== null
            ) {
                itemPrice = Number(priceField.value);
                priceFound = true;
            }
        }

        if (priceFound) {
            const quantity = Number(item.number) || 1;
            const totalItemPrice = itemPrice * quantity;

            specialistItems.push({
                name: item.name || item.item || "Specialist Equipment Item",
                value: totalItemPrice * factor,
                details: `${quantity} x £${itemPrice.toFixed(2)}`,
            });

            specialistTotal += totalItemPrice;
        }
    });

    if (specialistItems.length > 0) {
        sections.push({
            title: "Specialist Equipment",
            items: specialistItems,
            total: specialistTotal * factor,
            hasDetails: true,
        });
    }

    // NEW: Add Parking Cost section
    if (parkingCost > 0) {
        sections.push({
            title: "Parking",
            items: [{ name: "Parking Cost", value: parkingCost * factor }],
            total: parkingCost * factor,
        });
    }

    // NEW: Add Post-Service Report section
    if (postServiceReport === "Yes" && postServiceReportPrice > 0) {
        sections.push({
            title: "Additional Services",
            items: [
                {
                    name: "Post-Service Report",
                    value: postServiceReportPrice * factor,
                },
            ],
            total: postServiceReportPrice * factor,
        });
    }

    // Calculate grand total for this area - UPDATED to include new fields
    const areaGrandTotal = sections.reduce(
        (total, section) => total + section.total,
        0
    );

    // Get the display name for the area (use structureId if available, or fall back to the areaLabel)
    const displayAreaName = structureId || groupingId || areaLabel || "Area";

    return (
        <div className="price-container price-tables">
            {/* Only show tables if there are sections with data */}
            {sections.length > 0 ? (
                <>
                    {/* Area Summary Table - Now the only table shown */}
                    <div
                        className="card"
                        style={{
                            border: "2px solid #2c3e50",
                            borderRadius: "5px",
                            padding: "1.5rem",
                            marginBottom: "2rem",
                            backgroundColor: "#f8f9fa",
                            boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                        }}
                    >
                        <h3 style={{ marginTop: 0, textAlign: "center" }}>
                            {displayAreaName} Summary
                        </h3>
                        <table
                            className="common-table"
                            style={{ width: "100%" }}
                        >
                            <thead>
                                <tr>
                                    <th style={{ textAlign: "left" }}>
                                        Service
                                    </th>
                                    <th style={{ textAlign: "right" }}>
                                        Total
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {sections.map((section, index) => (
                                    <tr key={index}>
                                        <td>{section.title}</td>
                                        <td style={{ textAlign: "right" }}>
                                            £{section.total.toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                                <tr
                                    style={{
                                        fontWeight: "bold",
                                        borderTop: "2px solid #2c3e50",
                                    }}
                                >
                                    <td>{displayAreaName} Total</td>
                                    <td style={{ textAlign: "right" }}>
                                        £{areaGrandTotal.toFixed(2)}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Modification Controls */}
                    <div style={{ marginBottom: "2rem" }}>
                        <label
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "1rem",
                            }}
                        >
                            <span>Modify Prices (%): </span>
                            <input
                                type="number"
                                value={modify}
                                onChange={(e) =>
                                    setModify(Number(e.target.value))
                                }
                                style={{
                                    padding: "0.5rem",
                                    borderRadius: "4px",
                                    border: "1px solid #ccc",
                                    width: "100px",
                                }}
                            />
                            <span>
                                {modify > 0
                                    ? `+${modify}%`
                                    : modify < 0
                                    ? `${modify}%`
                                    : "No modification"}
                            </span>
                        </label>
                    </div>
                </>
            ) : (
                <div
                    style={{
                        textAlign: "center",
                        margin: "2rem 0",
                        color: "#666",
                    }}
                >
                    No pricing data available for this area.
                </div>
            )}
        </div>
    );
}

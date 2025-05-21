// components/kitchenSurvey/save/SavePDF.jsx

import { useState, useEffect, useCallback } from "react";
// ADDED: Import the getSurveyPdfFolder from cloudinary.js
import { getSurveyPdfFolder, getCloudinaryPdfUrl } from "@/lib/cloudinary";

// Extract the generateStyledHtml function outside the hook for direct import
export const generateStyledHtml = (surveyData, schematicHtml = null) => {
    const {
        refValue,
        surveyDate,
        siteDetails,
        contacts = [],
        primaryContactIndex,
        walkAroundContactIndex,
        structureId,
        structureTotal,
        structureSelectionData = [],
        structureDimensions = {},
        structureComments = "",
        // Equipment data
        surveyData: equipmentEntries = [],
        equipmentItems = [],
        specialistEquipmentData = [],
        // Canopy data
        canopyTotal,
        canopyEntries = [],
        canopyComments = {},
        // Schematic costs
        accessDoorPrice,
        ventilationPrice,
        airPrice,
        fanPartsPrice,
        airInExTotal,
        schematicItemsTotal,
        // Form sections
        ventilation = {},
        access = {},
        equipment = {},
        operations = {},
        notes = {},
        modify = 0,
    } = surveyData || {};

    // Calculate subtotal
    const equipmentTotal = (equipmentEntries || []).reduce(
        (total, item) => total + (item.price || 0),
        0
    );

    const subtotal =
        (structureTotal || 0) +
        (equipmentTotal || 0) +
        (canopyTotal || 0) +
        (accessDoorPrice || 0) +
        (ventilationPrice || 0) +
        (airPrice || 0) +
        (fanPartsPrice || 0) +
        (airInExTotal || 0) +
        (typeof schematicItemsTotal === "object"
            ? schematicItemsTotal.overall || 0
            : schematicItemsTotal || 0);

    // Calculate grand total with modification
    const grandTotal = subtotal * (1 + (modify || 0) / 100);

    // The primary contact
    const primaryContact =
        contacts && contacts.length > (primaryContactIndex || 0)
            ? contacts[primaryContactIndex]
            : null;

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
    
    <style>
        /* Set up A4 page dimensions */
        @page {
            size: A4;
            margin: 1cm;
        }
        
        /* Print-specific styles */
        @media print {
            .p-card {
                break-inside: avoid;
                page-break-inside: avoid;
            }
            
            h1, h2, h3 {
                break-after: avoid;
                page-break-after: avoid;
            }
            
            .p-datatable {
                break-inside: auto;
                page-break-inside: auto;
            }
            
            tr {
                break-inside: avoid;
                page-break-inside: avoid;
            }
            
            .page-break {
                page-break-before: always;
                break-before: page;
            }
            
            .no-break {
                break-inside: avoid;
                page-break-inside: avoid;
            }
            
            .header-section {
                position: running(header);
            }
            
            .footer-section {
                position: running(footer);
            }
        }
        
        /* Base styles */
        body {
            font-family: var(--font-family, 'Segoe UI', Arial, sans-serif);
            line-height: 1.6;
            color: var(--text-color, #3b3b3b);
            margin: 0;
            padding: 0;
            background-color: var(--surface-ground, #fff);
            font-size: 11pt;
        }
        
        /* Container */
        .container {
            width: 210mm; /* A4 width */
            margin: 0 auto;
            padding: 0;
            box-sizing: border-box;
        }
        
        /* Typography */
        h1 {
            font-size: 18pt;
            color: var(--primary-color, #3b3b3b);
            margin-top: 20px;
            margin-bottom: 15px;
            text-align: center;
        }
        
        h2 {
            font-size: 14pt;
            color: var(--text-color, #333);
            margin-top: 20px;
            margin-bottom: 10px;
            padding-bottom: 5px;
            border-bottom: 1px solid var(--surface-border, #ddd);
        }
        
        h3 {
            font-size: 12pt;
            color: var(--text-color, #333);
            margin-top: 15px;
            margin-bottom: 8px;
        }
        
        p {
            margin: 5px 0;
        }
        
        /* PrimeReact Card Styling */
        .p-card {
            margin-bottom: 1.5rem;
            box-shadow: 0 2px 1px -1px rgba(0,0,0,0.2), 0 1px 1px 0 rgba(0,0,0,0.14), 0 1px 3px 0 rgba(0,0,0,0.12);
            border-radius: 6px;
            background-color: var(--surface-card, #fff);
            page-break-inside: avoid;
        }
        
        .p-card-title {
            font-size: 14pt;
            font-weight: 700;
            margin-bottom: 0.5rem;
        }
        
        .p-card-body {
            padding: 1.25rem;
        }
        
        .p-card-content {
            padding: 0;
        }
        
        /* PrimeReact Table Styling */
        .p-datatable {
            margin-top: 1rem;
            margin-bottom: 1rem;
        }
        
        .p-datatable-table {
            border-collapse: collapse;
            width: 100%;
            table-layout: auto;
        }
        
        .p-datatable-thead > tr > th {
            text-align: left;
            padding: 0.75rem;
            border: 1px solid var(--surface-border, #ddd);
            color: var(--primary-color-text, #fff);
            font-weight: 600;
            font-size: 10pt;
        }
        
        .p-datatable-tbody > tr > td {
            text-align: left;
            padding: 0.75rem;
            border: 1px solid var(--surface-border, #ddd);
            font-size: 10pt;
        }
        
        .p-datatable-tbody > tr:nth-child(even) {
            background-color: var(--surface-hover, #f5f5f5);
        }
        
        /* Header info row with flex layout */
        .header-info-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 0.5rem;
        }
        
        .header-info-item {
            display: flex;
            align-items: center;
        }
        
        /* Info rows */
        .info-row {
            display: flex;
            margin-bottom: 0.5rem;
            align-items: baseline;
        }
        
        .label {
            font-weight: 600;
            color: var(--text-color-secondary, #555);
            margin-right: 0.5rem;
            min-width: 150px;
        }
        
        .data {
            color: var(--text-color, #333);
            flex: 1;
        }
        
        /* Comments */
        .comment {
            background-color: var(--surface-hover, #f5f5f5);
            border-left: 3px solid var(--primary-color, #1976d2);
            padding: 0.75rem;
            margin: 0.75rem 0;
            font-style: italic;
            font-size: 10pt;
        }
        
        /* Pricing table */
        .price-table .p-datatable-thead > tr > th {
            background-color: var(--primary-color, #1976d2);
        }
        
        .price-label {
            font-weight: 600;
        }
        
        .price-value {
            text-align: right;
        }
        
        .subtotal-row {
            font-weight: 700;
            background-color: var(--surface-hover, #f5f5f5) !important;
        }
        
        .total-row {
            font-weight: 700;
            font-size: 11pt;
            background-color: var(--primary-color, #1976d2) !important;
            color: var(--primary-color-text, #fff) !important;
        }
        
        .total-row td {
            color: var(--primary-color-text, #fff) !important;
        }
        
        /* Footer */
        .footer {
            margin-top: 20px;
            padding-top: 10px;
            border-top: 1px solid var(--surface-border, #ddd);
            font-size: 9pt;
            color: var(--text-color-secondary, #777);
            text-align: center;
        }
        
        /* Header/footer for each page */
        .page-header {
            text-align: center;
            font-size: 9pt;
            color: var(--text-color-secondary, #777);
            margin-bottom: 10px;
            display: none; /* Only show in print */
        }
        
        .page-footer {
            text-align: center;
            font-size: 9pt;
            color: var(--text-color-secondary, #777);
            margin-top: 10px;
            display: none; /* Only show in print */
        }
        
        @media print {
            .page-header, .page-footer {
                display: block;
            }
        }
        
        /* Schematic */
        .schematic-container {
            text-align: center;
            margin: 15px 0;
        }
        
        /* Helper classes */
        .text-center {
            text-align: center;
        }
        
        .text-right {
            text-align: right;
        }
        
        .mt-20 {
            margin-top: 20px;
        }
        
        .mb-10 {
            margin-bottom: 10px;
        }
    </style>
</head>
<body>
    <div class="container">

        <!-- Main Content -->
        <div class="content">
            <!-- Header -->
            <h1>Kitchen Survey Quote</h1>
            <div class="p-card no-break">
                <div class="p-card-body">
                    <div class="header-info-row">
                        <div class="header-info-item">
                            <span class="label">Reference:</span>
                            <span class="data">${refValue || "N/A"}</span>
                        </div>
                        <div class="header-info-item">
                            <span class="label">Date:</span>
                            <span class="data">${new Date(
                                surveyDate || Date.now()
                            ).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Site Information -->
            <div class="p-card no-break">
                <div class="p-card-body">
                    <div class="p-card-title">Site Information</div>
                    <div class="p-card-content">
                        <div class="info-row">
                            <span class="label">Site Name:</span>
                            <span class="data">${
                                siteDetails?.siteName ||
                                siteDetails?.name ||
                                "N/A"
                            }</span>
                        </div>
                        <div class="info-row">
                            <span class="label">Address:</span>
                            <span class="data">${
                                siteDetails?.address || "N/A"
                            }</span>
                        </div>
                        
                        ${
                            operations?.operationalHours
                                ? `
                        <div class="info-row">
                            <span class="label">Operational Hours:</span>
                            <span class="data">
                                Weekdays ${
                                    operations.operationalHours.weekdays
                                        ? `${
                                              operations.operationalHours
                                                  .weekdays.start || "N/A"
                                          } - 
                                    ${
                                        operations.operationalHours.weekdays
                                            .end || "N/A"
                                    }`
                                        : "N/A"
                                }, 
                                Weekend ${
                                    operations.operationalHours.weekend
                                        ? `${
                                              operations.operationalHours
                                                  .weekend.start || "N/A"
                                          } - 
                                    ${
                                        operations.operationalHours.weekend
                                            .end || "N/A"
                                    }`
                                        : "N/A"
                                }
                            </span>
                        </div>`
                                : ""
                        }
                        
                        ${
                            primaryContact
                                ? `
                        <div class="info-row">
                            <span class="label">Primary Contact:</span>
                            <span class="data">
                                ${primaryContact.contactFirstName || ""} 
                                ${primaryContact.contactLastName || ""}
                            </span>
                        </div>
                        ${
                            primaryContact.number || primaryContact.email
                                ? `
                        <div class="info-row">
                            <span class="label">Contact Details:</span>
                            <span class="data">
                                ${primaryContact.number || ""} 
                                ${
                                    primaryContact.email
                                        ? `/ ${primaryContact.email}`
                                        : ""
                                }
                            </span>
                        </div>`
                                : ""
                        }
                        `
                                : ""
                        }
                    </div>
                </div>
            </div>
            
            <!-- Structure Details -->
            <div class="p-card">
                <div class="p-card-body">
                    <div class="p-card-title">Structure Details</div>
                    <div class="p-card-content">
                        <div class="info-row">
                            <span class="label">Structure ID:</span>
                            <span class="data">${structureId || "N/A"}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">Dimensions:</span>
                            <span class="data">
                                ${structureDimensions?.length || "N/A"}m × 
                                ${structureDimensions?.width || "N/A"}m × 
                                ${structureDimensions?.height || "N/A"}m
                            </span>
                        </div>
                        
                        ${
                            structureSelectionData &&
                            structureSelectionData.length > 0
                                ? `
                        <h3>Structure Components</h3>
                        <div class="p-datatable">
                            <table class="p-datatable-table">
                                <thead class="p-datatable-thead">
                                    <tr>
                                        <th>Type</th>
                                        <th>Item</th>
                                        <th>Grade</th>
                                    </tr>
                                </thead>
                                <tbody class="p-datatable-tbody">
                                    ${structureSelectionData
                                        .map(
                                            (item) => `
                                    <tr>
                                        <td>${item.type || ""}</td>
                                        <td>${item.item || ""}</td>
                                        <td>${item.grade || ""}</td>
                                    </tr>`
                                        )
                                        .join("")}
                                </tbody>
                            </table>
                        </div>`
                                : ""
                        }
                        
                        ${
                            structureComments
                                ? `
                        <div class="comment">
                            <strong>Comments:</strong><br>
                            ${structureComments}
                        </div>`
                                : ""
                        }
                    </div>
                </div>
            </div>
            
            <!-- Equipment Survey -->
            <div class="p-card">
                <div class="p-card-body">
                    <div class="p-card-title">Equipment Survey</div>
                    <div class="p-card-content">
                        ${
                            equipmentEntries && equipmentEntries.length > 0
                                ? `
                        <div class="p-datatable">
                            <table class="p-datatable-table">
                                <thead class="p-datatable-thead">
                                    <tr>
                                        <th>Category</th>
                                        <th>Item</th>
                                        <th>Quantity</th>
                                    </tr>
                                </thead>
                                <tbody class="p-datatable-tbody">
                                    ${equipmentEntries
                                        .map(
                                            (item, index) => `
                                    <tr>
                                        <td>${item.subcategory || "N/A"}</td>
                                        <td>${
                                            item.name || item.item || "N/A"
                                        }</td>
                                        <td class="text-center">${
                                            item.quantity || 1
                                        }</td>
                                    </tr>
                                    ${
                                        index === equipmentEntries.length - 1
                                            ? ""
                                            : ""
                                    }
                                    `
                                        )
                                        .join("")}
                                </tbody>
                            </table>
                        </div>`
                                : `<p>No equipment items specified</p>`
                        }
                        
                        ${
                            specialistEquipmentData &&
                            specialistEquipmentData.length > 0
                                ? `
                        <h3>Specialist Equipment</h3>
                        <div class="p-datatable">
                            <table class="p-datatable-table">
                                <thead class="p-datatable-thead">
                                    <tr>
                                        <th>Item</th>
                                        <th>Category</th>
                                    </tr>
                                </thead>
                                <tbody class="p-datatable-tbody">
                                    ${specialistEquipmentData
                                        .map(
                                            (item) => `
                                    <tr>
                                        <td>${
                                            item.name ||
                                            item.item ||
                                            "Unnamed Item"
                                        }</td>
                                        <td>${item.category || "N/A"}</td>
                                    </tr>`
                                        )
                                        .join("")}
                                </tbody>
                            </table>
                        </div>`
                                : ""
                        }
                    </div>
                </div>
            </div>
            
            <!-- Canopy Details -->
            <div class="p-card">
                <div class="p-card-body">
                    <div class="p-card-title">Canopy Details</div>
                    <div class="p-card-content">
                        ${
                            canopyEntries && canopyEntries.length > 0
                                ? `
                        ${canopyEntries
                            .map(
                                (entry, index) => `
                        <div class="mb-10">
                            <h3>Canopy ${index + 1}</h3>
                            ${
                                entry.canopy
                                    ? `
                            <div class="info-row">
                                <span class="label">Type:</span>
                                <span class="data">${
                                    entry.canopy.type || "N/A"
                                }</span>
                            </div>
                            <div class="info-row">
                                <span class="label">Grade:</span>
                                <span class="data">${
                                    entry.canopy.grade || "N/A"
                                }</span>
                            </div>
                            <div class="info-row">
                                <span class="label">Dimensions:</span>
                                <span class="data">
                                    ${entry.canopy.length || "N/A"}m × 
                                    ${entry.canopy.width || "N/A"}m × 
                                    ${entry.canopy.height || "N/A"}m
                                </span>
                            </div>`
                                    : ""
                            }
                            ${
                                entry.filter
                                    ? `
                            <div class="info-row">
                                <span class="label">Filter Type:</span>
                                <span class="data">${
                                    entry.filter.type || "N/A"
                                }</span>
                            </div>
                            <div class="info-row">
                                <span class="label">Filter Grade:</span>
                                <span class="data">${
                                    entry.filter.grade || "N/A"
                                }</span>
                            </div>`
                                    : ""
                            }
                        </div>
                        `
                            )
                            .join("")}`
                                : `<p>No canopy entries specified</p>`
                        }
                        
                        ${
                            canopyComments &&
                            Object.keys(canopyComments).length > 0
                                ? `
                        <h3>Canopy Comments</h3>
                        ${Object.entries(canopyComments)
                            .filter(
                                ([key, comment]) =>
                                    comment && comment.trim().length > 0
                            )
                            .map(
                                ([key, comment]) => `
                            <div class="comment">
                                <strong>${key}:</strong> ${comment}
                            </div>
                        `
                            )
                            .join("")}`
                                : ""
                        }
                    </div>
                </div>
            </div>
            
            <!-- Schematic Layout - Force page break before schematic -->
            ${
                schematicHtml
                    ? `
            <div class="page-break"></div>
            <div class="p-card">
                <div class="p-card-body">
                    <div class="p-card-title">Schematic Layout</div>
                    <div class="p-card-content">
                        <div class="schematic-container">
                            ${schematicHtml}
                        </div>
                    </div>
                </div>
            </div>`
                    : ""
            }
            
            <!-- Price Breakdown - Important to keep this together -->
            <div class="p-card no-break">
                <div class="p-card-body">
                    <div class="p-card-title">Price Breakdown</div>
                    <div class="p-card-content">
                        <div class="p-datatable price-table">
                            <table class="p-datatable-table">
                                <thead class="p-datatable-thead">
                                    <tr>
                                        <th>Item</th>
                                        <th class="text-right">Price</th>
                                    </tr>
                                </thead>
                                <tbody class="p-datatable-tbody">
                                    ${
                                        structureTotal > 0
                                            ? `
                                    <tr>
                                        <td class="price-label">Structure Total</td>
                                        <td class="price-value">£${structureTotal.toFixed(
                                            2
                                        )}</td>
                                    </tr>`
                                            : ""
                                    }
                                    
                                    ${
                                        equipmentTotal > 0
                                            ? `
                                    <tr>
                                        <td class="price-label">Equipment</td>
                                        <td class="price-value">£${equipmentTotal.toFixed(
                                            2
                                        )}</td>
                                    </tr>`
                                            : ""
                                    }
                                    
                                    ${
                                        canopyTotal > 0
                                            ? `
                                    <tr>
                                        <td class="price-label">Canopy</td>
                                        <td class="price-value">£${canopyTotal.toFixed(
                                            2
                                        )}</td>
                                    </tr>`
                                            : ""
                                    }
                                    
                                    ${
                                        accessDoorPrice > 0
                                            ? `
                                    <tr>
                                        <td class="price-label">Access Door</td>
                                        <td class="price-value">£${accessDoorPrice.toFixed(
                                            2
                                        )}</td>
                                    </tr>`
                                            : ""
                                    }
                                    
                                    ${
                                        ventilationPrice > 0
                                            ? `
                                    <tr>
                                        <td class="price-label">Ventilation</td>
                                        <td class="price-value">£${ventilationPrice.toFixed(
                                            2
                                        )}</td>
                                    </tr>`
                                            : ""
                                    }
                                    
                                    ${
                                        airPrice > 0
                                            ? `
                                    <tr>
                                        <td class="price-label">Air Supply/Extract</td>
                                        <td class="price-value">£${airPrice.toFixed(
                                            2
                                        )}</td>
                                    </tr>`
                                            : ""
                                    }
                                    
                                    ${
                                        fanPartsPrice > 0
                                            ? `
                                    <tr>
                                        <td class="price-label">Fan Parts</td>
                                        <td class="price-value">£${fanPartsPrice.toFixed(
                                            2
                                        )}</td>
                                    </tr>`
                                            : ""
                                    }
                                    
                                    ${
                                        airInExTotal > 0
                                            ? `
                                    <tr>
                                        <td class="price-label">Air In/Ex</td>
                                        <td class="price-value">£${airInExTotal.toFixed(
                                            2
                                        )}</td>
                                    </tr>`
                                            : ""
                                    }
                                    
                                    ${
                                        schematicItemsTotal
                                            ? `
                                    <tr>
                                        <td class="price-label">Schematic Items</td>
                                        <td class="price-value">£${(typeof schematicItemsTotal ===
                                        "object"
                                            ? schematicItemsTotal.overall || 0
                                            : schematicItemsTotal || 0
                                        ).toFixed(2)}</td>
                                    </tr>`
                                            : ""
                                    }
                                    
                                    <tr class="subtotal-row">
                                        <td class="price-label">Subtotal</td>
                                        <td class="price-value">£${subtotal.toFixed(
                                            2
                                        )}</td>
                                    </tr>
                                    
                                    ${
                                        modify
                                            ? `
                                    <tr>
                                        <td class="price-label">Modification (${
                                            modify > 0 ? "+" : ""
                                        }${modify}%)</td>
                                        <td class="price-value">${
                                            modify > 0 ? "+" : ""
                                        }£${((subtotal * modify) / 100).toFixed(
                                                  2
                                              )}</td>
                                    </tr>`
                                            : ""
                                    }
                                    
                                    <tr class="total-row">
                                        <td class="price-label">GRAND TOTAL</td>
                                        <td class="price-value">£${grandTotal.toFixed(
                                            2
                                        )}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Additional Information - Last section -->
            <div class="p-card">
                <div class="p-card-body">
                    <div class="p-card-title">Additional Information</div>
                    <div class="p-card-content">
                        
                        <!-- Operations Information - Match survey form order -->
                        ${
                            operations &&
                            Object.values(operations).some((v) => v)
                                ? `
                        <h3>Operations Information</h3>
                        <div>
                            ${
                                operations.typeOfCooking
                                    ? `
                            <div class="info-row">
                                <span class="label">Type of Cooking:</span> 
                                <span class="data">${operations.typeOfCooking}</span>
                            </div>`
                                    : ""
                            }
                            
                            ${
                                operations.coversPerDay
                                    ? `
                            <div class="info-row">
                                <span class="label">Covers Per Day:</span> 
                                <span class="data">${operations.coversPerDay}</span>
                            </div>`
                                    : ""
                            }
                            
                            ${
                                operations.bestServiceTime
                                    ? `
                            <div class="info-row">
                                <span class="label">Best Service Time:</span> 
                                <span class="data">${operations.bestServiceTime}</span>
                            </div>`
                                    : ""
                            }
                            
                            ${
                                operations.bestServiceDay
                                    ? `
                            <div class="info-row">
                                <span class="label">Best Service Day:</span> 
                                <span class="data">${operations.bestServiceDay}</span>
                            </div>`
                                    : ""
                            }
                            
                            ${
                                operations.serviceDue
                                    ? `
                            <div class="info-row">
                                <span class="label">Service Due:</span> 
                                <span class="data">${new Date(
                                    operations.serviceDue
                                ).toLocaleDateString()}</span>
                            </div>`
                                    : ""
                            }
                        </div>`
                                : ""
                        }
                        
                        <!-- Access Requirements -->
                        ${
                            access && Object.values(access).some((v) => v)
                                ? `
                        <h3>Access Requirements</h3>
                        <div>
                            ${
                                access.inductionNeeded
                                    ? `
                            <div class="info-row">
                                <span class="label">Induction Needed:</span> 
                                <span class="data">${access.inductionNeeded}</span>
                            </div>`
                                    : ""
                            }
                            
                            ${
                                access.roofAccess
                                    ? `
                            <div class="info-row">
                                <span class="label">Roof Access:</span> 
                                <span class="data">${access.roofAccess}</span>
                            </div>`
                                    : ""
                            }
                            
                            ${
                                access.permitToWork
                                    ? `
                            <div class="info-row">
                                <span class="label">Permit to Work:</span> 
                                <span class="data">${access.permitToWork}</span>
                            </div>`
                                    : ""
                            }
                            
                            ${
                                access.dbs
                                    ? `
                            <div class="info-row">
                                <span class="label">DBS Check:</span> 
                                <span class="data">${access.dbs}</span>
                            </div>`
                                    : ""
                            }
                            
                            ${
                                access.permit
                                    ? `
                            <div class="info-row">
                                <span class="label">Permit:</span> 
                                <span class="data">${access.permit}</span>
                            </div>`
                                    : ""
                            }
                        </div>`
                                : ""
                        }
                        
                        <!-- Ventilation Information -->
                        ${
                            ventilation &&
                            Object.values(ventilation).some((v) => v)
                                ? `
                        <h3>Ventilation Information</h3>
                        <div>
                            ${
                                ventilation.obstructionsToggle
                                    ? `
                            <div class="info-row">
                                <span class="label">Obstructions:</span> 
                                <span class="data">${ventilation.obstructionsToggle}</span>
                            </div>`
                                    : ""
                            }
                            
                            ${
                                ventilation.damageToggle
                                    ? `
                            <div class="info-row">
                                <span class="label">Damage:</span> 
                                <span class="data">${ventilation.damageToggle}</span>
                            </div>`
                                    : ""
                            }
                            
                            ${
                                ventilation.inaccessibleAreasToggle
                                    ? `
                            <div class="info-row">
                                <span class="label">Inaccessible Areas:</span> 
                                <span class="data">${ventilation.inaccessibleAreasToggle}</span>
                            </div>`
                                    : ""
                            }
                            
                            ${
                                ventilation.clientActionsToggle
                                    ? `
                            <div class="info-row">
                                <span class="label">Client Actions:</span> 
                                <span class="data">${ventilation.clientActionsToggle}</span>
                            </div>`
                                    : ""
                            }
                            
                            ${
                                ventilation.description
                                    ? `
                            <div class="info-row">
                                <span class="label">Description:</span> 
                                <span class="data">${ventilation.description}</span>
                            </div>`
                                    : ""
                            }
                        </div>`
                                : ""
                        }
                        
                        <!-- Notes -->
                        ${
                            notes && Object.values(notes).some((note) => note)
                                ? `
                        <h3>Notes</h3>
                        ${
                            notes.comments
                                ? `
                        <div class="comment">
                            <strong>General Comments:</strong><br>
                            ${notes.comments}
                        </div>`
                                : ""
                        }
                        
                        ${
                            notes.previousIssues
                                ? `
                        <div class="comment">
                            <strong>Previous Issues:</strong><br>
                            ${notes.previousIssues}
                        </div>`
                                : ""
                        }
                        
                        ${
                            notes.damage
                                ? `
                        <div class="comment">
                            <strong>Damage:</strong><br>
                            ${notes.damage}
                        </div>`
                                : ""
                        }
                        
                        ${
                            notes.inaccessibleAreas
                                ? `
                        <div class="comment">
                            <strong>Inaccessible Areas:</strong><br>
                            ${notes.inaccessibleAreas}
                        </div>`
                                : ""
                        }
                        
                        ${
                            notes.clientActions
                                ? `
                        <div class="comment">
                            <strong>Client Actions:</strong><br>
                            ${notes.clientActions}
                        </div>`
                                : ""
                        }`
                                : ""
                        }
                    </div>
                </div>
            </div>
            
            <!-- Footer -->
            <div class="footer">
                <p>This quote is valid for 30 days from the date of issue. All prices are subject to final survey confirmation.</p>
                <p>Reference: ${
                    refValue || "N/A"
                } - Generated on ${new Date().toLocaleString()}</p>
            </div>
        </div>
        
        <!-- Footer for each page -->
        <div class="page-footer">
            Reference: ${
                refValue || "N/A"
            } - Page <span class="pageNumber"></span> of <span class="totalPages"></span>
        </div>
    </div>
</body>
</html>
    `;
};

// Create and export a hook that provides PDF functionality
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

    // Create a function to compute equipment total
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
                // Extract all survey data needed for the quote
                const { refValue, siteDetails } = surveyData || {};

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

                // Generate the HTML content for the PDF using the extracted function
                const htmlContent = generateStyledHtml(
                    surveyData,
                    schematicHtml
                );

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
        getSurveyPdfFolder, // Now exported from cloudinary.js
        computeEquipmentTotal,
        isLoading: pdfState.isLoading,
        isReady: pdfState.isReady,
        error: pdfState.error,
        // Also expose the HTML generation function
        generateStyledHtml,
    };
};

// Export the default component (if needed separately)
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

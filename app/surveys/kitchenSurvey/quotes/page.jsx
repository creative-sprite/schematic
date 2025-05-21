// app/surveys/kitchenSurvey/quotes/page.jsx
"use client";

import React, { useState, useEffect } from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { Card } from "primereact/card";
// Import the generateStyledHtml function directly
import { generateStyledHtml } from "@/components/kitchenSurvey/save/SavePDF";

export default function QuotesPage() {
    // Enhanced demo data for testing PDF rendering
    const [demoData, setDemoData] = useState({
        refValue: "DEMO-001",
        surveyDate: new Date(),
        siteDetails: {
            siteName: "Demo Site",
            address: "123 Example Street, London",
        },
        primaryContactIndex: 0,
        contacts: [
            {
                contactFirstName: "John",
                contactLastName: "Smith",
                number: "07123456789",
                email: "john@example.com",
            },
        ],
        structureId: "Kitchen Area 1",
        structureDimensions: { length: 5, width: 4, height: 3 },
        structureTotal: 1500,
        structureSelectionData: [
            { type: "Component 1", item: "Item A", grade: "Grade 1" },
            { type: "Component 2", item: "Item B", grade: "Grade 2" },
            { type: "Component 3", item: "Item C", grade: "Grade 1" },
        ],
        structureComments: "Example structure comments would appear here.",
        surveyData: [
            {
                subcategory: "Category A",
                name: "Item 1",
                quantity: 3,
                price: 400,
            },
            {
                subcategory: "Category B",
                name: "Item 2",
                quantity: 2,
                price: 300,
            },
            {
                subcategory: "Category C",
                name: "Item 3",
                quantity: 1,
                price: 500,
            },
        ],
        specialistEquipmentData: [
            { name: "Item 1", category: "Category X" },
            { name: "Item 2", category: "Category Y" },
        ],
        canopyTotal: 800,
        canopyEntries: [
            {
                canopy: {
                    type: "Standard",
                    grade: "A",
                    length: 2,
                    width: 1,
                    height: 0.5,
                },
                filter: { type: "HEPA", grade: "Premium" },
            },
        ],
        operations: {
            operationalHours: {
                weekdays: { start: "9:00", end: "17:00" },
                weekend: { start: "10:00", end: "15:00" },
            },
            typeOfCooking: "Mixed cuisine",
        },
        ventilationPrice: 500,
        accessDoorPrice: 200,
        schematicItemsTotal: 500,
        modify: 0,
        access: {
            inductionNeeded: "Yes",
            roofAccess: "Limited",
            permitToWork: "Required",
        },
        ventilation: {
            obstructionsToggle: "None",
            damageToggle: "Minor",
        },
        notes: {
            comments: "Example notes about the survey would appear here.",
        },
    });

    // Format price for display
    const formatPrice = (value) => {
        return `£${Number(value).toFixed(2)}`;
    };

    // Calculate the subtotal and grand total for the demo
    const equipmentTotal =
        demoData.surveyData?.reduce(
            (sum, item) => sum + (item.price || 0),
            0
        ) || 0;

    const subtotal =
        (demoData.structureTotal || 0) +
        (equipmentTotal || 0) +
        (demoData.canopyTotal || 0) +
        (demoData.ventilationPrice || 0) +
        (demoData.accessDoorPrice || 0) +
        (demoData.schematicItemsTotal || 0);

    const grandTotal = subtotal * (1 + (demoData.modify || 0) / 100);

    return (
        <div className="quotes-container p-4">
            <h1 className="text-2xl font-bold mb-4">Quote Template Preview</h1>

            {/* Simple controls to update demo text */}
            <div className="bg-gray-100 p-4 rounded-lg mb-4 flex flex-wrap gap-4">
                <div>
                    <label className="block mb-1">Reference</label>
                    <InputText
                        value={demoData.refValue}
                        onChange={(e) =>
                            setDemoData({
                                ...demoData,
                                refValue: e.target.value,
                            })
                        }
                    />
                </div>
                <div>
                    <label className="block mb-1">Site Name</label>
                    <InputText
                        value={demoData.siteDetails.siteName}
                        onChange={(e) =>
                            setDemoData({
                                ...demoData,
                                siteDetails: {
                                    ...demoData.siteDetails,
                                    siteName: e.target.value,
                                },
                            })
                        }
                    />
                </div>
                <div>
                    <label className="block mb-1">Structure ID</label>
                    <InputText
                        value={demoData.structureId}
                        onChange={(e) =>
                            setDemoData({
                                ...demoData,
                                structureId: e.target.value,
                            })
                        }
                    />
                </div>
                <div>
                    <label className="block mb-1">Structure Total</label>
                    <InputNumber
                        value={demoData.structureTotal}
                        onValueChange={(e) =>
                            setDemoData({
                                ...demoData,
                                structureTotal: e.value,
                            })
                        }
                        mode="currency"
                        currency="GBP"
                    />
                </div>
                <div>
                    <label className="block mb-1">Modification %</label>
                    <InputNumber
                        value={demoData.modify}
                        onValueChange={(e) =>
                            setDemoData({ ...demoData, modify: e.value })
                        }
                        suffix="%"
                    />
                </div>
            </div>

            {/* PDF Preview - Using the same HTML generation function as the actual PDF */}
            <div className="border-2 border-gray-200 rounded-lg bg-white w-full">
                <div className="p-4 bg-gray-100 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-lg font-semibold">PDF Preview</h2>
                    <div className="text-sm text-gray-600">
                        Grand Total: {formatPrice(grandTotal)}
                    </div>
                </div>
                <div className="p-4">
                    {/* Use the EXACT same function that's used for generating the actual PDF */}
                    <iframe
                        srcDoc={generateStyledHtml(demoData, null)}
                        style={{
                            width: "100%",
                            border: "none",
                            minHeight:
                                "800px" /* Increased minimum height for better viewing */,
                            height: "auto",
                        }}
                        onLoad={(e) => {
                            // Auto-resize iframe to content height
                            if (e.target.contentDocument) {
                                e.target.style.height =
                                    e.target.contentDocument.documentElement
                                        .scrollHeight + "px";
                            }
                        }}
                        title="PDF Preview"
                    />
                </div>
            </div>
        </div>
    );
}

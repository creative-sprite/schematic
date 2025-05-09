// components/kitchenSurvey/pricing/GrandTotalSection.jsx

import React from "react";
import { calculateGrandTotal } from "./PricingUtils";

/**
 * Component to display the grand total section that combines all areas
 */
export default function GrandTotalSection({
    structureTotal,
    structureId,
    computedEquipmentTotal,
    canopyTotal,
    accessDoorPrice,
    ventilationPrice,
    airPrice,
    fanPartsPrice,
    airInExTotal,
    schematicItemsTotal,
    areasState,
    modify,
    specialistEquipmentData = [],
}) {
    // Don't render if there's no data
    if (
        structureTotal <= 0 &&
        computedEquipmentTotal <= 0 &&
        canopyTotal <= 0 &&
        areasState.length === 0
    ) {
        return null;
    }

    // Calculate the grand total
    const grandTotal = calculateGrandTotal(
        structureTotal,
        computedEquipmentTotal,
        canopyTotal,
        accessDoorPrice,
        ventilationPrice,
        airPrice,
        fanPartsPrice,
        airInExTotal,
        schematicItemsTotal,
        areasState,
        modify,
        specialistEquipmentData
    );

    return (
        <div
            className="grand-total-container grand-total-section"
            style={{
                margin: "2rem 0",
                padding: "1.5rem",
                border: "3px solid #2c3e50",
                borderRadius: "8px",
                backgroundColor: "#f8f9fa",
                boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
            }}
        >
            <h2
                style={{
                    textAlign: "center",
                    margin: "0 0 1.5rem 0",
                    color: "#2c3e50",
                    borderBottom: "2px solid #2c3e50",
                    paddingBottom: "0.75rem",
                }}
            >
                Total Clean Price
            </h2>

            <table className="common-table" style={{ width: "100%" }}>
                <thead>
                    <tr>
                        <th style={{ textAlign: "left" }}>Area</th>
                        <th style={{ textAlign: "right" }}>Total</th>
                    </tr>
                </thead>
                <tbody>
                    {/* Main Area row */}
                    <tr>
                        <td>{structureId || "Area 1 (Main)"}</td>
                        <td style={{ textAlign: "right" }}>
                            £
                            {(
                                (Number(structureTotal) || 0) +
                                (Number(computedEquipmentTotal) || 0) +
                                (Number(canopyTotal) || 0) +
                                (Number(accessDoorPrice) || 0) +
                                (Number(ventilationPrice) || 0) +
                                (Number(airPrice) || 0) +
                                (Number(fanPartsPrice) || 0) +
                                (Number(airInExTotal) || 0) +
                                (typeof schematicItemsTotal === "object"
                                    ? Number(schematicItemsTotal.overall) || 0
                                    : Number(schematicItemsTotal) || 0) +
                                (Array.isArray(specialistEquipmentData)
                                    ? specialistEquipmentData.reduce(
                                          (total, item) => {
                                              const price =
                                                  Number(item.price) || 0;
                                              const quantity =
                                                  Number(item.number) || 1;
                                              return total + price * quantity;
                                          },
                                          0
                                      )
                                    : 0)
                            ).toFixed(2)}
                        </td>
                    </tr>

                    {/* Duplicated Areas rows */}
                    {areasState.map((area, index) => {
                        // Ensure all values are properly converted to numbers
                        const structureTotal = Number(area.structureTotal) || 0;
                        const equipmentTotal = Number(area.equipmentTotal) || 0;
                        const canopyTotal = Number(area.canopyTotal) || 0;
                        const accessDoorPrice =
                            Number(area.accessDoorPrice) || 0;
                        const ventilationPrice =
                            Number(area.ventilationPrice) || 0;
                        const airPrice = Number(area.airPrice) || 0;
                        const fanPartsPrice = Number(area.fanPartsPrice) || 0;
                        const airInExTotal = Number(area.airInExTotal) || 0;

                        // Handle schematicItemsTotal which might be an object
                        let schematicItemsTotal = 0;
                        if (
                            typeof area.schematicItemsTotal === "object" &&
                            area.schematicItemsTotal !== null
                        ) {
                            schematicItemsTotal =
                                Number(area.schematicItemsTotal.overall) || 0;
                        } else {
                            schematicItemsTotal =
                                Number(area.schematicItemsTotal) || 0;
                        }

                        const areaTotal =
                            structureTotal +
                            equipmentTotal +
                            canopyTotal +
                            accessDoorPrice +
                            ventilationPrice +
                            airPrice +
                            fanPartsPrice +
                            airInExTotal +
                            schematicItemsTotal;

                        // Skip areas with no data
                        if (areaTotal === 0) return null;

                        return (
                            <tr key={index}>
                                <td>
                                    {area.structure?.structureId ||
                                        `Area ${index + 2}`}
                                </td>
                                <td style={{ textAlign: "right" }}>
                                    {(
                                        areaTotal *
                                        (1 + (Number(modify) || 0) / 100)
                                    ).toFixed(2)}
                                </td>
                            </tr>
                        );
                    })}

                    {/* Grand Total row */}
                    <tr
                        style={{
                            fontWeight: "bold",
                            borderTop: "2px solid #2c3e50",
                            fontSize: "1.1rem",
                        }}
                    >
                        <td>GRAND TOTAL</td>
                        <td style={{ textAlign: "right" }}>
                            £{grandTotal.toFixed(2)}
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
}

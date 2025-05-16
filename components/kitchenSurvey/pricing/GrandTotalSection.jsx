// components/kitchenSurvey/pricing/GrandTotalSection.jsx

import React from "react";
import { calculateGrandTotal } from "./PricingUtils";

/**
 * Component to display the grand total section for the main area only
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
    // Keep areasState parameter but it will be empty
    areasState,
    modify,
    specialistEquipmentData = [],
}) {
    // Don't render if there's no data
    if (
        structureTotal <= 0 &&
        computedEquipmentTotal <= 0 &&
        canopyTotal <= 0
    ) {
        return null;
    }

    // Calculate the grand total for main area only
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
        [], // Empty array for child areas
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

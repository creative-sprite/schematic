// components\kitchenSurvey\DropItemGrade.jsx
"use client";
import React, { useRef, useEffect } from "react";
import { Button } from "primereact/button";
import { OverlayPanel } from "primereact/overlaypanel";

export default function DropItemGrade({
    items,
    value,
    onChange,
    placeholder = "Select Item & Grade",
}) {
    const op = useRef(null);

    // ADDED: Debug logging only to diagnose the Floor selection issue
    useEffect(() => {
        // Only log when this might be the Floor row
        if (value && value.type === "Floor") {
            console.log("DropItemGrade for Floor:", {
                currentValue: value,
                availableItems: items ? items.length : 0,
            });
        }
    }, [value, items]);

    // When a grade is selected, update the parent with both item and grade, then hide the overlay.
    const handleGradeSelect = (item, grade) => {
        // ADDED: Log selection events for debugging
        console.log("DropItemGrade: Grade selected", {
            item: item.item,
            grade: grade,
        });

        if (onChange) {
            onChange({ item: item.item, grade });
        }
        op.current.hide();
    };

    // Determine what label to display on the trigger button.
    const triggerLabel =
        value && value.item && value.grade
            ? `${value.item} - ${value.grade}`
            : placeholder;

    return (
        <div style={{ textAlign: "center", verticalAlign: "middle" }}>
            <Button
                label={triggerLabel}
                onClick={(e) => op.current.toggle(e)}
                style={{ width: "auto", maxWidth: "100%", height: "40px" }}
            />
            <OverlayPanel
                ref={op}
                style={{
                    width: "auto",
                    maxHeight: "270px",
                    overflowY: "auto",
                    overflowX: "auto",
                }}
                className="dropitemgrade-overlay"
            >
                <table
                    style={{
                        display: "inline-table", // Shrink to fit content
                        tableLayout: "auto",
                        borderCollapse: "collapse",
                    }}
                >
                    <thead
                        style={{
                            position: "sticky",
                            top: 0,
                            backgroundColor: "white",
                            zIndex: 1,
                        }}
                    >
                        <tr>
                            <th
                                style={{
                                    textAlign: "left",
                                    borderBottom: "1px solid #ccc",
                                    padding: "4px",
                                }}
                            >
                                Item
                            </th>
                            <th
                                style={{
                                    textAlign: "left",
                                    borderBottom: "1px solid #ccc",
                                    padding: "4px",
                                    overflowX: "auto",
                                }}
                            >
                                Grades
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, index) => {
                            // Get the sorted list of available grades from the item's prices.
                            const grades = item.prices
                                ? Object.keys(item.prices).sort((a, b) =>
                                      a.localeCompare(b)
                                  )
                                : [];
                            return (
                                <tr key={index}>
                                    <td
                                        style={{
                                            borderBottom: "1px solid #eee",
                                        }}
                                    >
                                        {item.item}
                                    </td>
                                    <td
                                        // Modified style: added maxWidth and overflowX to allow shrinking on small screens.
                                        style={{
                                            borderBottom: "1px solid #eee",
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        {grades.map((grade, i) => (
                                            <Button
                                                key={i}
                                                label={grade}
                                                onClick={() =>
                                                    handleGradeSelect(
                                                        item,
                                                        grade
                                                    )
                                                }
                                                className="p-button-text"
                                                style={{
                                                    color: "#3B3B3B",
                                                    width: "10px",
                                                    padding: "17px",
                                                    backgroundColor:
                                                        value &&
                                                        value.item ===
                                                            item.item &&
                                                        value.grade === grade
                                                            ? "#d9edf7"
                                                            : "transparent",
                                                    border:
                                                        value &&
                                                        value.item ===
                                                            item.item &&
                                                        value.grade === grade
                                                            ? "1px solid #31708f"
                                                            : "1px solid transparent",
                                                }}
                                            />
                                        ))}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </OverlayPanel>
        </div>
    );
}

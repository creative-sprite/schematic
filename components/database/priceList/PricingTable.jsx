// components\database\priceList\PricingTable.jsx

"use client";
import React, { useState, useEffect, useMemo } from "react";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";

const baseCellStyle = {
    textAlign: "center",
    borderBottom: "1px solid #ccc",
    borderLeft: "none",
    borderRight: "none",
    padding: "4px",
    whiteSpace: "normal", // Ensures text wraps
    wordWrap: "break-word", // Ensures long text breaks
};

const columnStyles = {
    category: { width: "150px", ...baseCellStyle },
    subcategory: { width: "150px", ...baseCellStyle },
    item: { width: "300px", ...baseCellStyle },
    svgPath: { width: "150px", ...baseCellStyle },
    // New columns:
    calcType: { width: "100px", ...baseCellStyle },
    aggregate: { width: "70px", ...baseCellStyle },
    dimensions: { width: "90px", ...baseCellStyle },
    price: { width: "60px", ...baseCellStyle },
    actions: { width: "250px", ...baseCellStyle },
};

export default function PricingTable({
    items,
    editingItems, // object with row id keys containing controlled editing values
    startEditing, // function(rowData)
    cancelEditing, // function(rowId)
    saveEditing, // function(rowId, newData)
    deleteItem, // function(rowId)
    onEditChange, // function(rowId, field, value, isPrice) to update controlled editingItems
}) {
    // Use useMemo to compute unique calc type options so that they don't change every render.
    const calcTypeOptions = useMemo(() => {
        // We'll return an array of { label, value } objects for the datalist.
        const uniqueTypes = new Set();
        items.forEach((item) => {
            if (item.calculationType && item.calculationType.trim() !== "") {
                uniqueTypes.add(item.calculationType.trim());
            }
        });
        // Convert to array of objects for the datalist
        return Array.from(uniqueTypes).map((val) => ({
            label: val,
            value: val,
        }));
    }, [items]);

    // Group items by category then by subcategory.
    const groupedItems = items.reduce((acc, item) => {
        const category = item.category || "";
        const subcategory = item.subcategory || "";
        if (!acc[category]) acc[category] = {};
        if (!acc[category][subcategory]) acc[category][subcategory] = [];
        acc[category][subcategory].push(item);
        return acc;
    }, {});

    const sortedCategories = Object.keys(groupedItems).sort((a, b) =>
        a.localeCompare(b)
    );

    const renderCell = (rowData, field, isPrice = false) => {
        // If we're editing this row, show an editable input
        if (editingItems && editingItems[rowData._id]) {
            if (field === "calculationType") {
                // Use InputText with an associated datalist for autofill suggestions.
                return (
                    <div>
                        <InputText
                            name={field}
                            value={editingItems[rowData._id][field] ?? ""}
                            onChange={(e) =>
                                onEditChange(rowData._id, field, e.target.value)
                            }
                            style={{
                                width: "150px",
                                maxWidth: "110px",
                                boxSizing: "border-box",
                                textAlign: "center",
                            }}
                            placeholder="Calc"
                        />
                        <datalist id="calcTypeList">
                            {calcTypeOptions.map((opt) => (
                                <option key={opt.value} value={opt.value} />
                            ))}
                        </datalist>
                    </div>
                );
            }
            if (
                field === "category" ||
                field === "subcategory" ||
                field === "item" ||
                field === "svgPath"
            ) {
                return (
                    <InputText
                        name={field}
                        value={editingItems[rowData._id][field] ?? ""}
                        onChange={(e) =>
                            onEditChange(rowData._id, field, e.target.value)
                        }
                        style={{
                            width: "100%",
                            boxSizing: "border-box",
                            textAlign: "center",
                        }}
                    />
                );
            }
            // For price fields (A, B, C, D, E)
            return (
                <InputText
                    name={field}
                    value={editingItems[rowData._id].prices[field] ?? ""}
                    onChange={(e) =>
                        onEditChange(rowData._id, field, e.target.value, true)
                    }
                    style={{
                        width: "100%",
                        boxSizing: "border-box",
                        textAlign: "center",
                    }}
                />
            );
        }
        // If not editing, just display the field's value
        if (
            field === "category" ||
            field === "subcategory" ||
            field === "item" ||
            field === "svgPath" ||
            field === "calculationType"
        ) {
            return rowData[field];
        } else {
            return Number(rowData.prices[field]).toFixed(2);
        }
    };

    const renderCheckboxCell = (rowData, field) => {
        // For aggregateEntry and requiresDimensions fields which are boolean.
        if (editingItems && editingItems[rowData._id]) {
            return (
                <input
                    type="checkbox"
                    checked={editingItems[rowData._id][field] ?? false}
                    onChange={(e) =>
                        onEditChange(rowData._id, field, e.target.checked)
                    }
                    style={{ margin: "auto" }}
                />
            );
        }
        return rowData[field] ? "Yes" : "No";
    };

    const renderActions = (rowData) => {
        const commonStyle = {
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "20px",
        };
        if (editingItems && editingItems[rowData._id]) {
            return (
                <div style={commonStyle}>
                    <Button
                        icon="pi pi-check"
                        onClick={() =>
                            saveEditing(rowData._id, editingItems[rowData._id])
                        }
                        style={{ marginRight: "20px" }}
                    />
                    <Button
                        icon="pi pi-times"
                        onClick={() => cancelEditing(rowData._id)}
                        className="p-button-secondary"
                        style={{ marginRight: "20px" }}
                    />
                    <Button
                        icon="pi pi-trash"
                        onClick={() => deleteItem(rowData._id)}
                        className="p-button-danger"
                    />
                </div>
            );
        }
        return (
            <div style={commonStyle}>
                <Button
                    icon="pi pi-pencil"
                    label="Edit"
                    onClick={() => startEditing(rowData)}
                />
            </div>
        );
    };

    return (
        <>
            {sortedCategories.map((category) => {
                const subcats = groupedItems[category];
                const sortedSubcats = Object.keys(subcats).sort((a, b) =>
                    a.localeCompare(b)
                );
                return (
                    <div key={category} style={{ marginBottom: "2rem" }}>
                        <h1
                            style={{
                                marginTop: "30px",
                                marginBottom: "0",
                                padding: 0,
                            }}
                        >
                            {category}
                        </h1>
                        {Object.keys(subcats)
                            .sort((a, b) => a.localeCompare(b))
                            .map((subcat) => {
                                const itemsInSub = subcats[subcat].sort(
                                    (a, b) =>
                                        (a.item || "").localeCompare(
                                            b.item || ""
                                        )
                                );
                                return (
                                    <div
                                        key={subcat}
                                        style={{ marginBottom: "1rem" }}
                                    >
                                        <h2
                                            style={{
                                                marginTop: "30px",
                                                marginBottom: "20px",
                                                padding: 0,
                                            }}
                                        >
                                            {subcat}
                                        </h2>
                                        <table
                                            style={{
                                                width: "100%",
                                                tableLayout: "fixed",
                                                borderCollapse: "collapse",
                                            }}
                                        >
                                            <thead>
                                                <tr style={{ height: "20px" }}>
                                                    <th
                                                        style={
                                                            columnStyles.category
                                                        }
                                                    >
                                                        Category
                                                    </th>
                                                    <th
                                                        style={
                                                            columnStyles.subcategory
                                                        }
                                                    >
                                                        Subcategory
                                                    </th>
                                                    <th
                                                        style={
                                                            columnStyles.item
                                                        }
                                                    >
                                                        Item
                                                    </th>
                                                    <th
                                                        style={
                                                            columnStyles.svgPath
                                                        }
                                                    >
                                                        SVG Path
                                                    </th>
                                                    {/* New Columns Inserted */}
                                                    <th
                                                        style={
                                                            columnStyles.calcType
                                                        }
                                                    >
                                                        Calculations
                                                    </th>
                                                    <th
                                                        style={
                                                            columnStyles.aggregate
                                                        }
                                                    >
                                                        Aggregate
                                                    </th>
                                                    <th
                                                        style={
                                                            columnStyles.dimensions
                                                        }
                                                    >
                                                        Dimensions
                                                    </th>
                                                    {/* End New Columns */}
                                                    <th
                                                        style={
                                                            columnStyles.price
                                                        }
                                                    >
                                                        A
                                                    </th>
                                                    <th
                                                        style={
                                                            columnStyles.price
                                                        }
                                                    >
                                                        B
                                                    </th>
                                                    <th
                                                        style={
                                                            columnStyles.price
                                                        }
                                                    >
                                                        C
                                                    </th>
                                                    <th
                                                        style={
                                                            columnStyles.price
                                                        }
                                                    >
                                                        D
                                                    </th>
                                                    <th
                                                        style={
                                                            columnStyles.price
                                                        }
                                                    >
                                                        E
                                                    </th>
                                                    <th
                                                        style={
                                                            columnStyles.actions
                                                        }
                                                    >
                                                        Edit | Save | Cancel |
                                                        Delete
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {itemsInSub.map((row) => (
                                                    <tr
                                                        key={row._id}
                                                        style={{
                                                            height: "10px",
                                                        }}
                                                    >
                                                        <td
                                                            style={
                                                                columnStyles.category
                                                            }
                                                        >
                                                            {renderCell(
                                                                row,
                                                                "category"
                                                            )}
                                                        </td>
                                                        <td
                                                            style={
                                                                columnStyles.subcategory
                                                            }
                                                        >
                                                            {renderCell(
                                                                row,
                                                                "subcategory"
                                                            )}
                                                        </td>
                                                        <td
                                                            style={
                                                                columnStyles.item
                                                            }
                                                        >
                                                            {renderCell(
                                                                row,
                                                                "item"
                                                            )}
                                                        </td>
                                                        <td
                                                            style={
                                                                columnStyles.svgPath
                                                            }
                                                        >
                                                            {renderCell(
                                                                row,
                                                                "svgPath"
                                                            )}
                                                        </td>
                                                        <td
                                                            style={
                                                                columnStyles.calcType
                                                            }
                                                        >
                                                            {renderCell(
                                                                row,
                                                                "calculationType"
                                                            )}
                                                        </td>
                                                        <td
                                                            style={
                                                                columnStyles.aggregate
                                                            }
                                                        >
                                                            {renderCheckboxCell(
                                                                row,
                                                                "aggregateEntry"
                                                            )}
                                                        </td>
                                                        <td
                                                            style={
                                                                columnStyles.dimensions
                                                            }
                                                        >
                                                            {renderCheckboxCell(
                                                                row,
                                                                "requiresDimensions"
                                                            )}
                                                        </td>
                                                        <td
                                                            style={
                                                                columnStyles.price
                                                            }
                                                        >
                                                            {renderCell(
                                                                row,
                                                                "A",
                                                                true
                                                            )}
                                                        </td>
                                                        <td
                                                            style={
                                                                columnStyles.price
                                                            }
                                                        >
                                                            {renderCell(
                                                                row,
                                                                "B",
                                                                true
                                                            )}
                                                        </td>
                                                        <td
                                                            style={
                                                                columnStyles.price
                                                            }
                                                        >
                                                            {renderCell(
                                                                row,
                                                                "C",
                                                                true
                                                            )}
                                                        </td>
                                                        <td
                                                            style={
                                                                columnStyles.price
                                                            }
                                                        >
                                                            {renderCell(
                                                                row,
                                                                "D",
                                                                true
                                                            )}
                                                        </td>
                                                        <td
                                                            style={
                                                                columnStyles.price
                                                            }
                                                        >
                                                            {renderCell(
                                                                row,
                                                                "E",
                                                                true
                                                            )}
                                                        </td>
                                                        <td
                                                            style={
                                                                columnStyles.actions
                                                            }
                                                        >
                                                            {renderActions(row)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                );
                            })}
                    </div>
                );
            })}
        </>
    );
}

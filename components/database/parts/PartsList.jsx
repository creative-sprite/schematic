// components\database\parts\PartsList.jsx

"use client";

import React from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";

// Common styles for table cells similar to PricingTable
const baseCellStyle = {
    textAlign: "center",
    borderBottom: "1px solid #ccc",
    borderLeft: "none",
    borderRight: "none",
    padding: "4px",
    whiteSpace: "normal",
};

const columnStyles = {
    category: { width: "150px", ...baseCellStyle },
    subcategory: { width: "150px", ...baseCellStyle },
    item: { width: "300px", ...baseCellStyle },
    svgPath: { width: "150px", ...baseCellStyle },
    aggregate: { width: "70px", ...baseCellStyle },
    dimensions: { width: "90px", ...baseCellStyle },
    actions: { width: "195px", ...baseCellStyle },
};

export default function PartsList({
    parts,
    editingItems,
    startEditing,
    cancelEditing,
    saveEditing,
    deleteItem,
    onEditChange,
}) {
    // Group parts by category and subcategory
    const groupedParts = parts.reduce((acc, part) => {
        const category = part.category || "Other";
        const subcategory = part.subcategory || "Other";
        if (!acc[category]) {
            acc[category] = {};
        }
        if (!acc[category][subcategory]) {
            acc[category][subcategory] = [];
        }
        acc[category][subcategory].push(part);
        return acc;
    }, {});

    const sortedCategories = Object.keys(groupedParts).sort((a, b) =>
        a.localeCompare(b)
    );

    return (
        <>
            {sortedCategories.map((category) => {
                const subcats = groupedParts[category];
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
                                textAlign: "left",
                            }}
                        >
                            {category}
                        </h1>
                        {sortedSubcats.map((subcat) => {
                            // **** Begin Sorting Parts by Item Name ****
                            const partsInSub = subcats[subcat].sort((a, b) =>
                                (a.item || "").localeCompare(b.item || "")
                            );
                            // **** End Sorting Parts by Item Name ****
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
                                            textAlign: "left",
                                        }}
                                    >
                                        {subcat}
                                    </h2>
                                    <table
                                        className="common-table"
                                        style={{
                                            width: "100%",
                                            borderCollapse: "collapse",
                                            backgroundColor: "#fff",
                                            marginTop: "1rem",
                                        }}
                                    >
                                        <thead>
                                            <tr
                                                style={{
                                                    backgroundColor: "#f0f0f0",
                                                }}
                                            >
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
                                                <th style={columnStyles.item}>
                                                    Item
                                                </th>
                                                <th
                                                    style={columnStyles.svgPath}
                                                >
                                                    SVG Path
                                                </th>
                                                <th
                                                    style={
                                                        columnStyles.aggregate
                                                    }
                                                >
                                                    Aggregate Entry
                                                </th>
                                                <th
                                                    style={
                                                        columnStyles.dimensions
                                                    }
                                                >
                                                    Requires Dimensions
                                                </th>
                                                <th
                                                    style={columnStyles.actions}
                                                >
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {partsInSub.map((part) => (
                                                <tr
                                                    key={part._id}
                                                    className={
                                                        editingItems[part._id]
                                                            ? "editing-row"
                                                            : ""
                                                    }
                                                >
                                                    <td
                                                        style={
                                                            columnStyles.category
                                                        }
                                                    >
                                                        {editingItems[
                                                            part._id
                                                        ] ? (
                                                            <InputText
                                                                name="category"
                                                                value={
                                                                    editingItems[
                                                                        part._id
                                                                    ]
                                                                        .category ||
                                                                    ""
                                                                }
                                                                onChange={(e) =>
                                                                    onEditChange(
                                                                        part._id,
                                                                        "category",
                                                                        e.target
                                                                            .value
                                                                    )
                                                                }
                                                                style={{
                                                                    width: "100%",
                                                                    textAlign:
                                                                        "center",
                                                                }}
                                                            />
                                                        ) : (
                                                            part.category
                                                        )}
                                                    </td>
                                                    <td
                                                        style={
                                                            columnStyles.subcategory
                                                        }
                                                    >
                                                        {editingItems[
                                                            part._id
                                                        ] ? (
                                                            <InputText
                                                                name="subcategory"
                                                                value={
                                                                    editingItems[
                                                                        part._id
                                                                    ]
                                                                        .subcategory ||
                                                                    ""
                                                                }
                                                                onChange={(e) =>
                                                                    onEditChange(
                                                                        part._id,
                                                                        "subcategory",
                                                                        e.target
                                                                            .value
                                                                    )
                                                                }
                                                                style={{
                                                                    width: "100%",
                                                                    textAlign:
                                                                        "center",
                                                                }}
                                                            />
                                                        ) : (
                                                            part.subcategory
                                                        )}
                                                    </td>
                                                    <td
                                                        style={
                                                            columnStyles.item
                                                        }
                                                    >
                                                        {editingItems[
                                                            part._id
                                                        ] ? (
                                                            <InputText
                                                                name="item"
                                                                value={
                                                                    editingItems[
                                                                        part._id
                                                                    ].item || ""
                                                                }
                                                                onChange={(e) =>
                                                                    onEditChange(
                                                                        part._id,
                                                                        "item",
                                                                        e.target
                                                                            .value
                                                                    )
                                                                }
                                                                style={{
                                                                    width: "100%",
                                                                    textAlign:
                                                                        "center",
                                                                }}
                                                            />
                                                        ) : (
                                                            part.item
                                                        )}
                                                    </td>
                                                    <td
                                                        style={
                                                            columnStyles.svgPath
                                                        }
                                                    >
                                                        {editingItems[
                                                            part._id
                                                        ] ? (
                                                            <InputText
                                                                name="svgPath"
                                                                value={
                                                                    editingItems[
                                                                        part._id
                                                                    ].svgPath ||
                                                                    ""
                                                                }
                                                                onChange={(e) =>
                                                                    onEditChange(
                                                                        part._id,
                                                                        "svgPath",
                                                                        e.target
                                                                            .value
                                                                    )
                                                                }
                                                                style={{
                                                                    width: "100%",
                                                                    textAlign:
                                                                        "center",
                                                                }}
                                                            />
                                                        ) : (
                                                            part.svgPath
                                                        )}
                                                    </td>
                                                    <td
                                                        style={
                                                            columnStyles.aggregate
                                                        }
                                                    >
                                                        {editingItems[
                                                            part._id
                                                        ] ? (
                                                            <input
                                                                type="checkbox"
                                                                name="aggregateEntry"
                                                                checked={
                                                                    editingItems[
                                                                        part._id
                                                                    ]
                                                                        .aggregateEntry ||
                                                                    false
                                                                }
                                                                onChange={(e) =>
                                                                    onEditChange(
                                                                        part._id,
                                                                        "aggregateEntry",
                                                                        e.target
                                                                            .checked
                                                                    )
                                                                }
                                                                style={{
                                                                    width: "40px",
                                                                    height: "40px",
                                                                    margin: "auto",
                                                                    display:
                                                                        "block",
                                                                }}
                                                            />
                                                        ) : part.aggregateEntry ? (
                                                            "Yes"
                                                        ) : (
                                                            "No"
                                                        )}
                                                    </td>
                                                    <td
                                                        style={
                                                            columnStyles.dimensions
                                                        }
                                                    >
                                                        {editingItems[
                                                            part._id
                                                        ] ? (
                                                            <input
                                                                type="checkbox"
                                                                name="requiresDimensions"
                                                                checked={
                                                                    editingItems[
                                                                        part._id
                                                                    ]
                                                                        .requiresDimensions ||
                                                                    false
                                                                }
                                                                onChange={(e) =>
                                                                    onEditChange(
                                                                        part._id,
                                                                        "requiresDimensions",
                                                                        e.target
                                                                            .checked
                                                                    )
                                                                }
                                                                style={{
                                                                    width: "40px",
                                                                    height: "40px",
                                                                    margin: "auto",
                                                                    display:
                                                                        "block",
                                                                }}
                                                            />
                                                        ) : part.requiresDimensions ? (
                                                            "Yes"
                                                        ) : (
                                                            "No"
                                                        )}
                                                    </td>
                                                    <td
                                                        style={
                                                            columnStyles.actions
                                                        }
                                                    >
                                                        {editingItems[
                                                            part._id
                                                        ] ? (
                                                            <div
                                                                style={{
                                                                    display:
                                                                        "flex",
                                                                    alignItems:
                                                                        "center",
                                                                    justifyContent:
                                                                        "center",
                                                                    gap: "20px",
                                                                }}
                                                            >
                                                                <Button
                                                                    icon="pi pi-check"
                                                                    onClick={() =>
                                                                        saveEditing(
                                                                            part._id
                                                                        )
                                                                    }
                                                                    style={{
                                                                        marginRight:
                                                                            "20px",
                                                                    }}
                                                                />
                                                                <Button
                                                                    icon="pi pi-times"
                                                                    onClick={() =>
                                                                        cancelEditing(
                                                                            part._id
                                                                        )
                                                                    }
                                                                    className="p-button-secondary"
                                                                    style={{
                                                                        marginRight:
                                                                            "20px",
                                                                    }}
                                                                />
                                                                <Button
                                                                    icon="pi pi-trash"
                                                                    onClick={() =>
                                                                        deleteItem(
                                                                            part._id
                                                                        )
                                                                    }
                                                                    className="p-button-danger"
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div
                                                                style={{
                                                                    display:
                                                                        "flex",
                                                                    alignItems:
                                                                        "center",
                                                                    justifyContent:
                                                                        "center",
                                                                    gap: "20px",
                                                                }}
                                                            >
                                                                <Button
                                                                    icon="pi pi-pencil"
                                                                    label="Edit"
                                                                    onClick={() =>
                                                                        startEditing(
                                                                            part
                                                                        )
                                                                    }
                                                                />
                                                            </div>
                                                        )}
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

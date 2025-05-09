// components\database\priceList\PricingForm.jsx

"use client";
import React, { useState } from "react";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { Checkbox } from "primereact/checkbox"; // NEW: Import Checkbox for new boolean fields
import "../../../styles/priceList.css";

export default function PricingForm({ onAddItem, submitted }) {
    // Initial state now includes additional fields:
    // calculationType, aggregateEntry, requiresDimensions.
    const [formData, setFormData] = useState({
        category: "",
        subcategory: "",
        item: "",
        svgPath: "", // Original SVG Path field.
        // ---- New Fields Start ----
        calculationType: "none", // New field: free text for unique tags.
        aggregateEntry: false, // New field: if true, multiple placements aggregate into one list entry.
        requiresDimensions: false, // New field: if true, dimensions are required for price calculation.
        // ---- New Fields End ----
        prices: { A: "", B: "", C: "", D: "", E: "" },
    });

    const categoryOptions = [
        { label: "Equipment", value: "Equipment" },
        { label: "Structure", value: "Structure" },
        { label: "System", value: "System" },
        { label: "Grease", value: "Grease" },
        { label: "Air", value: "Air" },
    ].sort((a, b) => a.label.localeCompare(b.label));

    // (No calculationType dropdown options now, since we use a free text input.)

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (["A", "B", "C", "D", "E"].includes(name)) {
            setFormData((prev) => ({
                ...prev,
                prices: { ...prev.prices, [name]: value },
            }));
        } else {
            setFormData((prev) => ({
                ...prev,
                [name]: type === "checkbox" ? checked : value,
            }));
        }
    };

    const onSubmit = (e) => {
        e.preventDefault();
        // Parse price values as numbers.
        const parsedFormData = {
            ...formData,
            prices: {
                A: parseFloat(formData.prices.A) || 0,
                B: parseFloat(formData.prices.B) || 0,
                C: parseFloat(formData.prices.C) || 0,
                D: parseFloat(formData.prices.D) || 0,
                E: parseFloat(formData.prices.E) || 0,
            },
            svgPath: formData.svgPath || "",
        };
        onAddItem(parsedFormData);
        setFormData({
            category: "",
            subcategory: "",
            item: "",
            svgPath: "",
            calculationType: "none",
            aggregateEntry: false,
            requiresDimensions: false,
            prices: { A: "", B: "", C: "", D: "", E: "" },
        });
    };

    // Define a responsive card container style using flex-wrap and a 20px gap.
    const containerStyle = {
        display: "flex",
        flexWrap: "wrap",
        gap: "20px",
        padding: "20px",
        backgroundColor: "#fff",
        border: "1px solid #ccc",
        borderRadius: "8px",
        boxSizing: "border-box",
    };

    // Each input container uses a fixed width.
    const inputContainerStyle = (width) => ({
        width: width,
        display: "flex",
        flexDirection: "column",
    });

    return (
        <form onSubmit={onSubmit}>
            <div style={containerStyle}>
                {/* Category */}
                <div style={inputContainerStyle("150px")}>
                    <label
                        style={{
                            display: "flex",
                            justifyContent: "center",
                            marginBottom: "10px",
                        }}
                    >
                        Category
                    </label>
                    <Dropdown
                        value={formData.category}
                        options={categoryOptions}
                        onChange={(e) =>
                            setFormData((prev) => ({
                                ...prev,
                                category: e.value,
                            }))
                        }
                        className={
                            submitted && formData.category.trim() === ""
                                ? "p-invalid"
                                : ""
                        }
                    />
                </div>
                {/* Subcategory */}
                <div style={inputContainerStyle("150px")}>
                    <label
                        style={{
                            display: "flex",
                            justifyContent: "center",
                            marginBottom: "10px",
                        }}
                    >
                        Subcategory
                    </label>
                    <InputText
                        name="subcategory"
                        value={formData.subcategory}
                        onChange={handleChange}
                        className={
                            submitted && formData.subcategory.trim() === ""
                                ? "p-invalid"
                                : ""
                        }
                    />
                </div>
                {/* Item */}
                <div style={inputContainerStyle("300px")}>
                    <label
                        style={{
                            display: "flex",
                            justifyContent: "center",
                            marginBottom: "10px",
                        }}
                    >
                        Item
                    </label>
                    <InputText
                        name="item"
                        value={formData.item}
                        onChange={handleChange}
                        className={
                            submitted && formData.item.trim() === ""
                                ? "p-invalid"
                                : ""
                        }
                    />
                </div>
                {/* Price A */}
                <div style={inputContainerStyle("70px")}>
                    <label
                        style={{
                            display: "flex",
                            justifyContent: "center",
                            marginBottom: "10px",
                        }}
                    >
                        A
                    </label>
                    <InputText
                        name="A"
                        value={formData.prices.A}
                        onChange={handleChange}
                        className={
                            submitted && formData.prices.A.trim() === ""
                                ? "p-invalid"
                                : ""
                        }
                    />
                </div>
                {/* Price B */}
                <div style={inputContainerStyle("70px")}>
                    <label
                        style={{
                            display: "flex",
                            justifyContent: "center",
                            marginBottom: "10px",
                        }}
                    >
                        B
                    </label>
                    <InputText
                        name="B"
                        value={formData.prices.B}
                        onChange={handleChange}
                        className={
                            submitted && formData.prices.B.trim() === ""
                                ? "p-invalid"
                                : ""
                        }
                    />
                </div>
                {/* Price C */}
                <div style={inputContainerStyle("70px")}>
                    <label
                        style={{
                            display: "flex",
                            justifyContent: "center",
                            marginBottom: "10px",
                        }}
                    >
                        C
                    </label>
                    <InputText
                        name="C"
                        value={formData.prices.C}
                        onChange={handleChange}
                        className={
                            submitted && formData.prices.C.trim() === ""
                                ? "p-invalid"
                                : ""
                        }
                    />
                </div>
                {/* Price D */}
                <div style={inputContainerStyle("70px")}>
                    <label
                        style={{
                            display: "flex",
                            justifyContent: "center",
                            marginBottom: "10px",
                        }}
                    >
                        D
                    </label>
                    <InputText
                        name="D"
                        value={formData.prices.D}
                        onChange={handleChange}
                        className={
                            submitted && formData.prices.D.trim() === ""
                                ? "p-invalid"
                                : ""
                        }
                    />
                </div>
                {/* Price E */}
                <div style={inputContainerStyle("70px")}>
                    <label
                        style={{
                            display: "flex",
                            justifyContent: "center",
                            marginBottom: "10px",
                        }}
                    >
                        E
                    </label>
                    <InputText
                        name="E"
                        value={formData.prices.E}
                        onChange={handleChange}
                        className={
                            submitted && formData.prices.E.trim() === ""
                                ? "p-invalid"
                                : ""
                        }
                    />
                </div>
                {/* SVG Path */}
                <div style={inputContainerStyle("200px")}>
                    <label
                        style={{
                            display: "flex",
                            justifyContent: "center",
                            marginBottom: "10px",
                        }}
                    >
                        SVG Path
                    </label>
                    <InputText
                        name="svgPath"
                        value={formData.svgPath}
                        onChange={handleChange}
                    />
                </div>
                {/* Calculation Type as free text input */}
                <div style={inputContainerStyle("200px")}>
                    <label
                        style={{
                            display: "flex",
                            justifyContent: "center",
                            marginBottom: "10px",
                        }}
                    >
                        Calculation
                    </label>
                    <InputText
                        name="calculationType"
                        value={formData.calculationType}
                        onChange={handleChange}
                    />
                </div>
                {/* Aggregate Entry Checkbox */}
                <div style={inputContainerStyle("60px")}>
                    <label
                        style={{
                            display: "flex",
                            justifyContent: "center",
                            marginBottom: "10px",
                        }}
                    >
                        Aggregate
                    </label>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            height: "40px",
                        }}
                    >
                        <Checkbox
                            inputId="aggregateEntry"
                            name="aggregateEntry"
                            checked={formData.aggregateEntry}
                            onChange={handleChange}
                            className="custom-checkbox"
                        />
                    </div>
                </div>
                {/* Requires Dimensions Checkbox */}
                <div style={inputContainerStyle("60px")}>
                    <label
                        style={{
                            display: "flex",
                            justifyContent: "center",
                            marginBottom: "10px",
                        }}
                    >
                        Dims?
                    </label>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            height: "40px",
                        }}
                    >
                        <Checkbox
                            inputId="requiresDimensions"
                            name="requiresDimensions"
                            checked={formData.requiresDimensions}
                            onChange={handleChange}
                            className="custom-checkbox"
                        />
                    </div>
                </div>
                <div style={inputContainerStyle("auto")}>
                    <label style={{ visibility: "hidden" }}>Add</label>
                    <Button type="submit" icon="pi pi-plus" label="Add" />
                </div>
            </div>
            <style jsx>{`
                :global(.custom-checkbox .p-checkbox-box) {
                    width: 30px !important;
                    height: 30px !important;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                :global(.custom-checkbox) {
                    width: 30px !important;
                    height: 30px !important;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
            `}</style>
        </form>
    );
}

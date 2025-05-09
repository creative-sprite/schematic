// components\database\parts\PartsForm.jsx

"use client";

import React, { useState, useEffect } from "react";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { Checkbox } from "primereact/checkbox"; // NEW: Import Checkbox for new boolean fields

export default function PartsForm({ onSave, editingPart, onCancel }) {
    const initialState = {
        category: "",
        subcategory: "",
        item: "",
        svgPath: "",
        // ---- New Fields Start ----
        calculationType: "",
        aggregateEntry: false,
        requiresDimensions: false,
    };

    const [formData, setFormData] = useState(initialState);

    useEffect(() => {
        if (editingPart) {
            setFormData(editingPart);
        } else {
            setFormData(initialState);
        }
    }, [editingPart]);

    const categoryOptions = [
        { label: "Access Door", value: "Access Doors" },
        { label: "Air", value: "Air" },
        { label: "Equipment", value: "Equipment" },
        { label: "Grease", value: "Grease" },
        { label: "Structure", value: "Structure" },
        { label: "System", value: "System" },
    ];

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        let svgPath = formData.svgPath.trim();
        if (svgPath && !svgPath.startsWith("/schematic/")) {
            svgPath = `/schematic/${svgPath}`;
        }
        const dataToSave = { ...formData, svgPath };
        onSave(dataToSave);
        setFormData(initialState);
    };

    return (
        <form
            onSubmit={handleSubmit}
            style={{
                display: "flex",
                flexWrap: "nowrap",
                gap: "1rem",
                alignItems: "center",
                justifyContent: "center", // Horizontally center all inputs
            }}
        >
            {/* Category dropdown */}
            <Dropdown
                value={formData.category}
                options={categoryOptions}
                onChange={(e) =>
                    setFormData({ ...formData, category: e.value })
                }
                placeholder="Select Category"
                style={{
                    height: "40px",
                }}
            />

            {/* Subcategory input */}
            <InputText
                name="subcategory"
                value={formData.subcategory}
                onChange={handleChange}
                placeholder="Enter Subcategory"
                style={{
                    height: "40px",
                }}
            />

            {/* Item input */}
            <InputText
                name="item"
                value={formData.item}
                onChange={handleChange}
                placeholder="Enter Item"
                style={{
                    height: "40px",
                }}
            />

            {/* SVG path input */}
            <InputText
                name="svgPath"
                value={formData.svgPath}
                onChange={handleChange}
                placeholder="e.g. part1.svg"
                style={{
                    height: "40px",
                }}
            />

            {/* New Fields for Parts Schema */}
            {/* Calculation Type as free text input */}
            <InputText
                name="calculationType"
                value={formData.calculationType}
                onChange={handleChange}
                placeholder="Calculation Type"
                style={{
                    height: "40px",
                }}
            />

            {/* Aggregate Entry Checkbox */}
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                }}
            >
                <label style={{ marginBottom: "5px", textAlign: "center" }}>
                    Aggregate
                </label>
                <Checkbox
                    inputId="aggregateEntry"
                    name="aggregateEntry"
                    checked={formData.aggregateEntry}
                    onChange={handleChange}
                    className="custom-checkbox"
                />
            </div>

            {/* Requires Dimensions Checkbox */}
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                }}
            >
                <label style={{ marginBottom: "5px", textAlign: "center" }}>
                    Dims?
                </label>
                <Checkbox
                    inputId="requiresDimensions"
                    name="requiresDimensions"
                    checked={formData.requiresDimensions}
                    onChange={handleChange}
                    className="custom-checkbox"
                />
            </div>

            {/* Submit button */}
            <Button type="submit" icon="pi pi-plus" label="Add Part" />

            {/* Cancel button if editing */}
            {editingPart && (
                <Button
                    label="Cancel"
                    onClick={onCancel}
                    className="p-button-primary"
                    style={{ marginLeft: "1rem" }}
                />
            )}

            <style jsx>{`
                :global(.custom-checkbox .p-checkbox-box) {
                    width: 40px !important;
                    height: 40px !important;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                :global(.custom-checkbox) {
                    width: 40px !important;
                    height: 40px !important;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
            `}</style>
        </form>
    );
}

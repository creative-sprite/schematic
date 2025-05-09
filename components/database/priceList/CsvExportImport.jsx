// components\database\priceList\CsvExportImport.jsx

"use client"; // Added because this component uses useState
import { useState, useRef } from "react";
import Papa from "papaparse";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import Link from "next/link";
import "../../../styles/priceList.css"; // Import the external CSS file

export default function CsvExportImport() {
    const [file, setFile] = useState(null);
    const fileInputRef = useRef(null);

    const handleFileChange = (event) => {
        setFile(event.target.files[0]);
    };

    const handleImport = async () => {
        if (!file) return alert("Please select a file.");

        const reader = new FileReader();

        reader.onload = async ({ target }) => {
            const csvData = Papa.parse(target.result, { header: true }).data;

            // Ensure data is properly formatted before sending
            const formattedItems = csvData.map((row) => ({
                category: row.category || "",
                subcategory: row.subcategory || "",
                item: row.item || "",
                prices: {
                    A: parseFloat(row["prices.A"]) || 0,
                    B: parseFloat(row["prices.B"]) || 0,
                    C: parseFloat(row["prices.C"]) || 0,
                    D: parseFloat(row["prices.D"]) || 0,
                    E: parseFloat(row["prices.E"]) || 0,
                },
            }));

            // Ensure the request is correctly formatted with an "items" array
            const payload = { items: formattedItems };

            try {
                const response = await fetch("/api/priceList/import", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });

                const result = await response.json();
                alert(
                    result.success
                        ? "Import successful!"
                        : `Error: ${result.message}`
                );
            } catch (error) {
                console.error("Import failed", error);
                alert("Import failed.");
            }
        };

        reader.readAsText(file);
    };

    const handleExport = () => {
        window.location.href = "/api/priceList/export";
    };

    // Trigger click on hidden file input when "Choose File" button is pressed.
    const triggerFileInput = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    return (
        <div className="container">
            <Card style={{ width: "100%" }}>
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                    }}
                >
                    {/* Left Group */}
                    <span
                        className="button-group"
                        style={{
                            display: "flex",
                            gap: "20px",
                            alignItems: "center",
                        }}
                    >
                        <Button
                            onClick={handleExport}
                            label="Export CSV"
                            className="p-button-secondary"
                        />
                        <Button
                            onClick={triggerFileInput}
                            label="Choose File"
                            className="p-button-secondary"
                        />
                        <input
                            type="file"
                            accept=".csv"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            style={{ display: "none" }}
                        />
                        <Button
                            onClick={handleImport}
                            label="Import CSV"
                            disabled={!file}
                            className={`${
                                file ? "p-button-success" : "p-disabled"
                            }`}
                        />
                    </span>
                    {/* Right Group */}
                    <span className="button-group">
                        <Link href="/schematicParts" legacyBehavior>
                            <a>
                                <Button
                                    label="Manage Schematic Parts"
                                    className="p-button-info"
                                />
                            </a>
                        </Link>
                    </span>
                </div>
            </Card>
        </div>
    );
}

// components\database\supplier\SupplierProductsTab.jsx

import React, { useState, useEffect } from "react";
import { Card } from "primereact/card";

const SupplierProductsTab = ({ supplier }) => {
    const [customFields, setCustomFields] = useState([]);

    // Fetch custom fields for products
    useEffect(() => {
        async function fetchCustomFields() {
            try {
                const res = await fetch("/api/database/products/customFields");
                const json = await res.json();
                if (json.success) {
                    setCustomFields(json.data);
                } else {
                    console.error("Failed to fetch custom fields:", json);
                }
            } catch (error) {
                console.error("Error fetching custom fields:", error);
            }
        }

        fetchCustomFields();
    }, []);

    // Function to format and display custom field values
    const renderCustomField = (fieldId, value) => {
        const field = customFields.find((f) => f._id === fieldId);
        if (!field) return null;

        let displayValue = "";

        // Format based on field type
        if (field.fieldType === "number" && (field.prefix || field.suffix)) {
            displayValue = `${field.prefix ? field.prefix + " " : ""}${
                value || ""
            }${field.suffix ? " " + field.suffix : ""}`;
        } else if (Array.isArray(value)) {
            displayValue = value.join(", ");
        } else {
            displayValue = value ? value.toString() : "";
        }

        return (
            <p key={fieldId}>
                <strong>{field.label}:</strong> {displayValue}
            </p>
        );
    };

    // Helper function to render different product types
    const renderProductCard = (product, index) => {
        const { productType, costs } = product;

        // Common card style
        const cardStyle = {
            border: "1px solid #ccc",
            margin: "0.5rem",
            boxSizing: "border-box",
            width: "280px",
            minWidth: "276px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            textAlign: "center",
            minHeight: "400px",
            padding: "1rem",
        };

        if (productType === "AccessDoor") {
            return (
                <Card key={index} style={cardStyle}>
                    <h3>
                        Access Door: {product.brand} - {product.type}
                    </h3>
                    <p>
                        <strong>Depth:</strong> {product.dimensions?.depth}
                    </p>
                    <p>
                        <strong>Length:</strong> {product.dimensions?.length}
                    </p>
                    <p>
                        <strong>Width:</strong> {product.dimensions?.width}
                    </p>
                    <p>
                        <strong>Diameter:</strong>{" "}
                        {product.dimensions?.diameter}
                    </p>
                    <p>
                        <strong>Insulation:</strong>{" "}
                        {product.insulation ? "Yes" : "No"}
                    </p>
                    <p>
                        <strong>Aggregate:</strong>{" "}
                        {product.aggregateEntry ? "Yes" : "No"}
                    </p>
                    <p>
                        <strong>Costs:</strong> Price: {costs?.price || 0},
                        Other: {costs?.otherCosts || 0}
                    </p>
                    <p>
                        <strong>Comment:</strong> {product.comment}
                    </p>
                </Card>
            );
        } else if (productType === "StructuralEquipment") {
            return (
                <Card key={index} style={cardStyle}>
                    <h3>
                        Structural Equipment: {product.name} - {product.type}
                    </h3>
                    <p>
                        <strong>For:</strong> {product.for}
                    </p>
                    <p>
                        <strong>Packed Length:</strong>{" "}
                        {product.dimensions?.packedLength}
                    </p>
                    <p>
                        <strong>Packed Height:</strong>{" "}
                        {product.dimensions?.packedHeight}
                    </p>
                    <p>
                        <strong>Packed Width:</strong>{" "}
                        {product.dimensions?.packedWidth}
                    </p>
                    <p>
                        <strong>Weight (kg):</strong> {product.weight}
                    </p>
                    <p>
                        <strong>Reach Height:</strong> {product.reachHeight}
                    </p>
                    <p>
                        <strong>Reach Radius:</strong> {product.reachRadius}
                    </p>
                    <p>
                        <strong>Fuel:</strong> {product.fuel}
                    </p>
                    <p>
                        <strong>Costs:</strong> Price: {costs?.price || 0},
                        Other: {costs?.otherCosts || 0}, Rate: {costs?.rateType}
                    </p>
                </Card>
            );
        } else if (productType === "OtherEquipment") {
            return (
                <Card key={index} style={cardStyle}>
                    <h3>
                        Other Equipment: {product.name} - {product.type}
                    </h3>
                    <p>
                        <strong>Litres (ltrs):</strong> {product.litres}
                    </p>
                    <p>
                        <strong>Voltage (v):</strong> {product.voltage}
                    </p>
                    <p>
                        <strong>Costs:</strong> Price: {costs?.price || 0},
                        Other: {costs?.otherCosts || 0}
                    </p>
                </Card>
            );
        } else {
            // Product from the Product collection
            return (
                <Card key={index} style={cardStyle}>
                    <h3>{product.category || "Product"}</h3>
                    <p>
                        <strong>Name:</strong> {product.name}
                    </p>
                    <p>
                        <strong>Type:</strong> {product.type}
                    </p>

                    {/* Render Custom Data Fields */}
                    {product.customData && product.customData.length > 0 && (
                        <div className="custom-fields">
                            <strong>Custom Fields:</strong>
                            <div style={{ marginTop: "0.5rem" }}>
                                {product.customData.map((data) =>
                                    renderCustomField(data.fieldId, data.value)
                                )}
                            </div>
                        </div>
                    )}

                    <p>
                        <strong>Supplier:</strong>{" "}
                        {supplier
                            ? supplier.supplierName
                            : Array.isArray(product.supplier)
                            ? product.supplier.join(", ")
                            : product.supplier}
                    </p>
                </Card>
            );
        }
    };

    if (!supplier) return <div>Loading supplier data...</div>;

    return (
        <div>
            {supplier.products && supplier.products.length > 0 ? (
                <div
                    style={{
                        display: "flex",
                        flexWrap: "wrap",
                        justifyContent: "center",
                        maxWidth: "1200px",
                        margin: "0 auto",
                    }}
                >
                    {supplier.products.map((prod, idx) =>
                        renderProductCard(prod, idx)
                    )}
                </div>
            ) : (
                <p>No products found for this supplier.</p>
            )}
        </div>
    );
};

export default SupplierProductsTab;

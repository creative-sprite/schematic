// components\database\products\utils\ProductReorderUtility.jsx

import React, { useState } from "react";
import { Button } from "primereact/button";
import { ProgressBar } from "primereact/progressbar";
import { Message } from "primereact/message";

/**
 * Utility component for reordering custom fields in existing products
 * to match the order in the input list
 */
const ProductReorderUtility = ({ customFields = [], forms = [] }) => {
    // State for tracking progress and results
    const [isReordering, setIsReordering] = useState(false);
    const [progress, setProgress] = useState(0);
    const [results, setResults] = useState(null);
    const [error, setError] = useState(null);

    /**
     * Reorder all products to ensure field order matches the customFields list
     */
    const reorderAllProducts = async () => {
        try {
            setIsReordering(true);
            setProgress(0);
            setResults(null);
            setError(null);

            // 1. Fetch all products
            const productsRes = await fetch("/api/database/products");
            if (!productsRes.ok) {
                throw new Error(
                    `Error fetching products: ${productsRes.statusText}`
                );
            }

            const productsData = await productsRes.json();
            if (!productsData.success) {
                throw new Error(
                    productsData.message || "Failed to fetch products"
                );
            }

            const products = productsData.data;

            // Track results
            const results = {
                total: products.length,
                updated: 0,
                skipped: 0,
                errors: [],
            };

            // Process each product
            for (let i = 0; i < products.length; i++) {
                const product = products[i];

                try {
                    // Skip products without custom data or form
                    if (
                        !product.customData ||
                        !product.form ||
                        !product.customData.length
                    ) {
                        results.skipped++;
                        continue;
                    }

                    // Find the form for this product
                    const form = forms.find((f) => f._id === product.form);
                    if (!form) {
                        results.skipped++;
                        continue;
                    }

                    // Create a field ID to order mapping
                    const fieldOrderMap = new Map();

                    // First, map from global custom fields (base ordering)
                    customFields.forEach((field, index) => {
                        if (field._id) {
                            fieldOrderMap.set(field._id, {
                                globalIndex: index,
                                order:
                                    field.order !== undefined
                                        ? field.order
                                        : index,
                            });
                        }
                    });

                    // Then, get more specific ordering from the form's custom fields if available
                    const formCustomFields = form.customFields || [];
                    if (formCustomFields.length > 0) {
                        // Sort form fields by their explicit order
                        const sortedFormFields = [...formCustomFields].sort(
                            (a, b) =>
                                (a.order !== undefined ? a.order : 0) -
                                (b.order !== undefined ? b.order : 0)
                        );

                        // Update order map with form-specific ordering
                        sortedFormFields.forEach((field, formIndex) => {
                            if (field._id) {
                                // Whether the field exists in global custom fields or not, add it to the map
                                const existingMapping = fieldOrderMap.get(
                                    field._id
                                ) || { globalIndex: Number.MAX_SAFE_INTEGER };
                                fieldOrderMap.set(field._id, {
                                    ...existingMapping,
                                    formIndex,
                                    // If field has explicit order, use it; otherwise use its position in form
                                    order:
                                        field.order !== undefined
                                            ? field.order
                                            : formIndex,
                                });
                            }
                        });
                    }

                    // Make a copy of customData to check if we need to reorder
                    const currentOrder = [...product.customData];

                    // Create properly ordered custom data based on fieldOrderMap
                    const orderedCustomData = [...product.customData].sort(
                        (a, b) => {
                            // Get orders for both fields, defaulting to high values if not found
                            const orderInfoA = fieldOrderMap.get(a.fieldId);
                            const orderInfoB = fieldOrderMap.get(b.fieldId);

                            if (!orderInfoA && !orderInfoB) {
                                // If neither field has order info, preserve their original order
                                return (
                                    product.customData.indexOf(a) -
                                    product.customData.indexOf(b)
                                );
                            }

                            // If only one field has order info, prioritize the one that does
                            if (!orderInfoA) return 1;
                            if (!orderInfoB) return -1;

                            // If both have order info, compare their order values
                            // First try form-specific order if available
                            if (
                                orderInfoA.formIndex !== undefined &&
                                orderInfoB.formIndex !== undefined
                            ) {
                                return (
                                    orderInfoA.formIndex - orderInfoB.formIndex
                                );
                            }

                            // Fall back to explicit order values
                            const orderA =
                                orderInfoA.order !== undefined
                                    ? orderInfoA.order
                                    : Number.MAX_SAFE_INTEGER;
                            const orderB =
                                orderInfoB.order !== undefined
                                    ? orderInfoB.order
                                    : Number.MAX_SAFE_INTEGER;

                            return orderA - orderB;
                        }
                    );

                    // Check if reordering is actually needed by comparing field IDs in order
                    let needsReordering = false;
                    if (currentOrder.length === orderedCustomData.length) {
                        for (let j = 0; j < currentOrder.length; j++) {
                            if (
                                currentOrder[j].fieldId !==
                                orderedCustomData[j].fieldId
                            ) {
                                needsReordering = true;
                                break;
                            }
                        }
                    } else {
                        needsReordering = true; // Different lengths means reordering needed
                    }

                    // Skip if no reordering needed
                    if (!needsReordering) {
                        results.skipped++;
                        continue;
                    }

                    // Construct updated product data
                    const updatedProduct = {
                        ...product,
                        customData: orderedCustomData,
                    };

                    // Log the reordering for debugging
                    console.log(
                        `Reordering product ${product._id} (${product.name})`,
                        {
                            before: product.customData.map((f) => f.fieldId),
                            after: orderedCustomData.map((f) => f.fieldId),
                        }
                    );

                    // Update the product in the database
                    try {
                        const updateRes = await fetch(
                            `/api/database/products?id=${product._id}`,
                            {
                                method: "PUT",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify(updatedProduct),
                            }
                        );

                        if (!updateRes.ok) {
                            throw new Error(
                                `Error updating product ${product._id}: ${updateRes.statusText}`
                            );
                        }

                        const updateData = await updateRes.json();
                        if (!updateData.success) {
                            throw new Error(
                                updateData.message ||
                                    `Failed to update product ${product._id}`
                            );
                        }
                    } catch (error) {
                        // Try again with minimal payload
                        console.warn(
                            `Trying backup update method for product ${product._id}`
                        );

                        // Create a minimal product with just the customData to update
                        const minimalUpdate = {
                            _id: product._id,
                            form: product.form,
                            category: product.category,
                            name: product.name,
                            type: product.type,
                            customData: orderedCustomData,
                        };

                        const backupRes = await fetch(
                            `/api/database/products?id=${product._id}`,
                            {
                                method: "PUT",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify(minimalUpdate),
                            }
                        );

                        if (!backupRes.ok) {
                            throw new Error(
                                `Backup update failed for product ${product._id}: ${backupRes.statusText}`
                            );
                        }

                        const backupData = await backupRes.json();
                        if (!backupData.success) {
                            throw new Error(
                                backupData.message ||
                                    `Backup update failed for product ${product._id}`
                            );
                        }
                    }

                    // Count successful update
                    results.updated++;
                } catch (productError) {
                    // Log error but continue with other products
                    console.error(
                        `Error reordering product ${product._id}:`,
                        productError
                    );
                    results.errors.push({
                        productId: product._id,
                        productName: product.name,
                        error: productError.message,
                    });
                }

                // Update progress
                setProgress(Math.round(((i + 1) / products.length) * 100));
            }

            // Set final results
            setResults(results);
        } catch (error) {
            console.error("Error in reordering utility:", error);
            setError(error.message);
        } finally {
            setIsReordering(false);
        }
    };

    return (
        <div
            className="product-reorder-utility"
            style={{ marginBottom: "1rem" }}
        >
            <p>Sort the order of existing products</p>
            <p style={{ fontSize: "0.85rem" }}>
                This is used only to update the order of fields in all existing
                products to match the order in the input list.
            </p>

            {/* Progress indicator */}
            {isReordering && (
                <div style={{ marginBottom: "1rem" }}>
                    <p>Reordering products... {progress}% complete</p>
                    <ProgressBar value={progress} />
                </div>
            )}

            {/* Results */}
            {results && (
                <div style={{ marginBottom: "1rem" }}>
                    <Message
                        severity="success"
                        text={`Reordering complete! Updated: ${results.updated}, Skipped: ${results.skipped}, Errors: ${results.errors.length}`}
                    />

                    {results.errors.length > 0 && (
                        <div style={{ marginTop: "0.5rem" }}>
                            <h4>Errors:</h4>
                            <ul>
                                {results.errors.map((err, index) => (
                                    <li key={index}>
                                        {err.productName || err.productId}:{" "}
                                        {err.error}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}

            {/* Error message */}
            {error && (
                <div style={{ marginBottom: "1rem" }}>
                    <Message severity="error" text={`Error: ${error}`} />
                </div>
            )}

            {/* Action button */}
            <Button
                label="Reorder All Products"
                icon="pi pi-sort"
                onClick={reorderAllProducts}
                disabled={isReordering}
                loading={isReordering}
                className="p-button-warning"
            />

            <div
                style={{
                    marginTop: "0.5rem",
                    fontSize: "0.50rem",
                    color: "#666",
                }}
            >
                <strong>Note:</strong> This process will take some time
                depending on the number of products in the database.
            </div>
        </div>
    );
};

export default ProductReorderUtility;

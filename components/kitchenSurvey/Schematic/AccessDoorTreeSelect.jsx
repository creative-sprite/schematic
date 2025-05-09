// components\kitchenSurvey\Schematic\AccessDoorTreeSelect.jsx

"use client";

import React, { useState, useEffect } from "react";
import { TreeSelect } from "primereact/treeselect";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";

export default function AccessDoorTreeSelect({
    itemId,
    onSelectDoor,
    initialSelection = null,
}) {
    const [accessDoorOptions, setAccessDoorOptions] = useState([]);
    const [selectedKey, setSelectedKey] = useState(null);
    const [expandedKeys, setExpandedKeys] = useState({});
    const [loading, setLoading] = useState(true);
    const [hasDoorBeenLoaded, setHasDoorBeenLoaded] = useState(false);

    // Log when initialSelection changes to help debug
    useEffect(() => {
        console.log(
            `AccessDoorTreeSelect - initialSelection for item ${itemId}:`,
            initialSelection
        );
    }, [initialSelection, itemId]);

    useEffect(() => {
        const fetchAccessDoors = async () => {
            try {
                setLoading(true);
                console.log("Fetching products from database...");

                // Using your existing API endpoint with URL search params for category
                const url = new URL(
                    "/api/database/products",
                    window.location.origin
                );
                url.searchParams.append("category", "Access Door");

                const response = await fetch(url);

                if (!response.ok) {
                    console.error(
                        `API error: ${response.status} ${response.statusText}`
                    );
                    setLoading(false);
                    return;
                }

                const result = await response.json();

                if (result.success && result.data) {
                    console.log(`Found ${result.data.length} access doors`);

                    // Process products into tree structure
                    const treeData = processProductsToTree(result.data);
                    setAccessDoorOptions(treeData);
                } else {
                    console.error(
                        "Failed to fetch access doors:",
                        result.message || "Unknown error"
                    );
                }
            } catch (error) {
                console.error("Error fetching access doors:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAccessDoors();
    }, []);

    // Enhanced effect to handle initialSelection after options are loaded
    useEffect(() => {
        // Only proceed if we have options and initialSelection and haven't loaded door yet
        if (
            accessDoorOptions.length > 0 &&
            initialSelection &&
            !hasDoorBeenLoaded &&
            !loading
        ) {
            console.log(
                `[AccessDoorTreeSelect] Trying to auto-select door for item ${itemId} with ID:`,
                initialSelection
            );

            // Handle different types of initialSelection (ID, object with ID, or full door object)
            let selectionIdStr = "";

            if (typeof initialSelection === "string") {
                // Simple string ID
                selectionIdStr = initialSelection;
            } else if (typeof initialSelection === "object") {
                if (
                    initialSelection._id ||
                    initialSelection.id ||
                    initialSelection.mongoId
                ) {
                    // Object with ID field
                    const idValue =
                        initialSelection._id ||
                        initialSelection.mongoId ||
                        initialSelection.id;
                    selectionIdStr =
                        typeof idValue === "object"
                            ? idValue.toString()
                            : String(idValue);
                } else {
                    // Try to stringify the whole object
                    selectionIdStr = initialSelection.toString();
                }
            }

            console.log(
                `[AccessDoorTreeSelect] Normalized ID for search: "${selectionIdStr}"`
            );

            // Search for a matching door in the options tree with improved ID handling
            const findDoorByIdRecursive = (nodes, doorIdStr) => {
                for (const node of nodes) {
                    // Check if this node has the right value
                    if (node.value) {
                        // Extract all possible ID values
                        const nodeId =
                            node.value._id ||
                            node.value.mongoId ||
                            node.value.id;
                        if (!nodeId) continue;

                        // Convert to string with better error handling
                        const nodeIdStr =
                            typeof nodeId === "object"
                                ? nodeId.toString()
                                : String(nodeId);

                        // Debug: show matches
                        if (
                            nodeIdStr.includes(doorIdStr) ||
                            doorIdStr.includes(nodeIdStr)
                        ) {
                            console.log(
                                `[AccessDoorTreeSelect] Potential match: ${nodeIdStr} vs ${doorIdStr}`
                            );
                        }

                        // More flexible matching - check if either contains the other
                        if (
                            nodeIdStr === doorIdStr ||
                            nodeIdStr.includes(doorIdStr) ||
                            doorIdStr.includes(nodeIdStr)
                        ) {
                            return { key: node.key, door: node.value };
                        }
                    }

                    // Check children if any
                    if (node.children) {
                        const found = findDoorByIdRecursive(
                            node.children,
                            doorIdStr
                        );
                        if (found) return found;
                    }
                }
                return null;
            };

            const foundDoor = findDoorByIdRecursive(
                accessDoorOptions,
                selectionIdStr
            );

            if (foundDoor) {
                console.log(
                    `[AccessDoorTreeSelect] Found matching door for auto-selection:`,
                    foundDoor
                );

                // Set the key for the dropdown
                setSelectedKey(foundDoor.key);

                // Create a consistently formatted door object
                const doorSelection = {
                    _id: foundDoor.door._id || foundDoor.door.id,
                    mongoId: foundDoor.door._id || foundDoor.door.id,
                    id: foundDoor.door._id || foundDoor.door.id,
                    name: foundDoor.door.name || "",
                    type: foundDoor.door.type || "",
                    price: foundDoor.door.price || 0,
                    accessDoorPrice: foundDoor.door.price || 0,
                    dimensions: foundDoor.door.dimensions || "",
                    // Preserve original door data
                    ...foundDoor.door,
                };

                // Also trigger the selection callback to update parent state
                if (onSelectDoor) {
                    console.log(
                        `[AccessDoorTreeSelect] Auto-selecting door with data:`,
                        doorSelection
                    );
                    onSelectDoor(itemId, doorSelection);
                }

                // Mark as loaded to prevent repeated processing
                setHasDoorBeenLoaded(true);
            } else {
                console.log(
                    `[AccessDoorTreeSelect] No matching door found for ID: ${selectionIdStr}`
                );
            }
        }
    }, [
        accessDoorOptions,
        initialSelection,
        itemId,
        onSelectDoor,
        loading,
        hasDoorBeenLoaded,
    ]);

    // Process products into tree structure: Name → Type → Products with dimensions
    const processProductsToTree = (products) => {
        // Filter products to ONLY include those with category "Access Door"
        const accessDoorProducts = products.filter(
            (product) => product.category && product.category === "Access Door"
        );

        console.log(
            `Filtered to ${accessDoorProducts.length} access door products`
        );

        // Group by name first
        const nameGroups = {};

        accessDoorProducts.forEach((product) => {
            const name = product.name || "Unnamed";
            if (!nameGroups[name]) {
                nameGroups[name] = {};
            }

            const type = product.type || "Standard";
            if (!nameGroups[name][type]) {
                nameGroups[name][type] = [];
            }

            nameGroups[name][type].push(product);
        });

        // Build tree structure
        const tree = [];

        // Sort names alphabetically
        Object.keys(nameGroups)
            .sort()
            .forEach((name) => {
                const nameNode = {
                    key: `name-${name}`,
                    label: name,
                    selectable: false,
                    children: [],
                };

                // Sort types alphabetically
                Object.keys(nameGroups[name])
                    .sort()
                    .forEach((type) => {
                        const typeNode = {
                            key: `name-${name}-type-${type}`,
                            label: type,
                            selectable: false,
                            children: [],
                        };

                        // Add products under this type
                        nameGroups[name][type].forEach((product, index) => {
                            // Create the dimension string with labels
                            let dimensions = [];

                            // First try to get dimensions from direct fields
                            if (product.length)
                                dimensions.push(`L: ${product.length}`);
                            if (product.width)
                                dimensions.push(`W: ${product.width}`);
                            if (product.height)
                                dimensions.push(`H: ${product.height}`);
                            if (product.depth)
                                dimensions.push(`Dep: ${product.depth}`);
                            if (product.diameter)
                                dimensions.push(`Dia: ${product.diameter}`);

                            // If no direct fields, try to extract from customData
                            if (
                                dimensions.length === 0 &&
                                product.customData &&
                                product.customData.length > 0
                            ) {
                                // Try to find length, width, height, depth, diameter in customData
                                // Look for fields by fieldName first
                                const lengthField = product.customData.find(
                                    (field) =>
                                        field.fieldName &&
                                        field.fieldName.toLowerCase() ===
                                            "length"
                                );
                                if (lengthField && lengthField.value) {
                                    dimensions.push(`L: ${lengthField.value}`);
                                }

                                const widthField = product.customData.find(
                                    (field) =>
                                        field.fieldName &&
                                        field.fieldName.toLowerCase() ===
                                            "width"
                                );
                                if (widthField && widthField.value) {
                                    dimensions.push(`W: ${widthField.value}`);
                                }

                                const heightField = product.customData.find(
                                    (field) =>
                                        field.fieldName &&
                                        field.fieldName.toLowerCase() ===
                                            "height"
                                );
                                if (heightField && heightField.value) {
                                    dimensions.push(`H: ${heightField.value}`);
                                }

                                const depthField = product.customData.find(
                                    (field) =>
                                        field.fieldName &&
                                        field.fieldName.toLowerCase() ===
                                            "depth"
                                );
                                if (depthField && depthField.value) {
                                    dimensions.push(`Dep: ${depthField.value}`);
                                }

                                const diameterField = product.customData.find(
                                    (field) =>
                                        field.fieldName &&
                                        field.fieldName.toLowerCase() ===
                                            "diameter"
                                );
                                if (diameterField && diameterField.value) {
                                    dimensions.push(
                                        `Dia: ${diameterField.value}`
                                    );
                                }

                                // If still no dimensions found, try the old way as fallback
                                if (dimensions.length === 0) {
                                    // Try to find using fieldId?.label (old method)
                                    if (
                                        product.customData.find(
                                            (field) =>
                                                field.fieldId?.label?.toLowerCase() ===
                                                "length"
                                        )?.value
                                    ) {
                                        dimensions.push(
                                            `L: ${
                                                product.customData.find(
                                                    (field) =>
                                                        field.fieldId?.label?.toLowerCase() ===
                                                        "length"
                                                ).value
                                            }`
                                        );
                                    }

                                    if (
                                        product.customData.find(
                                            (field) =>
                                                field.fieldId?.label?.toLowerCase() ===
                                                "width"
                                        )?.value
                                    ) {
                                        dimensions.push(
                                            `W: ${
                                                product.customData.find(
                                                    (field) =>
                                                        field.fieldId?.label?.toLowerCase() ===
                                                        "width"
                                                ).value
                                            }`
                                        );
                                    }

                                    if (
                                        product.customData.find(
                                            (field) =>
                                                field.fieldId?.label?.toLowerCase() ===
                                                "height"
                                        )?.value
                                    ) {
                                        dimensions.push(
                                            `H: ${
                                                product.customData.find(
                                                    (field) =>
                                                        field.fieldId?.label?.toLowerCase() ===
                                                        "height"
                                                ).value
                                            }`
                                        );
                                    }

                                    if (
                                        product.customData.find(
                                            (field) =>
                                                field.fieldId?.label?.toLowerCase() ===
                                                "depth"
                                        )?.value
                                    ) {
                                        dimensions.push(
                                            `Dep: ${
                                                product.customData.find(
                                                    (field) =>
                                                        field.fieldId?.label?.toLowerCase() ===
                                                        "depth"
                                                ).value
                                            }`
                                        );
                                    }

                                    if (
                                        product.customData.find(
                                            (field) =>
                                                field.fieldId?.label?.toLowerCase() ===
                                                "diameter"
                                        )?.value
                                    ) {
                                        dimensions.push(
                                            `Dia: ${
                                                product.customData.find(
                                                    (field) =>
                                                        field.fieldId?.label?.toLowerCase() ===
                                                        "diameter"
                                                ).value
                                            }`
                                        );
                                    }
                                }
                            }

                            // Create the dimension string with "×" between values
                            const dimensionString =
                                dimensions.length > 0
                                    ? dimensions.join(" × ")
                                    : "";

                            // Extract price from customData if available
                            let price = 0;
                            if (
                                product.customData &&
                                Array.isArray(product.customData)
                            ) {
                                const priceField = product.customData.find(
                                    (field) =>
                                        field.fieldName &&
                                        field.fieldName.toLowerCase() ===
                                            "price"
                                );

                                if (
                                    priceField &&
                                    priceField.value !== undefined &&
                                    priceField.value !== null
                                ) {
                                    price = Number(priceField.value);
                                    console.log(
                                        `Extracted price for ${product.name}: ${price}`
                                    );
                                }
                            }

                            // Add price to product object
                            product.price = price;

                            // Add price to the label if available
                            const priceLabel =
                                price > 0 ? ` | £${price.toFixed(2)}` : "";

                            // Create label with Type - Name: Dimensions | Price
                            const productLabel = `${name} - ${type}: ${
                                dimensionString || "No dimensions"
                            }${priceLabel}`;

                            // Product leaf node
                            typeNode.children.push({
                                key: `name-${name}-type-${type}-product-${index}`,
                                label: productLabel,
                                value: product,
                            });
                        });

                        // Only add type node if it has children
                        if (typeNode.children.length > 0) {
                            nameNode.children.push(typeNode);
                        }
                    });

                // Only add name node if it has children
                if (nameNode.children.length > 0) {
                    tree.push(nameNode);
                }
            });

        return tree;
    };

    const onToggle = (e) => {
        setExpandedKeys(e.value);
    };

    const onChange = (e) => {
        setSelectedKey(e.value);

        if (!e.value) {
            if (onSelectDoor) {
                onSelectDoor(itemId, null);
            }
            return;
        }

        // Find the selected door in the tree
        const findDoorByKey = (nodes, key) => {
            for (const node of nodes) {
                if (node.key === key) return node.value;
                if (node.children) {
                    const found = findDoorByKey(node.children, key);
                    if (found) return found;
                }
            }
            return null;
        };

        const selectedDoor = findDoorByKey(accessDoorOptions, e.value);
        if (selectedDoor) {
            console.log(
                `[AccessDoorTreeSelect] Selected door with price: ${selectedDoor.price}`
            );

            // CRITICAL ENHANCEMENT: Create fully formatted door selection object
            if (onSelectDoor) {
                // Format door data with consistent fields for saving
                const doorSelection = {
                    _id: selectedDoor._id || selectedDoor.id,
                    mongoId: selectedDoor._id || selectedDoor.id, // Ensure mongoId is present
                    id: selectedDoor._id || selectedDoor.id, // Ensure id is present
                    name: selectedDoor.name || "",
                    type: selectedDoor.type || "",
                    price: selectedDoor.price || 0,
                    accessDoorPrice: selectedDoor.price || 0, // Keep this for backward compatibility
                    dimensions: selectedDoor.dimensions || "",
                    // Preserve original door data
                    ...selectedDoor,
                };

                // Call parent's callback with the fully processed door data
                console.log(
                    `[AccessDoorTreeSelect] Sending door selection for item ${itemId}:`,
                    doorSelection
                );
                onSelectDoor(itemId, doorSelection);
            }
        }
    };

    return (
        <div style={{ marginTop: "10px" }}>
            <TreeSelect
                value={selectedKey}
                options={accessDoorOptions}
                onChange={onChange}
                expandedKeys={expandedKeys}
                onToggle={onToggle}
                placeholder={
                    loading
                        ? "Loading access doors..."
                        : "Select an access door"
                }
                style={{ width: "100%" }}
                filter
                filterPlaceholder="Search doors"
            />
        </div>
    );
}

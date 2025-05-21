// components\kitchenSurvey\Schematic\AccessDoorTreeSelect.jsx

"use client";

import React, { useState, useEffect, useRef } from "react";
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

    // IMPROVED: Track initialization status more precisely
    const [hasDoorBeenLoaded, setHasDoorBeenLoaded] = useState(false);
    const initialSelectionProcessedRef = useRef(false);

    // NEW: More robust protection against circular updates
    const isSelectingRef = useRef(false);
    const selectionInProgressRef = useRef(false);
    const selectionTimerRef = useRef(null);

    // NEW: Track current selection value for comparison
    const currentSelectionRef = useRef(null);

    // Log when initialSelection changes to help debug
    useEffect(() => {
        console.log(
            `[AccessDoorTreeSelect] initialSelection for item ${itemId}:`,
            initialSelection
                ? typeof initialSelection === "object"
                    ? `Object with ID: ${
                          initialSelection._id ||
                          initialSelection.mongoId ||
                          initialSelection.id ||
                          "unknown"
                      }`
                    : initialSelection
                : "null"
        );
    }, [initialSelection, itemId]);

    // Fetch access doors from API
    useEffect(() => {
        const fetchAccessDoors = async () => {
            try {
                setLoading(true);
                console.log(
                    "[AccessDoorTreeSelect] Fetching products from database..."
                );

                // Using your existing API endpoint with URL search params for category
                const url = new URL(
                    "/api/database/products",
                    window.location.origin
                );
                url.searchParams.append("category", "Access Door");

                const response = await fetch(url);

                if (!response.ok) {
                    console.error(
                        `[AccessDoorTreeSelect] API error: ${response.status} ${response.statusText}`
                    );
                    setLoading(false);
                    return;
                }

                const result = await response.json();

                if (result.success && result.data) {
                    console.log(
                        `[AccessDoorTreeSelect] Found ${result.data.length} access doors`
                    );

                    // Process products into tree structure
                    const treeData = processProductsToTree(result.data);
                    setAccessDoorOptions(treeData);
                } else {
                    console.error(
                        "[AccessDoorTreeSelect] Failed to fetch access doors:",
                        result.message || "Unknown error"
                    );
                }
            } catch (error) {
                console.error(
                    "[AccessDoorTreeSelect] Error fetching access doors:",
                    error
                );
            } finally {
                setLoading(false);
            }
        };

        fetchAccessDoors();
    }, []);

    // ENHANCED: Effect to handle initialSelection ONLY after options are loaded
    // This is critical to prevent triggering updates during initialization
    useEffect(() => {
        // Skip if any of these conditions are not met:
        // 1. We have options loaded
        // 2. We have an initialSelection to process
        // 3. We haven't already loaded a door
        // 4. We're done loading
        // 5. We haven't processed this initial selection yet
        if (
            accessDoorOptions.length === 0 ||
            !initialSelection ||
            hasDoorBeenLoaded ||
            loading ||
            initialSelectionProcessedRef.current
        ) {
            return;
        }

        console.log(
            `[AccessDoorTreeSelect] Processing initial selection for item ${itemId}...`
        );

        // Mark that we're now processing the initial selection to prevent reprocessing
        initialSelectionProcessedRef.current = true;

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
                        node.value._id || node.value.mongoId || node.value.id;
                    if (!nodeId) continue;

                    // Convert to string with better error handling
                    const nodeIdStr =
                        typeof nodeId === "object"
                            ? nodeId.toString()
                            : String(nodeId);

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
                foundDoor.door.name
            );

            // CRITICAL FIX: Set selection flag before updating state
            isSelectingRef.current = true;

            // First update the local selectedKey state
            setSelectedKey(foundDoor.key);

            // Also update our tracking ref
            currentSelectionRef.current = foundDoor.door;

            // Mark door as loaded
            setHasDoorBeenLoaded(true);

            // Reset selection flag after state update with sufficient delay
            setTimeout(() => {
                isSelectingRef.current = false;
            }, 50);
        } else {
            console.log(
                `[AccessDoorTreeSelect] No matching door found for ID: ${selectionIdStr}`
            );
        }
    }, [
        accessDoorOptions,
        initialSelection,
        itemId,
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
            `[AccessDoorTreeSelect] Filtered to ${accessDoorProducts.length} access door products`
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
                                        `[AccessDoorTreeSelect] Extracted price for ${product.name}: ${price}`
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
                            }
                            
                            `;

                            // Add dimensions as a field to the product
                            product.dimensions = dimensionString;

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

    // COMPLETELY REWRITTEN: Selection change handler with robust protection against loops
    const onChange = (e) => {
        // Skip if we're in the middle of another selection operation
        if (isSelectingRef.current) {
            console.log(
                `[AccessDoorTreeSelect] Skipping redundant selection update`
            );
            return;
        }

        // Set flags to prevent concurrent/circular updates
        isSelectingRef.current = true;
        selectionInProgressRef.current = true;

        // Clear any existing timer
        if (selectionTimerRef.current) {
            clearTimeout(selectionTimerRef.current);
        }

        try {
            // Update local state for dropdown display
            setSelectedKey(e.value);

            // If selection is cleared, handle door removal
            if (!e.value) {
                console.log(
                    `[AccessDoorTreeSelect] Door selection cleared for ${itemId}`
                );
                // Clear our current selection tracking
                currentSelectionRef.current = null;

                // Notify parent with debounced callback
                selectionTimerRef.current = setTimeout(() => {
                    if (onSelectDoor) {
                        console.log(
                            `[AccessDoorTreeSelect] Notifying parent of door removal for ${itemId}`
                        );
                        onSelectDoor(itemId, null);
                    }
                    selectionInProgressRef.current = false;
                }, 50);

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

            // If no door found, just clear selection flags
            if (!selectedDoor) {
                console.log(
                    `[AccessDoorTreeSelect] No door found for key ${e.value}`
                );
                selectionInProgressRef.current = false;
                return;
            }

            // Skip update if the same door is already selected
            if (
                currentSelectionRef.current &&
                currentSelectionRef.current._id === selectedDoor._id
            ) {
                console.log(
                    `[AccessDoorTreeSelect] Same door already selected, skipping update`
                );
                selectionInProgressRef.current = false;
                return;
            }

            // Update our tracking ref
            currentSelectionRef.current = selectedDoor;

            // Mark as loaded
            setHasDoorBeenLoaded(true);

            // Notify parent with debounced callback
            // The timeout is critical for breaking circular update chains
            console.log(
                `[AccessDoorTreeSelect] Scheduling parent notification for door selection: ${selectedDoor.name}`
            );
            selectionTimerRef.current = setTimeout(() => {
                if (onSelectDoor) {
                    console.log(
                        `[AccessDoorTreeSelect] Notifying parent of door selection: ${selectedDoor.name}`
                    );
                    onSelectDoor(itemId, selectedDoor);
                }
                selectionInProgressRef.current = false;
            }, 50);
        } finally {
            // Always reset isSelectingRef after a delay
            setTimeout(() => {
                isSelectingRef.current = false;
            }, 100);
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

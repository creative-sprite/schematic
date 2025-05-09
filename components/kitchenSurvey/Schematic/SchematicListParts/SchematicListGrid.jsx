// components\kitchenSurvey\Schematic\SchematicListParts\SchematicListGrid.jsx
"use client";
import React, { useState, useEffect } from "react";
import { DataView } from "primereact/dataview";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { Button } from "primereact/button";
import DimensionInputs from "./DimensionInputs";
import AccessDoorTreeSelect from "../AccessDoorTreeSelect";

// Helper function to generate a consistent key for an item
function getItemKey(item) {
    if (item.aggregateEntry) {
        if (item.item && item.item.trim() !== "") {
            return item.item.trim().toLowerCase();
        } else {
            return item.id || item._id || "";
        }
    }
    return item.id || item._id || "";
}

export default function SchematicListGrid(props) {
    const {
        combinedList,
        groupDimensions,
        handleDimensionChange,
        placedItems,
        onAccessDoorPriceChange,
        fanGradeSelections,
        setFanGradeSelections,
        handleAccessDoorSelect,
        onVentilationPriceChange,
        flexiDuctSelections = {},
        setFlexiDuctSelections,
        accessDoorSelections = {}, // Add accessDoorSelections prop
    } = props;

    // NEW: State to track which access doors have been selected
    const [selectedAccessDoors, setSelectedAccessDoors] = useState({});

    // Enhanced initialization of selectedAccessDoors from accessDoorSelections prop
    useEffect(() => {
        // Always process the accessDoorSelections, regardless of selectedAccessDoors state
        if (Object.keys(accessDoorSelections).length > 0) {
            console.log(
                "Processing saved access door selections:",
                accessDoorSelections
            );

            // Convert accessDoorSelections format to selectedAccessDoors format
            const formattedSelections = {};

            Object.entries(accessDoorSelections).forEach(
                ([itemId, doorData]) => {
                    formattedSelections[itemId] = {
                        mongoId: doorData.mongoId || doorData.id,
                        id: doorData.mongoId || doorData.id,
                        name: doorData.name || "Selected Door",
                        type: doorData.type || "",
                        dimensions: doorData.dimensions || "",
                        price: doorData.price || 0,
                    };
                }
            );

            console.log(
                "Setting formatted door selections:",
                formattedSelections
            );
            setSelectedAccessDoors(formattedSelections);
        }
    }, [accessDoorSelections]); // Only depend on accessDoorSelections

    // NEW: State to track which flexi-ducts are in edit mode
    const [flexiDuctEditMode, setFlexiDuctEditMode] = useState({});

    // State for ventilation products for Flexi-Duct/Flexi Hose
    const [ventilationProducts, setVentilationProducts] = useState([]);
    const [selectedVentilationProduct, setSelectedVentilationProduct] =
        useState(null);
    const [ventilationQuantity, setVentilationQuantity] = useState(1);

    // Fetch ONLY ventilation products from database
    useEffect(() => {
        const fetchVentilationProducts = async () => {
            try {
                const url = new URL(
                    "/api/database/products",
                    window.location.origin
                );
                // Ensure we only fetch products with category "Ventilation"
                url.searchParams.append("category", "Ventilation");

                const response = await fetch(url);

                if (!response.ok) {
                    console.error(
                        `API error: ${response.status} ${response.statusText}`
                    );
                    return;
                }

                const result = await response.json();

                if (result.success && result.data) {
                    console.log(
                        `Loaded ${result.data.length} ventilation products`
                    );

                    // Extra safety check - filter again on the client side to ensure only Ventilation products
                    const onlyVentilation = result.data.filter(
                        (prod) =>
                            prod.category &&
                            prod.category.toLowerCase() === "ventilation"
                    );

                    setVentilationProducts(onlyVentilation);
                    console.log(
                        `Filtered to ${onlyVentilation.length} ventilation products`
                    );
                }
            } catch (error) {
                console.error("Error fetching ventilation products:", error);
            }
        };

        fetchVentilationProducts();
    }, []);

    // Handle adding selected ventilation product to a flexi-duct/hose item
    const handleAddVentilationProduct = (itemId) => {
        if (!selectedVentilationProduct || ventilationQuantity <= 0) {
            return;
        }

        // Get the price from the product
        const productPrice = getProductPrice(selectedVentilationProduct);
        if (productPrice <= 0) {
            console.warn("Product price is zero or invalid, not adding");
            return;
        }

        // Create new selection
        const newSelection = {
            id: Date.now(),
            productId: selectedVentilationProduct._id,
            name: selectedVentilationProduct.name,
            diameter: getDiameterFromProduct(selectedVentilationProduct),
            price: Number(productPrice), // Ensure it's a number
            quantity: Number(ventilationQuantity), // Ensure it's a number
        };

        console.log(
            `Adding ventilation product with price: ${productPrice} and quantity: ${ventilationQuantity}`
        );

        // Track previous selections to avoid duplicates
        const prevSelections = flexiDuctSelections[itemId] || [];

        // Add to selections map
        setFlexiDuctSelections((prev) => {
            const itemSelections = prev[itemId] || [];
            return {
                ...prev,
                [itemId]: [...itemSelections, newSelection],
            };
        });

        // Exit edit mode after adding
        setFlexiDuctEditMode((prev) => ({
            ...prev,
            [itemId]: false,
        }));

        // Reset selection fields
        setSelectedVentilationProduct(null);
        setVentilationQuantity(1);
    };

    // Handle removing a ventilation product from a flexi-duct/hose item
    const handleRemoveVentilationProduct = (itemId, selectionId) => {
        setFlexiDuctSelections((prev) => {
            const itemSelections = prev[itemId] || [];
            const updatedSelections = itemSelections.filter(
                (s) => s.id !== selectionId
            );

            const newSelections = { ...prev };

            if (updatedSelections.length === 0) {
                delete newSelections[itemId];
            } else {
                newSelections[itemId] = updatedSelections;
            }

            return newSelections;
        });
    };

    // Toggle edit mode for flexi-duct items
    const toggleFlexiDuctEditMode = (itemId) => {
        setFlexiDuctEditMode((prev) => ({
            ...prev,
            [itemId]: !prev[itemId],
        }));
    };

    // Modified handler for access door selection with explicit MongoDB ID storage
    const handleLocalAccessDoorSelect = (itemId, selectedDoor) => {
        if (!selectedDoor) return;

        // Extract dimensions string
        const dimensions = getDoorDimensionsString(selectedDoor);

        // Ensure we have the MongoDB ID (prioritize _id field)
        const mongoId = selectedDoor._id || selectedDoor.id;

        // Get the price, prioritizing different possible sources
        const doorPrice =
            selectedDoor.price || selectedDoor.accessDoorPrice || 0;

        // Log the selected door data with explicit MongoDB ID
        console.log(`Selected door for item ${itemId}:`, {
            mongoId: mongoId,
            id: mongoId,
            name: selectedDoor.name || "",
            type: selectedDoor.type || "",
            dimensions,
            price: doorPrice,
        });

        // Store the selected door details with explicit MongoDB ID in local state
        setSelectedAccessDoors((prev) => ({
            ...prev,
            [itemId]: {
                mongoId: mongoId, // Explicitly store the MongoDB ID
                id: mongoId, // Also keep id for backward compatibility
                name: selectedDoor.name || "",
                type: selectedDoor.type || "",
                dimensions: dimensions,
                price: doorPrice,
            },
        }));

        // Call the original handler with explicit MongoDB ID and price
        if (handleAccessDoorSelect) {
            handleAccessDoorSelect(itemId, {
                ...selectedDoor,
                mongoId: mongoId, // Ensure mongoId is passed to parent
                id: mongoId, // Ensure id is consistent
                price: doorPrice,
                dimensions: dimensions,
                // Add this to ensure the parent component recognizes this is a door selection
                accessDoorPrice: doorPrice,
            });
        }
    };

    // NEW: Helper to format door dimensions string
    const getDoorDimensionsString = (door) => {
        const dimensions = [];

        // Direct dimension properties
        if (door.length) dimensions.push(`L: ${door.length}`);
        if (door.width) dimensions.push(`W: ${door.width}`);
        if (door.height) dimensions.push(`H: ${door.height}`);
        if (door.depth) dimensions.push(`Dep: ${door.depth}`);
        if (door.diameter) dimensions.push(`Dia: ${door.diameter}`);

        // Look in customData if no direct properties
        if (
            dimensions.length === 0 &&
            door.customData &&
            Array.isArray(door.customData)
        ) {
            const lengthField = door.customData.find(
                (field) =>
                    field.fieldName &&
                    field.fieldName.toLowerCase() === "length"
            );
            if (lengthField && lengthField.value)
                dimensions.push(`L: ${lengthField.value}`);

            const widthField = door.customData.find(
                (field) =>
                    field.fieldName && field.fieldName.toLowerCase() === "width"
            );
            if (widthField && widthField.value)
                dimensions.push(`W: ${widthField.value}`);

            const heightField = door.customData.find(
                (field) =>
                    field.fieldName &&
                    field.fieldName.toLowerCase() === "height"
            );
            if (heightField && heightField.value)
                dimensions.push(`H: ${heightField.value}`);

            const depthField = door.customData.find(
                (field) =>
                    field.fieldName && field.fieldName.toLowerCase() === "depth"
            );
            if (depthField && depthField.value)
                dimensions.push(`Dep: ${depthField.value}`);

            const diameterField = door.customData.find(
                (field) =>
                    field.fieldName &&
                    field.fieldName.toLowerCase() === "diameter"
            );
            if (diameterField && diameterField.value)
                dimensions.push(`Dia: ${diameterField.value}`);
        }

        return dimensions.join(" × ");
    };

    // Helper to get diameter from product
    const getDiameterFromProduct = (product) => {
        if (!product) return "";

        // Try to find diameter in customData
        if (product.customData && Array.isArray(product.customData)) {
            const diameterField = product.customData.find(
                (field) =>
                    field.fieldName &&
                    field.fieldName.toLowerCase() === "diameter"
            );

            if (diameterField && diameterField.value) {
                return diameterField.value;
            }
        }

        // If diameter is directly on product
        if (product.diameter) {
            return product.diameter;
        }

        return "";
    };

    // IMPROVED: Helper to get price from product
    const getProductPrice = (product) => {
        if (!product) return 0;

        // Try to extract price from label if it contains a price string
        if (product.label) {
            const priceMatch = product.label.match(/£(\d+(\.\d+)?)/);
            if (priceMatch && priceMatch[1]) {
                const price = Number(priceMatch[1]);
                if (!isNaN(price)) return price;
            }
        }

        // Direct price property - try to catch multiple formats
        if (product.price !== undefined && product.price !== null) {
            const price = Number(product.price);
            if (!isNaN(price)) return price;
        }

        // Check if value object contains price
        if (product.value && product.value.price !== undefined) {
            const price = Number(product.value.price);
            if (!isNaN(price)) return price;
        }

        // Look in customData - most common case for our products
        if (product.customData && Array.isArray(product.customData)) {
            const priceField = product.customData.find(
                (field) =>
                    field.fieldName && field.fieldName.toLowerCase() === "price"
            );

            if (
                priceField &&
                priceField.value !== undefined &&
                priceField.value !== null
            ) {
                const price = Number(priceField.value);
                if (!isNaN(price)) return price;
            }
        }

        // Try to find price in value.customData as well
        if (
            product.value &&
            product.value.customData &&
            Array.isArray(product.value.customData)
        ) {
            const priceField = product.value.customData.find(
                (field) =>
                    field.fieldName && field.fieldName.toLowerCase() === "price"
            );

            if (
                priceField &&
                priceField.value !== undefined &&
                priceField.value !== null
            ) {
                const price = Number(priceField.value);
                if (!isNaN(price)) return price;
            }
        }

        // Try to extract price from the label or name as a last resort
        if (product.label && typeof product.label === "string") {
            // Looking for patterns like "- £19.80" at the end of the label
            const priceMatch = product.label.match(/- £(\d+(\.\d+)?)$/);
            if (priceMatch && priceMatch[1]) {
                const price = Number(priceMatch[1]);
                if (!isNaN(price)) return price;
            }
        }

        console.warn("Could not extract price from product:", product);
        return 0;
    };

    // Format dropdown options for ventilation products - MODIFIED: Removed price from label
    const formatVentilationOption = (option) => {
        const diameter = getDiameterFromProduct(option);
        // Still get the price for internal use but don't display it
        getProductPrice(option); // Just calculate it but don't use in display
        return {
            label: `${option.name}${diameter ? ` (D: ${diameter})` : ""}`,
            value: option,
        };
    };

    // This helper computes the sequential number for any Access Doors item
    // by filtering all placed items with the same category & name,
    // then finding this item's index in that array.
    const getAccessDoorSeqNum = (item) => {
        return (
            placedItems
                .filter(
                    (it) =>
                        it.category &&
                        it.category.toLowerCase() === "access doors" &&
                        it.name.toLowerCase() === item.name.toLowerCase()
                )
                .findIndex((it) => it.id === item.id) + 1
        );
    };

    // Helper function to check if an item is an "Existing" or "NotFitted" access door
    const isExistingOrNotFitted = (item) => {
        if (!item || !item.name) return false;

        const nameLower = item.name.toLowerCase();
        return (
            nameLower.includes("existing") ||
            nameLower.includes("not fitted") ||
            nameLower.includes("notfitted")
        );
    };

    // Helper function to check if an item is a Flexi-Duct or Flexi Hose
    const isFlexiDuct = (item) => {
        if (!item || !item.name) return false;

        const nameLower = item.name.toLowerCase();
        return (
            nameLower.includes("flexi-duct") ||
            nameLower.includes("flexi duct") ||
            nameLower.includes("flexiduct") ||
            nameLower.includes("flexi-hose") ||
            nameLower.includes("flexi hose") ||
            nameLower.includes("flexihose")
        );
    };

    // Selected value template for dropdown to control overflow - MODIFIED: Removed price
    const selectedValueTemplate = (option) => {
        if (!option) return "Select a product";

        const diameter = getDiameterFromProduct(option);
        return (
            <div
                style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    width: "100%",
                }}
            >
                {option.name}
                {diameter ? ` (D: ${diameter})` : ""}
            </div>
        );
    };

    const itemTemplate = (item) => {
        if (!item) return null;

        // Determine if this item is an Access Door
        const isAccessDoor =
            item.category && item.category.toLowerCase() === "access doors";
        const seqNum = isAccessDoor ? getAccessDoorSeqNum(item) : null;

        // Check if this is an "Existing" or "NotFitted" access door
        const isExistingAccessDoor =
            isAccessDoor && isExistingOrNotFitted(item);

        // Check if this is a Flexi-Duct/Flexi Hose item
        const isFlexiDuctItem = isFlexiDuct(item);

        // Get the item's saved ventilation product selections
        const itemVentilationSelections = flexiDuctSelections[item.id] || [];
        const hasVentilationSelections = itemVentilationSelections.length > 0;
        const isEditing =
            flexiDuctEditMode[item.id] || !hasVentilationSelections;

        // 1) Connectors: same layout as other items,
        //    but replace the 30×30 image with a color box showing pairNumber.
        if (item.type === "connectors") {
            return (
                <div
                    style={{
                        margin: "20px",
                        width: "425px",
                        position: "relative",
                    }}
                    className="p-card p-component"
                >
                    <div
                        className="p-card-body"
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "1rem",
                        }}
                    >
                        {/* Top row: "image" replaced with color box + item name */}
                        <div style={{ display: "flex", alignItems: "center" }}>
                            <div
                                style={{
                                    marginRight: "8px",
                                    width: "30px",
                                    height: "30px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    border: `4px solid ${item.borderColor}`,
                                    background: "#fff",
                                    color: item.borderColor,
                                }}
                            >
                                {item.pairNumber}
                            </div>
                            <span style={{ fontSize: "16px" }}>
                                {item.name}
                            </span>
                        </div>
                    </div>
                </div>
            );
        }

        // 2) If it's a panel item
        if (item.type === "panel") {
            const panelKey = `panel-${item.id}`;
            const dims = groupDimensions[panelKey] || {
                length: "",
                width: "",
                height: "",
            };
            return (
                <div
                    style={{
                        margin: "20px",
                        width: "425px",
                        position: "relative",
                    }}
                    className="p-card p-component"
                >
                    <div className="p-card-body">
                        {/* Top row: Original image and name */}
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                }}
                            >
                                <div style={{ marginRight: "8px" }}>
                                    <img
                                        src={item.image}
                                        alt={item.name}
                                        width="30"
                                        height="30"
                                    />
                                </div>
                                <span style={{ fontSize: "16px" }}>
                                    {item.name}
                                </span>
                            </div>
                        </div>

                        {/* Dimension inputs if required */}
                        {item.requiresDimensions && (
                            <DimensionInputs
                                dimensionKey={panelKey}
                                dims={dims}
                                handleDimensionChange={handleDimensionChange}
                            />
                        )}

                        {/* IMPROVED: Access Door TreeSelect for Access Door panels, with better handling of saved data */}
                        {isAccessDoor &&
                            !isExistingAccessDoor &&
                            // Check both local state AND accessDoorSelections prop
                            (selectedAccessDoors[item.id] ? (
                                // Show selected door info as text
                                <div
                                    style={{
                                        marginTop: "10px",
                                        padding: "8px",
                                        border: "1px solid #ddd",
                                        borderRadius: "4px",
                                        backgroundColor: "#f9f9f9",
                                    }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "flex-start",
                                        }}
                                    >
                                        <div>
                                            <div style={{ fontWeight: "bold" }}>
                                                {
                                                    selectedAccessDoors[item.id]
                                                        .name
                                                }
                                                {selectedAccessDoors[item.id]
                                                    .type && (
                                                    <span
                                                        style={{
                                                            fontWeight:
                                                                "normal",
                                                        }}
                                                    >
                                                        {" "}
                                                        -{" "}
                                                        {
                                                            selectedAccessDoors[
                                                                item.id
                                                            ].type
                                                        }
                                                    </span>
                                                )}
                                            </div>
                                            {selectedAccessDoors[item.id]
                                                .dimensions && (
                                                <div
                                                    style={{
                                                        fontSize: "0.9rem",
                                                        color: "#666",
                                                        marginTop: "4px",
                                                    }}
                                                >
                                                    {
                                                        selectedAccessDoors[
                                                            item.id
                                                        ].dimensions
                                                    }
                                                </div>
                                            )}
                                        </div>
                                        <Button
                                            label="Change"
                                            size="small"
                                            onClick={() => {
                                                // Remove the selection to show dropdown again
                                                setSelectedAccessDoors(
                                                    (prev) => {
                                                        const newState = {
                                                            ...prev,
                                                        };
                                                        delete newState[
                                                            item.id
                                                        ];
                                                        return newState;
                                                    }
                                                );
                                            }}
                                            className="p-button-text p-button-sm"
                                        />
                                    </div>
                                </div>
                            ) : (
                                // Show door selection dropdown, use proper ID for initialSelection
                                <AccessDoorTreeSelect
                                    itemId={item.id}
                                    onSelectDoor={handleLocalAccessDoorSelect}
                                    initialSelection={
                                        // Try to get MongoDB ID from saved selection with priority
                                        accessDoorSelections[item.id]
                                            ?.mongoId ||
                                        accessDoorSelections[item.id]?.id ||
                                        item.selectedDoorId
                                    }
                                />
                            ))}
                    </div>

                    {/* Access Door number overlay at bottom-left */}
                    {isAccessDoor && (
                        <div
                            style={{
                                position: "absolute",
                                bottom: "2px",
                                left: "2px",
                                background: "rgba(255,255,255,0.8)",
                                padding: "2px 4px",
                                borderRadius: "4px",
                                fontSize: "10px",
                            }}
                        >
                            {seqNum}
                        </div>
                    )}
                </div>
            );
        }

        // 3) Otherwise, it's a piece/fixture item
        const itemKey = getItemKey(item);
        const dims = groupDimensions[itemKey] || {
            length: "",
            width: "",
            height: "",
        };
        const showDimensions = Boolean(item.requiresDimensions);

        return (
            <div
                style={{
                    margin: "20px",
                    width: "425px",
                    position: "relative",
                }}
                className="p-card p-component"
            >
                <div
                    className="p-card-body"
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "1rem",
                    }}
                >
                    {/* Top row: Image and name */}
                    <div style={{ display: "flex", alignItems: "center" }}>
                        <img
                            src={item.image}
                            alt={item.name}
                            width="30"
                            height="30"
                            style={{ marginRight: "8px" }}
                        />
                        <span style={{ fontSize: "16px" }}>{item.name}</span>
                    </div>

                    {/* Dimension inputs if required */}
                    {showDimensions && (
                        <DimensionInputs
                            dimensionKey={itemKey}
                            dims={dims}
                            handleDimensionChange={handleDimensionChange}
                        />
                    )}

                    {/* IMPROVED: Access Door TreeSelect for Access Door items, with better handling of saved data */}
                    {isAccessDoor &&
                        !isExistingAccessDoor &&
                        // Check both local state AND accessDoorSelections prop
                        (selectedAccessDoors[item.id] ? (
                            // Show selected door info as text
                            <div
                                style={{
                                    marginTop: "10px",
                                    padding: "8px",
                                    border: "1px solid #ddd",
                                    borderRadius: "4px",
                                    backgroundColor: "#f9f9f9",
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "flex-start",
                                    }}
                                >
                                    <div>
                                        <div style={{ fontWeight: "bold" }}>
                                            {selectedAccessDoors[item.id].name}
                                            {selectedAccessDoors[item.id]
                                                .type && (
                                                <span
                                                    style={{
                                                        fontWeight: "normal",
                                                    }}
                                                >
                                                    {" "}
                                                    -{" "}
                                                    {
                                                        selectedAccessDoors[
                                                            item.id
                                                        ].type
                                                    }
                                                </span>
                                            )}
                                        </div>
                                        {selectedAccessDoors[item.id]
                                            .dimensions && (
                                            <div
                                                style={{
                                                    fontSize: "0.9rem",
                                                    color: "#666",
                                                    marginTop: "4px",
                                                }}
                                            >
                                                {
                                                    selectedAccessDoors[item.id]
                                                        .dimensions
                                                }
                                            </div>
                                        )}
                                    </div>
                                    <Button
                                        label="Change"
                                        size="small"
                                        onClick={() => {
                                            // Remove the selection to show dropdown again
                                            setSelectedAccessDoors((prev) => {
                                                const newState = { ...prev };
                                                delete newState[item.id];
                                                return newState;
                                            });
                                        }}
                                        className="p-button-text p-button-sm"
                                    />
                                </div>
                            </div>
                        ) : (
                            // Show door selection dropdown, use proper ID for initialSelection
                            <AccessDoorTreeSelect
                                itemId={item.id}
                                onSelectDoor={handleLocalAccessDoorSelect}
                                initialSelection={
                                    // Try to get MongoDB ID from saved selection with priority
                                    accessDoorSelections[item.id]?.mongoId ||
                                    accessDoorSelections[item.id]?.id ||
                                    item.selectedDoorId
                                }
                            />
                        ))}

                    {/* IMPROVED: Flexi-Duct/Flexi Hose section with better UX - now like access doors */}
                    {isFlexiDuctItem && (
                        <div
                            style={{
                                marginTop: "10px",
                                border: "1px solid #ddd",
                                padding: "10px",
                                borderRadius: "4px",
                            }}
                        >
                            {isEditing ? (
                                // Show product selection UI
                                <>
                                    <div
                                        style={{
                                            fontWeight: "bold",
                                            marginBottom: "10px",
                                        }}
                                    >
                                        Add Ventilation Products
                                    </div>

                                    <div
                                        style={{
                                            display: "flex",
                                            gap: "8px",
                                            marginBottom: "8px",
                                            alignItems: "center",
                                        }}
                                    >
                                        <Dropdown
                                            value={selectedVentilationProduct}
                                            options={ventilationProducts.map(
                                                formatVentilationOption
                                            )}
                                            onChange={(e) =>
                                                setSelectedVentilationProduct(
                                                    e.value
                                                )
                                            }
                                            placeholder="Select a product"
                                            style={{
                                                flex: 2,
                                                maxWidth: "250px",
                                                height: "40px",
                                            }}
                                            valueTemplate={
                                                selectedValueTemplate
                                            }
                                            itemTemplate={(option) =>
                                                option.label
                                            }
                                            filter
                                            filterPlaceholder="Search products"
                                        />

                                        <InputNumber
                                            value={ventilationQuantity}
                                            onValueChange={(e) =>
                                                setVentilationQuantity(e.value)
                                            }
                                            min={1}
                                            style={{
                                                width: "60px",
                                                height: "40px",
                                            }}
                                            inputStyle={{ width: "60px" }}
                                            buttonLayout="none"
                                        />

                                        <Button
                                            label="Add"
                                            style={{ height: "40px" }}
                                            onClick={() =>
                                                handleAddVentilationProduct(
                                                    item.id
                                                )
                                            }
                                            disabled={
                                                !selectedVentilationProduct
                                            }
                                        />
                                    </div>
                                </>
                            ) : (
                                // Show summary view with Change button
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "flex-start",
                                    }}
                                >
                                    <div style={{ fontWeight: "bold" }}>
                                        Ventilation Products Selected (
                                        {itemVentilationSelections.length})
                                    </div>
                                    <Button
                                        label="Change"
                                        size="small"
                                        onClick={() =>
                                            toggleFlexiDuctEditMode(item.id)
                                        }
                                        className="p-button-text p-button-sm"
                                    />
                                </div>
                            )}

                            {/* List of added ventilation products - always visible but without prices */}
                            {itemVentilationSelections.length > 0 && (
                                <div
                                    style={{
                                        marginTop: isEditing ? "10px" : "4px",
                                    }}
                                >
                                    <ul
                                        style={{
                                            listStyle: "none",
                                            padding: 0,
                                            margin: 0,
                                        }}
                                    >
                                        {itemVentilationSelections.map(
                                            (selection) => (
                                                <li
                                                    key={selection.id}
                                                    style={{
                                                        display: "flex",
                                                        justifyContent:
                                                            "space-between",
                                                        alignItems: "center",
                                                        padding: "4px 0",
                                                        borderBottom:
                                                            "1px solid #eee",
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            overflow: "hidden",
                                                            textOverflow:
                                                                "ellipsis",
                                                            width: "70%",
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                fontWeight:
                                                                    "medium",
                                                            }}
                                                        >
                                                            {selection.name}
                                                        </div>
                                                        <div
                                                            style={{
                                                                fontSize:
                                                                    "0.9rem",
                                                                color: "#666",
                                                            }}
                                                        >
                                                            {selection.diameter &&
                                                                `Diameter: ${selection.diameter}`}
                                                            {selection.quantity >
                                                                1 &&
                                                                ` × ${selection.quantity}`}
                                                        </div>
                                                    </div>
                                                    {isEditing && (
                                                        <Button
                                                            icon="pi pi-trash"
                                                            className="p-button-danger p-button-text p-button-sm"
                                                            onClick={() =>
                                                                handleRemoveVentilationProduct(
                                                                    item.id,
                                                                    selection.id
                                                                )
                                                            }
                                                        />
                                                    )}
                                                </li>
                                            )
                                        )}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Access Door number overlay at bottom-left */}
                {isAccessDoor && (
                    <div
                        style={{
                            position: "absolute",
                            bottom: "2px",
                            left: "2px",
                            background: "rgba(255,255,255,0.8)",
                            padding: "2px 4px",
                            borderRadius: "4px",
                            fontSize: "10px",
                        }}
                    >
                        {seqNum}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div>
            <DataView
                value={combinedList}
                layout="grid"
                columns={5}
                paginator={false}
                itemTemplate={itemTemplate}
            />
        </div>
    );
}

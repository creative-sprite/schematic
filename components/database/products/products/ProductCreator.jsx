// components\database\products\products\ProductCreator.jsx
import React, { useState, useEffect } from "react";
import { Button } from "primereact/button";
import { DataView } from "primereact/dataview";
import { Tooltip } from "primereact/tooltip";
import {
    DndContext,
    pointerWithin,
    MouseSensor,
    TouchSensor,
    useSensor,
    useSensors,
    DragOverlay,
} from "@dnd-kit/core";

// Import custom components and hooks
import DroppableContainer from "../common/DroppableContainer";
import FieldInput from "../common/FieldInput";
import InputList from "../common/InputList";
import { useProducts } from "../hooks/useProducts";
import { useSuppliers } from "../hooks/useSuppliers";

// Core fields that are always included in products
const defaultCoreFields = [
    { id: "core-1", label: "Category", fieldType: "text", locked: true },
    { id: "core-2", label: "Name", fieldType: "text", locked: true },
    { id: "core-3", label: "Type", fieldType: "text", locked: true },
    {
        id: "core-4",
        label: "Suppliers",
        fieldType: "multiselect",
        locked: true,
    },
];

/**
 * Component for creating new products with dynamic custom fields
 *
 * @param {Object} props - Component props
 * @param {Array} props.forms - Available forms
 * @param {Array} props.customFields - Available custom fields
 * @param {Function} props.onProductCreated - Callback when a product is created
 * @returns {JSX.Element} Product creation interface
 */
const ProductCreator = ({
    forms = [],
    customFields = [],
    onProductCreated,
}) => {
    // State for available fields (copy of customFields with unique IDs)
    const [availableFields, setAvailableFields] = useState([]);

    // State for fields selected for the current product
    const [selectedFields, setSelectedFields] = useState(defaultCoreFields);

    // State for product field values
    const [productValues, setProductValues] = useState({});

    // State for drag and drop UI
    const [isOverProductCreator, setIsOverProductCreator] = useState(false);
    const [activeItem, setActiveItem] = useState(null);

    // State for form selection
    const [selectedForm, setSelectedForm] = useState(null);

    // Custom hooks
    const { createProduct, loading: creatingProduct } = useProducts();
    const { suppliers, loading: loadingSuppliers } = useSuppliers();

    // Handle field reordering in the input list
    const handleFieldsReordered = (reorderedFields) => {
        // Ensure reorderedFields is an array before updating state
        if (Array.isArray(reorderedFields)) {
            // Preserve the selected state when reordering
            const updatedFields = reorderedFields.map((field) => {
                // Find the existing field to get its current selected state
                const existingField = availableFields.find(
                    (f) => f.id === field.id || f._id === field._id
                );
                return {
                    ...field,
                    selected: existingField ? existingField.selected : false,
                };
            });
            setAvailableFields(updatedFields);
        }
    };

    // Configure sensors for better drag detection
    const sensors = useSensors(
        useSensor(MouseSensor, {
            // Lower activation distance for easier drag initiation
            activationConstraint: {
                distance: 5, // Pixels of movement required to start drag
            },
        }),
        useSensor(TouchSensor, {
            // Lower activation distance for touch devices
            activationConstraint: {
                delay: 100, // Small delay to differentiate from scrolling
                tolerance: 5, // Pixels of movement allowed before canceling a delayed drag start
            },
        })
    );

    // Update available fields when customFields prop changes
    useEffect(() => {
        if (customFields && customFields.length > 0) {
            // Map to ensure IDs are properly set and add selected property
            const formattedFields = customFields.map((field, index) => ({
                ...field,
                id:
                    field.id ||
                    field._id ||
                    `${field.label || "field"}-${index}`,
                selected: false, // Track if this field is used in the product creator
            }));

            setAvailableFields(formattedFields);
        }
    }, [customFields]);

    // Initialize product values when selected fields change
    useEffect(() => {
        // Instead of completely replacing productValues, we need to preserve existing values
        setProductValues((prev) => {
            const newValues = { ...prev }; // Start with existing values

            // Only add default values for fields that don't have values yet
            selectedFields.forEach((field) => {
                if (newValues[field.label] === undefined) {
                    // Set appropriate default values based on field type
                    if (
                        field.fieldType === "checkbox" ||
                        field.fieldType === "multiselect"
                    ) {
                        newValues[field.label] = []; // Empty array for multi-select fields
                    } else {
                        newValues[field.label] = ""; // Empty string for other fields
                    }
                }
            });

            return newValues;
        });
    }, [selectedFields]);

    // Handle field value changes
    const handleFieldChange = (label, value) => {
        // Log the change to help with debugging
        console.log(`Field value change - ${label}:`, value);

        setProductValues((prev) => {
            const updated = { ...prev, [label]: value };
            // Log the updated state for debugging
            console.log("Updated product values:", updated);
            return updated;
        });
    };

    // Handle removing a field from the product creator
    const handleRemoveField = (fieldId) => {
        // Find the field to remove
        const fieldToRemove = selectedFields.find((f) => f.id === fieldId);

        // Skip if field is locked (core fields) or not found
        if (!fieldToRemove || fieldToRemove.locked) return;

        // Remove from selected fields
        setSelectedFields((prev) => prev.filter((f) => f.id !== fieldId));

        // Mark the field as unselected in the available fields list
        setAvailableFields((prev) =>
            prev.map((field) => {
                if (field.id === fieldId || field._id === fieldId) {
                    return { ...field, selected: false };
                }
                return field;
            })
        );

        // Clean up the field value
        if (
            fieldToRemove.label &&
            productValues[fieldToRemove.label] !== undefined
        ) {
            const newValues = { ...productValues };
            delete newValues[fieldToRemove.label];
            setProductValues(newValues);
        }
    };

    // Handle form selection from dropdown
    const handleFormChange = (form) => {
        if (!form) return;

        setSelectedForm(form);

        // Load form fields into the product creator
        // Keep core fields and add custom fields from the form
        const customFields = form.customFields || [];

        // Map to our field format and ensure IDs
        const formattedCustomFields = customFields
            .map((field, index) => ({
                ...field,
                id: field.id || field._id || `form-field-${index}`,
                order: field.order || index, // Ensure order is set
            }))
            // Sort by order property to maintain the correct order
            .sort((a, b) => (a.order || 0) - (b.order || 0));

        // Update selected fields - keep core fields and add form's custom fields
        setSelectedFields([...defaultCoreFields, ...formattedCustomFields]);

        // Update availableFields to mark fields from this form as selected
        setAvailableFields((prev) => {
            return prev.map((field) => {
                // Check if this field is in the form's custom fields
                const isInForm = formattedCustomFields.some(
                    (formField) =>
                        formField.id === field.id ||
                        formField._id === field._id ||
                        formField.id === field._id ||
                        formField._id === field.id
                );

                return {
                    ...field,
                    selected: isInForm, // Mark as selected if it's in the form
                };
            });
        });

        // Update product values with initial values for the form fields
        // while preserving any existing values
        setProductValues((prev) => {
            const newValues = { ...prev };

            // Initialize category from form
            newValues["Category"] = form.category;

            // Only set defaults for fields that don't already have values
            defaultCoreFields.forEach((field) => {
                if (
                    field.label !== "Category" &&
                    newValues[field.label] === undefined
                ) {
                    if (
                        field.fieldType === "checkbox" ||
                        field.fieldType === "multiselect"
                    ) {
                        newValues[field.label] = [];
                    } else {
                        newValues[field.label] = "";
                    }
                }
            });

            formattedCustomFields.forEach((field) => {
                if (newValues[field.label] === undefined) {
                    if (
                        field.fieldType === "checkbox" ||
                        field.fieldType === "multiselect"
                    ) {
                        newValues[field.label] = [];
                    } else {
                        newValues[field.label] = "";
                    }
                }
            });

            return newValues;
        });
    };

    // --- DRAG HANDLING ---
    const handleDragStart = (event) => {
        const { active } = event;

        // Only handle dragging from available fields list
        if (active.data?.current?.list === "availableFields") {
            // Dragging an item from the available fields list
            setActiveItem({
                id: active.id,
                type: "availableField",
                field: active.data.current.field,
            });
        }
    };

    // Track when the drag is over various drop areas
    const handleDragOver = (event) => {
        const { over, active } = event;

        // Only highlight product creator when dragging from available fields
        if (active.data?.current?.list === "availableFields") {
            setIsOverProductCreator(over && over.id !== "availableFields");
        }
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        setIsOverProductCreator(false);

        if (!over) {
            setActiveItem(null);
            return;
        }

        // Only handle dragging from available fields to product creator
        if (active.data?.current?.list === "availableFields") {
            const field = active.data.current.field;

            // If dropping on the product creator or any element within it
            if (over.id !== "availableFields") {
                // Check if the field is already in selected fields
                if (!selectedFields.some((f) => f.id === field.id)) {
                    // Mark the field as selected in available fields
                    setAvailableFields((prev) =>
                        prev.map((f) => {
                            if (f.id === field.id || f._id === field.id) {
                                return { ...f, selected: true };
                            }
                            return f;
                        })
                    );

                    // Initialize the value for the newly added field
                    const defaultValue =
                        field.fieldType === "checkbox" ||
                        field.fieldType === "multiselect"
                            ? []
                            : "";

                    // Update product values for just the new field without losing existing values
                    setProductValues((prev) => ({
                        ...prev,
                        [field.label]: defaultValue,
                    }));

                    // Get core and non-core fields from current selection
                    const coreFields = selectedFields.filter((f) => f.locked);
                    const currentCustomFields = selectedFields.filter(
                        (f) => !f.locked
                    );

                    // Order the custom fields based on their position in availableFields
                    const orderedCustomFields = [...availableFields].filter(
                        (availableField) => {
                            // Include the newly dropped field
                            if (availableField.id === field.id) return true;

                            // Include fields that are already in the selection
                            return currentCustomFields.some(
                                (selectedField) =>
                                    selectedField.id === availableField.id ||
                                    selectedField._id === availableField.id
                            );
                        }
                    );

                    // Update selected fields with ordered fields
                    setSelectedFields([...coreFields, ...orderedCustomFields]);
                }
            }
        }

        setActiveItem(null);
    };

    // --- Drag Overlay ---
    const renderDragOverlay = () => {
        if (!activeItem || activeItem.type !== "availableField") return null;

        // Render the field from the available fields
        const field = activeItem.field;
        return (
            <div
                style={{
                    padding: "0.5rem",
                    border: "1px solid #aaa",
                    backgroundColor: "#fff",
                    borderRadius: "4px",
                    width: "200px",
                    textAlign: "center",
                    boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                }}
            >
                <span>
                    {field.fieldType === "number"
                        ? `${field.prefix ? field.prefix + " " : ""}${
                              field.label
                          }${field.suffix ? " " + field.suffix : ""}`
                        : field.label}
                </span>
            </div>
        );
    };

    // Custom template for DataView items
    const itemTemplate = (field) => {
        return (
            <div
                style={{
                    width: "50%",
                    padding: "0.5rem",
                    boxSizing: "border-box",
                }}
            >
                <div
                    style={{
                        padding: "1rem",
                        border: "1px solid #ddd",
                        borderRadius: "4px",
                        backgroundColor: "#fff",
                        height: "100%",
                        boxSizing: "border-box",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                        position: "relative",
                        overflow: "auto",
                    }}
                >
                    {/* Remove button (X) in top right corner - only for non-locked fields */}
                    {!field.locked && (
                        <Button
                            icon="pi pi-times"
                            className="p-button-rounded p-button-danger p-button-text p-button-sm"
                            onClick={() => handleRemoveField(field.id)}
                            style={{
                                position: "absolute",
                                top: "0.25rem",
                                right: "0.25rem",
                                width: "1.5rem",
                                height: "1.5rem",
                                padding: 0,
                                zIndex: 10,
                            }}
                            aria-label="Remove field"
                            tabIndex="-1" // Skip when tabbing through the form
                        />
                    )}

                    {/* Locked indicator for core fields */}
                    {field.locked && (
                        <div
                            style={{
                                position: "absolute",
                                top: "0.25rem",
                                right: "0.25rem",
                                fontSize: "0.75rem",
                                color: "#888",
                            }}
                        >
                            <i
                                className="pi pi-lock"
                                style={{ fontSize: "0.75rem" }}
                            ></i>
                        </div>
                    )}

                    {/* Field label with prefix/suffix for number fields */}
                    <div style={{ marginBottom: "0.5rem", fontWeight: "bold" }}>
                        {field.fieldType === "number"
                            ? `${field.prefix ? field.prefix + " " : ""}${
                                  field.label
                              }${field.suffix ? " " + field.suffix : ""}`
                            : field.label}
                    </div>

                    {/* Field input component */}
                    <FieldInput
                        field={field}
                        value={productValues[field.label]}
                        onChange={handleFieldChange}
                        suppliers={suppliers}
                    />
                </div>
            </div>
        );
    };

    // Handle create product with form saving
    const handleCreateProduct = async () => {
        // Check if required fields are filled
        if (
            !productValues["Category"] ||
            !productValues["Name"] ||
            !productValues["Type"]
        ) {
            alert("Category, Name, and Type are required.");
            return;
        }

        try {
            // Create form data from current fields and values
            // Ensure custom fields maintain their order from the availableFields list
            const customFields = selectedFields
                .filter((field) => !field.locked)
                .map((field, index) => {
                    // Find the field in availableFields to get its original order
                    const originalField = availableFields.find(
                        (f) => f.id === field.id || f._id === field.id
                    );

                    // Get the index in the availableFields list (its natural order)
                    const orderIndex = availableFields.findIndex(
                        (f) => f.id === field.id || f._id === field.id
                    );

                    // Use this index as the order to ensure fields are stored in list order
                    return {
                        ...field,
                        order: orderIndex !== -1 ? orderIndex : index,
                    };
                })
                // Sort explicitly by order to ensure consistent ordering
                .sort((a, b) => (a.order || 0) - (b.order || 0));

            const formData = {
                category: productValues["Category"],
                name: productValues["Name"] || productValues["Category"],
                type: productValues["Type"] || "Default",
                customFields: customFields, // Use the ordered custom fields
            };

            // Determine if we need to update an existing form or create a new one
            const existingForm = forms.find(
                (form) => form.category === formData.category
            );

            const isUpdate = !!existingForm;
            let formId = existingForm?._id;

            // First, save or update the form
            if (!formId) {
                // Create a new form
                const formRes = await fetch("/api/database/products/forms", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(formData),
                });

                if (!formRes.ok) {
                    throw new Error(
                        `Error creating form: ${formRes.status} ${formRes.statusText}`
                    );
                }

                const formResult = await formRes.json();

                if (!formResult.success) {
                    throw new Error(
                        formResult.message || "Unknown error with form creation"
                    );
                }

                formId = formResult.data._id;
            } else {
                // Update existing form
                const formRes = await fetch(
                    `/api/database/products/forms?id=${formId}`,
                    {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(formData),
                    }
                );

                if (!formRes.ok) {
                    throw new Error(
                        `Error updating form: ${formRes.status} ${formRes.statusText}`
                    );
                }

                const formResult = await formRes.json();

                if (!formResult.success) {
                    throw new Error(
                        formResult.message || "Unknown error with form update"
                    );
                }
            }

            // Now that we have the form ID, prepare custom data for the product
            const customData = [];
            const coreFieldNames = ["Category", "Name", "Type", "Suppliers"];

            // Get all custom fields from the form
            const allFormFields = await fetch(`/api/database/products/forms`);
            const formsData = await allFormFields.json();
            const updatedForm = formsData.data.find((f) => f._id === formId);

            if (!updatedForm) {
                throw new Error("Could not find the saved form");
            }

            // Add custom field values to customData in proper order
            // First, sort the form's custom fields by their order property
            const orderedFormFields = [...updatedForm.customFields].sort(
                (a, b) => (a.order || 0) - (b.order || 0)
            );

            // Then add values in that same order
            for (const formField of orderedFormFields) {
                const fieldLabel = formField.label;
                if (coreFieldNames.includes(fieldLabel)) continue;

                if (productValues[fieldLabel] !== undefined) {
                    customData.push({
                        fieldId: formField._id,
                        value: productValues[fieldLabel],
                    });
                }
            }

            // Create the product data
            const productData = {
                category: productValues["Category"],
                name: productValues["Name"],
                type: productValues["Type"],
                form: formId,
                customData: customData, // This is now ordered the same as the form fields
            };

            // Add suppliers if they exist in productValues
            if (
                productValues["Suppliers"] &&
                productValues["Suppliers"].length > 0
            ) {
                productData.suppliers = productValues["Suppliers"];
            }

            // Create the product
            const createdProduct = await createProduct(productData);

            // Success! Call the callback
            if (onProductCreated) {
                onProductCreated(createdProduct);
            }

            // Clear form or reset to default state
            if (selectedForm) {
                // Keep the same form selected but clear values
                handleFormChange(selectedForm);
            } else {
                // Reset to defaults
                setSelectedFields(defaultCoreFields);
                setProductValues({});
            }
        } catch (error) {
            console.error("Error creating product:", error);
            alert(`An error occurred: ${error.message}`);
        }
    };

    return (
        <div>
            <DndContext
                sensors={sensors}
                collisionDetection={pointerWithin}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
            >
                <div style={{ display: "flex", gap: "1rem" }}>
                    {/* Available Custom Fields */}
                    <InputList
                        forms={forms}
                        availableFields={availableFields.filter(
                            (field) => !field.selected
                        )}
                        selectedForm={selectedForm}
                        onFormChange={handleFormChange}
                        onFieldsReordered={handleFieldsReordered}
                    />

                    {/* Product Creator container */}
                    <div style={{ flex: 1 }}>
                        {/* Title with Info Icon */}
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                marginBottom: "10px",
                                fontWeight: "bold",
                            }}
                        >
                            <span>Product Creator</span>
                            <i
                                className="pi pi-info-circle"
                                style={{
                                    marginLeft: "8px",
                                    color: "#007ad9",
                                    cursor: "help",
                                }}
                                data-pr-tooltip="In here you can create a new product select inputs to drag and drop into this window then add the details you need, press Create Product button and view below"
                                data-pr-position="right"
                                data-pr-at="right+5 top"
                                data-pr-my="left center"
                            />
                            <Tooltip target=".pi-info-circle" />
                        </div>

                        {/* The drop target is this entire bordered container */}
                        <DroppableContainer
                            droppableId="selectedFields"
                            isOver={isOverProductCreator}
                            highlightColor="#4caf50" // Green highlight color
                            highlightOnDragOver={true}
                            style={{
                                minHeight: "430px",
                                padding: "0.1rem",
                                marginBottom: "1rem",
                                border: "1px solid #ccc",
                                borderRadius: "4px",
                                position: "relative", // Important for overlay positioning
                            }}
                        >
                            {() => (
                                <div>
                                    <DataView
                                        value={selectedFields}
                                        layout="grid"
                                        itemTemplate={itemTemplate}
                                        rows={4}
                                        paginator={false}
                                    />
                                </div>
                            )}
                        </DroppableContainer>

                        {/* Button outside the drop target area */}
                        <div style={{ marginTop: "1rem" }}>
                            <Button
                                label="Create Product"
                                onClick={handleCreateProduct}
                                disabled={creatingProduct}
                                loading={creatingProduct}
                            />
                        </div>
                    </div>
                </div>

                {/* Drag overlay that shows the item being dragged */}
                <DragOverlay>{renderDragOverlay()}</DragOverlay>
            </DndContext>
        </div>
    );
};

export default ProductCreator;

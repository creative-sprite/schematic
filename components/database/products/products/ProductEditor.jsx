// components\database\products\products\ProductEditor.jsx
import React, { useState, useEffect } from "react";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { MultiSelect } from "primereact/multiselect";
import { useProducts } from "../hooks/useProducts";
import FieldInput from "../common/FieldInput";

/**
 * Component for editing an existing product
 *
 * @param {Object} props - Component props
 * @param {Object} props.product - The product to edit
 * @param {Array} props.forms - Available forms
 * @param {Array} props.customFields - Available custom fields
 * @param {Array} props.suppliers - Available suppliers
 * @param {Function} props.onCancel - Callback when edit is canceled
 * @param {Function} props.onSave - Callback when product is saved
 * @returns {JSX.Element} Product editor interface
 */
const ProductEditor = ({
    product,
    forms = [],
    customFields = [],
    suppliers = [],
    onCancel,
    onSave,
}) => {
    // State for editing
    const [editedValues, setEditedValues] = useState({});
    const [availableCustomFields, setAvailableCustomFields] = useState([]);
    const [selectedField, setSelectedField] = useState(null);
    const [customFieldsInProduct, setCustomFieldsInProduct] = useState([]);

    // Custom hook for product operations
    const { updateProduct, loading } = useProducts();

    // Initialize edited values with current product data
    useEffect(() => {
        if (!product) return;

        // Set up basic fields
        const initialValues = {
            name: product.name,
            category: product.category,
            type: product.type,
            suppliers: product.suppliers || [],
        };

        // Create a set of field IDs already in the product
        const fieldIdsInProduct = new Set();

        // Track the custom fields in the product with their details
        const fieldsInProduct = [];

        // Set up custom field values
        if (product.customData) {
            product.customData.forEach((data) => {
                // Find the field in customFields
                const field = customFields.find((f) => f._id === data.fieldId);

                if (field) {
                    // Create a unique key for each field that includes the field ID
                    const uniqueKey = `${field.label}_${data.fieldId}`;

                    // Store the value with the unique key
                    initialValues[uniqueKey] = data.value;
                    fieldIdsInProduct.add(data.fieldId);

                    fieldsInProduct.push({
                        ...field,
                        fieldId: data.fieldId,
                        value: data.value,
                        uniqueKey: uniqueKey, // Store the unique key with the field
                    });
                }
            });
        }

        setEditedValues(initialValues);

        // Sort fields in product according to their order in customFields
        const orderedFieldsInProduct = [...fieldsInProduct].sort((a, b) => {
            const aIndex = customFields.findIndex((f) => f._id === a.fieldId);
            const bIndex = customFields.findIndex((f) => f._id === b.fieldId);
            return aIndex - bIndex;
        });

        setCustomFieldsInProduct(orderedFieldsInProduct);

        // Determine which custom fields are available to add (not already in product)
        const availableFields = customFields
            .filter((field) => !fieldIdsInProduct.has(field._id))
            .map((field) => ({
                ...field,
                // Add formatted label with prefix/suffix
                formattedLabel: formatFieldLabel(field),
            }));

        setAvailableCustomFields(availableFields);
    }, [product, customFields]);

    /**
     * Format field label with prefix and suffix
     * @param {Object} field - Field object to format
     * @returns {string} Formatted label
     */
    const formatFieldLabel = (field) => {
        if (field.fieldType === "number" && (field.prefix || field.suffix)) {
            return `${field.prefix ? field.prefix + " " : ""}${field.label}${
                field.suffix ? " " + field.suffix : ""
            }`;
        }
        return field.label;
    };

    /**
     * Handle adding a new custom field to the product
     */
    const handleAddCustomField = () => {
        if (!selectedField) return;

        // Find the full field details from customFields
        const fieldToAdd = customFields.find(
            (f) => f._id === selectedField._id
        );
        if (!fieldToAdd) return;

        // Create a unique key for this field that includes the field ID
        // This ensures different fields with the same label are handled separately
        const uniqueKey = `${fieldToAdd.label}_${fieldToAdd._id}`;

        // Set empty default value for just this new field
        const defaultValue =
            fieldToAdd.fieldType === "checkbox" ||
            fieldToAdd.fieldType === "multiselect"
                ? []
                : "";

        // Update editedValues with the new field
        setEditedValues((prev) => ({
            ...prev,
            [uniqueKey]: defaultValue,
        }));

        // Add field to current product's customData
        const updatedCustomData = [
            ...(product.customData || []),
            {
                fieldId: fieldToAdd._id,
                value: defaultValue,
            },
        ];

        // Update product (local state only, not saved yet)
        product.customData = updatedCustomData;

        // Add the field to customFieldsInProduct with the unique key
        const updatedFieldsInProduct = [
            ...customFieldsInProduct,
            {
                ...fieldToAdd,
                fieldId: fieldToAdd._id,
                value: defaultValue,
                uniqueKey: uniqueKey, // Store the unique key with the field
            },
        ];

        // Re-sort all fields according to their order in customFields
        const sortedFields = updatedFieldsInProduct.sort((a, b) => {
            const aIndex = customFields.findIndex((f) => f._id === a.fieldId);
            const bIndex = customFields.findIndex((f) => f._id === b.fieldId);
            return aIndex - bIndex;
        });

        setCustomFieldsInProduct(sortedFields);

        // Remove from available fields
        setAvailableCustomFields((prev) =>
            prev.filter((field) => field._id !== fieldToAdd._id)
        );

        // Reset selected field
        setSelectedField(null);
    };

    /**
     * Handle removing a custom field from the product
     * @param {string} fieldId - ID of the field to remove
     */
    const handleRemoveCustomField = (fieldId) => {
        // Find the field in customFieldsInProduct to get its uniqueKey
        const fieldToRemove = customFieldsInProduct.find(
            (f) => f.fieldId === fieldId
        );
        if (!fieldToRemove) return;

        // Remove from product's customData
        const updatedCustomData = product.customData.filter(
            (data) => data.fieldId !== fieldId
        );

        // Remove from editedValues using the uniqueKey
        const updatedValues = { ...editedValues };
        if (fieldToRemove.uniqueKey) {
            delete updatedValues[fieldToRemove.uniqueKey];
        }

        // Update state
        product.customData = updatedCustomData;
        setEditedValues(updatedValues);

        // Remove from customFieldsInProduct
        setCustomFieldsInProduct((prev) =>
            prev.filter((f) => f.fieldId !== fieldId)
        );

        // Find the original field in customFields
        const originalField = customFields.find((f) => f._id === fieldId);
        if (originalField) {
            // Add back to available fields with formatted label
            setAvailableCustomFields((prev) => [
                ...prev,
                {
                    ...originalField,
                    formattedLabel: formatFieldLabel(originalField),
                },
            ]);
        }
    };

    /**
     * Handle saving the edited product
     */
    const handleSaveChanges = async () => {
        try {
            // Validate required fields
            if (
                !editedValues.name ||
                !editedValues.category ||
                !editedValues.type
            ) {
                alert("Name, category, and type are required.");
                return;
            }

            // Prepare the updated product data with core fields
            const updatedProduct = {
                ...product,
                name: editedValues.name,
                category: editedValues.category,
                type: editedValues.type,
                suppliers: editedValues.suppliers || [],
                // We'll update customData next
            };

            // Update customData using values indexed by uniqueKey
            updatedProduct.customData = product.customData.map((data) => {
                // Find the corresponding field in customFieldsInProduct
                const fieldInProduct = customFieldsInProduct.find(
                    (f) => f.fieldId === data.fieldId
                );

                if (
                    fieldInProduct &&
                    fieldInProduct.uniqueKey &&
                    editedValues[fieldInProduct.uniqueKey] !== undefined
                ) {
                    // Use the uniqueKey to get the value
                    return {
                        ...data,
                        value: editedValues[fieldInProduct.uniqueKey],
                    };
                }
                return data;
            });

            // Save the product
            await updateProduct(product._id, updatedProduct);

            // Call the onSave callback
            if (onSave) {
                onSave(updatedProduct);
            }
        } catch (error) {
            console.error("Error saving product:", error);
            alert(`An error occurred: ${error.message}`);
        }
    };

    // Format the dropdown options to include prefix/suffix
    const dropdownItemTemplate = (option) => {
        return <span>{option.formattedLabel || option.label}</span>;
    };

    return (
        <div className="product-editor">
            {/* Core fields section */}
            <div className="core-fields-section">
                <h3>Basic Information</h3>

                {/* Name field */}
                <div className="field" style={{ marginBottom: "1rem" }}>
                    <label htmlFor="name">Name</label>
                    <InputText
                        id="name"
                        value={editedValues.name || ""}
                        onChange={(e) =>
                            setEditedValues((prev) => ({
                                ...prev,
                                name: e.target.value,
                            }))
                        }
                        style={{ width: "100%" }}
                    />
                </div>

                {/* Category field */}
                <div className="field" style={{ marginBottom: "1rem" }}>
                    <label htmlFor="category">Category</label>
                    <InputText
                        id="category"
                        value={editedValues.category || ""}
                        onChange={(e) =>
                            setEditedValues((prev) => ({
                                ...prev,
                                category: e.target.value,
                            }))
                        }
                        style={{ width: "100%" }}
                    />
                </div>

                {/* Type field */}
                <div className="field" style={{ marginBottom: "1rem" }}>
                    <label htmlFor="type">Type</label>
                    <InputText
                        id="type"
                        value={editedValues.type || ""}
                        onChange={(e) =>
                            setEditedValues((prev) => ({
                                ...prev,
                                type: e.target.value,
                            }))
                        }
                        style={{ width: "100%" }}
                    />
                </div>

                {/* Suppliers field */}
                <div className="field" style={{ marginBottom: "1rem" }}>
                    <label htmlFor="suppliers">Suppliers</label>
                    <MultiSelect
                        id="suppliers"
                        value={editedValues.suppliers || []}
                        options={suppliers}
                        onChange={(e) =>
                            setEditedValues((prev) => ({
                                ...prev,
                                suppliers: e.value,
                            }))
                        }
                        optionLabel="name"
                        placeholder="Select Suppliers"
                        display="chip"
                        style={{ width: "100%" }}
                        filter={suppliers.length > 10}
                    />
                </div>
            </div>

            {/* Custom fields section */}
            <div
                className="custom-fields-section"
                style={{ marginTop: "2rem" }}
            >
                <h3>Custom Fields</h3>

                {/* Existing custom fields */}
                {customFieldsInProduct.length > 0 ? (
                    <div className="existing-fields">
                        {customFieldsInProduct.map((field, index) => {
                            return (
                                <div
                                    key={index}
                                    className="field"
                                    style={{
                                        marginBottom: "1rem",
                                        border: "1px solid #ddd",
                                        padding: "0.75rem",
                                        borderRadius: "4px",
                                        position: "relative",
                                    }}
                                >
                                    {/* Remove button */}
                                    <Button
                                        icon="pi pi-times"
                                        className="p-button-rounded p-button-danger p-button-text"
                                        onClick={() =>
                                            handleRemoveCustomField(
                                                field.fieldId
                                            )
                                        }
                                        style={{
                                            position: "absolute",
                                            top: "0.5rem",
                                            right: "0.5rem",
                                        }}
                                        tabIndex="-1" // Skip tab navigation
                                    />

                                    {/* Field label with proper spacing */}
                                    <label
                                        htmlFor={`custom-${index}`}
                                        style={{
                                            marginBottom: "0.5rem",
                                            display: "block",
                                        }}
                                    >
                                        {formatFieldLabel(field)}
                                    </label>

                                    {/* Field input */}
                                    <FieldInput
                                        field={field}
                                        value={editedValues[field.uniqueKey]}
                                        onChange={(label, value) =>
                                            setEditedValues((prev) => ({
                                                ...prev,
                                                [field.uniqueKey]: value,
                                            }))
                                        }
                                        suppliers={suppliers}
                                    />
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p>No custom fields for this product.</p>
                )}

                {/* Add new custom field section */}
                <div
                    className="add-field-section"
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        marginTop: "1rem",
                        padding: "0.75rem",
                        backgroundColor: "#f8f9fa",
                        borderRadius: "4px",
                    }}
                >
                    <Dropdown
                        value={selectedField}
                        options={availableCustomFields}
                        onChange={(e) => setSelectedField(e.value)}
                        optionLabel="formattedLabel"
                        itemTemplate={dropdownItemTemplate}
                        placeholder="Select Custom Field to Add"
                        style={{ flex: 1 }}
                        disabled={availableCustomFields.length === 0}
                        filter={availableCustomFields.length > 10}
                    />
                    <Button
                        icon="pi pi-plus"
                        onClick={handleAddCustomField}
                        disabled={!selectedField}
                        className="p-button-success"
                    />
                </div>

                {availableCustomFields.length === 0 && (
                    <small
                        style={{
                            display: "block",
                            marginTop: "0.5rem",
                            color: "#6c757d",
                        }}
                    >
                        All available custom fields have been added to this
                        product.
                    </small>
                )}
            </div>

            {/* Action buttons */}
            <div
                className="product-editor-actions"
                style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "0.5rem",
                    marginTop: "2rem",
                }}
            >
                <Button
                    label="Cancel"
                    icon="pi pi-times"
                    onClick={onCancel}
                    className="p-button-text"
                />
                <Button
                    label="Save Changes"
                    icon="pi pi-check"
                    onClick={handleSaveChanges}
                    loading={loading}
                    disabled={loading}
                />
            </div>
        </div>
    );
};

export default ProductEditor;

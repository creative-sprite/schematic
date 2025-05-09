// components\database\products\customFields\CustomFieldManager.jsx

import React, { useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Chip } from "primereact/chip";
import { Tooltip } from "primereact/tooltip";
import { useCustomFields } from "../hooks/useCustomFields";

/**
 * Component for managing existing custom fields
 *
 * @param {Object} props - Component props
 * @param {Array} props.customFields - Array of custom fields to display
 * @param {Function} props.onRefresh - Callback to trigger when fields are updated
 * @param {boolean} props.loading - Loading state
 * @returns {JSX.Element} Custom field management interface
 */
const CustomFieldManager = ({
    customFields = [],
    onRefresh,
    loading = false,
}) => {
    // Use custom hook for field operations
    const { createCustomField } = useCustomFields();

    // State for editing
    const [editField, setEditField] = useState(null);
    const [editDialogVisible, setEditDialogVisible] = useState(false);
    const [optionInput, setOptionInput] = useState("");

    // Available field types
    const fieldTypeOptions = [
        { label: "Text Input", value: "text" },
        { label: "Number Input", value: "number" },
        { label: "Dropdown Select", value: "dropdown" },
        { label: "Radio Buttons", value: "radio" },
        { label: "Checkboxes", value: "checkbox" },
        { label: "Date Picker", value: "date" },
        { label: "File Upload", value: "file" },
        { label: "URL Input", value: "url" },
    ];

    // Field types that require options
    const optionsFieldTypes = ["dropdown", "radio", "checkbox", "select"];

    /**
     * Open edit dialog for a field
     * @param {Object} field - The field to edit
     */
    const openEditDialog = (field) => {
        // Create a copy to avoid direct mutation
        setEditField({ ...field });
        setEditDialogVisible(true);
    };

    /**
     * Update a property of the field being edited
     * @param {string} property - Property to update
     * @param {any} value - New value
     */
    const updateEditField = (property, value) => {
        setEditField((prev) => ({ ...prev, [property]: value }));
    };

    /**
     * Handle adding an option to fields that need options
     */
    const handleAddOption = () => {
        if (!optionInput.trim() || !editField) return;

        // Ensure options array exists
        const currentOptions = editField.options || [];

        // Prevent duplicate options
        if (!currentOptions.includes(optionInput.trim())) {
            const updatedOptions = [...currentOptions, optionInput.trim()];
            updateEditField("options", updatedOptions);
        }

        // Clear input
        setOptionInput("");
    };

    /**
     * Remove an option from the field being edited
     * @param {string} optionToRemove - Option to remove
     */
    const handleRemoveOption = (optionToRemove) => {
        if (!editField) return;

        const currentOptions = editField.options || [];
        const updatedOptions = currentOptions.filter(
            (option) => option !== optionToRemove
        );

        updateEditField("options", updatedOptions);
    };

    /**
     * Save the edited field
     */
    const handleSaveEdit = async () => {
        if (!editField) return;

        try {
            // Validate required fields
            if (!editField.label) {
                alert("Label is required");
                return;
            }

            // Validate options for fields that need them
            if (
                optionsFieldTypes.includes(editField.fieldType) &&
                (!editField.options || editField.options.length === 0)
            ) {
                alert(
                    `Options are required for ${editField.fieldType} field type`
                );
                return;
            }

            // Update the field
            await createCustomField(editField);

            // Close dialog
            setEditDialogVisible(false);

            // Refresh fields
            if (onRefresh) {
                onRefresh();
            }
        } catch (error) {
            console.error("Error updating custom field:", error);
            alert(`An error occurred: ${error.message}`);
        }
    };

    /**
     * Render action buttons for each row
     * @param {Object} rowData - The field data for this row
     */
    const actionBodyTemplate = (rowData) => {
        return (
            <div style={{ display: "flex", justifyContent: "center" }}>
                <Button
                    icon="pi pi-pencil"
                    className="p-button-rounded p-button-text p-button-warning"
                    onClick={() => openEditDialog(rowData)}
                    tooltip="Edit Field"
                    tooltipOptions={{ position: "top" }}
                />
            </div>
        );
    };

    /**
     * Format number field with prefix/suffix
     * @param {Object} rowData - The field data
     */
    const formatNumberField = (rowData) => {
        if (rowData.fieldType !== "number") return "";
        return `${rowData.prefix || ""} ${rowData.suffix || ""}`.trim();
    };

    /**
     * Format options for fields that have them
     * @param {Object} rowData - The field data
     */
    const formatOptions = (rowData) => {
        if (
            !["dropdown", "radio", "checkbox", "select"].includes(
                rowData.fieldType
            )
        )
            return "";

        if (!rowData.options || rowData.options.length === 0)
            return "No options";

        return rowData.options.join(", ");
    };

    return (
        <div style={{ marginBottom: "1rem" }}>
            {/* Title with Info Icon */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: "10px",
                    fontWeight: "bold",
                }}
            >
                <span>Custom Input Manager</span>
                <i
                    className="pi pi-info-circle"
                    style={{
                        marginLeft: "8px",
                        color: "#007ad9",
                        cursor: "help",
                    }}
                    data-pr-tooltip="Here you can review what custom inputs have been created and edit their properties."
                    data-pr-position="right"
                    data-pr-at="right+5 top"
                    data-pr-my="left center"
                />
                <Tooltip target=".pi-info-circle" />
            </div>

            <DataTable
                value={customFields}
                responsiveLayout="scroll"
                stripedRows
                loading={loading}
                emptyMessage="No custom fields found"
            >
                <Column field="label" header="Label" sortable />
                <Column field="fieldType" header="Type" sortable />
                <Column
                    field="prefix"
                    header="Prefix/Suffix"
                    body={formatNumberField}
                />
                <Column field="options" header="Options" body={formatOptions} />
                <Column
                    body={actionBodyTemplate}
                    exportable={false}
                    style={{ width: "100px" }}
                />
            </DataTable>

            {/* Edit Dialog */}
            <Dialog
                visible={editDialogVisible}
                style={{ width: "50vw" }}
                header="Edit Custom Field"
                modal
                onHide={() => setEditDialogVisible(false)}
            >
                {editField && (
                    <div>
                        {/* Field Type */}
                        <div style={{ marginBottom: "1rem" }}>
                            <label
                                htmlFor="edit-field-type"
                                style={{
                                    display: "block",
                                    marginBottom: "0.5rem",
                                }}
                            >
                                Field Type
                            </label>
                            <Dropdown
                                id="edit-field-type"
                                value={editField.fieldType}
                                options={fieldTypeOptions}
                                onChange={(e) =>
                                    updateEditField("fieldType", e.value)
                                }
                                style={{ width: "100%" }}
                                optionLabel="label"
                                optionValue="value"
                            />
                        </div>

                        {/* Label */}
                        <div style={{ marginBottom: "1rem" }}>
                            <label
                                htmlFor="edit-field-label"
                                style={{
                                    display: "block",
                                    marginBottom: "0.5rem",
                                }}
                            >
                                Label
                            </label>
                            <InputText
                                id="edit-field-label"
                                value={editField.label || ""}
                                onChange={(e) =>
                                    updateEditField("label", e.target.value)
                                }
                                style={{ width: "100%" }}
                                placeholder="Enter field label"
                            />
                        </div>

                        {/* Number field specific inputs */}
                        {editField.fieldType === "number" && (
                            <div
                                style={{
                                    display: "flex",
                                    gap: "1rem",
                                    marginBottom: "1rem",
                                }}
                            >
                                <div style={{ flex: 1 }}>
                                    <label
                                        htmlFor="edit-field-prefix"
                                        style={{
                                            display: "block",
                                            marginBottom: "0.5rem",
                                        }}
                                    >
                                        Prefix
                                    </label>
                                    <InputText
                                        id="edit-field-prefix"
                                        value={editField.prefix || ""}
                                        onChange={(e) =>
                                            updateEditField(
                                                "prefix",
                                                e.target.value
                                            )
                                        }
                                        style={{ width: "100%" }}
                                        placeholder="e.g. £, $"
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label
                                        htmlFor="edit-field-suffix"
                                        style={{
                                            display: "block",
                                            marginBottom: "0.5rem",
                                        }}
                                    >
                                        Suffix
                                    </label>
                                    <InputText
                                        id="edit-field-suffix"
                                        value={editField.suffix || ""}
                                        onChange={(e) =>
                                            updateEditField(
                                                "suffix",
                                                e.target.value
                                            )
                                        }
                                        style={{ width: "100%" }}
                                        placeholder="e.g. kg, m"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Options for fields that need them */}
                        {optionsFieldTypes.includes(editField.fieldType) && (
                            <div>
                                <label
                                    style={{
                                        display: "block",
                                        marginBottom: "0.5rem",
                                    }}
                                >
                                    Options
                                </label>
                                {/* Current options */}
                                <div
                                    style={{
                                        display: "flex",
                                        flexWrap: "wrap",
                                        gap: "0.5rem",
                                        marginBottom: "1rem",
                                        minHeight: "2rem",
                                    }}
                                >
                                    {editField.options &&
                                    editField.options.length > 0 ? (
                                        editField.options.map(
                                            (option, index) => (
                                                <Chip
                                                    key={index}
                                                    label={option}
                                                    removable
                                                    onRemove={() =>
                                                        handleRemoveOption(
                                                            option
                                                        )
                                                    }
                                                />
                                            )
                                        )
                                    ) : (
                                        <span style={{ color: "#6c757d" }}>
                                            No options added yet
                                        </span>
                                    )}
                                </div>

                                {/* Add new option */}
                                <div style={{ display: "flex", gap: "0.5rem" }}>
                                    <InputText
                                        value={optionInput}
                                        onChange={(e) =>
                                            setOptionInput(e.target.value)
                                        }
                                        placeholder="Add an option..."
                                        style={{ flex: 1 }}
                                    />
                                    <Button
                                        label="Add Option"
                                        icon="pi pi-plus"
                                        onClick={handleAddOption}
                                        disabled={!optionInput.trim()}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Save button */}
                        <div
                            style={{ marginTop: "1.5rem", textAlign: "right" }}
                        >
                            <Button
                                label="Save Changes"
                                onClick={handleSaveEdit}
                                className="p-button-success"
                            />
                        </div>
                    </div>
                )}
            </Dialog>
        </div>
    );
};

export default CustomFieldManager;

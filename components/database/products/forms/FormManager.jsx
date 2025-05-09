// components\database\products\forms\FormManager.jsx

import React from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { confirmDialog } from "primereact/confirmdialog";
import { useForms } from "../hooks/useForms";
import { Tooltip } from "primereact/tooltip";

/**
 * Component for managing existing forms
 *
 * @param {Object} props - Component props
 * @param {Array} props.forms - Array of forms to display
 * @param {Function} props.onRefresh - Callback to trigger when forms are updated
 * @param {boolean} props.loading - Loading state
 * @returns {JSX.Element} Form management interface
 */
const FormManager = ({ forms = [], onRefresh, loading = false }) => {
    // Use custom hook for form operations
    const { deleteForm } = useForms();

    /**
     * Handle deleting a form
     * @param {string} formId - ID of the form to delete
     */
    const handleDeleteForm = async (formId) => {
        try {
            const success = await deleteForm(formId);

            if (success && onRefresh) {
                onRefresh();
            }
        } catch (error) {
            console.error("Error deleting form:", error);
            alert(`An error occurred: ${error.message}`);
        }
    };

    /**
     * Show confirmation dialog before deletion
     * @param {Object} form - The form to delete
     */
    const confirmDeleteForm = (form) => {
        confirmDialog({
            message: `Are you sure you want to delete form "${
                form.name || form.category
            }"? This will not delete associated products.`,
            header: "Delete Form Confirmation",
            icon: "pi pi-exclamation-triangle",
            acceptClassName: "p-button-danger",
            accept: () => handleDeleteForm(form._id),
            reject: () => {}, // No action on reject
        });
    };

    /**
     * Render action buttons for each row
     * @param {Object} rowData - The form data for this row
     */
    const actionBodyTemplate = (rowData) => {
        return (
            <div
                style={{
                    display: "flex",
                    gap: "0.5rem",
                    justifyContent: "center",
                }}
            >
                <Button
                    icon="pi pi-trash"
                    className="p-button-rounded p-button-danger p-button-text"
                    onClick={() => confirmDeleteForm(rowData)}
                    tooltip="Delete Form"
                    tooltipOptions={{ position: "top" }}
                />
            </div>
        );
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
                <span>Form Manager</span>
                <i
                    className="pi pi-info-circle"
                    style={{
                        marginLeft: "8px",
                        color: "#007ad9",
                        cursor: "help",
                    }}
                    data-pr-tooltip="Review saved forms see how many custom inputs are saved to forms and delete unused forms."
                    data-pr-position="right"
                    data-pr-at="right+5 top"
                    data-pr-my="left center"
                />
                <Tooltip target=".pi-info-circle" />
            </div>

            <DataTable
                value={forms}
                responsiveLayout="scroll"
                stripedRows
                loading={loading}
                emptyMessage="No forms found"
            >
                <Column field="category" header="Category" sortable />
                <Column field="name" header="Name" sortable />
                <Column field="type" header="Type" sortable />
                <Column
                    field="customFields"
                    header="Custom Fields"
                    body={(rowData) => rowData.customFields?.length || 0}
                    sortable
                />
                <Column
                    body={actionBodyTemplate}
                    exportable={false}
                    style={{ width: "100px" }}
                />
            </DataTable>

            {/* Help text */}
            <div style={{ marginTop: "1rem", color: "#6c757d" }}>
                <small>
                    Note: Deleting a form will not delete associated products.
                    However, products created with this form will lose their
                    form association.
                </small>
            </div>
        </div>
    );
};

export default FormManager;

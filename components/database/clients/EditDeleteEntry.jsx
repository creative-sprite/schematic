// components\database\clients\EditDeleteEntry.jsx
"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "primereact/button";
import DeleteConfirmDialog from "./editDeleteParts/DeleteConfirmDialog";
import EditDialog from "./editDeleteParts/EditDialog";
import EntityTitle from "./editDeleteParts/EntityTitle";

/**
 * A reusable component for entity detail pages that provides:
 * - Back, Edit, and Delete buttons
 * - Delete confirmation dialog
 * - Edit functionality with a modal dialog
 * - Consistent styling and behavior
 */
const FunctionButtonsDB = ({ entityType, entity, id, toast, customTitle }) => {
    const router = useRouter();
    const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
    const [editDialogVisible, setEditDialogVisible] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editData, setEditData] = useState({});
    const [activeEditTab, setActiveEditTab] = useState(0);

    // Initialize edit data when entity changes or when the dialog opens
    useEffect(() => {
        if (entity && editDialogVisible) {
            // Deep clone the entity to avoid reference issues
            const clonedEntity = JSON.parse(JSON.stringify(entity));
            setEditData(clonedEntity);
            console.log("Edit form initialized with:", clonedEntity);
        }
    }, [entity, editDialogVisible]);

    // Helper to get API path
    const getApiPath = () => {
        return `/api/database/clients/${entityType}s/${id}`;
    };

    // Helper to get the base path for database
    const getBasePath = () => {
        return "/database"; // As requested, go to /database not /database/clients
    };

    // Helper to get entity name
    const getEntityName = () => {
        switch (entityType) {
            case "site":
                return entity?.siteName || "Site";
            case "group":
                return entity?.groupName || "Group";
            case "chain":
                return entity?.chainName || "Chain";
            case "contact":
                return (
                    `${entity?.contactFirstName || ""} ${
                        entity?.contactLastName || ""
                    }`.trim() || "Contact"
                );
            case "supplier":
                return entity?.supplierName || "Supplier";
            default:
                return "Entity";
        }
    };

    // Capitalize first letter of entity type
    const getEntityTypeDisplay = () => {
        return entityType.charAt(0).toUpperCase() + entityType.slice(1);
    };

    // Handle delete operation
    const handleDelete = async () => {
        try {
            setIsDeleting(true);
            console.log(`Deleting ${entityType} with ID ${id}`);

            const response = await fetch(getApiPath(), {
                method: "DELETE",
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(
                    `Error response (${response.status}):`,
                    errorText
                );
                throw new Error(
                    `Failed to delete ${entityType}: ${response.status}`
                );
            }

            const result = await response.json();
            console.log("Delete result:", result);

            if (result.success) {
                // Show success message if toast is available
                if (toast?.current) {
                    toast.current.show({
                        severity: "success",
                        summary: "Success",
                        detail: `${getEntityTypeDisplay()} deleted successfully`,
                        life: 3000,
                    });
                }

                // Navigate to /database
                setTimeout(() => {
                    router.push(getBasePath());
                }, 500);
            } else {
                throw new Error(
                    result.error || `Failed to delete ${entityType}`
                );
            }
        } catch (error) {
            console.error(`Error deleting ${entityType}:`, error);

            // Show error message if toast is available
            if (toast?.current) {
                toast.current.show({
                    severity: "error",
                    summary: "Error",
                    detail: `Failed to delete ${entityType}: ${error.message}`,
                    life: 3000,
                });
            }
        } finally {
            setIsDeleting(false);
            setDeleteDialogVisible(false);
        }
    };

    // Handle edit submission
    const handleEditSubmit = async () => {
        try {
            setIsSaving(true);

            console.log("Submitting edit data:", editData);

            // Send the update request
            const response = await fetch(getApiPath(), {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(editData),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(
                    `Error response (${response.status}):`,
                    errorText
                );
                throw new Error(
                    `Failed to update ${entityType}: ${response.status}`
                );
            }

            const result = await response.json();
            console.log("Update result:", result);

            if (result.success) {
                // Show success message
                if (toast?.current) {
                    toast.current.show({
                        severity: "success",
                        summary: "Success",
                        detail: `${getEntityTypeDisplay()} updated successfully`,
                        life: 3000,
                    });
                }

                // Close the dialog
                setEditDialogVisible(false);

                // Refresh the page to show updated data
                window.location.reload();
            } else {
                throw new Error(
                    result.error || `Failed to update ${entityType}`
                );
            }
        } catch (error) {
            console.error(`Error updating ${entityType}:`, error);

            if (toast?.current) {
                toast.current.show({
                    severity: "error",
                    summary: "Error",
                    detail: `Failed to update ${entityType}: ${error.message}`,
                    life: 3000,
                });
            }
        } finally {
            setIsSaving(false);
        }
    };

    // Render title based on entity type or use custom title function
    const renderTitle = () => {
        if (customTitle) {
            return customTitle(entity);
        }
        return <EntityTitle entity={entity} entityType={entityType} />;
    };

    return (
        <>
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "1rem",
                }}
            >
                <h1>{renderTitle()}</h1>
                <div className="actions">
                    <Button
                        label="Back"
                        icon="pi pi-arrow-left"
                        className="p-button-secondary"
                        style={{ marginRight: "0.5rem" }}
                        onClick={() => router.push(getBasePath())}
                    />
                    <Button
                        label="Edit"
                        icon="pi pi-pencil"
                        className="p-button-primary"
                        style={{ marginRight: "0.5rem" }}
                        onClick={() => setEditDialogVisible(true)}
                    />
                    <Button
                        label="Delete"
                        icon="pi pi-trash"
                        className="p-button-danger"
                        onClick={() => setDeleteDialogVisible(true)}
                    />
                </div>
            </div>

            <DeleteConfirmDialog
                visible={deleteDialogVisible}
                onHide={() => setDeleteDialogVisible(false)}
                entityType={entityType}
                entityName={getEntityName()}
                entityTypeDisplay={getEntityTypeDisplay()}
                onDelete={handleDelete}
                isDeleting={isDeleting}
            />

            <EditDialog
                visible={editDialogVisible}
                onHide={() => setEditDialogVisible(false)}
                entityType={entityType}
                entityTypeDisplay={getEntityTypeDisplay()}
                editData={editData}
                setEditData={setEditData}
                onSave={handleEditSubmit}
                isSaving={isSaving}
                activeEditTab={activeEditTab}
                setActiveEditTab={setActiveEditTab}
            />
        </>
    );
};

export default FunctionButtonsDB;

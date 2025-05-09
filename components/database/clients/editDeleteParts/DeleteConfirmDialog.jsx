// components\database\clients\editDeleteParts\DeleteConfirmDialog.jsx
import React from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";

/**
 * Confirmation dialog for deleting an entity
 */
const DeleteConfirmDialog = ({
    visible,
    onHide,
    entityType,
    entityName,
    entityTypeDisplay,
    onDelete,
    isDeleting,
}) => {
    return (
        <Dialog
            header={`Delete ${entityTypeDisplay}`}
            visible={visible}
            onHide={onHide}
            style={{ width: "450px" }}
            modal
            footer={
                <div>
                    <Button
                        label="Cancel"
                        icon="pi pi-times"
                        onClick={onHide}
                        className="p-button-text"
                        disabled={isDeleting}
                    />
                    <Button
                        label="Delete"
                        icon="pi pi-trash"
                        onClick={onDelete}
                        className="p-button-danger"
                        loading={isDeleting}
                    />
                </div>
            }
        >
            <div className="confirmation-content">
                <i
                    className="pi pi-exclamation-triangle p-mr-3"
                    style={{
                        fontSize: "2rem",
                        color: "#ff9800",
                        marginRight: "10px",
                    }}
                />
                <span>
                    Are you sure you want to delete{" "}
                    <strong>{entityName}</strong>? This action cannot be undone.
                </span>
            </div>
        </Dialog>
    );
};

export default DeleteConfirmDialog;

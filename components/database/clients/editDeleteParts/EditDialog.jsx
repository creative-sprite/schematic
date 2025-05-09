// components\database\clients\editDeleteParts\EditDialog.jsx
import React from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import SiteEditForm from "./SiteEditForm";
import GroupEditForm from "./GroupEditForm";
import ChainEditForm from "./ChainEditForm";
import ContactEditForm from "./ContactEditForm";
import SupplierEditForm from "./SupplierEditForm";

/**
 * Dialog for editing different entity types
 * Selects the appropriate form based on entityType
 */
const EditDialog = ({
    visible,
    onHide,
    entityType,
    entityTypeDisplay,
    editData,
    setEditData,
    onSave,
    isSaving,
    activeEditTab,
    setActiveEditTab,
}) => {
    // Render the appropriate edit form based on entity type
    const renderEditForm = () => {
        switch (entityType) {
            case "site":
                return (
                    <SiteEditForm
                        editData={editData}
                        setEditData={setEditData}
                        activeEditTab={activeEditTab}
                        setActiveEditTab={setActiveEditTab}
                    />
                );
            case "group":
                return (
                    <GroupEditForm
                        editData={editData}
                        setEditData={setEditData}
                    />
                );
            case "chain":
                return (
                    <ChainEditForm
                        editData={editData}
                        setEditData={setEditData}
                    />
                );
            case "contact":
                return (
                    <ContactEditForm
                        editData={editData}
                        setEditData={setEditData}
                    />
                );
            case "supplier":
                return (
                    <SupplierEditForm
                        editData={editData}
                        setEditData={setEditData}
                    />
                );
            default:
                return <p>Unknown entity type</p>;
        }
    };

    return (
        <Dialog
            header={`Edit ${entityTypeDisplay}`}
            visible={visible}
            onHide={onHide}
            style={{ width: "80%", maxWidth: "800px" }}
            modal
            footer={
                <div>
                    <Button
                        label="Cancel"
                        icon="pi pi-times"
                        onClick={onHide}
                        className="p-button-text"
                        disabled={isSaving}
                    />
                    <Button
                        label="Save"
                        icon="pi pi-check"
                        onClick={onSave}
                        className="p-button-primary"
                        loading={isSaving}
                    />
                </div>
            }
        >
            {renderEditForm()}
        </Dialog>
    );
};

export default EditDialog;

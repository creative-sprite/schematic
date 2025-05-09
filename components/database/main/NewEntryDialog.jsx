// components\database\main\NewEntryDialog.jsx
"use client";
import React from "react";
import { Dialog } from "primereact/dialog";
import { TabView, TabPanel } from "primereact/tabview";
import { Button } from "primereact/button";
import GroupForm from "./newEntryParts/GroupForm";
import ChainForm from "./newEntryParts/ChainForm";
import SiteForm from "./newEntryParts/SiteForm";
import ContactForm from "./newEntryParts/ContactForm";
import SupplierForm from "./newEntryParts/SupplierForm";

/**
 * Main dialog component that serves as the container for the entity forms
 * This simplified version focuses on creating new entries and automatic relationship creation
 */
const NewEntryDialog = ({
    isDialogVisible,
    closeDialog,
    newGroup,
    setNewGroup,
    newChain,
    setNewChain,
    newSite,
    setNewSite,
    newContact,
    setNewContact,
    newSupplier,
    setNewSupplier,
    handleImageUpload,
    handleNewEntrySubmit,
}) => {
    // Handler for multi-entry fields
    const handleMultiEntryChange = (entity, field, newValues) => {
        switch (entity) {
            case "group":
                setNewGroup((prev) => ({ ...prev, [field]: newValues }));
                break;
            case "chain":
                setNewChain((prev) => ({ ...prev, [field]: newValues }));
                break;
            case "site":
                setNewSite((prev) => ({ ...prev, [field]: newValues }));
                break;
            case "contact":
                setNewContact((prev) => ({ ...prev, [field]: newValues }));
                break;
            case "supplier":
                setNewSupplier((prev) => ({ ...prev, [field]: newValues }));
                break;
        }
    };

    // Render the new entry form as a TabView with component-based tabs
    const renderNewEntryTabs = () => {
        return (
            <TabView>
                <TabPanel header="Group">
                    <GroupForm
                        newGroup={newGroup}
                        setNewGroup={setNewGroup}
                        handleImageUpload={handleImageUpload}
                        handleMultiEntryChange={handleMultiEntryChange}
                    />
                </TabPanel>
                <TabPanel header="Chain">
                    <ChainForm
                        newChain={newChain}
                        setNewChain={setNewChain}
                        handleImageUpload={handleImageUpload}
                        handleMultiEntryChange={handleMultiEntryChange}
                    />
                </TabPanel>
                <TabPanel header="Site">
                    <SiteForm
                        newSite={newSite}
                        setNewSite={setNewSite}
                        handleImageUpload={handleImageUpload}
                        handleMultiEntryChange={handleMultiEntryChange}
                    />
                </TabPanel>
                <TabPanel header="Contact">
                    <ContactForm
                        newContact={newContact}
                        setNewContact={setNewContact}
                        handleImageUpload={handleImageUpload}
                        handleMultiEntryChange={handleMultiEntryChange}
                    />
                </TabPanel>
                <TabPanel header="Supplier">
                    <SupplierForm
                        newSupplier={newSupplier}
                        setNewSupplier={setNewSupplier}
                        handleImageUpload={handleImageUpload}
                        handleMultiEntryChange={handleMultiEntryChange}
                    />
                </TabPanel>
            </TabView>
        );
    };

    const dialogFooter = (
        <div style={{ textAlign: "right" }}>
            <Button
                label="Submit New Entry"
                icon="pi pi-check"
                onClick={handleNewEntrySubmit}
                autoFocus
            />
        </div>
    );

    return (
        <Dialog
            header="Add New Entry"
            visible={isDialogVisible}
            onHide={closeDialog}
            dismissableMask
            style={{ width: "80vw", height: "80vh", top: "4%" }}
            footer={dialogFooter}
        >
            {renderNewEntryTabs()}
        </Dialog>
    );
};

export default NewEntryDialog;

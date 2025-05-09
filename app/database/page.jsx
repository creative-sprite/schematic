// app\database\page.jsx
"use client";
import React, { useState, useEffect } from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import DatabaseTabs from "../../components/database/main/DatabaseTabs";
import NewEntryDialog from "../../components/database/main/NewEntryDialog";
import "../../styles/database.css";

// Main DatabasePage component that manages state and renders the sub-components.
export default function DatabasePage() {
    // Active tab index for the database list.
    const [activeIndex, setActiveIndex] = useState(0);

    // Data states.
    const [sites, setSites] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [chains, setChains] = useState([]);
    const [groups, setGroups] = useState([]);
    const [suppliers, setSuppliers] = useState([]); // new suppliers state

    // Search term.
    const [searchTerm, setSearchTerm] = useState("");

    // Lazy loading counts.
    const [displayCounts, setDisplayCounts] = useState({
        Sites: 100,
        Contacts: 100,
        Chains: 100,
        Groups: 100,
        Suppliers: 100, // new lazy load count for suppliers
    });
    const handleLoadMore = (type) => {
        setDisplayCounts((prev) => ({ ...prev, [type]: prev[type] + 100 }));
    };

    // Generic function to find primary email for any entity type
    const findPrimaryEmail = (entity, entityType) => {
        const emailFieldName = `${entityType}Emails`;
        if (entity[emailFieldName] && Array.isArray(entity[emailFieldName])) {
            const primary = entity[emailFieldName].find(
                (email) => email.isPrimary
            );
            if (primary) return primary.email;
            if (entity[emailFieldName].length > 0)
                return entity[emailFieldName][0].email;
        }
        // Fallback for legacy data
        return entity[emailFieldName] && !Array.isArray(entity[emailFieldName])
            ? entity[emailFieldName].join(", ")
            : "";
    };

    // Generic function to find primary phone for any entity type
    const findPrimaryPhone = (entity, entityType) => {
        const phoneFieldName = `${entityType}PhoneNumbers`;
        if (entity[phoneFieldName] && Array.isArray(entity[phoneFieldName])) {
            const primary = entity[phoneFieldName].find(
                (phone) => phone.isPrimary
            );
            if (primary) {
                return primary.extension
                    ? `${primary.phoneNumber} (Ext: ${primary.extension})`
                    : primary.phoneNumber;
            }
            if (entity[phoneFieldName].length > 0)
                return entity[phoneFieldName][0].phoneNumber;
        }
        // Fallback for legacy data
        const oldMobileField = `${entityType}ContactNumbersMobile`;
        const oldLandField = `${entityType}ContactNumbersLand`;
        return entity[oldLandField]
            ? entity[oldLandField].join(", ")
            : entity[oldMobileField]
            ? entity[oldMobileField].join(", ")
            : "";
    };

    // Process entity data to add primary contact info for any entity type
    const processEntityData = (entityData, entityType) => {
        return entityData.map((entity) => ({
            ...entity,
            // Add computed primary contact info for display
            primaryEmail: findPrimaryEmail(entity, entityType),
            primaryMobileNumber: findPrimaryPhone(entity, entityType),
        }));
    };

    // Fetch data.
    const fetchData = async () => {
        try {
            const [sitesRes, contactsRes, chainsRes, groupsRes, suppliersRes] =
                await Promise.all([
                    fetch("/api/database/clients/sites"),
                    fetch("/api/database/clients/contacts"),
                    fetch("/api/database/clients/chains"),
                    fetch("/api/database/clients/groups"),
                    fetch("/api/database/clients/suppliers"),
                ]);
            const sitesJson = await sitesRes.json();
            const contactsJson = await contactsRes.json();
            const chainsJson = await chainsRes.json();
            const groupsJson = await groupsRes.json();
            const suppliersJson = await suppliersRes.json();

            // Process all entity types to add primary contact info
            if (sitesJson.success)
                setSites(processEntityData(sitesJson.data, "site"));
            if (contactsJson.success)
                setContacts(processEntityData(contactsJson.data, "contact"));
            if (chainsJson.success)
                setChains(processEntityData(chainsJson.data, "chain"));
            if (groupsJson.success)
                setGroups(processEntityData(groupsJson.data, "group"));
            if (suppliersJson.success)
                setSuppliers(processEntityData(suppliersJson.data, "supplier"));
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // New Entry Modal state.
    const [isDialogVisible, setIsDialogVisible] = useState(false);
    const openDialog = () => setIsDialogVisible(true);
    const closeDialog = () => setIsDialogVisible(false);

    // New entry form states.
    const [newGroup, setNewGroup] = useState({});
    const [newChain, setNewChain] = useState({});
    const [newSite, setNewSite] = useState({});
    const [newContact, setNewContact] = useState({});
    const [newSupplier, setNewSupplier] = useState({}); // new supplier form state

    // Relationship linking.
    const [selectedRelationships, setSelectedRelationships] = useState({
        group: null,
        chain: null,
        site: null,
        contact: null,
    });

    // Format relationship options to include the ID for use in many-to-many relationships
    const relationshipOptions = {
        group: groups.map((g) => ({ id: g._id, name: g.groupName })),
        chain: chains.map((c) => ({ id: c._id, name: c.chainName })),
        site: sites.map((s) => ({ id: s._id, name: s.siteName })),
        contact: contacts.map((c) => ({
            id: c._id,
            name: `${c.contactFirstName} ${c.contactLastName}`,
        })),
    };

    const handleRelationshipSelect = (type, option) => {
        setSelectedRelationships((prev) => ({ ...prev, [type]: option }));
    };

    const removeRelationship = (type) => {
        setSelectedRelationships((prev) => ({ ...prev, [type]: null }));
    };

    // Handler for file uploads.
    const handleImageUpload = (e, type) => {
        const file = e.files[0];
        if (type === "group") {
            setNewGroup({ ...newGroup, image: file });
        } else if (type === "chain") {
            setNewChain({ ...newChain, image: file });
        } else if (type === "site") {
            setNewSite({ ...newSite, image: file });
        } else if (type === "contact") {
            setNewContact({ ...newContact, image: file });
        } else if (type === "supplier") {
            setNewSupplier({ ...newSupplier, image: file });
        }
    };

    // Submission handler.
    const handleNewEntrySubmit = async (e) => {
        e.preventDefault();

        // Prepare payload with proper many-to-many relationship arrays
        const payload = {};

        // Process Group
        if (newGroup.groupName) {
            payload.group = { ...newGroup };
        }

        // Process Chain
        if (newChain.chainName) {
            payload.chain = { ...newChain };

            // Convert MultiSelect array of objects to array of IDs
            if (newChain.groups && Array.isArray(newChain.groups)) {
                payload.chain.groups = newChain.groups.map((g) => g.id);
            }

            // Legacy compatibility - set single group reference if selected
            if (selectedRelationships.group && !payload.chain.group) {
                payload.chain.group = selectedRelationships.group.id;
            }
        }

        // Process Site
        if (newSite.siteName) {
            // Start by converting address fields into an addresses array
            const address = {
                addressNameNumber: newSite.siteAddressNameNumber || "",
                addressLine1: newSite.siteAddressLine1 || "",
                addressLine2: newSite.siteAddressLine2 || "",
                town: newSite.siteTown || "",
                county: newSite.siteCounty || "",
                country: newSite.siteCountry || "",
                postCode: newSite.sitePostCode || "",
            };

            const sitePayload = {
                ...newSite,
                addresses: [address],
            };

            // Remove temporary individual address fields
            delete sitePayload.siteAddressNameNumber;
            delete sitePayload.siteAddressLine1;
            delete sitePayload.siteAddressLine2;
            delete sitePayload.siteTown;
            delete sitePayload.siteCounty;
            delete sitePayload.siteCountry;
            delete sitePayload.sitePostCode;

            // Convert MultiSelect array of objects to array of IDs
            if (sitePayload.groups && Array.isArray(sitePayload.groups)) {
                sitePayload.groups = sitePayload.groups.map((g) => g.id);
            }

            if (sitePayload.chains && Array.isArray(sitePayload.chains)) {
                sitePayload.chains = sitePayload.chains.map((c) => c.id);
            }

            // Legacy compatibility - set single references if selected
            if (selectedRelationships.group && !sitePayload.group) {
                sitePayload.group = selectedRelationships.group.id;
            }

            if (selectedRelationships.chain && !sitePayload.chain) {
                sitePayload.chain = selectedRelationships.chain.id;
            }

            payload.site = sitePayload;
        }

        // Process Contact
        if (newContact.contactFirstName && newContact.contactLastName) {
            payload.contact = { ...newContact };

            // Convert MultiSelect array of objects to array of IDs
            if (
                payload.contact.groups &&
                Array.isArray(payload.contact.groups)
            ) {
                payload.contact.groups = payload.contact.groups.map(
                    (g) => g.id
                );
            }

            if (
                payload.contact.chains &&
                Array.isArray(payload.contact.chains)
            ) {
                payload.contact.chains = payload.contact.chains.map(
                    (c) => c.id
                );
            }

            if (payload.contact.sites && Array.isArray(payload.contact.sites)) {
                payload.contact.sites = payload.contact.sites.map((s) => s.id);
            }

            // Legacy compatibility - set single site reference if selected
            if (selectedRelationships.site && !payload.contact.site) {
                payload.contact.site = selectedRelationships.site.id;
            }
        }

        // Process Supplier
        if (newSupplier.supplierName) {
            payload.supplier = newSupplier;
        }

        console.log("Submitting new entry payload:", payload);

        try {
            const res = await fetch("/api/database/clients/newEntry", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const json = await res.json();

            if (json.success) {
                // Refresh data and close dialog
                await fetchData();
                closeDialog();

                // Reset form states
                setNewGroup({});
                setNewChain({});
                setNewSite({});
                setNewContact({});
                setNewSupplier({});
                setSelectedRelationships({
                    group: null,
                    chain: null,
                    site: null,
                    contact: null,
                });
            } else {
                console.error("Submission error:", json.message);
            }
        } catch (error) {
            console.error("Error submitting new entry:", error);
        }
    };

    return (
        <div className="database-page">
            <Card
                style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: "1rem",
                    marginTop: "30px",
                    height: "auto",
                }}
            >
                <Button
                    label="Entry"
                    icon="pi pi-plus"
                    onClick={openDialog}
                    style={{
                        height: "40px",
                        lineHeight: "40px",
                        verticalAlign: "middle",
                        marginRight: "250px",
                    }}
                />
                <InputText
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search..."
                    style={{
                        height: "40px",
                        width: "300px",
                        marginLeft: "auto",
                        verticalAlign: "middle",
                    }}
                />
            </Card>

            <DatabaseTabs
                activeIndex={activeIndex}
                setActiveIndex={setActiveIndex}
                sites={sites}
                contacts={contacts}
                chains={chains}
                groups={groups}
                suppliers={suppliers}
                searchTerm={searchTerm}
                displayCounts={displayCounts}
                handleLoadMore={handleLoadMore}
            />
            <NewEntryDialog
                isDialogVisible={isDialogVisible}
                closeDialog={closeDialog}
                newGroup={newGroup}
                setNewGroup={setNewGroup}
                newChain={newChain}
                setNewChain={setNewChain}
                newSite={newSite}
                setNewSite={setNewSite}
                newContact={newContact}
                setNewContact={setNewContact}
                newSupplier={newSupplier}
                setNewSupplier={setNewSupplier}
                relationshipOptions={relationshipOptions}
                selectedRelationships={selectedRelationships}
                handleRelationshipSelect={handleRelationshipSelect}
                removeRelationship={removeRelationship}
                handleImageUpload={handleImageUpload}
                handleNewEntrySubmit={handleNewEntrySubmit}
            />
        </div>
    );
}

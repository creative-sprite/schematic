// components\database\main\AccordionItems.jsx
"use client";
import React, { useState, useEffect } from "react";
import { Accordion, AccordionTab } from "primereact/accordion";
import { Button } from "primereact/button";
import { getDisplayData, highlightText, renderHeader } from "./helpers";
import GroupItemContent from "./accordionItemParts/GroupItemContent";
import ChainItemContent from "./accordionItemParts/ChainItemContent";
import SiteItemContent from "./accordionItemParts/SiteItemContent";
import ContactItemContent from "./accordionItemParts/ContactItemContent";
import SupplierItemContent from "./accordionItemParts/SupplierItemContent";

const AccordionItems = ({
    data,
    type,
    searchTerm,
    displayCount,
    handleLoadMore,
}) => {
    const [allContacts, setAllContacts] = useState([]);

    // Fetch all contacts for primary contact display
    useEffect(() => {
        const fetchContacts = async () => {
            try {
                const response = await fetch("/api/database/clients/contacts");
                const json = await response.json();
                if (json.success) {
                    setAllContacts(json.data);
                }
            } catch (error) {
                console.error("Error fetching contacts:", error);
            }
        };

        // Only fetch contacts for these entity types
        if (["Sites", "Chains", "Groups"].includes(type)) {
            fetchContacts();
        }
    }, [type]);

    const lowerSearch = searchTerm.toLowerCase();
    const filteredData =
        searchTerm.trim() === ""
            ? data
            : data.filter((entry) => {
                  const { displayName, contactNumber, contactEmail } =
                      getDisplayData(entry, type);
                  return (
                      displayName.toLowerCase().includes(lowerSearch) ||
                      contactNumber.toLowerCase().includes(lowerSearch) ||
                      contactEmail.toLowerCase().includes(lowerSearch)
                  );
              });
    const dataToRender = filteredData.slice(0, displayCount);

    // Find primary contacts for an entity
    const getPrimaryContacts = (entityId, entityType) => {
        if (!allContacts || !allContacts.length) return [];

        const primaryContacts = allContacts.filter((contact) => {
            // Check if this contact is marked as primary
            const isPrimary = contact.isPrimaryContact;
            if (!isPrimary) return false;

            // Check if this contact is related to our entity
            const isRelated =
                // Check many-to-many relationships
                (contact[entityType + "s"] &&
                    contact[entityType + "s"].includes(entityId)) ||
                // Check legacy single reference
                contact[entityType] === entityId;

            return isPrimary && isRelated;
        });

        return primaryContacts;
    };

    // Render different content based on type
    const renderDetailContent = (entry) => {
        switch (type) {
            case "Sites":
                const sitePrimaryContacts = getPrimaryContacts(
                    entry._id,
                    "site"
                );
                return (
                    <SiteItemContent
                        site={entry}
                        primaryContacts={sitePrimaryContacts}
                    />
                );
            case "Contacts":
                return <ContactItemContent contact={entry} />;
            case "Chains":
                const chainPrimaryContacts = getPrimaryContacts(
                    entry._id,
                    "chain"
                );
                return (
                    <ChainItemContent
                        chain={entry}
                        primaryContacts={chainPrimaryContacts}
                    />
                );
            case "Groups":
                const groupPrimaryContacts = getPrimaryContacts(
                    entry._id,
                    "group"
                );
                return (
                    <GroupItemContent
                        group={entry}
                        primaryContacts={groupPrimaryContacts}
                    />
                );
            case "Suppliers":
                return <SupplierItemContent supplier={entry} />;
            default:
                return <pre>{JSON.stringify(entry, null, 2)}</pre>;
        }
    };

    return (
        <>
            <Accordion multiple>
                {dataToRender.map((entry) => (
                    <AccordionTab
                        key={entry._id}
                        header={renderHeader(entry, type, searchTerm)}
                    >
                        {renderDetailContent(entry)}
                        <div style={{ marginTop: "0.5rem" }}>
                            <Button
                                label="View"
                                icon="pi pi-eye"
                                onClick={() => {
                                    if (type === "Suppliers") {
                                        window.location.href = `/database/clients/supplier/${entry._id}`;
                                    } else {
                                        window.location.href = `/database/clients/${type
                                            .toLowerCase()
                                            .slice(0, -1)}/${entry._id}`;
                                    }
                                }}
                            />
                        </div>
                    </AccordionTab>
                ))}
            </Accordion>
            {filteredData.length > displayCount && (
                <div style={{ textAlign: "center", marginTop: "1rem" }}>
                    <Button
                        label="Load More"
                        icon="pi pi-angle-down"
                        onClick={() => handleLoadMore(type)}
                    />
                </div>
            )}
        </>
    );
};

export default AccordionItems;

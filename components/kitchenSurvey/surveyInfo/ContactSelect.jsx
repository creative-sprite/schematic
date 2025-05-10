// components\kitchenSurvey\surveyInfo\ContactSelect.jsx

"use client";
import React, { useState, useEffect } from "react";
import { MultiSelect } from "primereact/multiselect";
import { Button } from "primereact/button";

export default function ContactSelect({
    onContactSelect,
    siteDetails,
    placeholder,
}) {
    const [selectedContacts, setSelectedContacts] = useState([]);
    const [availableContacts, setAvailableContacts] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [addedContactIds, setAddedContactIds] = useState(new Set());

    // Function to fetch contacts from API based on the filter
    const searchContacts = async (event) => {
        if (!siteDetails || !siteDetails._id) return;

        setIsLoading(true);
        try {
            // Get all contacts that match the search query
            const searchQuery = event.filter || "";
            const res = await fetch(
                `/api/database/clients/contacts?search=${encodeURIComponent(
                    searchQuery
                )}`
            );
            const data = await res.json();

            if (data.success) {
                let contacts = data.data || [];

                // Filter out any undefined or malformed contacts
                contacts = contacts.filter(
                    (contact) =>
                        contact &&
                        contact._id &&
                        (contact.contactFirstName || contact.contactLastName)
                );

                // Fetch the current site's contacts to compare
                const siteContactsRes = await fetch(
                    `/api/database/clients/contacts?site=${siteDetails._id}`
                );
                const siteContactsData = await siteContactsRes.json();

                if (siteContactsData.success && siteContactsData.data) {
                    // Get existing contact IDs from the site
                    const existingContactIds = new Set(
                        siteContactsData.data.map((contact) => contact._id)
                    );

                    // Update our tracking of site contacts
                    setAddedContactIds(
                        new Set([...existingContactIds, ...addedContactIds])
                    );

                    // Filter out contacts already associated with this site
                    contacts = contacts.filter(
                        (contact) =>
                            contact._id &&
                            !existingContactIds.has(contact._id) &&
                            !addedContactIds.has(contact._id)
                    );
                } else {
                    // If we couldn't fetch site contacts, still filter out ones we know we've added
                    contacts = contacts.filter(
                        (contact) =>
                            contact._id && !addedContactIds.has(contact._id)
                    );
                }

                // Ensure each contact has the required fields
                contacts = contacts.map((contact) => ({
                    _id: contact._id,
                    contactFirstName: contact.contactFirstName || "",
                    contactLastName: contact.contactLastName || "",
                    contactEmails: contact.contactEmails || [],
                    contactNumbersMobile: contact.contactNumbersMobile || [],
                    position: contact.position || "",
                    isPrimaryContact: contact.isPrimaryContact || false,
                    isWalkAroundContact: contact.isWalkAroundContact || false,
                }));

                setAvailableContacts(contacts);
            }
        } catch (error) {
            console.error("Error fetching contacts:", error);
            setAvailableContacts([]);
        } finally {
            setIsLoading(false);
        }
    };

    // Initial load of available contacts
    useEffect(() => {
        if (siteDetails && siteDetails._id) {
            searchContacts({ filter: "" });
        }
    }, [siteDetails]);

    const handleChange = (e) => {
        setSelectedContacts(e.value);
    };

    const handleAddSelectedContacts = async () => {
        if (
            !selectedContacts ||
            !selectedContacts.length ||
            !siteDetails ||
            !siteDetails._id
        )
            return;

        let successCount = 0;
        const newAddedContactIds = new Set(addedContactIds);

        for (const contact of selectedContacts) {
            try {
                if (!contact || !contact._id) continue;

                // Skip if already added (redundant check)
                if (newAddedContactIds.has(contact._id)) continue;

                // Format the contact to match the expected structure
                const formattedContact = {
                    _id: contact._id,
                    contactFirstName: contact.contactFirstName || "",
                    contactLastName: contact.contactLastName || "",
                    email:
                        contact.contactEmails &&
                        contact.contactEmails.length > 0
                            ? contact.contactEmails[0]
                            : "",
                    number:
                        contact.contactNumbersMobile &&
                        contact.contactNumbersMobile.length > 0
                            ? contact.contactNumbersMobile[0]
                            : "",
                    position: contact.position || "",
                    isPrimaryContact: contact.isPrimaryContact || false,
                    isWalkAroundContact: contact.isWalkAroundContact || false,
                };

                // Link the contact to this site by updating the contact's sites array
                const contactUpdateResponse = await fetch(
                    `/api/database/clients/contacts/${contact._id}`,
                    {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            sites: [siteDetails._id], // Add this site to contact's sites array
                        }),
                    }
                );

                if (!contactUpdateResponse.ok) {
                    console.error(
                        `Failed to update contact ${contact._id} with site reference`
                    );
                    continue;
                }

                // Update the site with this contact
                await onContactSelect(formattedContact);

                // Track that this contact has been added
                newAddedContactIds.add(contact._id);

                successCount++;
            } catch (error) {
                console.error(
                    `Error adding contact ${contact?._id || "unknown"}:`,
                    error
                );
            }
        }

        // Update our tracking of added contacts
        setAddedContactIds(newAddedContactIds);

        // Clear selection
        setSelectedContacts([]);

        // Update available contacts list to filter out newly added contacts
        const filteredContacts = availableContacts.filter(
            (contact) => !newAddedContactIds.has(contact._id)
        );
        setAvailableContacts(filteredContacts);

        return successCount;
    };

    const itemTemplate = (option) => {
        // Return empty div instead of "Invalid contact" text
        if (!option) return <div></div>;

        const firstName = option.contactFirstName || "";
        const lastName = option.contactLastName || "";

        return (
            <div className="p-multiselect-contact-option">
                <span
                    style={{ fontWeight: "bold" }}
                >{`${firstName} ${lastName}`}</span>
                {option.position && (
                    <span style={{ marginLeft: "8px" }}>
                        ({option.position})
                    </span>
                )}
                {option.contactEmails && option.contactEmails.length > 0 && (
                    <div style={{ fontSize: "0.9em", color: "#666" }}>
                        {option.contactEmails[0].email}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="contact-select">
            <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
                <MultiSelect
                    value={selectedContacts}
                    options={availableContacts}
                    onChange={handleChange}
                    optionLabel={(option) =>
                        option && option.contactFirstName
                            ? `${option.contactFirstName} ${
                                  option.contactLastName || ""
                              }`
                            : "Unnamed contact"
                    }
                    placeholder={placeholder || "Select Contact"}
                    filter
                    filterPlaceholder="Search contacts..."
                    itemTemplate={itemTemplate}
                    disabled={!siteDetails || !siteDetails._id}
                    style={{ flexGrow: 1 }}
                    loading={isLoading}
                    onFilter={searchContacts}
                    virtualScrollerOptions={{ itemSize: 60 }}
                    emptyFilterMessage="No matching contacts found"
                    emptyMessage="No contacts available"
                    dataKey="_id"
                />
                <Button
                    label="Add Selected"
                    onClick={handleAddSelectedContacts}
                    disabled={
                        !selectedContacts ||
                        !selectedContacts.length ||
                        !siteDetails ||
                        !siteDetails._id
                    }
                    style={{ alignSelf: "flex-start" }}
                />
            </div>
        </div>
    );
}

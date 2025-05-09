// components\kitchenSurvey\surveyInfo\ContactSelect.jsx

"use client";
import React, { useState, useEffect } from "react";
import { MultiSelect } from "primereact/multiselect";
import { Button } from "primereact/button";

export default function ContactSelect({ onContactSelect, siteDetails }) {
    const [selectedContacts, setSelectedContacts] = useState([]);
    const [availableContacts, setAvailableContacts] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

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
                    const existingContactIds = siteContactsData.data.map(
                        (contact) => contact._id
                    );
                    // Filter out contacts already associated with this site
                    contacts = contacts.filter(
                        (contact) =>
                            contact._id &&
                            !existingContactIds.includes(contact._id)
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

        for (const contact of selectedContacts) {
            try {
                if (!contact || !contact._id) continue;

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
                successCount++;
            } catch (error) {
                console.error(
                    `Error adding contact ${contact?._id || "unknown"}:`,
                    error
                );
            }
        }

        // Clear selection and refresh available contacts
        setSelectedContacts([]);
        searchContacts({ filter: "" });

        return successCount;
    };

    const itemTemplate = (option) => {
        // Check if option exists and has necessary properties
        if (!option) return <div>Invalid contact</div>;

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

    const selectedItemTemplate = (option) => {
        // Check if option exists and has necessary properties
        if (!option) return <div>Invalid contact</div>;

        const firstName = option.contactFirstName || "";
        const lastName = option.contactLastName || "";

        return (
            <div className="p-multiselect-contact-token">
                {`${firstName} ${lastName}`}
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
                    placeholder="Search for existing contacts..."
                    filter
                    filterPlaceholder="Search contacts..."
                    itemTemplate={itemTemplate}
                    selectedItemTemplate={selectedItemTemplate}
                    display="chip"
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

// components/kitchenSurvey/surveyInfo/PrimaryContactDetails.jsx
"use client";
import React, { useState, useEffect, useRef } from "react";
import { Dropdown } from "primereact/dropdown";
import { Toast } from "primereact/toast";
import { Message } from "primereact/message";
import { DataView } from "primereact/dataview";
import ContactSelect from "./ContactSelect";
import AddContactForm from "./primaryContactDetails/AddContactForm";
import PrimaryContactDropdown from "./primaryContactDetails/PrimaryContactDropdown";
import WalkAroundContactDropdown from "./primaryContactDetails/WalkAroundContactDropdown";
import ContactCard from "./primaryContactDetails/ContactCard";

export default function PrimaryContactDetails({
    contacts,
    contactDetails,
    setContactDetails,
    selectedPrimaryContactIndex,
    setSelectedPrimaryContactIndex,
    selectedWalkAroundContactIndex,
    setSelectedWalkAroundContactIndex,
    contactInput,
    setContactInput,
    addContact,
    removeContact,
    siteDetails,
    onContactsChange,
    onPrimaryContactChange,
    onWalkAroundContactChange,
    onContactSelect,
}) {
    const [isSaving, setIsSaving] = useState(false);
    const toast = useRef(null);

    // Notify parent when contacts change
    useEffect(() => {
        if (onContactsChange) onContactsChange(contacts);
    }, [contacts, onContactsChange]);

    const updateSiteWithContact = async (siteId, contactId) => {
        try {
            const siteResponse = await fetch(
                `/api/database/clients/sites/${siteId}`
            );
            const siteResult = await siteResponse.json();
            if (!siteResponse.ok)
                throw new Error(siteResult.error || "Failed to fetch site");
            const site = siteResult.data;
            let contactsArray = site.contacts || [];
            // Compare as strings to ensure consistency
            if (
                !contactsArray
                    .map((id) => id.toString())
                    .includes(contactId.toString())
            ) {
                contactsArray.push(contactId);
            }
            const updateResponse = await fetch(
                `/api/database/clients/sites/${siteId}`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ contacts: contactsArray }),
                }
            );
            if (!updateResponse.ok) {
                const updateResult = await updateResponse.json();
                throw new Error(updateResult.error || "Failed to update site");
            }
        } catch (error) {
            console.error("Error updating site with contact:", error);
            toast.current.show({
                severity: "error",
                summary: "Warning",
                detail: "Contact was saved but could not be linked to the site",
            });
        }
    };

    const handleAddContact = async (e) => {
        e.preventDefault();
        if (!siteDetails || !siteDetails._id) {
            toast.current.show({
                severity: "error",
                summary: "Site Required",
                detail: "Please select or create a site before adding contacts",
            });
            return;
        }
        let newContact = { ...contactInput };
        delete newContact.title;
        delete newContact.name;
        const contactToSave = {
            contactFirstName: newContact.contactFirstName,
            contactLastName: newContact.contactLastName,
            contactEmails: newContact.email
                ? [
                      {
                          email: newContact.email,
                          location: "Office",
                          isPrimary: true,
                      },
                  ]
                : [],
            contactPhoneNumbers: newContact.number
                ? [
                      {
                          number: newContact.number,
                          type: "Mobile",
                          location: "Office",
                          isPrimary: true,
                      },
                  ]
                : [],
            position: newContact.position || "",
            sites: [siteDetails._id],
            site: siteDetails._id,
        };
        try {
            setIsSaving(true);
            if (!newContact._id) {
                const response = await fetch(
                    "/api/database/clients/contacts/surveyContact",
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(contactToSave),
                    }
                );
                const result = await response.json();
                if (!response.ok)
                    throw new Error(result.error || "Failed to save contact");
                const savedContact = result.data;
                await updateSiteWithContact(siteDetails._id, savedContact._id);
                newContact = {
                    ...newContact,
                    _id: savedContact._id,
                    site: siteDetails._id,
                };
            }
            // Add contact using the provided addContact function
            if (typeof addContact === "function") {
                addContact(newContact);
            }
            setContactInput({
                contactFirstName: "",
                contactLastName: "",
                email: "",
                number: "",
                position: "",
            });
        } catch (error) {
            console.error("Error adding contact:", error);
            toast.current.show({
                severity: "error",
                summary: "Error",
                detail: error.message,
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handlePrimaryContactSelect = async (index) => {
        if (!siteDetails || !siteDetails._id) {
            toast.current.show({
                severity: "error",
                summary: "Site Required",
                detail: "Please select an existing site before setting a primary contact",
            });
            return;
        }
        const isDeselecting = index === selectedPrimaryContactIndex;
        const contactId = contacts[index]?._id;
        if (!contactId) {
            toast.current.show({
                severity: "error",
                summary: "Error",
                detail: "Contact does not have a valid ID",
            });
            return;
        }
        try {
            setIsSaving(true);
            const response = await fetch(
                "/api/database/clients/relationships",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        entityType: "contact",
                        entityId: contactId,
                        targetType: "site",
                        targetId: siteDetails._id,
                        action: isDeselecting ? "unset" : "set",
                    }),
                }
            );
            const result = await response.json();
            if (!result.success)
                throw new Error(
                    result.message || "Failed to update primary contact"
                );
            if (isDeselecting) {
                setSelectedPrimaryContactIndex(null);
                setContactDetails({});
                if (onPrimaryContactChange) onPrimaryContactChange(null);
            } else {
                setSelectedPrimaryContactIndex(index);
                if (contacts[index]) setContactDetails(contacts[index]);
                if (onPrimaryContactChange) onPrimaryContactChange(index);
            }
            toast.current.show({
                severity: "success",
                summary: "Success",
                detail: isDeselecting
                    ? "Primary contact removed"
                    : "Primary contact set successfully",
            });
        } catch (error) {
            console.error("Error setting primary contact:", error);
            toast.current.show({
                severity: "error",
                summary: "Error",
                detail: error.message || "Failed to update primary contact",
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleWalkAroundContactSelect = async (index) => {
        if (!siteDetails || !siteDetails._id) {
            toast.current.show({
                severity: "error",
                summary: "Site Required",
                detail: "Please select an existing site before setting a walk around contact",
            });
            return;
        }
        const isDeselecting = index === selectedWalkAroundContactIndex;
        const contactId = contacts[index]?._id;
        if (!contactId) {
            toast.current.show({
                severity: "error",
                summary: "Error",
                detail: "Contact does not have a valid ID",
            });
            return;
        }
        try {
            setIsSaving(true);
            const response = await fetch(
                `/api/database/clients/sites/${siteDetails._id}`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        walkAroundContact: isDeselecting ? null : contactId,
                    }),
                }
            );
            const result = await response.json();
            if (!result.success)
                throw new Error(
                    result.message || "Failed to update walk around contact"
                );
            if (isDeselecting) {
                setSelectedWalkAroundContactIndex(null);
                if (onWalkAroundContactChange) onWalkAroundContactChange(null);
            } else {
                setSelectedWalkAroundContactIndex(index);
                if (onWalkAroundContactChange) onWalkAroundContactChange(index);
            }
            toast.current.show({
                severity: "success",
                summary: "Success",
                detail: isDeselecting
                    ? "Walk around contact removed"
                    : "Walk around contact set successfully",
            });
        } catch (error) {
            console.error("Error setting walk around contact:", error);
            toast.current.show({
                severity: "error",
                summary: "Error",
                detail: error.message || "Failed to update walk around contact",
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleRemoveContact = async (index) => {
        try {
            setIsSaving(true);

            // Get the contact to be removed
            const contactToRemove = contacts[index];

            // If contact has an ID and site has an ID, remove ONLY the relationship between them
            if (
                contactToRemove &&
                contactToRemove._id &&
                siteDetails &&
                siteDetails._id
            ) {
                try {
                    // Fetch the current site data
                    const siteResponse = await fetch(
                        `/api/database/clients/sites/${siteDetails._id}`
                    );
                    const siteResult = await siteResponse.json();

                    if (siteResponse.ok && siteResult.data) {
                        const site = siteResult.data;
                        let contactsArray = site.contacts || [];

                        // Filter out the contact ID from the site's contacts array
                        contactsArray = contactsArray.filter(
                            (id) =>
                                id.toString() !== contactToRemove._id.toString()
                        );

                        // Update the site with the new contacts array
                        const updateResponse = await fetch(
                            `/api/database/clients/sites/${siteDetails._id}`,
                            {
                                method: "PUT",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    contacts: contactsArray,
                                }),
                            }
                        );

                        if (!updateResponse.ok) {
                            const updateResult = await updateResponse.json();
                            throw new Error(
                                updateResult.error || "Failed to update site"
                            );
                        }
                    }
                } catch (error) {
                    console.error(
                        "Error removing contact relationship:",
                        error
                    );
                    toast.current.show({
                        severity: "error",
                        summary: "Error",
                        detail: "Error removing contact relationship with site",
                    });
                    return; // Exit early on error
                }
            }

            // Handle primary contact cleanup locally
            if (index === selectedPrimaryContactIndex) {
                setSelectedPrimaryContactIndex(null);
                setContactDetails({});
                if (onPrimaryContactChange) onPrimaryContactChange(null);
            }

            // Handle walk around contact cleanup locally
            if (index === selectedWalkAroundContactIndex) {
                setSelectedWalkAroundContactIndex(null);
                if (onWalkAroundContactChange) onWalkAroundContactChange(null);
            }

            // Use the provided removeContact function to update the parent state
            if (typeof removeContact === "function") {
                removeContact(index);
                toast.current.show({
                    severity: "success",
                    summary: "Success",
                    detail: "Contact removed from survey",
                });
            }
        } catch (error) {
            console.error("Error removing contact:", error);
            toast.current.show({
                severity: "error",
                summary: "Error",
                detail: error.message || "Failed to remove contact",
            });
        } finally {
            setIsSaving(false);
        }
    };

    const contactsWithIndex = contacts.map((contact, index) => ({
        ...contact,
        index,
    }));

    const renderContactCard = (contact) => {
        const isPrimarySelected = contact.index === selectedPrimaryContactIndex;
        const isWalkAroundSelected =
            contact.index === selectedWalkAroundContactIndex;
        return (
            <ContactCard
                contact={contact}
                isPrimarySelected={isPrimarySelected}
                isWalkAroundSelected={isWalkAroundSelected}
                onRemove={() => handleRemoveContact(contact.index)}
                isSaving={isSaving}
            />
        );
    };

    return (
        <div
            style={{
                marginBottom: "3rem",
                border: "3px solid #ddd",
                padding: "1rem",
            }}
        >
            <Toast ref={toast} />
            {(!siteDetails || !siteDetails._id) && (
                <Message
                    severity="warn"
                    text="Please select an existing site or create a new one before adding contacts"
                    style={{ marginBottom: "1rem", width: "100%" }}
                />
            )}
            <h3 style={{ marginTop: "0.1rem" }}>Add Contact</h3>
            <div style={{ marginBottom: "1rem" }}>
                <h4>Select from existing contacts</h4>
                <ContactSelect
                    onContactSelect={async (selectedContact) => {
                        try {
                            if (
                                selectedContact &&
                                selectedContact._id &&
                                siteDetails &&
                                siteDetails._id
                            ) {
                                await updateSiteWithContact(
                                    siteDetails._id,
                                    selectedContact._id
                                );
                                const formattedContact = {
                                    ...selectedContact,
                                    email:
                                        selectedContact.contactEmails &&
                                        selectedContact.contactEmails.length > 0
                                            ? selectedContact.contactEmails[0]
                                                  .email
                                            : "",
                                    number:
                                        selectedContact.contactNumbersMobile &&
                                        selectedContact.contactNumbersMobile
                                            .length > 0
                                            ? selectedContact
                                                  .contactNumbersMobile[0]
                                            : "",
                                    position: selectedContact.position || "",
                                };

                                // Use addContact if available
                                if (typeof addContact === "function") {
                                    addContact(formattedContact);
                                }

                                // Call onContactSelect if provided
                                if (onContactSelect) {
                                    await onContactSelect(formattedContact);
                                }
                            }
                        } catch (error) {
                            console.error(
                                "Error adding existing contact:",
                                error
                            );
                            toast.current.show({
                                severity: "error",
                                summary: "Error",
                                detail:
                                    error.message ||
                                    "Failed to add existing contact",
                            });
                        }
                    }}
                    siteDetails={siteDetails}
                />
            </div>
            <h4>Create new contact</h4>
            <AddContactForm
                contactInput={contactInput}
                setContactInput={setContactInput}
                handleAddContact={handleAddContact}
                isSaving={isSaving}
                siteDetails={siteDetails}
            />
            <h3 style={{ marginTop: "1.5rem" }}>Select Primary Contact</h3>
            <PrimaryContactDropdown
                contacts={contacts}
                selectedPrimaryContactIndex={selectedPrimaryContactIndex}
                handlePrimaryContactSelect={handlePrimaryContactSelect}
                isSaving={isSaving}
                siteDetails={siteDetails}
            />
            <h3 style={{ marginTop: "1.5rem" }}>Select Walk Around Contact</h3>
            <WalkAroundContactDropdown
                contacts={contacts}
                selectedWalkAroundContactIndex={selectedWalkAroundContactIndex}
                handleWalkAroundContactSelect={handleWalkAroundContactSelect}
                isSaving={isSaving}
                siteDetails={siteDetails}
            />
            <DataView
                value={contactsWithIndex}
                itemTemplate={renderContactCard}
                layout="grid"
                style={{ marginTop: "1.5rem" }}
            />
        </div>
    );
}

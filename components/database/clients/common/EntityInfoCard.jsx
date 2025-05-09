// components\database\clients\common\EntityInfoCard.jsx
import React, { useState, useEffect } from "react";
import { Card } from "primereact/card";
import { Badge } from "primereact/badge";
import { Button } from "primereact/button";
import Link from "next/link";

/**
 * Renders the general information card for an entity
 * Adapts to different entity types with appropriate fields
 * Also displays primary entities in cards to the right
 * Updated to handle primary relationships for all entity types
 */
const EntityInfoCard = ({ entity, entityType, contacts = [] }) => {
    // Primary relationship states
    const [primaryContact, setPrimaryContact] = useState(null);
    const [walkAroundContact, setWalkAroundContact] = useState(null);
    const [primaryGroup, setPrimaryGroup] = useState(null);
    const [primaryChain, setPrimaryChain] = useState(null);

    // Fetch primary relationship data when the component mounts or entity changes
    useEffect(() => {
        if (entity) {
            fetchPrimaryRelationships();
        }
    }, [entity, entityType]);

    // Function to fetch primary relationships for an entity
    const fetchPrimaryRelationships = async () => {
        if (!entity || !entityType) return;

        try {
            switch (entityType) {
                case "site":
                    await fetchSitePrimaryRelationships();
                    break;
                case "group":
                    await fetchGroupPrimaryRelationships();
                    break;
                case "chain":
                    await fetchChainPrimaryRelationships();
                    break;
                case "supplier":
                    await fetchSupplierPrimaryRelationships();
                    break;
                default:
                    // For contact entities or others, no primary relationships to fetch
                    break;
            }
        } catch (error) {
            console.error("Error fetching primary relationships:", error);
        }
    };

    // Fetch primary relationships for a site
    const fetchSitePrimaryRelationships = async () => {
        // For sites, need to fetch primary group, chain, and contacts
        if (entity.primaryContact) {
            // First check if contact is already in our contacts array
            const contactInArray = contacts.find(
                (c) => c._id === entity.primaryContact
            );

            if (contactInArray) {
                setPrimaryContact(contactInArray);
            } else {
                // Fetch the contact from the API
                const contactRes = await fetch(
                    `/api/database/clients/contacts/${entity.primaryContact}`
                );
                const contactData = await contactRes.json();

                if (contactData.success) {
                    setPrimaryContact(contactData.data);
                }
            }
        }

        // Get walk around contact
        if (entity.walkAroundContact) {
            // First check if the contact is already in our contacts array
            const contactInArray = contacts.find(
                (c) => c._id === entity.walkAroundContact
            );

            if (contactInArray) {
                setWalkAroundContact(contactInArray);
            } else {
                // Fetch the contact from the API
                const contactRes = await fetch(
                    `/api/database/clients/contacts/${entity.walkAroundContact}`
                );
                const contactData = await contactRes.json();

                if (contactData.success) {
                    setWalkAroundContact(contactData.data);
                }
            }
        }

        // Get primary group
        if (entity.primaryGroup) {
            const groupRes = await fetch(
                `/api/database/clients/groups/${entity.primaryGroup}`
            );
            const groupData = await groupRes.json();

            if (groupData.success) {
                setPrimaryGroup(groupData.data);
            }
        }

        // Get primary chain
        if (entity.primaryChain) {
            const chainRes = await fetch(
                `/api/database/clients/chains/${entity.primaryChain}`
            );
            const chainData = await chainRes.json();

            if (chainData.success) {
                setPrimaryChain(chainData.data);
            }
        }
    };

    // Fetch primary relationships for a group
    const fetchGroupPrimaryRelationships = async () => {
        // For groups, need to fetch primary contact
        if (entity.primaryContact) {
            // Check if the contact is already in our contacts array
            const contactInArray = contacts.find(
                (c) => c._id === entity.primaryContact
            );

            if (contactInArray) {
                setPrimaryContact(contactInArray);
            } else {
                // Fetch the contact from the API
                const contactRes = await fetch(
                    `/api/database/clients/contacts/${entity.primaryContact}`
                );
                const contactData = await contactRes.json();

                if (contactData.success) {
                    setPrimaryContact(contactData.data);
                }
            }
        }
    };

    // Fetch primary relationships for a chain
    const fetchChainPrimaryRelationships = async () => {
        // For chains, need to fetch primary contact and primary group
        if (entity.primaryContact) {
            // Check if the contact is already in our contacts array
            const contactInArray = contacts.find(
                (c) => c._id === entity.primaryContact
            );

            if (contactInArray) {
                setPrimaryContact(contactInArray);
            } else {
                // Fetch the contact from the API
                const contactRes = await fetch(
                    `/api/database/clients/contacts/${entity.primaryContact}`
                );
                const contactData = await contactRes.json();

                if (contactData.success) {
                    setPrimaryContact(contactData.data);
                }
            }
        }

        // Get primary group
        if (entity.primaryGroup) {
            const groupRes = await fetch(
                `/api/database/clients/groups/${entity.primaryGroup}`
            );
            const groupData = await groupRes.json();

            if (groupData.success) {
                setPrimaryGroup(groupData.data);
            }
        }
    };

    // Fetch primary relationships for a supplier
    const fetchSupplierPrimaryRelationships = async () => {
        // For suppliers, need to fetch primary contact
        if (entity.primaryContact) {
            // Check if the contact is already in our contacts array
            const contactInArray = contacts.find(
                (c) => c._id === entity.primaryContact
            );

            if (contactInArray) {
                setPrimaryContact(contactInArray);
            } else {
                // Fetch the contact from the API
                const contactRes = await fetch(
                    `/api/database/clients/contacts/${entity.primaryContact}`
                );
                const contactData = await contactRes.json();

                if (contactData.success) {
                    setPrimaryContact(contactData.data);
                }
            }
        }
    };

    // Helper function to render a section for emails
    const renderEmailsSection = (emails, emailPrefix) => {
        if (!emails || emails.length === 0) return null;

        // Find primary email
        const primaryEmail = emails.find((email) => email.isPrimary);
        const otherEmails = emails.filter((email) => !email.isPrimary);

        return (
            <>
                {/* Display primary email with badge */}
                {primaryEmail && (
                    <div style={{ marginBottom: "0.5rem" }}>
                        <div style={{ display: "flex", alignItems: "center" }}>
                            <strong>Primary Email:</strong>
                            <Badge
                                value="Primary"
                                severity="success"
                                style={{ marginLeft: "0.5rem" }}
                            />
                        </div>
                        <div>{primaryEmail.email}</div>
                        {primaryEmail.location && (
                            <div>
                                <em>Location: {primaryEmail.location}</em>
                            </div>
                        )}
                    </div>
                )}

                {/* Display other emails if any */}
                {otherEmails.length > 0 && (
                    <div style={{ marginBottom: "1rem" }}>
                        <strong>Other Emails:</strong>
                        {otherEmails.map((email, idx) => (
                            <div key={idx} style={{ marginLeft: "1rem" }}>
                                <div>{email.email}</div>
                                {email.location && (
                                    <div>
                                        <em>Location: {email.location}</em>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </>
        );
    };

    // Helper function to render a section for phone numbers
    const renderPhoneNumbersSection = (phoneNumbers, phonePrefix) => {
        if (!phoneNumbers || phoneNumbers.length === 0) return null;

        // Find primary phone
        const primaryPhone = phoneNumbers.find((phone) => phone.isPrimary);
        const otherPhones = phoneNumbers.filter((phone) => !phone.isPrimary);

        return (
            <>
                {/* Display primary phone with badge */}
                {primaryPhone && (
                    <div style={{ marginBottom: "0.5rem" }}>
                        <div style={{ display: "flex", alignItems: "center" }}>
                            <strong>Primary Phone:</strong>
                            <Badge
                                value="Primary"
                                severity="success"
                                style={{ marginLeft: "0.5rem" }}
                            />
                        </div>
                        <div>{primaryPhone.phoneNumber}</div>
                        {primaryPhone.extension && (
                            <div>
                                <em>Ext: {primaryPhone.extension}</em>
                            </div>
                        )}
                        {primaryPhone.location && (
                            <div>
                                <em>Location: {primaryPhone.location}</em>
                            </div>
                        )}
                    </div>
                )}

                {/* Display other phone numbers if any */}
                {otherPhones.length > 0 && (
                    <div style={{ marginBottom: "1rem" }}>
                        <strong>Other Phone Numbers:</strong>
                        {otherPhones.map((phone, idx) => (
                            <div key={idx} style={{ marginLeft: "1rem" }}>
                                <div>{phone.phoneNumber}</div>
                                {phone.extension && (
                                    <div>
                                        <em>Ext: {phone.extension}</em>
                                    </div>
                                )}
                                {phone.location && (
                                    <div>
                                        <em>Location: {phone.location}</em>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </>
        );
    };
    // Render different content based on entity type
    const renderContent = () => {
        switch (entityType) {
            case "site":
                return (
                    <>
                        <p>
                            <strong>Site Name:</strong> {entity.siteName}
                        </p>

                        {/* Display primary relationships */}
                        {primaryGroup && (
                            <p>
                                <strong>Primary Group:</strong>{" "}
                                <Link
                                    href={`/database/clients/group/${primaryGroup._id}`}
                                >
                                    {primaryGroup.groupName}
                                </Link>
                            </p>
                        )}

                        {primaryChain && (
                            <p>
                                <strong>Primary Chain:</strong>{" "}
                                <Link
                                    href={`/database/clients/chain/${primaryChain._id}`}
                                >
                                    {primaryChain.chainName}
                                </Link>
                            </p>
                        )}

                        {/* Display emails using the helper function */}
                        {renderEmailsSection(entity.siteEmails, "site")}

                        <p>
                            <strong>Website:</strong>{" "}
                            {entity.siteWebsite || "N/A"}
                        </p>

                        {/* Display phone numbers using the helper function */}
                        {renderPhoneNumbersSection(
                            entity.sitePhoneNumbers,
                            "site"
                        )}

                        {entity.siteImage && (
                            <div style={{ marginTop: "1rem" }}>
                                <strong>Site Image:</strong>
                                <img
                                    src={entity.siteImage}
                                    alt={entity.siteName}
                                    style={{
                                        maxWidth: "100%",
                                        maxHeight: "200px",
                                        marginTop: "0.5rem",
                                    }}
                                />
                            </div>
                        )}

                        {entity.addresses && entity.addresses.length > 0 && (
                            <div>
                                <h3>Addresses</h3>
                                {entity.addresses.map((addr, index) => (
                                    <div
                                        key={index}
                                        style={{ marginBottom: "1rem" }}
                                    >
                                        <p>
                                            <strong>
                                                Address Name/Number:
                                            </strong>{" "}
                                            {addr.addressNameNumber}
                                        </p>
                                        <p>
                                            <strong>Address Line 1:</strong>{" "}
                                            {addr.addressLine1}
                                        </p>
                                        <p>
                                            <strong>Address Line 2:</strong>{" "}
                                            {addr.addressLine2}
                                        </p>
                                        <p>
                                            <strong>Town:</strong> {addr.town}
                                        </p>
                                        <p>
                                            <strong>County:</strong>{" "}
                                            {addr.county}
                                        </p>
                                        <p>
                                            <strong>Country:</strong>{" "}
                                            {addr.country}
                                        </p>
                                        <p>
                                            <strong>Post Code:</strong>{" "}
                                            {addr.postCode}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}

                        <p>
                            <strong>Site Type:</strong>{" "}
                            {entity.siteType || "N/A"}
                        </p>
                        <p>
                            <strong>Client Type:</strong>{" "}
                            {entity.clientType || "N/A"}
                        </p>
                    </>
                );

            case "group":
                return (
                    <>
                        <p>
                            <strong>Group Name:</strong> {entity.groupName}
                        </p>

                        {/* Display emails using the helper function */}
                        {renderEmailsSection(entity.groupEmails, "group")}

                        <p>
                            <strong>Website:</strong>{" "}
                            {entity.groupWebsite || "N/A"}
                        </p>

                        {/* Display phone numbers using the helper function */}
                        {renderPhoneNumbersSection(
                            entity.groupPhoneNumbers,
                            "group"
                        )}

                        {entity.groupImage && (
                            <div style={{ marginTop: "1rem" }}>
                                <strong>Group Image:</strong>
                                <img
                                    src={entity.groupImage}
                                    alt={entity.groupName}
                                    style={{
                                        maxWidth: "100%",
                                        maxHeight: "200px",
                                        marginTop: "0.5rem",
                                    }}
                                />
                            </div>
                        )}

                        <div style={{ marginTop: "1rem" }}>
                            <h3>Address</h3>
                            <p>
                                <strong>Address Name/Number:</strong>{" "}
                                {entity.groupAddressNameNumber}
                            </p>
                            <p>
                                <strong>Address Line 1:</strong>{" "}
                                {entity.groupAddressLine1}
                            </p>
                            <p>
                                <strong>Address Line 2:</strong>{" "}
                                {entity.groupAddressLine2}
                            </p>
                            <p>
                                <strong>Town:</strong> {entity.groupTown}
                            </p>
                            <p>
                                <strong>County:</strong> {entity.groupCounty}
                            </p>
                            <p>
                                <strong>Country:</strong> {entity.groupCountry}
                            </p>
                            <p>
                                <strong>Post Code:</strong>{" "}
                                {entity.groupPostCode}
                            </p>
                        </div>
                    </>
                );

            case "chain":
                return (
                    <>
                        <p>
                            <strong>Chain Name:</strong> {entity.chainName}
                        </p>

                        {/* Display primary group if available */}
                        {primaryGroup && (
                            <p>
                                <strong>Primary Group:</strong>{" "}
                                <Link
                                    href={`/database/clients/group/${primaryGroup._id}`}
                                >
                                    {primaryGroup.groupName}
                                </Link>
                            </p>
                        )}

                        {/* Display emails using the helper function */}
                        {renderEmailsSection(entity.chainEmails, "chain")}

                        <p>
                            <strong>Website:</strong>{" "}
                            {entity.chainWebsite || "N/A"}
                        </p>

                        {/* Display phone numbers using the helper function */}
                        {renderPhoneNumbersSection(
                            entity.chainPhoneNumbers,
                            "chain"
                        )}

                        {entity.chainImage && (
                            <div style={{ marginTop: "1rem" }}>
                                <strong>Chain Image:</strong>
                                <img
                                    src={entity.chainImage}
                                    alt={entity.chainName}
                                    style={{
                                        maxWidth: "100%",
                                        maxHeight: "200px",
                                        marginTop: "0.5rem",
                                    }}
                                />
                            </div>
                        )}

                        <div style={{ marginTop: "1rem" }}>
                            <h3>Address</h3>
                            <p>
                                <strong>Address Name/Number:</strong>{" "}
                                {entity.chainAddressNameNumber}
                            </p>
                            <p>
                                <strong>Address Line 1:</strong>{" "}
                                {entity.chainAddressLine1}
                            </p>
                            <p>
                                <strong>Address Line 2:</strong>{" "}
                                {entity.chainAddressLine2}
                            </p>
                            <p>
                                <strong>Town:</strong> {entity.chainTown}
                            </p>
                            <p>
                                <strong>County:</strong> {entity.chainCounty}
                            </p>
                            <p>
                                <strong>Country:</strong> {entity.chainCountry}
                            </p>
                            <p>
                                <strong>Post Code:</strong>{" "}
                                {entity.chainPostCode}
                            </p>
                        </div>
                    </>
                );

            case "contact":
                return (
                    <div
                        style={{
                            display: "flex",
                            gap: "2rem",
                            flexWrap: "wrap",
                        }}
                    >
                        <div style={{ flex: 1 }}>
                            <p>
                                <strong>Name:</strong> {entity.contactFirstName}{" "}
                                {entity.contactLastName}
                            </p>
                            <p>
                                <strong>Position:</strong>{" "}
                                {entity.position || "N/A"}
                            </p>

                            {/* Display relationship statuses */}
                            {entity.isPrimaryForSite && (
                                <p>
                                    <strong>Primary Contact Status:</strong>{" "}
                                    <Badge
                                        value="Primary Contact for Site"
                                        severity="success"
                                    />
                                </p>
                            )}

                            {entity.isPrimaryForGroup && (
                                <p>
                                    <strong>Primary Contact Status:</strong>{" "}
                                    <Badge
                                        value="Primary Contact for Group"
                                        severity="success"
                                    />
                                </p>
                            )}

                            {entity.isPrimaryForChain && (
                                <p>
                                    <strong>Primary Contact Status:</strong>{" "}
                                    <Badge
                                        value="Primary Contact for Chain"
                                        severity="success"
                                    />
                                </p>
                            )}

                            {entity.isPrimaryForSupplier && (
                                <p>
                                    <strong>Primary Contact Status:</strong>{" "}
                                    <Badge
                                        value="Primary Contact for Supplier"
                                        severity="success"
                                    />
                                </p>
                            )}

                            {entity.isWalkAroundForSite && (
                                <p>
                                    <strong>Walk Around Status:</strong>{" "}
                                    <Badge
                                        value="Walk Around Contact for Site"
                                        severity="info"
                                    />
                                </p>
                            )}

                            {/* Legacy fields - will eventually be deprecated */}
                            {entity.isPrimaryContact && (
                                <p>
                                    <strong>Legacy Primary Contact:</strong>{" "}
                                    <Badge value="Yes" severity="warning" />
                                </p>
                            )}

                            {entity.isWalkAroundContact && (
                                <p>
                                    <strong>Legacy Walk Around Contact:</strong>{" "}
                                    <Badge value="Yes" severity="warning" />
                                </p>
                            )}
                        </div>
                        <div style={{ flex: 1 }}>
                            {/* Display emails using the helper function */}
                            {renderEmailsSection(
                                entity.contactEmails,
                                "contact"
                            )}

                            {/* Display phone numbers using the helper function */}
                            {renderPhoneNumbersSection(
                                entity.contactPhoneNumbers,
                                "contact"
                            )}
                        </div>
                        {entity.contactImage && (
                            <div style={{ marginTop: "1rem" }}>
                                <img
                                    src={entity.contactImage}
                                    alt={`${entity.contactFirstName} ${entity.contactLastName}`}
                                    style={{
                                        maxWidth: "200px",
                                        maxHeight: "200px",
                                    }}
                                />
                            </div>
                        )}
                    </div>
                );

            case "supplier":
                return (
                    <>
                        <p>
                            <strong>Supplier Name:</strong>{" "}
                            {entity.supplierName || "N/A"}
                        </p>

                        {/* Display emails using the helper function */}
                        {renderEmailsSection(entity.supplierEmails, "supplier")}

                        <p>
                            <strong>Website:</strong>{" "}
                            {entity.supplierWebsite || "N/A"}
                        </p>

                        {/* Display phone numbers using the helper function */}
                        {renderPhoneNumbersSection(
                            entity.supplierPhoneNumbers,
                            "supplier"
                        )}

                        <div style={{ marginTop: "1rem" }}>
                            <h3>Address</h3>
                            <p>
                                <strong>Address Name/Number:</strong>{" "}
                                {entity.addressNameNumber || "N/A"}
                            </p>
                            <p>
                                <strong>Address Line 1:</strong>{" "}
                                {entity.addressLine1 || "N/A"}
                            </p>
                            <p>
                                <strong>Address Line 2:</strong>{" "}
                                {entity.addressLine2 || "N/A"}
                            </p>
                            <p>
                                <strong>Town:</strong> {entity.town || "N/A"}
                            </p>
                            <p>
                                <strong>County:</strong>{" "}
                                {entity.county || "N/A"}
                            </p>
                            <p>
                                <strong>Country:</strong>{" "}
                                {entity.country || "N/A"}
                            </p>
                            <p>
                                <strong>Post Code:</strong>{" "}
                                {entity.postCode || "N/A"}
                            </p>
                        </div>
                        {entity.supplierLogo && (
                            <div style={{ marginTop: "1rem" }}>
                                <h3>Logo</h3>
                                <img
                                    src={entity.supplierLogo}
                                    alt={`${entity.supplierName} Logo`}
                                    style={{
                                        maxWidth: "200px",
                                        maxHeight: "200px",
                                    }}
                                />
                            </div>
                        )}
                    </>
                );

            default:
                return <p>No information available for this entity type.</p>;
        }
    };

    // Render primary contact card content
    const renderContactCard = (contact) => {
        if (!contact) {
            return (
                <div style={{ padding: "1rem", textAlign: "center" }}>
                    <p>No primary contact assigned</p>
                </div>
            );
        }

        return (
            <div
                style={{
                    display: "flex",
                    height: "100%",
                    alignItems: "center",
                }}
            >
                {/* Left side - 75% width for content */}
                <div
                    style={{
                        width: "75%",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center" }}>
                        <h3 style={{ margin: "0.5rem 0" }}>
                            {contact.contactFirstName} {contact.contactLastName}
                        </h3>
                        <Badge
                            value="Primary"
                            severity="success"
                            style={{ marginLeft: "0.5rem" }}
                        />
                    </div>

                    {contact.position && (
                        <p style={{ margin: "0.5rem 0" }}>
                            <strong>Position:</strong> {contact.position}
                        </p>
                    )}

                    {/* Display contact emails */}
                    {renderEmailsSection(contact.contactEmails, "contact")}

                    {/* Display contact phone numbers */}
                    {renderPhoneNumbersSection(
                        contact.contactPhoneNumbers,
                        "contact"
                    )}
                </div>

                {/* Right side - 25% width for button */}
                <div
                    style={{
                        width: "25%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <Link href={`/database/clients/contact/${contact._id}`}>
                        <Button
                            icon="pi pi-eye"
                            size="small"
                            tooltip="View Contact"
                            tooltipOptions={{ position: "top" }}
                        />
                    </Link>
                </div>
            </div>
        );
    };

    // Render walk around contact card content
    const renderWalkAroundContactCard = (contact) => {
        if (!contact) {
            return (
                <div style={{ padding: "1rem", textAlign: "center" }}>
                    <p>No walk around contact assigned</p>
                </div>
            );
        }

        return (
            <div
                style={{
                    display: "flex",
                    height: "100%",
                    alignItems: "center",
                }}
            >
                {/* Left side - 75% width for content */}
                <div
                    style={{
                        width: "75%",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center" }}>
                        <h3 style={{ margin: "0.5rem 0" }}>
                            {contact.contactFirstName} {contact.contactLastName}
                        </h3>
                        <Badge
                            value="Walk Around"
                            severity="info"
                            style={{ marginLeft: "0.5rem" }}
                        />
                    </div>

                    {contact.position && (
                        <p style={{ margin: "0.5rem 0" }}>
                            <strong>Position:</strong> {contact.position}
                        </p>
                    )}

                    {/* Display contact emails */}
                    {renderEmailsSection(contact.contactEmails, "contact")}

                    {/* Display contact phone numbers */}
                    {renderPhoneNumbersSection(
                        contact.contactPhoneNumbers,
                        "contact"
                    )}
                </div>

                {/* Right side - 25% width for button */}
                <div
                    style={{
                        width: "25%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <Link href={`/database/clients/contact/${contact._id}`}>
                        <Button
                            icon="pi pi-eye"
                            size="small"
                            tooltip="View Contact"
                            tooltipOptions={{ position: "top" }}
                        />
                    </Link>
                </div>
            </div>
        );
    };

    // Render group card content
    const renderGroupCard = (group) => {
        if (!group) {
            return (
                <div style={{ padding: "1rem", textAlign: "center" }}>
                    <p>No group assigned</p>
                </div>
            );
        }

        return (
            <div
                style={{
                    display: "flex",
                    height: "100%",
                    alignItems: "center",
                }}
            >
                {/* Left side - 75% width for content */}
                <div
                    style={{
                        width: "75%",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center" }}>
                        <h3 style={{ margin: "0.5rem 0" }}>
                            {group.groupName}
                        </h3>
                        <Badge
                            value="Primary"
                            severity="success"
                            style={{ marginLeft: "0.5rem" }}
                        />
                    </div>

                    {/* Display address details */}
                    <p style={{ margin: "0.5rem 0" }}>
                        <strong>Address:</strong> {group.groupAddressLine1}
                        {group.groupAddressLine2 &&
                            `, ${group.groupAddressLine2}`}
                        {group.groupTown && `, ${group.groupTown}`}
                        {group.groupCounty && `, ${group.groupCounty}`}
                        {group.groupPostCode && ` ${group.groupPostCode}`}
                    </p>

                    {/* Display group emails */}
                    {group.groupEmails && group.groupEmails.length > 0 && (
                        <p style={{ margin: "0.5rem 0" }}>
                            <strong>Email:</strong> {group.groupEmails[0]}
                        </p>
                    )}

                    {/* Display group phone numbers */}
                    {group.groupPhoneNumbers &&
                        group.groupPhoneNumbers.length > 0 && (
                            <p style={{ margin: "0.5rem 0" }}>
                                <strong>Phone:</strong>{" "}
                                {group.groupPhoneNumbers[0].phoneNumber}
                            </p>
                        )}
                </div>

                {/* Right side - 25% width for button */}
                <div
                    style={{
                        width: "25%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <Link href={`/database/clients/group/${group._id}`}>
                        <Button
                            icon="pi pi-eye"
                            size="small"
                            tooltip="View Group"
                            tooltipOptions={{ position: "top" }}
                        />
                    </Link>
                </div>
            </div>
        );
    };

    // Render chain card content
    const renderChainCard = (chain) => {
        if (!chain) {
            return (
                <div style={{ padding: "1rem", textAlign: "center" }}>
                    <p>No chain assigned</p>
                </div>
            );
        }

        return (
            <div
                style={{
                    display: "flex",
                    height: "100%",
                    alignItems: "center",
                }}
            >
                {/* Left side - 75% width for content */}
                <div
                    style={{
                        width: "75%",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center" }}>
                        <h3 style={{ margin: "0.5rem 0" }}>
                            {chain.chainName}
                        </h3>
                        <Badge
                            value="Primary"
                            severity="success"
                            style={{ marginLeft: "0.5rem" }}
                        />
                    </div>

                    {/* Display address details */}
                    <p style={{ margin: "0.5rem 0" }}>
                        <strong>Address:</strong> {chain.chainAddressLine1}
                        {chain.chainAddressLine2 &&
                            `, ${chain.chainAddressLine2}`}
                        {chain.chainTown && `, ${chain.chainTown}`}
                        {chain.chainCounty && `, ${chain.chainCounty}`}
                        {chain.chainPostCode && ` ${chain.chainPostCode}`}
                    </p>

                    {/* Display chain emails */}
                    {chain.chainEmails && chain.chainEmails.length > 0 && (
                        <p style={{ margin: "0.5rem 0" }}>
                            <strong>Email:</strong> {chain.chainEmails[0]}
                        </p>
                    )}

                    {/* Display chain phone numbers */}
                    {chain.chainPhoneNumbers &&
                        chain.chainPhoneNumbers.length > 0 && (
                            <p style={{ margin: "0.5rem 0" }}>
                                <strong>Phone:</strong>{" "}
                                {chain.chainPhoneNumbers[0].phoneNumber}
                            </p>
                        )}
                </div>

                {/* Right side - 25% width for button */}
                <div
                    style={{
                        width: "25%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <Link href={`/database/clients/chain/${chain._id}`}>
                        <Button
                            icon="pi pi-eye"
                            size="small"
                            tooltip="View Chain"
                            tooltipOptions={{ position: "top" }}
                        />
                    </Link>
                </div>
            </div>
        );
    };

    // Determine which primary relationship cards to show based on entity type
    const renderPrimaryRelationshipCards = () => {
        switch (entityType) {
            case "site":
                return (
                    <>
                        {/* Column 2: Primary Contact and Walk Around Contact - 25% width */}
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "1rem",
                                width: "25%",
                            }}
                        >
                            <Card
                                style={{
                                    flex: "1",
                                    height: "50%",
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "center",
                                }}
                            >
                                {renderContactCard(primaryContact)}
                            </Card>

                            <Card
                                style={{
                                    flex: "1",
                                    height: "50%",
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "center",
                                }}
                            >
                                {renderWalkAroundContactCard(walkAroundContact)}
                            </Card>
                        </div>

                        {/* Column 3: Primary Group and Primary Chain - 25% width */}
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "1rem",
                                width: "25%",
                            }}
                        >
                            <Card
                                style={{
                                    flex: "1",
                                    height: "50%",
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "center",
                                }}
                            >
                                {renderGroupCard(primaryGroup)}
                            </Card>

                            <Card
                                style={{
                                    flex: "1",
                                    height: "50%",
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "center",
                                }}
                            >
                                {renderChainCard(primaryChain)}
                            </Card>
                        </div>
                    </>
                );

            case "group":
            case "chain":
            case "supplier":
                return (
                    <Card style={{ width: "25%" }}>
                        {renderContactCard(primaryContact)}
                    </Card>
                );

            default:
                return null;
        }
    };

    return (
        <div style={{ display: "flex", gap: "1rem" }}>
            {/* Main information card */}
            <Card title="General Information" style={{ flex: "1" }}>
                {renderContent()}
            </Card>

            {/* Primary relationship cards */}
            {entityType !== "contact" && renderPrimaryRelationshipCards()}
        </div>
    );
};

export default EntityInfoCard;

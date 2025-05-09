// components\database\main\accordionItemParts\SiteItemContent.jsx
import React, { useState, useEffect } from "react";
import { Badge } from "primereact/badge";
import Link from "next/link";
import { Button } from "primereact/button";

const SiteItemContent = ({ site, primaryContacts = [] }) => {
    const [primaryContact, setPrimaryContact] = useState(null);
    const [walkAroundContact, setWalkAroundContact] = useState(null);

    // Fetch the primary and walk around contacts when component mounts or site changes
    useEffect(() => {
        const fetchContacts = async () => {
            // Fetch primary contact if it exists
            if (site.primaryContact) {
                try {
                    // Try to find the contact in the provided primaryContacts array first
                    const foundContact = primaryContacts.find(
                        (c) => c._id === site.primaryContact
                    );

                    if (foundContact) {
                        setPrimaryContact(foundContact);
                    } else {
                        // If not found, fetch it from the API
                        const response = await fetch(
                            `/api/database/clients/contacts/${site.primaryContact}`
                        );
                        if (response.ok) {
                            const result = await response.json();
                            if (result.success) {
                                setPrimaryContact(result.data);
                            }
                        }
                    }
                } catch (error) {
                    console.error("Error fetching primary contact:", error);
                }
            }

            // Fetch walk around contact if it exists
            if (site.walkAroundContact) {
                try {
                    // Try to find the contact in the provided contacts array first
                    const foundContact = primaryContacts.find(
                        (c) => c._id === site.walkAroundContact
                    );

                    if (foundContact) {
                        setWalkAroundContact(foundContact);
                    } else {
                        // If not found, fetch it from the API
                        const response = await fetch(
                            `/api/database/clients/contacts/${site.walkAroundContact}`
                        );
                        if (response.ok) {
                            const result = await response.json();
                            if (result.success) {
                                setWalkAroundContact(result.data);
                            }
                        }
                    }
                } catch (error) {
                    console.error("Error fetching walk around contact:", error);
                }
            }
        };

        fetchContacts();
    }, [site, primaryContacts]);

    // First address or empty object as fallback
    const address =
        site.addresses && site.addresses.length > 0 ? site.addresses[0] : {};

    // Find primary email and phone if available
    const primaryEmail = site.siteEmails?.find((email) => email.isPrimary);
    const otherEmails = site.siteEmails?.filter((email) => !email.isPrimary);

    const primaryPhone = site.sitePhoneNumbers?.find(
        (phone) => phone.isPrimary
    );
    const otherPhones = site.sitePhoneNumbers?.filter(
        (phone) => !phone.isPrimary
    );

    return (
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            {/* Address Card */}
            <div
                style={{
                    flex: "1 1 300px",
                    border: "1px solid #ccc",
                    padding: "1rem",
                    borderRadius: "4px",
                    minWidth: "250px",
                }}
            >
                <h4>Address</h4>
                {address.addressNameNumber && (
                    <div>{address.addressNameNumber}</div>
                )}
                {address.addressLine1 && <div>{address.addressLine1}</div>}
                {address.addressLine2 && <div>{address.addressLine2}</div>}
                {address.town && <div>{address.town}</div>}
                {address.county && <div>{address.county}</div>}
                {address.country && <div>{address.country}</div>}
                {address.postCode && <div>{address.postCode}</div>}
            </div>

            {/* Combined Contact & Other Information Card */}
            <div
                style={{
                    flex: "1 1 300px",
                    border: "1px solid #ccc",
                    padding: "1rem",
                    borderRadius: "4px",
                    minWidth: "250px",
                }}
            >
                <h4>Site Information</h4>

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
                {otherEmails && otherEmails.length > 0 && (
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
                {otherPhones && otherPhones.length > 0 && (
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

                {site.siteWebsite && (
                    <div>
                        <strong>Website:</strong> {site.siteWebsite}
                    </div>
                )}

                <div style={{ marginTop: "1rem" }}>
                    {site.siteType && (
                        <div>
                            <strong>Site Type:</strong> {site.siteType}
                        </div>
                    )}
                    {site.clientType && (
                        <div>
                            <strong>Client Type:</strong> {site.clientType}
                        </div>
                    )}
                </div>

                {site.siteImage && (
                    <div style={{ marginTop: "1rem" }}>
                        <strong>Site Image:</strong>
                        <img
                            src={site.siteImage}
                            alt={site.siteName}
                            style={{
                                maxWidth: "100%",
                                maxHeight: "200px",
                                marginTop: "0.5rem",
                            }}
                        />
                    </div>
                )}
            </div>

            {/* Primary Contact Card */}
            <div
                style={{
                    flex: "1 1 300px",
                    border: "1px solid #ccc",
                    padding: "1rem",
                    borderRadius: "4px",
                    minWidth: "250px",
                }}
            >
                <h4>Primary Contact</h4>
                {primaryContact ? (
                    <div style={{ marginBottom: "1rem" }}>
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                            }}
                        >
                            <h5 style={{ margin: "0.5rem 0" }}>
                                {primaryContact.contactFirstName}{" "}
                                {primaryContact.contactLastName}
                            </h5>
                            <Badge value="Primary" severity="success" />
                        </div>

                        {primaryContact.position && (
                            <div>
                                <strong>Position:</strong>{" "}
                                {primaryContact.position}
                            </div>
                        )}

                        {/* Find primary email for contact */}
                        {primaryContact.contactEmails &&
                            primaryContact.contactEmails.length > 0 && (
                                <div>
                                    <strong>Email:</strong>{" "}
                                    {primaryContact.contactEmails.find(
                                        (e) => e.isPrimary
                                    )?.email ||
                                        primaryContact.contactEmails[0].email}
                                </div>
                            )}

                        {/* Find primary phone for contact */}
                        {primaryContact.contactPhoneNumbers &&
                            primaryContact.contactPhoneNumbers.length > 0 && (
                                <div>
                                    <strong>Phone:</strong>{" "}
                                    {primaryContact.contactPhoneNumbers.find(
                                        (p) => p.isPrimary
                                    )?.phoneNumber ||
                                        primaryContact.contactPhoneNumbers[0]
                                            .phoneNumber}
                                </div>
                            )}

                        <div
                            style={{
                                textAlign: "right",
                                marginTop: "0.5rem",
                            }}
                        >
                            <Link
                                href={`/database/clients/contact/${primaryContact._id}`}
                            >
                                <Button
                                    label="View Contact"
                                    icon="pi pi-user"
                                    size="small"
                                />
                            </Link>
                        </div>
                    </div>
                ) : // If no primary contacts found, check legacy contacts that might be primary
                primaryContacts.length > 0 ? (
                    primaryContacts.map((contact) => (
                        <div key={contact._id} style={{ marginBottom: "1rem" }}>
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                }}
                            >
                                <h5 style={{ margin: "0.5rem 0" }}>
                                    {contact.contactFirstName}{" "}
                                    {contact.contactLastName}
                                </h5>
                                <Badge value="Primary" severity="success" />
                            </div>

                            {contact.position && (
                                <div>
                                    <strong>Position:</strong>{" "}
                                    {contact.position}
                                </div>
                            )}

                            {/* Find primary email for contact */}
                            {contact.contactEmails &&
                                contact.contactEmails.length > 0 && (
                                    <div>
                                        <strong>Email:</strong>{" "}
                                        {contact.contactEmails.find(
                                            (e) => e.isPrimary
                                        )?.email ||
                                            contact.contactEmails[0].email}
                                    </div>
                                )}

                            {/* Find primary phone for contact */}
                            {contact.contactPhoneNumbers &&
                                contact.contactPhoneNumbers.length > 0 && (
                                    <div>
                                        <strong>Phone:</strong>{" "}
                                        {contact.contactPhoneNumbers.find(
                                            (p) => p.isPrimary
                                        )?.phoneNumber ||
                                            contact.contactPhoneNumbers[0]
                                                .phoneNumber}
                                    </div>
                                )}

                            <div
                                style={{
                                    textAlign: "right",
                                    marginTop: "0.5rem",
                                }}
                            >
                                <Link
                                    href={`/database/clients/contact/${contact._id}`}
                                >
                                    <Button
                                        label="View Contact"
                                        icon="pi pi-user"
                                        size="small"
                                    />
                                </Link>
                            </div>
                        </div>
                    ))
                ) : (
                    <div style={{ textAlign: "center", padding: "1rem" }}>
                        <p>No primary contact assigned</p>
                    </div>
                )}
            </div>

            {/* Walk Around Contact Card */}
            <div
                style={{
                    flex: "1 1 300px",
                    border: "1px solid #ccc",
                    padding: "1rem",
                    borderRadius: "4px",
                    minWidth: "250px",
                }}
            >
                <h4>Walk Around Contact</h4>
                {walkAroundContact ? (
                    <div style={{ marginBottom: "1rem" }}>
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                            }}
                        >
                            <h5 style={{ margin: "0.5rem 0" }}>
                                {walkAroundContact.contactFirstName}{" "}
                                {walkAroundContact.contactLastName}
                            </h5>
                            <Badge value="Walk Around" severity="info" />
                        </div>

                        {walkAroundContact.position && (
                            <div>
                                <strong>Position:</strong>{" "}
                                {walkAroundContact.position}
                            </div>
                        )}

                        {/* Find primary email for walk around contact */}
                        {walkAroundContact.contactEmails &&
                            walkAroundContact.contactEmails.length > 0 && (
                                <div>
                                    <strong>Email:</strong>{" "}
                                    {walkAroundContact.contactEmails.find(
                                        (e) => e.isPrimary
                                    )?.email ||
                                        walkAroundContact.contactEmails[0]
                                            .email}
                                </div>
                            )}

                        {/* Find primary phone for walk around contact */}
                        {walkAroundContact.contactPhoneNumbers &&
                            walkAroundContact.contactPhoneNumbers.length >
                                0 && (
                                <div>
                                    <strong>Phone:</strong>{" "}
                                    {walkAroundContact.contactPhoneNumbers.find(
                                        (p) => p.isPrimary
                                    )?.phoneNumber ||
                                        walkAroundContact.contactPhoneNumbers[0]
                                            .phoneNumber}
                                </div>
                            )}

                        <div
                            style={{
                                textAlign: "right",
                                marginTop: "0.5rem",
                            }}
                        >
                            <Link
                                href={`/database/clients/contact/${walkAroundContact._id}`}
                            >
                                <Button
                                    label="View Contact"
                                    icon="pi pi-user"
                                    size="small"
                                />
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div style={{ textAlign: "center", padding: "1rem" }}>
                        <p>No walk around contact assigned</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SiteItemContent;

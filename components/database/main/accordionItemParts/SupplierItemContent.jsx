// components\database\main\accordionItemParts\SupplierItemContent.jsx
import React, { useState, useEffect } from "react";
import { Badge } from "primereact/badge";
import Link from "next/link";
import { Button } from "primereact/button";

const SupplierItemContent = ({ supplier }) => {
    const [primaryContact, setPrimaryContact] = useState(null);

    // Fetch the primary contact when component mounts or supplier changes
    useEffect(() => {
        const fetchPrimaryContact = async () => {
            if (supplier.primaryContact) {
                try {
                    const response = await fetch(
                        `/api/database/clients/contacts/${supplier.primaryContact}`
                    );
                    if (response.ok) {
                        const result = await response.json();
                        if (result.success) {
                            setPrimaryContact(result.data);
                        }
                    }
                } catch (error) {
                    console.error("Error fetching primary contact:", error);
                }
            }
        };

        fetchPrimaryContact();
    }, [supplier]);

    // Compute booleans for each card based on available data.
    const hasAddress =
        supplier.addressNameNumber ||
        supplier.addressLine1 ||
        supplier.addressLine2 ||
        supplier.town ||
        supplier.county ||
        supplier.country ||
        supplier.postCode;
    const hasBasicInfo =
        supplier.supplierName ||
        (supplier.supplierEmails && supplier.supplierEmails.length > 0);
    const hasContact =
        supplier.supplierWebsite ||
        (supplier.supplierPhoneNumbers &&
            supplier.supplierPhoneNumbers.length > 0);

    // Find primary email for display
    const primaryEmail = supplier.supplierEmails?.find(
        (email) => email.isPrimary
    );
    const otherEmails = supplier.supplierEmails?.filter(
        (email) => !email.isPrimary
    );

    // Find primary phone for display
    const primaryPhone = supplier.supplierPhoneNumbers?.find(
        (phone) => phone.isPrimary
    );
    const otherPhones = supplier.supplierPhoneNumbers?.filter(
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
                {hasAddress ? (
                    <>
                        {supplier.addressNameNumber && (
                            <div>{supplier.addressNameNumber}</div>
                        )}
                        {supplier.addressLine1 && (
                            <div>{supplier.addressLine1}</div>
                        )}
                        {supplier.addressLine2 && (
                            <div>{supplier.addressLine2}</div>
                        )}
                        {supplier.town && <div>{supplier.town}</div>}
                        {supplier.county && <div>{supplier.county}</div>}
                        {supplier.country && <div>{supplier.country}</div>}
                        {supplier.postCode && <div>{supplier.postCode}</div>}
                    </>
                ) : (
                    <div>No address information available</div>
                )}
            </div>

            {/* Basic Info Card */}
            <div
                style={{
                    flex: "1 1 300px",
                    border: "1px solid #ccc",
                    padding: "1rem",
                    borderRadius: "4px",
                    minWidth: "250px",
                }}
            >
                <h4>Basic Info</h4>
                {supplier.supplierName && (
                    <p>
                        <strong>Name:</strong> {supplier.supplierName}
                    </p>
                )}

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

                {supplier.supplierWebsite && (
                    <div>
                        <strong>Website:</strong> {supplier.supplierWebsite}
                    </div>
                )}
                {supplier.supplierLogo && (
                    <div style={{ marginTop: "1rem" }}>
                        <strong>Logo:</strong>
                        <img
                            src={supplier.supplierLogo}
                            alt={`${supplier.supplierName} Logo`}
                            style={{
                                maxWidth: "100%",
                                maxHeight: "150px",
                                marginTop: "0.5rem",
                            }}
                        />
                    </div>
                )}
            </div>

            {/* Contact Information Card */}
            <div
                style={{
                    flex: "1 1 300px",
                    border: "1px solid #ccc",
                    padding: "1rem",
                    borderRadius: "4px",
                    minWidth: "250px",
                }}
            >
                <h4>Contact Information</h4>
                {hasContact ? (
                    <>
                        {/* Display primary phone with badge */}
                        {primaryPhone && (
                            <div style={{ marginBottom: "0.5rem" }}>
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                    }}
                                >
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
                                        <em>
                                            Location: {primaryPhone.location}
                                        </em>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Display other phone numbers if any */}
                        {otherPhones && otherPhones.length > 0 && (
                            <div style={{ marginBottom: "1rem" }}>
                                <strong>Other Phone Numbers:</strong>
                                {otherPhones.map((phone, idx) => (
                                    <div
                                        key={idx}
                                        style={{ marginLeft: "1rem" }}
                                    >
                                        <div>{phone.phoneNumber}</div>
                                        {phone.extension && (
                                            <div>
                                                <em>Ext: {phone.extension}</em>
                                            </div>
                                        )}
                                        {phone.location && (
                                            <div>
                                                <em>
                                                    Location: {phone.location}
                                                </em>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {supplier.supplierNotes && (
                            <div style={{ marginTop: "1rem" }}>
                                <strong>Notes:</strong>
                                <div>{supplier.supplierNotes}</div>
                            </div>
                        )}
                    </>
                ) : (
                    <div>No contact information available</div>
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
                ) : (
                    <div style={{ textAlign: "center", padding: "1rem" }}>
                        <p>No primary contact assigned</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SupplierItemContent;

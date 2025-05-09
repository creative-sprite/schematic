// components\database\main\accordionItemParts\ContactItemContent.jsx
import React from "react";

const ContactItemContent = ({ contact }) => {
    // Find primary email for display
    const primaryEmail = contact.contactEmails?.find(
        (email) => email.isPrimary
    );
    const otherEmails = contact.contactEmails?.filter(
        (email) => !email.isPrimary
    );

    // Find primary phone for display
    const primaryPhone = contact.contactPhoneNumbers?.find(
        (phone) => phone.isPrimary
    );
    const otherPhones = contact.contactPhoneNumbers?.filter(
        (phone) => !phone.isPrimary
    );

    return (
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
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
                <h4>Basic Information</h4>
                <div>
                    <strong>Name:</strong> {contact.contactFirstName}{" "}
                    {contact.contactLastName}
                </div>
                {contact.position && (
                    <div>
                        <strong>Position:</strong> {contact.position}
                    </div>
                )}
                {contact.isPrimaryContact && (
                    <div>
                        <strong>Primary Contact</strong>
                    </div>
                )}
                {contact.isWalkAroundContact && (
                    <div>
                        <strong>Walk Around Contact</strong>
                    </div>
                )}
            </div>

            {/* Contact Details Card */}
            <div
                style={{
                    flex: "1 1 300px",
                    border: "1px solid #ccc",
                    padding: "1rem",
                    borderRadius: "4px",
                    minWidth: "250px",
                }}
            >
                <h4>Contact Details</h4>

                {/* Display primary email with badge if exists */}
                {primaryEmail && (
                    <div style={{ marginBottom: "0.5rem" }}>
                        <strong>Primary Email:</strong> {primaryEmail.email}
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

                {/* Display primary phone with badge if exists */}
                {primaryPhone && (
                    <div style={{ marginBottom: "0.5rem" }}>
                        <strong>Primary Phone:</strong>{" "}
                        {primaryPhone.phoneNumber}
                        {primaryPhone.extension && (
                            <span> (Ext: {primaryPhone.extension})</span>
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
                                <div>
                                    {phone.phoneNumber}
                                    {phone.extension && (
                                        <span> (Ext: {phone.extension})</span>
                                    )}
                                </div>
                                {phone.location && (
                                    <div>
                                        <em>Location: {phone.location}</em>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* If no emails or phone numbers exist */}
                {!primaryEmail &&
                    (!otherEmails || otherEmails.length === 0) &&
                    !primaryPhone &&
                    (!otherPhones || otherPhones.length === 0) && (
                        <div>No contact details available</div>
                    )}
            </div>

            {/* Additional Information Card */}
            <div
                style={{
                    flex: "1 1 300px",
                    border: "1px solid #ccc",
                    padding: "1rem",
                    borderRadius: "4px",
                    minWidth: "250px",
                }}
            >
                <h4>Additional Information</h4>
                {contact.contactImage ? (
                    <div>
                        <strong>Image:</strong>
                        <img
                            src={contact.contactImage}
                            alt={`${contact.contactFirstName} ${contact.contactLastName}`}
                            style={{
                                maxWidth: "100%",
                                maxHeight: "200px",
                                marginTop: "0.5rem",
                            }}
                        />
                    </div>
                ) : (
                    <div>No additional information available</div>
                )}
            </div>
        </div>
    );
};

export default ContactItemContent;

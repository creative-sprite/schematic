// components\database\main\newEntryParts\ContactForm.jsx
import React, { useState } from "react";
import { InputText } from "primereact/inputtext";
import { FileUpload } from "primereact/fileupload";
import { Checkbox } from "primereact/checkbox";
import { Card } from "primereact/card";
import { Button } from "primereact/button";

const ContactForm = ({ newContact, setNewContact, handleImageUpload }) => {
    // State for new email entry
    const [newEmail, setNewEmail] = useState({
        email: "",
        location: "",
        isPrimary: false,
    });

    // State for new phone number entry
    const [newPhone, setNewPhone] = useState({
        phoneNumber: "",
        location: "",
        extension: "",
        isPrimary: false,
    });

    // Handler for adding a new email
    const handleAddEmail = () => {
        if (!newEmail.email.trim()) return;

        const updatedEmails = [...(newContact.contactEmails || [])];

        // If this is marked as primary, unmark all others
        if (newEmail.isPrimary) {
            updatedEmails.forEach((email) => {
                email.isPrimary = false;
            });
        }
        // If this is the first email and none are primary, make it primary
        else if (updatedEmails.length === 0) {
            newEmail.isPrimary = true;
        }

        updatedEmails.push({ ...newEmail });

        setNewContact({
            ...newContact,
            contactEmails: updatedEmails,
        });

        // Reset form
        setNewEmail({ email: "", location: "", isPrimary: false });
    };

    // Handler for removing an email
    const handleRemoveEmail = (index) => {
        const updatedEmails = [...(newContact.contactEmails || [])];
        const wasRemovingPrimary = updatedEmails[index].isPrimary;

        updatedEmails.splice(index, 1);

        // If we removed the primary and there are other emails, set the first one as primary
        if (wasRemovingPrimary && updatedEmails.length > 0) {
            updatedEmails[0].isPrimary = true;
        }

        setNewContact({
            ...newContact,
            contactEmails: updatedEmails,
        });
    };

    // Handler for setting an email as primary
    const handleSetEmailPrimary = (index) => {
        const updatedEmails = [...(newContact.contactEmails || [])];

        // Unset all emails as primary
        updatedEmails.forEach((email) => {
            email.isPrimary = false;
        });

        // Set the selected email as primary
        updatedEmails[index].isPrimary = true;

        setNewContact({
            ...newContact,
            contactEmails: updatedEmails,
        });
    };

    // Handler for adding a new phone number
    const handleAddPhone = () => {
        if (!newPhone.phoneNumber.trim()) return;

        const updatedPhones = [...(newContact.contactPhoneNumbers || [])];

        // If this is marked as primary, unmark all others
        if (newPhone.isPrimary) {
            updatedPhones.forEach((phone) => {
                phone.isPrimary = false;
            });
        }
        // If this is the first phone and none are primary, make it primary
        else if (updatedPhones.length === 0) {
            newPhone.isPrimary = true;
        }

        updatedPhones.push({ ...newPhone });

        setNewContact({
            ...newContact,
            contactPhoneNumbers: updatedPhones,
        });

        // Reset form
        setNewPhone({
            phoneNumber: "",
            location: "",
            extension: "",
            isPrimary: false,
        });
    };

    // Handler for removing a phone number
    const handleRemovePhone = (index) => {
        const updatedPhones = [...(newContact.contactPhoneNumbers || [])];
        const wasRemovingPrimary = updatedPhones[index].isPrimary;

        updatedPhones.splice(index, 1);

        // If we removed the primary and there are other phones, set the first one as primary
        if (wasRemovingPrimary && updatedPhones.length > 0) {
            updatedPhones[0].isPrimary = true;
        }

        setNewContact({
            ...newContact,
            contactPhoneNumbers: updatedPhones,
        });
    };

    // Handler for setting a phone number as primary
    const handleSetPhonePrimary = (index) => {
        const updatedPhones = [...(newContact.contactPhoneNumbers || [])];

        // Unset all phones as primary
        updatedPhones.forEach((phone) => {
            phone.isPrimary = false;
        });

        // Set the selected phone as primary
        updatedPhones[index].isPrimary = true;

        setNewContact({
            ...newContact,
            contactPhoneNumbers: updatedPhones,
        });
    };

    return (
        <div className="form-field">
            <InputText
                placeholder="first name *"
                value={newContact.contactFirstName || ""}
                onChange={(e) =>
                    setNewContact({
                        ...newContact,
                        contactFirstName: e.target.value,
                    })
                }
            />
            <InputText
                placeholder="last name *"
                value={newContact.contactLastName || ""}
                onChange={(e) =>
                    setNewContact({
                        ...newContact,
                        contactLastName: e.target.value,
                    })
                }
            />
            <InputText
                placeholder="position"
                value={newContact.position || ""}
                onChange={(e) =>
                    setNewContact({
                        ...newContact,
                        position: e.target.value,
                    })
                }
            />
            <br />

            {/* Email Section */}
            <Card
                title="Email Addresses"
                style={{ marginTop: "1rem", marginBottom: "1rem" }}
            >
                <div
                    style={{
                        display: "flex",
                        gap: "1rem",
                        marginBottom: "1rem",
                    }}
                >
                    <InputText
                        placeholder="Email address"
                        value={newEmail.email}
                        onChange={(e) =>
                            setNewEmail({
                                ...newEmail,
                                email: e.target.value,
                            })
                        }
                        style={{ flex: "2" }}
                    />
                    <InputText
                        placeholder="Location (e.g., Office, Home)"
                        value={newEmail.location}
                        onChange={(e) =>
                            setNewEmail({
                                ...newEmail,
                                location: e.target.value,
                            })
                        }
                        style={{ flex: "2" }}
                    />
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            flex: "1",
                        }}
                    >
                        <Checkbox
                            inputId="emailPrimary"
                            checked={newEmail.isPrimary}
                            onChange={(e) =>
                                setNewEmail({
                                    ...newEmail,
                                    isPrimary: e.checked,
                                })
                            }
                        />
                        <label
                            htmlFor="emailPrimary"
                            style={{ marginLeft: "0.5rem" }}
                        >
                            Primary
                        </label>
                    </div>
                    <Button icon="pi pi-plus" onClick={handleAddEmail} />
                </div>

                {/* Display added emails */}
                <div>
                    {newContact.contactEmails &&
                        newContact.contactEmails.map((email, index) => (
                            <div
                                key={index}
                                style={{
                                    display: "flex",
                                    gap: "1rem",
                                    marginBottom: "0.5rem",
                                    alignItems: "center",
                                }}
                            >
                                <div style={{ flex: "2" }}>{email.email}</div>
                                <div style={{ flex: "2" }}>
                                    {email.location}
                                </div>
                                <div
                                    style={{
                                        flex: "1",
                                        display: "flex",
                                        alignItems: "center",
                                    }}
                                >
                                    {email.isPrimary ? (
                                        <span
                                            style={{
                                                color: "green",
                                                fontWeight: "bold",
                                            }}
                                        >
                                            Primary
                                        </span>
                                    ) : (
                                        <Button
                                            label="Set Primary"
                                            size="small"
                                            className="p-button-text p-button-sm"
                                            onClick={() =>
                                                handleSetEmailPrimary(index)
                                            }
                                        />
                                    )}
                                </div>
                                <Button
                                    icon="pi pi-trash"
                                    className="p-button-danger p-button-text p-button-sm"
                                    onClick={() => handleRemoveEmail(index)}
                                />
                            </div>
                        ))}
                </div>
            </Card>

            {/* Phone Numbers Section */}
            <Card
                title="Phone Numbers"
                style={{ marginTop: "1rem", marginBottom: "1rem" }}
            >
                <div
                    style={{
                        display: "flex",
                        gap: "1rem",
                        marginBottom: "1rem",
                    }}
                >
                    <InputText
                        placeholder="Phone number"
                        value={newPhone.phoneNumber}
                        onChange={(e) =>
                            setNewPhone({
                                ...newPhone,
                                phoneNumber: e.target.value,
                            })
                        }
                        style={{ flex: "2" }}
                    />
                    <InputText
                        placeholder="Location (e.g., Mobile, Office)"
                        value={newPhone.location}
                        onChange={(e) =>
                            setNewPhone({
                                ...newPhone,
                                location: e.target.value,
                            })
                        }
                        style={{ flex: "2" }}
                    />
                    <InputText
                        placeholder="Extension"
                        value={newPhone.extension}
                        onChange={(e) =>
                            setNewPhone({
                                ...newPhone,
                                extension: e.target.value,
                            })
                        }
                        style={{ flex: "1" }}
                    />
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            flex: "1",
                        }}
                    >
                        <Checkbox
                            inputId="phonePrimary"
                            checked={newPhone.isPrimary}
                            onChange={(e) =>
                                setNewPhone({
                                    ...newPhone,
                                    isPrimary: e.checked,
                                })
                            }
                        />
                        <label
                            htmlFor="phonePrimary"
                            style={{ marginLeft: "0.5rem" }}
                        >
                            Primary
                        </label>
                    </div>
                    <Button icon="pi pi-plus" onClick={handleAddPhone} />
                </div>

                {/* Display added phone numbers */}
                <div>
                    {newContact.contactPhoneNumbers &&
                        newContact.contactPhoneNumbers.map((phone, index) => (
                            <div
                                key={index}
                                style={{
                                    display: "flex",
                                    gap: "1rem",
                                    marginBottom: "0.5rem",
                                    alignItems: "center",
                                }}
                            >
                                <div style={{ flex: "2" }}>
                                    {phone.phoneNumber}
                                </div>
                                <div style={{ flex: "2" }}>
                                    {phone.location}
                                </div>
                                <div style={{ flex: "1" }}>
                                    {phone.extension}
                                </div>
                                <div
                                    style={{
                                        flex: "1",
                                        display: "flex",
                                        alignItems: "center",
                                    }}
                                >
                                    {phone.isPrimary ? (
                                        <span
                                            style={{
                                                color: "green",
                                                fontWeight: "bold",
                                            }}
                                        >
                                            Primary
                                        </span>
                                    ) : (
                                        <Button
                                            label="Set Primary"
                                            size="small"
                                            className="p-button-text p-button-sm"
                                            onClick={() =>
                                                handleSetPhonePrimary(index)
                                            }
                                        />
                                    )}
                                </div>
                                <Button
                                    icon="pi pi-trash"
                                    className="p-button-danger p-button-text p-button-sm"
                                    onClick={() => handleRemovePhone(index)}
                                />
                            </div>
                        ))}
                </div>
            </Card>

            <div style={{ marginTop: "1rem", display: "flex", gap: "2rem" }}>
                <div
                    className="p-field-checkbox"
                    style={{ display: "flex", alignItems: "center" }}
                >
                    <Checkbox
                        inputId="isPrimaryContact"
                        checked={newContact.isPrimaryContact || false}
                        onChange={(e) =>
                            setNewContact({
                                ...newContact,
                                isPrimaryContact: e.checked,
                            })
                        }
                    />
                    <label
                        htmlFor="isPrimaryContact"
                        style={{ marginLeft: "0.5rem" }}
                    >
                        Primary Contact
                    </label>
                </div>

                <div
                    className="p-field-checkbox"
                    style={{ display: "flex", alignItems: "center" }}
                >
                    <Checkbox
                        inputId="isWalkAroundContact"
                        checked={newContact.isWalkAroundContact || false}
                        onChange={(e) =>
                            setNewContact({
                                ...newContact,
                                isWalkAroundContact: e.checked,
                            })
                        }
                    />
                    <label
                        htmlFor="isWalkAroundContact"
                        style={{ marginLeft: "0.5rem" }}
                    >
                        Walk Around Contact
                    </label>
                </div>
            </div>

            <br />
            <FileUpload
                name="image"
                accept="image/*"
                customUpload
                uploadHandler={(e) => handleImageUpload(e, "contact")}
                mode="basic"
                chooseLabel="Choose Image"
            />
        </div>
    );
};

export default ContactForm;

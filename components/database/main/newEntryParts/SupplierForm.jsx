// components\database\main\newEntryParts\SupplierForm.jsx
import React, { useState } from "react";
import { InputText } from "primereact/inputtext";
import { FileUpload } from "primereact/fileupload";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Checkbox } from "primereact/checkbox";

const SupplierForm = ({ newSupplier, setNewSupplier, handleImageUpload }) => {
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

        const updatedEmails = [...(newSupplier.supplierEmails || [])];

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

        setNewSupplier({
            ...newSupplier,
            supplierEmails: updatedEmails,
        });

        // Reset form
        setNewEmail({ email: "", location: "", isPrimary: false });
    };

    // Handler for removing an email
    const handleRemoveEmail = (index) => {
        const updatedEmails = [...(newSupplier.supplierEmails || [])];
        const wasRemovingPrimary = updatedEmails[index].isPrimary;

        updatedEmails.splice(index, 1);

        // If we removed the primary and there are other emails, set the first one as primary
        if (wasRemovingPrimary && updatedEmails.length > 0) {
            updatedEmails[0].isPrimary = true;
        }

        setNewSupplier({
            ...newSupplier,
            supplierEmails: updatedEmails,
        });
    };

    // Handler for setting an email as primary
    const handleSetEmailPrimary = (index) => {
        const updatedEmails = [...(newSupplier.supplierEmails || [])];

        // Unset all emails as primary
        updatedEmails.forEach((email) => {
            email.isPrimary = false;
        });

        // Set the selected email as primary
        updatedEmails[index].isPrimary = true;

        setNewSupplier({
            ...newSupplier,
            supplierEmails: updatedEmails,
        });
    };

    // Handler for adding a new phone number
    const handleAddPhone = () => {
        if (!newPhone.phoneNumber.trim()) return;

        const updatedPhones = [...(newSupplier.supplierPhoneNumbers || [])];

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

        setNewSupplier({
            ...newSupplier,
            supplierPhoneNumbers: updatedPhones,
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
        const updatedPhones = [...(newSupplier.supplierPhoneNumbers || [])];
        const wasRemovingPrimary = updatedPhones[index].isPrimary;

        updatedPhones.splice(index, 1);

        // If we removed the primary and there are other phones, set the first one as primary
        if (wasRemovingPrimary && updatedPhones.length > 0) {
            updatedPhones[0].isPrimary = true;
        }

        setNewSupplier({
            ...newSupplier,
            supplierPhoneNumbers: updatedPhones,
        });
    };

    // Handler for setting a phone number as primary
    const handleSetPhonePrimary = (index) => {
        const updatedPhones = [...(newSupplier.supplierPhoneNumbers || [])];

        // Unset all phones as primary
        updatedPhones.forEach((phone) => {
            phone.isPrimary = false;
        });

        // Set the selected phone as primary
        updatedPhones[index].isPrimary = true;

        setNewSupplier({
            ...newSupplier,
            supplierPhoneNumbers: updatedPhones,
        });
    };

    return (
        <div className="form-field">
            <InputText
                placeholder="Supplier Name *"
                value={newSupplier.supplierName || ""}
                onChange={(e) =>
                    setNewSupplier({
                        ...newSupplier,
                        supplierName: e.target.value,
                    })
                }
            />

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
                        placeholder="Location (e.g., Office, Support)"
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
                    {newSupplier.supplierEmails &&
                        newSupplier.supplierEmails.map((email, index) => (
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

            <InputText
                placeholder="Supplier Website"
                value={newSupplier.supplierWebsite || ""}
                onChange={(e) =>
                    setNewSupplier({
                        ...newSupplier,
                        supplierWebsite: e.target.value,
                    })
                }
            />

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
                        placeholder="Location (e.g., Main, Support)"
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
                    {newSupplier.supplierPhoneNumbers &&
                        newSupplier.supplierPhoneNumbers.map((phone, index) => (
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

            <div style={{ marginTop: "1rem" }}>
                <InputText
                    placeholder="Building Name/Number"
                    value={newSupplier.addressNameNumber || ""}
                    onChange={(e) =>
                        setNewSupplier({
                            ...newSupplier,
                            addressNameNumber: e.target.value,
                        })
                    }
                />
                <InputText
                    placeholder="Address Line 1"
                    value={newSupplier.addressLine1 || ""}
                    onChange={(e) =>
                        setNewSupplier({
                            ...newSupplier,
                            addressLine1: e.target.value,
                        })
                    }
                />
                <InputText
                    placeholder="Address Line 2"
                    value={newSupplier.addressLine2 || ""}
                    onChange={(e) =>
                        setNewSupplier({
                            ...newSupplier,
                            addressLine2: e.target.value,
                        })
                    }
                />
                <br />
                <InputText
                    placeholder="Town"
                    value={newSupplier.town || ""}
                    onChange={(e) =>
                        setNewSupplier({
                            ...newSupplier,
                            town: e.target.value,
                        })
                    }
                />
                <InputText
                    placeholder="County"
                    value={newSupplier.county || ""}
                    onChange={(e) =>
                        setNewSupplier({
                            ...newSupplier,
                            county: e.target.value,
                        })
                    }
                />
                <InputText
                    placeholder="Country"
                    value={newSupplier.country || ""}
                    onChange={(e) =>
                        setNewSupplier({
                            ...newSupplier,
                            country: e.target.value,
                        })
                    }
                />
                <br />
                <InputText
                    placeholder="Post Code"
                    value={newSupplier.postCode || ""}
                    onChange={(e) =>
                        setNewSupplier({
                            ...newSupplier,
                            postCode: e.target.value,
                        })
                    }
                />
                <br />
                <FileUpload
                    name="supplierLogo"
                    accept="image/*"
                    customUpload
                    uploadHandler={(e) => handleImageUpload(e, "supplier")}
                    mode="basic"
                    chooseLabel="Logo"
                />
            </div>
        </div>
    );
};

export default SupplierForm;

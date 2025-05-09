// components\database\main\newEntryParts\SiteForm.jsx
import React, { useState } from "react";
import { InputText } from "primereact/inputtext";
import { FileUpload } from "primereact/fileupload";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Checkbox } from "primereact/checkbox";

const SiteForm = ({ newSite, setNewSite, handleImageUpload }) => {
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

        const updatedEmails = [...(newSite.siteEmails || [])];

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

        setNewSite({
            ...newSite,
            siteEmails: updatedEmails,
        });

        // Reset form
        setNewEmail({ email: "", location: "", isPrimary: false });
    };

    // Handler for removing an email
    const handleRemoveEmail = (index) => {
        const updatedEmails = [...(newSite.siteEmails || [])];
        const wasRemovingPrimary = updatedEmails[index].isPrimary;

        updatedEmails.splice(index, 1);

        // If we removed the primary and there are other emails, set the first one as primary
        if (wasRemovingPrimary && updatedEmails.length > 0) {
            updatedEmails[0].isPrimary = true;
        }

        setNewSite({
            ...newSite,
            siteEmails: updatedEmails,
        });
    };

    // Handler for setting an email as primary
    const handleSetEmailPrimary = (index) => {
        const updatedEmails = [...(newSite.siteEmails || [])];

        // Unset all emails as primary
        updatedEmails.forEach((email) => {
            email.isPrimary = false;
        });

        // Set the selected email as primary
        updatedEmails[index].isPrimary = true;

        setNewSite({
            ...newSite,
            siteEmails: updatedEmails,
        });
    };

    // Handler for adding a new phone number
    const handleAddPhone = () => {
        if (!newPhone.phoneNumber.trim()) return;

        const updatedPhones = [...(newSite.sitePhoneNumbers || [])];

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

        setNewSite({
            ...newSite,
            sitePhoneNumbers: updatedPhones,
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
        const updatedPhones = [...(newSite.sitePhoneNumbers || [])];
        const wasRemovingPrimary = updatedPhones[index].isPrimary;

        updatedPhones.splice(index, 1);

        // If we removed the primary and there are other phones, set the first one as primary
        if (wasRemovingPrimary && updatedPhones.length > 0) {
            updatedPhones[0].isPrimary = true;
        }

        setNewSite({
            ...newSite,
            sitePhoneNumbers: updatedPhones,
        });
    };

    // Handler for setting a phone number as primary
    const handleSetPhonePrimary = (index) => {
        const updatedPhones = [...(newSite.sitePhoneNumbers || [])];

        // Unset all phones as primary
        updatedPhones.forEach((phone) => {
            phone.isPrimary = false;
        });

        // Set the selected phone as primary
        updatedPhones[index].isPrimary = true;

        setNewSite({
            ...newSite,
            sitePhoneNumbers: updatedPhones,
        });
    };

    return (
        <div className="form-field">
            <InputText
                placeholder="site name *"
                value={newSite.siteName || ""}
                onChange={(e) =>
                    setNewSite({
                        ...newSite,
                        siteName: e.target.value,
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
                            setNewEmail({ ...newEmail, email: e.target.value })
                        }
                        style={{ flex: "2" }}
                    />
                    <InputText
                        placeholder="Location (e.g., Office, Kitchen)"
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
                    {newSite.siteEmails &&
                        newSite.siteEmails.map((email, index) => (
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
                placeholder="website"
                value={newSite.siteWebsite || ""}
                onChange={(e) =>
                    setNewSite({
                        ...newSite,
                        siteWebsite: e.target.value,
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
                        placeholder="Location (e.g., Office, Kitchen)"
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
                    {newSite.sitePhoneNumbers &&
                        newSite.sitePhoneNumbers.map((phone, index) => (
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

            <br />
            <InputText
                placeholder="building name / number"
                value={newSite.siteAddressNameNumber || ""}
                onChange={(e) =>
                    setNewSite({
                        ...newSite,
                        siteAddressNameNumber: e.target.value,
                    })
                }
            />
            <InputText
                placeholder="address 1"
                value={newSite.siteAddressLine1 || ""}
                onChange={(e) =>
                    setNewSite({
                        ...newSite,
                        siteAddressLine1: e.target.value,
                    })
                }
            />
            <InputText
                placeholder="address 2"
                value={newSite.siteAddressLine2 || ""}
                onChange={(e) =>
                    setNewSite({
                        ...newSite,
                        siteAddressLine2: e.target.value,
                    })
                }
            />
            <br />
            <InputText
                placeholder="town"
                value={newSite.siteTown || ""}
                onChange={(e) =>
                    setNewSite({
                        ...newSite,
                        siteTown: e.target.value,
                    })
                }
            />
            <InputText
                placeholder="county"
                value={newSite.siteCounty || ""}
                onChange={(e) =>
                    setNewSite({
                        ...newSite,
                        siteCounty: e.target.value,
                    })
                }
            />
            <InputText
                placeholder="country"
                value={newSite.siteCountry || ""}
                onChange={(e) =>
                    setNewSite({
                        ...newSite,
                        siteCountry: e.target.value,
                    })
                }
            />
            <br />
            <InputText
                placeholder="postcode"
                value={newSite.sitePostCode || ""}
                onChange={(e) =>
                    setNewSite({
                        ...newSite,
                        sitePostCode: e.target.value,
                    })
                }
            />
            <br />
            <InputText
                placeholder="site type"
                value={newSite.siteType || ""}
                onChange={(e) =>
                    setNewSite({
                        ...newSite,
                        siteType: e.target.value,
                    })
                }
            />
            <InputText
                placeholder="client type"
                value={newSite.clientType || ""}
                onChange={(e) =>
                    setNewSite({
                        ...newSite,
                        clientType: e.target.value,
                    })
                }
            />
            <br />
            <FileUpload
                name="image"
                accept="image/*"
                customUpload
                uploadHandler={(e) => handleImageUpload(e, "site")}
                mode="basic"
                chooseLabel="Choose Image"
            />
        </div>
    );
};

export default SiteForm;

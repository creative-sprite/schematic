import React, { useState } from "react";
import { TabView, TabPanel } from "primereact/tabview";
import { InputText } from "primereact/inputtext";
import { Checkbox } from "primereact/checkbox";
import { Card } from "primereact/card";
import { Button } from "primereact/button";

const ContactEditForm = ({ editData, setEditData }) => {
    const [activeTab, setActiveTab] = useState(0);
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
        const updatedEmails = [...(editData.contactEmails || [])];
        if (newEmail.isPrimary) {
            updatedEmails.forEach((email) => (email.isPrimary = false));
        } else if (updatedEmails.length === 0) {
            newEmail.isPrimary = true;
        }
        updatedEmails.push({ ...newEmail });
        setEditData({
            ...editData,
            contactEmails: updatedEmails,
        });
        setNewEmail({ email: "", location: "", isPrimary: false });
    };

    // Handler for removing an email
    const handleRemoveEmail = (index) => {
        const updatedEmails = [...(editData.contactEmails || [])];
        const wasPrimary = updatedEmails[index].isPrimary;
        updatedEmails.splice(index, 1);
        if (wasPrimary && updatedEmails.length > 0) {
            updatedEmails[0].isPrimary = true;
        }
        setEditData({
            ...editData,
            contactEmails: updatedEmails,
        });
    };

    // Handler for setting an email as primary
    const handleSetEmailPrimary = (index) => {
        const updatedEmails = [...(editData.contactEmails || [])];
        updatedEmails.forEach((email) => (email.isPrimary = false));
        updatedEmails[index].isPrimary = true;
        setEditData({
            ...editData,
            contactEmails: updatedEmails,
        });
    };

    // Handler for adding a new phone number
    const handleAddPhone = () => {
        if (!newPhone.phoneNumber.trim()) return;
        const updatedPhones = [...(editData.contactPhoneNumbers || [])];
        if (newPhone.isPrimary) {
            updatedPhones.forEach((phone) => (phone.isPrimary = false));
        } else if (updatedPhones.length === 0) {
            newPhone.isPrimary = true;
        }
        updatedPhones.push({ ...newPhone });
        setEditData({
            ...editData,
            contactPhoneNumbers: updatedPhones,
        });
        setNewPhone({
            phoneNumber: "",
            location: "",
            extension: "",
            isPrimary: false,
        });
    };

    // Handler for removing a phone number
    const handleRemovePhone = (index) => {
        const updatedPhones = [...(editData.contactPhoneNumbers || [])];
        const wasPrimary = updatedPhones[index].isPrimary;
        updatedPhones.splice(index, 1);
        if (wasPrimary && updatedPhones.length > 0) {
            updatedPhones[0].isPrimary = true;
        }
        setEditData({
            ...editData,
            contactPhoneNumbers: updatedPhones,
        });
    };

    // Handler for setting a phone number as primary
    const handleSetPhonePrimary = (index) => {
        const updatedPhones = [...(editData.contactPhoneNumbers || [])];
        updatedPhones.forEach((phone) => (phone.isPrimary = false));
        updatedPhones[index].isPrimary = true;
        setEditData({
            ...editData,
            contactPhoneNumbers: updatedPhones,
        });
    };

    return (
        <TabView
            activeIndex={activeTab}
            onTabChange={(e) => setActiveTab(e.index)}
        >
            <TabPanel header="Basic Info">
                <div className="p-fluid">
                    <div className="p-field" style={{ marginBottom: "1rem" }}>
                        <label htmlFor="contactFirstName">First Name *</label>
                        <InputText
                            id="contactFirstName"
                            value={editData.contactFirstName || ""}
                            onChange={(e) =>
                                setEditData({
                                    ...editData,
                                    contactFirstName: e.target.value,
                                })
                            }
                            required
                        />
                    </div>
                    <div className="p-field" style={{ marginBottom: "1rem" }}>
                        <label htmlFor="contactLastName">Last Name *</label>
                        <InputText
                            id="contactLastName"
                            value={editData.contactLastName || ""}
                            onChange={(e) =>
                                setEditData({
                                    ...editData,
                                    contactLastName: e.target.value,
                                })
                            }
                            required
                        />
                    </div>
                    <div className="p-field" style={{ marginBottom: "1rem" }}>
                        <label htmlFor="position">Position</label>
                        <InputText
                            id="position"
                            value={editData.position || ""}
                            onChange={(e) =>
                                setEditData({
                                    ...editData,
                                    position: e.target.value,
                                })
                            }
                        />
                    </div>
                </div>
            </TabPanel>

            <TabPanel header="Contact Details">
                <Card title="Email Addresses" style={{ marginBottom: "1rem" }}>
                    <div
                        style={{
                            display: "flex",
                            flexWrap: "wrap",
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
                            style={{ flex: "2", minWidth: "200px" }}
                        />
                        <InputText
                            placeholder="Location (e.g., Home, Work)"
                            value={newEmail.location}
                            onChange={(e) =>
                                setNewEmail({
                                    ...newEmail,
                                    location: e.target.value,
                                })
                            }
                            style={{ flex: "2", minWidth: "200px" }}
                        />
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                flex: "1",
                                minWidth: "120px",
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
                    <div>
                        {editData.contactEmails &&
                            editData.contactEmails.map((email, index) => (
                                <div
                                    key={index}
                                    style={{
                                        display: "flex",
                                        flexWrap: "wrap",
                                        gap: "1rem",
                                        marginBottom: "0.5rem",
                                        alignItems: "center",
                                    }}
                                >
                                    <div
                                        style={{ flex: "2", minWidth: "200px" }}
                                    >
                                        {email.email}
                                    </div>
                                    <div
                                        style={{ flex: "2", minWidth: "200px" }}
                                    >
                                        {email.location}
                                    </div>
                                    <div
                                        style={{
                                            flex: "1",
                                            minWidth: "120px",
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

                <Card title="Phone Numbers" style={{ marginBottom: "1rem" }}>
                    <div
                        style={{
                            display: "flex",
                            flexWrap: "wrap",
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
                            style={{ flex: "2", minWidth: "200px" }}
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
                            style={{ flex: "2", minWidth: "200px" }}
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
                            style={{ flex: "1", minWidth: "120px" }}
                        />
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                flex: "1",
                                minWidth: "120px",
                            }}
                        >
                            <Checkbox
                                inputId="phonePrimary"
                                checked={newPhone.isPrimary}
                                onChange={(e) =>
                                    setNewPhone({
                                        ...newPhone,
                                        isPrimary: e.target.checked,
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
                    <div>
                        {editData.contactPhoneNumbers &&
                            editData.contactPhoneNumbers.map((phone, index) => (
                                <div
                                    key={index}
                                    style={{
                                        display: "flex",
                                        flexWrap: "wrap",
                                        gap: "1rem",
                                        marginBottom: "0.5rem",
                                        alignItems: "center",
                                    }}
                                >
                                    <div
                                        style={{ flex: "2", minWidth: "200px" }}
                                    >
                                        {phone.phoneNumber}
                                    </div>
                                    <div
                                        style={{ flex: "2", minWidth: "200px" }}
                                    >
                                        {phone.location}
                                    </div>
                                    <div
                                        style={{ flex: "1", minWidth: "120px" }}
                                    >
                                        {phone.extension}
                                    </div>
                                    <div
                                        style={{
                                            flex: "1",
                                            minWidth: "120px",
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
            </TabPanel>
        </TabView>
    );
};

export default ContactEditForm;

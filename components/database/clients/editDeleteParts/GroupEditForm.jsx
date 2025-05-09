import React, { useState } from "react";
import { TabView, TabPanel } from "primereact/tabview";
import { InputText } from "primereact/inputtext";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Checkbox } from "primereact/checkbox";

const GroupEditForm = ({ editData, setEditData }) => {
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

        const updatedEmails = [...(editData.groupEmails || [])];

        if (newEmail.isPrimary) {
            updatedEmails.forEach((email) => (email.isPrimary = false));
        } else if (updatedEmails.length === 0) {
            newEmail.isPrimary = true;
        }

        updatedEmails.push({ ...newEmail });

        setEditData({
            ...editData,
            groupEmails: updatedEmails,
        });

        setNewEmail({ email: "", location: "", isPrimary: false });
    };

    // Handler for removing an email
    const handleRemoveEmail = (index) => {
        const updatedEmails = [...(editData.groupEmails || [])];
        const wasRemovingPrimary = updatedEmails[index].isPrimary;

        updatedEmails.splice(index, 1);

        if (wasRemovingPrimary && updatedEmails.length > 0) {
            updatedEmails[0].isPrimary = true;
        }

        setEditData({
            ...editData,
            groupEmails: updatedEmails,
        });
    };

    // Handler for setting an email as primary
    const handleSetEmailPrimary = (index) => {
        const updatedEmails = [...(editData.groupEmails || [])];

        updatedEmails.forEach((email) => {
            email.isPrimary = false;
        });

        updatedEmails[index].isPrimary = true;

        setEditData({
            ...editData,
            groupEmails: updatedEmails,
        });
    };

    // Handler for adding a new phone number
    const handleAddPhone = () => {
        if (!newPhone.phoneNumber.trim()) return;

        const updatedPhones = [...(editData.groupPhoneNumbers || [])];

        if (newPhone.isPrimary) {
            updatedPhones.forEach((phone) => (phone.isPrimary = false));
        } else if (updatedPhones.length === 0) {
            newPhone.isPrimary = true;
        }

        updatedPhones.push({ ...newPhone });

        setEditData({
            ...editData,
            groupPhoneNumbers: updatedPhones,
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
        const updatedPhones = [...(editData.groupPhoneNumbers || [])];
        const wasRemovingPrimary = updatedPhones[index].isPrimary;

        updatedPhones.splice(index, 1);

        if (wasRemovingPrimary && updatedPhones.length > 0) {
            updatedPhones[0].isPrimary = true;
        }

        setEditData({
            ...editData,
            groupPhoneNumbers: updatedPhones,
        });
    };

    // Handler for setting a phone number as primary
    const handleSetPhonePrimary = (index) => {
        const updatedPhones = [...(editData.groupPhoneNumbers || [])];

        updatedPhones.forEach((phone) => {
            phone.isPrimary = false;
        });

        updatedPhones[index].isPrimary = true;

        setEditData({
            ...editData,
            groupPhoneNumbers: updatedPhones,
        });
    };

    return (
        <TabView>
            <TabPanel header="Basic Info">
                <div className="p-fluid">
                    <div className="p-field" style={{ marginBottom: "1rem" }}>
                        <label htmlFor="groupName">Group Name *</label>
                        <InputText
                            id="groupName"
                            value={editData.groupName || ""}
                            onChange={(e) =>
                                setEditData({
                                    ...editData,
                                    groupName: e.target.value,
                                })
                            }
                            required
                        />
                    </div>
                    <div className="p-field" style={{ marginBottom: "1rem" }}>
                        <label htmlFor="groupWebsite">Website</label>
                        <InputText
                            id="groupWebsite"
                            value={editData.groupWebsite || ""}
                            onChange={(e) =>
                                setEditData({
                                    ...editData,
                                    groupWebsite: e.target.value,
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
                            placeholder="Location (e.g., Office, Kitchen)"
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
                        {editData.groupEmails &&
                            editData.groupEmails.map((email, index) => (
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
                            placeholder="Location (e.g., Office, Kitchen)"
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
                    <div>
                        {editData.groupPhoneNumbers &&
                            editData.groupPhoneNumbers.map((phone, index) => (
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

            <TabPanel header="Address">
                <div className="p-fluid">
                    <div className="p-field" style={{ marginBottom: "1rem" }}>
                        <label htmlFor="groupAddressNameNumber">
                            Building Name/Number
                        </label>
                        <InputText
                            id="groupAddressNameNumber"
                            value={editData.groupAddressNameNumber || ""}
                            onChange={(e) =>
                                setEditData({
                                    ...editData,
                                    groupAddressNameNumber: e.target.value,
                                })
                            }
                        />
                    </div>
                    <div className="p-field" style={{ marginBottom: "1rem" }}>
                        <label htmlFor="groupAddressLine1">
                            Address Line 1
                        </label>
                        <InputText
                            id="groupAddressLine1"
                            value={editData.groupAddressLine1 || ""}
                            onChange={(e) =>
                                setEditData({
                                    ...editData,
                                    groupAddressLine1: e.target.value,
                                })
                            }
                        />
                    </div>
                    <div className="p-field" style={{ marginBottom: "1rem" }}>
                        <label htmlFor="groupAddressLine2">
                            Address Line 2
                        </label>
                        <InputText
                            id="groupAddressLine2"
                            value={editData.groupAddressLine2 || ""}
                            onChange={(e) =>
                                setEditData({
                                    ...editData,
                                    groupAddressLine2: e.target.value,
                                })
                            }
                        />
                    </div>
                    <div className="p-field" style={{ marginBottom: "1rem" }}>
                        <label htmlFor="groupTown">Town</label>
                        <InputText
                            id="groupTown"
                            value={editData.groupTown || ""}
                            onChange={(e) =>
                                setEditData({
                                    ...editData,
                                    groupTown: e.target.value,
                                })
                            }
                        />
                    </div>
                    <div className="p-field" style={{ marginBottom: "1rem" }}>
                        <label htmlFor="groupCounty">County</label>
                        <InputText
                            id="groupCounty"
                            value={editData.groupCounty || ""}
                            onChange={(e) =>
                                setEditData({
                                    ...editData,
                                    groupCounty: e.target.value,
                                })
                            }
                        />
                    </div>
                    <div className="p-field" style={{ marginBottom: "1rem" }}>
                        <label htmlFor="groupCountry">Country</label>
                        <InputText
                            id="groupCountry"
                            value={editData.groupCountry || ""}
                            onChange={(e) =>
                                setEditData({
                                    ...editData,
                                    groupCountry: e.target.value,
                                })
                            }
                        />
                    </div>
                    <div className="p-field" style={{ marginBottom: "1rem" }}>
                        <label htmlFor="groupPostCode">Post Code</label>
                        <InputText
                            id="groupPostCode"
                            value={editData.groupPostCode || ""}
                            onChange={(e) =>
                                setEditData({
                                    ...editData,
                                    groupPostCode: e.target.value,
                                })
                            }
                        />
                    </div>
                </div>
            </TabPanel>
        </TabView>
    );
};

export default GroupEditForm;

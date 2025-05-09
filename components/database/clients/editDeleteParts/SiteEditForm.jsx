import React, { useState } from "react";
import { TabView, TabPanel } from "primereact/tabview";
import { InputText } from "primereact/inputtext";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Checkbox } from "primereact/checkbox";

const SiteEditForm = ({
    editData,
    setEditData,
    activeEditTab,
    setActiveEditTab,
}) => {
    const [newEmail, setNewEmail] = useState({
        email: "",
        location: "",
        isPrimary: false,
    });

    const [newPhone, setNewPhone] = useState({
        phoneNumber: "",
        location: "",
        extension: "",
        isPrimary: false,
    });

    // Email Handlers
    const handleAddEmail = () => {
        if (!newEmail.email.trim()) return;
        const updatedEmails = [...(editData.siteEmails || [])];
        if (newEmail.isPrimary) {
            updatedEmails.forEach((email) => (email.isPrimary = false));
        } else if (updatedEmails.length === 0) {
            newEmail.isPrimary = true;
        }
        updatedEmails.push({ ...newEmail });
        setEditData({ ...editData, siteEmails: updatedEmails });
        setNewEmail({ email: "", location: "", isPrimary: false });
    };

    const handleRemoveEmail = (index) => {
        const updatedEmails = [...(editData.siteEmails || [])];
        const wasRemovingPrimary = updatedEmails[index].isPrimary;
        updatedEmails.splice(index, 1);
        if (wasRemovingPrimary && updatedEmails.length > 0) {
            updatedEmails[0].isPrimary = true;
        }
        setEditData({ ...editData, siteEmails: updatedEmails });
    };

    const handleSetEmailPrimary = (index) => {
        const updatedEmails = [...(editData.siteEmails || [])];
        updatedEmails.forEach((email) => (email.isPrimary = false));
        updatedEmails[index].isPrimary = true;
        setEditData({ ...editData, siteEmails: updatedEmails });
    };

    // Phone Handlers
    const handleAddPhone = () => {
        if (!newPhone.phoneNumber.trim()) return;
        const updatedPhones = [...(editData.sitePhoneNumbers || [])];
        if (newPhone.isPrimary) {
            updatedPhones.forEach((phone) => (phone.isPrimary = false));
        } else if (updatedPhones.length === 0) {
            newPhone.isPrimary = true;
        }
        updatedPhones.push({ ...newPhone });
        setEditData({ ...editData, sitePhoneNumbers: updatedPhones });
        setNewPhone({
            phoneNumber: "",
            location: "",
            extension: "",
            isPrimary: false,
        });
    };

    const handleRemovePhone = (index) => {
        const updatedPhones = [...(editData.sitePhoneNumbers || [])];
        const wasRemovingPrimary = updatedPhones[index].isPrimary;
        updatedPhones.splice(index, 1);
        if (wasRemovingPrimary && updatedPhones.length > 0) {
            updatedPhones[0].isPrimary = true;
        }
        setEditData({ ...editData, sitePhoneNumbers: updatedPhones });
    };

    const handleSetPhonePrimary = (index) => {
        const updatedPhones = [...(editData.sitePhoneNumbers || [])];
        updatedPhones.forEach((phone) => (phone.isPrimary = false));
        updatedPhones[index].isPrimary = true;
        setEditData({ ...editData, sitePhoneNumbers: updatedPhones });
    };

    return (
        <TabView
            activeIndex={activeEditTab}
            onTabChange={(e) => setActiveEditTab(e.index)}
        >
            <TabPanel header="Basic Info">
                <div className="p-fluid">
                    <div className="p-field" style={{ marginBottom: "1rem" }}>
                        <label htmlFor="siteName">Site Name *</label>
                        <InputText
                            id="siteName"
                            value={editData.siteName || ""}
                            onChange={(e) =>
                                setEditData({
                                    ...editData,
                                    siteName: e.target.value,
                                })
                            }
                            required
                        />
                    </div>
                    <div className="p-field" style={{ marginBottom: "1rem" }}>
                        <label htmlFor="siteWebsite">Website</label>
                        <InputText
                            id="siteWebsite"
                            value={editData.siteWebsite || ""}
                            onChange={(e) =>
                                setEditData({
                                    ...editData,
                                    siteWebsite: e.target.value,
                                })
                            }
                        />
                    </div>
                    <div className="p-field" style={{ marginBottom: "1rem" }}>
                        <label htmlFor="siteType">Site Type</label>
                        <InputText
                            id="siteType"
                            value={editData.siteType || ""}
                            onChange={(e) =>
                                setEditData({
                                    ...editData,
                                    siteType: e.target.value,
                                })
                            }
                        />
                    </div>
                    <div className="p-field" style={{ marginBottom: "1rem" }}>
                        <label htmlFor="clientType">Client Type</label>
                        <InputText
                            id="clientType"
                            value={editData.clientType || ""}
                            onChange={(e) =>
                                setEditData({
                                    ...editData,
                                    clientType: e.target.value,
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
                        {editData.siteEmails &&
                            editData.siteEmails.map((email, index) => (
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
                        {editData.sitePhoneNumbers &&
                            editData.sitePhoneNumbers.map((phone, index) => (
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
                    {editData.addresses && editData.addresses.length > 0 ? (
                        <>
                            <div
                                className="p-field"
                                style={{ marginBottom: "1rem" }}
                            >
                                <label htmlFor="addressNameNumber">
                                    Building Name/Number
                                </label>
                                <InputText
                                    id="addressNameNumber"
                                    value={
                                        editData.addresses[0]
                                            .addressNameNumber || ""
                                    }
                                    onChange={(e) =>
                                        setEditData({
                                            ...editData,
                                            addresses: [
                                                {
                                                    ...editData.addresses[0],
                                                    addressNameNumber:
                                                        e.target.value,
                                                },
                                            ],
                                        })
                                    }
                                />
                            </div>
                            <div
                                className="p-field"
                                style={{ marginBottom: "1rem" }}
                            >
                                <label htmlFor="addressLine1">
                                    Address Line 1
                                </label>
                                <InputText
                                    id="addressLine1"
                                    value={
                                        editData.addresses[0].addressLine1 || ""
                                    }
                                    onChange={(e) =>
                                        setEditData({
                                            ...editData,
                                            addresses: [
                                                {
                                                    ...editData.addresses[0],
                                                    addressLine1:
                                                        e.target.value,
                                                },
                                            ],
                                        })
                                    }
                                />
                            </div>
                            <div
                                className="p-field"
                                style={{ marginBottom: "1rem" }}
                            >
                                <label htmlFor="addressLine2">
                                    Address Line 2
                                </label>
                                <InputText
                                    id="addressLine2"
                                    value={
                                        editData.addresses[0].addressLine2 || ""
                                    }
                                    onChange={(e) =>
                                        setEditData({
                                            ...editData,
                                            addresses: [
                                                {
                                                    ...editData.addresses[0],
                                                    addressLine2:
                                                        e.target.value,
                                                },
                                            ],
                                        })
                                    }
                                />
                            </div>
                            <div
                                className="p-field"
                                style={{ marginBottom: "1rem" }}
                            >
                                <label htmlFor="town">Town</label>
                                <InputText
                                    id="town"
                                    value={editData.addresses[0].town || ""}
                                    onChange={(e) =>
                                        setEditData({
                                            ...editData,
                                            addresses: [
                                                {
                                                    ...editData.addresses[0],
                                                    town: e.target.value,
                                                },
                                            ],
                                        })
                                    }
                                />
                            </div>
                            <div
                                className="p-field"
                                style={{ marginBottom: "1rem" }}
                            >
                                <label htmlFor="county">County</label>
                                <InputText
                                    id="county"
                                    value={editData.addresses[0].county || ""}
                                    onChange={(e) =>
                                        setEditData({
                                            ...editData,
                                            addresses: [
                                                {
                                                    ...editData.addresses[0],
                                                    county: e.target.value,
                                                },
                                            ],
                                        })
                                    }
                                />
                            </div>
                            <div
                                className="p-field"
                                style={{ marginBottom: "1rem" }}
                            >
                                <label htmlFor="country">Country</label>
                                <InputText
                                    id="country"
                                    value={editData.addresses[0].country || ""}
                                    onChange={(e) =>
                                        setEditData({
                                            ...editData,
                                            addresses: [
                                                {
                                                    ...editData.addresses[0],
                                                    country: e.target.value,
                                                },
                                            ],
                                        })
                                    }
                                />
                            </div>
                            <div
                                className="p-field"
                                style={{ marginBottom: "1rem" }}
                            >
                                <label htmlFor="postCode">Post Code</label>
                                <InputText
                                    id="postCode"
                                    value={editData.addresses[0].postCode || ""}
                                    onChange={(e) =>
                                        setEditData({
                                            ...editData,
                                            addresses: [
                                                {
                                                    ...editData.addresses[0],
                                                    postCode: e.target.value,
                                                },
                                            ],
                                        })
                                    }
                                />
                            </div>
                        </>
                    ) : (
                        <div>No address available</div>
                    )}
                </div>
            </TabPanel>
        </TabView>
    );
};

export default SiteEditForm;

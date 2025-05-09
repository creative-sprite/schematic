import React, { useState } from "react";
import { TabView, TabPanel } from "primereact/tabview";
import { InputText } from "primereact/inputtext";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Checkbox } from "primereact/checkbox";

const ChainEditForm = ({ editData, setEditData }) => {
    const [activeTab, setActiveTab] = useState(0);
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
        const updatedEmails = [...(editData.chainEmails || [])];
        if (newEmail.isPrimary) {
            updatedEmails.forEach((email) => (email.isPrimary = false));
        } else if (updatedEmails.length === 0) {
            newEmail.isPrimary = true;
        }
        updatedEmails.push({ ...newEmail });
        setEditData({ ...editData, chainEmails: updatedEmails });
        setNewEmail({ email: "", location: "", isPrimary: false });
    };

    const handleRemoveEmail = (index) => {
        const updatedEmails = [...(editData.chainEmails || [])];
        const wasPrimary = updatedEmails[index].isPrimary;
        updatedEmails.splice(index, 1);
        if (wasPrimary && updatedEmails.length > 0) {
            updatedEmails[0].isPrimary = true;
        }
        setEditData({ ...editData, chainEmails: updatedEmails });
    };

    const handleSetEmailPrimary = (index) => {
        const updatedEmails = [...(editData.chainEmails || [])];
        updatedEmails.forEach((email) => (email.isPrimary = false));
        updatedEmails[index].isPrimary = true;
        setEditData({ ...editData, chainEmails: updatedEmails });
    };

    // Phone Handlers
    const handleAddPhone = () => {
        if (!newPhone.phoneNumber.trim()) return;
        const updatedPhones = [...(editData.chainPhoneNumbers || [])];
        if (newPhone.isPrimary) {
            updatedPhones.forEach((phone) => (phone.isPrimary = false));
        } else if (updatedPhones.length === 0) {
            newPhone.isPrimary = true;
        }
        updatedPhones.push({ ...newPhone });
        setEditData({ ...editData, chainPhoneNumbers: updatedPhones });
        setNewPhone({
            phoneNumber: "",
            location: "",
            extension: "",
            isPrimary: false,
        });
    };

    const handleRemovePhone = (index) => {
        const updatedPhones = [...(editData.chainPhoneNumbers || [])];
        const wasPrimary = updatedPhones[index].isPrimary;
        updatedPhones.splice(index, 1);
        if (wasPrimary && updatedPhones.length > 0) {
            updatedPhones[0].isPrimary = true;
        }
        setEditData({ ...editData, chainPhoneNumbers: updatedPhones });
    };

    const handleSetPhonePrimary = (index) => {
        const updatedPhones = [...(editData.chainPhoneNumbers || [])];
        updatedPhones.forEach((phone) => (phone.isPrimary = false));
        updatedPhones[index].isPrimary = true;
        setEditData({ ...editData, chainPhoneNumbers: updatedPhones });
    };

    return (
        <TabView
            activeIndex={activeTab}
            onTabChange={(e) => setActiveTab(e.index)}
        >
            <TabPanel header="Basic Info">
                <div className="p-fluid">
                    <div className="p-field" style={{ marginBottom: "1rem" }}>
                        <label htmlFor="chainName">Chain Name *</label>
                        <InputText
                            id="chainName"
                            value={editData.chainName || ""}
                            onChange={(e) =>
                                setEditData({
                                    ...editData,
                                    chainName: e.target.value,
                                })
                            }
                            required
                        />
                    </div>
                    <div className="p-field" style={{ marginBottom: "1rem" }}>
                        <label htmlFor="chainWebsite">Website</label>
                        <InputText
                            id="chainWebsite"
                            value={editData.chainWebsite || ""}
                            onChange={(e) =>
                                setEditData({
                                    ...editData,
                                    chainWebsite: e.target.value,
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
                        {editData.chainEmails &&
                            editData.chainEmails.map((email, index) => (
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
                        {editData.chainPhoneNumbers &&
                            editData.chainPhoneNumbers.map((phone, index) => (
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
                        <label htmlFor="chainAddressNameNumber">
                            Building Name/Number
                        </label>
                        <InputText
                            id="chainAddressNameNumber"
                            value={editData.chainAddressNameNumber || ""}
                            onChange={(e) =>
                                setEditData({
                                    ...editData,
                                    chainAddressNameNumber: e.target.value,
                                })
                            }
                        />
                    </div>
                    <div className="p-field" style={{ marginBottom: "1rem" }}>
                        <label htmlFor="chainAddressLine1">
                            Address Line 1
                        </label>
                        <InputText
                            id="chainAddressLine1"
                            value={editData.chainAddressLine1 || ""}
                            onChange={(e) =>
                                setEditData({
                                    ...editData,
                                    chainAddressLine1: e.target.value,
                                })
                            }
                        />
                    </div>
                    <div className="p-field" style={{ marginBottom: "1rem" }}>
                        <label htmlFor="chainAddressLine2">
                            Address Line 2
                        </label>
                        <InputText
                            id="chainAddressLine2"
                            value={editData.chainAddressLine2 || ""}
                            onChange={(e) =>
                                setEditData({
                                    ...editData,
                                    chainAddressLine2: e.target.value,
                                })
                            }
                        />
                    </div>
                    <div className="p-field" style={{ marginBottom: "1rem" }}>
                        <label htmlFor="chainTown">Town</label>
                        <InputText
                            id="chainTown"
                            value={editData.chainTown || ""}
                            onChange={(e) =>
                                setEditData({
                                    ...editData,
                                    chainTown: e.target.value,
                                })
                            }
                        />
                    </div>
                    <div className="p-field" style={{ marginBottom: "1rem" }}>
                        <label htmlFor="chainCounty">County</label>
                        <InputText
                            id="chainCounty"
                            value={editData.chainCounty || ""}
                            onChange={(e) =>
                                setEditData({
                                    ...editData,
                                    chainCounty: e.target.value,
                                })
                            }
                        />
                    </div>
                    <div className="p-field" style={{ marginBottom: "1rem" }}>
                        <label htmlFor="chainCountry">Country</label>
                        <InputText
                            id="chainCountry"
                            value={editData.chainCountry || ""}
                            onChange={(e) =>
                                setEditData({
                                    ...editData,
                                    chainCountry: e.target.value,
                                })
                            }
                        />
                    </div>
                    <div className="p-field" style={{ marginBottom: "1rem" }}>
                        <label htmlFor="chainPostCode">Post Code</label>
                        <InputText
                            id="chainPostCode"
                            value={editData.chainPostCode || ""}
                            onChange={(e) =>
                                setEditData({
                                    ...editData,
                                    chainPostCode: e.target.value,
                                })
                            }
                        />
                    </div>
                </div>
            </TabPanel>
        </TabView>
    );
};

export default ChainEditForm;

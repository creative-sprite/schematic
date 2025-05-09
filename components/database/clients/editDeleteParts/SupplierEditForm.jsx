import React, { useState } from "react";
import { TabView, TabPanel } from "primereact/tabview";
import { InputText } from "primereact/inputtext";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Checkbox } from "primereact/checkbox";

const SupplierEditForm = ({ editData, setEditData }) => {
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

    // Handler for adding a new email
    const handleAddEmail = () => {
        if (!newEmail.email.trim()) return;
        const updatedEmails = [...(editData.supplierEmails || [])];
        if (newEmail.isPrimary) {
            updatedEmails.forEach((email) => (email.isPrimary = false));
        } else if (updatedEmails.length === 0) {
            newEmail.isPrimary = true;
        }
        updatedEmails.push({ ...newEmail });
        setEditData({ ...editData, supplierEmails: updatedEmails });
        setNewEmail({ email: "", location: "", isPrimary: false });
    };

    // Handler for removing an email
    const handleRemoveEmail = (index) => {
        const updatedEmails = [...(editData.supplierEmails || [])];
        const wasRemovingPrimary = updatedEmails[index].isPrimary;
        updatedEmails.splice(index, 1);
        if (wasRemovingPrimary && updatedEmails.length > 0) {
            updatedEmails[0].isPrimary = true;
        }
        setEditData({ ...editData, supplierEmails: updatedEmails });
    };

    // Handler for setting an email as primary
    const handleSetEmailPrimary = (index) => {
        const updatedEmails = [...(editData.supplierEmails || [])];
        updatedEmails.forEach((email) => (email.isPrimary = false));
        updatedEmails[index].isPrimary = true;
        setEditData({ ...editData, supplierEmails: updatedEmails });
    };

    // Handler for adding a new phone number
    const handleAddPhone = () => {
        if (!newPhone.phoneNumber.trim()) return;
        const updatedPhones = [...(editData.supplierPhoneNumbers || [])];
        if (newPhone.isPrimary) {
            updatedPhones.forEach((phone) => (phone.isPrimary = false));
        } else if (updatedPhones.length === 0) {
            newPhone.isPrimary = true;
        }
        updatedPhones.push({ ...newPhone });
        setEditData({ ...editData, supplierPhoneNumbers: updatedPhones });
        setNewPhone({
            phoneNumber: "",
            location: "",
            extension: "",
            isPrimary: false,
        });
    };

    // Handler for removing a phone number
    const handleRemovePhone = (index) => {
        const updatedPhones = [...(editData.supplierPhoneNumbers || [])];
        const wasRemovingPrimary = updatedPhones[index].isPrimary;
        updatedPhones.splice(index, 1);
        if (wasRemovingPrimary && updatedPhones.length > 0) {
            updatedPhones[0].isPrimary = true;
        }
        setEditData({ ...editData, supplierPhoneNumbers: updatedPhones });
    };

    // Handler for setting a phone number as primary
    const handleSetPhonePrimary = (index) => {
        const updatedPhones = [...(editData.supplierPhoneNumbers || [])];
        updatedPhones.forEach((phone) => (phone.isPrimary = false));
        updatedPhones[index].isPrimary = true;
        setEditData({ ...editData, supplierPhoneNumbers: updatedPhones });
    };

    return (
        <TabView
            activeIndex={activeTab}
            onTabChange={(e) => setActiveTab(e.index)}
        >
            <TabPanel header="Basic Info">
                <div className="p-fluid">
                    <div className="p-field" style={{ marginBottom: "1rem" }}>
                        <label htmlFor="supplierName">Supplier Name *</label>
                        <InputText
                            id="supplierName"
                            value={editData.supplierName || ""}
                            onChange={(e) =>
                                setEditData({
                                    ...editData,
                                    supplierName: e.target.value,
                                })
                            }
                            required
                        />
                    </div>
                    <div className="p-field" style={{ marginBottom: "1rem" }}>
                        <label htmlFor="supplierWebsite">Website</label>
                        <InputText
                            id="supplierWebsite"
                            value={editData.supplierWebsite || ""}
                            onChange={(e) =>
                                setEditData({
                                    ...editData,
                                    supplierWebsite: e.target.value,
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
                            placeholder="Location (e.g., Office, Support)"
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
                        {editData.supplierEmails &&
                            editData.supplierEmails.map((email, index) => (
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
                            placeholder="Location (e.g., Main, Support)"
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
                        {editData.supplierPhoneNumbers &&
                            editData.supplierPhoneNumbers.map(
                                (phone, index) => (
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
                                            style={{
                                                flex: "2",
                                                minWidth: "200px",
                                            }}
                                        >
                                            {phone.phoneNumber}
                                        </div>
                                        <div
                                            style={{
                                                flex: "2",
                                                minWidth: "200px",
                                            }}
                                        >
                                            {phone.location}
                                        </div>
                                        <div
                                            style={{
                                                flex: "1",
                                                minWidth: "120px",
                                            }}
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
                                                        handleSetPhonePrimary(
                                                            index
                                                        )
                                                    }
                                                />
                                            )}
                                        </div>
                                        <Button
                                            icon="pi pi-trash"
                                            className="p-button-danger p-button-text p-button-sm"
                                            onClick={() =>
                                                handleRemovePhone(index)
                                            }
                                        />
                                    </div>
                                )
                            )}
                    </div>
                </Card>
            </TabPanel>

            <TabPanel header="Address">
                <div className="p-fluid">
                    <div className="p-field" style={{ marginBottom: "1rem" }}>
                        <label htmlFor="addressNameNumber">
                            Building Name/Number
                        </label>
                        <InputText
                            id="addressNameNumber"
                            value={editData.addressNameNumber || ""}
                            onChange={(e) =>
                                setEditData({
                                    ...editData,
                                    addressNameNumber: e.target.value,
                                })
                            }
                        />
                    </div>
                    <div className="p-field" style={{ marginBottom: "1rem" }}>
                        <label htmlFor="addressLine1">Address Line 1</label>
                        <InputText
                            id="addressLine1"
                            value={editData.addressLine1 || ""}
                            onChange={(e) =>
                                setEditData({
                                    ...editData,
                                    addressLine1: e.target.value,
                                })
                            }
                        />
                    </div>
                    <div className="p-field" style={{ marginBottom: "1rem" }}>
                        <label htmlFor="addressLine2">Address Line 2</label>
                        <InputText
                            id="addressLine2"
                            value={editData.addressLine2 || ""}
                            onChange={(e) =>
                                setEditData({
                                    ...editData,
                                    addressLine2: e.target.value,
                                })
                            }
                        />
                    </div>
                    <div className="p-field" style={{ marginBottom: "1rem" }}>
                        <label htmlFor="town">Town</label>
                        <InputText
                            id="town"
                            value={editData.town || ""}
                            onChange={(e) =>
                                setEditData({
                                    ...editData,
                                    town: e.target.value,
                                })
                            }
                        />
                    </div>
                    <div className="p-field" style={{ marginBottom: "1rem" }}>
                        <label htmlFor="county">County</label>
                        <InputText
                            id="county"
                            value={editData.county || ""}
                            onChange={(e) =>
                                setEditData({
                                    ...editData,
                                    county: e.target.value,
                                })
                            }
                        />
                    </div>
                    <div className="p-field" style={{ marginBottom: "1rem" }}>
                        <label htmlFor="country">Country</label>
                        <InputText
                            id="country"
                            value={editData.country || ""}
                            onChange={(e) =>
                                setEditData({
                                    ...editData,
                                    country: e.target.value,
                                })
                            }
                        />
                    </div>
                    <div className="p-field" style={{ marginBottom: "1rem" }}>
                        <label htmlFor="postCode">Post Code</label>
                        <InputText
                            id="postCode"
                            value={editData.postCode || ""}
                            onChange={(e) =>
                                setEditData({
                                    ...editData,
                                    postCode: e.target.value,
                                })
                            }
                        />
                    </div>
                </div>
            </TabPanel>
        </TabView>
    );
};

export default SupplierEditForm;

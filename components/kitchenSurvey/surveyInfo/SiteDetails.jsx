// components\kitchenSurvey\surveyInfo\SiteDetails.jsx

"use client";
import React, { useState, useRef, useEffect } from "react";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import SiteSelect from "./SiteSelect"; // Adjust path if necessary

export default function SiteDetails({ siteDetails, setSiteDetails }) {
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    // CRITICAL FIX: Instead of using TabView, use a simple tab state
    const [activeTab, setActiveTab] = useState("existing"); // "existing" or "new"
    const toast = useRef(null);

    // Ensure there's at least one address object in siteDetails.addresses.
    const currentAddress =
        siteDetails.addresses && siteDetails.addresses.length > 0
            ? siteDetails.addresses[0]
            : {
                  addressNameNumber: "",
                  addressLine1: "",
                  addressLine2: "",
                  town: "",
                  county: "",
                  country: "",
                  postCode: "",
              };

    // Handler for updating address fields.
    const handleAddressChange = (field, value) => {
        const newAddress = { ...currentAddress, [field]: value };
        setSiteDetails({ ...siteDetails, addresses: [newAddress] });
    };

    // Handler for adding/updating a site
    const handleSaveSite = async () => {
        // Validate required fields
        if (!siteDetails.siteName || !currentAddress.addressLine1) {
            toast.current.show({
                severity: "error",
                summary: "Validation Error",
                detail: "Site Name and Address Line 1 are required",
            });
            return;
        }

        setIsSaving(true);
        try {
            // Prepare site data
            const siteData = {
                siteName: siteDetails.siteName,
                siteEmails: siteDetails.siteEmails || [],
                siteWebsite: siteDetails.siteWebsite || "",
                siteContactNumbersMobile:
                    siteDetails.siteContactNumbersMobile || [],
                siteContactNumbersLand:
                    siteDetails.siteContactNumbersLand || [],
                addresses: [currentAddress],
                siteType: siteDetails.siteType || "",
                clientType: siteDetails.clientType || "",
            };

            let response;

            if (siteDetails._id) {
                // Update existing site
                response = await fetch(
                    `/api/database/clients/sites/${siteDetails._id}`,
                    {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(siteData),
                    }
                );
            } else {
                // Create new site
                const apiPath = `/api/database/clients/sites`;
                console.log(`Attempting to create site at: ${apiPath}`);

                response = await fetch(apiPath, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                    body: JSON.stringify(siteData),
                });
            }

            let result;
            try {
                const responseText = await response.text();
                result = JSON.parse(responseText);
            } catch (parseError) {
                console.error("Error parsing response:", parseError);
                throw new Error(
                    `Invalid response from server: ${await response.text()}`
                );
            }

            if (!response.ok) {
                throw new Error(result.error || "Failed to save site");
            }

            // Update state with saved site (including _id)
            setSiteDetails(result.data);

            toast.current.show({
                severity: "success",
                summary: "Success",
                detail: siteDetails._id
                    ? "Site updated successfully"
                    : "Site added successfully",
            });

            // Exit edit mode
            setIsEditing(false);
        } catch (error) {
            console.error("Error saving site:", error);
            toast.current.show({
                severity: "error",
                summary: "Error",
                detail: error.message,
            });
        } finally {
            setIsSaving(false);
        }
    };

    // Render a formatted card for the site details
    const renderSiteDetailsCard = () => {
        return (
            <Card
                style={{
                    marginTop: "1rem",
                    textAlign: "left",
                }}
            >
                <div
                    style={{
                        fontWeight: "bold",
                        fontSize: "1.2rem",
                        marginBottom: "0.5rem",
                    }}
                >
                    {siteDetails.siteName}
                </div>
                <div style={{ marginBottom: "0.5rem" }}>
                    {currentAddress.addressNameNumber}
                </div>
                <div style={{ marginBottom: "0.5rem" }}>
                    {currentAddress.addressLine1}
                </div>
                {currentAddress.addressLine2 && (
                    <div style={{ marginBottom: "0.5rem" }}>
                        {currentAddress.addressLine2}
                    </div>
                )}
                <div>
                    {currentAddress.town && `${currentAddress.town}, `}
                    {currentAddress.county && `${currentAddress.county}, `}
                    {currentAddress.country && `${currentAddress.country}, `}
                    {currentAddress.postCode}
                </div>

                {siteDetails.siteWebsite && (
                    <div style={{ marginTop: "1rem" }}>
                        <strong>Website:</strong> {siteDetails.siteWebsite}
                    </div>
                )}

                {siteDetails.siteEmails &&
                    siteDetails.siteEmails.length > 0 && (
                        <div>
                            <strong>Email:</strong>{" "}
                            {siteDetails.siteEmails.join(", ")}
                        </div>
                    )}

                {siteDetails.siteContactNumbersMobile &&
                    siteDetails.siteContactNumbersMobile.length > 0 && (
                        <div>
                            <strong>Mobile:</strong>{" "}
                            {siteDetails.siteContactNumbersMobile.join(", ")}
                        </div>
                    )}

                {siteDetails.siteContactNumbersLand &&
                    siteDetails.siteContactNumbersLand.length > 0 && (
                        <div>
                            <strong>Landline:</strong>{" "}
                            {siteDetails.siteContactNumbersLand.join(", ")}
                        </div>
                    )}

                {siteDetails.siteType && (
                    <div>
                        <strong>Site Type:</strong> {siteDetails.siteType}
                    </div>
                )}

                {siteDetails.clientType && (
                    <div>
                        <strong>Client Type:</strong> {siteDetails.clientType}
                    </div>
                )}
                {/* <span>Site Details</span> */}
                <Button
                    icon="pi pi-pencil"
                    className="p-button-text p-button-rounded"
                    onClick={() => setIsEditing(true)}
                    style={{ marginTop: "1rem" }}
                />
            </Card>
        );
    };

    // Render input fields for entering site information
    const renderSiteInputs = () => {
        return (
            <div>
                <div
                    style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "30px",
                        marginTop: "1rem",
                    }}
                >
                    <InputText
                        value={siteDetails.siteName || ""}
                        onChange={(e) =>
                            setSiteDetails({
                                ...siteDetails,
                                siteName: e.target.value,
                            })
                        }
                        placeholder="Site Name"
                        style={{ minWidth: "250px", height: "40px" }}
                    />
                    <InputText
                        value={currentAddress.addressNameNumber || ""}
                        placeholder="Building Name / Number"
                        onChange={(e) =>
                            handleAddressChange(
                                "addressNameNumber",
                                e.target.value
                            )
                        }
                        style={{ minWidth: "250px", height: "40px" }}
                    />
                    <InputText
                        value={currentAddress.addressLine1 || ""}
                        placeholder="Address Line 1"
                        onChange={(e) =>
                            handleAddressChange("addressLine1", e.target.value)
                        }
                        style={{ flex: "1 1 100%" }}
                    />
                    <InputText
                        value={currentAddress.addressLine2 || ""}
                        placeholder="Address Line 2"
                        onChange={(e) =>
                            handleAddressChange("addressLine2", e.target.value)
                        }
                        style={{ flex: "1 1 100%" }}
                    />
                    <InputText
                        value={currentAddress.town || ""}
                        placeholder="Town"
                        onChange={(e) =>
                            handleAddressChange("town", e.target.value)
                        }
                        style={{ minWidth: "250px", height: "40px" }}
                    />
                    <InputText
                        value={currentAddress.county || ""}
                        placeholder="County"
                        onChange={(e) =>
                            handleAddressChange("county", e.target.value)
                        }
                        style={{ minWidth: "250px", height: "40px" }}
                    />
                    <InputText
                        value={currentAddress.country || ""}
                        placeholder="Country"
                        onChange={(e) =>
                            handleAddressChange("country", e.target.value)
                        }
                        style={{ minWidth: "250px", height: "40px" }}
                    />
                    <InputText
                        value={currentAddress.postCode || ""}
                        placeholder="Postcode"
                        onChange={(e) =>
                            handleAddressChange("postCode", e.target.value)
                        }
                        style={{ minWidth: "250px", height: "40px" }}
                    />
                </div>

                <div
                    style={{
                        marginTop: "1rem",
                        display: "flex",
                        justifyContent: "flex-end",
                    }}
                >
                    {isEditing && (
                        <Button
                            label="Cancel"
                            className="p-button-outlined p-button-secondary"
                            onClick={() => setIsEditing(false)}
                            style={{ marginRight: "0.5rem" }}
                        />
                    )}
                    <Button
                        label={siteDetails._id ? "Update Site" : "Add Site"}
                        loading={isSaving}
                        onClick={handleSaveSite}
                    />
                </div>
            </div>
        );
    };

    // CRITICAL FIX: Custom tab header component that doesn't use TabView
    const renderTabHeaders = () => {
        return (
            <div
                style={{
                    display: "flex",
                    borderBottom: "1px solid #dee2e6",
                    marginBottom: "1rem",
                }}
            >
                <div
                    onClick={() => setActiveTab("existing")}
                    style={{
                        padding: "1rem 1.5rem",
                        cursor: "pointer",
                        fontWeight:
                            activeTab === "existing" ? "bold" : "normal",
                        borderBottom:
                            activeTab === "existing"
                                ? "2px solid #3B82F6"
                                : "none",
                    }}
                >
                    Existing Site
                </div>
                <div
                    onClick={() => setActiveTab("new")}
                    style={{
                        padding: "1rem 1.5rem",
                        cursor: "pointer",
                        fontWeight: activeTab === "new" ? "bold" : "normal",
                        borderBottom:
                            activeTab === "new" ? "2px solid #3B82F6" : "none",
                    }}
                >
                    New Site
                </div>
            </div>
        );
    };

    return (
        <div
            style={{
                marginBottom: "3rem",
                border: "3px solid #ddd",
                padding: "1rem",
            }}
        >
            <Toast ref={toast} />
            <h2>Site Details</h2>

            {/* If we have a site and not editing, show the site details card */}
            {siteDetails._id && !isEditing ? (
                renderSiteDetailsCard()
            ) : (
                // CRITICAL FIX: Replace TabView with custom tabs implementation
                <>
                    {renderTabHeaders()}

                    {activeTab === "existing" && (
                        <div>
                            <SiteSelect
                                onSiteSelect={(site) => {
                                    setSiteDetails(site);
                                    setIsEditing(false);
                                }}
                            />
                        </div>
                    )}

                    {activeTab === "new" && renderSiteInputs()}
                </>
            )}

            {/* When editing an existing site */}
            {siteDetails._id && isEditing && renderSiteInputs()}
        </div>
    );
}

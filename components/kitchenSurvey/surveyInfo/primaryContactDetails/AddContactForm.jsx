// components/kitchenSurvey/surveyInfo/primaryContactDetails/AddContactForm.jsx
import React from "react";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";

export default function AddContactForm({
    contactInput,
    setContactInput,
    handleAddContact,
    isSaving,
    siteDetails,
}) {
    const flexContainerStyle = {
        display: "flex",
        flexWrap: "wrap",
        gap: "1rem",
        marginBottom: "1rem",
    };

    // Helper function to check if field has data
    const fieldHasData = (value) => {
        if (value === null || value === undefined) return false;
        if (typeof value === "string") return value.trim() !== "";
        return true;
    };

    return (
        <form noValidate onSubmit={handleAddContact}>
            <div style={flexContainerStyle}>
                <InputText
                    placeholder="First Name"
                    value={contactInput.contactFirstName || ""}
                    onChange={(e) =>
                        setContactInput({
                            ...contactInput,
                            contactFirstName: e.target.value,
                        })
                    }
                    style={{
                        flex: "1 1 200px",
                        minWidth: "200px",
                        borderColor: fieldHasData(contactInput.contactFirstName)
                            ? "var(--primary-color)"
                            : "",
                    }}
                    disabled={!siteDetails || !siteDetails._id || isSaving}
                />
                <InputText
                    placeholder="Surname"
                    value={contactInput.contactLastName || ""}
                    onChange={(e) =>
                        setContactInput({
                            ...contactInput,
                            contactLastName: e.target.value,
                        })
                    }
                    style={{
                        flex: "1 1 200px",
                        minWidth: "200px",
                        borderColor: fieldHasData(contactInput.contactLastName)
                            ? "var(--primary-color)"
                            : "",
                    }}
                    disabled={!siteDetails || !siteDetails._id || isSaving}
                />
                <InputText
                    placeholder="Position"
                    value={contactInput.position || ""}
                    onChange={(e) =>
                        setContactInput({
                            ...contactInput,
                            position: e.target.value,
                        })
                    }
                    style={{
                        flex: "1 1 200px",
                        minWidth: "200px",
                        borderColor: fieldHasData(contactInput.position)
                            ? "var(--primary-color)"
                            : "",
                    }}
                    disabled={!siteDetails || !siteDetails._id || isSaving}
                />
                <InputText
                    placeholder="Contact Number"
                    value={contactInput.number || ""}
                    onChange={(e) =>
                        setContactInput({
                            ...contactInput,
                            number: e.target.value,
                        })
                    }
                    style={{
                        flex: "1 1 200px",
                        minWidth: "200px",
                        borderColor: fieldHasData(contactInput.number)
                            ? "var(--primary-color)"
                            : "",
                    }}
                    disabled={!siteDetails || !siteDetails._id || isSaving}
                />
                <InputText
                    placeholder="Email"
                    value={contactInput.email || ""}
                    onChange={(e) =>
                        setContactInput({
                            ...contactInput,
                            email: e.target.value,
                        })
                    }
                    style={{
                        flex: "1 1 200px",
                        minWidth: "200px",
                        borderColor: fieldHasData(contactInput.email)
                            ? "var(--primary-color)"
                            : "",
                    }}
                    disabled={!siteDetails || !siteDetails._id || isSaving}
                />
                <Button
                    label="Add Contact"
                    type="submit"
                    loading={isSaving}
                    style={{ flex: "1 1 200px", minWidth: "150px" }}
                    disabled={!siteDetails || !siteDetails._id || isSaving}
                />
            </div>
        </form>
    );
}
